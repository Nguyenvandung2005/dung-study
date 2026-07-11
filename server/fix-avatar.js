const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'uploads/avatars');
const source = path.join(dir, 'avatar-d1139bd8-6792-4fbc-9789-7e5e8a59c7ce-1783597252815.jpg');
const target = path.join(dir, 'avatar-9059f58a-ee0d-45c2-a444-d30b60726d7f-1783657980064.jpg');

if (fs.existsSync(source) && !fs.existsSync(target)) {
  fs.copyFileSync(source, target);
  console.log('✅ Restored missing avatar file for Admin Dung Study');
} else {
  console.log('ℹ️ Avatar file check completed');
}
