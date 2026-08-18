import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, Settings2, Sparkles } from "lucide-react";
import { AudioTimeline } from "@/components/studio/AudioTimeline";
import { ChatPreview } from "@/components/studio/ChatPreview";
import { MessageComposer } from "@/components/studio/MessageComposer";
import { ScriptList } from "@/components/studio/ScriptList";
import { SettingsModal } from "@/components/studio/SettingsModal";
import { downloadBlob, renderVideo } from "@/lib/render-video";
import { hydrateStudio, useStudio } from "@/lib/studio-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fake Chat Studio — Viral Chat Story Video Maker" },
      {
        name: "description",
        content:
          "Build 9:16 fake Instagram DM chat story videos in your browser: audio timeline, live phone preview and 1080p export.",
      },
      { property: "og:title", content: "Fake Chat Studio — Viral Chat Story Video Maker" },
      {
        property: "og:description",
        content:
          "Place dialogue on an audio waveform timeline, preview a pixel-perfect Instagram DM, export HD vertical video.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Studio,
});

function Studio() {
  const setSettingsOpen = useStudio((s) => s.setSettingsOpen);
  const messages = useStudio((s) => s.messages);
  const settings = useStudio((s) => s.settings);
  const audio = useStudio((s) => s.audio);
  const setPlaying = useStudio((s) => s.setPlaying);
  const [fps, setFps] = useState<30 | 60>(60);
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    hydrateStudio();
  }, []);

  const exportVideo = async () => {
    setPlaying(false);
    const duration = audio?.duration ?? Math.max(6, ...messages.map((m) => m.time + 3));
    setProgress(0);
    try {
      const { blob, ext } = await renderVideo({
        messages,
        settings,
        audioUrl: audio?.url ?? null,
        duration,
        fps,
        onProgress: setProgress,
      });
      downloadBlob(blob, `fake-chat-studio.${ext}`);
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="studio-bg min-h-screen">
      <header className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-6 py-5">
        <div className="brand-mark">
          <Sparkles size={18} />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Fake Chat Studio</h1>
          <p className="text-xs text-muted-foreground">
            Viral 9:16 chat story videos, rendered in your browser
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="fps-toggle">
            {([30, 60] as const).map((f) => (
              <button
                key={f}
                className={fps === f ? "is-active" : ""}
                onClick={() => setFps(f)}
              >
                {f} FPS
              </button>
            ))}
          </div>
          <button className="btn-ghost" onClick={() => setSettingsOpen(true)}>
            <Settings2 size={16} /> Settings
          </button>
          <button className="btn-accent" onClick={exportVideo} disabled={progress !== null}>
            <Download size={16} />
            {progress === null ? "Export HD video" : `Rendering ${Math.round(progress * 100)}%`}
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1400px] gap-5 px-6 pb-10 lg:grid-cols-[1fr_420px]">
        <div className="flex flex-col gap-5">
          <AudioTimeline />
          <div className="min-h-[240px] flex-1">
            <ScriptList />
          </div>
        </div>
        <div className="panel flex items-center justify-center p-6">
          <ChatPreview />
        </div>
      </main>

      {progress !== null && (
        <div className="render-overlay">
          <div className="render-card">
            <p className="text-sm font-medium">Rendering 1080×1920 video…</p>
            <div className="render-bar">
              <span style={{ width: `${progress * 100}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">
              Keep this tab focused for a smooth capture.
            </p>
          </div>
        </div>
      )}

      <MessageComposer />
      <SettingsModal />
    </div>
  );
}
