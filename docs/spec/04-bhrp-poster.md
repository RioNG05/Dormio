# Module 2 — BHRP (Rental Platform) · Actor: Landlord acting as Poster (Chủ trọ đăng bài)

> See `00-overview-and-conventions.md` for global rules.
>
> **Note on the actor name:** "Poster" is not a separate value in `UserRole` (`landlord | tenant | employee | admin`) — it's the source use-case doc's label for a `User(role='landlord')` using the rental-platform posting features. Every `postedBy` reference below is a landlord `User.id`, same account they use in the BHMS module. Do not add a `poster` role or a separate user table for this.

---

### UC-P-01 — Publish Rental Listing
**Tier:** Free · **Models:** `Post`, `PostImage`, `PostPurchase`, `SubscriptionPlan`

**Step 1 — quota check (do this before accepting any other input):**
```sql
-- a) free posts used today
SELECT COUNT(*) FROM posts
WHERE posted_by = :userId AND source_type = 'free_quote' AND created_at::date = CURRENT_DATE;

-- b) the poster's plan daily quota
SELECT sp.daily_post_quote FROM subscription_plans sp
WHERE sp.plan_name = COALESCE(
  (SELECT plan_name FROM user_subscriptions WHERE user_id=:userId AND status='active' ORDER BY start_date DESC LIMIT 1),
  'free'
);
```
- If (a) < (b): allowed, `sourceType='free_quote'`, `postPurchaseId=NULL`.
- Else, check available purchased credit: `PostPurchase WHERE buyerId=:userId AND status='paid' AND COUNT(Post WHERE postPurchaseId = this.id) < quantityPurchase`, oldest `activatedAt` first (FIFO). **Used quantity is computed via `COUNT(Post)`, not a stored `quantityUsed` field** — this is a confirmed design choice (see overview changelog #3), not a bug to fix.
- If found: `sourceType='purchased'`, `postPurchaseId=<that row's id>`.
- If neither: reject with a clear "out of posting quota" error.

**Step 2 — create the post:**
1. Input: `roomId` (optional — if provided and the poster is a landlord, validate the room's `BoardingHouse.ownerId` matches the poster), `title`, `content`, `depositAmount`, `imageUrls[]`.
2. Insert `Post(postedBy, roomId, title, content, depositAmount, sourceType, postPurchaseId, status='draft' or 'posted')`, then `PostImage(postId, url)` rows.
3. If the poster used UC-L-12's AI draft, prefill `content`/images from the returned `AiMessage` — the quota check above still applies unconditionally, AI-assisted drafting does not bypass it.

**Note on `PostStatus`:** the live enum is `draft | posted | hidden` — richer than a simple active/closed toggle. A listing can be saved as `draft` before publishing, and `hidden` covers both a poster-initiated pause and the auto-close triggered by UC-L-04b (when `resultedContractId` gets set). Implement the auto-close as `status → hidden`, not a deletion.

---

### UC-P-02 — Poster Analytics Dashboard
**Tier:** Pro · **Models:** `PostReach`

Query `Post WHERE postedBy=:userId`, joined `PostReach` for aggregate view counts (`COUNT(PostReach) GROUP BY postId`). Drill-down for a single post: same query filtered to one `postId`, broken out by day (`GROUP BY date_trunc('day', viewedAt)`) for a trend chart.