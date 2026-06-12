"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic2, MicOff, Square } from "lucide-react";
import clsx from "clsx";

// ---------------------------------------------------------------
// Detecção de frequência fundamental via autocorrelação (YIN simplificado)
// ---------------------------------------------------------------
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function frequencyToNote(freq: number): { note: string; octave: number; cents: number } | null {
  if (freq < 50 || freq > 4200) return null;
  const midi = 12 * Math.log2(freq / 440) + 69;
  const rounded = Math.round(midi);
  const cents = Math.round((midi - rounded) * 100);
  return {
    note: NOTE_NAMES[rounded % 12],
    octave: Math.floor(rounded / 12) - 1,
    cents,
  };
}

function detectPitch(buffer: Float32Array<ArrayBuffer>, sampleRate: number): number | null {
  const SIZE = buffer.length;
  const correlations = new Float32Array(SIZE);
  let rms = 0;

  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return null; // silêncio

  for (let lag = 0; lag < SIZE; lag++) {
    let sum = 0;
    for (let i = 0; i < SIZE - lag; i++) {
      sum += buffer[i] * buffer[i + lag];
    }
    correlations[lag] = sum;
  }

  // Encontra o primeiro pico após o ponto mínimo
  let start = 0;
  while (start < SIZE / 2 && correlations[start] > correlations[start + 1]) start++;

  let maxVal = -Infinity;
  let maxLag = -1;
  for (let i = start; i < SIZE / 2; i++) {
    if (correlations[i] > maxVal) {
      maxVal = correlations[i];
      maxLag = i;
    }
  }

  if (maxLag === -1 || maxVal < 0.01) return null;
  return sampleRate / maxLag;
}

// ---------------------------------------------------------------
// Estado possível do microfone
// ---------------------------------------------------------------
type MicState = "idle" | "requesting" | "active" | "denied" | "error";

interface NoteInfo {
  note: string;
  octave: number;
  cents: number;
}

