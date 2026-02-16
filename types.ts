
export type PTESection = 'Speaking' | 'Writing' | 'Reading' | 'Listening';

export interface PTETask {
  id: string;
  section: PTESection;
  name: string;
  description: string;
  currentCount: number; // Changed from completed: boolean
  targetCount: number;
}

export interface DayProgress {
  date: string; // ISO string YYYY-MM-DD
  completedTasks: string[]; // IDs of tasks that reached targetCount
  totalTasks: number;
}

export interface UserStats {
  history: DayProgress[];
}

export interface Reminder {
  id: string;
  time: string; // HH:mm
  label: string;
  active: boolean;
}
