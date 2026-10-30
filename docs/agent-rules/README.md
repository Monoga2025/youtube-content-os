# agent-rules

Agent working rules and notes ported from `Monoga2025/content-agent-generator`.

- Rules for agents live in the root [`AGENTS.md`](../../AGENTS.md); the `.monoga/` project-OS schema is the same as in this repo, so nothing was duplicated.
- [`what-the-agent-does.md`](what-the-agent-does.md): plain-language log (Spanish, 2026-10-12) of what the content verifier checks, its test evidence and known limits.

## Quality gate
Verification code lives in the separate repo [`monoga-content-verifier`](https://github.com/Monoga2025/monoga-content-verifier). It is a verifier, not a generator: it never approves or publishes a piece. Run it over output from `tools/script-generator/` before anything is published.
