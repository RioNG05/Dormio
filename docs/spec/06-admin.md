# Module 3 — Admin Portal · Actor: System Administrator (Admin)

> See `00-overview-and-conventions.md` for global rules.

---

## 1. Global Analytics & Dashboards

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

### UC-A-06 — Platform Revenue Dashboard

**Tier:** Free (Platform Core) · **Actor:** System Administrator (`role='admin'`)  
**Models:** `Payment`, `UserSubscription`, `SubscriptionPlan`, `PostPurchase`, `User`

#### 1. Overview & Business Rules
Unlike landlord rental revenue (which tracks tenant rent invoices and room deposits per boarding house in BHMS), **Platform Revenue** represents income earned directly by the Dormio platform via two core monetization streams:
1. **Subscription Package Upgrades**:
   - Landlord recurring subscription fees (`UserSubscription`) for `plus` and `pro` tiers (free tier generates 0 VNĐ).
   - Incurred on either a `monthly` or `yearly` billing cycle.
2. **Post Credit Purchases**:
   - One-time credit package purchases (`PostPurchase`) by leasing agents or landlords to publish listings on the BHRP rental platform beyond their daily free quota.

#### 2. Period Filtering & Time-Bucketing
Admin can toggle granular reporting views:
- **By Month (`month`)**: Aggregates revenue across months of a chosen calendar year (e.g., Jan–Dec 2026).
- **By Quarter (`quarter`)**: Aggregates revenue into 4 fiscal quarters (`Q1`, `Q2`, `Q3`, `Q4`) for quarterly review.
- **By Year (`year`)**: Multi-year macro trend comparisons (e.g., 2024 vs 2025 vs 2026).
- **Date Range Picker (Optional)**: Custom `startDate` to `endDate` window (defaults to the current calendar year when unspecified).

#### 3. Revenue Metrics & Aggregation Logic
All revenue figures follow the global financial convention (`00-global-conventions.md`):
- **Gross Revenue**: `SUM(p.amount)` for `type = 'charge' AND status = 'success'`.
- **Refund Deductions**: `SUM(p.amount)` for `type = 'refund' AND status = 'success'` linked via `Payment.refundPaymentId` to a platform transaction.
- **Net Revenue**: Gross Revenue minus Refunds.

##### Aggregation Breakdown:
- **Total Platform Revenue (`totalRevenue`)**: Combined net revenue across both subscriptions and post credit purchases.
- **Subscription Revenue by Tier (`subscriptionRevenue`)**:
  - Breakdown by plan: `plus` vs `pro`.
  - Breakdown by cycle: `monthly` vs `yearly`.
  - Aggregated from `Payment` records where `subscriptionId IS NOT NULL`.
- **Post Purchase Revenue (`postPurchaseRevenue`)**:
  - Total revenue collected from listing credits.
  - Aggregated from `Payment` records where `postPurchaseId IS NOT NULL`.
  - Key operational indicators: Total post credits purchased (`SUM(PostPurchase.quantityPurchase)`), number of purchasing transactions, and average spend per transaction.

##### Example SQL Aggregation:
```sql
-- Monthly aggregation example for platform revenue in a given year
SELECT
  date_trunc('month', p.paid_at) AS bucket,
  -- Subscription revenue by plan
  COALESCE(SUM(CASE WHEN p.type = 'charge' AND us.plan_name = 'plus' THEN p.amount ELSE 0 END), 0) AS plus_revenue,
  COALESCE(SUM(CASE WHEN p.type = 'charge' AND us.plan_name = 'pro' THEN p.amount ELSE 0 END), 0) AS pro_revenue,
  -- Post credit purchase revenue
  COALESCE(SUM(CASE WHEN p.type = 'charge' AND p.post_purchase_id IS NOT NULL THEN p.amount ELSE 0 END), 0) AS post_credit_revenue,
  -- Total gross revenue
  COALESCE(SUM(CASE WHEN p.type = 'charge' THEN p.amount ELSE 0 END), 0) AS gross_revenue,
  -- Refunds (if any)
  COALESCE(SUM(CASE WHEN p.type = 'refund' THEN p.amount ELSE 0 END), 0) AS refunded_revenue,
  -- Net revenue
  COALESCE(SUM(CASE WHEN p.type = 'charge' THEN p.amount ELSE -p.amount END), 0) AS net_revenue
FROM payments p
LEFT JOIN user_subscriptions us ON p.subscription_id = us.id
WHERE p.status = 'success'
  AND (p.subscription_id IS NOT NULL OR p.post_purchase_id IS NOT NULL)
  AND p.paid_at >= '2026-01-01' AND p.paid_at < '2027-01-01'
GROUP BY bucket
ORDER BY bucket ASC;
```

