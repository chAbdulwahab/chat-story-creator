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

type StudioState = {
  messages: ChatMessage[];
  settings: Settings;
  audio: AudioState;
  currentTime: number;
  playing: boolean;
  editingId: string | null;
  composerOpen: boolean;
  settingsOpen: boolean;
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
  updateSettings: (patch: Partial<Settings>) => void;
};

const STORAGE_KEY = "fake-chat-studio-v1";

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

function loadPersisted(): { messages: ChatMessage[]; settings: Settings } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      messages: parsed.messages ?? [],
      settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
    };
  } catch {
    return null;
  }
}

const seed: ChatMessage[] = [
  { id: "m1", text: "hey… are you awake?", side: "them", time: 0.6, key: false },
  { id: "m2", text: "yeah. couldn't sleep", side: "me", time: 2.4, key: false },
  { id: "m3", text: "i need to tell you something", side: "them", time: 4.2, key: true },
];

export const useStudio = create<StudioState>((set, get) => ({
  messages: seed,
  settings: defaultSettings,
  audio: null,
  currentTime: 0,
  playing: false,
  editingId: null,
  composerOpen: false,
  settingsOpen: false,
  draftTime: 0,

  setAudio: (a) => set({ audio: a, currentTime: 0, playing: false }),
  setCurrentTime: (t) => set({ currentTime: t }),
  setPlaying: (p) => set({ playing: p }),

  addMessage: (m) => {
    const next = [...get().messages, { ...m, id: crypto.randomUUID() }].sort(
      (a, b) => a.time - b.time,
    );
    set({ messages: next });
    persist();
  },
  updateMessage: (id, patch) => {
    set({
      messages: get()
        .messages.map((m) => (m.id === id ? { ...m, ...patch } : m))
        .sort((a, b) => a.time - b.time),
    });
    persist();
  },
  removeMessage: (id) => {
    set({ messages: get().messages.filter((m) => m.id !== id) });
    persist();
  },
  openComposer: (time, editingId = null) =>
    set({ composerOpen: true, draftTime: time, editingId }),
  closeComposer: () => set({ composerOpen: false, editingId: null }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  updateSettings: (patch) => {
    set({ settings: { ...get().settings, ...patch } });
    persist();
  },
}));

function persist() {
  if (typeof window === "undefined") return;
  const { messages, settings } = useStudio.getState();
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, settings }));
  } catch {
    /* quota — ignore */
  }
}

export function hydrateStudio() {
  const data = loadPersisted();
  if (data && data.messages.length) {
    useStudio.setState({ messages: data.messages, settings: data.settings });
  } else if (data) {
    useStudio.setState({ settings: data.settings });
  }
}

export function formatTime(t: number) {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
}
