
import { PTETask, DayProgress } from '../types';

// This is a Mock Cloud Service. 
// To make it "Real", you would connect this to Supabase or Firebase.
export const CloudService = {
  saveUserData: async (userId: string, tasks: PTETask[], history: DayProgress[]) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    const data = { tasks, history, lastSync: new Date().toISOString() };
    localStorage.setItem(`pte_cloud_${userId}`, JSON.stringify(data));
    console.log("Data synced to cloud for user:", userId);
  },

  loadUserData: async (userId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const saved = localStorage.getItem(`pte_cloud_${userId}`);
    return saved ? JSON.parse(saved) : null;
  }
};
