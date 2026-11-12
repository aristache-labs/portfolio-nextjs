# Claude Code Instructions

Read and follow all instructions in [AGENTS.md](AGENTS.md). This file ensures Claude Code auto-discovers the project guidelines.

## Working here

- Package manager and runtime are Bun. Use `bun run <script>`, not `npm run`.
- The dev server runs on port 4000 (`bun run dev`). Reuse it rather than starting a second one.
- Before a change is considered done, run the gate from AGENTS.md: `bun run lint && bun run format:check && bun run check:spell && bun run typecheck && bun run test`.
- Do not run `bun run build` as a routine check. It is a webpack build and needs a seeded database. CI runs it.
- Every PR bumps `version` in `package.json`, or the required check fails.
- Agent skills in `.agents/skills/` are local and gitignored. See the "Agent skills" section in AGENTS.md for what is installed and when to use each.
