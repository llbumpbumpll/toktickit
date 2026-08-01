# Lab 2 Test Plan and Results

Status: **DRAFT — planned tests, written before implementation per Test-DD.** "Final" column starts as `Planned` and is updated to `Pass`/`Fail` as tests are written and run; nothing here has been implemented yet.

## 1. Test Strategy

Tests are planned bottom-up from the Acceptance Criteria in `specification.md` (§9): every AC must map to at least one row below before implementation starts. Coverage spans six levels, matching the handout's minimum (§9.2):

- **Unit** — pure logic with no DB/HTTP (Ticket Number formatting, validators).
- **API** — Vitest + Supertest against the Express app directly, same pattern as `server/tests/lab-01/*` (import `app`, no server bootstrap needed).
- **UI component** — Vitest + React Testing Library, same pattern as `client/src/App.test.tsx` (mock `fetch`, assert by role/text).
- **UI style** — assertions on required CSS classes/states (required-asterisk, error styling, disabled state) within the same component tests, not a separate tool.
- **Responsive** — Playwright, screenshot-driven, at the three fixed breakpoints (desktop ≥992px, tablet 768–991px, mobile <768px).
- **E2E** — Playwright, full user flows across screens against a running dev stack.

**Note**: Playwright is not yet installed (confirmed during codebase exploration) and must be added as part of the E2E/responsive test setup Issue. The E2E scenarios below are proposed and flagged `[NEEDS APPROVAL]` — per prior discussion, each is to be confirmed case-by-case before being implemented rather than assumed accepted wholesale.

## 2. Planned Tests

### Unit

| Test ID | Type | Requirement/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| UNIT-01 | Unit | BR-29, AC-30 | Ticket Number formatter given a year-month and sequence | Produces `TCK-YYYYMM-####`, zero-padded to 4 digits | `server/src/lib/ticketNumber.test.ts` | Planned |
| UNIT-02 | Unit | BR-09, BR-10 | Summary/Description validators on boundary lengths (4/5/150/151 chars, trimmed) | Accepts 5–150 / 10–5000 inclusive, rejects outside, trims whitespace first | `server/src/lib/validation.test.ts` | Planned |
| UNIT-03 | Unit | BR-16 | Removal-reason validator on boundary lengths (2/3/300/301 chars) | Accepts 3–300 inclusive, rejects outside | `server/src/lib/validation.test.ts` | Planned |
| UNIT-04 | Unit | §5.3 (handout) | Running the Lab 2 seed script twice in a row | Second run creates no duplicate `RequesterUser`/`RelatedSystem` rows (upsert-based, matching the Lab 1 `Category` seed pattern) | `server/prisma/seed.test.ts` | Planned |

### API (Vitest + Supertest)

