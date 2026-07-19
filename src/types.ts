export interface Horse {
  id: string;
  name: string;
  breed: string;
  color: string;
}

export type RidingDiscipline =
  | 'Dressage'
  | 'Show Jumping'
  | 'Cross Country'
  | 'Trail Riding'
  | 'Western Pleasure'
  | 'Barrel Racing'
  | 'Endurance'
  | 'Other';

export interface TrainingSession {
  id: string;
  date: string; // ISO date string
  horseId: string;
  discipline: RidingDiscipline;
  durationMinutes: number;
  notes: string;
  photoDataUrl?: string;
  photoFileName?: string;
  performanceScore: number; // 1-10
}
