/*
  # Create storage bucket for document files

  1. Storage Setup
    - Create a new storage bucket named 'document-files'
    - Set up security policies for the bucket

  2. Security Policies
    - Allow authenticated users to read all files
    - Allow users to upload files to their own documents
    - Allow users and admins to delete their own files
*/

-- Create the storage bucket
create bucket if not exists "document-files";

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