# Claude Code Instructions

Read and follow all instructions in [AGENTS.md](AGENTS.md). This file ensures Claude Code auto-discovers the project guidelines.

## Working here

- Package manager and runtime are Bun. Use `bun run <script>`, not `npm run`.
- The dev server runs on port 4000 (`bun run dev`). Reuse it rather than starting a second one.
- Before a change is considered done, run the gate from AGENTS.md: `bun run lint && bun run format:check && bun run check:spell && bun run typecheck && bun run test`.
- Do not run `bun run build` as a routine check. It is a webpack build and needs a seeded database. CI runs it.
- Every PR bumps `version` in `package.json`, or the required check fails.
- Agent skills in `.agents/skills/` are local and gitignored. See the "Agent skills" section in AGENTS.md for what is installed and when to use each.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. When the answer is under a Markdown heading, `graphify section "<heading>"` prints that section's text, so the .md need not be opened. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.

<!-- rtk-instructions v2 -->
# Command output

Command output here is condensed to save tokens, keeping every signal and
dropping costly noise. Treat it as the complete result: run commands
normally, and batch related commands into one call to avoid extra turns.
Truncated results state their recovery path in their own output. Re-run a
command as `rtk bypass <cmd>` only when its result is unusable: empty when
output was clearly expected, contradicting its exit code, or garbled.

Delegation commands (they hand work to a cheaper model; the files never enter your context):
- `rtk bulk-read --question "..." <paths...>`
- `rtk code-write --spec "..." --reference <file> --target <file>`
<!-- /rtk-instructions -->