# Module 1 — BHMS · Actor: Staff (Nhân viên)

> See `00-overview-and-conventions.md` for global rules.

---

### UC-S-01 — View Schedule
**Tier:** Free · **Models:** `WorkSchedule`, `EmployeeProfile`, `JobPosition`

Query `WorkSchedule WHERE employeeId = <current user's EmployeeProfile.id> AND boardingHouseId IN (<their boarding houses with an active EmployeeAssignment>)`.

To show co-workers on the same shift: `WorkSchedule WHERE shiftId=... AND workDate=... AND boardingHouseId=...` for other employees, joined `User` for display names.

Include `EmployeeAssignment.position → JobPosition.description` alongside the schedule so staff see their duty list (per UC-L-20's design) next to their shifts.

---

### UC-S-02 — Timekeeping (Check-in/Check-out)
**Tier:** Free · **Models:** `Attendance`, `WorkSchedule`, `Shift`

**Hard server-side constraints (not just UI-side validation):**
- Check-in allowed only within `[Shift.startTime - 10 minutes, Shift.startTime]` on `WorkSchedule.workDate`.
- Check-out allowed only within `[Shift.endTime, Shift.endTime + 12 hours]`.
- Requests outside these windows return `403`. Legitimate exceptions go through UC-L-22's manual override, not a silent accept-and-fix-later path.

**Flow:**
1. `POST /attendance/check-in { workScheduleId }` → validate window → upsert `Attendance(workScheduleId, checkIn=NOW(), status = checkIn > shift.startTime ? 'late' : 'on_time')`.
2. `POST /attendance/check-out { workScheduleId }` → validate window → `UPDATE Attendance SET checkOut=NOW()`.
3. A scheduled job marks `Attendance.status='absent'` (creating the row if it doesn't exist) once a shift's check-in window fully lapses with no check-in — so UC-L-22's dashboard reflects no-shows without landlord manual entry.