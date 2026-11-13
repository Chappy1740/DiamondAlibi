begin;

-- The hosted Storage gateway looks up authenticated object info before it
-- serves the bytes. Both operations use the same bucket and access checks.
alter policy da_profile_photo_owner_select on storage.objects
  using (bucket_id = 'da-player-profile-photos'
    and name = ((select auth.uid())::text || '/avatar.jpg')
    and storage.allow_any_operation(array[
      'object.get_authenticated', 'object.get_authenticated_info',
      'object.upload', 'object.upload_update', 'object.delete', 'object.delete_many'
    ]));

alter policy da_profile_photo_teammate_select on storage.objects
  using (bucket_id = 'da-player-profile-photos'
    and storage.allow_any_operation(array[
      'object.get_authenticated', 'object.get_authenticated_info'
    ])
    and exists (
      select 1
      from public.team_memberships as viewer
      join public.team_memberships as target using (team_id)
      where viewer.user_id = (select auth.uid()) and viewer.active and target.active
        and target.user_id = case
          when storage.objects.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/avatar[.]jpg$'
          then split_part(storage.objects.name, '/', 1)::uuid
        end
    ));

commit;
