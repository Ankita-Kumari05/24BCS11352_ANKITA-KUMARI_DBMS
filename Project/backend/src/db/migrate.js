// ============================================================================
// migrate.js — Placement Management System Database Migration Runner
// ============================================================================
// Reads schema.sql from the same directory and executes it against the
// PostgreSQL database configured via environment variables in .env.
//
// Usage:  node backend/src/db/migrate.js
// ============================================================================

const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables from the project's backend .env file
require('dotenv').config({
    path: path.resolve(__dirname, '..', '..', '.env'),   // backend/.env
});

async function runMigration() {
    // ── 1. Build a connection pool from env vars ──────────────────────────
    const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
    const poolConfig = hasDatabaseUrl
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
          }
        : {
            user:     process.env.DB_USER     || process.env.PGUSER,
            host:     process.env.DB_HOST     || process.env.PGHOST     || 'localhost',
            database: process.env.DB_NAME     || process.env.PGDATABASE || 'projdb',
            password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
            port:     parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
          };

    const pool = new Pool(poolConfig);

    try {
        // ── 2. Read the SQL schema file ───────────────────────────────────
        const schemaPath = path.join(__dirname, 'schema.sql');
        console.log(`📄  Reading schema from: ${schemaPath}`);

        const sql = fs.readFileSync(schemaPath, 'utf-8');
        console.log(`📏  Schema size: ${(Buffer.byteLength(sql) / 1024).toFixed(1)} KB`);

        // ── 3. Execute the schema against the database ────────────────────
        console.log('\n⏳  Running migration…');
        await pool.query(sql);
        console.log('✅  Migration completed successfully!\n');

        // ── 4. Verify: list all tables created ────────────────────────────
        const tablesResult = await pool.query(`
            SELECT tablename
              FROM pg_tables
             WHERE schemaname = 'public'
             ORDER BY tablename;
        `);

        console.log('📋  Tables in public schema:');
        tablesResult.rows.forEach((row, i) => {
            console.log(`    ${i + 1}. ${row.tablename}`);
        });

        // ── 5. Verify: list all triggers ──────────────────────────────────
        const triggersResult = await pool.query(`
            SELECT trigger_name, event_manipulation, event_object_table
              FROM information_schema.triggers
             WHERE trigger_schema = 'public'
             ORDER BY event_object_table, trigger_name;
        `);

        console.log('\n⚡  Triggers:');
        if (triggersResult.rows.length === 0) {
            console.log('    (none found)');
        } else {
            triggersResult.rows.forEach((row, i) => {
                console.log(
                    `    ${i + 1}. ${row.trigger_name}  →  ${row.event_manipulation} on ${row.event_object_table}`
                );
            });
        }

        // ── 6. Verify: list views ────────────────────────────────────────
        const viewsResult = await pool.query(`
            SELECT table_name
              FROM information_schema.views
             WHERE table_schema = 'public'
             ORDER BY table_name;
        `);

        console.log('\n👁️   Views:');
        if (viewsResult.rows.length === 0) {
            console.log('    (none found)');
        } else {
            viewsResult.rows.forEach((row, i) => {
                console.log(`    ${i + 1}. ${row.table_name}`);
            });
        }

        // ── 7. Quick row counts ──────────────────────────────────────────
        const countResult = await pool.query(`
            SELECT 'users'            AS tbl, COUNT(*) AS cnt FROM users
            UNION ALL
            SELECT 'students',              COUNT(*) FROM students
            UNION ALL
            SELECT 'companies',             COUNT(*) FROM companies
            UNION ALL
            SELECT 'placement_drives',      COUNT(*) FROM placement_drives
            UNION ALL
            SELECT 'applications',          COUNT(*) FROM applications
            UNION ALL
            SELECT 'application_status_audit', COUNT(*) FROM application_status_audit
            ORDER BY tbl;
        `);

        console.log('\n📊  Row counts:');
        countResult.rows.forEach((row) => {
            console.log(`    ${row.tbl}: ${row.cnt}`);
        });

        console.log('\n🎉  All done — database is ready.');

    } catch (err) {
        console.error('\n❌  Migration FAILED:', err.message);
        if (err.detail)   console.error('    Detail:', err.detail);
        if (err.hint)     console.error('    Hint:',   err.hint);
        if (err.position) console.error('    Position:', err.position);
        process.exit(1);
    } finally {
        // ── 8. Clean up ──────────────────────────────────────────────────
        await pool.end();
        console.log('🔌  Connection pool closed.');
    }
}

// Run immediately
runMigration();