| Test ID | Type | Requirement/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| API-01 | API | AC-01 | `POST /api/tickets` with fully valid data | `201`; response includes a `TCK-YYYYMM-####` ticketNumber; row persisted | `server/tests/lab-02/create-ticket.api.test.ts` | Planned |
| API-02 | API | AC-08, AC-09, AC-10 | `POST /api/tickets` missing category/relatedSystem, short summary, no priority | `400` with one field error per invalid field | `server/tests/lab-02/create-ticket.api.test.ts` | Planned |
| API-03 | API | AC-30, BR-29 | Two `POST /api/tickets` fired concurrently in the same month | Both succeed with distinct, sequential ticketNumbers, no collision | `server/tests/lab-02/create-ticket.api.test.ts` | Planned |
| API-04 | API | BR-28 | `POST /api/tickets` with missing/invalid/inactive `X-Dev-Requester-Id` | `401 INVALID_REQUESTER` | `server/tests/lab-02/create-ticket.api.test.ts` | Planned |
| API-05 | API | AC-17, BR-21 | `GET /api/tickets?search=laptop` | Only Tickets whose ticketNumber/summary contain "laptop" (case-insensitive) returned | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| API-06 | API | AC-18, BR-24 | `GET /api/tickets?categoryId=<none-matching>` for a Requester who owns Tickets | `200`, `data: []`, `meta.totalItems: 0` | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| API-07 | API | AC-19, BR-24 | `GET /api/tickets` for a Requester who owns zero Tickets | `200`, `data: []`, `meta.totalItems: 0` (client differentiates empty vs. no-results by presence of filter params) | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| API-08 | API | AC-20, BR-23 | `GET /api/tickets?page=2&pageSize=10` with 15 Tickets owned | Second page returns remaining 5, `meta` reflects page 2 of 2 | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| API-09 | API | AC-21, AC-03, BR-06 | `GET /api/tickets` as Requester A vs Requester B with disjoint Ticket sets | Each response contains only the calling Requester's own Tickets | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| API-10 | API | BR-23 | `GET /api/tickets?page=abc&pageSize=999` | Falls back to `page=1`, `pageSize=10`, `200` (no error) | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| API-11 | API | AC-22, AC-29, AC-03, BR-06 | `GET /api/tickets/:id` for an owned vs. another Requester's Ticket | Owned → `200` full Ticket + attachments; not owned → `404` | `server/tests/lab-02/ticket-detail.api.test.ts` | Planned |
| API-12 | API | AC-13, AC-14, BR-12, BR-13 | `POST /api/tickets/:id/attachments` with a `.txt` file, and with a >5MB file | `415` for disallowed type; `413` for oversized file; neither persisted | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-13 | API | AC-15, BR-14 | `POST /api/tickets/:id/attachments` as the 6th active attachment on a Ticket | `409 ATTACHMENT_LIMIT_REACHED` | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-14 | API | AC-24 | `GET /api/attachments/:id/download` for an active, owned Attachment | `200`, correct `Content-Disposition`/`Content-Type`, byte-identical file | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-15 | API | AC-25, AC-26, BR-15 | `DELETE /api/attachments/:id` with a reason, then `GET .../download` on the same id | Delete → `200`, `removed:true`; subsequent download → `410 ATTACHMENT_REMOVED` | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-16 | API | AC-27, BR-16 | `DELETE /api/attachments/:id` with an empty/whitespace-only reason | `400 VALIDATION_ERROR`, attachment remains active | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-27 | API | AC-46, BR-35 | `DELETE /api/attachments/:id` twice in a row (second call on an already-removed Attachment) | Second call returns `409 ALREADY_REMOVED`; `removedAt`/`removedReason` from the first call are unchanged | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-17 | API | AC-03, BR-06 | `GET`/`DELETE` on an Attachment belonging to a Ticket owned by a different Requester | `404` on every attachment endpoint, never `403` | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-18 | API | AC-04, BR-04 | `GET /api/requesters` with a mix of active/inactive seeded rows | Only active Requesters returned | `server/tests/lab-02/requesters.api.test.ts` | Planned |
| API-19 | API | AC-05 | `GET /api/requesters` when zero active Requesters exist | `200`, `[]` | `server/tests/lab-02/requesters.api.test.ts` | Planned |
| API-20 | API | AC-31, BR-30 | `GET /api/tickets?categoryId=X&requestedPriority=Y` where only some Tickets match both | Only Tickets matching both filters returned (AND semantics) | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| API-21 | API | AC-32, BR-30 | `GET /api/tickets?categoryId=999999` (non-existent id) | `200`, `data: []`, no error | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| API-22 | API | AC-33, BR-31 | Deactivate a Requester with existing Tickets, then call any Requester-scoped endpoint with their id | `401` on every call; their Tickets remain in the DB but are unreachable | `server/tests/lab-02/requesters.api.test.ts` | Planned |
| API-23 | API | AC-34, BR-32 | `POST /api/tickets/:id/attachments` with disk write mocked to fail after validation passes | `500`, no Attachment row created (verified via a follow-up `GET /api/tickets/:id`) | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-24 | API | AC-35, AC-37, BR-33 | `GET /api/attachments/:id/preview` for an active PNG, and for the same attachment after soft-removal | Active → `200` with `Content-Disposition: inline`; removed → `410` | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-25 | API | AC-36, BR-33 | `GET /api/attachments/:id/preview` for an active PDF Attachment | `415 PREVIEW_NOT_SUPPORTED` | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-26 | API | AC-38, BR-34 | `GET /api/attachments/:id/download` and `.../preview` for an active row whose file was deleted from disk out-of-band | Both return `500 FILE_UNAVAILABLE`, no crash, no partial stream | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| API-28 | API | AC-47, BR-36 | `GET /api/tickets?requestedPriority=BANANA&categoryId=abc&sortBy=hacked` | `200`, no error — priority/category filters not applied, sort falls back to default | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |

