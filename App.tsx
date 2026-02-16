
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  CheckCircle, 
  Circle, 
  BarChart3, 
  Calendar, 
  Bell, 
  BookOpen, 
  Trophy, 
  Flame, 
  Zap, 
  Clock, 
  Plus, 
  Minus, 
  Trash2,
  Download,
  User,
  LogOut,
  Mail,
  Lock,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { PTE_TASKS, MOCK_HISTORY } from './constants';
import { PTETask, DayProgress, Reminder, PTESection } from './types';
import { getStudyAdvice } from './services/geminiService';
import { CloudService } from './services/storageService';

// --- Sub-components ---

const ProgressBar: React.FC<{ progress: number; className?: string; color?: string }> = ({ progress, className = "h-2.5", color = "bg-indigo-600" }) => (
  <div className={`w-full bg-gray-200 rounded-full ${className}`}>
    <div 
      className={`${color} h-full rounded-full transition-all duration-500 ease-out`} 
      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
    ></div>
  </div>
);

const TaskCard: React.FC<{ 
  task: PTETask; 
  onUpdate: (id: string, delta: number) => void;
}> = ({ task, onUpdate }) => {
  const [pulse, setPulse] = useState(false);
  const isFinished = task.currentCount >= task.targetCount;
  const progressPercent = (task.currentCount / task.targetCount) * 100;
  
  useEffect(() => {
    if (task.currentCount > 0) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 300);
      return () => clearTimeout(timer);
    }
  }, [task.currentCount]);

  const sectionColors = {
    'Speaking': 'bg-blue-500',
    'Writing': 'bg-purple-500',
    'Reading': 'bg-orange-500',
    'Listening': 'bg-pink-500'
  };

  return (
    <div 
      onClick={() => !isFinished && onUpdate(task.id, 1)}
      className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col gap-3 cursor-pointer select-none active:scale-[0.98] ${
        isFinished ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-white border-gray-100 shadow-sm hover:border-indigo-200'
      } ${pulse ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className={`transition-transform duration-300 ${isFinished ? 'scale-110' : pulse ? 'scale-110' : ''}`}>
          {isFinished ? (
            <CheckCircle className="text-green-600 w-6 h-6" />
          ) : (
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-colors ${
              pulse ? 'border-indigo-500 text-indigo-500 bg-indigo-50' : 'border-gray-200 text-gray-400'
            }`}>
              {task.currentCount}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold text-sm truncate ${isFinished ? 'text-green-800 opacity-70' : 'text-gray-800'}`}>
            {task.name}
          </h4>
          <p className="text-[11px] text-gray-500 mt-0.5 truncate">{task.description}</p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl p-1 border border-slate-100">
          <button 
            onClick={(e) => { e.stopPropagation(); onUpdate(task.id, -1); }}
            disabled={task.currentCount <= 0}
            className="p-1.5 hover:bg-white rounded-lg text-gray-400 disabled:opacity-20 transition-all"
          >
            <Minus size={14} strokeWidth={3} />
          </button>
          <span className={`text-xs font-black w-5 text-center ${pulse ? 'text-indigo-600' : 'text-gray-600'}`}>
            {task.currentCount}
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); onUpdate(task.id, 1); }}
            disabled={isFinished}
            className="p-1.5 hover:bg-white rounded-lg text-indigo-600 disabled:opacity-20 transition-all"
          >
            <Plus size={14} strokeWidth={3} />
          </button>
        </div>
      </div>
      
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
          <span className={isFinished ? 'text-green-600' : 'text-gray-400'}>
            {isFinished ? 'Mission Complete' : `${task.targetCount - task.currentCount} left`}
          </span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <ProgressBar progress={progressPercent} className="h-1.5" color={isFinished ? 'bg-green-500' : sectionColors[task.section]} />
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  // User State
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  
  // App State
  const [activeTab, setActiveTab] = useState<'daily' | 'stats' | 'reminders'>('daily');
  const [tasks, setTasks] = useState<PTETask[]>(PTE_TASKS);
  const [history, setHistory] = useState<DayProgress[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [aiTip, setAiTip] = useState<string>("Loading advice...");
  const [isSyncing, setIsSyncing] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Check Session
  useEffect(() => {
    const savedUser = localStorage.getItem('pte_session_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsAuthLoading(false);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  // Load Data when User Logs In
  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      setIsSyncing(true);
      const cloudData = await CloudService.loadUserData(user.id);
      if (cloudData) {
        setTasks(cloudData.tasks);
        setHistory(cloudData.history);
      } else {
        setHistory(MOCK_HISTORY);
      }
      setIsSyncing(false);
    };

    const savedReminders = localStorage.getItem(`pte_reminders_${user.id}`);
    if (savedReminders) setReminders(JSON.parse(savedReminders));
    else setReminders([{ id: '1', time: '08:00', label: 'Morning Practice', active: true }]);

    loadData();
    fetchAdvice();
  }, [user]);

  // Auto-sync whenever tasks or history change
  useEffect(() => {
    if (!user) return;
    const syncTimer = setTimeout(async () => {
      setIsSyncing(true);
      await CloudService.saveUserData(user.id, tasks, history);
      setIsSyncing(false);
    }, 2000); // Debounced sync

    return () => clearTimeout(syncTimer);
  }, [tasks, history, user]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    // Simulate Login
    setTimeout(() => {
      const newUser = { id: 'user_' + Math.random().toString(36).substr(2, 5), email: authEmail, name: authEmail.split('@')[0] };
      setUser(newUser);
      localStorage.setItem('pte_session_user', JSON.stringify(newUser));
      setIsAuthLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem('pte_session_user');
    setUser(null);
    setTasks(PTE_TASKS);
  };

  const fetchAdvice = useCallback(async () => {
    const completed = tasks.filter(t => t.currentCount >= t.targetCount).length;
    const advice = await getStudyAdvice(completed, tasks.length);
    setAiTip(advice);
  }, [tasks]);

  const updateTask = (id: string, delta: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextCount = Math.min(t.targetCount, Math.max(0, t.currentCount + delta));
        return { ...t, currentCount: nextCount };
      }
      return t;
    }));
  };

  const totalPoints = tasks.reduce((sum, t) => sum + t.currentCount, 0);
  const targetPoints = tasks.reduce((sum, t) => sum + t.targetCount, 0);
  const progressPercent = Math.round((totalPoints / targetPoints) * 100);

  // --- Auth View ---
  if (!user && !isAuthLoading) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-indigo-700 flex flex-col items-center justify-center p-8 text-white text-center">
        <div className="bg-white/10 p-6 rounded-[40px] backdrop-blur-xl border border-white/20 mb-8 shadow-2xl">
          <BookOpen size={80} className="text-white mx-auto mb-4" />
          <h1 className="text-3xl font-black tracking-tight">PTE MASTER</h1>
          <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-2">Study Smart, Score High</p>
        </div>

        <form onSubmit={handleLogin} className="w-full space-y-4 max-w-xs">
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-white/50 w-5 h-5" />
            <input 
              type="email" 
              required
              placeholder="Study Email" 
              value={authEmail}
              onChange={e => setAuthEmail(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/40 focus:ring-2 focus:ring-white/30 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-4 text-white/50 w-5 h-5" />
            <input 
              type="password" 
              placeholder="Passphrase" 
              className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/40 focus:ring-2 focus:ring-white/30 outline-none transition-all"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-white text-indigo-700 font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-widest text-sm"
          >
            Enter Dashboard
          </button>
        </form>
        
        <p className="mt-8 text-[11px] text-indigo-200 font-bold uppercase tracking-widest">Global Student Network v2.4</p>
      </div>
    );
  }

  if (isAuthLoading) {
    return <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>;
  }

  // --- Dashboard View ---
  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col pb-28 shadow-2xl overflow-hidden relative">
      {/* Header */}
      <header className="bg-indigo-700 text-white p-6 rounded-b-[40px] shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl border border-white/10">
              <User size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase">Hi, {user?.name}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isSyncing ? <RefreshCw size={10} className="animate-spin text-indigo-200" /> : <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />}
                <span className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest">
                  {isSyncing ? 'Syncing Cloud...' : 'Secured & Synced'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-white/10 p-2.5 rounded-2xl hover:bg-white/20 transition-colors">
            <LogOut size={18} />
          </button>
        </div>

        <div className="mt-8 flex items-center gap-4 bg-white/10 p-4 rounded-3xl backdrop-blur-xl border border-white/5">
          <div className="bg-orange-500 p-2.5 rounded-2xl shadow-lg">
            <Flame className="text-white w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Daily Mastery</span>
              <span className="text-sm font-black text-white">{progressPercent}%</span>
            </div>
            <ProgressBar progress={progressPercent} color="bg-white" className="h-2" />
          </div>
        </div>
      </header>

      {/* AI Motivation Widget */}
      <div className="mx-6 -mt-5 bg-white p-5 rounded-[32px] shadow-xl border border-indigo-50 flex gap-4">
        <div className="bg-indigo-50 p-3 rounded-2xl h-fit">
          <Zap className="text-indigo-600 w-5 h-5 fill-indigo-600" />
        </div>
        <div className="flex-1">
          <h5 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1.5">Coach Intelligence</h5>
          <p className="text-[13px] text-gray-700 leading-relaxed font-semibold">
            {aiTip}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'daily' && (
          <div className="space-y-10 pb-10">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-800 tracking-tight">Mission Log</h2>
              <div className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[11px] font-black uppercase">
                {tasks.filter(t => t.currentCount >= t.targetCount).length}/{tasks.length} Modules
              </div>
            </div>

            {(['Speaking', 'Writing', 'Reading', 'Listening'] as PTESection[]).map(section => (
              <section key={section} className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${section === 'Speaking' ? 'bg-blue-500' : section === 'Writing' ? 'bg-purple-500' : section === 'Reading' ? 'bg-orange-500' : 'bg-pink-500'}`}></div> 
                  {section}
                </h3>
                <div className="grid gap-4">
                  {tasks.filter(t => t.section === section).map(task => (
                    <TaskCard key={task.id} task={task} onUpdate={updateTask} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Placeholder for Stats and Reminders - Similar to previous implementation */}
        {activeTab === 'stats' && <div className="p-8 text-center opacity-40 font-black uppercase tracking-widest">Analytics Synced to {user?.email}</div>}
        {activeTab === 'reminders' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Alert Center</h2>
            {reminders.map(rem => (
              <div key={rem.id} className="p-5 rounded-[32px] border bg-white border-indigo-100 flex items-center gap-5">
                <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600"><Clock size={24} /></div>
                <div className="flex-1"><p className="font-black text-sm text-gray-800">{rem.label}</p><p className="text-[11px] font-black text-indigo-400">{rem.time}</p></div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 px-10 py-6 flex justify-between items-center z-50 rounded-t-[48px] shadow-[0_-20px_40px_rgba(0,0,0,0.05)] max-w-md mx-auto">
        <button onClick={() => setActiveTab('daily')} className={`flex flex-col items-center gap-2 ${activeTab === 'daily' ? 'text-indigo-600' : 'text-gray-300'}`}>
          <div className={`p-3 rounded-2xl ${activeTab === 'daily' ? 'bg-indigo-100' : ''}`}><CheckCircle size={24} strokeWidth={3} /></div>
          <span className="text-[9px] font-black uppercase">Log</span>
        </button>
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-2 ${activeTab === 'stats' ? 'text-indigo-600' : 'text-gray-300'}`}>
          <div className={`p-3 rounded-2xl ${activeTab === 'stats' ? 'bg-indigo-100' : ''}`}><BarChart3 size={24} strokeWidth={3} /></div>
          <span className="text-[9px] font-black uppercase">Growth</span>
        </button>
        <button onClick={() => setActiveTab('reminders')} className={`flex flex-col items-center gap-2 ${activeTab === 'reminders' ? 'text-indigo-600' : 'text-gray-300'}`}>
          <div className={`p-3 rounded-2xl ${activeTab === 'reminders' ? 'bg-indigo-100' : ''}`}><Bell size={24} strokeWidth={3} /></div>
          <span className="text-[9px] font-black uppercase">Alerts</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
