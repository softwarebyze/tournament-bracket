import React, { useState } from 'react';
import { Users, UserPlus, X, PlayCircle, GripVertical } from 'lucide-react';
import { useBracketStore } from '../store/bracketStore';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableParticipantProps {
  id: string;
  name: string;
  seed: number;
  onRemove: () => void;
}

function SortableParticipant({ id, name, seed, onRemove }: SortableParticipantProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
    >
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="cursor-grab hover:text-indigo-600">
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full text-sm">
          {seed}
        </span>
        <span>{name}</span>
      </div>
      <button
        onClick={onRemove}
        className="text-gray-400 hover:text-red-500 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ParticipantList() {
  const [newName, setNewName] = useState('');
  const { participants, addParticipant, removeParticipant, initializeBracket, reorderParticipants } = useBracketStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      addParticipant(newName.trim());
      setNewName('');
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = participants.findIndex((p) => p.id === active.id);
      const newIndex = participants.findIndex((p) => p.id === over.id);
      
      const newParticipants = [...participants];
      const [removed] = newParticipants.splice(oldIndex, 1);
      newParticipants.splice(newIndex, 0, removed);
      
      reorderParticipants(newParticipants);
    }
  };

  const canStartTournament = participants.length >= 2;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-semibold">Participants</h2>
        </div>
        <button
          onClick={() => initializeBracket()}
          disabled={!canStartTournament}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            canStartTournament
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          <PlayCircle className="w-4 h-4" />
          Start Tournament
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Enter participant name"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add
        </button>
      </form>

      {participants.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Add participants to start the tournament
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={participants}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {participants.map((participant) => (
                <SortableParticipant
                  key={participant.id}
                  id={participant.id}
                  name={participant.name}
                  seed={participant.seed}
                  onRemove={() => removeParticipant(participant.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {!canStartTournament && participants.length > 0 && (
        <p className="mt-4 text-sm text-gray-500 text-center">
          Add at least {2 - participants.length} more participant{2 - participants.length > 1 ? 's' : ''} to start the tournament
        </p>
      )}
    </div>
  );
}