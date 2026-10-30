# script-generator

Python content engine ported from `Monoga2025/growth-studio` (`02_MOTOR_DE_CONTENIDO`). Modules are flat on purpose: they import each other by name.

- Generators: `viral_script_generator.py`, `youtube_consulting_script_generator.py`, `shared_context.py`.
- Engine: `growth_buffer_manager.py`, `run_daily_content.py`, `daily_growth_engine.py`, `apify_miner.py`, `teleprompter_compiler.py`, `twenty_card_sync.py`.
- Tests: `test_content_engine.py`.

## Configuration
Everything is read from environment variables (`APIFY_API_TOKEN`, `TWENTY_API_KEY`, ...). None are included; some modules publish or sync with real services when keys are set, so read before running. Sending stays manual: the generators only draft.

## Run tests
```bash
pip install python-dotenv pytest
python -m pytest tools/script-generator/test_content_engine.py
```
Status: 7 of 9 tests pass. 2 fail because they expect an external `contexto-general.json` (shared brand context) and live Apify data that are not part of this repo.

## Not ported (on purpose)
`auto_pipeline.py` (needs a private SFTP client), `telegram_listener.py`, `telegram_video_bot.js`, `transcribe_audio.py`, and the lead-demo builder `01_GENERADOR_LOTES_LA`.
