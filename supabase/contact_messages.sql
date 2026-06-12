-- ============================================================
-- Contact Messages Table — Stores messages from the Contact Us form
-- Run this SQL in the Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT DEFAULT '',
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for admin querying unread messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read ON contact_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- ── RLS Policies ──────────────────────────────────────────────
-- Anyone can INSERT (the contact form is public)
-- Only admins can SELECT/UPDATE/DELETE

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Public insert — anyone can submit a contact message
CREATE POLICY "Anyone can submit contact messages"
  ON contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Admin read — only admin users can read messages
CREATE POLICY "Admins can read contact messages"
  ON contact_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creators
      WHERE creators.id = auth.uid()
      AND creators.is_admin = true
    )
  );

-- Admin update — only admin users can mark messages as read
CREATE POLICY "Admins can update contact messages"
  ON contact_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM creators
      WHERE creators.id = auth.uid()
      AND creators.is_admin = true
    )
  );

-- Admin delete — only admin users can delete messages
CREATE POLICY "Admins can delete contact messages"
  ON contact_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM creators
      WHERE creators.id = auth.uid()
      AND creators.is_admin = true
    )
  );
