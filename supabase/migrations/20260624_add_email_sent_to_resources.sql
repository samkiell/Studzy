-- Add email_sent column to resources
ALTER TABLE resources ADD COLUMN email_sent BOOLEAN NOT NULL DEFAULT false;

-- For existing published resources, mark them as email_sent = true to prevent duplicate emails
UPDATE resources SET email_sent = true WHERE status = 'published';
