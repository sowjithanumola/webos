import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag, Bell, Clock as ClockIcon, Timer } from 'lucide-react';
import { sound } from '../../../services/soundService';
import { useOS } from '../../../context/OSContext';

export const ClockUtilityApp: React.FC = () => {
  const { addNotification } = useOS();
  const [activeTab, setActiveTab] = useState<'stopwatch' | 'timer'>('stopwatch');

  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState<number>(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);
  const [laps, setLaps] = useState<number[]>([]);
  const stopwatchRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchRef.current = setInterval(() => {
        setStopwatchTime((prev) => prev + 10);
      }, 10);
    } else {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    }
    return () => {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    };
  }, [isStopwatchRunning]);

  const handleStopwatchStart = () => {
    sound.playClick();
    setIsStopwatchRunning(!isStopwatchRunning);
  };

  const handleStopwatchReset = () => {
    sound.playClick();
    setIsStopwatchRunning(false);
    setStopwatchTime(0);
    setLaps([]);
  };

  const handleLap = () => {
    sound.playClick();
    setLaps((prev) => [stopwatchTime, ...prev]);
  };

  const formatStopwatch = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState<number>(300); // 5 min default
  const [initialTimer, setInitialTimer] = useState<number>(300);
  const [customMins, setCustomMins] = useState<number>(10);
  const [customSecs, setCustomSecs] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimerRunning(false);
            sound.playAlarm();
            addNotification('Timer Finished', 'Your countdown timer has completed.', 'info');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, addNotification]);

  const setTimerPreset = (secs: number) => {
    sound.playClick();
    setIsTimerRunning(false);
    setInitialTimer(secs);
    setTimerSeconds(secs);
  };

  const handleTimerToggle = () => {
    sound.playClick();
    if (timerSeconds === 0) {
      setTimerSeconds(initialTimer);
    }
    setIsTimerRunning(!isTimerRunning);
  };

  const handleTimerReset = () => {
    sound.playClick();
    setIsTimerRunning(false);
    setTimerSeconds(initialTimer);
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900/95 text-slate-100 select-none text-xs">
      {/* Top Segmented Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 justify-center">
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('stopwatch')}
            className={`flex items-center gap-1.5 px-4 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'stopwatch'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClockIcon size={13} />
            <span>Stopwatch</span>
          </button>
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex items-center gap-1.5 px-4 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'timer'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Timer size={13} />
            <span>Countdown Timer</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
        {activeTab === 'stopwatch' && (
          <div className="w-full max-w-sm flex flex-col items-center">
            {/* Stopwatch LCD Display */}
            <div className="w-full py-8 text-center font-mono text-4xl sm:text-5xl font-bold tracking-tight text-white tabular-nums drop-shadow-md">
              {formatStopwatch(stopwatchTime)}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={handleStopwatchStart}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-semibold shadow-md transition-all ${
                  isStopwatchRunning
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {isStopwatchRunning ? <Pause size={15} /> : <Play size={15} />}
                <span>{isStopwatchRunning ? 'Pause' : 'Start'}</span>
              </button>

              <button
                onClick={handleLap}
                disabled={!isStopwatchRunning}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-medium transition-colors"
              >
                <Flag size={14} />
                <span>Lap</span>
              </button>

              <button
                onClick={handleStopwatchReset}
                disabled={stopwatchTime === 0 && !isStopwatchRunning}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
                title="Reset"
              >
                <RotateCcw size={15} />
              </button>
            </div>

            {/* Laps List */}
            {laps.length > 0 && (
              <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 max-h-44 overflow-y-auto divide-y divide-slate-800/60">
                {laps.map((lapTime, idx) => (
                  <div key={idx} className="flex justify-between py-1.5 text-xs font-mono">
                    <span className="text-slate-400">Lap {laps.length - idx}</span>
                    <span className="text-blue-300 font-semibold">{formatStopwatch(lapTime)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'timer' && (
          <div className="w-full max-w-sm flex flex-col items-center">
            {/* Presets and Custom Duration */}
            <div className="flex flex-col items-center gap-2 mb-4 w-full">
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {[
                  { label: '1 min', val: 60 },
                  { label: '5 min', val: 300 },
                  { label: '15 min', val: 900 },
                  { label: '25m (Pomodoro)', val: 1500 },
                ].map((p) => (
                  <button
                    key={p.val}
                    onClick={() => setTimerPreset(p.val)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                      initialTimer === p.val && !isTimerRunning
                        ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom Duration Selector */}
              <div className="flex items-center gap-2 mt-1 bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Custom:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={customMins}
                    onChange={(e) => setCustomMins(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-xs text-slate-200 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">min</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customSecs}
                    onChange={(e) => setCustomSecs(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-xs text-slate-200 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">sec</span>
                </div>
                <button
                  onClick={() => {
                    const total = customMins * 60 + customSecs;
                    if (total > 0) setTimerPreset(total);
                  }}
                  className="px-2.5 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-xs"
                >
                  Set
                </button>
              </div>
            </div>

            {/* Countdown LCD */}
            <div className="w-full py-6 text-center font-mono text-5xl sm:text-6xl font-bold tracking-tight text-white tabular-nums drop-shadow-md">
              {formatTimer(timerSeconds)}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleTimerToggle}
                className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-semibold shadow-md transition-all ${
                  isTimerRunning
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
                <span>{isTimerRunning ? 'Pause' : 'Start'}</span>
              </button>

              <button
                onClick={handleTimerReset}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                title="Reset Timer"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
