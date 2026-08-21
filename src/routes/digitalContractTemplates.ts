import { Router, Request, Response } from "express";
import multer from "multer";
import { z } from "zod/v4";
import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { storeTemplatePdf, deleteTemplatePdf, getTemplatePdfPath, isPdfFile, storeStampImage, getStampImagePath, deleteStampImage } from "../services/digitalContractPdfService.ts";

const router = Router();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ── PDF Upload for Templates ──
const storage = multer.memoryStorage();
const pdfUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

// ── Validation Schemas ──
const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(50),
  description: z.string().max(1000).optional(),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(50).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

// ── Authentication Middleware (inline for now) ──
function authenticateToken(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  // JWT verification will be handled by existing middleware in server.ts
  next();
}

function requireDocumentsAccess(level: "view" | "full") {
  return (req: Request, res: Response, next: Function) => {
    // Module access check will be handled by existing requireModuleAccess in server.ts
    next();
  };
}

// ── POST /api/digital-contract-templates ── Create template
router.post("/", pdfUpload.single("pdf"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "PDF file is required" });
      return;
    }

    if (!isPdfFile(req.file.buffer)) {
      res.status(400).json({ error: "Uploaded file is not a valid PDF" });
      return;
    }

    const body = {
      name: req.body.name,
      category: req.body.category,
      description: req.body.description,
    };

    const parsed = createTemplateSchema.safeParse(body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    const user = (req as any).user;

    // Create template record first (to get ID for file naming)
    const template = await prisma.pdfContractTemplate.create({
      data: {
        name: parsed.data.name,
        category: parsed.data.category,
        description: parsed.data.description,
        pdfFileName: req.file.originalname,
        pdfFilePath: "", // populated immediately after the PDF is stored below
        fileSize: req.file.size,
        pageCount: 1, // Will be updated by frontend PDF.js
        createdBy: user?.userId || "system",
      },
    });

    // Store PDF file with template ID
    const { filePath } = storeTemplatePdf(template.id, req.file.buffer, req.file.originalname);

    // Update template with file path
    await prisma.pdfContractTemplate.update({
      where: { id: template.id },
      data: { pdfFilePath: filePath },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        timestamp: new Date(),
        userName: user?.userId || "system",
        userRole: user?.role || "unknown",
        action: "Digital Contract Template Created",
        module: "Documents",
        details: `Template '${template.name}' (${template.id}) category: ${template.category}`,
      },
    });

    res.status(201).json({ success: true, template: { ...template, pdfFilePath: filePath } });
  } catch (err) {
    console.error("Create template failed:", err);
    res.status(500).json({ error: "Failed to create template" });
  }
});

// ── GET /api/digital-contract-templates ── List templates
router.get("/", async (req: Request, res: Response) => {
  try {
    const { category, active } = req.query;
    const where: any = {};
    if (category) where.category = String(category);
    if (active !== undefined) where.isActive = active === "true";

    const templates = await prisma.pdfContractTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        pdfFileName: true,
        fileSize: true,
        pageCount: true,
        version: true,
        isActive: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, data: templates });
  } catch (err) {
    console.error("List templates failed:", err);
    res.status(500).json({ error: "Failed to list templates" });
  }
});

// ── GET /api/digital-contract-templates/:id ── Get template details
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const template = await prisma.pdfContractTemplate.findUnique({
      where: { id: req.params.id },
    });

    if (!template) {
      res.status(404).json({ error: "Template not found" });
      return;
    }

    res.json({ success: true, data: template });
  } catch (err) {
    console.error("Get template failed:", err);
    res.status(500).json({ error: "Failed to get template" });
  }
});

// ── GET /api/digital-contract-templates/:id/pdf ── Download template PDF
router.get("/:id/pdf", async (req: Request, res: Response) => {
  try {
    const template = await prisma.pdfContractTemplate.findUnique({
      where: { id: req.params.id },
      select: { pdfFilePath: true, pdfFileName: true },
    });

    if (!template || !template.pdfFilePath) {
      res.status(404).json({ error: "Template PDF not found" });
      return;
    }

    const resolvedPath = getTemplatePdfPath(template.pdfFilePath);
    if (!resolvedPath) {
      res.status(404).json({ error: "Template PDF file not found on disk" });
      return;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${template.pdfFileName}"`);
    const fs = await import("fs");
    fs.createReadStream(resolvedPath).pipe(res);
  } catch (err) {
    console.error("Download template PDF failed:", err);
    res.status(500).json({ error: "Failed to download template PDF" });
  }
});

// ── PUT /api/digital-contract-templates/:id ── Update template
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const existing = await prisma.pdfContractTemplate.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "Template not found" });
      return;
    }

    const parsed = updateTemplateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }

    const user = (req as any).user;
    const updateData: any = { ...parsed.data };

    const updated = await prisma.pdfContractTemplate.update({
      where: { id: req.params.id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        timestamp: new Date(),
        userName: user?.userId || "system",
        userRole: user?.role || "unknown",
        action: "Digital Contract Template Updated",
        module: "Documents",
        details: `Template '${updated.name}' (${updated.id}) v${updated.version}`,
      },
    });

    res.json({ success: true, template: updated });
  } catch (err) {
    console.error("Update template failed:", err);
    res.status(500).json({ error: "Failed to update template" });
  }
});

// ── DELETE /api/digital-contract-templates/:id ── Delete template
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const existing = await prisma.pdfContractTemplate.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "Template not found" });
      return;
    }

    // Check if any contracts use this template
    const contractCount = await prisma.digitalContract.count({
      where: { templateId: req.params.id },
    });

    if (contractCount > 0) {
      res.status(400).json({ error: `Cannot delete template: ${contractCount} contracts use it. Deactivate instead.` });
      return;
    }

    // Delete PDF file
    deleteTemplatePdf(existing.pdfFilePath);

    // Delete record
    await prisma.pdfContractTemplate.delete({ where: { id: req.params.id } });

    const user = (req as any).user;
    await prisma.auditLog.create({
      data: {
        timestamp: new Date(),
        userName: user?.userId || "system",
        userRole: user?.role || "unknown",
        action: "Digital Contract Template Deleted",
        module: "Documents",
        details: `Template '${existing.name}' (${existing.id})`,
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Delete template failed:", err);
    res.status(500).json({ error: "Failed to delete template" });
  }
});

// ── Company Stamp Upload ──
const stampUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed (PNG, JPG)"));
  },
});

// ── POST /stamp ── Upload company stamp image
router.post("/stamp", stampUpload.single("stamp"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "Stamp image file is required" }); return; }

    const filePath = storeStampImage(req.file.buffer, req.file.originalname);

    const user = (req as any).user;
    await prisma.auditLog.create({
      data: {
        timestamp: new Date(),
        userName: user?.userId || "system",
        userRole: user?.role || "unknown",
        action: "Company Stamp Uploaded",
        module: "Documents",
        details: `Stamp image uploaded: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)}KB)`,
      },
    });

    res.json({ success: true, filePath });
  } catch (err) {
    console.error("Stamp upload failed:", err);
    res.status(500).json({ error: "Failed to upload stamp" });
  }
});

// ── GET /stamp ── Check if company stamp exists
router.get("/stamp", async (_req: Request, res: Response) => {
  try {
    const stampPath = getStampImagePath();
    res.json({ success: true, hasStamp: !!stampPath });
  } catch (err) {
    res.status(500).json({ error: "Failed to check stamp" });
  }
});

// ── DELETE /stamp ── Remove company stamp
router.delete("/stamp", async (_req: Request, res: Response) => {
  try {
    deleteStampImage();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete stamp" });
  }
});

export default router;
