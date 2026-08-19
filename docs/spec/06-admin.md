# MODULE 3 — Admin Portal

**Module**: Admin Portal
**Actor**: System Administrator (Admin)
**Global rules**: See `docs/spec/00-global-conventions.md`

All admin endpoints must be gated behind `role='Admin'` guard. These are global (no `boarding_house_id` scoping).

---

## UC-A-01 / UC-A-02 / UC-A-03 — Global Analytics (User / Property / Listing)
**Tier:** Free

Time-bucketed counts:
```sql
SELECT date_trunc('week', created_at) AS bucket, COUNT(*)
FROM "user"  -- or boarding_house / post
GROUP BY bucket ORDER BY bucket;
```

Support `week | month | year` bucket size as a query param.

---

## UC-A-04 — Manage Grievances
**Tier:** Free

CRUD on the `GRIEVANCE` table introduced in UC-T-07.

- Admin queue: `GRIEVANCE WHERE status='open' ORDER BY created_at asc`
- On resolution: `UPDATE GRIEVANCE SET status, resolution_note, resolved_by, resolved_at=NOW()`
- Then enqueue Email/Zalo dispatch job to `tenant_id` — do not call async inline.

---

## UC-A-05 — Mass Notification Dispatcher
**Tier:** Free · **Tech:** async job queues, Zalo ZNS / SMS / SMTP

**New table required** (not in original ERD — add via migration):

```
MASS_NOTIFICATION_JOB
  id              PK UUID
  created_by      FK → USER (admin)
  channel         enum: zalo | sms | email
  target_type     enum: all_users | all_landlords | all_staff | all_admins | specific_user
  target_user_id  FK → USER nullable (used when target_type='specific_user')
  content         text
  status          enum: pending | processing | completed | failed
  total_recipients int
  sent_count       int
  created_at      timestamp
```

**Flow:**
1. Admin composes message → insert `MASS_NOTIFICATION_JOB(status='pending')`.
2. Background worker (BullMQ) resolves target audience (query `USER` by role, or single user).
3. Fans out via the channel's 3rd-party API in batches (respect rate limits).
4. Updates `sent_count` incrementally, sets `status='completed'` when done.

**Never** loop over thousands of recipients synchronously in the HTTP request handler.
