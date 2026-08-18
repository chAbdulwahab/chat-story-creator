import { drawChatScene, loadImage } from "./chat-scene";
import type { ChatMessage, Settings } from "./studio-store";

export type RenderOpts = {
  messages: ChatMessage[];
  settings: Settings;
  audioUrl: string | null;
  duration: number;
  fps: 30 | 60;
  width?: number;
  onProgress?: (p: number) => void;
};

function pickMime() {
  const candidates = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
  }
  return "video/webm";
}

export async function renderVideo(opts: RenderOpts): Promise<{ blob: Blob; ext: string }> {
  const width = opts.width ?? 1080;
  const height = Math.round((width * 16) / 9);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const [me, them, wallpaper] = await Promise.all([
    loadImage(opts.settings.avatarMe),
    loadImage(opts.settings.avatarThem),
    loadImage(opts.settings.wallpaper),
  ]);
  const images = { me, them, wallpaper };

  const stream = canvas.captureStream(opts.fps);

  let audioCtx: AudioContext | null = null;
  let source: AudioBufferSourceNode | null = null;
  if (opts.audioUrl) {
    audioCtx = new AudioContext();
    const buf = await fetch(opts.audioUrl).then((r) => r.arrayBuffer());
    const decoded = await audioCtx.decodeAudioData(buf);
    const dest = audioCtx.createMediaStreamDestination();
    source = audioCtx.createBufferSource();
    source.buffer = decoded;
    source.connect(dest);
    dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
  }

  const mimeType = pickMime();
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 12_000_000 });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });

  recorder.start(200);
  const start = performance.now();
  if (source && audioCtx) {
    source.start(audioCtx.currentTime);
  }

  await new Promise<void>((resolve) => {
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      if (t >= opts.duration) {
        resolve();
        return;
      }
      drawChatScene(ctx, {
        width,
        height,
        time: t,
        messages: opts.messages,
        settings: opts.settings,
        images,
      });
      opts.onProgress?.(Math.min(1, t / opts.duration));
      requestAnimationFrame(tick);
    };
    tick();
  });

  recorder.stop();
  source?.stop();
  await audioCtx?.close();
  const blob = await done;
  opts.onProgress?.(1);
  return { blob, ext: mimeType.includes("mp4") ? "mp4" : "webm" };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
