import { useEffect, useRef, useState } from "react";
import { Pause, Play, Plus, Upload } from "lucide-react";
import { extractPeaks } from "@/lib/audio-peaks";
import { formatTime, useStudio } from "@/lib/studio-store";

export function AudioTimeline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const audio = useStudio((s) => s.audio);
  const setAudio = useStudio((s) => s.setAudio);
  const messages = useStudio((s) => s.messages);
  const currentTime = useStudio((s) => s.currentTime);
  const setCurrentTime = useStudio((s) => s.setCurrentTime);
  const playing = useStudio((s) => s.playing);
  const setPlaying = useStudio((s) => s.setPlaying);
  const openComposer = useStudio((s) => s.openComposer);

  const duration =
    audio?.duration ?? Math.max(10, ...messages.map((m) => m.time + 3), 10);

  // playback clock
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      if (playing) {
        const el = audioRef.current;
        const t = el && audio ? el.currentTime : useStudio.getState().currentTime + dt;
        if (t >= duration) {
          setCurrentTime(duration);
          setPlaying(false);
        } else {
          setCurrentTime(t);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration, audio, setCurrentTime, setPlaying]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) void el.play().catch(() => undefined);
    else el.pause();
  }, [playing, audio]);

  // waveform draw
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const w = wrap.clientWidth;
    const h = 120;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const peaks = audio?.peaks ?? [];
    const bars = Math.floor(w / 3);
    const progressX = (currentTime / duration) * w;

    for (let i = 0; i < bars; i++) {
      const x = i * 3;
      const p = peaks.length ? peaks[Math.floor((i / bars) * peaks.length)] ?? 0 : 0.12;
      const bh = Math.max(3, p * (h - 26));
      ctx.fillStyle = x <= progressX ? "#10b981" : "rgba(148,163,184,0.35)";
      ctx.fillRect(x, (h - bh) / 2, 2, bh);
    }

    // playhead
    ctx.fillStyle = "#10b981";
    ctx.fillRect(progressX - 1, 0, 2, h);
    ctx.beginPath();
    ctx.arc(progressX, 6, 6, 0, Math.PI * 2);
    ctx.fill();
  }, [audio, currentTime, duration, hover]);

  const seekFromEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    return ratio * duration;
  };

  const onUpload = async (file: File) => {
    setLoading(true);
    try {
      const { duration: d, peaks } = await extractPeaks(file);
      setAudio({ name: file.name, url: URL.createObjectURL(file), duration: d, peaks });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          className="btn-accent text-xs sm:text-sm px-3 py-1.5"
          onClick={() => setPlaying(!playing)}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
          {playing ? "Pause" : "Play"}
        </button>
        <label className="btn-ghost cursor-pointer text-xs sm:text-sm px-3 py-1.5 max-w-[130px] sm:max-w-none truncate">
          <Upload size={15} className="shrink-0" />
          <span className="truncate">{loading ? "Decoding..." : audio ? audio.name : "Upload audio"}</span>
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onUpload(f);
            }}
          />
        </label>
        <button className="btn-ghost text-xs sm:text-sm px-3 py-1.5" onClick={() => openComposer(currentTime)}>
          <Plus size={15} /> <span className="hidden xs:inline">Add message at playhead</span><span className="xs:hidden">Add msg</span>
        </button>
        <span className="ml-auto font-mono text-xs sm:text-sm font-bold text-emerald-400">
          {formatTime(currentTime)} <span className="text-slate-300 font-normal">/ {formatTime(duration)}</span>
        </span>
      </div>

      <div
        ref={wrapRef}
        className="timeline-track"
        onMouseMove={(e) => setHover(seekFromEvent(e))}
        onMouseLeave={() => setHover(null)}
        onClick={(e) => {
          const t = seekFromEvent(e);
          setCurrentTime(t);
          if (audioRef.current) audioRef.current.currentTime = t;
        }}
      >
        <canvas ref={canvasRef} className="block" />
        {hover !== null && (
          <>
            <div
              className="timeline-hover-line"
              style={{ left: `${(hover / duration) * 100}%` }}
            />
            <div
              className="timeline-badge"
              style={{ left: `${(hover / duration) * 100}%` }}
            >
              {formatTime(hover)}
            </div>
          </>
        )}
        {messages.map((m) => (
          <button
            key={m.id}
            className={`timeline-marker ${m.side === "me" ? "is-me" : "is-them"} ${m.key ? "is-key" : ""}`}
            style={{ left: `${(m.time / duration) * 100}%` }}
            title={`${m.text} — ${formatTime(m.time)}`}
            onClick={(e) => {
              e.stopPropagation();
              openComposer(m.time, m.id);
            }}
          />
        ))}
      </div>

      {audio && (
        <audio
          ref={audioRef}
          src={audio.url}
          onEnded={() => setPlaying(false)}
          className="hidden"
        />
      )}
      <p className="mt-2 text-xs font-medium text-slate-300">
        Click to scrub playhead · Click "+ Add message at playhead" to add dialogue · Click a marker to edit
      </p>
    </div>
  );
}
