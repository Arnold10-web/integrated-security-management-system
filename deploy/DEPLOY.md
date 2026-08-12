# ISCMS — Deploy on the in-house HP ProLiant microserver (UAT)

No code changes are needed. The app builds to a single Node server (`dist/server.js`)
that serves the SPA **and** the API and persists uploads under `./uploads`.

## Prerequisites (on the ProLiant)

- **Ubuntu Server / Debian** (or any Linux), internet access to GitHub
- **Node.js 22 LTS or 24** — from NodeSource:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```
- **PostgreSQL 16+**
  ```bash
  sudo apt-get install -y postgresql postgresql-contrib
  ```

## 1. App directory + database

```bash
sudo useradd -r -m -s /usr/sbin/nologin iscms
sudo mkdir -p /opt/iscms && sudo chown iscms:iscms /opt/iscms
sudo -u iscms git clone https://github.com/Arnold10-web/integrated-security-management-system.git /opt/iscms
```

Create the database and user:

```bash
sudo -u postgres psql
  CREATE USER iscms WITH PASSWORD 'choose-a-strong-password';
  CREATE DATABASE iscms OWNER iscms;
  \q
```

## 2. Environment file

Copy `.env` from your laptop (or create one at `/opt/iscms/.env`):

```bash
DATABASE_URL="postgresql://iscms:choose-a-strong-password@localhost:5432/iscms"
JWT_SECRET="a-long-random-string"
PORT=3000
```

> `JWT_SECRET` is **required** — the server refuses to start without it.

## 3. Optional: bring your live test data across

From the laptop (or any machine with the dev DB):

```bash
pg_dump -h localhost -U <devuser> iscms > iscms.dump
scp iscms.dump arnold@<proliant-ip>:/tmp/
```

On the ProLiant: `sudo -u iscms psql -d iscms -f /tmp/iscms.dump`
Then **skip the migrate/seed steps below** (your data already has the schema).

## 4. Install, build, migrate, seed

```bash
cd /opt/iscms
sudo -u iscms npm ci
sudo -u iscms npm run build
sudo -u iscms npx prisma migrate deploy      # only if you did NOT restore a dump
sudo -u iscms npm run seed                    # only if you did NOT restore a dump
```

Test it directly first:

```bash
sudo -u iscms NODE_ENV=production node dist/server.js
```

## 5. Run it as a service (survives reboots)

```bash
sudo cp deploy/iscms.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now iscms
sudo systemctl status iscms
```

## 6. Optional: nginx in front (port 80)

```bash
sudo apt-get install -y nginx
sudo cp deploy/nginx-iscms.conf /etc/nginx/sites-available/iscms
sudo ln -s /etc/nginx/sites-available/iscms /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 7. Access

Open the server IP in a browser on the LAN — e.g. `http://192.168.x.x`
(or the nginx hostname from `deploy/nginx-iscms.conf`).

Test logins are in `TEST_LOGINS.md` (all share password `password123`).

## Notes

- The service runs as the `iscms` user; `ProtectSystem=full` still leaves
  `/opt/iscms/uploads` writable (document uploads).
- **Ports**: if you go straight to port 3000 without nginx, allow it in the
  firewall: `sudo ufw allow 3000`.
- **Updating** after a code change: `git pull`, `npm run build`, `sudo systemctl restart iscms`.
