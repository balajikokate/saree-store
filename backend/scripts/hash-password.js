/**
 * Generates a bcrypt hash for your chosen admin password, to paste into
 * backend/.env as ADMIN_PASSWORD_HASH.
 *
 * Usage: node scripts/hash-password.js "your-chosen-password"
 */
const bcrypt = require("bcryptjs");

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/hash-password.js \"your-chosen-password\"");
  process.exit(1);
}

if (password.length < 8) {
  console.error("Choose a password of at least 8 characters.");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log("\nAdd this line to backend/.env:\n");
console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
console.log("");
