# Lab 2 UI Specification — Zen Green Theme

Status: **DRAFT — pending student review and approval.**

Built on the existing Bootstrap 5 setup (`client/src/main.tsx` already imports Bootstrap CSS) via CSS custom-property overrides in `client/src/index.css` — this is a re-theme, not a framework swap.

## 1. Color Tokens

| Token | Value | Use |
|---|---|---|
| `--zg-primary` | `#006B3C` | App header, primary buttons, strong emphasis. |
| `--zg-secondary` | `#0B7A46` | Active tabs, focus rings, links, hover states. |
| `--zg-pale` | `#EAF6EF` | Selected rows, success backgrounds, subtle section emphasis. |
| `--zg-bg` | `#F5F7F6` | Page background. |
| `--zg-surface` | `#FFFFFF` | Cards/panels, with a subtle border (`1px solid #DDE5E1`) and restrained shadow. |
| `--zg-text` | `#1F2E28` | Dark charcoal-green body text (not pure black). |
| `--zg-field-editable-bg` | `#FFFFFF` | Editable field background, neutral border `#C9D3CE`. |
| `--zg-field-readonly-bg` | `#F1EFE7` | Read-only field background (warm ivory), clearly distinct from editable. |
| `--zg-error` | `#8A1F1F` | Error text/border, dark red. |
| `--zg-warning` | `#B8860B` | Amber warning callouts/badges — used only for genuine warnings, never decoration. |
| `--zg-success` | `#0B7A46` | Success confirmation text, paired with an icon/label, never color alone. |

These override Bootstrap's default `--bs-primary` etc. rather than replacing Bootstrap classes, so existing `btn btn-primary`, `alert`, `badge`, and form classes automatically pick up Zen Green.

## 2. Typography & Spacing

- Base font: system font stack already in `index.css`; body text `--zg-text` at 1rem/1.5 line-height.
- Headings use `--zg-primary` for H1 (page/section titles), `--zg-text` for H2/H3.
- Spacing scale: Bootstrap's default spacing utilities (`gap-2`, `gap-3`, `p-3`, etc.) — no custom scale introduced, to keep the surface area small for a foundation sprint.

## 3. Component States

| State | Rule |
|---|---|
| Editable field | White bg, neutral border; on focus, border becomes `--zg-secondary` with a visible focus ring (keyboard-accessible). |
| Read-only field | `--zg-field-readonly-bg`, no border-on-focus behavior, `aria-readonly="true"`, still legible (not grayed to the point of low contrast). |
| Required field | Label carries a red asterisk (`<span class="text-danger">*</span>`) immediately after the label text. The asterisk never substitutes for the validation message. |
| Invalid field | Border becomes `--zg-error`; a message in `--zg-error` renders directly below the field, not only in a page-top banner. |
| Disabled control | Reduced opacity (Bootstrap `disabled` default), `cursor: not-allowed`, cannot receive focus or activate. |
| Focus (keyboard) | Visible outline on every interactive element; never removed with `outline: none` without a replacement. |
| Busy (Submit button) | Spinner + "Submitting…" text replaces the label; button is `disabled` for the duration of the request (BR-18). |
| Success banner | `--zg-pale` background, `--zg-success` text/icon, states the concrete result (e.g. the Ticket Number), not just "Success". |

### Button hierarchy

- **Primary** (`btn-primary`, Zen Green): the one main action per screen (Submit, Continue).
- **Secondary** (`btn-outline-secondary`): supporting actions (Cancel, Change Requester).
- **Tertiary** (plain link-styled button): low-emphasis actions (Clear filters).
- **Destructive** (`btn-outline-danger`, uses `--zg-error`): Remove Attachment.
- All buttons show visible text; icons (bootstrap-icons, already installed) may accompany but never replace text. Icon-only controls (e.g. a small download icon button) require `aria-label` and a `title` tooltip.

## 4. Application Shell

