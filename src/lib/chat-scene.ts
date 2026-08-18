import type { ChatMessage, Settings } from "./studio-store";

export type SceneImages = {
  me?: HTMLImageElement | null;
  them?: HTMLImageElement | null;
  wallpaper?: HTMLImageElement | null;
  cameraDark?: HTMLImageElement | null;
  cameraLight?: HTMLImageElement | null;
  micDark?: HTMLImageElement | null;
  micLight?: HTMLImageElement | null;
  galleryDark?: HTMLImageElement | null;
  galleryLight?: HTMLImageElement | null;
  phoneDark?: HTMLImageElement | null;
  phoneLight?: HTMLImageElement | null;
};

export type SceneOpts = {
  width: number;
  height: number;
  time: number;
  messages: ChatMessage[];
  settings: Settings;
  images?: SceneImages;
};

const BASE_W = 1080;
const BASE_H = 1920;

const palette = (theme: Settings["theme"]) =>
  theme === "instagram-light"
    ? {
        bg: "#ffffff",
        fg: "#000000",
        muted: "#737373",
        them: "#f2f2f2",
        themFg: "#000000",
        chrome: "#ffffff",
        line: "#e5e5e5",
        keyboard: "#eceff1",
        key: "#ffffff",
        keyFg: "#000000",
      }
    : {
        bg: "#000000",
        fg: "#ffffff",
        muted: "#a8a8a8",
        them: "#262628",
        themFg: "#ffffff",
        chrome: "#000000",
        line: "#262628",
        keyboard: "#1c1c1e",
        key: "#3a3a3c",
        keyFg: "#ffffff",
      };

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | [number, number, number, number],
) {
  const rad: [number, number, number, number] = typeof r === "number" ? [r, r, r, r] : r;
  ctx.beginPath();
  ctx.moveTo(x + rad[0], y);
  ctx.lineTo(x + w - rad[1], y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad[1]);
  ctx.lineTo(x + w, y + h - rad[2]);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad[2], y + h);
  ctx.lineTo(x + rad[3], y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad[3]);
  ctx.lineTo(x, y + rad[0]);
  ctx.quadraticCurveTo(x, y, x + rad[0], y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function avatar(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null | undefined,
  cx: number,
  cy: number,
  r: number,
  ring: boolean,
  fallback: string,
) {
  if (ring) {
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, "#f9ce34");
    g.addColorStop(0.5, "#ee2a7b");
    g.addColorStop(1, "#6228d7");
    ctx.beginPath();
    ctx.arc(cx, cy, r + r * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (img && img.complete && img.naturalWidth) {
    const scale = Math.max((r * 2) / img.naturalWidth, (r * 2) / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  } else {
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, "#4b5563");
    g.addColorStop(1, "#1f2937");
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = "#e5e7eb";
    ctx.font = `600 ${r}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(fallback.toUpperCase(), cx, cy + 2);
  }
  ctx.restore();
}

function drawStatusBar(ctx: CanvasRenderingContext2D, c: ReturnType<typeof palette>) {
  ctx.fillStyle = c.fg;
  ctx.font = "700 34px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("9:41", 62, 58);

  // signal bars
  let x = BASE_W - 210;
  for (let i = 0; i < 4; i++) {
    const h = 10 + i * 7;
    ctx.fillStyle = c.fg;
    roundRect(ctx, x, 66 - h, 8, h, 3);
    ctx.fill();
    x += 13;
  }
  // wifi
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 6;
  for (let i = 2; i >= 0; i--) {
    ctx.beginPath();
    ctx.arc(BASE_W - 120, 68, 10 + i * 11, Math.PI * 1.25, Math.PI * 1.75);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(BASE_W - 120, 66, 4, 0, Math.PI * 2);
  ctx.fillStyle = c.fg;
  ctx.fill();
  // battery
  ctx.strokeStyle = c.fg;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 4;
  roundRect(ctx, BASE_W - 92, 44, 56, 28, 8);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = c.fg;
  roundRect(ctx, BASE_W - 87, 49, 40, 18, 5);
  ctx.fill();
  roundRect(ctx, BASE_W - 33, 52, 6, 12, 3);
  ctx.fill();
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  c: ReturnType<typeof palette>,
  s: Settings,
  images: SceneImages,
) {
  const top = 100;
  const h = 150;
  ctx.fillStyle = c.chrome;
  ctx.fillRect(0, top, BASE_W, h);

  // back chevron
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(72, top + 55);
  ctx.lineTo(42, top + 75);
  ctx.lineTo(72, top + 95);
  ctx.stroke();

  avatar(ctx, images.them, 152, top + 75, 44, true, (s.username || "A").slice(0, 1));

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = c.fg;
  ctx.font = "700 36px system-ui, sans-serif";
  const nameX = 220;
  ctx.fillText(s.username || "Name", nameX, top + 68);
  if (s.verified) {
    const w = ctx.measureText(s.username || "Name").width;
    const cx = nameX + w + 26;
    ctx.beginPath();
    ctx.arc(cx, top + 56, 16, 0, Math.PI * 2);
    ctx.fillStyle = "#3797F0";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 7, top + 56);
    ctx.lineTo(cx - 2, top + 62);
    ctx.lineTo(cx + 8, top + 49);
    ctx.stroke();
  }
  ctx.fillStyle = c.muted;
  ctx.font = "400 28px system-ui, sans-serif";
  ctx.fillText(s.statusText || "", nameX, top + 108);

  // call + video icons
  const phoneImg = c.bg === "#000000" ? images?.phoneDark : images?.phoneLight;
  const px = BASE_W - 190;
  const py = top + 75;

  if (phoneImg?.complete && phoneImg.naturalWidth) {
    ctx.drawImage(phoneImg, px - 22, py - 22, 44, 44);
  } else {
    // Exact phone call receiver matching uploaded assets
    ctx.save();
    ctx.translate(px, py);
    const isDark = c.bg === "#000000";

    ctx.beginPath();
    ctx.moveTo(-16, -10);
    ctx.bezierCurveTo(-16, -16, -10, -20, -4, -16);
    ctx.lineTo(1, -11);
    ctx.bezierCurveTo(4, -7, 4, -1, 0, 3);
    ctx.lineTo(-4, 7);
    ctx.bezierCurveTo(-2, 11, 2, 15, 6, 17);
    ctx.lineTo(10, 13);
    ctx.bezierCurveTo(14, 9, 20, 9, 24, 13);
    ctx.lineTo(29, 18);
    ctx.bezierCurveTo(33, 24, 29, 30, 23, 30);
    ctx.bezierCurveTo(9, 30, -16, 5, -16, -10);
    ctx.closePath();

    if (isDark) {
      ctx.fillStyle = c.fg;
      ctx.fill();
    } else {
      ctx.strokeStyle = c.fg;
      ctx.lineWidth = 4.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }
    ctx.restore();
  }

  // Video camera icon
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = 5;
  roundRect(ctx, BASE_W - 130, top + 55, 60, 42, 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(BASE_W - 62, top + 58);
  ctx.lineTo(BASE_W - 62, top + 94);
  ctx.lineTo(BASE_W - 92, top + 80);
  ctx.closePath();
  ctx.fillStyle = c.fg;
  ctx.fill();

  ctx.strokeStyle = c.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, top + h);
  ctx.lineTo(BASE_W, top + h);
  ctx.stroke();
}

function drawComposer(ctx: CanvasRenderingContext2D, c: ReturnType<typeof palette>, images?: SceneImages) {
  const kbTop = BASE_H - 620;
  const barH = 130;
  ctx.fillStyle = c.chrome;
  ctx.fillRect(0, kbTop, BASE_W, barH);

  // Camera icon (Image or vector matching uploaded assets)
  const camImg = c.bg === "#000000" ? images?.cameraDark : images?.cameraLight;
  if (camImg?.complete && camImg.naturalWidth) {
    ctx.drawImage(camImg, 50, kbTop + 25, 80, 80);
  } else {
    // Exact Instagram camera icon matching uploaded assets
    ctx.beginPath();
    ctx.arc(90, kbTop + 65, 40, 0, Math.PI * 2);
    ctx.fillStyle = "#3797F0";
    ctx.fill();

    // Camera viewfinder top notch
    roundRect(ctx, 78, kbTop + 43, 24, 8, 3);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Camera body
    roundRect(ctx, 66, kbTop + 48, 48, 34, 10);
    ctx.fill();

    // Outer lens ring
    ctx.beginPath();
    ctx.arc(90, kbTop + 65, 11, 0, Math.PI * 2);
    ctx.fillStyle = "#3797F0";
    ctx.fill();

    // Center lens dot
    ctx.beginPath();
    ctx.arc(90, kbTop + 65, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }

  // pill
  const px = 150;
  const pw = BASE_W - 150 - 40;
  ctx.fillStyle = c.them;
  roundRect(ctx, px, kbTop + 22, pw, 86, 43);
  ctx.fill();
  ctx.fillStyle = c.muted;
  ctx.font = "400 32px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("@unsunikahaniyn", px + 36, kbTop + 66);

  // right icons inside pill: mic, gallery, sticker
  const icons: [number, number, number] = [BASE_W - 260, BASE_W - 190, BASE_W - 120];
  ctx.strokeStyle = c.muted;
  ctx.fillStyle = c.muted;
  ctx.lineWidth = 4;

  // mic icon (matching uploaded solid & outline assets)
  const micImg = c.bg === "#000000" ? images?.micDark : images?.micLight;
  if (micImg?.complete && micImg.naturalWidth) {
    ctx.drawImage(micImg, icons[0] - 20, kbTop + 45, 40, 42);
  } else {
    const micX = icons[0];
    const isDark = c.bg === "#000000";

    // Mic capsule
    roundRect(ctx, micX - 9, kbTop + 42, 18, 28, 9);
    if (isDark) {
      ctx.fillStyle = c.muted;
      ctx.fill();
    } else {
      ctx.strokeStyle = c.muted;
      ctx.lineWidth = 3.5;
      ctx.stroke();
    }

    // U-cradle stand
    ctx.beginPath();
    ctx.arc(micX, kbTop + 54, 15, 0.05 * Math.PI, 0.95 * Math.PI);
    ctx.strokeStyle = c.muted;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Stem
    ctx.beginPath();
    ctx.moveTo(micX, kbTop + 69);
    ctx.lineTo(micX, kbTop + 78);
    ctx.stroke();

    // Base bar
    ctx.beginPath();
    ctx.moveTo(micX - 9, kbTop + 78);
    ctx.lineTo(micX + 9, kbTop + 78);
    ctx.stroke();
  }
  // gallery icon (matching uploaded asset with frame, sun dot and mountain peaks)
  const galImg = c.bg === "#000000" ? images?.galleryDark : images?.galleryLight;
  if (galImg?.complete && galImg.naturalWidth) {
    ctx.drawImage(galImg, icons[1] - 21, kbTop + 45, 42, 42);
  } else {
    const gx = icons[1];
    // Frame
    roundRect(ctx, gx - 21, kbTop + 45, 42, 42, 11);
    ctx.strokeStyle = c.muted;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Sun dot in top left
    ctx.beginPath();
    ctx.arc(gx - 9, kbTop + 57, 4, 0, Math.PI * 2);
    ctx.fillStyle = c.muted;
    ctx.fill();

    // Mountain peaks at bottom
    ctx.beginPath();
    ctx.moveTo(gx - 14, kbTop + 75);
    ctx.lineTo(gx - 8, kbTop + 67);
    ctx.lineTo(gx - 2, kbTop + 73);
    ctx.lineTo(gx + 7, kbTop + 62);
    ctx.lineTo(gx + 14, kbTop + 75);
    ctx.strokeStyle = c.muted;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }
  // sticker (smiley)
  ctx.beginPath();
  ctx.arc(icons[2], kbTop + 66, 23, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(icons[2], kbTop + 66, 11, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // keyboard
  drawKeyboard(ctx, c, kbTop + barH);
}

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

function drawKeyboard(ctx: CanvasRenderingContext2D, c: ReturnType<typeof palette>, top: number) {
  const h = BASE_H - top;
  ctx.fillStyle = c.keyboard;
  ctx.fillRect(0, top, BASE_W, h);

  // Gboard Top Action Bar / Suggestions
  ctx.fillStyle = c.keyFg;
  ctx.font = "400 28px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ["I", "The", "I'm"].forEach((w, i) => {
    ctx.globalAlpha = 0.75;
    ctx.fillText(w, BASE_W * (0.18 + i * 0.32), top + 42);
    ctx.globalAlpha = 1;
  });

  const keyH = 92;
  const padX = 10;
  const gap = 10;
  const rowGap = 16;
  const rowTop = top + 84;

  // Row 1: q w e r t y u i o p (10 keys)
  const count1 = 10;
  const keyW = (BASE_W - padX * 2 - gap * (count1 - 1)) / count1; // ~97px
  const superscripts = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  "qwertyuiop".split("").forEach((ch, i) => {
    const x = padX + i * (keyW + gap);
    const y = rowTop;
    ctx.fillStyle = c.key;
    roundRect(ctx, x, y, keyW, keyH, 10);
    ctx.fill();

    // Superscript number
    ctx.fillStyle = c.keyFg;
    ctx.globalAlpha = 0.5;
    ctx.font = "400 18px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(superscripts[i], x + keyW - 8, y + 20);
    ctx.globalAlpha = 1;

    // Letter
    ctx.textAlign = "center";
    ctx.font = "500 38px system-ui, sans-serif";
    ctx.fillText(ch, x + keyW / 2, y + keyH / 2 + 4);
  });

  // Row 2: a s d f g h j k l (9 keys centered)
  const row2Top = rowTop + keyH + rowGap;
  const row2Offset = (keyW + gap) / 2;
  "asdfghjkl".split("").forEach((ch, i) => {
    const x = padX + row2Offset + i * (keyW + gap);
    const y = row2Top;
    ctx.fillStyle = c.key;
    roundRect(ctx, x, y, keyW, keyH, 10);
    ctx.fill();

    ctx.fillStyle = c.keyFg;
    ctx.font = "500 38px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(ch, x + keyW / 2, y + keyH / 2 + 2);
  });

  // Row 3: Shift + z x c v b n m + Backspace
  const row3Top = row2Top + keyH + rowGap;
  const sideKeyW = keyW * 1.45; // ~140px

  // Shift Key (Left)
  ctx.fillStyle = c.key;
  roundRect(ctx, padX, row3Top, sideKeyW, keyH, 10);
  ctx.fill();
  ctx.fillStyle = c.keyFg;
  ctx.font = "500 32px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("⇧", padX + sideKeyW / 2, row3Top + keyH / 2);

  // Letter keys z x c v b n m (7 keys)
  "zxcvbnm".split("").forEach((ch, i) => {
    const x = padX + sideKeyW + gap + i * (keyW + gap);
    const y = row3Top;
    ctx.fillStyle = c.key;
    roundRect(ctx, x, y, keyW, keyH, 10);
    ctx.fill();

    ctx.fillStyle = c.keyFg;
    ctx.font = "500 38px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(ch, x + keyW / 2, y + keyH / 2 + 2);
  });

  // Backspace Key (Right)
  const bsX = BASE_W - padX - sideKeyW;
  ctx.fillStyle = c.key;
  roundRect(ctx, bsX, row3Top, sideKeyW, keyH, 10);
  ctx.fill();
  ctx.fillStyle = c.keyFg;
  ctx.font = "500 30px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("⌫", bsX + sideKeyW / 2, row3Top + keyH / 2);

  // Row 4: Bottom Action Row
  const row4Top = row3Top + keyH + rowGap;
  const k123W = 140;
  const kCommaW = 90;
  const kEnterW = 140;
  const kPeriodW = 90;
  const spaceW = BASE_W - padX * 2 - gap * 4 - k123W - kCommaW - kPeriodW - kEnterW;

  const row4Keys: Array<{ x: number; w: number; label: string; isEnter?: boolean }> = [
    { x: padX, w: k123W, label: "?123" },
    { x: padX + k123W + gap, w: kCommaW, label: "," },
    { x: padX + k123W + gap + kCommaW + gap, w: spaceW, label: "English" },
    { x: padX + k123W + gap + kCommaW + gap + spaceW + gap, w: kPeriodW, label: "." },
    { x: BASE_W - padX - kEnterW, w: kEnterW, label: "↵", isEnter: true },
  ];

  row4Keys.forEach(({ x, w, label, isEnter }) => {
    ctx.fillStyle = isEnter ? "#3797F0" : c.key;
    roundRect(ctx, x, row4Top, w, keyH, isEnter ? 24 : 10);
    ctx.fill();

    ctx.fillStyle = isEnter ? "#ffffff" : c.keyFg;
    ctx.font = isEnter ? "700 42px system-ui, sans-serif" : "400 30px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, x + w / 2, row4Top + keyH / 2);
  });

  // Bottom Android Navigation Bar Chevron
  ctx.fillStyle = c.keyFg;
  ctx.globalAlpha = 0.5;
  ctx.font = "400 24px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("∨", BASE_W / 2, BASE_H - 24);
  ctx.globalAlpha = 1;
}

const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);

export function drawChatScene(ctx: CanvasRenderingContext2D, opts: SceneOpts) {
  const { width, height, time, messages, settings, images = {} } = opts;
  const c = palette(settings.theme);
  ctx.save();
  ctx.scale(width / BASE_W, height / BASE_H);

  // background
  ctx.fillStyle = settings.bgColor ?? c.bg;
  ctx.fillRect(0, 0, BASE_W, BASE_H);
  if (images.wallpaper?.complete && images.wallpaper.naturalWidth) {
    const img = images.wallpaper;
    const scale = Math.max(BASE_W / img.naturalWidth, BASE_H / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, (BASE_W - w) / 2, (BASE_H - h) / 2, w, h);
  }

  const areaTop = 270;
  const areaBottom = BASE_H - 640;

  const visible = messages.filter((m) => m.time <= time);
  const font = "400 40px system-ui, sans-serif";
  const maxTextW = BASE_W * 0.6;

  type Laid = { m: ChatMessage; lines: string[]; w: number; h: number };
  const laid: Laid[] = visible.map((m) => {
    ctx.font = font;
    const lines = wrapText(ctx, m.text, maxTextW);
    const w = Math.min(
      maxTextW,
      Math.max(...lines.map((l) => ctx.measureText(l).width)),
    );
    return { m, lines, w: w + 72, h: lines.length * 52 + 48 };
  });

  const gapY = 18;
  const total = laid.reduce((a, l) => a + l.h + gapY, 0);
  const last = laid[laid.length - 1];
  const entry = last ? easeOut((time - last.m.time) / 0.38) : 1;
  const shift = last ? (1 - entry) * (last.h + gapY) : 0;

  const y0 = areaBottom - total + shift;
  let y = y0;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, areaTop, BASE_W, areaBottom - areaTop);
  ctx.clip();

  laid.forEach((l, i) => {
    const isLast = i === laid.length - 1;
    const mine = l.m.side === "me";
    const prev = laid[i - 1];
    const next = laid[i + 1];
    const grpPrev = prev?.m.side === l.m.side;
    const grpNext = next?.m.side === l.m.side;
    const big = 44;
    const small = 14;
    const radii: [number, number, number, number] = mine
      ? [big, grpPrev ? small : big, grpNext ? small : big, big]
      : [grpPrev ? small : big, big, big, grpNext ? small : big];

    const x = mine ? BASE_W - 48 - l.w : 130;
    let yy = y;
    let alpha = 1;
    let scale = 1;
    if (isLast) {
      alpha = entry;
      scale = 0.94 + 0.06 * entry;
      yy = y + (1 - entry) * 40;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x + l.w / 2, yy + l.h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-(x + l.w / 2), -(yy + l.h / 2));

    if (mine) {
      const g = ctx.createLinearGradient(x, yy, x + l.w, yy + l.h);
      g.addColorStop(0, "#3797F0");
      g.addColorStop(1, "#2B6FE0");
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = c.them;
    }
    roundRect(ctx, x, yy, l.w, l.h, radii);
    ctx.fill();

    if (l.m.key) {
      ctx.strokeStyle = "#f5b301";
      ctx.lineWidth = 5;
      roundRect(ctx, x - 3, yy - 3, l.w + 6, l.h + 6, radii);
      ctx.stroke();
      // star badge
      const sx = mine ? x - 34 : x + l.w + 34;
      drawStar(ctx, sx, yy + 26, 18, "#f5b301");
    }

    ctx.fillStyle = mine ? "#ffffff" : c.themFg;
    ctx.font = font;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    l.lines.forEach((line, li) => {
      ctx.fillText(line, x + 36, yy + 24 + 26 + li * 52);
    });

    if (!mine && !grpNext) {
      avatar(ctx, images.them, 74, yy + l.h - 30, 34, false, (settings.username || "A").slice(0, 1));
    }
    ctx.restore();

    y += l.h + gapY;
  });
  ctx.restore();

  drawStatusBar(ctx, c);
  drawHeader(ctx, c, settings, images);
  drawComposer(ctx, c, images);
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r / 2.3;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export function loadImage(src: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
