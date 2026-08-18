import { Star } from "lucide-react";
import { formatTime, useStudio } from "@/lib/studio-store";

export function ScriptList() {
  const messages = useStudio((s) => s.messages);
  const currentTime = useStudio((s) => s.currentTime);
  const openComposer = useStudio((s) => s.openComposer);
  const setCurrentTime = useStudio((s) => s.setCurrentTime);
  const settings = useStudio((s) => s.settings);

  return (
    <div className="panel flex h-full flex-col p-4">
      <h2 className="mb-3 text-xs font-bold tracking-wider text-emerald-400 uppercase">
        Story script
      </h2>
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-slate-300">
            No dialogue yet — add your first line from the timeline.
          </p>
        )}
        {messages.map((m) => (
          <button
            key={m.id}
            className={`script-row ${m.time <= currentTime ? "is-live" : ""}`}
            onClick={() => {
              setCurrentTime(m.time);
              openComposer(m.time, m.id);
            }}
          >
            <span className="font-mono text-xs font-bold text-emerald-400">{formatTime(m.time)}</span>
            <span className={`speaker-dot ${m.side}`} />
            <span className="flex-1 truncate text-left text-sm font-medium text-slate-100">{m.text}</span>
            {m.key && <Star size={14} className="shrink-0 text-amber-400 fill-amber-400" />}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs font-medium text-slate-300">
        Blue = Me · Gradient = {settings.username || "Them"}
      </p>
    </div>
  );
}
