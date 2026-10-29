import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  RotateCcw,
  Download,
  FolderPlus,
  FilePlus,
  Trash2,
  Save,
  Check,
  Search,
  Maximize2,
  Smartphone,
  Tablet,
  Monitor,
  Terminal,
  Code2,
  FileCode,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  X,
  Copy,
  Edit2,
  Upload,
  Command,
  HelpCircle,
  Folder,
  Layers,
  Settings,
} from 'lucide-react';
import JSZip from 'jszip';
import { useOS } from '../../../context/OSContext';
import { loadFromStorage, saveToStorage, StorageKeys } from '../../../services/storage';

export interface ProjectFile {
  name: string;
  path: string;
  content: string;
  language: 'html' | 'css' | 'javascript' | 'typescript' | 'json' | 'markdown';
}

const STARTER_PROJECTS: { id: string; name: string; files: ProjectFile[] }[] = [
  {
    id: 'starter-canvas-particles',
    name: 'Interactive Canvas Particles',
    files: [
      {
        name: 'index.html',
        path: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cosmic Particle Network</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="hud">
    <h1>Cosmic Particle Network</h1>
    <p>Move mouse or touch screen to attract particles</p>
    <div class="stats" id="particleCount">Particles: 85</div>
  </div>
  <canvas id="canvas"></canvas>
  <script src="script.js"></script>
</body>
</html>`,
      },
      {
        name: 'style.css',
        path: 'style.css',
        language: 'css',
        content: `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: #090d16;
  color: #f1f5f9;
  font-family: system-ui, -apple-system, sans-serif;
  overflow: hidden;
  height: 100vh;
}
.hud {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  pointer-events: none;
}
h1 { font-size: 1.25rem; font-weight: 700; color: #38bdf8; margin-bottom: 4px; }
p { font-size: 0.85rem; color: #94a3b8; }
.stats { margin-top: 8px; font-size: 0.75rem; font-family: monospace; color: #a855f7; }
canvas { display: block; width: 100vw; height: 100vh; }`,
      },
      {
        name: 'script.js',
        path: 'script.js',
        language: 'javascript',
        content: `const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let w = canvas.width = window.innerWidth;
let h = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
});

const particles = [];
const particleCount = 85;

const mouse = { x: null, y: null, radius: 140 };
window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
window.addEventListener('mouseleave', () => {
  mouse.x = null;
  mouse.y = null;
});

class Particle {
  constructor() {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.size = Math.random() * 2.5 + 1;
    this.speedX = (Math.random() - 0.5) * 1.5;
    this.speedY = (Math.random() - 0.5) * 1.5;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x < 0 || this.x > w) this.speedX *= -1;
    if (this.y < 0 || this.y > h) this.speedY *= -1;

    if (mouse.x !== null) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < mouse.radius) {
        this.x -= dx * 0.03;
        this.y -= dy * 0.03;
      }
    }
  }
  draw() {
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

for (let i = 0; i < particleCount; i++) {
  particles.push(new Particle());
}

function animate() {
  ctx.clearRect(0, 0, w, h);
  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw();
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.hypot(dx, dy);
      if (dist < 110) {
        ctx.strokeStyle = \`rgba(56, 189, 248, \${1 - dist / 110})\`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(animate);
}

animate();
console.log('Particle network loaded successfully.');`,
      },
    ],
  },
  {
    id: 'starter-calculator-vanilla',
    name: 'Modern Web Calculator',
    files: [
      {
        name: 'index.html',
        path: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="calc-card">
    <div id="screen" class="screen">0</div>
    <div class="keys">
      <button onclick="clearScreen()" class="danger">C</button>
      <button onclick="append('/')" class="op">÷</button>
      <button onclick="append('*')" class="op">×</button>
      <button onclick="append('-')" class="op">-</button>
      <button onclick="append('7')">7</button>
      <button onclick="append('8')">8</button>
      <button onclick="append('9')">9</button>
      <button onclick="append('+')" class="op">+</button>
      <button onclick="append('4')">4</button>
      <button onclick="append('5')">5</button>
      <button onclick="append('6')">6</button>
      <button onclick="calc()" class="equal">=</button>
      <button onclick="append('1')">1</button>
      <button onclick="append('2')">2</button>
      <button onclick="append('3')">3</button>
      <button onclick="append('0')" class="zero">0</button>
    </div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
      },
      {
        name: 'style.css',
        path: 'style.css',
        language: 'css',
        content: `body {
  background: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  margin: 0;
  font-family: sans-serif;
}
.calc-card {
  background: #1e293b;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid #334155;
  width: 260px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
}
.screen {
  background: #020617;
  color: #38bdf8;
  font-family: monospace;
  font-size: 28px;
  padding: 14px;
  border-radius: 8px;
  text-align: right;
  margin-bottom: 16px;
}
.keys {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
button {
  background: #334155;
  color: white;
  border: none;
  padding: 14px;
  font-size: 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
button:hover { background: #475569; }
button.op { background: #0284c7; }
button.op:hover { background: #0369a1; }
button.danger { background: #e11d48; }
button.equal { background: #10b981; grid-row: span 2; }
button.zero { grid-column: span 2; }`,
      },
      {
        name: 'script.js',
        path: 'script.js',
        language: 'javascript',
        content: `let expr = '0';
const screen = document.getElementById('screen');

function append(val) {
  if (expr === '0' && !isNaN(val)) expr = val;
  else expr += val;
  screen.innerText = expr;
}

function clearScreen() {
  expr = '0';
  screen.innerText = '0';
}

function calc() {
  try {
    expr = Function('"use strict"; return (' + expr + ')')().toString();
    screen.innerText = expr;
  } catch (e) {
    screen.innerText = 'Error';
    expr = '0';
  }
}`,
      },
    ],
  },
  {
    id: 'starter-kanban-todo',
    name: 'Interactive Task Kanban',
    files: [
      {
        name: 'index.html',
        path: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="app-container">
    <header>
      <h2>Task Kanban Board</h2>
      <button onclick="addTask()">+ New Task</button>
    </header>
    <div class="board">
      <div class="col" id="col-todo">
        <h3>To Do</h3>
        <div class="items" id="items-todo"></div>
      </div>
      <div class="col" id="col-doing">
        <h3>In Progress</h3>
        <div class="items" id="items-doing"></div>
      </div>
      <div class="col" id="col-done">
        <h3>Done</h3>
        <div class="items" id="items-done"></div>
      </div>
    </div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
      },
      {
        name: 'style.css',
        path: 'style.css',
        language: 'css',
        content: `body {
  background: #0b0f19;
  color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  margin: 0;
  padding: 24px;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
button {
  background: #2563eb;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
.board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.col {
  background: #1e293b;
  border-radius: 12px;
  padding: 16px;
}
.col h3 {
  font-size: 14px;
  color: #94a3b8;
  margin-top: 0;
  margin-bottom: 12px;
}
.card {
  background: #0f172a;
  border: 1px solid #334155;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
}
.card:hover { border-color: #3b82f6; }`,
      },
      {
        name: 'script.js',
        path: 'script.js',
        language: 'javascript',
        content: `const tasks = [
  { id: 1, text: 'Design dark UI theme', status: 'done' },
  { id: 2, text: 'Implement WebOS Window Manager', status: 'doing' },
  { id: 3, text: 'Build sandboxed live preview', status: 'todo' },
];

function render() {
  document.getElementById('items-todo').innerHTML = '';
  document.getElementById('items-doing').innerHTML = '';
  document.getElementById('items-done').innerHTML = '';

  tasks.forEach(t => {
    const el = document.createElement('div');
    el.className = 'card';
    el.innerText = t.text;
    el.onclick = () => {
      if (t.status === 'todo') t.status = 'doing';
      else if (t.status === 'doing') t.status = 'done';
      else t.status = 'todo';
      render();
    };
    document.getElementById('items-' + t.status).appendChild(el);
  });
}

function addTask() {
  const text = prompt('Task title:');
  if (text) {
    tasks.push({ id: Date.now(), text, status: 'todo' });
    render();
  }
}

render();
console.log('Kanban board mounted.');`,
      },
    ],
  },
];

export interface CodeStudioAppProps {
  payload?: {
    fileId?: string;
    filePath?: string;
  };
}

export const CodeStudioApp: React.FC<CodeStudioAppProps> = ({ payload }) => {
  const { createFile, updateFileContent, fs, addNotification } = useOS();

  // Active project & files with user-scoped draft recovery (defaults to blank project)
  const savedDraft = useMemo(() => {
    return loadFromStorage<{
      project?: { id: string; name: string };
      files?: ProjectFile[];
      activeFilePath?: string;
      openTabs?: string[];
    } | null>(StorageKeys.CODE_STUDIO, null);
  }, []);

  const [currentProject, setCurrentProject] = useState<{ id: string; name: string }>(() => {
    return savedDraft?.project || { id: 'empty-project', name: 'Untitled Project' };
  });

  const [files, setFiles] = useState<ProjectFile[]>(() => {
    return Array.isArray(savedDraft?.files) ? savedDraft.files : [];
  });

  const [activeFilePath, setActiveFilePath] = useState<string>(() => {
    if (savedDraft?.activeFilePath) return savedDraft.activeFilePath;
    if (Array.isArray(savedDraft?.files) && savedDraft.files.length > 0) return savedDraft.files[0].path;
    return '';
  });

  const [openTabs, setOpenTabs] = useState<string[]>(() => {
    if (Array.isArray(savedDraft?.openTabs)) return savedDraft.openTabs;
    if (Array.isArray(savedDraft?.files)) return savedDraft.files.map((f: ProjectFile) => f.path);
    return [];
  });

  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, boolean>>({});

  // Editor configuration
  const [fontSize, setFontSize] = useState<number>(13);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');

  // Cursor position tracking (Line & Col)
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });

  // Live preview & layout
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState<number>(0);
  const [consoleLogs, setConsoleLogs] = useState<{ type: 'log' | 'error' | 'warn'; msg: string; time: string }[]>([]);
  const [showConsole, setShowConsole] = useState<boolean>(false);

  // Modals
  const [isCreatingFile, setIsCreatingFile] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>('');
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [paletteSearch, setPaletteSearch] = useState<string>('');

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load file if passed via window payload
  useEffect(() => {
    if (payload?.fileId && fs.nodes[payload.fileId]) {
      const fsNode = fs.nodes[payload.fileId];
      const fileName = fsNode.name;
      let lang: ProjectFile['language'] = 'javascript';
      if (fileName.endsWith('.html')) lang = 'html';
      else if (fileName.endsWith('.css')) lang = 'css';
      else if (fileName.endsWith('.json')) lang = 'json';
      else if (fileName.endsWith('.md')) lang = 'markdown';
      else if (fileName.endsWith('.ts')) lang = 'typescript';

      setFiles((prev) => {
        const existingIdx = prev.findIndex((f) => f.path === fileName);
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], content: fsNode.content || '' };
          return updated;
        }
        return [...prev, { name: fileName, path: fileName, content: fsNode.content || '', language: lang }];
      });
      setOpenTabs((prev) => Array.from(new Set([...prev, fileName])));
      setActiveFilePath(fileName);
    }
  }, [payload?.fileId, fs.nodes]);

  // Autosave draft to user-isolated storage
  useEffect(() => {
    saveToStorage(StorageKeys.CODE_STUDIO, {
      project: currentProject,
      files,
      activeFilePath,
      openTabs,
    });
  }, [currentProject, files, activeFilePath, openTabs]);

  const activeFile = useMemo(() => {
    return files.find((f) => f.path === activeFilePath) || files[0] || null;
  }, [files, activeFilePath]);

  // Construct combined HTML for preview with safe script interception
  const previewHtml = useMemo(() => {
    const htmlFile = files.find((f) => f.name.endsWith('.html'));
    const cssFiles = files.filter((f) => f.name.endsWith('.css'));
    const jsFiles = files.filter((f) => f.name.endsWith('.js'));

    if (!htmlFile && files.length === 0) {
      return '<!DOCTYPE html><html><body style="background:#090d16;color:#64748b;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><p style="font-size:12px;">Live preview ready. Create HTML/CSS/JS to preview.</p></body></html>';
    }

    let html = htmlFile ? htmlFile.content : '<!DOCTYPE html><html><head></head><body style="background:#090d16;"></body></html>';

    // Inject styles
    const stylesBundle = cssFiles.map((c) => `<style>\n${c.content}\n</style>`).join('\n');
    html = html.replace('</head>', `${stylesBundle}\n</head>`);
    if (!html.includes('</head>')) {
      html = `<head>${stylesBundle}</head>` + html;
    }

    // Console logger interceptor script
    const consoleInterceptor = `
      <script>
        (function() {
          const oldLog = console.log;
          const oldError = console.error;
          const oldWarn = console.warn;
          console.log = function(...args) {
            oldLog.apply(console, args);
            window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'log', text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
          };
          console.error = function(...args) {
            oldError.apply(console, args);
            window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'error', text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
          };
          console.warn = function(...args) {
            oldWarn.apply(console, args);
            window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'warn', text: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*');
          };
          window.onerror = function(msg, url, line) {
            window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'error', text: msg + ' (line ' + line + ')' }, '*');
          };
        })();
      </script>
    `;

    // Inject scripts
    const scriptsBundle = jsFiles.map((j) => `<script>\n${j.content}\n</script>`).join('\n');
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${consoleInterceptor}\n${scriptsBundle}\n</body>`);
    } else {
      html = html + `\n${consoleInterceptor}\n${scriptsBundle}`;
    }

    return html;
  }, [files]);

  // Listen for logs from preview iframe
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === 'CONSOLE_LOG') {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setConsoleLogs((prev) => [...prev.slice(-49), { type: e.data.level, msg: e.data.text, time: timeStr }]);
      }
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

  const handleContentChange = (val: string) => {
    if (!activeFile) {
      const newFile: ProjectFile = {
        name: 'untitled.txt',
        path: 'untitled.txt',
        content: val,
        language: 'plain' as any,
      };
      setFiles([newFile]);
      setOpenTabs(['untitled.txt']);
      setActiveFilePath('untitled.txt');
      setUnsavedChanges({ 'untitled.txt': true });
      return;
    }
    setFiles((prev) =>
      prev.map((f) => (f.path === activeFile.path ? { ...f, content: val } : f))
    );
    setUnsavedChanges((prev) => ({ ...prev, [activeFile.path]: true }));
  };

  const updateCursorPosition = (el: HTMLTextAreaElement) => {
    const text = el.value.substring(0, el.selectionStart);
    const lines = text.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });
  };

  const saveCurrentFile = useCallback(() => {
    if (!activeFile) return;
    setUnsavedChanges((prev) => ({ ...prev, [activeFile.path]: false }));

    // Also persist file to WebOS shared Virtual Filesystem in Documents
    try {
      const existing = Object.values(fs.nodes).find((n) => n.name === activeFile.name);
      if (existing) {
        updateFileContent(existing.id, activeFile.content);
      } else {
        createFile('folder_documents', activeFile.name, activeFile.content, activeFile.language === 'markdown' ? 'markdown' : 'code');
      }
      addNotification('Saved', `Saved "${activeFile.name}" to virtual filesystem.`, 'success');
    } catch {
      // transient
    }
  }, [activeFile, fs.nodes, updateFileContent, createFile, addNotification]);

  // Find & Replace
  const handleFindNext = () => {
    if (!searchQuery || !activeFile) return;
    const content = activeFile.content;
    const idx = content.indexOf(searchQuery, textareaRef.current?.selectionEnd || 0);
    const targetIdx = idx !== -1 ? idx : content.indexOf(searchQuery);
    if (targetIdx !== -1 && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(targetIdx, targetIdx + searchQuery.length);
    }
  };

  const handleReplace = () => {
    if (!searchQuery || !activeFile) return;
    const content = activeFile.content;
    const newContent = content.replace(searchQuery, replaceQuery);
    handleContentChange(newContent);
  };

  const handleReplaceAll = () => {
    if (!searchQuery || !activeFile) return;
    const content = activeFile.content;
    const newContent = content.replaceAll(searchQuery, replaceQuery);
    handleContentChange(newContent);
  };

  // Export active file to machine
  const exportActiveFile = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addNotification('File Exported', `Downloaded "${activeFile.name}".`, 'success');
  };

  // Export full project to ZIP
  const exportZip = async () => {
    const zip = new JSZip();
    files.forEach((f) => {
      zip.file(f.path, f.content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name.toLowerCase().replace(/\s+/g, '-')}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addNotification('Project Exported', `Downloaded "${currentProject.name}.zip" with all files.`, 'success');
  };

  // Import file from device
  const handleDeviceImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = String(evt.target?.result || '');
      let lang: ProjectFile['language'] = 'javascript';
      if (file.name.endsWith('.html')) lang = 'html';
      else if (file.name.endsWith('.css')) lang = 'css';
      else if (file.name.endsWith('.json')) lang = 'json';
      else if (file.name.endsWith('.md')) lang = 'markdown';
      else if (file.name.endsWith('.ts')) lang = 'typescript';

      const importedFile: ProjectFile = {
        name: file.name,
        path: file.name,
        content,
        language: lang,
      };

      setFiles((prev) => [...prev.filter((f) => f.path !== file.name), importedFile]);
      setOpenTabs((prev) => Array.from(new Set([...prev, file.name])));
      setActiveFilePath(file.name);
      addNotification('Imported', `Imported "${file.name}" into Code Studio.`, 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Delete project file
  const deleteProjectFile = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) {
      alert('Cannot delete the only file in the project.');
      return;
    }
    if (confirm(`Are you sure you want to delete "${path}"?`)) {
      const nextFiles = files.filter((f) => f.path !== path);
      setFiles(nextFiles);
      setOpenTabs((prev) => prev.filter((p) => p !== path));
      if (activeFilePath === path) {
        setActiveFilePath(nextFiles[0].path);
      }
      addNotification('Deleted', `Removed "${path}".`, 'info');
    }
  };

  // Keyboard shortcuts (Ctrl+S, Ctrl+F, Ctrl+H, Ctrl+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          saveCurrentFile();
        } else if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          setShowSearch(true);
        } else if (e.key.toLowerCase() === 'h') {
          e.preventDefault();
          setShowSearch(true);
        } else if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          setShowCommandPalette((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveCurrentFile]);

  const closeTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextTabs = openTabs.filter((p) => p !== path);
    setOpenTabs(nextTabs);
    if (activeFilePath === path && nextTabs.length > 0) {
      setActiveFilePath(nextTabs[nextTabs.length - 1]);
    }
  };

  const handleCreateNewFile = () => {
    const name = newFileName.trim();
    if (!name) return;
    let lang: ProjectFile['language'] = 'javascript';
    if (name.endsWith('.html')) lang = 'html';
    else if (name.endsWith('.css')) lang = 'css';
    else if (name.endsWith('.json')) lang = 'json';
    else if (name.endsWith('.md')) lang = 'markdown';
    else if (name.endsWith('.ts')) lang = 'typescript';

    const newFile: ProjectFile = {
      name,
      path: name,
      content: '',
      language: lang,
    };

    setFiles((prev) => [...prev, newFile]);
    setOpenTabs((prev) => Array.from(new Set([...prev, name])));
    setActiveFilePath(name);
    setNewFileName('');
    setIsCreatingFile(false);
  };

  // Command palette actions
  const PALETTE_COMMANDS = [
    { title: 'Run Live Preview', action: () => setPreviewKey((k) => k + 1) },
    { title: 'Save Active File to Filesystem', action: () => saveCurrentFile() },
    { title: 'Export Project to ZIP', action: () => exportZip() },
    { title: 'Export Active File', action: () => exportActiveFile() },
    { title: 'Create New File', action: () => setIsCreatingFile(true) },
    { title: 'Toggle Preview Console', action: () => setShowConsole((c) => !c) },
    { title: 'Format & Clean Empty Lines', action: () => {
      if (activeFile) {
        handleContentChange(activeFile.content.replace(/\n\s*\n\s*\n/g, '\n\n'));
      }
    }},
    { title: 'Increase Font Size', action: () => setFontSize((s) => Math.min(22, s + 1)) },
    { title: 'Decrease Font Size', action: () => setFontSize((s) => Math.max(10, s - 1)) },
  ];

  const filteredCommands = PALETTE_COMMANDS.filter((c) =>
    c.title.toLowerCase().includes(paletteSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-200 select-none text-xs">
      {/* Hidden File Input for Device Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleDeviceImport}
        className="hidden"
        accept=".html,.css,.js,.ts,.json,.md,.txt"
      />

      {/* Top Main Navigation Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900/90 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30">
            <Code2 size={14} />
            <span>Code Studio</span>
          </div>

          {/* Starter Project Switcher (Only loads when explicitly selected) */}
          <select
            value={currentProject.id.startsWith('starter-') ? currentProject.id : ''}
            onChange={(e) => {
              const p = STARTER_PROJECTS.find((proj) => proj.id === e.target.value);
              if (p) {
                if (files.some((f) => f.content.trim().length > 0)) {
                  if (!confirm(`Load "${p.name}"? Current project files will be replaced.`)) {
                    return;
                  }
                }
                setCurrentProject(p);
                setFiles(p.files);
                setActiveFilePath(p.files[0].path);
                setOpenTabs(p.files.map((f) => f.path));
                setConsoleLogs([]);
              }
            }}
            className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="">Starter Templates...</option>
            {STARTER_PROJECTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Blank Project Button */}
          <button
            onClick={() => {
              if (files.some((f) => f.content.trim().length > 0)) {
                if (!confirm('Start new blank project? Current files will be cleared.')) return;
              }
              setCurrentProject({ id: `project_${Date.now()}`, name: 'Untitled Project' });
              setFiles([]);
              setOpenTabs([]);
              setActiveFilePath('');
              setConsoleLogs([]);
              addNotification('Blank Project', 'Started new empty project with blank editor.', 'info');
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Start new blank project"
          >
            <FilePlus size={12} className="text-blue-400" />
            <span>Blank Project</span>
          </button>

          {/* Command Palette Button */}
          <button
            onClick={() => setShowCommandPalette(true)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Command Palette (Ctrl+P)"
          >
            <Command size={12} />
            <span>Commands</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Import file from computer"
          >
            <Upload size={13} className="text-amber-400" />
            <span>Import</span>
          </button>

          <button
            onClick={saveCurrentFile}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Save file to WebOS filesystem (Ctrl+S)"
          >
            <Save size={13} className="text-emerald-400" />
            <span>Save</span>
          </button>

          <button
            onClick={() => setPreviewKey((prev) => prev + 1)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-sm"
            title="Refresh sandboxed live preview"
          >
            <Play size={12} className="fill-white" />
            <span>Run Preview</span>
          </button>

          <button
            onClick={exportZip}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Download complete project as ZIP archive"
          >
            <Download size={13} className="text-cyan-400" />
            <span>Export ZIP</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout (Sidebar, Editor, Preview) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Project Explorer */}
        <div className="w-52 border-r border-slate-800 bg-slate-950/70 p-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-2 py-1 mb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span>Project Files</span>
              <button
                onClick={() => setIsCreatingFile(true)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                title="New file"
              >
                <FilePlus size={13} />
              </button>
            </div>

            {/* File List */}
            {files.length === 0 ? (
              <div className="py-4 px-2 text-center text-slate-500 text-[11px] space-y-2">
                <p>No project files open.</p>
                <button
                  onClick={() => setIsCreatingFile(true)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 font-medium text-[11px] inline-flex items-center gap-1 transition-colors"
                >
                  <FilePlus size={11} />
                  <span>+ New File</span>
                </button>
              </div>
            ) : (
              <div className="space-y-0.5">
                {files.map((file) => {
                const isActive = file.path === activeFilePath;
                const hasUnsaved = unsavedChanges[file.path];
                return (
                  <div
                    key={file.path}
                    onClick={() => {
                      if (!openTabs.includes(file.path)) {
                        setOpenTabs([...openTabs, file.path]);
                      }
                      setActiveFilePath(file.path);
                    }}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-300 font-medium'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode size={13} className={isActive ? 'text-blue-400' : 'text-slate-500'} />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {hasUnsaved && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1" />}
                      <button
                        onClick={(e) => deleteProjectFile(file.path, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-opacity"
                        title="Delete file"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            )}

            {/* Quick Actions */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="text-[10px] font-semibold text-slate-500 uppercase px-2 block mb-1">
                Project Utilities
              </span>
              <div className="space-y-1">
                <button
                  onClick={exportActiveFile}
                  className="w-full text-left px-2 py-1 rounded text-[11px] text-slate-400 hover:bg-slate-900 hover:text-slate-200 flex items-center gap-1.5"
                >
                  <Download size={11} />
                  <span>Download active file</span>
                </button>
                <button
                  onClick={() => setShowSearch(true)}
                  className="w-full text-left px-2 py-1 rounded text-[11px] text-slate-400 hover:bg-slate-900 hover:text-slate-200 flex items-center gap-1.5"
                >
                  <Search size={11} />
                  <span>Find & Replace (Ctrl+F)</span>
                </button>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 p-1 flex items-center justify-between">
            <span>{files.length} project files</span>
            <span className="text-emerald-400">Autosaved</span>
          </div>
        </div>

        {/* Center: Tabs + Code Editor */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800">
          {/* File Tabs */}
          <div className="flex items-center border-b border-slate-800 bg-slate-950 overflow-x-auto">
            {openTabs.map((path) => {
              const file = files.find((f) => f.path === path);
              if (!file) return null;
              const isActive = path === activeFilePath;
              const hasUnsaved = unsavedChanges[path];
              return (
                <div
                  key={path}
                  onClick={() => setActiveFilePath(path)}
                  className={`flex items-center gap-2 px-3 py-1.5 border-r border-slate-800 cursor-pointer text-xs whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-blue-300 border-t-2 border-t-blue-500'
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                  }`}
                >
                  <span>{file.name}</span>
                  {hasUnsaved ? (
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  ) : (
                    <button
                      onClick={(e) => closeTab(path, e)}
                      className="p-0.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Find and Replace Strip */}
          {showSearch && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs">
              <Search size={13} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Find..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFindNext();
                }}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-36 select-text"
              />
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-36 select-text"
              />
              <button
                onClick={handleFindNext}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
              >
                Find Next
              </button>
              <button
                onClick={handleReplace}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
              >
                Replace
              </button>
              <button
                onClick={handleReplaceAll}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
              >
                All
              </button>
              <button
                onClick={() => setShowSearch(false)}
                className="p-1 text-slate-500 hover:text-slate-300"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Code Editor Body with Line Numbers */}
          <div className="flex-1 flex overflow-hidden bg-slate-900/60 font-mono">
            {/* Line Numbers Bar */}
            <div className="w-10 py-3 bg-slate-950/60 border-r border-slate-800/80 text-right pr-2 text-slate-600 select-none text-xs leading-5">
              {(activeFile ? activeFile.content : '').split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Textarea Editor */}
            <textarea
              ref={textareaRef}
              value={activeFile ? activeFile.content : ''}
              onChange={(e) => handleContentChange(e.target.value)}
              onSelect={(e) => updateCursorPosition(e.currentTarget)}
              onClick={(e) => updateCursorPosition(e.currentTarget)}
              onKeyUp={(e) => updateCursorPosition(e.currentTarget)}
              style={{ fontSize: `${fontSize}px` }}
              placeholder=""
              spellCheck={false}
              className="flex-1 bg-transparent text-slate-100 p-3 leading-5 font-mono focus:outline-none resize-none select-text caret-blue-400"
            />
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between px-3 py-1 border-t border-slate-800 bg-slate-950 text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-3">
              <span className="uppercase text-blue-400 font-semibold">{activeFile?.language || 'plain'}</span>
              <span>UTF-8</span>
              <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
              <span>{(activeFile?.content || '').split('\n').length} lines</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500">Spaces: 2</span>
              <button
                onClick={() => setShowConsole(!showConsole)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
                  showConsole ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Terminal size={11} />
                <span>Console ({consoleLogs.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Live Sandboxed Preview Panel */}
        <div className="w-96 flex flex-col bg-slate-950 min-w-0">
          {/* Preview Toolbar */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900/80 text-xs">
            <span className="font-semibold text-slate-200">Live Preview</span>
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded p-0.5">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-1 rounded ${previewMode === 'desktop' ? 'bg-slate-800 text-blue-400' : 'text-slate-400'}`}
                title="Desktop viewport"
              >
                <Monitor size={12} />
              </button>
              <button
                onClick={() => setPreviewMode('tablet')}
                className={`p-1 rounded ${previewMode === 'tablet' ? 'bg-slate-800 text-blue-400' : 'text-slate-400'}`}
                title="Tablet viewport"
              >
                <Tablet size={12} />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-1 rounded ${previewMode === 'mobile' ? 'bg-slate-800 text-blue-400' : 'text-slate-400'}`}
                title="Mobile viewport"
              >
                <Smartphone size={12} />
              </button>
            </div>
          </div>

          {/* Iframe Viewport Container */}
          <div className="flex-1 bg-slate-900/40 p-2 flex items-center justify-center overflow-hidden">
            <div
              style={{
                width: previewMode === 'mobile' ? '375px' : previewMode === 'tablet' ? '600px' : '100%',
                height: previewMode === 'mobile' ? '560px' : '100%',
              }}
              className="bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-200 border border-slate-800"
            >
              <iframe
                key={previewKey}
                title="Preview"
                srcDoc={previewHtml}
                sandbox="allow-scripts"
                className="w-full h-full border-0"
              />
            </div>
          </div>

          {/* Embedded Console Drawer */}
          {showConsole && (
            <div className="h-44 border-t border-slate-800 bg-slate-950 flex flex-col font-mono text-[11px]">
              <div className="flex items-center justify-between px-2.5 py-1 border-b border-slate-800 bg-slate-900/60 text-slate-400">
                <span>Preview Console Output</span>
                <button
                  onClick={() => setConsoleLogs([])}
                  className="hover:text-slate-200"
                >
                  Clear
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {consoleLogs.length === 0 ? (
                  <div className="text-slate-600 italic">No console logs recorded.</div>
                ) : (
                  consoleLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-2 ${
                        log.type === 'error'
                          ? 'text-rose-400'
                          : log.type === 'warn'
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }`}
                    >
                      <span className="text-slate-600">{log.time}</span>
                      <span>{log.msg}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Command Palette Modal */}
      {showCommandPalette && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-xs"
          onClick={() => setShowCommandPalette(false)}
        >
          <div
            className="w-[480px] rounded-xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center px-3 py-2 border-b border-slate-800 bg-slate-950">
              <Search size={14} className="text-slate-400 mr-2" />
              <input
                type="text"
                autoFocus
                placeholder="Type a command or action..."
                value={paletteSearch}
                onChange={(e) => setPaletteSearch(e.target.value)}
                className="w-full bg-transparent text-slate-100 text-xs focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 font-mono">ESC</span>
            </div>
            <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
              {filteredCommands.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-xs">No matching commands</div>
              ) : (
                filteredCommands.map((cmd) => (
                  <div
                    key={cmd.title}
                    onClick={() => {
                      cmd.action();
                      setShowCommandPalette(false);
                    }}
                    className="px-3 py-2 rounded-lg hover:bg-blue-600/20 hover:text-blue-300 text-slate-300 cursor-pointer flex items-center justify-between text-xs"
                  >
                    <span>{cmd.title}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* New File Modal */}
      {isCreatingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-80 p-4 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl space-y-3">
            <h4 className="font-semibold text-sm text-slate-100">Create New Project File</h4>
            <input
              type="text"
              placeholder="e.g. app.js, style.css, utils.ts"
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateNewFile();
                else if (e.key === 'Escape') setIsCreatingFile(false);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 select-text"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsCreatingFile(false)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewFile}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
