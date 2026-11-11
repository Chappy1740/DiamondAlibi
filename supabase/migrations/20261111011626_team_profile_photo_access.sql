begin;

drop policy da_profile_photo_owner on storage.objects;

-- The owner may add, replace and remove the one avatar in their own folder.
create policy da_profile_photo_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'da-player-profile-photos'
    and name = ((select auth.uid())::text || '/avatar.jpg'));

create policy da_profile_photo_update on storage.objects for update to authenticated
  using (bucket_id = 'da-player-profile-photos'
    and name = ((select auth.uid())::text || '/avatar.jpg'))
  with check (bucket_id = 'da-player-profile-photos'
    and name = ((select auth.uid())::text || '/avatar.jpg'));

create policy da_profile_photo_delete on storage.objects for delete to authenticated
  using (bucket_id = 'da-player-profile-photos'
    and name = ((select auth.uid())::text || '/avatar.jpg'));

-- Storage needs SELECT for upsert and removal as well as download.
-- Allow the operations we use so a user cannot mint a bearer URL.
create policy da_profile_photo_owner_select on storage.objects for select to authenticated
  using (bucket_id = 'da-player-profile-photos'
    and name = ((select auth.uid())::text || '/avatar.jpg')
    and storage.allow_any_operation(array[
      'object.get_authenticated', 'object.upload', 'object.upload_update',
      'object.delete', 'object.delete_many'
    ]));

create policy da_profile_photo_teammate_select on storage.objects for select to authenticated
  using (bucket_id = 'da-player-profile-photos'
    and storage.allow_only_operation('object.get_authenticated')
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
