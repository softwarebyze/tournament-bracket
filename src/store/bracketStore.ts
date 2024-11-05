import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface Participant {
  id: string;
  name: string;
  seed: number;
}

export interface Match {
  id: string;
  round: number;
  participant1?: Participant;
  participant2?: Participant;
  winner?: Participant;
  position: number;
}

interface BracketStore {
  participants: Participant[];
  matches: Match[];
  isStarted: boolean;
  addParticipant: (name: string) => void;
  removeParticipant: (id: string) => void;
  initializeBracket: () => void;
  updateMatch: (matchId: string, winner: Participant) => void;
  resetTournament: () => void;
  reorderParticipants: (participants: Participant[]) => void;
  exportBracket: (format: 'pdf' | 'json') => Promise<void>;
  bracketTemplates: BracketTemplate[];
  applyTemplate: (templateId: string) => void;
}

interface BracketTemplate {
  id: string;
  name: string;
  description: string;
  structure: 'single' | 'double' | 'round-robin';
  minParticipants?: number;
  maxParticipants?: number;
  priceId?: string;
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export const useBracketStore = create<BracketStore>()(
  persist(
    (set, get) => ({
      participants: [],
      matches: [],
      isStarted: false,
      
      addParticipant: (name) => set((state) => ({
        participants: [...state.participants, {
          id: crypto.randomUUID(),
          name,
          seed: state.participants.length + 1
        }]
      })),
      
      removeParticipant: (id) => set((state) => {
        const updatedParticipants = state.participants
          .filter(p => p.id !== id)
          .map((p, index) => ({ ...p, seed: index + 1 }));
        return { participants: updatedParticipants };
      }),
      
      reorderParticipants: (participants) => set({
        participants: participants.map((p, index) => ({ ...p, seed: index + 1 }))
      }),
      
      initializeBracket: () => set((state) => {
        const shuffledParticipants = shuffleArray(state.participants);
        const matches: Match[] = [];
        const roundCount = Math.ceil(Math.log2(shuffledParticipants.length));
        
        for (let i = 0; i < shuffledParticipants.length; i += 2) {
          matches.push({
            id: crypto.randomUUID(),
            round: 1,
            participant1: shuffledParticipants[i],
            participant2: shuffledParticipants[i + 1],
            position: Math.floor(i / 2)
          });
        }
        
        for (let round = 2; round <= roundCount; round++) {
          const matchesInRound = Math.ceil(shuffledParticipants.length / Math.pow(2, round));
          for (let i = 0; i < matchesInRound; i++) {
            matches.push({
              id: crypto.randomUUID(),
              round,
              position: i
            });
          }
        }
        
        return { matches, isStarted: true };
      }),
      
      updateMatch: (matchId, winner) => set((state) => {
        const matches = [...state.matches];
        const matchIndex = matches.findIndex(m => m.id === matchId);
        
        if (matchIndex === -1) return state;
        
        matches[matchIndex] = { ...matches[matchIndex], winner };
        
        const currentMatch = matches[matchIndex];
        const nextRoundMatches = matches.filter(
          m => m.round === currentMatch.round + 1
        );
        
        const nextMatchPosition = Math.floor(currentMatch.position / 2);
        const nextMatch = nextRoundMatches.find(m => m.position === nextMatchPosition);
        
        if (nextMatch) {
          const isFirstParticipant = currentMatch.position % 2 === 0;
          if (isFirstParticipant) {
            nextMatch.participant1 = winner;
          } else {
            nextMatch.participant2 = winner;
          }
        }
        
        return { matches };
      }),
      
      resetTournament: () => set({
        participants: [],
        matches: [],
        isStarted: false
      }),

      exportBracket: async (format) => {
        if (format === 'pdf') {
          const element = document.querySelector('.bracket-container') as HTMLElement;
          if (!element) return;
          
          try {
            const canvas = await html2canvas(element, {
              scale: 2, // Higher quality
              logging: false,
              useCORS: true
            });
            
            const imgWidth = 297; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            const pdf = new jsPDF('l', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
            
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`tournament-bracket-${new Date().toISOString().split('T')[0]}.pdf`);
          } catch (error) {
            console.error('PDF export failed:', error);
            throw new Error('Failed to export PDF');
          }
        } else {
          const state = get();
          const data = {
            participants: state.participants,
            matches: state.matches,
          };
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'tournament-bracket.json';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      },

      bracketTemplates: [
        {
          id: 'single-elimination',
          name: 'Single Elimination',
          description: 'Classic tournament format',
          structure: 'single',
          minParticipants: 4,
          maxParticipants: 64,
          priceId: 'price_basic'
        },
        {
          id: 'double-elimination',
          name: 'Double Elimination',
          description: 'Two chances to advance',
          structure: 'double',
          minParticipants: 4,
          maxParticipants: 32,
          priceId: 'price_premium'
        },
        {
          id: 'round-robin',
          name: 'Round Robin',
          description: 'Everyone plays everyone',
          structure: 'round-robin',
          minParticipants: 3,
          maxParticipants: 16,
          priceId: 'price_premium'
        }
      ],

      applyTemplate: (templateId) => {
        // Template logic implementation
      }
    }),
    {
      name: 'tournament-bracket-storage',
    }
  )
);