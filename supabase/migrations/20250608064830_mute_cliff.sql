/*
  # Document Approval System

  1. Database Changes
    - Add approval workflow columns to documents table
    - Update status constraint to include 'needs_changes'
    - Add performance indexes
    - Update RLS policies for approval workflow

  2. Security
    - Users can view documents they submitted or are assigned to approve
    - Approvers can update documents assigned to them
    - Maintain existing admin privileges
*/

-- Add new columns to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS approver_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS note_to_approver text,
ADD COLUMN IF NOT EXISTS approver_comment text,
ADD COLUMN IF NOT EXISTS approved_at timestamptz,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Update status constraint to include new status
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'needs_changes'::text]));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_approver_id ON documents(approver_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_user_id_status ON documents(user_id, status);

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view all documents" ON documents;
DROP POLICY IF EXISTS "Users can manage own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents or approvers can update assigned documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents or admins can delete any" ON documents;
DROP POLICY IF EXISTS "Users can view documents they submitted or are assigned to approve" ON documents;

-- Create new RLS policies for approval workflow
CREATE POLICY "Users can view documents they submitted or are assigned to approve"
ON documents FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  auth.uid() = approver_id OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can insert their own documents"
ON documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents or approvers can update assigned documents"
ON documents FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id OR 
  auth.uid() = approver_id OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = user_id OR 
  auth.uid() = approver_id OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can delete their own documents or admins can delete any"
ON documents FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);