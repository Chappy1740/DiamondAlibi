begin;

-- The hosted Storage CDN served the cached photo after the last shared
-- membership was revoked. Stop issuing direct reads to teammates.
drop policy if exists da_profile_photo_teammate_select on storage.objects;

commit;
