import { Router, Request, Response } from "express";
import multer from "multer";
import { z } from "zod/v4";
import { PrismaClient } from "../generated/prisma/client.ts";
import { generateSecureToken, encryptField, decryptField } from "../utils/digitalContractSecurity.ts";
import { storeScannedPdf, isPdfFile, storeFinalizedPdf } from "../services/digitalContractPdfService.ts";
import { generateContractId, generateAbbreviation } from "../utils/contractIdGenerator.ts";

const router = Router();
const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

const storage = multer.memoryStorage();
const pdfUpload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

const createContractSchema = z.object({
  title: z.string().min(1).max(300),
  templateId: z.string().min(1),
  contractType: z.enum(["Client", "Staff"]),
  category: z.string().min(1).max(50),
  partyName: z.string().min(1).max(200).optional(),
  clientAbbreviation: z.string().max(10).optional(), // User override for abbreviation
  forceNumber: z.string().max(50).optional(), // For staff contracts
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  valueUgx: z.number().int().nonnegative().optional(),
  filledFields: z.record(z.string(), z.unknown()).optional().default({}),
  signers: z.array(z.object({
    signerName: z.string().min(1).max(200),
    signerTitle: z.string().max(200).optional(),
    signerEmail: z.string().email().optional(),
    signingOrder: z.number().int().positive(),
  })).min(1).max(10),
});

const updateContractSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  partyName: z.string().min(1).max(200).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  valueUgx: z.number().int().nonnegative().optional(),
  filledFields: z.record(z.string(), z.unknown()).optional(),
});

// ── POST / ── Create contract from template
router.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = createContractSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    const template = await prisma.pdfContractTemplate.findUnique({ where: { id: parsed.data.templateId } });
    if (!template) { res.status(404).json({ error: "Template not found" }); return; }

    const user = (req as any).user;

    // Generate contract ID based on type
    const contractType = parsed.data.contractType;
    let contractId: string;

    if (contractType === "Client") {
      const companyName = parsed.data.partyName || "Unknown";
      contractId = await generateContractId("client", {
        companyName,
        abbreviation: parsed.data.clientAbbreviation,
      });
    } else {
      // Staff contract
      const forceNumber = parsed.data.forceNumber || "UNKNOWN";
      contractId = await generateContractId("staff", { forceNumber });
    }

    const result = await prisma.$transaction(async (tx) => {
      const contract = await tx.digitalContract.create({
        data: {
          contractId,
          contractType,
          title: parsed.data.title,
          category: parsed.data.category,
          templateId: parsed.data.templateId,
          partyName: parsed.data.partyName,
          clientAbbreviation: parsed.data.clientAbbreviation || (contractType === "Client" ? generateAbbreviation(parsed.data.partyName || "") : null),
          forceNumber: parsed.data.forceNumber,
          startDate: parsed.data.startDate || new Date(),
          endDate: parsed.data.endDate || new Date(Date.now() + 365 * 86400000),
          valueUgx: parsed.data.valueUgx,
          filledFields: parsed.data.filledFields as any,
          signingOrder: [],
          status: "Draft",
          createdBy: user?.userId || "system",
        },
      });

      const signers = await Promise.all(
        parsed.data.signers.map((s) => {
          const secureToken = generateSecureToken();
          const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
          return tx.digitalContractSigner.create({
            data: {
              contractId: contract.id,
              signerName: s.signerName,
              signerTitle: s.signerTitle,
              signerEmail: s.signerEmail ? encryptField(s.signerEmail) : null,
              signingOrder: s.signingOrder,
              secureToken,
              expiresAt,
            },
          });
        })
      );

      const signingOrder = signers.map((s) => s.id);
      await tx.digitalContract.update({ where: { id: contract.id }, data: { signingOrder } });

      await tx.auditLog.create({
        data: {
          timestamp: new Date(),
          userName: user?.userId || "system",
          userRole: user?.role || "unknown",
          action: "Digital Contract Created",
          module: "Documents",
          details: `Contract '${contract.title}' (${contract.contractId}) type: ${contractType} with ${signers.length} signers`,
        },
      });

      return { contract, signers };
    });

    res.status(201).json({
      success: true,
      contract: result.contract,
      signers: result.signers.map((s) => ({
        id: s.id, signerName: s.signerName, signerTitle: s.signerTitle,
        signingOrder: s.signingOrder, secureToken: s.secureToken, expiresAt: s.expiresAt,
      })),
    });
  } catch (err) {
    console.error("Create contract failed:", err);
    res.status(500).json({ error: "Failed to create contract" });
  }
});

