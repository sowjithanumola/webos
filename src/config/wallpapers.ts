import { WallpaperId } from '../types/system';

export interface WallpaperOption {
  id: WallpaperId;
  name: string;
  category: 'Dark' | 'Atmospheric' | 'Gradient';
  className: string;
  previewGradient: string;
}

export const WALLPAPER_OPTIONS: WallpaperOption[] = [
  {
    id: 'cosmos',
    name: 'Deep Cosmos',
    category: 'Atmospheric',
    className: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black',
    previewGradient: 'radial-gradient(ellipse at top, #1e1b4b, #020617, #000000)',
  },
  {
    id: 'nordic',
    name: 'Nordic Aurora',
    category: 'Atmospheric',
    className: 'bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-950 via-slate-950 to-indigo-950',
    previewGradient: 'radial-gradient(ellipse at bottom left, #042f2e, #020617, #1e1b4b)',
  },
  {
    id: 'obsidian',
    name: 'Obsidian Prism',
    category: 'Dark',
    className: 'bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-neutral-950 to-black',
    previewGradient: 'radial-gradient(circle at top right, #0f172a, #0a0a0a, #000000)',
  },
  {
    id: 'cobalt',
    name: 'Midnight Cobalt',
    category: 'Gradient',
    className: 'bg-gradient-to-br from-blue-950 via-slate-950 to-slate-900',
    previewGradient: 'linear-gradient(to bottom right, #172554, #020617, #0f172a)',
  },
  {
    id: 'sunset',
    name: 'Dusk Ember',
    category: 'Gradient',
    className: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-950/60 via-slate-950 to-black',
    previewGradient: 'radial-gradient(ellipse at top, #4c0519, #020617, #000000)',
  },
  {
    id: 'slate',
    name: 'Pure Slate',
    category: 'Dark',
    className: 'bg-gradient-to-b from-slate-900 to-slate-950',
    previewGradient: 'linear-gradient(to bottom, #0f172a, #020617)',
  },
];