#### 4. API Contract
- **Endpoint**: `GET /api/v1/admin/analytics/revenue`
- **Guards**: `JwtAuthGuard`, `RolesGuard` requiring `UserRole.admin`. No `X-Boarding-House-Id` header (platform-level).
- **Query Parameters**:
  - `period`: `'month' | 'quarter' | 'year'` (default: `'month'`)
  - `year`: integer (e.g. `2026`, defaults to current year)
  - `startDate`: ISO 8601 date string (optional)
  - `endDate`: ISO 8601 date string (optional)
- **Response Format**:
```json
{
  "summary": {
    "totalRevenue": 154500000,
    "previousPeriodRevenue": 128000000,
    "revenueGrowthRate": 20.7,
    "subscriptionRevenue": {
      "total": 112500000,
      "percentage": 72.8,
      "byPlan": {
        "plus": 45000000,
        "pro": 67500000
      },
      "byCycle": {
        "monthly": 32500000,
        "yearly": 80000000
      }
    },
    "postPurchaseRevenue": {
      "total": 42000000,
      "percentage": 27.2,
      "totalCreditsSold": 4200,
      "totalTransactions": 140,
      "averageOrderValue": 300000
    }
  },
  "timeline": [
    {
      "bucket": "2026-01-01T00:00:00.000Z",
      "label": "Jan 2026",
      "totalRevenue": 12500000,
      "subscriptionPlus": 3500000,
      "subscriptionPro": 5500000,
      "postPurchase": 3500000
    }
  ]
}
```

#### 5. Admin Dashboard UI Specifications
- **Metric Cards (KPIs)**:
  1. *Total Platform Revenue*: Net revenue formatted in currency (e.g. `154,500,000 ₫`) with MoM / QoQ / YoY percentage badge.
  2. *Subscription Revenue*: Total subscription revenue with breakdown pills (`Plus: 45M`, `Pro: 67.5M`).
  3. *Post Purchase Revenue*: Total post credit revenue, total credits sold, and average order value.
- **Visual Charts**:
  - **Stacked Bar / Area Chart**: Revenue trend over time (x-axis: Months/Quarters/Years; y-axis: Currency amount; colored stacks for `Plus`, `Pro`, `Post Purchase`).
  - **Donut Chart**: Revenue proportion between Subscription Packages vs Post Purchases.
- **Tab & Filter Controls**:
  - Segmented control: `[By Month] | [By Quarter] | [By Year]`.
  - Year selector dropdown / quick buttons.
  - Export action button: `[Export Excel/CSV]` for financial auditing.

---

## 2. Grievance Management

### UC-A-04 — Manage Grievances

**Tier:** Free · **Models:** `Grievance`, `GrievanceImage`

Queue: `Grievance WHERE status='pending' ORDER BY priority desc, createdAt asc`.

On resolution: `UPDATE Grievance SET status='resolved', resolvedAt=NOW(), resolvedBy=<admin user id>`. On rejection: same but `status='rejected'`. Either way, enqueue an Email/Zalo dispatch job to the `tenantId`.

**Gap to flag (see `00-overview-and-conventions.md` Schema Gaps §B):** `resolvedBy` and the `rejected` status already exist in the current schema — only `Grievance.resolutionNote` (free-text explanation shown to the tenant on resolution/rejection) is still missing. Add it before implementing the "leave a written explanation" part of this UC; don't repurpose `description` (that field is the tenant's original complaint text, not the admin's response).

---

## 3. Communication & Operations

### UC-A-05 — Mass Notification Dispatcher

**Tier:** Free · **Tech:** async job queues, Zalo ZNS/SMS/SMTP · **Models:** `MassNotificationJob`

1. Admin composes a message → insert `MassNotificationJob(createdBy, channel, targetType, targetId, title, content, status='pending', sentCount=0, failedCount=0)`. `targetId` is only set when `targetType='specific_user'`.
2. Background worker resolves the target audience:
    - `all_users` / `all_landlords` / `all_staff` / `all_admins` → query `User` filtered by `role` (note: `all_staff` should filter on `EmployeeProfile` existence, not `User.role`, since staff can simultaneously hold another primary role — see UC-L-19's note on this).
    - `specific_user` → the single `targetId`.
3. Fan out via the channel's third-party API in batches (respect rate limits), incrementing `sentCount`/`failedCount` as it goes.
4. Set `status='completed'` when done (or `'failed'` if the batch as a whole errors out before completing).

Use a proper job queue (e.g. BullMQ + Redis) — never loop over potentially thousands of recipients synchronously inside the HTTP request handler.
