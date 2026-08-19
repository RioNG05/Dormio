# Spec — Global Conventions

> **Authority**: This document defines rules that apply to **every** use case in the system.
> All AI agents must treat these as hard constraints — they override any module-level default.
>
> **Stack context**: NestJS (backend), Prisma + PostgreSQL (data layer), Next.js (landlord web dashboard + rental platform).

---

## Multi-tenancy

- One `USER` (role=Owner) can own multiple `BOARDING_HOUSE` rows.
- **Every** query in BHMS must be scoped by `boarding_house_id` — never assume a landlord has exactly one property.
- All list/aggregate endpoints must accept `boarding_house_id` (or `boarding_house_id[]` for cross-property Pro reports) as a required/optional filter, not infer it from the user alone.

## Soft Business-State vs Hard Delete

- Financial records (`PAYMENT`, `INVOICE`, `CONTRACT`, `DEPOSIT`) must **never** be hard-deleted.
- Use status transitions instead.
- FK `onDelete` on these must default to `Restrict`.

## Money Fields

- All `decimal` fields use `DECIMAL(12,2)` in Postgres.
- VND has no reliable minor unit but keep 2dp for compatibility with future currencies.
- **Never use `float`.**

## Payment Amount Sign Convention

- `PAYMENT.amount` is **always positive**, including refunds.
- Net revenue = `SUM(amount) WHERE type='charge' AND status='success'` minus `SUM(amount) WHERE type='refund' AND status='success'`.
- Never store negative amounts.

## Audit Logging

- Any mutation to `CONTRACT`, `DEPOSIT`, `PAYMENT`, `INVOICE`, `EMPLOYEE_ASSIGNMENT`, `ATTENDANCE`, `USER_SUBSCRIPTION` must write a row to `AUDIT_LOG` (`action`, `entity_type`, `entity_id`, `old_value`, `new_value`, `user_id`) **inside the same DB transaction** as the mutation.
- Do this via a Prisma middleware / interceptor — not by remembering to call it manually in every service method.

## Role-Based Access

- `USER.role` gates every endpoint.
- Tenant-role users must never be able to query another tenant's `CONTRACT`/`INVOICE`/`PAYMENT`.
- Employee-role users are scoped to their `EMPLOYEE_ASSIGNMENT` boarding houses only.

## Multi-tenancy Guard (UC-L-23 — critical architectural requirement)

- Every BHMS API route (except account-level endpoints like `/me`, `/subscriptions`) must require an `X-Boarding-House-Id` header.
- Validated server-side against `BOARDING_HOUSE.owner_id = current_user.id` on **every single request**.
- Never trust a client-supplied `boarding_house_id` without this ownership check.
- Implement as a NestJS Guard (`PropertyOwnershipGuard`) applied globally to the BHMS module.
