export const GENRES = [
  'Sertanejo',
  'Pagode / Samba',
  'Forró',
  'MPB',
  'Rock',
  'Pop',
  'Gospel',
  'Funk',
  'Axé',
  'Reggae',
  'Blues / Jazz',
  'Outro',
] as const

export type Genre = (typeof GENRES)[number]
