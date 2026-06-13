import React, { useState, useEffect } from 'react';
import './App.css';

const STATUS_CONFIG = {
  new: { label: 'New', color: '#6c757d', emoji: '🆕' },
  inprogress: { label: 'In Progress', color: '#007bff', emoji: '⚡' },
  pause: { label: 'Paused', color: '#fd7e14', emoji: '⏸️' },
  partially: { label: 'Partially Done', color: '#ffc107', emoji: '🔶' },
  completed: { label: 'Completed', color: '#28a745', emoji: '✅' },
};

const DAY_COLORS = [
  '#FFE4E1', '#FFE8CC', '#FFFACD', '#E8F5E9',
  '#E3F2FD', '#EDE7F6', '#FCE4EC', '#E0F7FA',
  '#FFF8E1', '#F3E5F5', '#E8EAF6', '#E0F2F1',
  '#FBE9E7', '#F9FBE7', '#E8F5E9', '#E1F5FE',
  '#FFECB3', '#F8BBD0', '#DCEDC8', '#B3E5FC',
  '#D1C4E9', '#FFCCBC', '#C8E6C9', '#B2EBF2',
  '#F0F4C3', '#FFE0B2', '#E1BEE7', '#B2DFDB',
  '#FFCDD2', '#CFD8DC', '#F5F5F5',
];

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDay(year, month) {
  return new Date(year, month, 1).getDay();
}

function toKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function App() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tm_tasks') || '{}'); }
    catch { return {}; }
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('tm_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDay(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const openDay = (day) => {
    setSelectedDate(toKey(currentYear, currentMonth, day));
    setModalOpen(true);
  };

  const addTask = (dateKey, title) => {
    const newTask = { id: Date.now(), title, status: 'new', note: '' };
    setTasks(prev => ({ ...prev, [dateKey]: [...(prev[dateKey] || []), newTask] }));
  };

  const updateTask = (dateKey, taskId, updates) => {
    setTasks(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].map(t => t.id === taskId ? { ...t, ...updates } : t),
    }));
  };

  const deleteTask = (dateKey, taskId) => {
    setTasks(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].filter(t => t.id !== taskId),
    }));
  };

  const getStatusSummary = (dateKey) => {
    const dayTasks = tasks[dateKey] || [];
    if (!dayTasks.length) return null;
    const counts = {};
    dayTasks.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return { total: dayTasks.length, counts };
  };

  const isToday = (day) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="app">
      <header className="app-header">
        <h1>📋 Task Manager</h1>
        <p className="subtitle">Your learning & work tracker</p>
      </header>

      <div className="calendar-container">
        <div className="calendar-nav">
          <button onClick={prevMonth}>◀</button>
          <h2>{MONTHS[currentMonth]} {currentYear}</h2>
          <button onClick={nextMonth}>▶</button>
        </div>

        <div className="day-labels">
          {DAYS.map(d => <div key={d} className="day-label">{d}</div>)}
        </div>

        <div className="calendar-grid">
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} className="day-cell empty" />;
            const key = toKey(currentYear, currentMonth, day);
            const summary = getStatusSummary(key);
            const dayColor = DAY_COLORS[(day - 1) % DAY_COLORS.length];
            return (
              <div
                key={key}
                className={`day-cell ${isToday(day) ? 'today' : ''}`}
                style={{ backgroundColor: dayColor }}
                onClick={() => openDay(day)}
              >
                <span className="day-number">{day}</span>
                {summary && (
                  <div className="task-summary">
                    <span className="task-count">{summary.total} task{summary.total > 1 ? 's' : ''}</span>
                    <div className="status-dots">
                      {Object.entries(summary.counts).map(([s, c]) => (
                        <span key={s} className="status-dot" style={{ backgroundColor: STATUS_CONFIG[s].color }} title={`${STATUS_CONFIG[s].label}: ${c}`} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="legend">
        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
          <span key={key} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: val.color }} />
            {val.label}
          </span>
        ))}
      </div>

      {modalOpen && (
        <TaskModal
          dateKey={selectedDate}
          tasks={tasks[selectedDate] || []}
          onClose={() => setModalOpen(false)}
          onAdd={addTask}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      )}
    </div>
  );
}

function TaskModal({ dateKey, tasks, onClose, onAdd, onUpdate, onDelete }) {
  const [input, setInput] = useState('');
  const [editingNote, setEditingNote] = useState(null);

  const handleAdd = () => {
    if (input.trim()) { onAdd(dateKey, input.trim()); setInput(''); }
  };

  const [d, m, y] = (() => {
    const parts = dateKey.split('-');
    return [parseInt(parts[2]), parseInt(parts[1]) - 1, parts[0]];
  })();
  const displayDate = new Date(y, m, d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📅 {displayDate}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="add-task-row">
          <input
            type="text"
            placeholder="Add a new task..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button className="add-btn" onClick={handleAdd}>+ Add</button>
        </div>

        <div className="task-list">
          {tasks.length === 0 && <p className="no-tasks">No tasks yet. Add one above!</p>}
          {tasks.map(task => (
            <div key={task.id} className="task-item">
              <div className="task-top">
                <span className="task-title">{task.title}</span>
                <button className="delete-btn" onClick={() => onDelete(dateKey, task.id)}>🗑️</button>
              </div>
              <div className="task-controls">
                <div className="status-buttons">
                  {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                    <button
                      key={key}
                      className={`status-btn ${task.status === key ? 'active' : ''}`}
                      style={task.status === key ? { backgroundColor: val.color, color: '#fff', borderColor: val.color } : { borderColor: val.color, color: val.color }}
                      onClick={() => onUpdate(dateKey, task.id, { status: key })}
                      title={val.label}
                    >
                      {val.emoji} {val.label}
                    </button>
                  ))}
                </div>
              </div>
              {editingNote === task.id ? (
                <textarea
                  className="note-input"
                  placeholder="Add notes..."
                  value={task.note}
                  onChange={e => onUpdate(dateKey, task.id, { note: e.target.value })}
                  onBlur={() => setEditingNote(null)}
                  autoFocus
                />
              ) : (
                <div className="note-preview" onClick={() => setEditingNote(task.id)}>
                  {task.note ? `📝 ${task.note}` : '+ Add note'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
