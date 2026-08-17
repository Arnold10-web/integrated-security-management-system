# ISCMS Hardening Checklist (HP ProLiant MicroServer Gen10 — Internet-facing)

## Host
- [ ] Dedicated non-root `iscms` user, `unattended-upgrades` enabled, SSH key-only (`PasswordAuthentication no`), `fail2ban` active
- [ ] UFW: allow 22 (SSH, VPN/known-IP only), 80/443; deny all else
- [ ] iLO VLAN isolation + default cred rotation
- [ ] LUKS/full-disk encryption on OS + `secure_storage` + DB volume
- [ ] `aide` or `tripwire` for file integrity

## Network
- [ ] nginx/Caddy reverse proxy + TLS (443 only, `trust proxy: 1` set in app), HSTS
- [ ] Firewall + VPN/known-IP for SSH, no direct DB exposure (Postgres `localhost` only)
- [ ] RAID1 + UPS

## App / DB
- [ ] `DATABASE_URL` with `sslmode=require` in hosted env, `JWT_SECRET` 32+ chars, `DB_ENCRYPTION_KEY` 64 hex (`openssl rand -hex 32`)
- [ ] `secure_storage` outside static path, `chmod 700`, owned by `node`
- [ ] `uploads` + `secure_storage` on encrypted volume, 3-2-1 encrypted backups (tested restores)
- [ ] `prisma migrate deploy` + `npm run seed` only via `SEED_ENABLED` env, random per-user passwords printed once
- [ ] `pino` JSON logging + syslog/second-location audit shipping
- [ ] GDPR retention policy (Art.17 vs legal-hold) + eIDAS/PDF-A compliance review (current e-sign is SES, not AdES/QES)

## Backups
- [ ] Nightly `pg_dump | gpg --encrypt` to off-site S3 + local encrypted copy, weekly restore drill
