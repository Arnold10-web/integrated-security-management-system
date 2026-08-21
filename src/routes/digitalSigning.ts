import { Router, Request, Response } from "express";
import crypto from "crypto";
import fs from "fs";
import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { isValidSignature, decryptField, hashDocument } from "../utils/digitalContractSecurity.ts";
import { storeFinalizedPdf, isPdfFile, getTemplatePdfPath, getStampImagePath } from "../services/digitalContractPdfService.ts";

const router = Router();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Rate limiting for public signing routes
const signingAttempts = new Map<string, number[]>();
const RATE_LIMIT = 30;
const RATE_WINDOW = 15 * 60 * 1000;

function checkRateLimit(token: string): boolean {
  const now = Date.now();
  const attempts = signingAttempts.get(token) || [];
  const recent = attempts.filter((t) => now - t < RATE_WINDOW);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  signingAttempts.set(token, recent);
  return true;
}

// ── GET /digital-sign/:token ── Get contract for signing (public)
router.get("/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!/^[0-9a-f]{64}$/.test(token)) {
      res.status(404).json({ error: "Signing link expired or invalid" });
      return;
    }

    if (!checkRateLimit(token)) {
      res.status(429).json({ error: "Too many requests. Please try again later." });
      return;
    }

    const signer = await prisma.digitalContractSigner.findUnique({
      where: { secureToken: token },
      include: {
        contract: {
          include: { template: true },
        },
      },
    });

    if (!signer || signer.isCompleted || signer.expiresAt.getTime() <= Date.now()) {
      res.status(404).json({ error: "Signing link expired or invalid" });
      return;
    }

    if (signer.declinedAt) {
      res.status(400).json({ error: "This signing link has been declined" });
      return;
    }

    // Check if it's this signer's turn (sequential signing)
    const contract = signer.contract;
    if (contract.status === "PendingSigning" || contract.status === "PartiallySigned") {
      const allSigners = await prisma.digitalContractSigner.findMany({
        where: { contractId: contract.id },
        orderBy: { signingOrder: "asc" },
      });
      const currentSignerIndex = contract.currentSignerIndex;
      if (currentSignerIndex < allSigners.length && allSigners[currentSignerIndex].id !== signer.id) {
        res.status(400).json({ error: "It is not your turn to sign yet. Please wait for previous signers." });
        return;
      }
    }

    // Log view event
    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "";
    const userAgent = (req.headers["user-agent"] as string) || "";

    await prisma.digitalContractAudit.create({
      data: {
        contractId: contract.id,
        eventType: "Viewed",
        description: `Signing page viewed by ${signer.signerName}`,
        performedBy: `Signer:${signer.signerName}`,
        ipAddress: clientIp,
        userAgent,
      },
    });

    // Build response with template PDF info and field data
    const template = contract.template;
    const filledFields = contract.filledFields as Record<string, unknown>;

    // Decrypt signer email for display
    let signerEmail: string | null = null;
    if (signer.signerEmail) {
      try { signerEmail = decryptField(signer.signerEmail); } catch { signerEmail = signer.signerEmail; }
    }

    // Get all signers for the contract
    const allSigners = await prisma.digitalContractSigner.findMany({
      where: { contractId: contract.id },
      orderBy: { signingOrder: "asc" },
      select: { id: true, signerName: true, signerTitle: true, signingOrder: true, isCompleted: true, signedAt: true },
    });

    res.json({
      success: true,
      data: {
        contractId: contract.contractId,
        title: contract.title,
        category: contract.category,
        partyName: contract.partyName,
        filledFields,
        templatePdfUrl: `/api/digital-contract-templates/${template.id}/pdf`,
        signer: {
          id: signer.id,
          name: signer.signerName,
          title: signer.signerTitle,
          email: signerEmail,
          signingOrder: signer.signingOrder,
        },
        totalSigners: allSigners.length,
        completedSigners: allSigners.filter((s) => s.isCompleted).length,
        allSigners,
      },
    });
  } catch (err) {
    console.error("Get signing contract failed:", err);
    res.status(500).json({ error: "Could not load document" });
  }
});

