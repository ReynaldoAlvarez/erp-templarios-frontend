# Task 8A - Sprint 8A Critical Fixes - ERP TEMPLARIOS Frontend

## Agent: Main Agent
## Task: Implement 4 critical fixes for Sprint 8A

### Changes Summary

#### 1. `src/hooks/use-queries.ts` — 3 changes

**Task 8A-1: Fixed useDeleteBL (BROKEN HOOK)**
- **Removed** `useDeleteBL()` at old line 297 (called `blsApi.delete(id)` which doesn't exist)
- **Added 4 new BL hooks** (lines ~299-338):
  - `useBLSearch(query)` — Search BLs with min 2 chars
  - `useBLByNumber(blNumber)` — Get BL by its number
  - `useBLProgress(blId)` — Get BL delivery progress
  - `useBLImportFromJSON()` — Mutation to import BLs from JSON array
- Added `trailersApi` and `expensesApi` to imports from `@/lib/api-client`

**Task 8A-2: Created COMPLETE Trailer Hooks**
- **Added 4 Trailer query hooks** (lines ~2399-2430):
  - `useTrailers(params?)` — List trailers with pagination
  - `useTrailer(id)` — Get trailer by ID
  - `useAvailableTrailers()` — Get available (unassigned) trailers
  - `useTrailerSearch(query)` — Search trailers with min 2 chars
- **Added 5 Trailer mutation hooks** (lines ~2432-2488):
  - `useCreateTrailer()` — Create a new trailer
  - `useUpdateTrailer()` — Update trailer data
  - `useAssignTrailer()` — Assign/unassign trailer to truck (also invalidates trucks)
  - `useDeleteTrailer()` — Deactivate (soft delete) a trailer
  - `useRestoreTrailer()` — Reactivate a trailer

**Task 8A-3: Created COMPLETE Expense Hooks**
- **Added 6 Expense query hooks** (lines ~2490-2536):
  - `useExpenses(params?)` — List expenses with pagination
  - `useExpense(id)` — Get expense by ID
  - `useExpenseCategories()` — Get FUEL, TOLL, FOOD, MAINTENANCE categories
  - `useExpenseStats(params?)` — Get expense stats (total, by category)
  - `useExpensesByDriver(driverId, limit?)` — Get expenses for a driver
  - `useExpensesByTrip(tripId)` — Get expenses for a trip
- **Added 3 Expense mutation hooks** (lines ~2538-2571):
  - `useCreateExpense()` — Create a new expense
  - `useUpdateExpense()` — Update expense data
  - `useDeleteExpense()` — Delete an expense

#### 2. `src/lib/api-client.ts` — 1 change

**Task 8A-4: Added blsApi.getImportTemplate()**
- Added `getImportTemplate()` method to `blsApi` object (lines ~521-530)
- Calls `GET /bl/import/template`
- Returns `{ fields: Array<...>, example: Array<Record<string, unknown>> }`
- Properly typed with response structure matching backend

### Verification
- ✅ TypeScript compilation: **0 errors** in `/home/z/erp-templarios-frontend/src/`
  - All TS errors shown by tsc are from the backend project (`erp-templarios/`) which is a separate repo
  - The frontend source code has zero TypeScript errors
- ✅ No remaining references to `useDeleteBL` in source code (only the comment explaining removal)
- ✅ All types referenced (`TrailerListParams`, `CreateTrailerInput`, `UpdateTrailerInput`, `ExpenseListParams`, `CreateExpenseInput`, `UpdateExpenseInput`) already exist in `src/types/api.ts`
- ✅ All API methods referenced (`trailersApi.*`, `expensesApi.*`, `blsApi.search`, `blsApi.getByNumber`, `blsApi.getProgress`, `blsApi.importFromJSON`) already exist in `src/lib/api-client.ts`
