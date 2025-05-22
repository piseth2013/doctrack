/*
  # Storage bucket and policies for document files
  
  1. Create bucket for document files
  2. Add policies for authenticated users to:
    - Upload files
    - Download files
    - Delete files
*/

-- Create bucket for document files
select storage.create_bucket('document-files', 'Document files storage');

-- Enable RLS on objects
alter table storage.objects enable row level security;

-- Policies for authenticated users
create policy "Allow authenticated users to upload files"
on storage.objects for insert to authenticated
with check (
    bucket_id = 'document-files' AND
    auth.role() = 'authenticated'
);

create policy "Allow authenticated users to download files"
on storage.objects for select to authenticated
using (
    bucket_id = 'document-files' AND
    auth.role() = 'authenticated'
);

create policy "Allow authenticated users to delete files"
on storage.objects for delete to authenticated
using (
    bucket_id = 'document-files' AND
    auth.role() = 'authenticated'
);