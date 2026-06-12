-- =============================================================
-- SmartCifra — Schema do Banco de Dados
-- Execute no Supabase: Dashboard → SQL Editor → New query
-- =============================================================

-- ============================================================
-- TABELA: profiles
-- Estende o auth.users do Supabase com dados de perfil público
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Trigger: cria perfil automaticamente quando um usuário se registra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: atualiza updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- TABELA: songs
-- Músicas com metadados musicais
-- ============================================================
create table if not exists public.songs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete set null,
  title        text not null,
  artist       text not null,
  original_key text not null default 'C',  -- ex: C, C#, D, Eb, E, F, F#, G, Ab, A, Bb, B
  bpm          integer check (bpm > 0 and bpm < 500),
  youtube_url  text,
  audio_path   text,                        -- path no Supabase Storage
  is_public    boolean not null default true,
  play_count   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint valid_key check (
    original_key in (
      'C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B',
      'Cm','C#m','Dbm','Dm','D#m','Ebm','Em','Fm','F#m','Gbm','Gm','G#m','Abm','Am','A#m','Bbm','Bm'
    )
  )
);

create index if not exists songs_user_id_idx on public.songs(user_id);
create index if not exists songs_is_public_idx on public.songs(is_public);
create index if not exists songs_title_artist_idx on public.songs using gin(
  to_tsvector('portuguese', title || ' ' || artist)
);

create trigger songs_updated_at
  before update on public.songs
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- TABELA: chords
-- Conteúdo da cifra: letra com marcações de acorde inline
-- Formato: [G]Texto da [D]letra aqui
-- ============================================================
create table if not exists public.chords (
  id          uuid primary key default gen_random_uuid(),
  song_id     uuid not null references public.songs(id) on delete cascade,
  content     text not null,               -- cifra completa em formato texto
  version     integer not null default 1,  -- permite histórico de versões
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (song_id, version)
);

create index if not exists chords_song_id_idx on public.chords(song_id);

create trigger chords_updated_at
  before update on public.chords
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- profiles
alter table public.profiles enable row level security;

create policy "Perfis públicos são visíveis por todos"
  on public.profiles for select using (true);

create policy "Usuário pode editar seu próprio perfil"
  on public.profiles for update using (auth.uid() = id);

-- songs
alter table public.songs enable row level security;

create policy "Músicas públicas são visíveis por todos"
  on public.songs for select using (is_public = true);

create policy "Usuário vê suas próprias músicas (públicas e privadas)"
  on public.songs for select using (auth.uid() = user_id);

create policy "Usuário autenticado pode criar músicas"
  on public.songs for insert with check (auth.uid() = user_id);

create policy "Usuário pode editar suas próprias músicas"
  on public.songs for update using (auth.uid() = user_id);

create policy "Usuário pode deletar suas próprias músicas"
  on public.songs for delete using (auth.uid() = user_id);

-- chords
alter table public.chords enable row level security;

create policy "Cifras de músicas públicas são visíveis por todos"
  on public.chords for select
  using (
    exists (
      select 1 from public.songs
      where songs.id = chords.song_id and songs.is_public = true
    )
  );

create policy "Dono da música pode ver todas as cifras"
  on public.chords for select
  using (
    exists (
      select 1 from public.songs
      where songs.id = chords.song_id and songs.user_id = auth.uid()
    )
  );

create policy "Dono da música pode criar cifras"
  on public.chords for insert
  with check (
    exists (
      select 1 from public.songs
      where songs.id = chords.song_id and songs.user_id = auth.uid()
    )
  );

create policy "Dono da música pode editar cifras"
  on public.chords for update
  using (
    exists (
      select 1 from public.songs
      where songs.id = chords.song_id and songs.user_id = auth.uid()
    )
  );

create policy "Dono da música pode deletar cifras"
  on public.chords for delete
  using (
    exists (
      select 1 from public.songs
      where songs.id = chords.song_id and songs.user_id = auth.uid()
    )
  );
