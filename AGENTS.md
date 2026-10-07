# Titanlar publication

- Use `karacaismail <35493655+karacaismail@users.noreply.github.com>` as both author and committer for newly authored commits. Preserve upstream authorship and the personal Git guard. Do not add co-author or generated-with trailers.
- Keep credentials, real `.env` files and backups containing private data outside Git. Do not select or change the project license without user approval.
- `npm run build` builds the existing React/Vite project and then selects the recovered isometric snapshot as `dist/index.html`. GitHub Actions publishes `dist` to Pages.
- The homepage and `/izometrik/` use the same recovered 26 September 2026 compiled snapshot. `/v3/` and `/v4/` contain the user's other local landing prototypes. Treat these as historical snapshots; document their provenance and any changes.
- Changes to `src/` do not automatically alter the selected historical homepage. Change the homepage selection explicitly when the user requests it.
- Verify the production output and actual route responses after changing publication. Preserve UTF-8, Turkish language metadata and responsive viewport metadata.
- For new UI work, follow the actual installed stack and central semantic tokens, retain visible keyboard focus only on the focused control, use accessible custom dropdowns and maintain readable text at 1rem or larger. Start at 320 CSS px and verify wider viewports, inputs, zoom and reduced motion. Tables must scroll inside their containers rather than squeezing or breaking words.
- Obtain independent read-only QA for meaningful UI changes. Report browser, viewport and input evidence accurately; distinguish real Safari/device checks from emulation. The restored legacy snapshots have accessibility gaps and must not be represented as meeting all of these acceptance criteria.
- On the user's Mac, read the shared coding standards at `/Users/w6x/.claude/skills/coding-standards/SKILL.md` and its relevant references before code changes. Do not bypass Git hooks or restart existing Colima services.
