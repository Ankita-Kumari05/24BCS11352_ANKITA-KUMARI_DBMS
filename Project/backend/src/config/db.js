const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

// Build connection configuration for either cloud DATABASE_URL or local parameters
const poolConfig = hasDatabaseUrl
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '753210',
      database: process.env.DB_NAME || 'projdb',
    };

const pool = new Pool(poolConfig);

// Test connection on startup and alert user if PostgreSQL is down
pool.connect((err, client, release) => {
  if (err) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ DATABASE CONNECTION ERROR: Failed to connect to PostgreSQL!');
    if (hasDatabaseUrl) {
      console.error('   Using DATABASE_URL connection string.');
    } else {
      console.error(`   Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
      console.error(`   Database: ${process.env.DB_NAME || 'projdb'}`);
      console.error(`   User: ${process.env.DB_USER || 'postgres'}`);
    }
    console.error('   Please check if PostgreSQL service or cloud cluster is running.');
    console.error('   Details:', err.message);
    console.error('='.repeat(70) + '\n');
  } else {
    console.log(
      '✅ Connected to PostgreSQL database:',
      hasDatabaseUrl ? 'Cloud Database via DATABASE_URL' : (process.env.DB_NAME || 'projdb')
    );
    release();
  }
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle PostgreSQL client:', err.message);
});

/**
 * Helper to run parameterized queries.
 * @param {string} text - SQL query string with $1, $2… placeholders
 * @param {Array} params - values to bind
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.error('❌ Database connection refused! Is PostgreSQL running?');
    }
    throw err;
  }
};

module.exports = { pool, query };
