const dns = require('dns');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'Techland@244190',
  host: 'db.nvlnyhyldrpuvhjwfjxc.supabase.co',
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
  lookup: (hostname, options, callback) => {
    // Force IPv4 addresses only
    return dns.lookup(hostname, { family: 4 }, callback);
  }
});