// ── POST /digital-sign/:token ── Submit signature (public)
router.post("/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { signatureImage, signerName, signerTitle } = req.body;

    if (!/^[0-9a-f]{64}$/.test(token)) {
      res.status(400).json({ error: "Link is invalid or expired" }); return;
    }

    if (!isValidSignature(signatureImage)) {
      res.status(400).json({ error: "Invalid signature data" }); return;
    }

    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "";
    const userAgent = (req.headers["user-agent"] as string) || "";

    const signer = await prisma.digitalContractSigner.findUnique({
      where: { secureToken: token },
      include: { contract: { include: { template: true } } },
    });

    if (!signer || signer.isCompleted || signer.expiresAt.getTime() <= Date.now()) {
      res.status(400).json({ error: "Link is invalid, expired, or already used" }); return;
    }

    if (signer.declinedAt) {
      res.status(400).json({ error: "This signing link has been declined" }); return;
    }

    const contract = signer.contract;

    // Process signing in transaction
    await prisma.$transaction(async (tx) => {
      // Update signer with signature
      await tx.digitalContractSigner.update({
        where: { id: signer.id },
        data: {
          signatureData: signatureImage,
          signerName: signerName || signer.signerName,
          signerTitle: signerTitle || signer.signerTitle,
          signedAt: new Date(),
          isCompleted: true,
          ipAddress: clientIp,
          userAgent,
        },
      });

      // Audit log
      await tx.digitalContractAudit.create({
        data: {
          contractId: contract.id,
          eventType: "Signed",
          description: `Signed by ${signer.signerName} (${signer.signerTitle || "N/A"})`,
          performedBy: `Signer:${signer.signerName}`,
          ipAddress: clientIp,
          userAgent,
        },
      });

      // Check if all signers have completed
      const allSigners = await tx.digitalContractSigner.findMany({
        where: { contractId: contract.id },
        orderBy: { signingOrder: "asc" },
      });

      const allCompleted = allSigners.every((s) => s.isCompleted);

      if (allCompleted) {
        // All signers completed - overlay signatures on the original template PDF
        const { PDFDocument } = await import("pdf-lib");

        let pdfBytes: Uint8Array;

        // Load the original template PDF and overlay signatures
        const templateFilePath = contract.template.pdfFilePath;
        const resolvedTemplatePath = getTemplatePdfPath(templateFilePath);

        if (resolvedTemplatePath && fs.existsSync(resolvedTemplatePath)) {
          // Load the original template PDF (preserves ALL pages and legal text)
          const templateBytes = fs.readFileSync(resolvedTemplatePath);
          const pdfDoc = await PDFDocument.load(templateBytes);

          // Embed all signature images
          const signatures = allSigners
            .filter((s) => s.signatureData)
            .sort((a, b) => a.signingOrder - b.signingOrder);

          const embedFonts = await import("pdf-lib").then(async (m) => ({
            font: await pdfDoc.embedFont("Helvetica"),
            boldFont: await pdfDoc.embedFont("Helvetica-Bold"),
          }));

          // For each signer with a signature, create a signature overlay page
          // appended at the end of the document (signature certificate page)
          const sigCertPage = pdfDoc.addPage([612, 792]); // Letter size
          let y = 740;

          sigCertPage.drawText("ELECTRONIC SIGNATURE CERTIFICATE", {
            x: 50, y, size: 16, font: embedFonts.boldFont,
          });
          y -= 20;

          // Document reference
          sigCertPage.drawText("Document Reference", {
            x: 50, y, size: 11, font: embedFonts.boldFont,
          });
          y -= 14;
          sigCertPage.drawText(`Contract ID: ${contract.contractId}`, {
            x: 50, y, size: 10, font: embedFonts.font,
          });
          y -= 12;
          sigCertPage.drawText(`Contract Title: ${contract.title}`, {
            x: 50, y, size: 10, font: embedFonts.font,
          });
          y -= 12;
          sigCertPage.drawText(`Finalized: ${new Date().toUTCString()}`, {
            x: 50, y, size: 10, font: embedFonts.font,
          });
          y -= 12;
          sigCertPage.drawText(`Document Hash (SHA-256): Pending finalization`, {
            x: 50, y, size: 10, font: embedFonts.font,
          });
          y -= 20;

          // Legal basis
          sigCertPage.drawText("Legal Basis", {
            x: 50, y, size: 11, font: embedFonts.boldFont,
          });
          y -= 14;
          sigCertPage.drawText("This electronic signature is valid under:", {
            x: 50, y, size: 9, font: embedFonts.font,
          });
          y -= 12;
          sigCertPage.drawText("- ESIGN Act (15 U.S.C. §7001 et seq.) — United States", {
            x: 60, y, size: 9, font: embedFonts.font,
          });
          y -= 11;
          sigCertPage.drawText("- eIDAS Regulation (EU) No 910/2014 — European Union", {
            x: 60, y, size: 9, font: embedFonts.font,
          });
          y -= 11;
          sigCertPage.drawText("- Uganda Electronic Transactions Act, 2011", {
            x: 60, y, size: 9, font: embedFonts.font,
          });
          y -= 20;

          // Signatures
          sigCertPage.drawText("Signatures (in order):", {
            x: 50, y, size: 12, font: embedFonts.boldFont,
          });
          y -= 18;

          for (const s of allSigners) {
            // Draw signature image if available
            if (s.signatureData) {
              try {
                const signatureDataUrl = s.signatureData;
                const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, "");
                const sigImageBytes = Buffer.from(base64Data, "base64");

                let embeddedImage;
                if (signatureDataUrl.includes("image/png")) {
                  embeddedImage = await pdfDoc.embedPng(sigImageBytes);
                } else if (signatureDataUrl.includes("image/jpeg") || signatureDataUrl.includes("image/jpg")) {
                  embeddedImage = await pdfDoc.embedJpg(sigImageBytes);
                }

                if (embeddedImage) {
                  const sigWidth = 140;
                  const sigHeight = 35;
                  sigCertPage.drawImage(embeddedImage, {
                    x: 70, y: y - sigHeight, width: sigWidth, height: sigHeight,
                  });
                }
              } catch (e) {
                sigCertPage.drawText("[Signature image could not be embedded]", {
                  x: 70, y: y - 5, size: 9, font: embedFonts.font,
                });
              }
            }

            sigCertPage.drawText(`${s.signingOrder}. ${s.signerName}${s.signerTitle ? ` (${s.signerTitle})` : ""}`, {
              x: 220, y, size: 10, font: embedFonts.boldFont,
            });
            sigCertPage.drawText(`   Signed: ${s.signedAt?.toUTCString() || "N/A"}`, {
              x: 220, y: y - 12, size: 9, font: embedFonts.font,
            });
            if (s.ipAddress) {
              sigCertPage.drawText(`   IP: ${s.ipAddress}`, {
                x: 220, y: y - 23, size: 8, font: embedFonts.font,
              });
            }
            y -= 45;
          }

          y -= 10;

          // Consent statement
          sigCertPage.drawText("Consent & Attestation", {
            x: 50, y, size: 11, font: embedFonts.boldFont,
          });
          y -= 14;
          const consentLines = [
            "Each signer above has consented to conduct this transaction electronically",
            "and has been informed of their right to receive a paper copy and to",
            "withdraw consent. Each signature is uniquely linked to the signatory,",
            "created under their sole control, and linked to the contract data such",
            "that any subsequent change is detectable. This document will be",
            "retained for the duration required by applicable law.",
          ];
          for (const line of consentLines) {
            sigCertPage.drawText(line, {
              x: 50, y, size: 9, font: embedFonts.font,
            });
            y -= 11;
          }

          // Overlay company stamp if available
          const stampPath = getStampImagePath();
          if (stampPath && fs.existsSync(stampPath)) {
            try {
              const stampBytes = fs.readFileSync(stampPath);
              let embeddedStamp;
              if (stampPath.endsWith(".png")) {
                embeddedStamp = await pdfDoc.embedPng(stampBytes);
              } else if (stampPath.endsWith(".jpg") || stampPath.endsWith(".jpeg")) {
                embeddedStamp = await pdfDoc.embedJpg(stampBytes);
              }

              if (embeddedStamp) {
                const stampWidth = 120;
                const stampHeight = 120;
                sigCertPage.drawImage(embeddedStamp, {
                  x: 400, y: 100, width: stampWidth, height: stampHeight,
                });
              }
            } catch (e) {
              console.warn("Could not embed company stamp:", e);
            }
          }

          pdfBytes = await pdfDoc.save();
        } else {
          // Fallback: create a standalone finalization page if template file not found
          const pdfDoc = await PDFDocument.create();
          const page = pdfDoc.addPage([612, 792]);
          const font = await pdfDoc.embedFont("Helvetica");
          const boldFont = await pdfDoc.embedFont("Helvetica-Bold");

          page.drawText("DIGITAL CONTRACT - FINALIZED", {
            x: 50, y: 740, size: 20, font: boldFont,
          });
          page.drawText(`Contract ID: ${contract.contractId}`, {
            x: 50, y: 700, size: 12, font,
          });
          page.drawText(`Title: ${contract.title}`, {
            x: 50, y: 680, size: 12, font,
          });

          let yPos = 640;
          page.drawText("Signatures:", { x: 50, y: yPos, size: 14, font: boldFont });
          yPos -= 25;

          for (const s of allSigners) {
            page.drawText(`${s.signingOrder}. ${s.signerName}${s.signerTitle ? ` (${s.signerTitle})` : ""}`, {
              x: 70, y: yPos, size: 11, font,
            });
            page.drawText(`   Signed: ${s.signedAt?.toUTCString() || "N/A"}`, {
              x: 70, y: yPos - 15, size: 10, font,
            });
            yPos -= 40;
          }

          pdfBytes = await pdfDoc.save();
        }

        const pdfBuffer = Buffer.from(pdfBytes);

        // Store finalized PDF
        const finalizedPath = storeFinalizedPdf(contract.id, pdfBuffer);
        const pdfHash = hashDocument(pdfBuffer, contract.id);

        // Update contract
        await tx.digitalContract.update({
          where: { id: contract.id },
          data: {
            status: "FullySigned",
            finalizedPdfPath: finalizedPath,
            documentHash: pdfHash,
          },
        });

        await tx.digitalContractAudit.create({
          data: {
            contractId: contract.id,
            eventType: "Completed",
            description: "All signers completed. Final PDF generated with signature certificate.",
            cryptoHash: pdfHash,
          },
        });
      } else {
        // Move to next signer
        const nextIndex = allSigners.findIndex((s) => !s.isCompleted);
        await tx.digitalContract.update({
          where: { id: contract.id },
          data: {
            status: "PartiallySigned",
            currentSignerIndex: nextIndex >= 0 ? nextIndex : 0,
          },
        });
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Sign contract failed:", err);
    res.status(500).json({ error: "Could not complete signing" });
  }
});

// ── POST /digital-sign/:token/decline ── Decline to sign (public)
router.post("/:token/decline", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { reason } = req.body;

    if (!/^[0-9a-f]{64}$/.test(token)) {
      res.status(400).json({ error: "Invalid link" }); return;
    }

    const signer = await prisma.digitalContractSigner.findUnique({
      where: { secureToken: token },
    });

    if (!signer) {
      res.status(404).json({ error: "Signing link not found" }); return;
    }

    await prisma.digitalContractSigner.update({
      where: { id: signer.id },
      data: {
        declinedAt: new Date(),
        declineReason: reason || "No reason provided",
      },
    });

    await prisma.digitalContractAudit.create({
      data: {
        contractId: signer.contractId,
        eventType: "Declined",
        description: `Signing declined by ${signer.signerName}: ${reason || "No reason"}`,
        performedBy: `Signer:${signer.signerName}`,
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Decline signing failed:", err);
    res.status(500).json({ error: "Could not process decline" });
  }
});

export default router;
