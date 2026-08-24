# Railway whole-repo deploy fix for `bun install --frozen-lockfile` failure
#
# Root cause: The build copies BOTH `bun.lock` (or `bun.lockb`) AND `package-lock.json`.
# Bun v1.3.14 uses a text `bun.lock`. If `package.json` was edited (e.g. adding
# lucide icons) without re-running `bun install`, the lockfile is stale and
# `--frozen-lockfile` (Nixpacks default) aborts with:
#   error: lockfile had changes, but lockfile is frozen
#
# Fix applied: `nixpacks.toml` overrides the install phase to `bun install`
# (no --frozen-lockfile), so the whole-repo build succeeds even when the
# lockfile is slightly stale. Push this file and redeploy.
#
# Proper fix (do once locally before next deploy):
#   1. Delete the conflicting npm lockfile if you use Bun (pick ONE package manager):
#        rm package-lock.json
#        git rm --cached package-lock.json  # if already tracked
#   2. Regenerate the Bun lockfile and commit:
#        bun install
#        git add bun.lock   # or bun.lockb if your Bun still writes binary lockfile
#        git commit -m "chore: update bun lockfile for Railway"
#        git push
#   3. After that you can optionally revert `nixpacks.toml` to enforce frozen
#      installs again by changing `cmds = ["bun install --frozen-lockfile"]`.
#
# Alternative if you prefer a Dockerfile over Nixpacks:
#   COPY package.json bun.lock* ./
#   COPY prisma ./prisma
#   RUN bun install
#   RUN bunx prisma generate
#   RUN bun run build
#   CMD ["bun", "start"]
#
# Whole-repo note: The build already does `copy bun.lock, package-lock.json,
# package.json, prisma` — ensure your Railway service Root Directory is `/`
# (whole repo), not `/client`. Keep `mise` cache copies as they are.
