# teleprompter

Node (no dependencies) teleprompter HTML builder ported from `Monoga2025/growth-studio`.

- `teleprompter_engine.js`: paraphrase a script and render the teleprompter HTML.
- `generate_teleprompter_batch.js`, `build_exact_teleprompter.js`: batch/exact builders; they expect input files (daily scripts, transcript) that are not included.
- `test_teleprompter.js`: smoke test, writes to `teleprompters_output/` (git-ignored).

```bash
node tools/teleprompter/test_teleprompter.js
```
The Python counterpart is `tools/script-generator/teleprompter_compiler.py`.