### UI Component + UI Style (Vitest + React Testing Library)

| Test ID | Type | Requirement/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| UI-01 | UI | AC-08 | Submitting Create Ticket with a required field empty | Field-level message rendered, `fetch` not called, other fields retain their values | `client/src/features/lab-02 tests/CreateTicket.test.tsx` | Planned |
| UI-02 | UI | AC-09 | Summary under 5 characters on submit | Field-level length error shown | `.../CreateTicket.test.tsx` | Planned |
| UI-03 | UI | AC-10 | Submit with no Requested Priority chosen | Field-level required error shown, no API call | `.../CreateTicket.test.tsx` | Planned |
| UI-04 | UI | AC-11, BR-18 | Rapid double-click on Submit | Button is `disabled` after first click; `fetch` called exactly once | `.../CreateTicket.test.tsx` | Planned |
| UI-05 | UI | AC-12, BR-20 | `fetch` rejects (simulated network failure) on a valid submit | Error alert shown, all field values still present in the form | `.../CreateTicket.test.tsx` | Planned |
| UI-06 | UI | AC-13, AC-14 | Selecting a `.txt` file, then a >5MB file, as an attachment | Both rejected client-side with a visible message; upload never attempted | `.../CreateTicket.test.tsx` | Planned |
| UI-07 | UI | AC-01 | Full valid submit, mocked `201` response | Confirmation panel shows the returned Ticket Number | `.../CreateTicket.test.tsx` | Planned |
| UI-08 | UI | AC-16, BR-17 | Ticket creation succeeds but one attachment upload mock rejects | Confirmation panel still shows Ticket Number, plus a "failed to upload: X" note with a retry affordance | `.../CreateTicket.test.tsx` | Planned |
| UI-09 | UI Style | FR-17, §3 of ui-spec.md | Required-field asterisk and invalid-field CSS class presence | Asterisk element and `--zg-error`-driven class both present/absent correctly across valid/invalid states | `.../CreateTicket.test.tsx` | Planned |
| UI-10 | UI | AC-02 | Rendering the app with no Requester in session storage and navigating to My Tickets | Redirected/rendered to Requester Selection screen | `client/src/features/lab-02 tests/RequesterSelection.test.tsx` | Planned |
| UI-11 | UI | AC-04, AC-05, AC-06 | Requester Selection with mocked success (2 requesters), empty array, and rejected fetch | Renders dropdown / empty-state / failure-state respectively | `.../RequesterSelection.test.tsx` | Planned |
| UI-12 | UI | AC-07, BR-26 | Clicking "Change Requester" then re-loading My Tickets | Returns to selection screen; previously cached Ticket list is not shown for the next Requester before a fresh load | `.../RequesterSelection.test.tsx` | Planned |
| UI-13 | UI | AC-17, AC-18, AC-19 | MyTickets rendered with search results, zero-match filter results, and zero owned Tickets | Correct list / no-results state / empty state text rendered for each case | `client/src/features/lab-02 tests/MyTickets.test.tsx` | Planned |
| UI-14 | UI | AC-20 | Clicking "Next page" with a mocked two-page response | Second page's rows render; page indicator updates | `.../MyTickets.test.tsx` | Planned |
| UI-15 | UI | AC-21 | Switching the current Requester (mocked) while My Tickets is open | List reloads and shows only the newly selected Requester's Tickets | `.../MyTickets.test.tsx` | Planned |
| UI-16 | UI | AC-22 | Opening Ticket Detail for an owned Ticket (mocked `200`) | All fields render read-only; no editable inputs present | `client/src/features/lab-02 tests/RequesterTicketDetail.test.tsx` | Planned |
| UI-17 | UI | AC-23 | Adding a valid attachment from Ticket Detail (mocked `201`) | New attachment appears in the active list without a full page reload | `.../RequesterTicketDetail.test.tsx` | Planned |
| UI-18 | UI | AC-24 | Clicking Download on an active attachment | Download is triggered against the correct `/api/attachments/:id/download` URL | `client/src/features/lab-02 tests/AttachmentSection.test.tsx` | Planned |
| UI-19 | UI | AC-25, AC-27 | Removing an attachment without a reason, then with a valid reason | Without reason: blocked with validation message. With reason: attachment moves to removed state, Download control becomes disabled | `.../AttachmentSection.test.tsx` | Planned |
| UI-20 | UI | AC-35, AC-36 | Rendering an active PNG attachment vs. an active PDF attachment | PNG row shows a Preview control; PDF row shows no Preview control, only Download | `.../AttachmentSection.test.tsx` | Planned |
| UI-21 | UI | AC-33 | My Tickets / Requester Selection with a mocked `401` response from a Requester-scoped call | Client returns to Requester Selection screen | `client/src/features/lab-02 tests/RequesterSelection.test.tsx` | Planned |
| UI-22 | UI | AC-39 | Uploading a file with simulated `XMLHttpRequest.upload.onprogress` events at 25/50/75/100% | Progress bar reflects each reported percentage in order | `.../CreateTicket.test.tsx` | Planned |
| UI-23 | UI | AC-38 | Download/Preview click mocked to return `500 FILE_UNAVAILABLE` | "File currently unavailable" message shown, attachment row remains, no broken download attempted | `.../AttachmentSection.test.tsx` | Planned |
| UI-24 | UI | AC-40 | MyTickets with `meta.totalPages: 1`, then with `meta: {page: 1, totalPages: 3}`, then `{page: 3, totalPages: 3}` | Pagination hidden; Prev disabled on page 1; Next disabled on page 3 | `.../MyTickets.test.tsx` | Planned |
| UI-25 | UI | AC-41 | Rendering Create Ticket / Ticket Detail with 5 active attachments already present | "Add Attachment" control is disabled with "Maximum 5 attachments reached" before any file is selected | `.../CreateTicket.test.tsx`, `.../AttachmentSection.test.tsx` | Planned |
| UI-26 | UI | AC-42 | Rendering one attachment in each of Uploading, Invalid, and Removed states | No Remove control present in any of the three | `.../AttachmentSection.test.tsx` | Planned |
| UI-27 | UI | AC-43 | MyTickets toolbar with no filters set, then with one filter set | "Clear filters" disabled in the first case, enabled in the second | `.../MyTickets.test.tsx` | Planned |
| UI-28 | UI | AC-45 | Create Ticket / My Tickets filter panel with a mocked failed `GET /api/categories` | Full-screen failure state shown instead of a partially-loaded form/filter panel | `.../CreateTicket.test.tsx`, `.../MyTickets.test.tsx` | Planned |

