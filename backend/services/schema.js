import pool from "../db.js";

let schemaPromise;

export const ensureDatabaseSchema = async () => {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      // Ensure on_duty column exists for users table
      await pool.query(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS on_duty BOOLEAN DEFAULT FALSE"
      );
      // Force all null values to false for consistency
      await pool.query(
        "UPDATE users SET on_duty = FALSE WHERE on_duty IS NULL"
      );

      // Ensure reporter_id column exists for items table (used across routes/frontend)
      await pool.query(
        "ALTER TABLE items ADD COLUMN IF NOT EXISTS reporter_id UUID"
      );

      await pool.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'items'
              AND column_name = 'reporter_id'
              AND data_type <> 'uuid'
          ) THEN
            ALTER TABLE items
            ALTER COLUMN reporter_id TYPE uuid USING reporter_id::uuid;
          END IF;
        END;
        $$;
      `);

      // Back-fill reporter_id from historical user_id column when available
      await pool.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'items'
              AND column_name = 'user_id'
          ) THEN
            EXECUTE 'UPDATE items SET reporter_id = COALESCE(reporter_id, user_id)';
          END IF;
        END;
        $$;
      `);

      // Create table to store local (email/password) credentials when manual auth is used
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_credentials (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await pool.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'user_credentials'
              AND column_name = 'user_id'
              AND data_type <> 'uuid'
          ) THEN
            ALTER TABLE user_credentials
            ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
          END IF;
        END;
        $$;
      `);

      // Ensure updated_at column auto updates on password change
      await pool.query(`
        CREATE OR REPLACE FUNCTION touch_user_credentials_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);

      await pool.query(
        "DROP TRIGGER IF EXISTS user_credentials_touch_updated_at ON user_credentials"
      );

      await pool.query(`
        CREATE TRIGGER user_credentials_touch_updated_at
        BEFORE UPDATE ON user_credentials
        FOR EACH ROW
        EXECUTE FUNCTION touch_user_credentials_updated_at();
      `);
    })();
  }

  return schemaPromise;
};
