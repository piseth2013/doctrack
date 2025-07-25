/*
  # Enhanced Document Approval Workflow

  1. New Columns
    - `approver_id` (uuid, foreign key to profiles)
    - `note_to_approver` (text, optional note from submitter)
    - `approver_comment` (text, comment from approver)
    - `approved_at` (timestamptz, when document was approved/rejected)
    - `approved_by` (uuid, foreign key to profiles who made the decision)

  2. Updated Status Constraint
    - Add 'needs_changes' status to existing constraint

  3. Performance Indexes
    - Index on approver_id for faster approver queries
    - Index on status for filtering
    - Composite index on user_id and status

  4. Enhanced RLS Policies
    - Users can view documents they submitted or are assigned to approve
    - Admins can view all documents
    - Proper update permissions for submitters and approvers
    - Delete permissions for document owners and admins
*/

-- Add new columns to documents table
DO $$
BEGIN
  -- Add approver_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'approver_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN approver_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  -- Add note_to_approver column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'note_to_approver'
  ) THEN
    ALTER TABLE documents ADD COLUMN note_to_approver text;
  END IF;

  -- Add approver_comment column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'approver_comment'
  ) THEN
    ALTER TABLE documents ADD COLUMN approver_comment text;
  END IF;

  -- Add approved_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE documents ADD COLUMN approved_at timestamptz;
  END IF;

  -- Add approved_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE documents ADD COLUMN approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update status constraint to include new status
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'needs_changes'::text]));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_approver_id ON documents(approver_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_user_id_status ON documents(user_id, status);

-- Drop all existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view all documents" ON documents;
DROP POLICY IF EXISTS "Users can manage own documents" ON documents;
DROP POLICY IF EXISTS "Users can view documents they submitted or are assigned to approve" ON documents;
DROP POLICY IF EXISTS "Users can view documents they submitted or are assigned to appr" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents or approvers can update assigned documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents or approvers can update as" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents or admins can delete any" ON documents;

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