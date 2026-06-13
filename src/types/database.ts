export type MusicalKey =
  | 'C' | 'C#' | 'Db' | 'D' | 'D#' | 'Eb' | 'E'
  | 'F' | 'F#' | 'Gb' | 'G' | 'G#' | 'Ab' | 'A' | 'A#' | 'Bb' | 'B'
  | 'Cm' | 'C#m' | 'Dbm' | 'Dm' | 'D#m' | 'Ebm' | 'Em'
  | 'Fm' | 'F#m' | 'Gbm' | 'Gm' | 'G#m' | 'Abm' | 'Am' | 'A#m' | 'Bbm' | 'Bm'

export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Song {
  id: string
  user_id: string | null
  title: string
  artist: string
  original_key: MusicalKey
  bpm: number | null
  genre: string | null
  youtube_url: string | null
  audio_path: string | null
  is_public: boolean
  play_count: number
  created_at: string
  updated_at: string
}

export interface Chord {
  id: string
  song_id: string
  content: string
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Tipo composto usado no visualizador de cifras
export interface SongWithChords extends Song {
  chords: Chord[]
}

// Tipo do banco Supabase (para usar com createClient<Database>)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      songs: {
        Row: Song
        Insert: Omit<Song, 'id' | 'play_count' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Song, 'id' | 'created_at' | 'updated_at'>>
      }
      chords: {
        Row: Chord
        Insert: Omit<Chord, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Chord, 'id' | 'song_id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}
