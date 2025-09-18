const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'dpg-d2tver7fte5s73akuko0-a',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'eston',
  user: process.env.DB_USER || 'eston',
  password: process.env.DB_PASSWORD || '3imVIm6JKjF9RgkVpV4TYwAH4XNDMWm5',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Create tables if they don't exist
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
      )
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
      )
    `);


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
      )
    `);

    // Insert dummy data into applications table
 


    // Insert default admin user if not exists
    const adminCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@eston.edu.gh']);
    if (adminCheck.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(`
        INSERT INTO users (email, password, first_name, last_name, role)
        VALUES ($1, $2, $3, $4, $5)
      `, ['admin@eston.edu.gh', hashedPassword, 'Admin', 'User', 'admin']);
      console.log('Default admin user created');
    }

    // Insert sample courses if not exists


    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  createTables
};
