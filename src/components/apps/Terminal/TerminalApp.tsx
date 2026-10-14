import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../../context/OSContext';
import { VirtualFolder } from '../../../types/fs';
import { AppId } from '../../../types/window';

interface HistoryEntry {
  command: string;
  output: React.ReactNode;
}

export const TerminalApp: React.FC = () => {
  const {
    fs,
    createFolder,
    createFile,
    deleteFSNode,
    openWindow,
    settings,
  } = useOS();

  const [cwd, setCwd] = useState<string>('/home/user');
  const [inputVal, setInputVal] = useState<string>('');
  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      command: '',
      output: (
        <div className="text-slate-400 mb-2 leading-relaxed">
          <div className="text-emerald-400 font-semibold">WebOS Terminal (Simulated Browser Shell v1.0)</div>
          <div className="text-xs text-slate-500">
            Note: This is a simulated browser environment. Commands operate strictly on your WebOS virtual filesystem.
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Type <span className="text-blue-400 font-mono">help</span> for a list of available commands.
          </div>
        </div>
      ),
    },
  ]);

  const [cmdList, setCmdList] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input on mount or click
  const focusInput = () => {
    inputRef.current?.focus();
  };

  const getFolderByPath = (path: string): VirtualFolder | null => {
    let target = path.trim();
    if (target === '~') target = '/home/user';
    else if (target.startsWith('~/')) target = '/home/user/' + target.slice(2);
    else if (!target.startsWith('/')) {
      target = cwd === '/' ? `/${target}` : `${cwd}/${target}`;
    }

    const segments = target.split('/').filter(Boolean);
    const resolved: string[] = [];
    for (const s of segments) {
      if (s === '.') continue;
      if (s === '..') resolved.pop();
      else resolved.push(s);
    }
    const resolvedPath = '/' + resolved.join('/');

    const node = Object.values(fs.nodes).find(
      (n) => n.path === resolvedPath && (n.type === 'folder' || n.type === 'trash')
    );
    return (node as VirtualFolder) || null;
  };

  const executeCommand = (cmdStr: string) => {
    const raw = cmdStr.trim();
    if (!raw) return;

    // Add to history list
    setCmdList((prev) => [...prev, raw]);
    setHistoryIdx(-1);

    const parts = raw.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    let output: React.ReactNode = null;

    switch (cmd) {
      case 'help':
        output = (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-slate-300">
            <div><span className="text-blue-400 font-mono">ls [dir]</span> - List directory contents</div>
            <div><span className="text-blue-400 font-mono">cd &lt;dir&gt;</span> - Change directory</div>
            <div><span className="text-blue-400 font-mono">pwd</span> - Print working directory</div>
            <div><span className="text-blue-400 font-mono">cat &lt;file&gt;</span> - Print file contents</div>
            <div><span className="text-blue-400 font-mono">touch &lt;file&gt;</span> - Create empty file</div>
            <div><span className="text-blue-400 font-mono">mkdir &lt;dir&gt;</span> - Create folder</div>
            <div><span className="text-blue-400 font-mono">rm &lt;file&gt;</span> - Remove file</div>
            <div><span className="text-blue-400 font-mono">echo &lt;text&gt;</span> - Print arguments</div>
            <div><span className="text-blue-400 font-mono">open &lt;app|file&gt;</span> - Open window</div>
            <div><span className="text-blue-400 font-mono">date / time</span> - Print current date/time</div>
            <div><span className="text-blue-400 font-mono">whoami</span> - Print current user</div>
            <div><span className="text-blue-400 font-mono">webfetch</span> - System overview (neofetch)</div>
            <div><span className="text-blue-400 font-mono">history</span> - Show command history</div>
            <div><span className="text-blue-400 font-mono">clear</span> - Clear screen</div>
          </div>
        );
        break;

      case 'clear':
        setHistory([]);
        setInputVal('');
        return;

      case 'pwd':
        output = <div className="text-emerald-300 font-mono">{cwd}</div>;
        break;

      case 'whoami':
        output = <div className="text-slate-300 font-mono">{settings.profile.name.toLowerCase().replace(/\s+/g, '_')}</div>;
        break;

      case 'date':
      case 'time':
        output = <div className="text-slate-300 font-mono">{new Date().toLocaleString()}</div>;
        break;

      case 'echo':
        output = <div className="text-slate-300 font-mono">{args.join(' ')}</div>;
        break;

      case 'history':
        output = (
          <div className="space-y-0.5 font-mono text-slate-400">
            {cmdList.map((c, i) => (
              <div key={i}>{i + 1}  {c}</div>
            ))}
          </div>
        );
        break;

      case 'webfetch':
        output = (
          <div className="flex gap-4 font-mono text-xs my-1">
            <div className="text-cyan-400 select-none hidden sm:block whitespace-pre">
{`   __      __   _     ___  ____ 
   \\ \\    / /__| |__ / _ \\/ ___|
    \\ \\/\\/ / -_) '_ \\ (_) \\___ \\
     \\_/\\_/\\___|_.__/\\___/|____/`}
            </div>
            <div className="space-y-1 text-slate-300">
              <div><span className="text-blue-400 font-semibold">OS:</span> WebOS 1.0 (Browser Client)</div>
              <div><span className="text-blue-400 font-semibold">Kernel:</span> React 19 / TypeScript / Vite</div>
              <div><span className="text-blue-400 font-semibold">User:</span> {settings.profile.name}</div>
              <div><span className="text-blue-400 font-semibold">Theme:</span> {settings.theme} ({settings.wallpaper})</div>
              <div><span className="text-blue-400 font-semibold">Storage:</span> LocalStorage + Virtual FS</div>
              <div><span className="text-blue-400 font-semibold">Resolution:</span> {window.innerWidth}x{window.innerHeight}</div>
            </div>
          </div>
        );
        break;

      case 'cd': {
        const targetPath = args[0] || '~';
        const folder = getFolderByPath(targetPath);
        if (folder) {
          setCwd(folder.path);
        } else {
          output = <div className="text-rose-400">cd: {targetPath}: No such directory</div>;
        }
        break;
      }

      case 'ls': {
        const targetPath = args[0] || cwd;
        const folder = getFolderByPath(targetPath);
        if (!folder) {
          output = <div className="text-rose-400">ls: {targetPath}: No such directory</div>;
        } else {
          const children = (folder.childrenIds || [])
            .map((id) => fs.nodes[id])
            .filter(Boolean);

          if (children.length === 0) {
            output = <div className="text-slate-500 italic">Empty directory</div>;
          } else {
            output = (
              <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono">
                {children.map((child) => (
                  <span
                    key={child.id}
                    className={
                      child.type === 'folder' || child.type === 'trash'
                        ? 'text-blue-400 font-semibold'
                        : child.type === 'code'
                        ? 'text-emerald-400'
                        : 'text-slate-200'
                    }
                  >
                    {child.name}
                    {child.type === 'folder' ? '/' : ''}
                  </span>
                ))}
              </div>
            );
          }
        }
        break;
      }

      case 'cat': {
        if (!args[0]) {
          output = <div className="text-rose-400">cat: missing file argument</div>;
          break;
        }
        const fileName = args[0];
        const currentFolder = getFolderByPath(cwd);
        if (!currentFolder) {
          output = <div className="text-rose-400">Directory not found</div>;
          break;
        }
        const file = (currentFolder.childrenIds || [])
          .map((id) => fs.nodes[id])
          .find((n) => n?.name === fileName);

        if (!file) {
          output = <div className="text-rose-400">cat: {fileName}: No such file</div>;
        } else if (file.type === 'folder') {
          output = <div className="text-rose-400">cat: {fileName}: Is a directory</div>;
        } else {
          output = (
            <pre className="text-slate-300 font-mono whitespace-pre-wrap text-xs select-text">
              {file.content || '(empty file)'}
            </pre>
          );
        }
        break;
      }

      case 'touch': {
        if (!args[0]) {
          output = <div className="text-rose-400">touch: missing file argument</div>;
          break;
        }
        const currentFolder = getFolderByPath(cwd);
        if (!currentFolder) {
          output = <div className="text-rose-400">Directory not found</div>;
          break;
        }
        try {
          createFile(currentFolder.id, args[0], '');
          output = <div className="text-emerald-400">Created file "{args[0]}"</div>;
        } catch (err: unknown) {
          output = <div className="text-rose-400">{err instanceof Error ? err.message : 'Error'}</div>;
        }
        break;
      }

      case 'mkdir': {
        if (!args[0]) {
          output = <div className="text-rose-400">mkdir: missing directory name</div>;
          break;
        }
        const currentFolder = getFolderByPath(cwd);
        if (!currentFolder) {
          output = <div className="text-rose-400">Directory not found</div>;
          break;
        }
        try {
          createFolder(currentFolder.id, args[0]);
          output = <div className="text-emerald-400">Created folder "{args[0]}"</div>;
        } catch (err: unknown) {
          output = <div className="text-rose-400">{err instanceof Error ? err.message : 'Error'}</div>;
        }
        break;
      }

      case 'rm': {
        if (!args[0]) {
          output = <div className="text-rose-400">rm: missing file argument</div>;
          break;
        }
        const currentFolder = getFolderByPath(cwd);
        if (!currentFolder) {
          output = <div className="text-rose-400">Directory not found</div>;
          break;
        }
        const file = (currentFolder.childrenIds || [])
          .map((id) => fs.nodes[id])
          .find((n) => n?.name === args[0]);

        if (!file) {
          output = <div className="text-rose-400">rm: {args[0]}: No such file</div>;
        } else {
          try {
            deleteFSNode(file.id);
            output = <div className="text-slate-400">Moved "{args[0]}" to Trash</div>;
          } catch (err: unknown) {
            output = <div className="text-rose-400">{err instanceof Error ? err.message : 'Error'}</div>;
          }
        }
        break;
      }

      case 'open': {
        if (!args[0]) {
          output = <div className="text-rose-400">open: missing app name or filename</div>;
          break;
        }
        const target = args[0].toLowerCase();
        const validApps: Record<string, AppId> = {
          files: 'file-manager',
          notes: 'notes',
          calc: 'calculator',
          calculator: 'calculator',
          editor: 'text-editor',
          settings: 'settings',
          clock: 'clock',
          calendar: 'calendar',
          media: 'media-player',
        };

        if (validApps[target]) {
          openWindow(validApps[target]);
          output = <div className="text-emerald-400">Opened {target}</div>;
        } else {
          // Check if it's a file in current directory
          const currentFolder = getFolderByPath(cwd);
          const file = (currentFolder?.childrenIds || [])
            .map((id) => fs.nodes[id])
            .find((n) => n?.name === args[0]);

          if (file) {
            if (file.type === 'image') {
              openWindow('image-viewer', { title: file.name, payload: { fileId: file.id } });
            } else {
              openWindow('text-editor', { title: file.name, payload: { fileId: file.id } });
            }
            output = <div className="text-emerald-400">Opened "{file.name}"</div>;
          } else {
            output = <div className="text-rose-400">open: {args[0]}: Application or file not found</div>;
          }
        }
        break;
      }

      default:
        output = (
          <div className="text-rose-400">
            command not found: {cmd}. Type <span className="text-blue-400 font-mono">help</span> for available commands.
          </div>
        );
    }

    setHistory((prev) => [...prev, { command: raw, output }]);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdList.length === 0) return;
      const nextIdx = historyIdx === -1 ? cmdList.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInputVal(cmdList[nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cmdList.length === 0 || historyIdx === -1) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= cmdList.length) {
        setHistoryIdx(-1);
        setInputVal('');
      } else {
        setHistoryIdx(nextIdx);
        setInputVal(cmdList[nextIdx]);
      }
    }
  };

  return (
    <div
      onClick={focusInput}
      className="flex flex-col h-full w-full bg-slate-950/95 text-slate-100 font-mono text-xs p-3 overflow-hidden select-text"
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pr-1">
        {history.map((entry, idx) => (
          <div key={idx} className="space-y-1">
            {entry.command && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-emerald-400 font-bold">user@webos</span>
                <span className="text-slate-600">:</span>
                <span className="text-blue-400 font-semibold">{cwd}</span>
                <span className="text-slate-300">$</span>
                <span className="text-slate-100">{entry.command}</span>
              </div>
            )}
            {entry.output && <div className="pl-1 text-slate-300">{entry.output}</div>}
          </div>
        ))}

        {/* Active Command Prompt Input */}
        <div className="flex items-center gap-1.5 text-slate-400 pt-1">
          <span className="text-emerald-400 font-bold">user@webos</span>
          <span className="text-slate-600">:</span>
          <span className="text-blue-400 font-semibold">{cwd}</span>
          <span className="text-slate-300">$</span>
          <input
            ref={inputRef}
            type="text"
            autoFocus
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-slate-100 focus:outline-none font-mono text-xs caret-blue-400"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};
