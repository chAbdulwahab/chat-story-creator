# Chat Story Creator

# MASTER DEVELOPER PROMPT: Fake Chat Video Maker (Fake Chat Studio)

## 📌 Project Overview
Build a high-performance, studio-grade Web Application called "Fake Chat Studio" designed for content creators to generate viral TikTok, Instagram Reels, and YouTube Shorts fake chat story videos. The app enables users to upload audio voiceovers/music, visually place chat dialogue messages onto an interactive audio timeline, preview a pixel-perfect 9:16 mobile Instagram DM chat interface, and export high-quality 60FPS vertical MP4/WebM videos directly from the browser.

---

## 🛠️ Technology Stack
- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: TailwindCSS, Vanilla CSS, Lucide Icons, Glassmorphism UI
- **State Management**: Zustand with custom IndexedDB Persistence Adapter (for storing large audio blobs and base64 images without localStorage quota limits)
- **Audio Visualizer**: Web Audio API (`AudioContext`, `AnalyserNode`, Canvas Waveform Peaks)
- **Video Engine**: HTML5 Canvas 2D API (`CanvasRenderingContext2D`), `MediaRecorder`, Web Audio Multiplexing & Remotion (`@remotion/player`)

---

## 🚀 Key Feature Modules & Specifications

### 1. Interactive Audio Waveform Timeline (`AudioTimeline.tsx`)
- Extract real audio peaks from uploaded MP3/WAV files using `AudioContext`.
- Canvas playhead scrubber with 60FPS real-time playback synchronization.
- Hover playhead guide line with active time badge (e.g., `00:03.5s`).
- Interactive timeline markers showing message entry points.
- Click-on-timeline to jump audio timestamp or add a new message at that exact time.

### 2. Pixel-Perfect 9:16 Mobile Canvas Preview (`ChatPreview.tsx`)
- Ultra-authentic 9:16 mobile canvas container with rounded corners and subtle ambient glow.
- **Top Status Bar**: Live formatted time (`9:41`), WiFi icon, Signal bars, Battery indicator.
- **Instagram DM Header**: Profile avatar circle with instagram story gradient ring, Display Name, Username, Verified badge option, back arrow, video call, and tag action icons.
- **Message Area**: Smooth scrollable conversation view, message grouping (connected rounded corners for consecutive messages), and sender/receiver avatars.
- **Authentic Bottom Footer**: Original Instagram Message Composer input bar (`Message...` pill with blue camera button, mic, gallery, sticker, and plus icons) + Real Gboard Keyboard (`composer_keyboard_footer.png`).

### 3. Message Composer & Dialogue Management (`MessageComposer.tsx`)
- Modal sheet for adding and editing dialogue lines.
- **Speaker Selector**: One-tap toggle between Primary Profile (Sender / Me) and Secondary Participant (Receiver / Them) with a quick "Swap Speaker" button.
- **Importance Level**: Normal text vs Highlighted "Key Line" (with amber star badge).
- Live preview of dialogue text before saving to the story timeline.

### 4. Customization & Profile Settings (`SettingsModal.tsx`)
- Primary Profile Avatar upload (Sender).
- Secondary Profile Avatar upload (Receiver).
- Display Name, Username, Status Text (`Active now`), and Verified Badge toggle.
- Theme switch: Instagram Dark (`instagram-dark`) vs Instagram Light (`instagram-light`).
- Custom Chat Background Color picker or custom Wallpaper image upload.

### 5. Browser-Based HD Video Renderer (`renderVideo.ts`)
- Off-screen high-resolution Canvas (`1080x1920` vertical resolution).
- Preloads all high-res assets (Header icons, avatars, background wallpaper, real Gboard footer).
- Frame-by-frame rendering loop (30 FPS or 60 FPS) with smooth text layout and scrolling physics.
- Merges Canvas video stream with Web Audio stream via `MediaRecorder`.
- Generates immediate 1080p/4K MP4/WebM video download without server-side rendering or watermarks.

---

## 🎨 Design & Aesthetic Guidelines
- **Modern Dark Studio UI**: Deep slate background (`#09090b`), emerald accent glows (`#10b981`), purple/pink instagram gradients.
- **Fluid Micro-Animations**: Smooth message entry transitions, timeline marker highlights, and buttery-smooth scrubber movement.
- **Strict Mobile Authenticity**: Ensure Instagram DM header, chat bubble line-height, text size, and keyboard dimensions exactly match real Android/iOS screenshots.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c1395020-ff91-43cd-8415-b7b58553ba35).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
