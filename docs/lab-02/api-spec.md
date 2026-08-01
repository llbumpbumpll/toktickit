# Lab 2 API Contract

Status: **DRAFT — pending student review and approval.**

Base URL: `http://localhost:5080/api`

## Conventions

- All responses are JSON except `GET /api/attachments/:id/download`, which streams the file with `Content-Disposition: attachment`.
- All Requester-scoped endpoints (everything below except `GET /api/requesters`, `GET /api/categories`, and `GET /api/related-systems` — these three are unauthenticated) require an `X-Dev-Requester-Id: <id>` header. If it is missing, non-numeric, refers to a non-existent Requester, or refers to an inactive Requester, the endpoint returns `401 Unauthorized` before any other validation runs (BR-27, BR-28):
  ```json
  { "error": { "code": "INVALID_REQUESTER", "message": "Select a Development Requester to continue." } }
  ```
- Ownership failures (a Ticket/Attachment exists but does not belong to the calling Requester) return `404 Not Found`, identical in shape to a genuinely missing resource (BR-06):
  ```json
  { "error": { "code": "NOT_FOUND", "message": "Ticket not found." } }
  ```
- Validation failures return `400 Bad Request` with one entry per invalid field:
  ```json
  { "error": { "code": "VALIDATION_ERROR", "fields": { "summary": "Summary must be 5-150 characters." } } }
  ```
- Unexpected server errors return `500 Internal Server Error` with a safe, non-leaking message:
  ```json
  { "error": { "code": "INTERNAL_ERROR", "message": "Something went wrong. Please try again." } }
  ```

---

## 1. `GET /api/requesters`

Retrieve active Development Requesters for the selection screen.

- **Auth**: none (this is how identity is first established).
- **Response** `200`:
  ```json
  [
    { "id": 1, "name": "Aran Suksawat", "email": "aran.s@example.edu" },
    { "id": 2, "name": "Bhumi Chaiyasit", "email": "bhumi.c@example.edu" }
  ]
  ```
- Inactive Requesters are excluded entirely (BR-04).
- `500` on unexpected DB failure.

## 2. `GET /api/categories`

Unchanged from Lab 1.

- **Auth**: none.
- **Response** `200`: `[{ "id": 1, "name": "Hardware" }, ...]`.

## 3. `GET /api/related-systems`

- **Auth**: none.
- **Response** `200`: `[{ "id": 1, "name": "Email" }, ...]`.

## 4. `POST /api/tickets`

Create a Ticket for the calling Requester.

- **Auth**: `X-Dev-Requester-Id` required.
- **Request body**:
  ```json
  {
    "categoryId": 2,
    "relatedSystemId": 5,
    "summary": "Laptop battery drains quickly",
    "description": "Battery drops from 100% to 20% within two hours of normal use.",
    "requestedPriority": "MEDIUM"
  }
  ```
