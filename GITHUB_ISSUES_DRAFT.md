# GitHub Issues Draft

Repository audit date: 2026-05-14

This draft is based on source inspection and a successful `npm run build`. The build passes, so the main issue set is product behavior, data integrity, security, and unfinished UX rather than compile failures.

## High Priority Problems

### 1. Fix broken tag analytics API
- Priority: High
- Suggested title: `fix(api): /analytics/tags queries a non-existent expense.tag column`
- Why this matters: The analytics route appears unusable and cannot produce the tag-based insights promised in the README.
- Evidence:
  - [`packages/api/src/routes/analytics/get-tags-analytics.route.ts`](/Users/aliahnaf/Projects/expense_tracker/packages/api/src/routes/analytics/get-tags-analytics.route.ts:1) selects and groups by `e.tag`.
  - [`packages/api/src/entities/Expense.entity.ts`](/Users/aliahnaf/Projects/expense_tracker/packages/api/src/entities/Expense.entity.ts:1) has no `tag` column; tags are modeled via `transaction_tags`.
- Draft acceptance criteria:
  - Rebuild tag analytics using the `transaction_tags` and `tags` tables.
  - Return tag id, tag name, totals, and counts in a stable API shape.
  - Add coverage for transactions with multiple tags and transactions with no tags.

### 2. Prevent invalid or cross-user tag/vault references on transactions
- Priority: High
- Suggested title: `fix(api): validate transaction tagIds and vaultId ownership on create/update`
- Why this matters: A user can submit tag ids or vault ids that do not belong to them. That risks foreign-key failures, corrupted categorization, or unauthorized cross-user references.
- Evidence:
  - [`packages/api/src/routes/transactions/post-transaction.route.ts`](/Users/aliahnaf/Projects/expense_tracker/packages/api/src/routes/transactions/post-transaction.route.ts:1) accepts `tagIds` and `vaultId` but does not verify ownership.
  - Recurring routes already perform tag ownership validation in [`packages/api/src/routes/recurring/post-recurring.route.ts`](/Users/aliahnaf/Projects/expense_tracker/packages/api/src/routes/recurring/post-recurring.route.ts:1), showing the missing check is accidental rather than intentional.
- Draft acceptance criteria:
  - Reject non-existent or foreign `tagIds` and `vaultId` with `400`.
  - Reuse shared validation helpers for both one-off and recurring transactions.
  - Add tests for valid, invalid, and cross-user ids.

### 3. Fix transaction update route so tags can actually be updated
- Priority: High
- Suggested title: `fix(api): transaction update route ignores tagIds and uses stale schema`
- Why this matters: Transaction updates do not match transaction creation. The route accepts a `tag` string instead of `tagIds`, and it never updates the join table.
- Evidence:
  - [`packages/api/src/routes/transactions/put-transaction.route.ts`](/Users/aliahnaf/Projects/expense_tracker/packages/api/src/routes/transactions/put-transaction.route.ts:1) validates `tag`, not `tagIds`.
  - [`packages/api/src/routes/transactions/post-transaction.route.ts`](/Users/aliahnaf/Projects/expense_tracker/packages/api/src/routes/transactions/post-transaction.route.ts:1) uses `tagIds`.
- Draft acceptance criteria:
  - Update the request schema to support `tagIds`.
  - Replace transaction-tag rows when tags change.
  - Keep API contracts for create and update aligned.

### 4. Enforce safe default-vault behavior
- Priority: High
- Suggested title: `fix(api/ui): prevent deleting the default vault and preserve transaction routing`
- Why this matters: The product depends on a default vault, but the backend allows the default vault to be deleted. The README also says transactions without a vault should fall into the default vault, but the create route currently leaves `vaultId` null.
- Evidence:
  - [`packages/api/src/routes/vaults/delete-vault.route.ts`](/Users/aliahnaf/Projects/expense_tracker/packages/api/src/routes/vaults/delete-vault.route.ts:1) deletes any vault without checking `isDefault`.
  - [`packages/api/src/routes/transactions/post-transaction.route.ts`](/Users/aliahnaf/Projects/expense_tracker/packages/api/src/routes/transactions/post-transaction.route.ts:1) does not assign the default vault when `vaultId` is omitted.
  - README states: “Transactions without a vault fall into the default one.”
- Draft acceptance criteria:
  - Prevent deletion of the default vault unless another vault is promoted in the same flow.
  - Auto-assign the default vault when creating transactions without `vaultId`.
  - Add API tests for users with one vault and multiple vaults.

