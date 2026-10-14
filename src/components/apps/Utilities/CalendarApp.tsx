import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalIcon, Clock } from 'lucide-react';
import { CalendarEventItem } from '../../../types/system';
import { loadFromStorage, saveToStorage, StorageKeys } from '../../../services/storage';

const INITIAL_EVENTS: CalendarEventItem[] = [];

export const CalendarApp: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(new Date().toISOString().slice(0, 10));
  const [events, setEvents] = useState<CalendarEventItem[]>(() => {
    const loaded = loadFromStorage<CalendarEventItem[]>(StorageKeys.CALENDAR, []);
    // Ensure default dummy events (evt_1, evt_2) are stripped
    return loaded.filter((e) => e.id !== 'evt_1' && e.id !== 'evt_2');
  });

  const [newEventTitle, setNewEventTitle] = useState<string>('');
  const [newEventTime, setNewEventTime] = useState<string>('09:00 AM');
  const [isAddingEvent, setIsAddingEvent] = useState<boolean>(false);

  useEffect(() => {
    saveToStorage(StorageKeys.CALENDAR, events);
  }, [events]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().slice(0, 10));
  };

  const calendarDays = useMemo(() => {
    const days: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];
    // Blank days from previous month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: 0, dateStr: '', isCurrentMonth: false });
    }
    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = (month + 1).toString().padStart(2, '0');
      const dStr = d.toString().padStart(2, '0');
      days.push({
        day: d,
        dateStr: `${year}-${mStr}-${dStr}`,
        isCurrentMonth: true,
      });
    }
    return days;
  }, [year, month, daysInMonth, firstDayIndex]);

  const selectedDayEvents = useMemo(() => {
    return events.filter((e) => e.date === selectedDateStr);
  }, [events, selectedDateStr]);

  const handleAddEvent = () => {
    if (!newEventTitle.trim()) return;
    const newEvt: CalendarEventItem = {
      id: `evt_${Date.now()}`,
      title: newEventTitle.trim(),
      date: selectedDateStr,
      time: newEventTime,
      color: 'blue',
    };
    setEvents((prev) => [...prev, newEvt]);
    setNewEventTitle('');
    setIsAddingEvent(false);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex h-full w-full bg-slate-900/95 text-slate-200 select-none text-xs">
      {/* Calendar Grid Left Side */}
      <div className="flex-1 flex flex-col p-4 border-r border-slate-800">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100">
              {monthNames[month]} {year}
            </h2>
            <button
              onClick={goToToday}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
            >
              Today
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextMonth}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 text-center font-semibold text-slate-500 mb-2">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7 gap-1.5 flex-1 auto-rows-fr">
          {calendarDays.map((item, idx) => {
            if (!item.isCurrentMonth) {
              return <div key={idx} className="p-1" />;
            }
            const isSelected = item.dateStr === selectedDateStr;
            const isToday = item.dateStr === todayStr;
            const dayEvents = events.filter((e) => e.date === item.dateStr);

            return (
              <div
                key={idx}
                onClick={() => setSelectedDateStr(item.dateStr)}
                className={`p-1.5 rounded-lg border cursor-pointer flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-600/20 shadow-sm'
                    : 'border-slate-800/60 bg-slate-950/40 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-block w-5 h-5 text-center leading-5 rounded-full text-[11px] font-medium tabular-nums ${
                      isToday
                        ? 'bg-blue-600 text-white font-bold'
                        : isSelected
                        ? 'text-blue-300 font-semibold'
                        : 'text-slate-300'
                    }`}
                  >
                    {item.day}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  )}
                </div>

                {dayEvents.length > 0 && (
                  <div className="text-[10px] text-slate-400 truncate mt-1">
                    {dayEvents[0].title}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda Right Side */}
      <div className="w-64 bg-slate-950/50 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div>
              <div className="text-[11px] text-slate-400">Selected Date</div>
              <div className="font-semibold text-slate-100 text-sm">
                {new Date(`${selectedDateStr}T00:00:00`).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
            <button
              onClick={() => setIsAddingEvent(!isAddingEvent)}
              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              title="Add event"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* New Event Form */}
          {isAddingEvent && (
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 mb-3 space-y-2">
              <input
                type="text"
                placeholder="Event title..."
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 select-text focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Time (e.g. 10:00 AM)"
                value={newEventTime}
                onChange={(e) => setNewEventTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 select-text focus:outline-none focus:border-blue-500"
              />
              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  onClick={() => setIsAddingEvent(false)}
                  className="px-2 py-0.5 rounded text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEvent}
                  className="px-2.5 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Events list */}
          <div className="space-y-2 overflow-y-auto max-h-[320px]">
            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No events scheduled for this day.
              </div>
            ) : (
              selectedDayEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors group flex items-start justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-200 text-xs mb-0.5">{evt.title}</div>
                    <div className="text-[11px] text-blue-400 flex items-center gap-1">
                      <Clock size={11} />
                      <span>{evt.time}</span>
                    </div>
                    {evt.description && (
                      <p className="text-[11px] text-slate-400 mt-1">{evt.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(evt.id)}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors shrink-0"
                    title="Remove event"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800 flex items-center justify-between">
          <span>{events.length} saved events</span>
          {events.length > 0 && (
            <button
              onClick={() => setEvents([])}
              className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors hover:underline"
              title="Remove all events"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
