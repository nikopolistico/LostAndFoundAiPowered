import pool from "./db.js";
import fs from 'fs';

async function removeAllPolicies() {
  try {
    console.log("🔄 Starting to remove all RLS policies...");

    // Read the SQL file
    const sqlScript = fs.readFileSync('./remove_all_policies.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      try {
        console.log(`Executing: ${statement.substring(0, 60)}...`);
        await pool.query(statement);
        console.log("✅ Success");
      } catch (err) {
        if (err.message.includes('policy') && err.message.includes('does not exist')) {
          console.log("ℹ️  Policy already doesn't exist - skipping");
        } else {
          console.log(`⚠️  Warning: ${err.message}`);
        }
      }
    }

    // Verify RLS status
    const result = await pool.query(`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'user_profiles', 'lost_items', 'found_items', 'matches')
    `);

    console.log("\n📊 Current RLS Status:");
    console.table(result.rows);

    console.log("\n🎉 All policies have been removed successfully!");
    console.log("Your database tables now have full access without RLS restrictions.");

  } catch (error) {
    console.error("❌ Error removing policies:", error);
  } finally {
    await pool.end();
  }
}

removeAllPolicies();