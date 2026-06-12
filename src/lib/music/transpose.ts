const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const FLAT_TO_SHARP: Record<string, string> = {
  Db: 'C#', Eb: 'D#', Fb: 'E', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B',
}

// Prefers flat names for these roots when displaying
const SHARP_TO_FLAT: Record<string, string> = {
  'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb',
}

function normalizeRoot(root: string): string {
  return FLAT_TO_SHARP[root] ?? root
}

function shiftRoot(root: string, semitones: number, useFlats: boolean): string {
  const normalized = normalizeRoot(root)
  const idx = CHROMATIC.indexOf(normalized)
  if (idx === -1) return root
  const shifted = CHROMATIC[(idx + semitones + 12) % 12]
  return useFlats ? (SHARP_TO_FLAT[shifted] ?? shifted) : shifted
}

// Transposes a single chord symbol, preserving suffix (m, 7, maj7, sus4, /bass, etc.)
export function transposeChord(chord: string, semitones: number, useFlats = false): string {
  if (semitones === 0) return chord

  // Match root note (e.g. C, C#, Bb) then the rest (m7, maj7, sus2, /E, etc.)
  const match = chord.match(/^([A-G][#b]?)(.*)$/)
  if (!match) return chord

  const [, root, suffix] = match

  // Handle slash chord bass note: C/E -> transpose both root and bass
  const slashIdx = suffix.lastIndexOf('/')
  if (slashIdx !== -1) {
    const chordSuffix = suffix.slice(0, slashIdx)
    const bassRoot = suffix.slice(slashIdx + 1)
    const bassSuffix = ''
    return (
      shiftRoot(root, semitones, useFlats) +
      chordSuffix +
      '/' +
      shiftRoot(bassRoot, semitones, useFlats) +
      bassSuffix
    )
  }

  return shiftRoot(root, semitones, useFlats) + suffix
}

// ---------------------------------------------------------------
// Parser de cifra
// Formato: [G]Texto da [D7]letra [Em]aqui
// ---------------------------------------------------------------

export interface ChordSegment {
  chord?: string
  text: string
}

export type ChordLine = ChordSegment[]

export function parseCifraLine(line: string): ChordLine {
  const segments: ChordSegment[] = []
  const regex = /\[([^\]]+)\]([^\[]*)/g

  const firstBracket = line.indexOf('[')
  if (firstBracket > 0) {
    segments.push({ text: line.slice(0, firstBracket) })
  }

  let match: RegExpExecArray | null
  while ((match = regex.exec(line)) !== null) {
    segments.push({ chord: match[1], text: match[2] })
  }

  if (segments.length === 0) {
    segments.push({ text: line })
  }

  return segments
}

export function parseCifra(content: string, semitones: number, useFlats = false): ChordLine[] {
  return content.split('\n').map((line) => {
    const parsed = parseCifraLine(line)
    if (semitones === 0) return parsed
    return parsed.map((seg) => ({
      ...seg,
      chord: seg.chord ? transposeChord(seg.chord, semitones, useFlats) : undefined,
    }))
  })
}

export const KEYS = CHROMATIC.flatMap((k) => [k, k + 'm'])

export function keyAfterTranspose(originalKey: string, semitones: number, useFlats = false): string {
  return transposeChord(originalKey, semitones, useFlats)
}
