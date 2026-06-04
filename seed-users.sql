INSERT INTO users (username, password, role)
VALUES ('admin', '21232f297a57a5a743894a0e4a801fc3', 'admin')
ON CONFLICT (username) DO UPDATE
SET password = EXCLUDED.password,
    role = EXCLUDED.role;
