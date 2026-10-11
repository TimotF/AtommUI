# Repository workflow

- This repository is the canonical source of `@timotf/atomm-ui`. Preserve existing local edits and history. `origin` is `git@github.com:TimotF/AtommUI.git`; use normal pushes only, never force-push or rewrite history without explicit authorization.
- Make coherent changes with Conventional Commit messages. Run the relevant checks before committing and pushing. For package or component changes, run `npm run build`, `npm test`, `npm pack` and `node scripts/smoke-tarball.mjs <archive>`; use targeted browser checks when behavior or appearance changes.
- The package version follows SemVer. Create a `vX.Y.Z` tag only after the exact source and archive pass review. The tag workflow rebuilds, tests, packs and publishes the npm archive plus `SHA256SUMS` to a public GitHub Release. Never replace an existing versioned asset.
- Keep `dist/` and `node_modules/` out of Git. The release archive must contain built JavaScript, both public CSS files, TypeScript declarations, the license and package metadata. Test a clean consumer from the archive itself.
- Do not publish to the npm registry. Consumers use an exact GitHub Release asset URL and commit the resulting lockfile with its integrity value.
- Report analyses in the conversation unless a separate report file is explicitly requested.
