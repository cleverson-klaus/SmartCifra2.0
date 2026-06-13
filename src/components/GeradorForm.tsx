"use client";

import { useState, useCallback, useRef, useActionState } from "react";
import { PlayCircle, Upload, Zap, X, FileAudio, Loader2, CheckCircle, Save, AlertCircle, FileText } from "lucide-react";
import clsx from "clsx";
import { saveSong, type SaveSongState } from "@/lib/actions/songs";
import { GENRES } from "@/lib/genres";
import LetraTab from "./LetraTab";

const YOUTUBE_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]{11}/;

const MAX_MB = 25; // Whisper limit
const MAX_BYTES = MAX_MB * 1024 * 1024;

type Tab = "youtube" | "audio" | "letra"
type Step = "idle" | "transcribing" | "generating" | "done" | "error";

interface GenerateResult {
  title: string;
  artist: string;
  key: string;
  bpm: number;
  content: string;
}

const STEP_LABELS: Record<string, string> = {
  transcribing: "Transcrevendo letra…",
  generating: "Gerando cifra com IA…",
};

export default function GeradorForm() {
  const [saveState, saveAction, isSaving] = useActionState<SaveSongState, FormData>(saveSong, {});

  const [activeTab, setActiveTab] = useState<Tab>("youtube");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isProcessing = step === "transcribing" || step === "generating";

  // ---------------------------------------------------------------
  // Handlers de arquivo
  // ---------------------------------------------------------------
  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("audio/")) {
      setErrorMsg("Arquivo inválido. Envie MP3, WAV ou M4A.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setErrorMsg(`Arquivo muito grande. Limite: ${MAX_MB} MB (Whisper API).`);
      return;
    }
    setFile(f);
    setErrorMsg("");
    setResult(null);
    setStep("idle");
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  // ---------------------------------------------------------------
  // Chamada real à API
  // ---------------------------------------------------------------
  async function callGenerateApi(body: FormData) {
    setErrorMsg("");
    setResult(null);
    setStep("transcribing");

    try {
      const res = await fetch("/api/generate", { method: "POST", body });

      // Depois da transcrição, está gerando
      setStep("generating");

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Erro desconhecido.");
      }

      setResult(data as GenerateResult);
      setStep("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao processar. Tente novamente.");
      setStep("error");
    }
  }

  async function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUrlError("");
    if (!YOUTUBE_REGEX.test(url)) {
      setUrlError("Cole um link válido do YouTube.");
      return;
    }
    const body = new FormData();
    body.append("url", url);
    await callGenerateApi(body);
  }

  async function handleFileSubmit() {
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    await callGenerateApi(body);
  }

  async function handleLyricsSubmit({ lyrics, title, artist }: { lyrics: string; title: string; artist: string }) {
    const body = new FormData();
    body.append("lyrics", lyrics);
    if (title) body.append("title", title);
    if (artist) body.append("artist", artist);
    await callGenerateApi(body);
  }

  const reset = () => {
    setStep("idle");
    setResult(null);
    setFile(null);
    setUrl("");
    setUrlError("");
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ---------------------------------------------------------------
  // Tela de processamento
  // ---------------------------------------------------------------
  if (isProcessing) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center">
        <Loader2 className="mx-auto mb-5 h-10 w-10 animate-spin text-indigo-400" />
        <p className="text-base font-semibold text-white">{STEP_LABELS[step]}</p>
        <p className="mt-1 text-sm text-gray-500">
          {step === "transcribing"
            ? "Extraindo a letra do áudio…"
            : "GPT-4o-mini analisando acordes e formatando a cifra…"}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {(["transcribing", "generating"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className="h-px w-8 bg-gray-700" />}
              <div className={clsx(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                step === s
                  ? "bg-indigo-600 text-white"
                  : s === "transcribing" && step === "generating"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-800 text-gray-500"
              )}>
                {step === "generating" && s === "transcribing" ? "✓" : i + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Tela de resultado (editor + salvar)
  // ---------------------------------------------------------------
  if (step === "done" && result) {
    return (
      <form action={saveAction} className="space-y-5">
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
          <p className="text-sm text-emerald-300">
            Cifra gerada pela IA! Revise e corrija antes de salvar.
          </p>
        </div>

        <input type="hidden" name="youtube_url" value={url} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Título</label>
            <input name="title" defaultValue={result.title} required
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Artista</label>
            <input name="artist" defaultValue={result.artist} required
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Tom original</label>
            <input name="key" defaultValue={result.key}
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm font-mono text-white focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">BPM</label>
            <input name="bpm" type="number" defaultValue={result.bpm}
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Estilo musical <span className="font-normal text-gray-600">(opcional)</span>
            </label>
            <select name="genre"
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none">
              <option value="">— Selecione um estilo —</option>
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Cifra{" "}
            <span className="font-normal text-gray-600">— formato [G]texto [D]aqui</span>
          </label>
          <textarea name="content" rows={14} required defaultValue={result.content}
            className="w-full resize-y rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm font-mono text-white focus:border-indigo-500 focus:outline-none" />
        </div>

        {saveState.error && (
          <p className="flex items-center gap-2 rounded-xl border border-red-900 bg-red-950/40 px-4 py-2.5 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" /> {saveState.error}
          </p>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={isSaving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar cifra
          </button>
          <button type="button" onClick={reset}
            className="rounded-xl border border-gray-700 px-4 py-3 text-sm text-gray-400 transition-colors hover:border-gray-500 hover:text-white">
            Descartar
          </button>
        </div>
      </form>
    );
  }

  // ---------------------------------------------------------------
  // Formulário principal
  // ---------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex rounded-xl border border-gray-800 bg-gray-900 p-1">
        {([
          { id: "youtube", icon: <PlayCircle className="h-4 w-4" />, label: "YouTube" },
          { id: "audio",   icon: <Upload className="h-4 w-4" />,      label: "Áudio" },
          { id: "letra",   icon: <FileText className="h-4 w-4" />,    label: "Letra" },
        ] as { id: Tab; icon: React.ReactNode; label: string }[]).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={clsx(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              activeTab === t.id
                ? "bg-indigo-600 text-white"
                : "text-gray-500 hover:text-gray-300"
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Aba Letra */}
      {activeTab === "letra" && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <LetraTab onSubmit={handleLyricsSubmit} isProcessing={isProcessing} />
        </div>
      )}

      {/* Aba YouTube */}
      {activeTab === "youtube" && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <div className="mb-4 flex items-center gap-2 text-red-400">
            <PlayCircle className="h-5 w-5" />
            <span className="font-medium">Link do YouTube</span>
          </div>
          <form onSubmit={handleUrlSubmit} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input type="url" value={url}
                onChange={(e) => { setUrl(e.target.value); setUrlError(""); }}
                placeholder="https://youtube.com/watch?v=..."
                className={clsx(
                  "flex-1 rounded-lg border bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none",
                  urlError ? "border-red-500" : "border-gray-700 focus:border-red-400"
                )} />
              <button type="submit" disabled={!url}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-40">
                Gerar
              </button>
            </div>
            {urlError && <p className="text-xs text-red-400">{urlError}</p>}
            <p className="text-xs text-gray-600">
              Funciona com vídeos que têm legendas automáticas ativadas.
            </p>
          </form>
        </div>
      )}

      {/* Aba Áudio */}
      {activeTab === "audio" && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <div className="mb-4 flex items-center gap-2 text-amber-400">
            <Upload className="h-5 w-5" />
            <span className="font-medium">Upload de arquivo de áudio</span>
          </div>

          {file ? (
            <div className="flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-800 p-4">
              <FileAudio className="h-8 w-8 shrink-0 text-amber-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="shrink-0 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-700 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={clsx(
                "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                isDragging ? "border-amber-500 bg-amber-500/5" : "border-gray-700 hover:border-amber-500/50 hover:bg-amber-500/5"
              )}>
              <Upload className={clsx("h-8 w-8 transition-colors", isDragging ? "text-amber-400" : "text-gray-600")} />
              <div>
                <p className="text-sm font-medium text-gray-300">
                  {isDragging ? "Solte o arquivo aqui" : "Arraste ou clique para selecionar"}
                </p>
                <p className="mt-1 text-xs text-gray-600">MP3, WAV, M4A — máx. {MAX_MB} MB</p>
              </div>
              <input ref={fileInputRef} type="file" accept="audio/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </label>
          )}

          {file && (
            <button onClick={handleFileSubmit}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 font-medium text-gray-900 transition-colors hover:bg-amber-400">
              <Zap className="h-4 w-4" /> Transcrever e gerar cifra
            </button>
          )}
        </div>
      )}

      {(step === "error" || errorMsg) && (
        <div className="flex items-start gap-2 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
