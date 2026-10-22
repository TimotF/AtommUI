# Repository workflow

- This repository is the canonical source of `@timotf/atomm-ui`. Preserve existing local edits and history. `origin` is `git@github.com:TimotF/AtommUI.git`; use normal pushes only, never force-push or rewrite history without explicit authorization.
- Make coherent changes with Conventional Commit messages. Run the relevant checks before committing and pushing. For package or component changes, run `npm run build`, `npm test`, `npm pack` and `node scripts/smoke-tarball.mjs <archive>`; use targeted browser checks when behavior or appearance changes.
- The package version follows SemVer. Create a `vX.Y.Z` tag only after the exact source and archive pass review. The tag workflow rebuilds, tests, packs and publishes the npm archive plus `SHA256SUMS` to a public GitHub Release. Never replace an existing versioned asset.
- Keep `dist/` and `node_modules/` out of Git. The release archive must contain built JavaScript, both public CSS files, TypeScript declarations, the license and package metadata. Test a clean consumer from the archive itself.
- Do not publish to the npm registry. Consumers use an exact GitHub Release asset URL and commit the resulting lockfile with its integrity value.
- Report analyses in the conversation unless a separate report file is explicitly requested.

- Before implementing a missing shared control or changing an existing component's rendering, describe the need, why the locked published components do not cover it, the proposed addition/extension and the impact on consumers. Wait for the user's decision; do not silently create a consumer-local Vuetify/HTML replacement. Approval for a named component in the current conversation satisfies this requirement. Continue independent work while awaiting the decision.
- Keep application copy, import limits, geometry, preset values and fabrication thresholds in consumers. Shared controls accept translated labels/help and preserve raw values; boolean settings use switches, actions use buttons. Help must work with keyboard and touch without changing the control value.
- SVG viewport controls display millimetre geometry with display-only units. Grid, rulers and optional diagnostic overlays are preview-only; the consumer's production export stays independent. Verify pan, pointer-centred wheel zoom, keyboard, cancellation, resizing, multiple instances and invalid bounds.

- Preview material thumbnails and their three-column grid belong to `AuMaterialThumbnail` and `AuMaterialPicker`. Consumers provide translated titles, saved values and optional colors; do not duplicate the material SVG or grid in generators.

- Licensing: original project code is proprietary from this change forward (AtommUI 0.16.0 onward). Do not introduce an open-source grant or change licensing without explicit owner approval. Preserve all third-party notices and permissions already granted for past versions; never replace or remove old release assets. Keep package metadata, release notes and distributed LICENSE/THIRD_PARTY_NOTICES consistent. Generated-result permissions in Bow Tie remain compatible with the separately authorized Atomm platform agreement.
