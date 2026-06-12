-- Corrige o constraint valid_key para incluir tonalidades menores (Em, Am, Dm, etc.)
alter table public.songs
  drop constraint valid_key;

alter table public.songs
  add constraint valid_key check (
    original_key in (
      'C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B',
      'Cm','C#m','Dbm','Dm','D#m','Ebm','Em','Fm','F#m','Gbm','Gm','G#m','Abm','Am','A#m','Bbm','Bm'
    )
  );
