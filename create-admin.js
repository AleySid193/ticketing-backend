const db = require('./src/db/database'); // Adjust path to your db file
const bcrypt = require('bcrypt');

async function createAdmin() {
  const name = "System Admin";
  const email = "admin@codingcops.org";
  const password = "Admin123";

  try {
    console.log("Starting admin creation...");

    // 1. Hash the password
    const hashed = await bcrypt.hash(password, 10);

    // 2. Insert the User
    db.run(
      `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
      [name, email, hashed],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return console.log("User already exists. Skipping insertion.");
          }
          return console.error("Error inserting user:", err.message);
        }

        const userId = this.lastID;
        console.log(`User created with ID: ${userId}`);

        // 3. Ensure 'admin' role exists and get its ID
        db.get(`SELECT id FROM roles WHERE name = 'admin'`, (err, role) => {
          if (!role) {
            return console.error("Error: 'admin' role does not exist in the 'roles' table. Please seed roles first.");
          }

          const roleId = role.id;

          // 4. Assign the role to the user
          db.run(
            `INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`,
            [userId, roleId],
            function (err) {
              if (err) {
                return console.error("Error assigning role:", err.message);
              }
              console.log("-----------------------------------------");
              console.log("SUCCESS: Admin user created and assigned!");
              console.log(`Email: ${email}`);
              console.log(`Password: ${password}`);
              console.log("-----------------------------------------");
            }
          );
        });
      }
    );
  } catch (error) {
    console.error("Script failed:", error);
  }
}

createAdmin();