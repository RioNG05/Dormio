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

**Tier:** Free · **Tech:** Payment Gateway · **Models:** `UserIdentification`, `Deposit`, `Payment`, `Room`

This is the "platform deposit" flow — the first half of `01-bhms-landlord.md` UC-L-04 Flow A.

1. **Identity verification gate:** before allowing a deposit, check `UserIdentification WHERE userId = current_user.id`.
    - **Missing** → block the deposit action, prompt the user to complete identity verification first (collect `identityNumber`, `fullName`, `dateOfBirth`, `gender`, `nationnality`, `placeOfOrigin`, `placeOfResidence`, `issueDate`, `expiryDate`, front/back ID card photos) and create the `UserIdentification` row. This is a one-time step per user, reused by every future deposit/contract.
    - **Present** → proceed directly to step 2.
2. User views a `Post`, confirms a deposit `amount` (defaults to `Post.depositAmount`).
3. Create `Deposit(boardingHouseId=<derived from Post.room.boardingHouseId>, roomId=<Post.roomId>, contractId=NULL, postId=<post id>, type='platform', amount, status='pending', recordedManually=false, recordedBy=NULL)`.
4. Create `Payment(depositId=<new deposit>, payerId=<current user>, type='charge', status='pending', amount, method, qrCodeUrl or gateway redirect url)`.
5. Gateway callback on success (single transaction): `Payment.status='success'`, `Deposit.status='paid'`, `Room.status='deposited'`.
6. Notify the landlord: `Notification(senderId=NULL, receiverId=<Post.postedBy>, type='deposit_received', content=<link>)` — this is what triggers UC-L-04 Flow A on the landlord's side.
7. **Auto-refund job:** a scheduled job scans `Deposit WHERE type='platform' AND status='paid' AND contractId IS NULL AND createdAt < NOW() - interval 'X days'` (X = configurable hold period, default suggestion 7 days, keep as an env var). This also correctly catches contracts the tenant rejected via UC-AUTH-04 (a rejected contract sets `Contract.status='canceled'` but `Deposit.contractId` stays pointed at it — broaden the scan condition to `(contractId IS NULL OR contract.status = 'canceled')` to cover both the "landlord never converted it" case and the "tenant rejected it" case).
    - For each match: call the gateway's refund API using the original charge `Payment.transactionRef`.
    - On success, insert a **new** `Payment(type='refund', payerId=<same payer>, amount=<same amount>, status='success', ...)`. **Do not set `depositId` on this new row** — `Payment.depositId` is `@unique`, and the original charge row already occupies that slot. Instead, link the two via the self-relation: `UPDATE <the original charge Payment> SET refundPaymentId = <new refund payment's id>`. To find "the refund for a given deposit" later, join through the charge: `Payment WHERE depositId = X` → follow `.refundPaymentId` → that's the refund row.
    - Then set `Deposit.status='refund'` (this is the actual enum value in `DepositStatus` — not `'refunded'`) and `Room.status='available'` if no other active deposit/contract exists for the room.
8. UC-L-04 Flow A (landlord side) must guard against acting on a stale deposit: reject creating a contract if `Deposit.status != 'paid'` at the time the landlord tries.

---

### UC-PU-05 — Initiate Direct Chat

**Tier:** Free

Reuses `Conversation`/`Message`/`MessageAttachment` verbatim — see UC-L-11 in `01-bhms-landlord.md` for the full implementation. No separate chat system for the rental platform.
