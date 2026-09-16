---
artifact: build-plan
phase: 11
status: approved
reason: ""
last_updated: "2026-09-15"
---
# 11 — Build plan

## Strategy
Deliver one thin serverless slice at a time. Keep business rules in a pure dependency-free core verified with Node's built-in test runner; keep Apps Script as a small adapter. Use RED → GREEN → REFACTOR. No real credential, channel ID, or production deployment is fabricated.

## Vertical Slice 0 — Grounded mission eligibility
- **Value:** prove that one verified source signal and one privacy-verified evidence item can become an original bounded mission scaffold, while invalid users/data are rejected.
- **Architecture proven:** Google-Sheet row contracts → pure validation/dedupe/eligibility → Apps Script menu/Sheet persistence adapter → human approval boundary.
- **Actor:** Daniel.
- **UI:** seven-tab private workbook and menu initialization; mission row is visible/editable.
- **Server/data:** Apps Script V8 with Sheet reads/writes; pure core produces deterministic records.
- **Permissions:** owner-email guard; no publishing endpoint.
- **Errors:** missing owner/config/evidence, wrong user, invalid channel/video IDs, unsafe evidence, duplicate signal.
- **Evidence:** failing tests first, passing unit tests, syntax check, static secret/publishing scan, manual Apps Script smoke steps. Live persistence/API proof remains blocked until Daniel supplies/configures real private account resources and verified IDs.

## Backlog
| ID | Feature/slice | Depends on | Priority | Exit evidence |
|---|---|---|---|---|
| F-001 | Core contracts, dedupe, owner guard, mission scaffold | Phases 1–11 | MUST | Unit tests |
| F-002 | Workbook initializer, menu, row persistence/log adapter | F-001 | MUST | Syntax + manual Sheet smoke |
| F-003 | Read-only YouTube refresh transaction | F-001/002 + configured key/verified ID | MUST | Staging API smoke + no-partial-write proof |
| F-004 | Weekly mission operation and approval checklist | F-001/002 | MUST | One real sanitized mission UAT |
| F-005 | Retention purge, trigger, kill switch, backup/runbook | F-002/003 | MUST | Operational drill |
| F-006 | Feedback and monthly review | F-004 | SHOULD | One four-week cycle |

## F-001/002 acceptance
- Valid source/evidence creates one DRAFT mission with 180-minute budget and source/evidence traceability.
- Duplicate video IDs update raw fields without replacing human fields.
- Wrong/blank effective owner fails closed.
- Workbook initializer creates exact headers without credentials or guessed IDs.
- Adapter contains no YouTube write, captions, comments, transcript, or publication operation.
- Errors are safe and reference Run Log.

## Sequence
1. RED: add core tests and demonstrate failure because implementation is absent.
2. GREEN: implement minimum core; pass tests.
3. REFACTOR: validate/freeze contracts and safe strings.
4. Implement thin Apps Script workbook adapter and syntax/static checks.
5. Daniel configures staging account/key/owner/verified IDs; run F-002/003 manual smoke.
6. Complete F-004/005 and Phase 12 evidence; then one MUST card at a time in Phase 13.
7. QA, UAT, production enablement, handoff, post-launch learning.

## Verification commands
```powershell
node --test tests/*.test.js
node --check apps-script/Core.js
node --check apps-script/Code.js
git grep -n -E "(API_KEY\s*=|AIza|captions|commentThreads|videos\.insert|youtube\.upload)" -- .
```
Static grep findings are reviewed, not blindly treated as failure when they appear in compliance documentation/tests.

## Risks
Apps Script globals differ from Node; Sheet operations need live manual smoke. Consumer account identity may be unavailable in some contexts; fail closed. API/quota policy may change. No Phase 12 PASS until real persistence, refresh/error, and permission evidence exists.

## Gate
- [x] Tasks have controlled scope.
- [x] Each feature ends in verifiable value.
- [x] Vertical Slice 0 tests the real architecture boundary.
- [x] Acceptance is observable.
- [x] Dependencies are ordered.
- [x] QA, deployment, and handoff are included.
# 11 — Build plan addendum: local-first pivot

## FACT
CR-002 replaces the production dependency on Apps Script/Google Sheets with the local Node + SQLite operation. The legacy Apps Script assets are preserved but are not part of the active runtime.

## Slice
1. RED: write local-core behavior tests before implementation.
2. GREEN: implement defensive Atom parsing/fetch, local SQLite state, CLI, retention and backup boundaries.
3. REFACTOR: add secret redaction and revision-checked editable XLSX surface.
4. Keep public content `DRAFT`; do not add a publisher.
5. Run a live smoke only after a separately verified channel ID is available.

## Acceptance
- Official RSS works without an API key when an enabled verified source exists.
- API mode is optional and fails closed without secure environment configuration.
- Deterministic tests have no network dependency.
- Workbook export/import protects stable IDs and stale revisions.
- A human approves before publication.
