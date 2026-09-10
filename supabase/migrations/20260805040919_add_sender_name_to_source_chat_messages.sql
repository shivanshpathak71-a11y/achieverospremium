-- Add sender_name column to source_chat_messages so we can display
-- the actual username from the source chat server instead of "Student"
ALTER TABLE source_chat_messages
  ADD COLUMN IF NOT EXISTS sender_name text DEFAULT '';

-- Backfill existing rows so they don't show blank
UPDATE source_chat_messages SET sender_name = 'Student' WHERE sender_name = '' OR sender_name IS NULL;
