import React, { useState, useEffect, useCallback } from 'react';
import { Delete, History, RotateCcw } from 'lucide-react';
import { MathEvaluator } from '../../../services/mathParser';
import { sound } from '../../../services/soundService';

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
}

export const CalculatorApp: React.FC = () => {
  const [display, setDisplay] = useState<string>('0');
  const [expression, setExpression] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isScientific, setIsScientific] = useState<boolean>(false);

  const inputChar = useCallback((char: string) => {
    sound.playClick();
    setDisplay((prev) => {
      if (prev === '0' && !['.', '+', '-', '*', '/', '%', '^'].includes(char)) {
        return char;
      }
      return prev + char;
    });
  }, []);

  const inputOperator = useCallback((op: string) => {
    sound.playClick();
    setDisplay((prev) => {
      const lastChar = prev.slice(-1);
      if (['+', '-', '*', '/', '%', '^'].includes(lastChar)) {
        return prev.slice(0, -1) + op;
      }
      return prev + op;
    });
  }, []);

  const clearAll = useCallback(() => {
    sound.playClick();
    setDisplay('0');
    setExpression('');
  }, []);

  const backspace = useCallback(() => {
    sound.playClick();
    setDisplay((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  }, []);

  const calculateResult = useCallback(() => {
    sound.playClick();
    if (!display || display === '0') return;

    try {
      const resultNum = MathEvaluator.calculate(display);
      const formatted = MathEvaluator.formatResult(resultNum);
      const newHistoryItem: HistoryItem = {
        id: `calc_${Date.now()}`,
        expression: display,
        result: formatted,
      };

      setHistory((prev) => [newHistoryItem, ...prev].slice(0, 30));
      setExpression(`${display} =`);
      setDisplay(formatted);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      setExpression(display);
      setDisplay(`Error: ${msg}`);
      setTimeout(() => {
        setDisplay('0');
      }, 1500);
    }
  }, [display]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Numbers
      if (/[0-9]/.test(e.key)) {
        inputChar(e.key);
      } else if (e.key === '.') {
        inputChar('.');
      } else if (['+', '-', '*', '/'].includes(e.key)) {
        inputOperator(e.key);
      } else if (e.key === '(' || e.key === ')') {
        inputChar(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculateResult();
      } else if (e.key === 'Backspace') {
        backspace();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        clearAll();
      } else if (e.key === '%') {
        inputOperator('%');
      } else if (e.key === '^') {
        inputOperator('^');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputChar, inputOperator, calculateResult, backspace, clearAll]);

  return (
    <div className="flex h-full w-full bg-slate-900/95 text-slate-100 select-none flex-col">
      {/* Top Header / Mode Switcher */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 text-xs bg-slate-950/40">
        <button
          onClick={() => setIsScientific(!isScientific)}
          className="text-slate-400 hover:text-blue-400 font-medium transition-colors"
        >
          {isScientific ? 'Standard' : 'Scientific'}
        </button>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`p-1 rounded transition-colors ${showHistory ? 'text-blue-400 bg-slate-800' : 'text-slate-400 hover:text-slate-200'}`}
          title="Calculation History"
        >
          <History size={14} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Keypad & Display */}
        <div className="flex-1 flex flex-col p-3">
          {/* LCD Display */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mb-3 flex flex-col justify-end text-right min-h-[90px] shadow-inner">
            <span className="text-xs text-slate-400 font-mono tracking-tight truncate h-4 mb-1">
              {expression}
            </span>
            <span className="text-2xl font-mono font-semibold tracking-tight text-white truncate tabular-nums">
              {display}
            </span>
          </div>

          {/* Scientific Row (collapsible or toggleable) */}
          {isScientific && (
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              <button
                onClick={() => inputChar('sin(')}
                className="py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-blue-400 text-xs font-mono font-medium transition-colors"
              >
                sin
              </button>
              <button
                onClick={() => inputChar('cos(')}
                className="py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-blue-400 text-xs font-mono font-medium transition-colors"
              >
                cos
              </button>
              <button
                onClick={() => inputChar('tan(')}
                className="py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-blue-400 text-xs font-mono font-medium transition-colors"
              >
                tan
              </button>
              <button
                onClick={() => inputChar('sqrt(')}
                className="py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-blue-400 text-xs font-mono font-medium transition-colors"
              >
                √
              </button>
              <button
                onClick={() => inputChar('pi')}
                className="py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-indigo-400 text-xs font-mono font-medium transition-colors"
              >
                π
              </button>
              <button
                onClick={() => inputChar('e')}
                className="py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-indigo-400 text-xs font-mono font-medium transition-colors"
              >
                e
              </button>
              <button
                onClick={() => inputOperator('^')}
                className="py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-indigo-400 text-xs font-mono font-medium transition-colors"
              >
                x^y
              </button>
              <button
                onClick={() => inputChar('ln(')}
                className="py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-indigo-400 text-xs font-mono font-medium transition-colors"
              >
                ln
              </button>
            </div>
          )}

          {/* Keypad Grid */}
          <div className="grid grid-cols-4 gap-2 flex-1">
            <button
              onClick={clearAll}
              className="rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-semibold text-sm transition-colors border border-rose-800/40"
            >
              C
            </button>
            <button
              onClick={() => inputChar('(')}
              className="rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors"
            >
              (
            </button>
            <button
              onClick={() => inputChar(')')}
              className="rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors"
            >
              )
            </button>
            <button
              onClick={backspace}
              className="rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              title="Backspace"
            >
              <Delete size={16} />
            </button>

            {/* Row 2 */}
            <button
              onClick={() => inputChar('7')}
              className="rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white font-medium text-base transition-colors"
            >
              7
            </button>
            <button
              onClick={() => inputChar('8')}
              className="rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white font-medium text-base transition-colors"
            >
              8
            </button>
            <button
              onClick={() => inputChar('9')}
              className="rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white font-medium text-base transition-colors"
            >
              9
            </button>
            <button
              onClick={() => inputOperator('/')}
              className="rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 font-semibold text-base transition-colors border border-blue-500/20"
            >
              ÷
            </button>

            {/* Row 3 */}
            <button
              onClick={() => inputChar('4')}
              className="rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white font-medium text-base transition-colors"
            >
              4
            </button>
            <button
              onClick={() => inputChar('5')}
              className="rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white font-medium text-base transition-colors"
            >
              5
            </button>
            <button
              onClick={() => inputChar('6')}
              className="rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white font-medium text-base transition-colors"
            >
              6
            </button>
            <button
              onClick={() => inputOperator('*')}
              className="rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 font-semibold text-base transition-colors border border-blue-500/20"
            >
              ×
            </button>

            {/* Row 4 */}
            <button
              onClick={() => inputChar('1')}
              className="rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white font-medium text-base transition-colors"
            >
              1
            </button>
            <button
              onClick={() => inputChar('2')}
              className="rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white font-medium text-base transition-colors"
            >
              2
            </button>
            <button
              onClick={() => inputChar('3')}
              className="rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white font-medium text-base transition-colors"
            >
              3
            </button>
            <button
              onClick={() => inputOperator('-')}
              className="rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 font-semibold text-base transition-colors border border-blue-500/20"
            >
              -
            </button>

            {/* Row 5 */}
            <button
              onClick={() => inputChar('0')}
              className="rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white font-medium text-base transition-colors"
            >
              0
            </button>
            <button
              onClick={() => inputChar('.')}
              className="rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white font-medium text-base transition-colors"
            >
              .
            </button>
            <button
              onClick={() => inputOperator('%')}
              className="rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white font-medium text-base transition-colors"
            >
              %
            </button>
            <button
              onClick={() => inputOperator('+')}
              className="rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 font-semibold text-base transition-colors border border-blue-500/20"
            >
              +
            </button>

            {/* Full width Equals Button */}
            <button
              onClick={calculateResult}
              className="col-span-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-md transition-all active:scale-[0.99]"
            >
              =
            </button>
          </div>
        </div>

        {/* History Slide-over */}
        {showHistory && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md p-3 flex flex-col z-20">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                <History size={14} className="text-blue-400" />
                History
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHistory([])}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  Clear
                </button>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs px-2 py-0.5 rounded bg-slate-800"
                >
                  Done
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No calculation history yet.
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setDisplay(item.result);
                      setExpression(`${item.expression} =`);
                      setShowHistory(false);
                    }}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/50 cursor-pointer text-right transition-colors"
                  >
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      {item.expression}
                    </div>
                    <div className="text-sm font-semibold font-mono text-blue-300 truncate">
                      = {item.result}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
