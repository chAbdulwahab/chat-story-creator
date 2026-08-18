import { useEffect, useRef, useState } from "react";
import { drawChatScene, loadImage, type SceneImages } from "@/lib/chat-scene";
import { useStudio } from "@/lib/studio-store";

export function ChatPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const messages = useStudio((s) => s.messages);
  const settings = useStudio((s) => s.settings);
  const currentTime = useStudio((s) => s.currentTime);
  const [images, setImages] = useState<SceneImages>({});

  useEffect(() => {
    let alive = true;
    Promise.all([
      loadImage(settings.avatarMe),
      loadImage(settings.avatarThem),
      loadImage(settings.wallpaper),
    ]).then(([me, them, wallpaper]) => {
      if (alive) setImages({ me, them, wallpaper });
    });
    return () => {
      alive = false;
    };
  }, [settings.avatarMe, settings.avatarThem, settings.wallpaper]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawChatScene(ctx, {
      width: canvas.width,
      height: canvas.height,
      time: currentTime,
      messages,
      settings,
      images,
    });
  }, [messages, settings, currentTime, images]);

  return (
    <div className="phone-shell">
      <canvas ref={canvasRef} width={540} height={960} className="phone-canvas" />
    </div>
  );
}