export default function AudioWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const pitchBufRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  const [micState, setMicState] = useState<MicState>("idle");
  const [volume, setVolume] = useState(0);
  const [noteInfo, setNoteInfo] = useState<NoteInfo | null>(null);

  // ---------------------------------------------------------------
  // Loop de renderização
  // ---------------------------------------------------------------
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const audioCtx = audioCtxRef.current;
    if (!canvas || !analyser || !audioCtx) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    // Waveform
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#111827"; // gray-900
    ctx.fillRect(0, 0, W, H);

    // Linha central
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();

    // Onda
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#6366f1"; // indigo-500
    ctx.beginPath();

    const sliceWidth = W / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * H) / 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(W, H / 2);
    ctx.stroke();

    // Volume RMS
    let rms = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = (dataArray[i] - 128) / 128;
      rms += v * v;
    }
    setVolume(Math.min(1, Math.sqrt(rms / bufferLength) * 5));

    // Detecção de pitch a cada 3 frames
    if (pitchBufRef.current && audioCtx) {
      analyser.getFloatTimeDomainData(pitchBufRef.current);
      const freq = detectPitch(pitchBufRef.current, audioCtx.sampleRate);
      if (freq) {
        const info = frequencyToNote(freq);
        setNoteInfo(info);
      }
    }

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  // ---------------------------------------------------------------
  // Iniciar microfone
  // ---------------------------------------------------------------
  const startMic = useCallback(async () => {
    setMicState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      pitchBufRef.current = new Float32Array(analyser.fftSize);

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      setMicState("active");
      rafRef.current = requestAnimationFrame(draw);
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setMicState("denied");
      } else {
        setMicState("error");
      }
    }
  }, [draw]);

  // ---------------------------------------------------------------
  // Parar microfone
  // ---------------------------------------------------------------
  const stopMic = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    analyserRef.current = null;
    audioCtxRef.current = null;
    streamRef.current = null;
    pitchBufRef.current = null;
    setMicState("idle");
    setVolume(0);
    setNoteInfo(null);

    // Limpa canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Cleanup no unmount
  useEffect(() => () => stopMic(), [stopMic]);

  // Redimensiona canvas ao montar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const isActive = micState === "active";

  return (
    <div className="space-y-4">
      {/* Indicadores */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Status do mic */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <div
            className={clsx(
              "mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-colors",
              isActive ? "bg-emerald-500/20" : "bg-gray-800"
            )}
          >
            {isActive ? (
              <Mic2 className="h-6 w-6 text-emerald-400" />
            ) : (
              <MicOff className="h-6 w-6 text-gray-500" />
            )}
          </div>
          <p className="text-xs font-medium text-gray-300">Microfone</p>
          <p className={clsx("mt-1 text-xs", isActive ? "text-emerald-400" : "text-gray-600")}>
            {micState === "idle" && "Inativo"}
            {micState === "requesting" && "Aguardando permissão..."}
            {micState === "active" && "Ativo"}
            {micState === "denied" && "Acesso negado"}
            {micState === "error" && "Erro ao abrir"}
          </p>
        </div>

        {/* Nota detectada */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <div className="mb-1 text-3xl font-bold font-mono text-indigo-400">
            {isActive && noteInfo ? `${noteInfo.note}${noteInfo.octave}` : "—"}
          </div>
          <p className="text-xs font-medium text-gray-300">Nota detectada</p>
          {isActive && noteInfo && (
            <p
              className={clsx(
                "mt-1 text-xs",
                Math.abs(noteInfo.cents) < 10
                  ? "text-emerald-400"
                  : Math.abs(noteInfo.cents) < 25
                    ? "text-amber-400"
                    : "text-red-400"
              )}
            >
              {noteInfo.cents === 0
                ? "Afinado ✓"
                : noteInfo.cents > 0
                  ? `+${noteInfo.cents}¢ acima`
                  : `${noteInfo.cents}¢ abaixo`}
            </p>
          )}
          {(!isActive || !noteInfo) && (
            <p className="mt-1 text-xs text-gray-600">Aguardando áudio</p>
          )}
        </div>

        {/* Volume */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
          <div className="mb-3 flex items-end justify-center gap-0.5 h-12">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={clsx(
                  "w-2 rounded-sm transition-all duration-75",
                  isActive && volume > i / 12
                    ? i < 8
                      ? "bg-emerald-400"
                      : i < 10
                        ? "bg-amber-400"
                        : "bg-red-400"
                    : "bg-gray-800"
                )}
                style={{ height: `${((i + 1) / 12) * 100}%` }}
              />
            ))}
          </div>
          <p className="text-xs font-medium text-gray-300">Volume</p>
          <p className="mt-1 text-xs text-gray-600">
            {isActive ? `${Math.round(volume * 100)}%` : "—"}
          </p>
        </div>
      </div>

      {/* Canvas da waveform */}
      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
          <span className="text-xs font-medium text-gray-400">Forma de onda</span>
          <span
            className={clsx(
              "rounded-full px-2 py-0.5 text-xs",
              isActive
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-gray-800 text-gray-600"
            )}
          >
            {isActive ? "● Ao vivo" : "Inativo"}
          </span>
        </div>
        <canvas
          ref={canvasRef}
          className="h-28 w-full"
          style={{ display: "block" }}
        />
      </div>

      {/* Botão principal */}
      {micState === "denied" && (
        <p className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          Permissão de microfone negada. Clique no ícone de cadeado na barra do navegador e
          permita o acesso ao microfone.
        </p>
      )}

      <button
        onClick={isActive ? stopMic : startMic}
        disabled={micState === "requesting"}
        className={clsx(
          "flex w-full items-center justify-center gap-2 rounded-xl py-3 font-medium transition-colors disabled:opacity-50",
          isActive
            ? "bg-red-600 text-white hover:bg-red-500"
            : "bg-emerald-600 text-white hover:bg-emerald-500"
        )}
      >
        {isActive ? (
          <><Square className="h-4 w-4" /> Parar microfone</>
        ) : micState === "requesting" ? (
          "Aguardando permissão..."
        ) : (
          <><Mic2 className="h-4 w-4" /> Iniciar microfone</>
        )}
      </button>
    </div>
  );
}
