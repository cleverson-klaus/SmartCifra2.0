"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronUp, ChevronDown, RotateCcw,
  Play, Pause, Square, Gauge, GraduationCap, X,
} from "lucide-react";
import { parseCifra, keyAfterTranspose } from "@/lib/music/transpose";
import type { ChordLine } from "@/lib/music/transpose";
import ProfessorChat from "@/components/ProfessorChat";
import clsx from "clsx";

// px/segundo a 120 BPM com multiplicador 1×
const BASE_PX_PER_SEC = 40;

// Multiplicadores de velocidade disponíveis
const SPEED_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
type SpeedStep = (typeof SPEED_STEPS)[number];

interface Props {
  content: string;
  originalKey: string;
  title: string;
  artist: string;
  bpm?: number | null;
}

export default function ChordViewer({ content, originalKey, title, artist, bpm }: Props) {
  // --- transposição ---
  const [semitones, setSemitones] = useState(0);
  const [useFlats, setUseFlats] = useState(false);

  // --- painel do professor ---
  const [showProfessor, setShowProfessor] = useState(false);

  // --- auto-scroll ---
  const [scrolling, setScrolling] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<SpeedStep>(1);

  const rafRef = useRef<number>(0);
  const lastTsRef = useRef<number>(0);
  const accRef = useRef<number>(0); // acumulador de px fracionários
  const userScrollRef = useRef<boolean>(false);
  const userScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lines: ChordLine[] = parseCifra(content, semitones, useFlats);
  const currentKey = keyAfterTranspose(originalKey, semitones, useFlats);
  const isTransposed = semitones !== 0;

  // px/seg calculado = BASE * (bpm/120) * speed
  const effectiveBpm = bpm ?? 120;
  const pxPerSec = BASE_PX_PER_SEC * (effectiveBpm / 120) * speed;

  // ---------------------------------------------------------------
  // Loop de scroll
  // ---------------------------------------------------------------
  const tick = useCallback(
    (ts: number) => {
      if (lastTsRef.current === 0) lastTsRef.current = ts;
      const delta = (ts - lastTsRef.current) / 1000; // segundos
      lastTsRef.current = ts;

      if (!userScrollRef.current) {
        accRef.current += pxPerSec * delta;
        const pixels = Math.floor(accRef.current);
        if (pixels >= 1) {
          window.scrollBy({ top: pixels, behavior: "instant" });
          accRef.current -= pixels;
        }
      }

      // Para automaticamente no fim da página
      const atBottom =
        window.scrollY + window.innerHeight >= document.body.scrollHeight - 4;
      if (atBottom) {
        setScrolling(false);
        setPaused(false);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [pxPerSec]
  );

  // Detecta scroll manual para pausar temporariamente
  useEffect(() => {
    if (!scrolling) return;

    function onWheel() {
      userScrollRef.current = true;
      setPaused(true);
      if (userScrollTimerRef.current) clearTimeout(userScrollTimerRef.current);
      userScrollTimerRef.current = setTimeout(() => {
        userScrollRef.current = false;
        setPaused(false);
      }, 2000);
    }

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchmove", onWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onWheel);
    };
  }, [scrolling]);

  // Inicia/para o loop de RAF quando scrolling muda
  useEffect(() => {
    if (scrolling) {
      lastTsRef.current = 0;
      accRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
      lastTsRef.current = 0;
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [scrolling, tick]);

  function startScroll() {
    userScrollRef.current = false;
    setPaused(false);
    setScrolling(true);
  }

  function stopScroll() {
    setScrolling(false);
    setPaused(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function togglePause() {
    if (paused) {
      userScrollRef.current = false;
      setPaused(false);
    } else {
      userScrollRef.current = true;
      setPaused(true);
      if (userScrollTimerRef.current) clearTimeout(userScrollTimerRef.current);
    }
  }

  // ---------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Barra de controles */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-3 sm:p-4">
        {/* Linha 1: Tom + Professor */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Tom */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs text-gray-500 sm:text-sm sm:text-gray-400">Tom:</span>
            <span className={clsx(
              "min-w-[2.5rem] rounded-lg px-2 py-1 text-center font-mono text-sm font-bold transition-colors sm:px-3",
              isTransposed ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-200"
            )}>
              {currentKey}
            </span>
            {isTransposed && (
              <span className="hidden text-xs text-gray-500 sm:inline">
                ({semitones > 0 ? "+" : ""}{semitones} st)
              </span>
            )}
          </div>

          {/* Semitons */}
          <div className="flex items-center gap-1">
            <button onClick={() => setSemitones((s) => s - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-300 transition-colors hover:border-indigo-500 hover:text-white"
              title="Baixar meio tom">
              <ChevronDown className="h-4 w-4" />
            </button>
            <button onClick={() => setSemitones((s) => s + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-300 transition-colors hover:border-indigo-500 hover:text-white"
              title="Subir meio tom">
              <ChevronUp className="h-4 w-4" />
            </button>
            {isTransposed && (
              <button onClick={() => setSemitones(0)}
                className="flex h-8 items-center gap-1 rounded-lg border border-gray-700 bg-gray-800 px-2 text-xs text-gray-400 transition-colors hover:border-gray-500 hover:text-white"
                title="Voltar ao tom original">
                <RotateCcw className="h-3 w-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>

          {/* Sustenidos / Bemóis */}
          <button onClick={() => setUseFlats((f) => !f)}
            className={clsx(
              "rounded-lg border px-2 py-1 text-xs font-medium transition-colors sm:px-3",
              useFlats
                ? "border-indigo-500 bg-indigo-600/20 text-indigo-300"
                : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500 hover:text-white"
            )}>
            {useFlats ? "b" : "#"}
            <span className="hidden sm:inline">{useFlats ? " Bemóis" : " Sustenidos"}</span>
          </button>

          {/* Entender esta cifra */}
          <button
            onClick={() => setShowProfessor(true)}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-indigo-700/50 bg-indigo-600/10 px-2 py-1.5 text-xs font-medium text-indigo-300 transition-colors hover:border-indigo-500 hover:bg-indigo-600/20 sm:px-3"
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Entender esta cifra</span>
          </button>
        </div>

        {/* Linha 2: Velocidade + BPM */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-gray-800 pt-2.5 sm:gap-2">
          <Gauge className="h-3.5 w-3.5 text-gray-600" />
          <span className="text-xs text-gray-600">Vel:</span>
          {SPEED_STEPS.map((s) => (
            <button key={s} onClick={() => setSpeed(s)}
              className={clsx(
                "h-7 min-w-[2rem] rounded-md border px-1 text-xs font-mono font-medium transition-colors sm:min-w-[2.2rem] sm:px-1.5",
                speed === s
                  ? "border-emerald-500 bg-emerald-600/20 text-emerald-300"
                  : "border-gray-700 bg-gray-800 text-gray-500 hover:border-gray-500 hover:text-white"
              )}>
              {s}×
            </button>
          ))}
          {bpm && (
            <span className="ml-1 text-xs text-gray-600">
              <span className="font-mono text-gray-500">{bpm}</span> BPM
            </span>
          )}
        </div>
      </div>

      {/* Cifra */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div className="space-y-1 font-mono text-sm leading-none">
          {lines.map((line, lineIdx) => {
            const hasChords = line.some((seg) => seg.chord);

            if (!hasChords) {
              const text = line.map((s) => s.text).join("");
              return (
                <div key={lineIdx} className={clsx("min-h-[1.25rem]", !text && "mt-3")}>
                  <span className="text-gray-300">{text}</span>
                </div>
              );
            }

            return (
              <div key={lineIdx} className="flex flex-wrap items-end leading-none">
                {line.map((seg, segIdx) => (
                  <span key={segIdx} className="inline-flex flex-col">
                    <span className="min-h-[1.1rem] text-xs font-bold text-indigo-400 select-none">
                      {seg.chord ?? ""}
                    </span>
                    <span className="text-gray-200 whitespace-pre">
                      {seg.text || (seg.chord ? " " : "")}
                    </span>
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Espaço extra no fim para scroll não travar antes do último verso */}
      <div className="h-32" />

      {/* ----------------------------------------------------------------
          Barra flutuante de auto-scroll (fixa no rodapé)
      ---------------------------------------------------------------- */}
      <div className={clsx(
        "fixed bottom-20 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 sm:bottom-6",
        scrolling ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        <div className="flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/95 px-4 py-2 shadow-2xl backdrop-blur-sm">
          {/* Indicador animado */}
          <span className={clsx(
            "h-2 w-2 rounded-full transition-colors",
            paused ? "bg-amber-400" : "bg-emerald-400 animate-pulse"
          )} />
          <span className="text-xs text-gray-400 w-16">
            {paused ? "Pausado" : "Rolando…"}
          </span>

          {/* Pause / Resume */}
          <button onClick={togglePause}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
            title={paused ? "Retomar" : "Pausar"}>
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </button>

          {/* Reduzir velocidade */}
          <button
            onClick={() => {
              const idx = SPEED_STEPS.indexOf(speed);
              if (idx > 0) setSpeed(SPEED_STEPS[idx - 1]);
            }}
            disabled={speed === SPEED_STEPS[0]}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white disabled:opacity-30"
            title="Diminuir velocidade">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>

          {/* Velocidade atual */}
          <span className="w-9 text-center text-xs font-mono font-bold text-emerald-400">
            {speed}×
          </span>

          {/* Aumentar velocidade */}
          <button
            onClick={() => {
              const idx = SPEED_STEPS.indexOf(speed);
              if (idx < SPEED_STEPS.length - 1) setSpeed(SPEED_STEPS[idx + 1]);
            }}
            disabled={speed === SPEED_STEPS[SPEED_STEPS.length - 1]}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white disabled:opacity-30"
            title="Aumentar velocidade">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>

          {/* Parar e voltar ao topo */}
          <button onClick={stopScroll}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-900/60 text-red-400 transition-colors hover:bg-red-800 hover:text-red-300"
            title="Parar e voltar ao topo">
            <Square className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Botão de iniciar auto-scroll (visível quando parado) */}
      <div className={clsx(
        "fixed bottom-20 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 sm:bottom-6",
        !scrolling ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        <button onClick={startScroll}
          className="flex items-center gap-2 rounded-full border border-emerald-700 bg-gray-900/95 px-5 py-2.5 text-sm font-medium text-emerald-400 shadow-2xl backdrop-blur-sm transition-colors hover:border-emerald-500 hover:text-emerald-300">
          <Play className="h-4 w-4" />
          Auto-scroll
          {bpm && <span className="text-xs text-gray-500 font-normal">· {bpm} BPM · {speed}×</span>}
        </button>
      </div>

      {/* Painel do Professor (drawer lateral) */}
      {showProfessor && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowProfessor(false)}
          />
          {/* Drawer */}
          <div className="flex w-full flex-col border-l border-gray-800 bg-gray-950 shadow-2xl sm:max-w-md">
            <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-indigo-400" />
                <span className="font-semibold text-white">Professor de Música</span>
              </div>
              <button
                onClick={() => setShowProfessor(false)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ProfessorChat
                songContext={{
                  title: title ?? 'Música',
                  artist: artist ?? 'Artista',
                  key: currentKey,
                  content,
                }}
                initialQuestion={`Explique os acordes da música "${title ?? 'esta música'}" no tom de ${currentKey}. Por que esses acordes funcionam juntos?`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
