-- Allow authenticated users to bootstrap and read their own role.
-- Customer accounts are stored as role='operator' in DB and mapped to "customer" in UI.

-- Normalize role compatibility across environments.
-- Some DBs use enum('admin','operator'); others may use CHECK constraints with 'customer'.
-- This block makes both customer/operator acceptable to avoid role update failures.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    BEGIN
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'customer';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'roles' AND c.conname = 'roles_role_check'
  ) THEN
    ALTER TABLE roles DROP CONSTRAINT roles_role_check;
    ALTER TABLE roles
      ADD CONSTRAINT roles_role_check
      CHECK (role::text IN ('admin', 'customer', 'operator'));
  END IF;
END
$$;

DROP POLICY IF EXISTS "Users can read their own role" ON roles;
CREATE POLICY "Users can read their own role" ON roles FOR
SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own default role" ON roles;
CREATE POLICY "Users can insert their own default role" ON roles FOR
INSERT WITH CHECK (auth.uid() = user_id);
