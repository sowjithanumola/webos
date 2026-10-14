import React from 'react';
import { useOS } from '../../context/OSContext';
import { WindowFrame } from './WindowFrame';
import { FileManagerApp } from '../apps/FileManager/FileManagerApp';
import { NotesApp } from '../apps/Notes/NotesApp';
import { CalculatorApp } from '../apps/Calculator/CalculatorApp';
import { TerminalApp } from '../apps/Terminal/TerminalApp';
import { TextEditorApp } from '../apps/TextEditor/TextEditorApp';
import { SettingsApp } from '../apps/Settings/SettingsApp';
import { ClockUtilityApp } from '../apps/Utilities/ClockUtilityApp';
import { CalendarApp } from '../apps/Utilities/CalendarApp';
import { ImageViewerApp } from '../apps/Utilities/ImageViewerApp';
import { MediaPlayerApp } from '../apps/Utilities/MediaPlayerApp';
import { CodeStudioApp } from '../apps/CodeStudio/CodeStudioApp';
import { DocsStudioApp } from '../apps/DocsStudio/DocsStudioApp';
import { SupabaseSQLEditorApp } from '../apps/SupabaseSQL/SupabaseSQLEditorApp';

export const WindowManager: React.FC = () => {
  const { windows } = useOS();

  const renderAppContent = (win: typeof windows[0]) => {
    switch (win.appId) {
      case 'file-manager':
        return <FileManagerApp />;
      case 'notes':
        return <NotesApp />;
      case 'calculator':
        return <CalculatorApp />;
      case 'terminal':
        return <TerminalApp />;
      case 'text-editor':
        return <TextEditorApp payload={win.payload as { fileId?: string; filePath?: string }} />;
      case 'code-studio':
        return <CodeStudioApp payload={win.payload as { fileId?: string; filePath?: string }} />;
      case 'docs-studio':
        return <DocsStudioApp payload={win.payload as { fileId?: string; filePath?: string }} />;
      case 'supabase-sql':
      case 'sql-studio':
        return <SupabaseSQLEditorApp />;
      case 'settings':
        return <SettingsApp />;
      case 'clock':
        return <ClockUtilityApp />;
      case 'calendar':
        return <CalendarApp />;
      case 'image-viewer':
        return <ImageViewerApp payload={win.payload as { fileId?: string; filePath?: string }} />;
      case 'media-player':
        return <MediaPlayerApp />;
      default:
        return (
          <div className="p-4 text-slate-400 text-xs">
            Application not installed or initialized.
          </div>
        );
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {windows.map((win) => (
        <div key={win.id} className="pointer-events-auto">
          <WindowFrame window={win}>{renderAppContent(win)}</WindowFrame>
        </div>
      ))}
    </div>
  );
};
