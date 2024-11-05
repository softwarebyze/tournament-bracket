import { useState } from 'react';
import { Trophy, Plus, ArrowLeft } from 'lucide-react';
import { ParticipantList } from './ParticipantList';
import { Bracket } from './Bracket';
import { ProModal } from './ProModal';
import { useUserStore } from '../store/userStore';
import { Link } from 'react-router-dom';

export function TournamentApp() {
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const { user, addTournament } = useUserStore();

  const handleCreateTournament = () => {
    const newTournament = {
      id: crypto.randomUUID(),
      name: `Tournament ${user.tournaments.length + 1}`,
      createdAt: new Date(),
      participants: [],
      matches: [],
    };
    
    const success = addTournament(newTournament);
    
    if (!success) {
      setIsProModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-900">Tournament Manager</h1>
              </div>
            </div>
            <button
              onClick={handleCreateTournament}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Tournament
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <ParticipantList />
          <Bracket />
        </div>
      </main>

      <ProModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} />
    </div>
  );
}