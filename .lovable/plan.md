

## Plan: Pass System Database Schema Changes

### 1. Add columns to `nyirok_services`

Add 4 new columns with defaults:
- `pass_enabled` (boolean, default `true`)
- `pass_total_treatments` (integer, default `10`)
- `pass_paid_treatments` (integer, default `9`)
- `pass_expiry_days` (integer, default `0`)
- `pass_price_override` (integer, default `0`)

### 2. Create `nyirok_passes` table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | `gen_random_uuid()` |
| email | text NOT NULL | client email |
| name | text NOT NULL | client name |
| service_id | uuid FK → nyirok_services.id | NOT NULL |
| total_treatments | integer NOT NULL | copied from service at purchase |
| used_treatments | integer NOT NULL, default 0 | incremented on use |
| purchase_date | timestamptz NOT NULL, default now() | |
| expiry_date | timestamptz NOT NULL | year 3000 if pass_expiry_days=0 |
| status | text NOT NULL, default 'active' | active/expired/cancelled/used |
| invoice_id | text, nullable | |
| created_at | timestamptz, default now() | |
| updated_at | timestamptz, default now() | |

RLS: public SELECT (so users can check their passes by email), public INSERT (for pass creation). Admin-only UPDATE/DELETE.

### 3. Create `nyirok_pass_uses` table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | `gen_random_uuid()` |
| pass_id | uuid FK → nyirok_passes.id | NOT NULL |
| reservation_id | uuid FK → nyirok_reservations.id | NOT NULL |
| time | timestamptz NOT NULL, default now() | |

RLS: public SELECT and INSERT. Admin-only DELETE.

### 4. Add `updated_at` trigger on `nyirok_passes`

Reuse the existing `update_updated_at_column()` function.

### Technical Details

Single migration with:
- `ALTER TABLE nyirok_services ADD COLUMN ...` for the 5 new columns (with defaults, so existing rows get values automatically)
- `CREATE TABLE nyirok_passes` and `nyirok_pass_uses`
- Enable RLS on both new tables
- Create RLS policies matching the existing pattern
- Attach `update_updated_at_column` trigger to `nyirok_passes`

No code changes needed in this step -- this is schema-only preparation for the pass system UI/logic.