// ── GET / ── List contracts
router.get("/", async (req: Request, res: Response) => {
  try {
    const { category, status, search, contractType } = req.query;
    const where: any = {};
    if (category) where.category = String(category);
    if (status) where.status = String(status);
    if (contractType) where.contractType = String(contractType);
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
        { contractId: { contains: String(search), mode: "insensitive" } },
        { partyName: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const contracts = await prisma.digitalContract.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        template: { select: { id: true, name: true, category: true } },
        signers: {
          select: { id: true, signerName: true, signerTitle: true, signingOrder: true, isCompleted: true, signedAt: true },
          orderBy: { signingOrder: "asc" as const },
        },
      },
    });

    res.json({ success: true, data: contracts });
  } catch (err) {
    console.error("List contracts failed:", err);
    res.status(500).json({ error: "Failed to list contracts" });
  }
});

// ── GET /:id ── Get contract details
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const contract = await prisma.digitalContract.findUnique({
      where: { id: req.params.id },
      include: {
        template: true,
        signers: { orderBy: { signingOrder: "asc" } },
        auditLogs: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!contract) { res.status(404).json({ error: "Contract not found" }); return; }

    const signers = contract.signers.map((s) => ({
      ...s,
      signerEmail: s.signerEmail ? (() => { try { return decryptField(s.signerEmail); } catch { return s.signerEmail; } })() : null,
    }));

    res.json({ success: true, data: { ...contract, signers } });
  } catch (err) {
    console.error("Get contract failed:", err);
    res.status(500).json({ error: "Failed to get contract" });
  }
});

// ── PUT /:id ── Update contract fields
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const existing = await prisma.digitalContract.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: "Contract not found" }); return; }
    if (existing.status !== "Draft") {
      res.status(400).json({ error: "Can only edit contracts in Draft status" }); return;
    }

    const parsed = updateContractSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues }); return;
    }

    const updated = await prisma.digitalContract.update({
      where: { id: req.params.id },
      data: parsed.data as any,
    });

    res.json({ success: true, contract: updated });
  } catch (err) {
    console.error("Update contract failed:", err);
    res.status(500).json({ error: "Failed to update contract" });
  }
});

// ── POST /:id/approve ── GM approves contract content (Client Contracts only)
router.post("/:id/approve", async (req: Request, res: Response) => {
  try {
    const contract = await prisma.digitalContract.findUnique({
      where: { id: req.params.id },
      include: { signers: { orderBy: { signingOrder: "asc" } } },
    });
    if (!contract) { res.status(404).json({ error: "Contract not found" }); return; }
    if (contract.contractType !== "Client") {
      res.status(400).json({ error: "Only Client Contracts require approval" }); return;
    }
    if (contract.status !== "Draft") {
      res.status(400).json({ error: "Contract must be in Draft status to approve" }); return;
    }

    const user = (req as any).user;

    const updated = await prisma.digitalContract.update({
      where: { id: req.params.id },
      data: { status: "PendingSigning" },
    });

    await prisma.digitalContractAudit.create({
      data: {
        contractId: contract.id,
        eventType: "Approved",
        description: `Contract content approved by ${user?.userId || "system"}`,
        performedBy: user?.userId || "system",
      },
    });

    res.json({ success: true, contract: updated });
  } catch (err) {
    console.error("Approve contract failed:", err);
    res.status(500).json({ error: "Failed to approve contract" });
  }
});

// ── POST /:id/send-for-signing ── Initiate signing workflow (internal + external)
router.post("/:id/send-for-signing", async (req: Request, res: Response) => {
  try {
    const contract = await prisma.digitalContract.findUnique({
      where: { id: req.params.id },
      include: { signers: { orderBy: { signingOrder: "asc" } }, template: true },
    });
    if (!contract) { res.status(404).json({ error: "Contract not found" }); return; }
    if (contract.status !== "PendingSigning" && contract.status !== "Draft") {
      res.status(400).json({ error: "Contract must be in Draft or PendingSigning status" }); return;
    }
    if (contract.signers.length === 0) {
      res.status(400).json({ error: "Contract must have at least one signer" }); return;
    }

    const user = (req as any).user;

    const updated = await prisma.digitalContract.update({
      where: { id: req.params.id },
      data: { status: "PendingSigning", currentSignerIndex: 0 },
    });

    await prisma.digitalContractAudit.create({
      data: {
        contractId: contract.id,
        eventType: "SentForSigning",
        description: `Signing workflow initiated for ${contract.signers.length} signers`,
        performedBy: user?.userId || "system",
      },
    });

    res.json({ success: true, contract: updated });
  } catch (err) {
    console.error("Send for signing failed:", err);
    res.status(500).json({ error: "Failed to send for signing" });
  }
});

