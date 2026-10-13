-- REVIEW PROPOSAL ONLY. Not applied. Generate a migration with the Supabase CLI
-- after owner approval of this exact private persistence scope.
begin;
create table public.personal_alibis (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default '' check (char_length(title) <= 80),
  body text not null check (char_length(body) between 1 and 4000 and btrim(body) <> ''),
  category text not null check (category in ('New Gear','At Home','Bad Plays','Team Shenanigans')),
  revision integer not null default 1 check (revision > 0),
  last_command_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index personal_alibis_owner_updated on public.personal_alibis (user_id, updated_at desc, id desc);
alter table public.personal_alibis enable row level security;
alter table public.personal_alibis force row level security;
create policy personal_alibis_read on public.personal_alibis for select to authenticated
  using (user_id = (select auth.uid()));
create policy personal_alibis_insert on public.personal_alibis for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy personal_alibis_update on public.personal_alibis for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy personal_alibis_delete on public.personal_alibis for delete to authenticated
  using (user_id = (select auth.uid()));
revoke all on public.personal_alibis from public, anon, authenticated;
grant select, delete on public.personal_alibis to authenticated;
grant insert (id,user_id,title,body,category,revision,last_command_id) on public.personal_alibis to authenticated;
grant update (title,body,category,revision,last_command_id,updated_at) on public.personal_alibis to authenticated;

create function public.da_save_personal_alibi(
  p_id uuid, p_command uuid, p_expected integer, p_title text, p_body text, p_category text
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  actor uuid := auth.uid();
  saved public.personal_alibis%rowtype;
begin
  if actor is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_id is null or p_command is null or p_expected is null or p_expected < 0 or p_expected >= 2147483647
    or p_title is null or char_length(p_title) > 80 or p_body is null
    or char_length(p_body) not between 1 and 4000 or btrim(p_body) = ''
    or p_category is null or p_category not in ('New Gear','At Home','Bad Plays','Team Shenanigans')
  then raise exception 'Invalid alibi' using errcode = '22023'; end if;
  select * into saved from public.personal_alibis where id = p_id and user_id = actor for update;
  if found then
    if saved.last_command_id = p_command then
      if saved.title <> p_title or saved.body <> p_body or saved.category <> p_category then
        raise exception 'Reused save identifier' using errcode = '22023';
      end if;
    else
      if saved.revision <> p_expected then return jsonb_build_object('status','conflict'); end if;
      update public.personal_alibis set title=p_title, body=p_body, category=p_category,
        revision=revision+1, last_command_id=p_command, updated_at=clock_timestamp()
        where id=p_id and user_id=actor returning * into saved;
    end if;
  else
    if p_expected <> 0 then return jsonb_build_object('status','conflict'); end if;
    insert into public.personal_alibis(id,user_id,title,body,category,last_command_id)
      values(p_id,actor,p_title,p_body,p_category,p_command) on conflict (id) do nothing
      returning * into saved;
    if not found then return jsonb_build_object('status','conflict'); end if;
  end if;
  return jsonb_build_object('status','saved','item',jsonb_build_object(
    'id',saved.id,'title',saved.title,'body',saved.body,'category',saved.category,
    'revision',saved.revision,'updated_at',saved.updated_at));
end; $$;

create function public.da_delete_personal_alibi(p_id uuid, p_expected integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare actor uuid := auth.uid(); saved public.personal_alibis%rowtype;
begin
  if actor is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_id is null or p_expected is null or p_expected < 1 then
    raise exception 'Invalid alibi' using errcode = '22023'; end if;
  select * into saved from public.personal_alibis where id=p_id and user_id=actor for update;
  -- Missing and inaccessible IDs have the same response; delete retries are safe.
  if not found then return jsonb_build_object('status','deleted'); end if;
  if saved.revision <> p_expected then return jsonb_build_object('status','conflict'); end if;
  delete from public.personal_alibis where id=p_id and user_id=actor;
  return jsonb_build_object('status','deleted');
end; $$;
revoke all on function public.da_save_personal_alibi(uuid,uuid,integer,text,text,text) from public, anon;
revoke all on function public.da_delete_personal_alibi(uuid,integer) from public, anon;
grant execute on function public.da_save_personal_alibi(uuid,uuid,integer,text,text,text) to authenticated;
grant execute on function public.da_delete_personal_alibi(uuid,integer) to authenticated;
commit;
