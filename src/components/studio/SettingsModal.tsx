import { X } from "lucide-react";
import { useStudio } from "@/lib/studio-store";

function readFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="avatar-preview">
        {value ? <img src={value} alt={label} /> : <span>{label.slice(0, 1)}</span>}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm">{label}</span>
        <div className="flex gap-2">
          <label className="btn-ghost cursor-pointer py-1 text-xs">
            Upload
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) onChange(await readFile(f));
              }}
            />
          </label>
          {value && (
            <button className="btn-ghost py-1 text-xs" onClick={() => onChange(null)}>
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SettingsModal() {
  const open = useStudio((s) => s.settingsOpen);
  const setOpen = useStudio((s) => s.setSettingsOpen);
  const settings = useStudio((s) => s.settings);
  const update = useStudio((s) => s.updateSettings);

  if (!open) return null;

  return (
    <div className="sheet-backdrop" onClick={() => setOpen(false)}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Profile & appearance</h2>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageField
              label="Sender avatar"
              value={settings.avatarMe}
              onChange={(v) => update({ avatarMe: v })}
            />
            <ImageField
              label="Receiver avatar"
              value={settings.avatarThem}
              onChange={(v) => update({ avatarThem: v })}
            />
          </div>

          <label className="grid gap-1 text-sm">
            Display name
            <input
              className="field"
              value={settings.username}
              onChange={(e) => update({ username: e.target.value })}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Username handle
            <input
              className="field"
              value={settings.displayName}
              onChange={(e) => update({ displayName: e.target.value })}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Status text
            <input
              className="field"
              value={settings.statusText}
              onChange={(e) => update({ statusText: e.target.value })}
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className={`btn-ghost ${settings.verified ? "is-key" : ""}`}
              onClick={() => update({ verified: !settings.verified })}
            >
              Verified badge: {settings.verified ? "On" : "Off"}
            </button>
            <button
              className={`btn-ghost ${settings.theme === "instagram-dark" ? "is-active" : ""}`}
              onClick={() => update({ theme: "instagram-dark" })}
            >
              Instagram Dark
            </button>
            <button
              className={`btn-ghost ${settings.theme === "instagram-light" ? "is-active" : ""}`}
              onClick={() => update({ theme: "instagram-light" })}
            >
              Instagram Light
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              Chat background
              <input
                type="color"
                className="h-9 w-12 rounded-md border border-border bg-transparent"
                value={settings.bgColor ?? (settings.theme === "instagram-dark" ? "#000000" : "#ffffff")}
                onChange={(e) => update({ bgColor: e.target.value })}
              />
            </label>
            {settings.bgColor && (
              <button className="btn-ghost py-1 text-xs" onClick={() => update({ bgColor: null })}>
                Reset color
              </button>
            )}
            <ImageField
              label="Wallpaper"
              value={settings.wallpaper}
              onChange={(v) => update({ wallpaper: v })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
