CREATE OR REPLACE FUNCTION public.get_vdocipher_api_secret()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret_value text;
BEGIN
  SELECT decrypted_secret INTO secret_value
  FROM vault.decrypted_secrets
  WHERE name = 'vdocipher_api_secret'
  LIMIT 1;
  RETURN secret_value;
END;
$$;