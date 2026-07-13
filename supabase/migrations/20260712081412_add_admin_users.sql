-- Admin users table (role-based access control)
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_admin" ON admin_users FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_admin_by_admin" ON admin_users FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid())
  );

CREATE POLICY "delete_admin_by_admin" ON admin_users FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid())
  );
