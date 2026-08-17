import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../generated/prisma/client.ts";
import cookie from "cookie";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  actingRole?: string;
  jti?: string;
}

export function extractToken(req: Request): string | null {
  // 1) Authorization: Bearer <token>
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  // 2) httpOnly cookie (primary after migration)
  const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
  if (cookies.iscms_token) return cookies.iscms_token;
  if (cookies.refresh_token) return null; // refresh is not for auth
  return null;
}

export function authenticateToken(prisma: PrismaClient, jwtSecret: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({ error: "Access token required" });
      return;
    }
    try {
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload & { jti?: string };
      // jti revocation check
      if (decoded.jti) {
        const revoked = await prisma.revokedToken.findUnique({ where: { jti: decoded.jti } });
        if (revoked) {
          res.status(401).json({ error: "Token revoked" });
          return;
        }
      }
      // per-request revalidation of status / acting expiry
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { status: true, actingRole: true, actingExpiresAt: true, role: true },
      });
      if (!dbUser) {
        res.status(401).json({ error: "User not found" });
        return;
      }
      if (dbUser.status === "Suspended") {
        res.status(403).json({ error: "Account suspended" });
        return;
      }
      if (dbUser.actingExpiresAt && new Date(dbUser.actingExpiresAt) < new Date()) {
        // acting expired — still allow but strip acting
        decoded.actingRole = undefined;
      } else if (dbUser.actingRole) {
        decoded.actingRole = dbUser.actingRole;
      }
      (req as any).user = decoded;
      // touch session lastActive
      const tokenId = decoded.jti ?? token.slice(0, 8);
      void prisma.userSession
        .updateMany({ where: { userId: decoded.userId, tokenId, isActive: true }, data: { lastActiveAt: new Date() } })
        .catch(() => {});
      void prisma.user.update({ where: { id: decoded.userId }, data: { lastActive: new Date() } }).catch(() => {});
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };
}

export function requireModuleAccess(
  prisma: PrismaClient,
  moduleId: string,
  level: "view" | "full" = "view"
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as JwtPayload | undefined;
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    // Resolve custom overrides
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { customPermissions: true } });
    const overrides = dbUser?.customPermissions as Record<string, string> | null;
    // Import server-side permission map lazily to avoid circular
    const { MODULE_PERMISSIONS } = await import("../../config/permissions.ts");
    const rolePerms = (MODULE_PERMISSIONS as any)[user.actingRole ?? user.role] ?? {};
    let effective: string | undefined = rolePerms[moduleId];
    if (overrides && overrides[moduleId] !== undefined) effective = overrides[moduleId];
    if (!effective || effective === "none") {
      res.status(403).json({ error: `Access denied to ${moduleId}` });
      return;
    }
    if (level === "full" && effective !== "full") {
      res.status(403).json({ error: `Full access required for ${moduleId}` });
      return;
    }
    next();
  };
}
