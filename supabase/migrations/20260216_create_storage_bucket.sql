-- Create the storage bucket
insert into storage.buckets (id, name, public)
values ('RAG', 'RAG', true)
on conflict (id) do nothing;

-- Set up RLS policies for the bucket
-- Allow public read access
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'RAG' );

-- Allow admins to upload/update/delete
create policy "Admin Upload"
on storage.objects for insert
with check (
  bucket_id = 'RAG' AND
  public.is_admin_user()
);

create policy "Admin Update"
on storage.objects for update
using (
  bucket_id = 'RAG' AND
  public.is_admin_user()
);

create policy "Admin Delete"
on storage.objects for delete
using (
  bucket_id = 'RAG' AND
  public.is_admin_user()
);
