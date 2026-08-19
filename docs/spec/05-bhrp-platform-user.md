# Module 2 — BHRP (Rental Platform) · Actor: Platform User / Prospective Tenant

> See `00-overview-and-conventions.md` for global rules.

---

### UC-PU-01 — Browse & Filter Listings
**Tier:** Free · No auth required

Standard filtered query on `Post WHERE status='posted'`, joined `Room` → `BoardingHouse` for price/service/location filters. Location filters should target the structured address fields (`province`, `district`, `ward` — see overview changelog #11), not free-text address search. This endpoint must sit on the public route group with no auth guard.

---

### UC-PU-02 — View Poster Profile
**Tier:** Free · No auth required

Public subset of `User`: `avatarUrl, username, status, createdAt, COUNT(Post WHERE postedBy=user.id)`. Never expose `phoneNumber`/`email` here unless the viewer is authenticated and has an active `Conversation` with this poster — enforce explicitly in the query/DTO, don't rely on "forgetting" to select those columns as the only safeguard.

---

### UC-PU-03 — Save/Bookmark Listings
**Tier:** Free (requires auth)

`SavedPost(postId, savedBy)` insert/delete. Add `@@unique([postId, savedBy])` to make bookmarking idempotent (a toggle, not accumulating duplicate rows).

---

### UC-PU-04 — Direct Online Deposit
**Tier:** Free · **Tech:** Payment Gateway · **Models:** `Deposit`, `Payment`, `Room`

This is the "platform deposit" flow.

1. User views a `Post`, confirms a deposit `amount` (defaults to `Post.depositAmount`).
2. Create `Deposit(boardingHouseId=<derived from Post.room.boardingHouseId>, roomId=<Post.roomId>, contractId=NULL, postId=<post id>, type='platform', amount, status='pending', recordedManually=false, recordedBy=NULL)` — per the corrected schema, `recordedBy` is nullable and stays `NULL` here (see overview changelog #6).
3. Create `Payment(depositId=<new deposit>, payerId=<current user>, type='CHARGE', status='PENDING', amount, method, qrCodeUrl or gateway redirect url)`.
4. Gateway callback on success (single transaction): `Payment.status='SUCCESS'`, `Deposit.status='paid'`, `Room.status='deposited'` (per overview changelog #10 — this is the new in-between room state).
5. Notify the landlord: `Notification(senderId=NULL, receiverId=<Post.postedBy>, type='deposit_received', content=<link>)`.
6. **Auto-refund job (confirmed requirement):** a scheduled job scans `Deposit WHERE type='platform' AND status='paid' AND contractId IS NULL AND createdAt < NOW() - interval 'X days'` (X = configurable hold period — needs a product decision, default suggestion 7 days, keep as an env var not a hardcoded constant). For each match: call the gateway's refund API using the original `Payment.transactionRef` → on success, insert a **new** `Payment(type='REFUND', depositId=<same deposit>, amount=<same amount>, status='SUCCESS')` — this requires `Payment.depositId` to **not** be `@unique` (see overview changelog #2; if it's still unique in your copy of the schema, this insert will fail) — then set `Deposit.status='refunded'` and `Room.status='available'` (if no other active deposit/contract exists for the room).
7. UC-L-04b must guard against acting on a stale deposit: reject if `Deposit.status != 'paid'` at the time the landlord tries to convert it.

---

### UC-PU-05 — Initiate Direct Chat
**Tier:** Free

Reuses `Conversation`/`Message`/`MessageAttachment` verbatim — see UC-L-11 in `01-bhms-landlord.md` for the full implementation. No separate chat system for the rental platform.