### Responsive (Playwright)

| Test ID | Type | Requirement/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| RESP-01 | Responsive | AC-28 | Create Ticket screenshotted at 375px, 820px, 1280px widths | No clipped fields/buttons, no horizontal scroll, screenshots saved | `e2e/lab-02/responsive.spec.ts` | Planned |
| RESP-02 | Responsive | AC-28 | My Tickets screenshotted at the same three widths, including the table→card switch | Card layout below 768px, table above; no overflow | `e2e/lab-02/responsive.spec.ts` | Planned |
| RESP-03 | Responsive | AC-28 | Ticket Detail screenshotted at the same three widths | Attachment block remains usable, no overlap | `e2e/lab-02/responsive.spec.ts` | Planned |
| RESP-04 | Responsive | AC-44 | Clicking Preview on an image attachment at a 375px viewport vs. a 1280px viewport | Mobile opens a new tab; desktop opens an in-page lightbox | `e2e/lab-02/responsive.spec.ts` | Planned |

### E2E (Playwright) — `[NEEDS APPROVAL]`, confirm scope before implementing each

| Test ID | Type | Requirement/AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| E2E-01 | E2E | AC-01, AC-17 | Select a Requester, create a Ticket, search for it in My Tickets by Summary text | Ticket found in My Tickets after creation, matching the shown Ticket Number | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |
| E2E-02 | E2E | AC-03, AC-29, AC-21 | Create a Ticket as Requester A, switch to Requester B, attempt to open A's Ticket by URL | A's Ticket is not visible in B's My Tickets, and direct navigation to A's Ticket Detail URL is denied | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |
| E2E-03 | E2E | AC-23, AC-24, AC-25, AC-26 | From Ticket Detail: add an attachment, download it, remove it with a reason, attempt to download the removed one | Add succeeds, download succeeds, removal succeeds with metadata retained, post-removal download is blocked | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |
| E2E-04 | E2E | AC-05 | Simulate zero active Requesters (seed override) and load the app | Requester Selection shows the empty state; no further screen is reachable | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |

