import React from 'react';
import { Trophy, RotateCcw } from 'lucide-react';
import { useBracketStore, Match as MatchType } from '../store/bracketStore';

function Match({ match }: { match: MatchType }) {
  const updateMatch = useBracketStore(state => state.updateMatch);

  const handleWinnerSelect = (participantId: string) => {
    const winner = match.participant1?.id === participantId
      ? match.participant1
      : match.participant2;
    if (winner && !match.winner) {
      updateMatch(match.id, winner);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 w-64">
      {[match.participant1, match.participant2].map((participant, idx) => (
        <div
          key={participant?.id || idx}
          className={`
            p-2 ${idx === 0 ? 'mb-2' : ''}
            ${!participant ? 'bg-gray-50 text-gray-400' : 'bg-gray-100'}
            ${match.winner?.id === participant?.id ? 'bg-green-100' : ''}
            ${participant && !match.winner ? 'cursor-pointer hover:bg-gray-200' : 'cursor-default'}
            rounded transition-colors
          `}
          onClick={() => participant && !match.winner && handleWinnerSelect(participant.id)}
        >
          {participant ? (
            <div className="flex items-center justify-between">
              <span>{participant.name}</span>
              {match.winner?.id === participant.id && (
                <Trophy className="w-4 h-4 text-green-600" />
              )}
            </div>
          ) : (
            'TBD'
          )}
        </div>
      ))}
    </div>
  );
}

export function Bracket() {
  const { matches, isStarted, resetTournament } = useBracketStore();
  
  if (!isStarted || matches.length === 0) {
    return null;
  }

  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b);
  const finalMatch = matches.find(m => m.round === Math.max(...rounds));
  const winner = finalMatch?.winner;

  return (
    <div className="space-y-6">
      {winner && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <Trophy className="w-12 h-12 text-green-600 mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-green-800 mb-1">
            {winner.name}
          </h2>
          <p className="text-green-600">Tournament Winner!</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Tournament Bracket</h2>
        <button
          onClick={resetTournament}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Tournament
        </button>
      </div>

      <div className="flex gap-8 overflow-x-auto pb-6">
        {rounds.map((round) => (
          <div key={round} className="flex flex-col gap-8">
            <div className="text-center font-semibold text-gray-600">
              {round === Math.max(...rounds) ? 'Final' : `Round ${round}`}
            </div>
            <div className="space-y-8">
              {matches
                .filter(m => m.round === round)
                .sort((a, b) => a.position - b.position)
                .map((match) => (
                  <Match key={match.id} match={match} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}