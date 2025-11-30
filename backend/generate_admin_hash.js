const fs = require('fs');
const bcrypt = require('bcryptjs');

const password = 'awesometech254';
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

const content = `
==================================================
ADMIN CREDENTIALS GENERATOR
==================================================
Name:     awesometech
Email:    admin@awesometech.co.ke
Password: ${password}
--------------------------------------------------
BCRYPT HASH:
${hash}
==================================================
`;

fs.writeFileSync('hash_result.txt', content);
console.log('Hash written to hash_result.txt');
