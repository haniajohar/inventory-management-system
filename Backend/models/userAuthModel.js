const connection = require('../config/db');

// Create a new user
const createUser = (username, email, hashedPassword) => {
  return new Promise((resolve, reject) => {
    console.log('Creating user:', { username, email });
    const query = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
    
    connection.query(query, [username, email, hashedPassword], (err, results) => {
      if (err) {
        console.error('[MySQL][createUser] Error:', err);
        return reject(err);
      }
      console.log('User created with ID:', results.insertId);
      resolve(results.insertId);
    });
  });
};

const findUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    console.log('Looking up user by email:', email);
    const query = `SELECT id, email, username, password FROM users WHERE email = ?`;
    
    connection.query(query, [email], (err, results) => {
      if (err) {
        console.error('[MySQL][findUserByEmail] Error:', err);
        return reject(err);
      }
      
      console.log('Query results:', results);
      
      if (results.length === 0) {
        console.log('No user found with email:', email);
        return resolve(null);
      }
      
      const user = {
        id: results[0].id,
        email: results[0].email,
        username: results[0].username,
        password: results[0].password
      };
      
      console.log('Found user:', { id: user.id, email: user.email, username: user.username });
      resolve(user);
    });
  });
};

module.exports = {
  createUser,
  findUserByEmail
};