- **Validation** (`400` on failure, all field errors returned together per BR-19):
  - `categoryId`, `relatedSystemId`: required, must reference an existing row (`404`-style field error if not found — returned as a `400 VALIDATION_ERROR`, not a top-level `404`, since the Ticket resource itself doesn't exist yet).
  - `summary`: required, trimmed, 5–150 chars (BR-09).
  - `description`: required, trimmed, 10–5000 chars (BR-10).
  - `requestedPriority`: required, one of `LOW`/`MEDIUM`/`HIGH`/`URGENT` (BR-11).
- **Response** `201`:
  ```json
  {
    "id": 42,
    "ticketNumber": "TCK-202608-0007",
    "requesterId": 1,
    "categoryId": 2,
    "relatedSystemId": 5,
    "summary": "Laptop battery drains quickly",
    "description": "Battery drops from 100% to 20% within two hours of normal use.",
    "requestedPriority": "MEDIUM",
    "currentStatus": "NEW",
    "createdAt": "2026-08-01T09:12:33.000Z"
  }
  ```
- Ticket Number is generated per BR-29 (monthly atomic counter); never client-supplied.
- Attachments are **not** part of this request body — they are added afterward via endpoint 7, one file per call, so a single large multipart Ticket-creation request never partially fails (BR-17).
- `500` on unexpected server error; form values are the client's responsibility to preserve (BR-20).

## 5. `GET /api/tickets`

List the calling Requester's own Tickets with search, filter, sort, and pagination.

- **Auth**: `X-Dev-Requester-Id` required.
- **Query parameters**:

  | Param | Type | Default | Notes |
  |---|---|---|---|
  | `search` | string | — | Case-insensitive substring match against `ticketNumber` OR `summary` (BR-21). |
  | `categoryId` | int | — | Filter to one Category. Non-numeric/malformed is ignored, not an error (BR-36). |
  | `relatedSystemId` | int | — | Filter to one Related System. Non-numeric/malformed is ignored, not an error (BR-36). |
  | `requestedPriority` | `LOW\|MEDIUM\|HIGH\|URGENT` | — | Filter to one priority. Any other value is ignored, not an error (BR-36). |
  | `status` | `NEW` | — | Filter to one Current Status. Only `NEW` is a valid value in Lab 2; any other value is ignored, not an error (BR-36). |
  | `sortBy` | `ticketDate\|ticketNumber\|summary\|requestedPriority` | `ticketDate` | See BR-22 for default/secondary sort. Any other value falls back to the default (BR-36). |
  | `sortDir` | `asc\|desc` | `desc` | Any other value falls back to the default (BR-36). |
  | `page` | int ≥ 1 | `1` | Out-of-range or non-numeric falls back to `1` (BR-23), never errors. |
  | `pageSize` | `10\|20\|50` | `10` | Any other value falls back to `10` (BR-23). |

  All filter params combine with AND. A `categoryId`/`relatedSystemId` that does not reference an existing row is not an error — it simply matches zero Tickets (BR-30). Every parameter on this endpoint is forgiving: nothing sent to `GET /api/tickets` ever produces a `400` (BR-36) — malformed input degrades to "no filter"/"default sort", never an error.

- **Response** `200`:
  ```json
  {
    "data": [
      {
        "id": 42,
        "ticketNumber": "TCK-202608-0007",
        "summary": "Laptop battery drains quickly",
        "category": { "id": 2, "name": "Hardware" },
        "relatedSystem": { "id": 5, "name": "Corporate Laptop" },
        "requestedPriority": "MEDIUM",
        "currentStatus": "NEW",
        "createdAt": "2026-08-01T09:12:33.000Z"
      }
    ],
    "meta": { "page": 1, "pageSize": 10, "totalItems": 1, "totalPages": 1 }
  }
  ```
- An empty `data` array with `totalItems: 0` is returned both for the empty-state and no-results-state cases (BR-24); the client distinguishes them by checking whether any search/filter params were supplied.
- `500` on unexpected server error.

## 6. `GET /api/tickets/:id`

Retrieve one Ticket owned by the calling Requester, including its Attachments.

- **Auth**: `X-Dev-Requester-Id` required.
- **Response** `200`:
  ```json
  {
    "id": 42,
    "ticketNumber": "TCK-202608-0007",
    "requesterId": 1,
    "category": { "id": 2, "name": "Hardware" },
    "relatedSystem": { "id": 5, "name": "Corporate Laptop" },
    "summary": "Laptop battery drains quickly",
    "description": "Battery drops from 100% to 20% within two hours of normal use.",
    "requestedPriority": "MEDIUM",
    "currentStatus": "NEW",
    "createdAt": "2026-08-01T09:12:33.000Z",
    "attachments": [
      {
        "id": 9,
        "originalFilename": "battery-report.pdf",
        "mimeType": "application/pdf",
        "sizeBytes": 240218,
        "uploadedAt": "2026-08-01T09:13:01.000Z",
        "removed": false,
        "removedAt": null,
        "removedReason": null
      }
    ]
  }
  ```
- `404` if the Ticket does not exist or is not owned by the calling Requester (BR-06, AC-03, AC-29).

## 7. `POST /api/tickets/:id/attachments`

Add one Attachment to an existing owned Ticket.

- **Auth**: `X-Dev-Requester-Id` required.
- **Request**: `multipart/form-data`, single field `file`.
- **Validation**:
  - Ticket must exist and be owned by the caller — `404` otherwise.
  - File extension/MIME must be JPG, JPEG, PNG, WEBP, or PDF (BR-12) — `415 Unsupported Media Type` otherwise.
  - File size must be ≤ 5 MB (BR-13) — `413 Payload Too Large` otherwise.
  - Ticket must currently have fewer than 5 active Attachments (BR-14) — `409 Conflict` otherwise:
    ```json
    { "error": { "code": "ATTACHMENT_LIMIT_REACHED", "message": "This ticket already has 5 active attachments." } }
    ```
- **Write order (BR-32)**: the file is written to `server/uploads/` first; the Attachment DB row is created only after that write succeeds. If the disk write fails, the endpoint returns `500` and no Attachment row is created — the Ticket itself is unaffected.
- **Response** `201`:
  ```json
  {
    "id": 10,
    "ticketId": 42,
    "originalFilename": "screenshot.png",
    "mimeType": "image/png",
    "sizeBytes": 88213,
    "uploadedAt": "2026-08-01T10:02:11.000Z",
    "removed": false
  }
  ```

## 8. `GET /api/attachments/:id`

Retrieve Attachment metadata (used by Ticket Detail; does not stream the file).

- **Auth**: `X-Dev-Requester-Id` required.
- **Response** `200`: same shape as one entry in endpoint 6's `attachments` array.
- `404` if the Attachment does not exist or its parent Ticket is not owned by the caller.

## 9. `GET /api/attachments/:id/download`

Download the file for an **active** Attachment.

- **Auth**: `X-Dev-Requester-Id` required.
- **Response** `200`: binary stream, `Content-Disposition: attachment; filename="<originalFilename>"`, correct `Content-Type` from stored `mimeType`.
- `404` if the Attachment does not exist or is not owned by the caller.
- `410 Gone` if the Attachment exists, is owned by the caller, but has been soft-removed (BR-15, AC-26) — distinguishes "this was deliberately taken down" from "this never existed":
  ```json
  { "error": { "code": "ATTACHMENT_REMOVED", "message": "This attachment has been removed and is no longer available." } }
  ```
- `500` if the Attachment row is active but its file is missing from disk (BR-34, AC-38) — checked with a filesystem existence check immediately before streaming:
  ```json
  { "error": { "code": "FILE_UNAVAILABLE", "message": "This file is currently unavailable. Please try again later." } }
  ```

## 10. `GET /api/attachments/:id/preview`

Render an **active image** Attachment inline in the browser (BR-33).

- **Auth**: `X-Dev-Requester-Id` required.
- **Response** `200`: binary stream, `Content-Disposition: inline`, correct `Content-Type` (`image/jpeg`, `image/png`, or `image/webp`).
- `404` if the Attachment does not exist or is not owned by the caller.
- `410 Gone` if the Attachment is owned by the caller but has been soft-removed (same rule as download, AC-37).
- `500 FILE_UNAVAILABLE` if the Attachment row is active but its file is missing from disk (same defensive check as download, BR-34, AC-38).
- `415 Unsupported Media Type` if the Attachment's `mimeType` is `application/pdf` — PDFs have no preview, only download:
  ```json
  { "error": { "code": "PREVIEW_NOT_SUPPORTED", "message": "This file type cannot be previewed. Download it instead." } }
  ```

## 11. `DELETE /api/attachments/:id`

Soft-remove an active Attachment.

- **Auth**: `X-Dev-Requester-Id` required.
- **Request body**:
  ```json
  { "reason": "Uploaded the wrong file by mistake." }
  ```
- **Validation**:
  - `reason`: required, trimmed, 3–300 chars (BR-16) — `400` otherwise.
  - Attachment must exist and be owned by the caller — `404` otherwise.
  - Attachment must not already be removed (BR-35) — `409 Conflict` otherwise, and the original `removedAt`/`removedReason` are left untouched:
    ```json
    { "error": { "code": "ALREADY_REMOVED", "message": "This attachment was already removed." } }
    ```
- **Response** `200`: updated Attachment metadata with `removed: true`, `removedAt`, `removedReason` populated.

---

## HTTP Status Summary

| Status | Used for |
|---|---|
| `200` | Successful retrieval, successful soft-remove. |
| `201` | Ticket created; Attachment uploaded. |
| `400` | Invalid input (missing/malformed fields). |
| `401` | Missing/invalid/inactive `X-Dev-Requester-Id`. |
| `404` | Resource does not exist, or exists but is not owned by the caller. |
| `409` | Conflict — attachment limit reached, or attachment already removed. |
| `410` | Resource existed and was deliberately removed (soft-removed attachment download/preview). |
| `413` | Uploaded file exceeds 5 MB. |
| `415` | Uploaded file type not permitted, or preview requested for a non-image (PDF) attachment. |
| `500` | Unexpected server error (safe message only, no stack trace or internals). |
