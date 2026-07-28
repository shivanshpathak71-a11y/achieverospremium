/*
# Create function to read Gemini key from vault

1. Functions
- `get_gemini_api_key()` — SECURITY DEFINER function that reads the decrypted
  Google Gemini API key from Supabase Vault via RPC, so the edge function
  can fetch it without direct vault table access.
2. Security
- SECURITY DEFINER, returns only the decrypted secret string.
*/

CREATE OR REPLACE FUNCTION public.get_gemini_api_key()
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
  WHERE name = 'gemini_api_key'
  LIMIT 1;
  RETURN key_value;
END;
$$;