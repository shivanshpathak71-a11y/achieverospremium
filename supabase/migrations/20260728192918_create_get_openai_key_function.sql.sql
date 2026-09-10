/*
# Create function to read OpenAI key from vault

1. Functions
- `get_openai_api_key()` — a SECURITY DEFINER function that reads the decrypted
  OpenAI API key from the Supabase Vault. This allows the edge function to fetch
  the secret via an RPC call (supabase.rpc), since the `vault.decrypted_secrets`
  view is not accessible through the REST API directly.
2. Security
- The function is SECURITY DEFINER so it can read from vault.decrypted_secrets.
- It returns only the decrypted secret string, nothing else.
*/

CREATE OR REPLACE FUNCTION public.get_openai_api_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key_value text;
BEGIN
  SELECT decrypted_secret INTO key_value
  FROM vault.decrypted_secrets
  WHERE name = 'openai_api_key'
  LIMIT 1;
  RETURN key_value;
END;
$$;