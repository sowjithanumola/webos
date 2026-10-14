# WebOS — Browser-Based Operating System

A complete, production-quality desktop environment running entirely in modern web browsers. Built with React 19, TypeScript, Tailwind CSS, and Vite.

## Key Features

1. **Boot and Lock Screen**:
   - Modern startup screen with WebOS branding, live clock, date, and Continue action.
   - Local-only profile name and avatar color personalization.
   - Lock screen with real-time clock, quick session unlock, restart, and power-off controls.

2. **Interactive Desktop**:
   - Movable desktop icons with selection and double-click launching.
   - Configurable Dock with running indicators, auto-hide, position settings (Bottom, Left, Right), and icon scaling.
   - Top Taskbar with system dropdown menu (About, Settings, Lock, Restart, Shut Down), live formatted clock, and quick toggles.
   - Right-click desktop context menu (New Folder, New Document, Open Terminal, Change Wallpaper, Refresh).

3. **Window Manager**:
   - True draggable and resizable windows from all 8 edges/corners.
   - Title bars with Minimize, Maximize/Restore, and Close buttons.
   - Active-window stacking and focus elevation.
   - Edge snapping (drag to top for maximize, drag to sides for split screen).
   - Global keyboard shortcuts (`Alt+Tab`, `Alt+Space`, `Ctrl+W`, `Ctrl+M`, `Ctrl+S`, `Ctrl+F`).

4. **Virtual Filesystem**:
   - Isolated in-browser virtual filesystem persisted in `localStorage`.
   - Hierarchical directories: `/home/user/Documents`, `/Downloads`, `/Pictures`, `/Trash`.
   - Full CRUD operations: Create folder, Create file, Rename, Duplicate, Move, Delete (soft delete to Trash with restore, permanent empty trash).
   - Real Device Interoperability: Import supported files from your real computer, and Export/Download virtual files back to your computer.

5. **Integrated Applications**:
   - **File Manager**: Breadcrumbs navigation, search, sort (name, date, size, type), grid and list views, import/export toolbar.
   - **Notes**: Auto-saving notes with timestamps, search, tags, checklists (`- [ ]`), bullet lists, and markdown formatting.
   - **Calculator**: Safe mathematical and scientific parser (Shunting-Yard algorithm; zero `eval()`), calculation history, and keyboard input.
   - **Terminal**: Simulated Unix shell (`ls`, `cd`, `pwd`, `mkdir`, `touch`, `cat`, `rm`, `echo`, `webfetch`, `history`, `clear`) interacting directly with the virtual filesystem.
   - **Text Editor**: Plain text and Markdown editor with live preview toggle, find & replace, cursor position, word/line counters, and export.
   - **Clock & Timer**: High-precision stopwatch with lap times (fastest/slowest indicators) and countdown timer with Web Audio API alerts.
   - **Calendar**: Interactive monthly calendar with event organizer and local storage persistence.
   - **Image Viewer**: Inspect pictures with zoom in/out, 90° rotation, fit-to-screen, and file dimensions.
   - **Media Player**: Real browser synthesizer player generating ambient and 8-bit melodies using the Web Audio API with animated waveforms and volume sliders.
   - **Settings**: Wallpaper switcher (6 curated gradients/meshes), dark/light mode, accent color customization, dock adjustments, clock formatting, sound effects toggle, night light screen warmth, and JSON backup export/restore.

6. **Data & Privacy**:
   - 100% client-side operation.
   - Zero telemetry, tracking, or external server requirements.
   - Complete backup export and restore in JSON format.
   - Factory reset with confirmation.

---

## Installation & Development

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally in Development Mode
```bash
npm run dev
```
The application will launch on `http://localhost:3000`.

### 3. Build for Production
```bash
npm run build
```
This produces an optimized production bundle inside the `dist/` directory.

### 4. Preview Production Build
```bash
npm run preview
```

---

## Vercel Deployment

Deploying WebOS to [Vercel](https://vercel.com) takes under 1 minute:

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Go to [Vercel Dashboard](https://vercel.com/new) and import your repository.
3. Vercel automatically detects **Vite**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Click **Deploy**. WebOS is live with zero configuration!

---

## License
Apache-2.0
