-- Paste this into Supabase SQL Editor and click RUN
-- Generated: 2026-02-23T15:49:23.133Z

INSERT INTO users (name, mobile, password, role) VALUES
  ('Owner',   '9422228205', '$2b$12$GrrnJjR5rjPKO2AZ20MqQe7Aa8wOI1vWPxJcDjM3NJZzcXizCdli2', 'owner'),
  ('Manager', '9527042265', '$2b$12$iHvgfcZIiiqlbUJ/cJkdYOlsHS/81ifrHJ8vsmAIgKdUCz56KJdHy', 'manager'),
  ('Driver',  '9999999999', '$2b$12$e1IAmg6V3SnkyaokdjyOqeRGYZKWo7PZWORysi9onLYkwqVrRiHP2', 'driver')
ON CONFLICT (mobile) DO UPDATE SET
  name     = EXCLUDED.name,
  password = EXCLUDED.password,
  role     = EXCLUDED.role
RETURNING id, name, mobile, role;
