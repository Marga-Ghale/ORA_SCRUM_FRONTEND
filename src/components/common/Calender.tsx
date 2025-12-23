import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

// Custom Calendar Component
export const CustomCalendar: React.FC<{
  selectedDate: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}> = ({ selectedDate, onSelect, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return formatDateToString(date) === formatDateToString(today);
  };

  const isSelected = (date: Date): boolean => {
    return formatDateToString(date) === selectedDate;
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentMonth);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    onSelect(formatDateToString(date));
    onClose();
  };

  return (
    <div className="mb-5 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700  overflow-hidden ">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-5">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h3 className="text-white font-semibold text-lg">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-1">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-white/80 text-xs font-medium py-2">
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="p-3">
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dateStr = formatDateToString(date);
            const today = isToday(date);
            const selected = isSelected(date);
            const hovered = hoveredDate === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => handleDateClick(date)}
                onMouseEnter={() => setHoveredDate(dateStr)}
                onMouseLeave={() => setHoveredDate(null)}
                className={`
                  aspect-square rounded-lg text-sm font-medium transition-all duration-150
                  flex items-center justify-center relative
                  ${
                    selected
                      ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg scale-105'
                      : today
                        ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 font-bold ring-2 ring-brand-200 dark:ring-brand-800'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                  ${hovered && !selected ? 'ring-2 ring-brand-300 dark:ring-brand-700' : ''}
                `}
              >
                {date.getDate()}
                {today && !selected && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <button
            onClick={() => {
              onSelect(formatDateToString(new Date()));
              onClose();
            }}
            className="flex-1 px-3 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/30 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-950/50 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => {
              onSelect('');
              onClose();
            }}
            className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};
