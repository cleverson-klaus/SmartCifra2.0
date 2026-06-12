"""
Detecção automática de acordes a partir de áudio.

Abordagem:
1. Carrega o áudio com librosa
2. Extrai chromagrama CQT (12 bins = 12 notas da escala cromática)
3. Sincroniza o chroma com os beats detectados
4. Para cada beat, encontra o acorde mais próximo por similaridade de cosseno
5. Estima a tonalidade (key) usando perfis de Krumhansl-Schmuckler
"""

import numpy as np
import librosa

# Nomes das 12 classes de pitch (começando em C)
PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

# Mapeamento de enarmônicos para notação mais comum
ENHARMONIC = {
    'C#': 'C#', 'D#': 'D#', 'F#': 'F#', 'G#': 'G#', 'A#': 'Bb',
}


def _build_chord_templates() -> dict[str, np.ndarray]:
    """Cria templates de acordes maiores e menores para todas as 12 raízes."""
    templates: dict[str, np.ndarray] = {}
    for i, root in enumerate(PITCH_CLASSES):
        # Maior: fundamental + terça maior (4 st) + quinta (7 st)
        t_maj = np.zeros(12)
        t_maj[i % 12] = 1.0
        t_maj[(i + 4) % 12] = 1.0
        t_maj[(i + 7) % 12] = 1.0
        templates[root] = t_maj / np.linalg.norm(t_maj)

        # Menor: fundamental + terça menor (3 st) + quinta (7 st)
        t_min = np.zeros(12)
        t_min[i % 12] = 1.0
        t_min[(i + 3) % 12] = 1.0
        t_min[(i + 7) % 12] = 1.0
        templates[f'{root}m'] = t_min / np.linalg.norm(t_min)

    return templates


CHORD_TEMPLATES = _build_chord_templates()


def _cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    na, nb = np.linalg.norm(a), np.linalg.norm(b)
    if na == 0 or nb == 0:
        return 0.0
    return float(np.dot(a, b) / (na * nb))


def _match_chord(chroma_vec: np.ndarray) -> tuple[str, float]:
    """Retorna o nome do acorde e a confiança (similaridade de cosseno)."""
    best_name, best_score = 'N', -1.0
    for name, template in CHORD_TEMPLATES.items():
        score = _cosine_sim(chroma_vec, template)
        if score > best_score:
            best_score = score
            best_name = name
    return best_name, best_score


def _estimate_key(chroma_mean: np.ndarray) -> str:
    """
    Estima a tonalidade usando os perfis de Krumhansl-Schmuckler (1990).
    Compara a média do chromagrama com perfis de escalas maior e menor.
    """
    # Perfis de proeminência tonal (maiores valores = notas mais importantes na tonalidade)
    major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09,
                               2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
    minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53,
                               2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

    best_key, best_corr = 'C', -np.inf

    for i, root in enumerate(PITCH_CLASSES):
        maj_rot = np.roll(major_profile, i)
        min_rot = np.roll(minor_profile, i)

        corr_maj = float(np.corrcoef(chroma_mean, maj_rot)[0, 1])
        corr_min = float(np.corrcoef(chroma_mean, min_rot)[0, 1])

        if corr_maj > best_corr:
            best_corr = corr_maj
            best_key = root
        if corr_min > best_corr:
            best_corr = corr_min
            best_key = f'{root}m'

    return best_key


def detect_chords(audio_path: str) -> dict:
    """
    Analisa o arquivo de áudio e retorna BPM, tonalidade e lista de acordes com timestamps.

    Retorno:
        {
            "bpm": 120.0,
            "key": "G",
            "chords": [
                {"chord": "G",  "time": 0.5},
                {"chord": "Em", "time": 2.3},
                ...
            ]
        }
    """
    hop_length = 512

    # Carrega mono, taxa de amostragem padrão do librosa (22050 Hz)
    y, sr = librosa.load(audio_path, mono=True)

    # --- Beat tracking ---
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop_length)
    beat_times = librosa.frames_to_time(beat_frames, sr=sr, hop_length=hop_length)

    # --- Chromagrama CQT (mais preciso que STFT para pitch) ---
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop_length, bins_per_octave=36)

    # Suavização temporal para reduzir ruído
    chroma = np.minimum(chroma, librosa.decompose.nn_filter(chroma, aggregate=np.median, metric='cosine'))
    chroma = librosa.util.normalize(chroma, axis=0)

    # Sincroniza chroma com os beats (mediana por beat = mais robusto que média)
    chroma_beats = librosa.util.sync(chroma, beat_frames, aggregate=np.median)

    # --- Estimativa de tonalidade ---
    key = _estimate_key(chroma.mean(axis=1))

    # --- Detecção de acordes por beat ---
    chords = []
    prev_chord: str | None = None

    for time, chroma_vec in zip(beat_times, chroma_beats.T):
        chord, confidence = _match_chord(chroma_vec)

        # Só registra quando o acorde muda e com confiança mínima
        if chord != prev_chord and confidence >= 0.82:
            chords.append({
                'chord': chord,
                'time': round(float(time), 3),
            })
            prev_chord = chord

    # Garante pelo menos um acorde
    if not chords and len(beat_times) > 0:
        chord, _ = _match_chord(chroma_beats[:, 0])
        chords.append({'chord': chord, 'time': round(float(beat_times[0]), 3)})

    return {
        'bpm': round(float(tempo), 1),
        'key': key,
        'chords': chords,
    }
