export interface Participant {
  id: string;
  name: string;
  seed?: number;
}

export interface Match {
  id: string;
  round: number;
  participant1?: Participant;
  participant2?: Participant;
  winner?: Participant;
}

export interface Tournament {
  id: string;
  name: string;
  createdAt: Date;
  participants: Participant[];
  matches: Match[];
}

export interface User {
  isPro: boolean;
  tournaments: Tournament[];
}