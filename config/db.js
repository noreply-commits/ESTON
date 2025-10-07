const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Direct connection config using Supabase credentials
const pool = new Pool({
  connectionString: 'postgresql://postgres:Techland%40244190@db.nvlnyhyldrpuvhjwfjxc.supabase.co:5432/postgres',
  ssl: {
    rejectUnauthorized: false, // Required for Supabase SSL
  },
});

// Event listeners for connection status
pool.on('connect', () => {
  console.log('✅ Connected to Supabase PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Create necessary tables and default data
const createTables = async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Courses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        duration VARCHAR(100),
        requirements TEXT,
        fee DECIMAL(10,2),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Applications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        middle_name VARCHAR(255),
        last_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20),
        email VARCHAR(255) UNIQUE NOT NULL,
        gender VARCHAR(50) NOT NULL,
        residential_address VARCHAR(255) NOT NULL,
        street_address VARCHAR(255) NOT NULL,
        street_address_line_2 VARCHAR(255) NOT NULL,
        city_state_province VARCHAR(255) NOT NULL,
        country VARCHAR(100) NOT NULL,
        course VARCHAR(255) NOT NULL,
        institution_name VARCHAR(255) NOT NULL,
        highest_education VARCHAR(255) NOT NULL,
        date_of_birth DATE NOT NULL,
        reason_for_course TEXT NOT NULL,
        how_hear VARCHAR(255) NOT NULL,
        declaration BOOLEAN NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        review_date TIMESTAMP,
        admin_notes TEXT
      );
    `);

    // Add default admin if not exists
    const adminCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@eston.edu.gh']);
    if (adminCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(`
        INSERT INTO users (email, password, first_name, last_name, role)
        VALUES ($1, $2, $3, $4, $5)
      `, ['admin@eston.edu.gh', hashedPassword, 'Admin', 'User', 'admin']);
      console.log('✅ Default admin user created');
    }

    console.log('✅ Database tables created or already exist');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
};

// Export for use in the app
module.exports = {
  query: (text, params) => pool.query(text, params),
  createTables
};
