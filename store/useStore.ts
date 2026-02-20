import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  name: string;
  gender: 'male' | 'female';
  age: number;
  height: number;
  weight: number;
  targetWeight: number;
  goal: 'lose' | 'gain' | 'maintain';
  experience: 'beginner' | 'intermediate' | 'advanced';
  workoutDays: number[]; // 0=Sun, 1=Mon, ...
}

export interface WorkoutLog {
  date: string; // YYYY-MM-DD
  completed: boolean;
  exercises: number;
  duration: number; // minutes
  calories: number;
}

interface AppState {
  // Onboarding
  onboarded: boolean;
  setOnboarded: (val: boolean) => void;

  // Profile
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;

  // Streak (Duolingo-style)
  streak: number;
  bestStreak: number;
  lastWorkoutDate: string | null; // YYYY-MM-DD
  todayCompleted: boolean;

  // Workout logs
  workoutLogs: WorkoutLog[];
  addWorkoutLog: (log: WorkoutLog) => void;

  // Actions
  completeToday: () => void;
  checkStreak: () => void;

  // Persistence
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

const STORAGE_KEY = 'zenfit_state';

const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getYesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const useStore = create<AppState>((set, get) => ({
  onboarded: false,
  setOnboarded: (val) => {
    set({ onboarded: val });
    get().saveToStorage();
  },

  profile: null,
  setProfile: (profile) => {
    set({ profile });
    get().saveToStorage();
  },

  streak: 0,
  bestStreak: 0,
  lastWorkoutDate: null,
  todayCompleted: false,
  workoutLogs: [],

  addWorkoutLog: (log) => {
    set((state) => ({
      workoutLogs: [...state.workoutLogs, log],
    }));
    get().saveToStorage();
  },

  completeToday: () => {
    const today = getToday();
    const state = get();

    if (state.lastWorkoutDate === today) return; // Already done

    const yesterday = getYesterday();
    const newStreak = state.lastWorkoutDate === yesterday ? state.streak + 1 : 1;
    const newBest = Math.max(newStreak, state.bestStreak);

    set({
      streak: newStreak,
      bestStreak: newBest,
      lastWorkoutDate: today,
      todayCompleted: true,
    });
    get().saveToStorage();
  },

  checkStreak: () => {
    const today = getToday();
    const yesterday = getYesterday();
    const state = get();

    const todayDone = state.lastWorkoutDate === today;
    const streakAlive = state.lastWorkoutDate === today || state.lastWorkoutDate === yesterday;

    set({
      todayCompleted: todayDone,
      streak: streakAlive ? state.streak : 0,
    });
  },

  loadFromStorage: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        set({
          onboarded: parsed.onboarded ?? false,
          profile: parsed.profile ?? null,
          streak: parsed.streak ?? 0,
          bestStreak: parsed.bestStreak ?? 0,
          lastWorkoutDate: parsed.lastWorkoutDate ?? null,
          workoutLogs: parsed.workoutLogs ?? [],
        });
        get().checkStreak();
      }
    } catch (e) {
      console.error('Failed to load state:', e);
    }
  },

  saveToStorage: async () => {
    try {
      const state = get();
      const data = JSON.stringify({
        onboarded: state.onboarded,
        profile: state.profile,
        streak: state.streak,
        bestStreak: state.bestStreak,
        lastWorkoutDate: state.lastWorkoutDate,
        workoutLogs: state.workoutLogs,
      });
      await AsyncStorage.setItem(STORAGE_KEY, data);
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  },
}));
