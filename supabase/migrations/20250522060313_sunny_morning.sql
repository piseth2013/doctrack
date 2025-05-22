/*
  # Add document date field

  1. Changes
    - Add document_date column to documents table
    - Set default value to current date
    - Make field required

  2. Notes
    - Existing documents will have document_date set to current timestamp
*/

ALTER TABLE documents
ADD COLUMN document_date date NOT NULL DEFAULT CURRENT_DATE;