### 5. Make vault deletion behavior match the UI prompt
- Priority: High
- Suggested title: `fix(ui/api): vault deletion flow ignores selected action for existing transactions`
- Why this matters: The UI implies users can choose how to handle existing transactions, but the action is ignored. Current deletion simply removes the vault and relies on `SET NULL`, which silently drops categorization.
- Evidence:
  - [`packages/ui/src/app/profile/page.tsx`](/Users/aliahnaf/Projects/expense_tracker/packages/ui/src/app/profile/page.tsx:129) defines `handleDeleteVault(_action)` but ignores the chosen action.
  - [`packages/api/src/entities/Expense.entity.ts`](/Users/aliahnaf/Projects/expense_tracker/packages/api/src/entities/Expense.entity.ts:1) sets vault relation to `onDelete: 'SET NULL'`.
- Draft acceptance criteria:
  - Decide and implement supported deletion modes.
  - If “move transactions” is offered, add destination-vault selection and perform reassignment in the backend.
  - If “delete transactions” is offered, explicitly soft-delete or hard-delete those rows.
  - Remove misleading UI options if the backend will not support them.

### 6. Remove insecure JWT fallback secret in production code
- Priority: High
- Suggested title: `security(api): require JWT_SECRET instead of using a hard-coded fallback`
- Why this matters: If `JWT_SECRET` is not configured, the server falls back to a known development secret, which makes token forgery trivial.
- Evidence:
  - [`packages/api/src/routes/auth/shared.ts`](/Users/aliahnaf/Projects/expense_tracker/packages/api/src/routes/auth/shared.ts:1) uses `process.env.JWT_SECRET || 'dev-jwt-secret-change-in-prod'`.
- Draft acceptance criteria:
  - Crash startup when `JWT_SECRET` is missing outside local development.
  - Document required env vars in the README.
  - Add a startup validation step for all required secrets/config.

### 7. Stop rendering fake or incomplete analytics while claiming richer analytics support
- Priority: High
- Suggested title: `fix(product): align stats page with available analytics endpoints and promised yearly/tag insights`
- Why this matters: The README promises monthly, yearly, and tag-based analytics, but the UI stats page computes a single-month view from raw transactions and does not consume the analytics endpoints.
- Evidence:
  - [`packages/ui/src/app/stats/page.tsx`](/Users/aliahnaf/Projects/expense_tracker/packages/ui/src/app/stats/page.tsx:1) loads transactions and computes summaries client-side.
  - Analytics routes exist in [`packages/api/src/routes/analytics.routes.ts`](/Users/aliahnaf/Projects/expense_tracker/packages/api/src/routes/analytics.routes.ts:1), but the UI does not call them.
- Draft acceptance criteria:
  - Define the intended analytics scope for v1.
  - Either wire the stats page to the analytics API or reduce the product claims.
  - Add visible yearly and tag breakdowns if those remain in scope.

## Missing Features Worth Filing

### 8. Replace placeholder desktop navigation and help/settings links
- Priority: Medium
- Suggested title: `feat(ui): replace dead # links in desktop navigation with real routes or remove them`
- Why this matters: Core navigation elements lead nowhere, which makes the app feel unfinished and blocks discoverability.
- Evidence:
  - Placeholder `href="#"` links appear in [`packages/ui/src/app/page.tsx`](/Users/aliahnaf/Projects/expense_tracker/packages/ui/src/app/page.tsx:116), [`packages/ui/src/app/stats/page.tsx`](/Users/aliahnaf/Projects/expense_tracker/packages/ui/src/app/stats/page.tsx:198), and [`packages/ui/src/app/profile/page.tsx`](/Users/aliahnaf/Projects/expense_tracker/packages/ui/src/app/profile/page.tsx:214).
- Draft acceptance criteria:
  - Every visible nav item either navigates somewhere useful or is removed.
  - Desktop and mobile nav expose the same core areas.

### 9. Add real quest management entry points from the dashboard
- Priority: Medium
- Suggested title: `feat(ui): expose recurring quest management from the main dashboard`
- Why this matters: Recurring quests are a headline feature, but they are mostly buried in the profile/settings page.
- Evidence:
  - README emphasizes recurring quests as a core feature.
  - The dashboard still links “Quests” to `#` in [`packages/ui/src/app/page.tsx`](/Users/aliahnaf/Projects/expense_tracker/packages/ui/src/app/page.tsx:122).
- Draft acceptance criteria:
  - Add a dedicated quests route or panel.
  - Allow users to view, create, edit, and delete recurring quests from that flow.

### 10. Add transaction edit/delete UI
- Priority: Medium
- Suggested title: `feat(ui): allow users to edit and delete existing transactions`
- Why this matters: The API has update/delete routes, but the main UI focuses on creation and month filtering. Users need correction flows for real bookkeeping.
- Evidence:
  - Transaction update/delete endpoints exist under [`packages/api/src/routes/transactions`](/Users/aliahnaf/Projects/expense_tracker/packages/api/src/routes/transactions.routes.ts:1).
  - The dashboard transaction list in [`packages/ui/src/app/page.tsx`](/Users/aliahnaf/Projects/expense_tracker/packages/ui/src/app/page.tsx:1) does not expose edit/delete actions.
