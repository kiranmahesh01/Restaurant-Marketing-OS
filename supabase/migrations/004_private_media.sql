-- Private media objects are served only through the authenticated application.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('rmos-media','rmos-media',false,2500000,array['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm'])
on conflict(id) do nothing;