## 3. Acceptance-Criterion Traceability

| AC | Covered by |
|---|---|
| AC-01 | API-01, UI-07, E2E-01 |
| AC-02 | UI-10 |
| AC-03 | API-09, API-11, API-17, E2E-02 |
| AC-04 | API-18, UI-11 |
| AC-05 | API-19, UI-11, E2E-04 |
| AC-06 | UI-11 |
| AC-07 | UI-12 |
| AC-08 | API-02, UI-01 |
| AC-09 | API-02, UI-02 |
| AC-10 | API-02, UI-03 |
| AC-11 | UI-04 |
| AC-12 | UI-05 |
| AC-13 | API-12, UI-06 |
| AC-14 | API-12, UI-06 |
| AC-15 | API-13 |
| AC-16 | UI-08 |
| AC-17 | API-05, UI-13, E2E-01 |
| AC-18 | API-06, UI-13 |
| AC-19 | API-07, UI-13 |
| AC-20 | API-08, UI-14 |
| AC-21 | API-09, UI-15, E2E-02 |
| AC-22 | API-11, UI-16 |
| AC-23 | UI-17, E2E-03 |
| AC-24 | API-14, UI-18, E2E-03 |
| AC-25 | API-15, UI-19, E2E-03 |
| AC-26 | API-15, E2E-03 |
| AC-27 | API-16, UI-19 |
| AC-28 | RESP-01, RESP-02, RESP-03, UI-09 |
| AC-29 | API-11, E2E-02 |
| AC-30 | API-03, UNIT-01 |
| AC-31 | API-20 |
| AC-32 | API-21 |
| AC-33 | API-22, UI-21 |
| AC-34 | API-23 |
| AC-35 | API-24, UI-20 |
| AC-36 | API-25, UI-20 |
| AC-37 | API-24 |
| AC-38 | API-26, UI-23 |
| AC-39 | UI-22 |
| AC-40 | UI-24 |
| AC-41 | UI-25 |
| AC-42 | UI-26 |
| AC-43 | UI-27 |
| AC-44 | RESP-04 |
| AC-45 | UI-28 |
| AC-46 | API-27 |
| AC-47 | API-28 |

## 4. Responsive and Visual Checklist

See `ui-spec.md` §13 — reproduced and checked off here once RESP-01/02/03/04 pass, alongside the screenshot paths under `artifacts/lab-02/screenshots/`.

## 5. Test Commands

```bash
# Server (unit + API)
cd server
npm run test

# Client (unit + UI component + UI style)
cd client
npm run test

# E2E + responsive (Playwright — to be added)
npx playwright test e2e/lab-02
```

## 6. Final Results

Not yet run — all rows above are `Planned`. This section is updated with actual pass/fail counts and a `main`-branch test-output excerpt once implementation lands, per the Definition of Done in `specification.md` §10.

## 7. Known Limitations or Deferred Tests

- No idempotency-key test for duplicate Ticket submission beyond the client-side busy-button guard (BR-18) — accepted as an explicit Lab 2 scope limit, not a gap to silently ignore.
- Load/performance testing of pagination and search at large data volumes is out of scope for Lab 2.
- E2E rows are proposed, not yet approved individually — see the `[NEEDS APPROVAL]` note in §2.
