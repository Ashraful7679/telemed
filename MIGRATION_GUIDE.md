# Running Database Migrations

You need to run the SQL migration files in your Supabase dashboard to create the required tables.

## Steps to Run Migrations:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run Migrations in Order**

### Migration 1: Create Medicine and Test Tables
**File**: `supabase/medicine-test-database.sql`

Copy and paste the entire contents of this file into the SQL editor and click "Run".

This creates:
- `medicines` table with sample data (10 common medicines)
- `medical_tests` table with sample data (12 common tests)
- `prescribed_medicines` table for prescriptions
- Adds `test_id` column to `prescribed_tests`
- RLS policies

### Migration 2: Fix RLS and Add Structured Dosage
**File**: `supabase/fix-medicine-rls-and-dosage.sql`

Copy and paste the entire contents of this file into the SQL editor and click "Run".

This fixes:
- RLS policies to check `profiles.role` instead of `doctors` table
- Adds structured dosage columns to `prescribed_medicines`

## Verification

After running both migrations, verify in Supabase:

1. Go to "Table Editor"
2. Check that these tables exist:
   - `medicines` (should have 10 rows)
   - `medical_tests` (should have 12 rows)
   - `prescribed_medicines` (empty initially)
3. Check `prescribed_medicines` columns:
   - `dosage_quantity`
   - `dosage_unit`
   - `meal_timing`
   - `frequency_type`
   - `morning`, `afternoon`, `night`
   - `hours_gap`
   - `duration_days`

## Troubleshooting

If you get errors:
- Make sure you run migrations in order
- Check if tables already exist (drop them first if needed)
- Ensure you have admin access to the database

Once migrations are complete, the medicine prescription and test features will work!
