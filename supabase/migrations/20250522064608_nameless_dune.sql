/*
  # Update storage policies for document files

  1. Security
    - Drop existing policies to avoid conflicts
    - Recreate policies for document file access:
      - Read access for all authenticated users
      - Upload access for document owners
      - Delete access for document owners and admins
*/

-- Drop existing policies if they exist
drop policy if exists "authenticated users can read all files" on storage.objects;
drop policy if exists "users can upload files to their documents" on storage.objects;
drop policy if exists "users can delete their own files" on storage.objects;

-- Create policy to allow authenticated users to read all files
create policy "authenticated users can read all files"
on storage.objects for select
to authenticated
using ( bucket_id = 'document-files' );

-- Create policy to allow users to upload files to their documents
create policy "users can upload files to their documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'document-files' and
  (exists (
    select 1 from documents
    where documents.id::text = (regexp_match(name, '^documents/([^/]+)/.*$'))[1]
    and documents.user_id = auth.uid()
  ))
);

-- Create policy to allow users and admins to delete their files
create policy "users can delete their own files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'document-files' and
  (exists (
    select 1 from documents
    where documents.id::text = (regexp_match(name, '^documents/([^/]+)/.*$'))[1]
    and (
      documents.user_id = auth.uid() or
      exists (
        select 1 from profiles
        where profiles.id = auth.uid()
        and profiles.role = 'admin'
      )
    )
  ))
);