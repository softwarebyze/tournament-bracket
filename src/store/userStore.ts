import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Tournament } from '../types';

interface UserStore {
  user: User;
  setProStatus: (isPro: boolean) => void;
  addTournament: (tournament: Tournament) => void;
  removeTournament: (id: string) => void;
  checkAccess: () => boolean;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: {
        isPro: false,
        tournaments: [],
        lastPaymentDate: null,
      },
      setProStatus: (isPro) => set((state) => ({
        user: { 
          ...state.user, 
          isPro,
          lastPaymentDate: isPro ? new Date().toISOString() : null
        }
      })),
      addTournament: (tournament) => {
        const state = get();
        if (!state.checkAccess()) {
          throw new Error('Pro subscription required');
        }
        set((state) => ({
          user: {
            ...state.user,
            tournaments: [tournament, ...state.user.tournaments]
          }
        }));
      },
      removeTournament: (id) => set((state) => ({
        user: {
          ...state.user,
          tournaments: state.user.tournaments.filter(t => t.id !== id)
        }
      })),
      checkAccess: () => {
        const state = get();
        if (!state.user.isPro) return false;
        if (!state.user.lastPaymentDate) return false;
        
        // Check if subscription is still valid (30 days)
        const lastPayment = new Date(state.user.lastPaymentDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastPayment.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= 30;
      }
    }),
    {
      name: 'tournament-user-storage',
    }
  )
);