# MODULE 1 — BHMS: Staff Use Cases

**Module**: Boarding House Management System (BHMS)
**Actor**: Staff / Employee (Nhân viên)
**Global rules**: See `docs/spec/00-global-conventions.md`

---

## UC-S-01 — View Schedule
**Tier:** Free

**Query:**
```sql
WORK_SCHEDULE
  WHERE employee_id = <current user's EMPLOYEE.id>
    AND boarding_house_id IN (<their active EMPLOYEE_ASSIGNMENT boarding houses>)
```

To show co-workers on the same shift:
```sql
WORK_SCHEDULE
  WHERE shift_id = :shift_id AND work_date = :work_date AND boarding_house_id = :bh_id
  JOIN USER ON employee → user
```

Include `JOB_POSITION.description` alongside the schedule so the staff member sees their duty list (per UC-L-20 design).

---

## UC-S-02 — Timekeeping (Check-in / Check-out)
**Tier:** Free

**Business rule (hard constraint — enforce server-side, not just UI-side):**
- Check-in allowed only within `[SHIFT.start_time - 10 minutes, SHIFT.start_time]` on `WORK_SCHEDULE.work_date`.
- Check-out allowed only within `[SHIFT.end_time, SHIFT.end_time + 12 hours]`.
- Requests outside these windows return `403`. Do not silently accept — use UC-L-22 manual override for legitimate exceptions.

**Flow:**
1. `POST /attendance/check-in { work_schedule_id }` → validate window → upsert `ATTENDANCE(work_schedule_id, check_in=NOW(), status='on_time' or 'late' depending on whether check_in > shift.start_time)`.
2. `POST /attendance/check-out { work_schedule_id }` → validate window → `UPDATE ATTENDANCE SET check_out=NOW()`.
3. If no check-in occurs and the window fully lapses, a scheduled job marks the `ATTENDANCE` as `status='absent'` (creates row if missing) — so UC-L-22 dashboard reflects it without landlord manual entry.