- Top bar: TokTickIT wordmark/logo (left, links to My Tickets), `--zg-primary` background, white text.
- Nav items: My Tickets, Create Ticket — active item distinguished by full-opacity white text + semibold weight against the primary-green bar, not a `--zg-secondary` highlight: `--zg-secondary` (#0B7A46) on `--zg-primary` (#006B3C) is a 1.23:1 contrast ratio, well under WCAG's 3:1 minimum for a UI-state indicator, so it would be effectively invisible here. `--zg-secondary` is reserved for contexts with adequate contrast against it (links, focus rings, form-control focus borders, and future tab strips on light/white surfaces).
- Right side: current Requester's name + "Change Requester" link/button, both hidden until a Requester is selected.
- **Mobile (<768px)**: nav collapses behind a hamburger toggle (Bootstrap's `navbar-toggler`); Requester display moves into the collapsed menu.

## 5. Screen: Development Requester Selection

Route: `/select-requester` (default route when no Requester is stored in session storage).

- TokTickIT title/logo, centered card on `--zg-bg`.
- Explanatory text (fixed by handout): *"Select a Development Requester to test requester-specific ticket behavior. This is not a login screen. Authentication and role-based access will be introduced in Lab 3."*
- `<select>` dropdown of active Requesters (`name` + `email` as the visible option label), keyboard-navigable native select.
- **States**:
  - Loading: skeleton/spinner in place of the dropdown, "Loading Requesters…".
  - Empty (BR-25): message "No active Development Requesters are available. Contact your instructor." Continue button disabled.
  - API failure (AC-06): "Unable to load Requesters. [Retry]" — no raw error text shown.
  - Loaded: dropdown enabled, Continue button enabled once a value is chosen.
- On Continue: store `{id, name, email}` in `sessionStorage`, navigate to `/tickets` (My Tickets).

## 6. Screen: Create Ticket (create mode)

Route: `/tickets/new`.

Layout (desktop, top to bottom):
1. **System-generated row** (read-only, visually distinct via `--zg-field-readonly-bg`): Ticket Number ("Generated after submission"), Ticket Date ("Set automatically"), Requester (current Requester's name).
2. **Classification group**: Category (`<select>`), Related System (`<select>`) — side by side on desktop/tablet, stacked on mobile.
3. **Requested Priority**: segmented control or `<select>` with no default selection (BR-11) — placeholder "Select priority".
4. **Ticket Summary**: single-line text input, full width, character counter (x/150).
5. **Description**: multi-line `<textarea>`, full width, taller than other fields, vertically resizable only (does not break layout), character counter (x/5000).
6. **Attachments**: file picker below the main fields (label carries **no required-asterisk** — Attachments are optional at creation per `specification.md` §5.1), accepts `.jpg,.jpeg,.png,.webp,.pdf`, shows selected-file chips with name/size and a remove-before-upload control; inline error per rejected file (wrong type / too large / limit reached). Once a file starts uploading, its chip shows a real percentage progress bar (`0–100%`, driven by `XMLHttpRequest.upload.onprogress` — see `specification.md` §11) in place of the remove control until the request settles. Once 5 files are attached in the current session, the file-picker control disables itself with the note "Maximum 5 attachments reached" — proactively, before any upload is attempted, not only after a rejected attempt (the server-side check in BR-14 remains the source of truth as defense-in-depth, AC-15).
7. **Actions**: primary "Submit Ticket" (busy state per BR-18) + secondary "Cancel" (returns to My Tickets), bottom-right on desktop, full-width stacked on mobile.

### States

- Validation error: field-level messages per §3; Summary/Description show counters turning `--zg-error` when out of range.
- Submitting: Submit busy, all fields disabled to prevent edits mid-submit.
- Success: replaces the form with a confirmation panel (`--zg-pale`) showing the Ticket Number and two actions — "View Ticket" and "Create Another".
- Partial attachment failure (BR-17/AC-16): confirmation panel additionally lists which files failed with a "Retry from Ticket Detail" link.
- API failure: `--zg-error` alert above the form, form values intact (BR-20).
- **Reference-data load failure**: if `GET /api/categories` or `GET /api/related-systems` fails while the screen is loading, the entire Create Ticket form is replaced by a full-screen failure state (same pattern as Requester Selection's API-failure state, §5) with a Retry action — the form is not shown partially-broken with an empty Category/Related System dropdown.

## 7. Screen: My Tickets (list mode)

Route: `/tickets`.

- **Toolbar**: search input (Ticket Number/Summary), filter controls (Category, Related System, Requested Priority, Status) as a `<select>` group, "Clear filters" tertiary action, "Create Ticket" primary button (top-right on desktop, full-width on mobile). "Clear filters" is disabled (or hidden) whenever no search term and no filter is currently set, and becomes enabled the moment any one of them is set — it is never a no-op click. If Category/Related System options themselves fail to load, the same full-screen reference-data failure state as Create Ticket (§6) is shown, since filters can't be trusted without them.
- **Desktop (≥992px)**: table with columns — Ticket Number, Summary, Category, Requested Priority (badge), Current Status (badge), Ticket Date, opens Ticket Detail on row click.
- **Mobile (<768px)**: each Ticket renders as a stacked card (Ticket Number + Status badge on top row, Summary below, Category/Priority/Date as labeled mini-rows) — no horizontal table scrolling.
- **Sorting**: clickable column headers (desktop) / a sort `<select>` (mobile) mapped to `sortBy`/`sortDir`.
- **Pagination**: page-size `<select>` (10/20/50) + prev/next + current-page indicator, bottom of list. Prev is disabled on page 1, Next is disabled on the last page; if `meta.totalPages ≤ 1` the entire pagination control is hidden — there is nothing to page through.
- **States**:
  - Loading: skeleton rows/cards.
  - Empty (BR-24, AC-19): "You haven't created any tickets yet." + "Create Ticket" call to action.
  - No-results (BR-24, AC-18): "No tickets match your filters." + "Clear filters" action — visually distinct copy from the empty state.
  - API failure: `--zg-error` alert + Retry.

## 8. Screen: Requester Ticket Detail (view mode)

Route: `/tickets/:id`.

- **Header**: Ticket Number (large, prominent), Current Status badge, "Back to My Tickets" link.
- **Ticket information block** (all read-only, `--zg-field-readonly-bg` styling): Category, Related System, Requested Priority (badge), Ticket Date, Summary, Description (full width, preserves line breaks).
- **Attachments block**, visually separated (card with its own heading "Attachments") from the Ticket information block. Every attachment row is in exactly one of five states, each with a specific, deliberately limited set of available controls — no state offers a control that would be rejected if used:

  | State | Preview | Download | Remove | Notes |
  |---|---|---|---|---|
  | Active (image) | ✅ | ✅ | ✅ | Thumbnail + filename/size/uploaded date. |
  | Active (PDF) | ❌ (no control shown) | ✅ | ✅ | Generic file icon, no thumbnail (BR-33, AC-36). |
  | Uploading | ❌ | ❌ | ❌ | Only the percentage progress bar (§6) is shown — no action is possible on a row that doesn't exist server-side yet (AC-39). |
  | Invalid (rejected pre-upload) | ❌ | ❌ | ❌ (dismiss only) | Never reaches the server; only a dismiss control clears the chip (AC-13, AC-14, AC-15). |
  | Removed | disabled "Removed" label | disabled "Removed" label | ❌ (already removed, nothing to remove again) | Metadata + "Removed <date> — <reason>" caption remain visible (AC-37). |
  | Unavailable (file missing, BR-34) | inline `--zg-error` message, no working link | inline `--zg-error` message, no working link | ✅ (removal doesn't require the file to exist) | "File currently unavailable. Please try again later." (AC-38). Rare defensive state, not an expected path. |

  Preview behavior: on desktop/tablet, Preview opens the image inline in a lightbox over the current page; on **mobile (<768px)**, Preview opens the image in a new browser tab instead, since a modal lightbox does not fit reliably in a small viewport (see §11 Responsive Rules).

  "Add Attachment" control at the bottom of the block, reusing the same file-picker component as Create Ticket (including its uploading-progress and proactive 5-attachment-limit behavior from §6).
- No Comments, Internal Notes, Actions Taken, or status-change controls anywhere on this screen (explicitly excluded scope).

## 9. Screen Modes

Lab 2 has exactly two screen modes, no more:

| Mode | Screens | Notes |
|---|---|---|
| **Create** | Create Ticket | The only screen where Ticket fields are entered/editable. Once submitted, a Ticket's fields are fixed. |
| **View** | My Tickets, Requester Ticket Detail | Read-only for Ticket fields. Ticket Detail additionally allows mutable *Attachment* actions (add/download/preview/remove) — these are inline actions on an otherwise read-only screen, not a separate "edit mode" for the Ticket itself. |

There is **no Edit mode for Ticket fields** in Lab 2 (no comments, status changes, or field edits are in scope — see `specification.md` §3 Excluded). Every mode/state transition surfaces one of: loading, validation-error, submitting, success, empty, no-results, or failure feedback, per screen, as detailed in §6–§8 above.

## 10. Badges

| Badge | Values → color |
|---|---|
| Requested Priority | `LOW` gray, `MEDIUM` `--zg-secondary`, `HIGH` `--zg-warning`, `URGENT` `--zg-error` — each badge also carries the text label, never color alone. |
| Current Status | `NEW` → `--zg-pale` background with `--zg-primary` text (only value in Lab 2). |

## 11. Responsive Rules

| Viewport | Behavior |
|---|---|
| Desktop ≥ 992px | Multi-column layout as described per screen; content max-width ~1140px, centered. |
| Tablet 768–991px | Two-column layout where practical (e.g. Category/Related System pair); Summary/Description keep full available width. |
| Mobile < 768px | All fields stack vertically; buttons full-width and touch-sized (min 44px height); table screens switch to card layout; no horizontal page scroll anywhere; image Attachment Preview opens in a new tab instead of an in-page lightbox (§8). |
| All sizes | No clipped labels, no overlapping messages/controls, no hidden buttons, attachment filenames truncate with ellipsis + full name on hover/focus rather than overflowing. |

## 12. Accessibility

- Every form control has an associated `<label>` (not placeholder-only).
- Icon-only controls carry `aria-label` + `title`.
- Focus order follows visual/reading order; focus indicators are never suppressed.
- Priority/Status are never conveyed by color alone — always paired with text.
- Error messages are associated to their field via `aria-describedby`.

## 13. Visual Inspection Checklist (§8.8 of handout)

- [ ] Desktop, tablet, and mobile Playwright screenshots captured for Create Ticket, My Tickets, Ticket Detail.
- [ ] No clipped labels/buttons at any breakpoint.
- [ ] No overlapping controls or messages.
- [ ] No unintended horizontal scrolling at any breakpoint.
- [ ] Editable vs. read-only field styling is visually distinct and consistent across all screens.
- [ ] Required-field asterisk present on every required field; validation message present on every invalid field.
- [ ] Priority and Status badges render consistently across My Tickets and Ticket Detail.
- [ ] Filters, pagination, attachment controls, and empty/no-results states remain usable (not clipped/overlapping) at all three breakpoints.
- [ ] All five attachment states (active, uploading, invalid, removed, unavailable) render distinctly and legibly at every breakpoint.
- [ ] Screenshots stored under `artifacts/lab-02/screenshots/{create-ticket,my-tickets,ticket-detail}/`.
