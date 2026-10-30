const pool = require('../../config/db');
const { createUser, getUserByEmail } = require('../models/user');
const { hashPassword } = require('../utils/auth');
const fs = require('fs');
const path = require('path');

const initializeDatabase = async () => {
  try {
    console.log('Initializing database...');
    
    // Read and execute SQL initialization script
    const sqlPath = path.join(__dirname, '../../sql/init.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sqlScript);
    console.log('Database tables created successfully');
    
    // Ensure profile_picture column exists
    try {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;');
      console.log('Verified profile_picture column in users table');
    } catch (err) {
      console.error('Error adding profile_picture column:', err.message);
    }
    
    // Create admin user if not exists
    await createAdminUser();
    
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

const createAdminUser = async () => {
  try {
    const adminEmail = 'admin@test.com';
    const adminPassword = 'admin';
    
    // Check if admin user already exists
    const existingAdmin = await getUserByEmail(adminEmail);
    
    if (existingAdmin) {
      console.log('Admin user already exists, skipping creation');
      return;
    }
    
    // Create admin user
    const hashedPassword = await hashPassword(adminPassword);
    const adminUser = await createUser({
      name: 'Admin User',
      email: adminEmail,
      password_hash: hashedPassword,
      role: 'admin'
    });
    
    console.log(`Admin user created successfully with email: ${adminEmail}`);
    console.log(`Admin password: ${adminPassword}`);
    
  } catch (error) {
    console.error('Admin user creation error:', error);
    throw error;
  }
};

module.exports = { initializeDatabase }; 