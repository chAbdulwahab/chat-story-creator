import { create } from "zustand";

export type Side = "me" | "them";

export type ChatMessage = {
  id: string;
  text: string;
  side: Side;
  time: number;
  key: boolean;
};

export type Theme = "instagram-dark" | "instagram-light";

export type Settings = {
  displayName: string;
  username: string;
  statusText: string;
  verified: boolean;
  theme: Theme;
  avatarMe: string | null;
  avatarThem: string | null;
  bgColor: string | null;
  wallpaper: string | null;
};

export type AudioState = {
  name: string;
  url: string;
  duration: number;
  peaks: number[];
} | null;

export type SavedProject = {
  id: string;
  name: string;
  updatedAt: number;
  messages: ChatMessage[];
  settings: Settings;
};

type StudioState = {
  messages: ChatMessage[];
  settings: Settings;
  audio: AudioState;
  currentTime: number;
  playing: boolean;
  editingId: string | null;
  composerOpen: boolean;
  settingsOpen: boolean;
  projectsOpen: boolean;
  projects: SavedProject[];
  activeProjectId: string;
  draftTime: number;

  setAudio: (a: AudioState) => void;
  setCurrentTime: (t: number) => void;
  setPlaying: (p: boolean) => void;
  addMessage: (m: Omit<ChatMessage, "id">) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  openComposer: (time: number, editingId?: string | null) => void;
  closeComposer: () => void;
  setSettingsOpen: (open: boolean) => void;
  setProjectsOpen: (open: boolean) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  
  createNewProject: (name?: string) => void;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => void;
  renameProject: (id: string, newName: string) => void;
  duplicateProject: (id: string) => void;
};

const STORAGE_KEY = "fake-chat-studio-v1";
const PROJECTS_KEY = "fake-chat-projects-v2";

const defaultSettings: Settings = {
  displayName: "sophie.rae",
  username: "Sophie Rae",
  statusText: "Active now",
  verified: true,
  theme: "instagram-dark",
  avatarMe: null,
  avatarThem: null,
  bgColor: null,
  wallpaper: null,
};

function loadPersistedProjects(): { projects: SavedProject[]; activeId: string } {
  if (typeof window === "undefined") return { projects: [], activeId: "" };
  try {
    const raw = window.localStorage.getItem(PROJECTS_KEY);
    if (!raw) return { projects: [], activeId: "" };
    const parsed = JSON.parse(raw);
    return {
      projects: parsed.projects ?? [],
      activeId: parsed.activeId ?? "",
    };
  } catch {
    return { projects: [], activeId: "" };
  }
}

