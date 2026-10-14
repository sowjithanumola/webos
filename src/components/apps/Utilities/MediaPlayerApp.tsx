import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, VolumeX, Music, Disc } from 'lucide-react';
import { sound } from '../../../services/soundService';
import { useOS } from '../../../context/OSContext';

interface Track {
  id: string;
  name: string;
  artist: string;
  type: 'synth' | 'file';
  synthType?: 'ambient' | 'synthwave';
  fileContent?: string;
}

const PRESET_TRACKS: Track[] = [
  {
    id: 'track_1',
    name: 'Twilight Nebula (Synthesizer Chords)',
    artist: 'WebOS Audio Engine',
    type: 'synth',
    synthType: 'ambient',
  },
  {
    id: 'track_2',
    name: 'Cyberpunk Arpeggio (8-Bit Saw)',
    artist: 'WebOS Synthesizer',
    type: 'synth',
    synthType: 'synthwave',
  },
];

export const MediaPlayerApp: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>(PRESET_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.6);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const activeTrack = tracks[currentTrackIndex];
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    sound.setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  // Handle synthesized music playback
  const handlePlayToggle = () => {
    sound.playClick();

    if (isPlaying) {
      sound.stopSynthesizedMusic();
      setIsPlaying(false);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    } else {
      setIsPlaying(true);
      setProgress(0);

      if (activeTrack.type === 'synth') {
        const synthType = activeTrack.synthType || 'ambient';
        sound.playSynthesizedTrack(synthType, () => {
          setIsPlaying(false);
          setProgress(100);
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        });

        // Simulate progress bar over 12s
        const startTime = Date.now();
        const duration = 12000;
        progressTimerRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const pct = Math.min(100, (elapsed / duration) * 100);
          setProgress(pct);
          if (pct >= 100) {
            clearInterval(progressTimerRef.current!);
          }
        }, 100);
      }
    }
  };

  const handleStop = () => {
    sound.playClick();
    sound.stopSynthesizedMusic();
    setIsPlaying(false);
    setProgress(0);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      sound.stopSynthesizedMusic();
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-slate-900/95 text-slate-200 select-none text-xs">
      {/* Visualizer Header */}
      <div className="p-6 bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col items-center justify-center border-b border-slate-800">
        <div className="relative mb-4">
          <div
            className={`w-28 h-28 rounded-full border-2 border-slate-700 bg-slate-950 flex items-center justify-center shadow-2xl ${
              isPlaying ? 'animate-spin' : ''
            }`}
            style={{ animationDuration: '6s' }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white">
              <Disc size={20} />
            </div>
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-100 text-center truncate max-w-xs">
          {activeTrack.name}
        </h3>
        <p className="text-[11px] text-slate-400 mt-0.5">{activeTrack.artist}</p>

        {/* Dynamic Waveform Bars */}
        <div className="flex items-center gap-1.5 h-7 mt-3">
          {[40, 70, 30, 90, 50, 80, 60, 100, 45, 75, 35, 85].map((h, i) => (
            <div
              key={i}
              style={{
                height: isPlaying ? `${Math.max(15, (h * (progress % 20 + 10)) / 25)}%` : '20%',
                transition: 'height 0.15s ease',
              }}
              className={`w-1 rounded-full ${
                isPlaying ? 'bg-blue-400' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Progress & Controls */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 space-y-3">
        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            style={{ width: `${progress}%` }}
            className="bg-blue-500 h-full rounded-full transition-all duration-100"
          />
        </div>

        {/* Buttons & Volume */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayToggle}
              className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-transform active:scale-95"
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
            </button>
            <button
              onClick={handleStop}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <Square size={13} />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-400 hover:text-slate-200"
            >
              {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className="w-20 accent-blue-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Track Playlist */}
      <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-800/40">
        <div className="px-2 py-1 text-[10px] uppercase font-semibold text-slate-500">
          Synthesized Tracks
        </div>
        {tracks.map((track, idx) => {
          const isActive = idx === currentTrackIndex;
          return (
            <div
              key={track.id}
              onClick={() => {
                sound.stopSynthesizedMusic();
                setCurrentTrackIndex(idx);
                setIsPlaying(false);
                setProgress(0);
              }}
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                isActive
                  ? 'bg-blue-600/20 text-blue-300 font-medium'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Music size={14} className={isActive ? 'text-blue-400' : 'text-slate-500'} />
                <span className="truncate">{track.name}</span>
              </div>
              <span className="text-[10px] text-slate-500 uppercase">{track.type}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
