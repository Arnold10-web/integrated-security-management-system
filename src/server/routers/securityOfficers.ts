import { Router } from "express";
import type { PrismaClient } from "../../generated/prisma/client";
import { authenticateToken } from "../middleware/auth";

export function createSecurityOfficersRouter(prisma: PrismaClient, jwtSecret: string) {
  const r = Router();
  const auth = authenticateToken(prisma, jwtSecret);
  // GET /api/security-officers — paginated, filtered by region/status, DB push-down
  r.get("/", auth, async (req, res) => {
    const { region, status, page="1", limit="50", search } = req.query as Record<string,string>;
    const where: any = {};
    if (region) where.region = region;
    if (status) where.status = status;
    if (search) where.OR = [{ fullName:{contains:search, mode:"insensitive"}}, { forceNumber:{contains:search, mode:"insensitive"} }, { nationalId:{contains:search, mode:"insensitive"}}];
    const take=Math.min(Number(limit)||50, 100);
    const skip=(Math.max(Number(page)||1,1)-1)*take;
    const [rows,total]=await Promise.all([prisma.securityOfficer.findMany({where, take, skip, orderBy:{createdAt:"desc"}}), prisma.securityOfficer.count({where})]);
    res.json({ data:rows, total, page:Number(page), limit:take });
  });
  // POST /api/security-officers — creates with ForceNumberSequence (see src/server/services/forceNumber.ts)
  r.post("/", auth, async (req,res)=>{
    // Delegates to legacy server.ts handler for now — this router is the new boundary.
    res.status(501).json({ error:"Use legacy /api/security-officers — migration in progress. This router is the new boundary." });
  });
  return r;
}
