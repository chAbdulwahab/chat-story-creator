import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, FolderKanban, Settings2, Sparkles } from "lucide-react";
import { AudioTimeline } from "@/components/studio/AudioTimeline";
import { ChatPreview } from "@/components/studio/ChatPreview";
import { MessageComposer } from "@/components/studio/MessageComposer";
import { ProjectsModal } from "@/components/studio/ProjectsModal";
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
  const setProjectsOpen = useStudio((s) => s.setProjectsOpen);
  const projects = useStudio((s) => s.projects);
  const activeProjectId = useStudio((s) => s.activeProjectId);
  const messages = useStudio((s) => s.messages);
  const settings = useStudio((s) => s.settings);
  const audio = useStudio((s) => s.audio);
  const setPlaying = useStudio((s) => s.setPlaying);
  const [fps, setFps] = useState<30 | 60>(60);
  const [progress, setProgress] = useState<number | null>(null);

  const activeProject = projects.find((p) => p.id === activeProjectId);

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
      <header className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center gap-3">
          <div className="brand-mark shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">Fake Chat Studio</h1>
              {activeProject && (
                <span className="hidden sm:inline-block rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                  {activeProject.name}
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs font-medium text-slate-300">
              Viral 9:16 chat story videos, rendered in your browser
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-ghost text-xs sm:text-sm px-3 py-1.5" onClick={() => setProjectsOpen(true)}>
            <FolderKanban size={15} className="text-emerald-400" /> <span className="font-semibold text-slate-100">Projects</span>
          </button>
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
          <button className="btn-ghost text-xs sm:text-sm px-3 py-1.5" onClick={() => setSettingsOpen(true)}>
            <Settings2 size={15} /> <span className="hidden xs:inline">Settings</span>
          </button>
          <button className="btn-accent text-xs sm:text-sm px-3 py-1.5" onClick={exportVideo} disabled={progress !== null}>
            <Download size={15} />
            {progress === null ? "Export HD video" : `Rendering ${Math.round(progress * 100)}%`}
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1400px] gap-5 px-3 sm:px-6 pb-10 lg:grid-cols-[1fr_420px]">
        <div className="panel flex items-center justify-center p-4 sm:p-6 order-1 lg:order-2 overflow-hidden">
          <ChatPreview />
        </div>
        <div className="flex flex-col gap-5 order-2 lg:order-1">
          <AudioTimeline />
          <div className="min-h-[240px] flex-1">
            <ScriptList />
          </div>
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
      <ProjectsModal />
    </div>
  );
}
