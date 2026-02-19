-- Align inquiries table with sprint requirements.
-- Some environments were missing inquiries.subject, which breaks inquiry inserts/admin views.
ALTER TABLE inquiries
ADD COLUMN IF NOT EXISTS subject TEXT;
UPDATE inquiries
SET subject = COALESCE(
    NULLIF(
      regexp_replace(
        split_part(message, E'\n', 1),
        '^Subject:\\s*',
        '',
        'i'
      ),
      ''
    ),
    'General inquiry'
  )
WHERE subject IS NULL
  OR btrim(subject) = '';
ALTER TABLE inquiries
ALTER COLUMN subject
SET DEFAULT 'General inquiry';
ALTER TABLE inquiries
ALTER COLUMN subject
SET NOT NULL;