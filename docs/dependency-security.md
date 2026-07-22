# Dependency Security Notes

## 2026-03-31 axios supply-chain audit

- Direct `axios` dependency: none.
- Locked transitive `axios` versions:
  - `1.13.5` as the top-level package-lock resolution
  - `1.13.2` in several nested trees
  - `1.9.0` in older nested Dynamic Labs subtrees
- `plain-crypto-js`: not present in `package.json` or either lockfile.
- No local `node_modules` tree was present during this audit, so exposure was assessed from committed lockfiles.

## Operating rule

- During npm ecosystem incidents, do not reinstall from floating semver.
- Prefer `npm ci` or the package-manager equivalent with a frozen lockfile.
- Review lockfile diffs before merging dependency refreshes.

## CI install policy

- `package.json` pins the package manager with `packageManager`.
- GitHub Actions must install the pinned pnpm version with `pnpm/action-setup`; do not use `npm install -g pnpm` in CI.
- CI dependency installs must use `pnpm install --frozen-lockfile`.
- Docker builds must use the same Node major as the repo `engines.node` contract and must install the pinned pnpm version before `pnpm install --frozen-lockfile`.
- If a supply-chain advisory affects a locked package, inspect the lockfile first and only regenerate it after choosing a known-good version.
