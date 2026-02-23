const bcrypt = require('bcryptjs');
const fs = require('fs');

(async () => {
    const h1 = await bcrypt.hash('bhandari51@', 12);
    const h2 = await bcrypt.hash('somnath65@', 12);
    const h3 = await bcrypt.hash('driver11@', 12);

    const sql = `-- Paste this into Supabase SQL Editor and click RUN
-- Generated: ${new Date().toISOString()}

INSERT INTO users (name, mobile, password, role) VALUES
  ('Owner',   '9422228205', '${h1}', 'owner'),
  ('Manager', '9527042265', '${h2}', 'manager'),
  ('Driver',  '9999999999', '${h3}', 'driver')
ON CONFLICT (mobile) DO UPDATE SET
  name     = EXCLUDED.name,
  password = EXCLUDED.password,
  role     = EXCLUDED.role
RETURNING id, name, mobile, role;
`;

    fs.writeFileSync('scripts/insert-users.sql', sql);
    console.log('Done! Open scripts/insert-users.sql and paste it into Supabase SQL Editor.');
})();
