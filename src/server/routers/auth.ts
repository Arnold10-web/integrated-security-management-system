import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod/v4";
import crypto from "crypto";
import type { PrismaClient } from "../../generated/prisma/client";

export function createAuthRouter(prisma: PrismaClient, jwtSecret: string) {
  const r = Router();

  // POST /api/auth/login — issues httpOnly iscms_token (15m) + refresh_token (7d)
  r.post("/login", async (req, res) => {
    const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Validation failed" }); return; }
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: "Invalid credentials" }); return;
    }
    if (user.status === "Suspended") { res.status(403).json({ error: "Account suspended" }); return; }
    const effectiveRole = user.actingRole && user.actingExpiresAt && new Date(user.actingExpiresAt) > new Date() ? user.actingRole : user.role;
    const jti = crypto.randomUUID();
    const token = jwt.sign({ userId: user.id, role: effectiveRole, jti }, jwtSecret, { expiresIn: "15m" });
    const refreshRaw = crypto.randomBytes(32).toString("hex");
    const refreshHash = crypto.createHash("sha256").update(refreshRaw).digest("hex");
    await prisma.refreshToken.create({ data: { userId: user.id, tokenHash: refreshHash, expiresAt: new Date(Date.now() + 7*24*60*60*1000), userAgent: (req.headers["user-agent"]||"").slice(0,300), ipAddress: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? "" } }).catch(()=>{});
    res.cookie("iscms_token", token, { httpOnly:true, secure: process.env.NODE_ENV==="production", sameSite:"strict", maxAge:15*60*1000, path:"/" });
    res.cookie("refresh_token", refreshRaw, { httpOnly:true, secure: process.env.NODE_ENV==="production", sameSite:"strict", maxAge:7*24*60*60*1000, path:"/api/auth" });
    res.json({ token, user: { id:user.id, name:user.name, email:user.email, role:user.role, effectiveRole, actingRole:user.actingRole, actingExpiresAt:user.actingExpiresAt } });
  });

  // POST /api/auth/refresh
  r.post("/refresh", async (req, res) => {
    const raw = (req as any).cookies?.refresh_token ?? (req.headers.cookie?.match(/refresh_token=([^;]+)/)?.[1] ?? "");
    if (!raw) { res.status(401).json({ error:"Refresh required"}); return; }
    const hash = crypto.createHash("sha256").update(decodeURIComponent(raw)).digest("hex");
    const stored = await prisma.refreshToken.findUnique({ where:{ tokenHash:hash }});
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) { res.status(401).json({error:"Invalid refresh"}); return; }
    const user = await prisma.user.findUnique({ where:{id:stored.userId}});
    if (!user) { res.status(401).json({error:"User gone"}); return; }
    const jti=crypto.randomUUID();
    const effectiveRole = user.actingRole && user.actingExpiresAt && new Date(user.actingExpiresAt) > new Date() ? user.actingRole : user.role;
    const token=jwt.sign({userId:user.id, role:effectiveRole, jti}, jwtSecret, {expiresIn:"15m"});
    await prisma.refreshToken.update({where:{tokenHash:hash}, data:{revokedAt:new Date()}}).catch(()=>{});
    const newRaw=crypto.randomBytes(32).toString("hex");
    const newHash=crypto.createHash("sha256").update(newRaw).digest("hex");
    await prisma.refreshToken.create({ data:{userId:user.id, tokenHash:newHash, expiresAt:new Date(Date.now()+7*24*60*60*1000)} });
    res.cookie("iscms_token", token, {httpOnly:true, secure:process.env.NODE_ENV==="production", sameSite:"strict", maxAge:15*60*1000, path:"/"});
    res.cookie("refresh_token", newRaw, {httpOnly:true, secure:process.env.NODE_ENV==="production", sameSite:"strict", maxAge:7*24*60*60*1000, path:"/api/auth"});
    res.json({ token });
  });

  return r;
}