// ── POST /:id/archive ── Archive contract
router.post("/:id/archive", async (req: Request, res: Response) => {
  try {
    const contract = await prisma.digitalContract.findUnique({ where: { id: req.params.id } });
    if (!contract) { res.status(404).json({ error: "Contract not found" }); return; }

    const user = (req as any).user;
    await prisma.digitalContract.update({
      where: { id: req.params.id },
      data: { isArchived: true, archivedAt: new Date(), status: "Archived" },
    });

    await prisma.digitalContractAudit.create({
      data: {
        contractId: contract.id,
        eventType: "Archived",
        performedBy: user?.userId || "system",
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Archive contract failed:", err);
    res.status(500).json({ error: "Failed to archive contract" });
  }
});

// ── POST /scan-upload ── Upload scanned old contract
router.post("/scan-upload", pdfUpload.single("pdf"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "PDF file is required" }); return; }
    if (!isPdfFile(req.file.buffer)) { res.status(400).json({ error: "Not a valid PDF" }); return; }

    const body = {
      title: req.body.title,
      category: req.body.category,
      partyName: req.body.partyName,
      clientAbbreviation: req.body.clientAbbreviation,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      valueUgx: req.body.valueUgx ? Number(req.body.valueUgx) : undefined,
    };

    const user = (req as any).user;

    // Generate scanned contract ID
    const companyName = body.partyName || "Unknown";
    const contractId = await generateContractId("scanned", {
      companyName,
      abbreviation: body.clientAbbreviation,
    });

    const contract = await prisma.digitalContract.create({
      data: {
        contractId,
        contractType: "Scanned",
        title: body.title,
        category: body.category || "Custom",
        templateId: "scanned",
        partyName: body.partyName,
        clientAbbreviation: body.clientAbbreviation || generateAbbreviation(companyName),
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        endDate: body.endDate ? new Date(body.endDate) : new Date(Date.now() + 365 * 86400000),
        valueUgx: body.valueUgx,
        filledFields: {},
        signingOrder: [],
        status: "FullySigned",
        isScanned: true,
        scannedPdfPath: storeScannedPdf("temp", req.file.buffer, req.file.originalname),
        scannedAt: new Date(),
        createdBy: user?.userId || "system",
      },
    });

    // Update scanned path with real contract ID
    await prisma.digitalContract.update({
      where: { id: contract.id },
      data: { scannedPdfPath: storeScannedPdf(contract.id, req.file.buffer, req.file.originalname) },
    });

    await prisma.auditLog.create({
      data: {
        timestamp: new Date(),
        userName: user?.userId || "system",
        userRole: user?.role || "unknown",
        action: "Scanned Contract Uploaded",
        module: "Documents",
        details: `Scanned contract '${contract.title}' (${contract.contractId})`,
      },
    });

    res.status(201).json({ success: true, contract });
  } catch (err) {
    console.error("Scan upload failed:", err);
    res.status(500).json({ error: "Failed to upload scanned contract" });
  }
});

// ── GET /:id/download ── Download finalized or scanned PDF
router.get("/:id/download", async (req: Request, res: Response) => {
  try {
    const contract = await prisma.digitalContract.findUnique({ where: { id: req.params.id } });
    if (!contract) { res.status(404).json({ error: "Contract not found" }); return; }

    const { getFinalizedPdfPath: getFinalPath, getScannedPdfPath: getScanPath } = await import("../services/digitalContractPdfService.ts");

    let filePath: string | null = null;
    if (contract.finalizedPdfPath) filePath = getFinalPath(contract.finalizedPdfPath);
    if (!filePath && contract.scannedPdfPath) filePath = getScanPath(contract.scannedPdfPath);

    if (!filePath) {
      res.status(400).json({ error: "PDF not available for this contract" }); return;
    }

    const safeTitle = contract.title.toLowerCase().replace(/[^a-z0-9]/gi, "_");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.pdf"`);
    const fs = await import("fs");
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error("Download contract PDF failed:", err);
    res.status(500).json({ error: "Failed to download PDF" });
  }
});

export default router;
