-- Enforce valid participants for new friendship rows without deleting legacy
-- orphaned rows. Validate these constraints after old rows are reconciled.
begin;
do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.friendships'::regclass
          and conname = 'friendships_requester_user_fk'
    ) then
        alter table public.friendships
            add constraint friendships_requester_user_fk
            foreign key (requester_id) references public.site_users(id)
            on delete cascade not valid;
    end if;
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.friendships'::regclass
          and conname = 'friendships_addressee_user_fk'
    ) then
        alter table public.friendships
            add constraint friendships_addressee_user_fk
            foreign key (addressee_id) references public.site_users(id)
            on delete cascade not valid;
    end if;
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.friendships'::regclass
          and conname = 'friendships_distinct_users'
    ) then
        alter table public.friendships
            add constraint friendships_distinct_users
            check (requester_id <> addressee_id) not valid;
    end if;
end $$;
commit;
