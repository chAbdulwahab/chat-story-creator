import { useEffect, useState } from "react";
import { ArrowLeftRight, Star, Trash2, X } from "lucide-react";
import { formatTime, useStudio, type Side } from "@/lib/studio-store";

export function MessageComposer() {
  const open = useStudio((s) => s.composerOpen);
  const close = useStudio((s) => s.closeComposer);
  const draftTime = useStudio((s) => s.draftTime);
  const editingId = useStudio((s) => s.editingId);
  const messages = useStudio((s) => s.messages);
  const addMessage = useStudio((s) => s.addMessage);
  const updateMessage = useStudio((s) => s.updateMessage);
  const removeMessage = useStudio((s) => s.removeMessage);
  const settings = useStudio((s) => s.settings);

  const editing = messages.find((m) => m.id === editingId) ?? null;
  const [text, setText] = useState("");
  const [side, setSide] = useState<Side>("them");
  const [key, setKey] = useState(false);
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!open) return;
    setText(editing?.text ?? "");
    setSide(editing?.side ?? "them");
    setKey(editing?.key ?? false);
    setTime(editing?.time ?? draftTime);
  }, [open, editing, draftTime]);

  if (!open) return null;

  const save = () => {
    if (!text.trim()) return;
    if (editing) updateMessage(editing.id, { text: text.trim(), side, key, time });
    else addMessage({ text: text.trim(), side, key, time });
    close();
  };

  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {editing ? "Edit dialogue" : "New dialogue"}{" "}
            <span className="ml-2 font-mono text-sm text-emerald-400">{formatTime(time)}</span>
          </h2>
          <button className="icon-btn" onClick={close} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          {(["me", "them"] as Side[]).map((s) => (
            <button
              key={s}
              className={`speaker-chip ${side === s ? "is-active" : ""}`}
              onClick={() => setSide(s)}
            >
              {s === "me" ? "Me (Sender)" : settings.username || "Them"}
            </button>
          ))}
        </div>

        <textarea
          className="field min-h-28 resize-none"
          placeholder="Type the dialogue line..."
          value={text}
          autoFocus
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
          }}
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button className="btn-ghost" onClick={() => setSide(side === "me" ? "them" : "me")}>
            <ArrowLeftRight size={16} /> Swap speaker
          </button>
          <button className={`btn-ghost ${key ? "is-key" : ""}`} onClick={() => setKey(!key)}>
            <Star size={16} /> {key ? "Key line" : "Normal"}
          </button>
          <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            Time
            <input
              type="number"
              step="0.1"
              min="0"
              value={time.toFixed(1)}
              onChange={(e) => setTime(Number(e.target.value))}
              className="field w-24 py-1 text-right font-mono"
            />
            s
          </label>
        </div>

        <div className={`preview-bubble ${side === "me" ? "is-me" : "is-them"} ${key ? "is-key" : ""}`}>
          {text || "Live preview of your line…"}
        </div>

        <div className="mt-5 flex gap-2">
          <button className="btn-accent flex-1 justify-center" onClick={save}>
            {editing ? "Save changes" : "Add to timeline"}
          </button>
          {editing && (
            <button
              className="icon-btn danger"
              onClick={() => {
                removeMessage(editing.id);
                close();
              }}
              aria-label="Delete message"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
