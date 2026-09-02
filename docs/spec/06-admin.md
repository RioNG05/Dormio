# Module 3 — Admin Portal · Actor: System Administrator (Admin)

> See `00-overview-and-conventions.md` for global rules.

---

### UC-A-01/02/03 — Global Analytics (Users / Properties / Listings)

**Tier:** Free

Time-bucketed counts, e.g.:

```sql
SELECT date_trunc('week', created_at) AS bucket, COUNT(*)
FROM users -- or boarding_houses / posts
GROUP BY bucket ORDER BY bucket;
```

Support `week|month|year` bucket size as a query param. These are global, admin-only endpoints (no `boardingHouseId` scoping) — gate behind a guard requiring `User.role='admin'`.

---

### UC-A-04 — Manage Grievances

**Tier:** Free · **Models:** `Grievance`, `GrievanceImage`

Queue: `Grievance WHERE status='pending' ORDER BY priority desc, createdAt asc`.

On resolution: `UPDATE Grievance SET status='resolved', resolvedAt=NOW(), resolvedBy=<admin user id>`. On rejection: same but `status='rejected'`. Either way, enqueue an Email/Zalo dispatch job to the `tenantId`.

**Gap to flag (see `00-overview-and-conventions.md` Schema Gaps §B):** `resolvedBy` and the `rejected` status already exist in the current schema — only `Grievance.resolutionNote` (free-text explanation shown to the tenant on resolution/rejection) is still missing. Add it before implementing the "leave a written explanation" part of this UC; don't repurpose `description` (that field is the tenant's original complaint text, not the admin's response).

---

### UC-A-05 — Mass Notification Dispatcher

**Tier:** Free · **Tech:** async job queues, Zalo ZNS/SMS/SMTP · **Models:** `MassNotificationJob`

1. Admin composes a message → insert `MassNotificationJob(createdBy, channel, targetType, targetId, title, content, status='pending', sentCount=0, failedCount=0)`. `targetId` is only set when `targetType='specific_user'`.
2. Background worker resolves the target audience:
    - `all_users` / `all_landlords` / `all_staff` / `all_admins` → query `User` filtered by `role` (note: `all_staff` should filter on `EmployeeProfile` existence, not `User.role`, since staff can simultaneously hold another primary role — see UC-L-19's note on this).
    - `specific_user` → the single `targetId`.
3. Fan out via the channel's third-party API in batches (respect rate limits), incrementing `sentCount`/`failedCount` as it goes.
4. Set `status='completed'` when done (or `'failed'` if the batch as a whole errors out before completing).

Use a proper job queue (e.g. BullMQ + Redis) — never loop over potentially thousands of recipients synchronously inside the HTTP request handler.
