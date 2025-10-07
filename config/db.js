const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  user: 'postgres',
  password: 'Techland@244190',
  host: 'db.nvlnyhyldrpuvhjwfjxc.supabase.co',
  port: 5432,
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false,
  },
});
