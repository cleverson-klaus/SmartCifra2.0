-- =============================================================
-- SmartCifra — Dados de Exemplo (Seed)
-- Execute APÓS o schema.sql
-- =============================================================

-- Insere músicas de exemplo (sem user_id — criadas como anônimas/públicas)
insert into public.songs (title, artist, original_key, bpm, is_public)
values
  ('Pais e Filhos',        'Legião Urbana',  'G',  74,  true),
  ('Admirável Chip Novo',  'Pitty',          'Em', 148, true),
  ('Eduardo e Mônica',     'Legião Urbana',  'D',  116, true),
  ('Garota de Ipanema',    'Tom Jobim',      'F',  130, true),
  ('Wish You Were Here',   'Pink Floyd',     'G',  63,  true),
  ('Paranoid Android',     'Radiohead',      'C',  82,  true)
on conflict do nothing;

-- Insere cifra para "Pais e Filhos"
insert into public.chords (song_id, content, version)
select
  s.id,
  '[G]Nada vai me fazer [D]desistir
[Em]Minha vida passou [C]por aqui

[G]Pais e filhos [D]se entendem no [Em]fim
[C]No fim as pedras [G]cedem

[G]A vida é tão [D]rara
[Em]Tão rara [C]demais',
  1
from public.songs s
where s.title = 'Pais e Filhos'
on conflict do nothing;

-- Insere cifra para "Admirável Chip Novo"
insert into public.chords (song_id, content, version)
select
  s.id,
  '[Em]Pane no sistema, [G]alguém me deletou
[D]Não era um vírus, [A]era um usuário

[Em]Fui programada pra [G]te encontrar
[D]Mas errei o [A]programa

[Em]Admiro quem me [G]admira
[D]Estou aqui tão [A]viva',
  1
from public.songs s
where s.title = 'Admirável Chip Novo'
on conflict do nothing;
