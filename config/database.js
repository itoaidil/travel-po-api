const mysql = require('mysql2/promise');
require('dotenv').config();

// Resolve values like "${VAR}" to the actual env var value if present
function resolveRef(val) {
  if (typeof val === 'string' && /^\$\{[A-Z0-9_]+\}$/.test(val)) {
    const name = val.slice(2, -1);
    return process.env[name];
  }
  return val;
}

// Prefer Railway's MYSQL* vars, then fallback to MYSQL_* and defaults
const host = resolveRef(process.env.MYSQLHOST) || process.env.MYSQL_HOST || 'junction.proxy.rlwy.net';
const user = resolveRef(process.env.MYSQLUSER) || process.env.MYSQL_USER || 'root';
const password = resolveRef(process.env.MYSQLPASSWORD) || process.env.MYSQL_PASSWORD || 'VpgpZJNWWKZgdFAGpOXJYHhPwhEIpLpU';
const database = resolveRef(process.env.MYSQLDATABASE) || process.env.MYSQL_DATABASE || 'railway';
const port = Number(resolveRef(process.env.MYSQLPORT) || process.env.MYSQL_PORT || 27706);

// Create connection pool
const pool = mysql.createPool({
  host,
  user,
  password,
  database,
  port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000
});

// Logging
console.log('MySQL config:', { host, port, database, user });

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

module.exports = pool;
