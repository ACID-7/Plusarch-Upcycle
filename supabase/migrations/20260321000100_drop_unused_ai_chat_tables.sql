-- Remove unused legacy AI chat persistence tables.
-- The application now uses the /api/ai/chat route directly and does not read or write these tables.

DROP TABLE IF EXISTS ai_messages CASCADE;
DROP TABLE IF EXISTS ai_conversations CASCADE;