- Draft acceptance criteria:
  - Add edit/delete controls to transaction rows.
  - Refresh local state after mutation without a full reload.

### 11. Add error states and user-facing feedback for failed API calls
- Priority: Medium
- Suggested title: `feat(ui): surface API failures instead of only logging to console`
- Why this matters: Several screens catch failures with `console.error`, leaving the user with stale or empty UI and no explanation.
- Evidence:
  - [`packages/ui/src/app/page.tsx`](/Users/aliahnaf/Projects/expense_tracker/packages/ui/src/app/page.tsx:63) and [`packages/ui/src/app/stats/page.tsx`](/Users/aliahnaf/Projects/expense_tracker/packages/ui/src/app/stats/page.tsx:63) only log fetch errors.
  - [`packages/ui/src/lib/api/ApiClient.ts`](/Users/aliahnaf/Projects/expense_tracker/packages/ui/src/lib/api/ApiClient.ts:41) logs raw errors globally.
- Draft acceptance criteria:
  - Add reusable loading, empty, and error states.
  - Show actionable toast/banner messages for failed mutations and fetches.

### 12. Add automated tests for auth, transactions, recurring jobs, and analytics
- Priority: Medium
- Suggested title: `test(monorepo): add API integration coverage and critical UI smoke tests`
- Why this matters: The repo currently has no meaningful automated test suite, which makes regression risk high for financial logic.
- Evidence:
  - No test directories or test scripts are present in the workspace package manifests.
- Draft acceptance criteria:
  - Add API integration tests for auth, vaults, tags, transactions, recurring, and analytics.
  - Add at least a smoke-level UI test flow for sign-in, add transaction, and stats rendering.

## Good-to-Have Features

### 13. Add budgets and limit tracking per vault
- Priority: Nice to have
- Suggested title: `feat(product): add configurable vault budgets with over-limit indicators`
- Why this matters: The UI already visualizes spending progress, but there is no real budgeting model behind it.
- Draft acceptance criteria:
  - Store monthly or rolling budget targets per vault.
  - Show progress and over-budget warnings on dashboard/stats pages.

### 14. Export transactions as CSV
- Priority: Nice to have
- Suggested title: `feat(product): export filtered transactions as CSV`
- Why this matters: This is a common finance app expectation and already listed in the README contribution ideas.

### 15. Add multi-currency support
- Priority: Nice to have
- Suggested title: `feat(product): support account currency selection and currency-aware formatting`
- Why this matters: Currency is hard-coded to US dollars in the UI.
- Evidence:
  - Currency formatters in [`packages/ui/src/app/page.tsx`](/Users/aliahnaf/Projects/expense_tracker/packages/ui/src/app/page.tsx:13) and [`packages/ui/src/app/stats/page.tsx`](/Users/aliahnaf/Projects/expense_tracker/packages/ui/src/app/stats/page.tsx:26) use `$` and `en-US`.

### 16. Add password recovery / account recovery
- Priority: Nice to have
- Suggested title: `feat(auth): implement forgot-password and reset flow`
- Why this matters: Sign-in already hints at the feature, but it is commented out.
- Evidence:
  - [`packages/ui/src/app/signin/page.tsx`](/Users/aliahnaf/Projects/expense_tracker/packages/ui/src/app/signin/page.tsx:108) contains a commented-out “Forgot Password?” action.

### 17. Improve session management and logout consistency
- Priority: Nice to have
- Suggested title: `feat(auth/ui): unify logout/session handling across AppBar and hook-based auth`
- Why this matters: Session state is managed in more than one place, which can drift as the app grows.
- Evidence:
  - [`packages/ui/src/hooks/useAuth.ts`](/Users/aliahnaf/Projects/expense_tracker/packages/ui/src/hooks/useAuth.ts:1) owns session state.
  - [`packages/ui/src/components/AppBar.tsx`](/Users/aliahnaf/Projects/expense_tracker/packages/ui/src/components/AppBar.tsx:1) bypasses the hook and edits localStorage directly.

### 18. Remove the forced 1.5s auth guard delay
- Priority: Nice to have
- Suggested title: `perf(ui): remove artificial auth guard delay and switch to deterministic session bootstrap`
- Why this matters: Every route incurs a visible loader delay even when the session is already available.
- Evidence:
  - [`packages/ui/src/components/AuthGuard.tsx`](/Users/aliahnaf/Projects/expense_tracker/packages/ui/src/components/AuthGuard.tsx:1) uses `setTimeout(..., 1500)`.

## Notes For Triage

- Best first critical fixes:
  1. Broken tag analytics API.
  2. Transaction validation/update integrity gaps.
  3. Default vault and vault deletion behavior.
  4. JWT secret hardening.
- Best first product improvements:
  1. Real nav destinations.
  2. Transaction edit/delete UI.
  3. User-facing error states.
  4. Automated tests.
