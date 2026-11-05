/*
# Create inquiries table for the contact form

1. New Tables
- `inquiries`
  - `id` (uuid, primary key)
  - `name` (text, required, 1-100 chars)
  - `email` (text, required, 3-254 chars)
  - `company` (text, optional, up to 120 chars)
  - `product_interest` (text, optional, up to 60 chars)
  - `message` (text, required, 10-2000 chars)
  - `created_at` (timestamptz, defaults to now)

2. Security
- Enable RLS on `inquiries`.
- Grant INSERT only to `anon` and `authenticated`, so visitors can submit but never read other submissions.
- Single INSERT policy for `anon` and `authenticated`; no SELECT, UPDATE, or DELETE policies exist.

3. Notes
- Length checks mirror the form validation and reject oversized payloads at the database level.
*/

CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  company text CHECK (company IS NULL OR char_length(company) <= 120),
  product_interest text CHECK (product_interest IS NULL OR char_length(product_interest) <= 60),
  message text NOT NULL CHECK (char_length(message) BETWEEN 10 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON inquiries TO anon, authenticated;

DROP POLICY IF EXISTS "anon_insert_inquiries" ON inquiries;
CREATE POLICY "anon_insert_inquiries" ON inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