export const useStudio = create<StudioState>((set, get) => ({
  messages: [],
  settings: defaultSettings,
  audio: null,
  currentTime: 0,
  playing: false,
  editingId: null,
  composerOpen: false,
  settingsOpen: false,
  projectsOpen: false,
  projects: [],
  activeProjectId: "default",
  draftTime: 0,

  setAudio: (a) => set({ audio: a, currentTime: 0, playing: false }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setPlaying: (p) => set({ playing: p }),

  addMessage: (m) => {
    const next = [...get().messages, { ...m, id: crypto.randomUUID() }].sort(
      (a, b) => a.time - b.time,
    );
    set({ messages: next });
    persistCurrent();
  },
  updateMessage: (id, patch) => {
    set({
      messages: get()
        .messages.map((m) => (m.id === id ? { ...m, ...patch } : m))
        .sort((a, b) => a.time - b.time),
    });
    persistCurrent();
  },
  removeMessage: (id) => {
    set({ messages: get().messages.filter((m) => m.id !== id) });
    persistCurrent();
  },
  openComposer: (time, editingId = null) =>
    set({ composerOpen: true, draftTime: time, editingId }),
  closeComposer: () => set({ composerOpen: false, editingId: null }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setProjectsOpen: (open) => set({ projectsOpen: open }),
  updateSettings: (patch) => {
    set({ settings: { ...get().settings, ...patch } });
    persistCurrent();
  },

  createNewProject: (name) => {
    const newId = crypto.randomUUID();
    const projName = name?.trim() || `Story Project #${get().projects.length + 1}`;
    const newProj: SavedProject = {
      id: newId,
      name: projName,
      updatedAt: Date.now(),
      messages: [],
      settings: { ...defaultSettings },
    };
    const updatedProjects = [newProj, ...get().projects];
    set({
      projects: updatedProjects,
      activeProjectId: newId,
      messages: [],
      settings: { ...defaultSettings },
      audio: null,
      currentTime: 0,
      playing: false,
    });
    saveAllProjects(updatedProjects, newId);
  },

  loadProject: (id) => {
    const target = get().projects.find((p) => p.id === id);
    if (!target) return;
    set({
      activeProjectId: target.id,
      messages: target.messages ?? [],
      settings: { ...defaultSettings, ...(target.settings ?? {}) },
      audio: null,
      currentTime: 0,
      playing: false,
    });
    saveAllProjects(get().projects, id);
  },

  deleteProject: (id) => {
    const remaining = get().projects.filter((p) => p.id !== id);
    let nextActive = get().activeProjectId;
    if (nextActive === id) {
      nextActive = remaining[0]?.id || "";
    }

    if (!remaining.length) {
      const freshId = crypto.randomUUID();
      const defaultProj: SavedProject = {
        id: freshId,
        name: "Story Project #1",
        updatedAt: Date.now(),
        messages: [],
        settings: { ...defaultSettings },
      };
      set({
        projects: [defaultProj],
        activeProjectId: freshId,
        messages: [],
        settings: { ...defaultSettings },
        audio: null,
        currentTime: 0,
        playing: false,
      });
      saveAllProjects([defaultProj], freshId);
    } else {
      const target = remaining.find((p) => p.id === nextActive) || remaining[0];
      set({
        projects: remaining,
        activeProjectId: target.id,
        messages: target.messages ?? [],
        settings: { ...defaultSettings, ...(target.settings ?? {}) },
        audio: null,
        currentTime: 0,
        playing: false,
      });
      saveAllProjects(remaining, target.id);
    }
  },

  renameProject: (id, newName) => {
    const updated = get().projects.map((p) =>
      p.id === id ? { ...p, name: newName.trim() || p.name, updatedAt: Date.now() } : p,
    );
    set({ projects: updated });
    saveAllProjects(updated, get().activeProjectId);
  },

  duplicateProject: (id) => {
    const target = get().projects.find((p) => p.id === id);
    if (!target) return;
    const dupId = crypto.randomUUID();
    const dup: SavedProject = {
      id: dupId,
      name: `${target.name} (Copy)`,
      updatedAt: Date.now(),
      messages: JSON.parse(JSON.stringify(target.messages)),
      settings: JSON.parse(JSON.stringify(target.settings)),
    };
    const updated = [dup, ...get().projects];
    set({
      projects: updated,
      activeProjectId: dupId,
      messages: dup.messages,
      settings: dup.settings,
      audio: null,
      currentTime: 0,
      playing: false,
    });
    saveAllProjects(updated, dupId);
  },
}));

function persistCurrent() {
  if (typeof window === "undefined") return;
  const { messages, settings, activeProjectId, projects } = useStudio.getState();
  const updatedProjects = projects.map((p) =>
    p.id === activeProjectId
      ? { ...p, messages, settings, updatedAt: Date.now() }
      : p,
  );
  useStudio.setState({ projects: updatedProjects });
  saveAllProjects(updatedProjects, activeProjectId);
}

function saveAllProjects(projects: SavedProject[], activeId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PROJECTS_KEY,
      JSON.stringify({ projects, activeId }),
    );
  } catch {
    /* quota — ignore */
  }
}

export function hydrateStudio() {
  const { projects, activeId } = loadPersistedProjects();
  if (projects.length) {
    const active = projects.find((p) => p.id === activeId) || projects[0];
    useStudio.setState({
      projects,
      activeProjectId: active.id,
      messages: active.messages ?? [],
      settings: { ...defaultSettings, ...(active.settings ?? {}) },
    });
  } else {
    // Initial setup with first project
    const firstId = crypto.randomUUID();
    const initialProj: SavedProject = {
      id: firstId,
      name: "Story Project #1",
      updatedAt: Date.now(),
      messages: [],
      settings: { ...defaultSettings },
    };
    useStudio.setState({
      projects: [initialProj],
      activeProjectId: firstId,
      messages: [],
      settings: defaultSettings,
    });
    saveAllProjects([initialProj], firstId);
  }
}

export function formatTime(t: number) {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
}
