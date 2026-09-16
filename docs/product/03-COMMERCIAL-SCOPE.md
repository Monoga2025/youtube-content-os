---
artifact: commercial-scope
phase: 3
status: approved
reason: "Internal product: commercial terms are replaced by an explicit operating ownership and cost boundary."
last_updated: "2026-09-15"
---
# 03 — Internal delivery scope

## Promised result
A private, operable MVP that stages one grounded weekly YouTube mission for Daniel's approval without scraping third-party media, exposing private data, or publishing autonomously.

## Included deliverables
- Project OS product, UX, architecture, data, build, and verification artifacts.
- Source-cited strategy, weekly operating schedule, mission-brief template, compliance boundary.
- Apps Script/Google Sheet vertical slice with configurable allowlist, raw signal storage, dedupe, logs, human notes, and approval states.
- Setup/runbook, automated local tests for pure logic, and manual Apps Script verification checklist.

## Excluded
- Google/YouTube account creation or paid services; production API credentials.
- Channel ID guessing, transcript/video scraping, comment identity collection, auto-publication.
- Guaranteed audience growth, dates, or invented performance targets.
- Multi-user SaaS, custom web/mobile application, database, AI vendor, or derived-metrics approval application.

## Acceptance milestones
| Milestone | Evidence | Approver |
|---|---|---|
| Product plan | Phases 1–11 pass native gates | Daniel |
| Vertical Slice 0 | Tests pass; sheet flow and failure policy documented | Daniel |
| Production enablement | Real account/key/IDs configured, manual UAT and privacy approval | Daniel |

## Ownership and responsibilities
- Grupo Monoga/Daniel owns repository, Sheet, Apps Script project, Google Cloud project, API credentials, data, briefs, and generated content.
- Daniel verifies channel IDs, supplies sanitized evidence, reviews outputs, approves publication, monitors quotas, and revokes access when needed.
- Source code must not contain credentials. Third-party data remains subject to YouTube/Google terms.

## Cost and support boundary
| Item | Initial/recurrent cost | Owner |
|---|---|---|
| Repository and local tests | $0 direct service cost | Grupo Monoga |
| YouTube Data API within project quota | $0 assumed; quota-limited, verify current terms | Grupo Monoga |
| Google Apps Script/Sheet within account quotas | $0 assumed; quota-limited, verify current terms | Grupo Monoga |
| Optional LLM/editor/tools | Not included; explicit future decision | Daniel |

There is no external project price, invoice, warranty, or unlimited support commitment. Maintenance is owner-operated: weekly execution review, monthly source/policy review, and change requests recorded before scope expansion.

## Change policy
Every new capability enters `CHANGE_REQUESTS.md`, receives product/privacy/quota impact analysis, and is not implemented implicitly.

## Gate
- [x] Included and excluded scope are clear.
- [x] Deliverables have acceptance evidence.
- [x] Revisions are bounded by explicit milestones and change control.
- [x] Recurring costs have an owner.
- [x] Account and data ownership is defined.
- [x] Support and maintenance are not confused.
- [x] A change process exists.
