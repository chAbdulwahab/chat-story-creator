import { useState } from "react";
import { Copy, FolderPlus, Trash2, X, Check, Edit2 } from "lucide-react";
import { useStudio } from "@/lib/studio-store";

export function ProjectsModal() {
  const open = useStudio((s) => s.projectsOpen);
  const setOpen = useStudio((s) => s.setProjectsOpen);
  const projects = useStudio((s) => s.projects);
  const activeProjectId = useStudio((s) => s.activeProjectId);
  const createNewProject = useStudio((s) => s.createNewProject);
  const loadProject = useStudio((s) => s.loadProject);
  const deleteProject = useStudio((s) => s.deleteProject);
  const renameProject = useStudio((s) => s.renameProject);
  const duplicateProject = useStudio((s) => s.duplicateProject);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  if (!open) return null;

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const saveRename = (id: string) => {
    if (editingName.trim()) {
      renameProject(id, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="sheet-backdrop" onClick={() => setOpen(false)}>
      <div className="sheet max-w-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Saved Projects</h2>
            <p className="text-xs font-medium text-slate-300">
              Manage and switch between your video projects
            </p>
          </div>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4">
          <button
            className="btn-accent w-full justify-center py-2.5 text-sm font-semibold"
            onClick={() => {
              createNewProject();
              setOpen(false);
            }}
          >
            <FolderPlus size={18} /> + Create New Project
          </button>
        </div>

        <div className="max-h-[380px] space-y-2.5 overflow-y-auto pr-1">
          {projects.map((p) => {
            const isActive = p.id === activeProjectId;
            const isEditing = editingId === p.id;
            const dateStr = new Date(p.updatedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={p.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 transition-all ${
                  isActive
                    ? "border-emerald-500/50 bg-emerald-950/20 shadow-lg shadow-emerald-950/30"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <div className="flex-1 min-w-[180px]">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveRename(p.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        className="field py-1 text-sm font-semibold"
                      />
                      <button
                        className="icon-btn text-emerald-400"
                        onClick={() => saveRename(p.id)}
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 text-sm">{p.name}</span>
                      <button
                        className="text-slate-400 hover:text-slate-200 transition-colors"
                        onClick={() => startRename(p.id, p.name)}
                        title="Rename project"
                      >
                        <Edit2 size={13} />
                      </button>
                      {isActive && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                          Active
                        </span>
                      )}
                    </div>
                  )}

                  <p className="mt-0.5 text-xs text-slate-400">
                    {p.messages?.length || 0} dialogues · {dateStr}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!isActive && (
                    <button
                      className="btn-accent px-3 py-1 text-xs font-semibold"
                      onClick={() => {
                        loadProject(p.id);
                        setOpen(false);
                      }}
                    >
                      Open
                    </button>
                  )}
                  <button
                    className="btn-ghost px-2.5 py-1 text-xs"
                    onClick={() => duplicateProject(p.id)}
                    title="Duplicate project"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    className="icon-btn danger p-1.5"
                    onClick={() => deleteProject(p.id)}
                    title="Delete project"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
