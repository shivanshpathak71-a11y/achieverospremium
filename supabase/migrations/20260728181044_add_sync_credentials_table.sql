/*
# Add sync credentials table for Steno School
# Stores login credentials so the sync edge function can authenticate
# and fetch course content from the Steno School API.
*/

CREATE TABLE IF NOT EXISTS sync_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL UNIQUE,
  email text NOT NULL,
  password text NOT NULL,
  api_base text NOT NULL,
  course_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sync_credentials ENABLE ROW LEVEL SECURITY;

-- Only service role can access (edge functions use service role key)
CREATE POLICY "select_sync_creds_service" ON sync_credentials FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "insert_sync_creds_service" ON sync_credentials FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "update_sync_creds_service" ON sync_credentials FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "delete_sync_creds_service" ON sync_credentials FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- Insert the guest account credentials for Steno School
INSERT INTO sync_credentials (source, email, password, api_base, course_id)
VALUES (
  'steno-school',
  'guest_sync_8473@temp.com',
  'GuestSync123!',
  'https://stenolearningappapi.akamai.net.in',
  '11'
)
ON CONFLICT (source) DO UPDATE SET
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  api_base = EXCLUDED.api_base,
  course_id = EXCLUDED.course_id,
  updated_at = now();
