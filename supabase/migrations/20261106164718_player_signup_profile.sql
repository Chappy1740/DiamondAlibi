-- Private account preferences are separate from every team roster.
begin;

alter table public.player_profiles
  add column play_level text check (play_level in (
    'New to softball', 'Recreational league', 'Competitive league (unclassified)',
    'Class E', 'Class D', 'Class C', 'Class B', 'Class A', 'Class AA', 'Major',
    'Other classification', 'Not sure'
  )),
  add column fielding_position text check (fielding_position in (
    'Pitcher', 'Catcher', 'First Base', 'Second Base', 'Third Base', 'Shortstop',
    'Left Field', 'Left Center', 'Center Field', 'Right Center', 'Right Field',
    'No Preference'
  ));

create function private.write_player_profile(
  p_nickname text,
  p_play_level text,
  p_fielding_position text,
  p_initialize boolean,
  p_update_preferences boolean
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := private.actor();
  nickname_to_save text := btrim(p_nickname);
begin
  if nickname_to_save is null or char_length(nickname_to_save) not between 1 and 40 then
    raise exception 'Nickname must be 1–40 characters';
  end if;
  insert into public.player_profiles(user_id, nickname, play_level, fielding_position)
  values (actor, nickname_to_save, p_play_level, p_fielding_position)
  on conflict (user_id) do update set
    nickname = excluded.nickname,
    play_level = case when p_update_preferences then excluded.play_level else player_profiles.play_level end,
    fielding_position = case when p_update_preferences then excluded.fielding_position else player_profiles.fielding_position end,
    updated_at = now()
  where not p_initialize;
  return found;
end;
$$;

-- Team creation and invitation redemption can seed a legacy account's profile.
-- A team alias must never overwrite an existing account name.
create or replace function private.save_profile(p_nickname text) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  perform private.write_player_profile(p_nickname, null, null, true, false);
end;
$$;

-- Keep the existing explicit nickname-only edit contract.
create or replace function public.da_save_profile(p_nickname text) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  perform private.write_player_profile(p_nickname, null, null, false, false);
end;
$$;

create function public.da_save_player_details(
  p_nickname text,
  p_play_level text,
  p_fielding_position text,
  p_initialize boolean
) returns boolean
language sql security invoker set search_path = '' as $$
  select private.write_player_profile(
    p_nickname, p_play_level, p_fielding_position, p_initialize, true
  );
$$;

revoke all on function private.write_player_profile(text, text, text, boolean, boolean),
  public.da_save_player_details(text, text, text, boolean) from public, anon, authenticated;
grant execute on function private.write_player_profile(text, text, text, boolean, boolean),
  public.da_save_player_details(text, text, text, boolean) to authenticated;

-- One replaceable image per account. No public links or cross-account access.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('da-player-profile-photos', 'da-player-profile-photos', false, 524288, array['image/jpeg']);

create policy da_profile_photo_owner on storage.objects
  for all to authenticated
  using (
    bucket_id = 'da-player-profile-photos'
    and name = ((select auth.uid())::text || '/avatar.jpg')
  )
  with check (
    bucket_id = 'da-player-profile-photos'
    and name = ((select auth.uid())::text || '/avatar.jpg')
  );

commit;
