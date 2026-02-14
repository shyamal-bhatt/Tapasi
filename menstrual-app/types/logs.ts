export type BleedingFlow = 'Heavy' | 'Medium' | 'Light' | 'Spotting' | 'Clots';
export type BleedingColor = 'Bright Red' | 'Light Pink' | 'Dark Red/Purple' | 'Brown Muddy';
export type Mood = 'Happy' | 'Neutral' | 'Sensitive' | 'Irritable' | 'Sad' | 'Low Self-Esteem' | 'Procrastinating';
export type Craving = 'Sugar' | 'Snacking' | 'Sour';
export type WorkLoad = 'Easy' | 'Moderate' | 'High' | 'Overwhelming' | 'Brain Fog';
export type Symptom = 'Cramps' | 'Backache' | 'Bloating' | 'Nausea' | 'Fatigue' | 'Facial Hair' | 'Acne';
export type SleepQuality = 'Good' | 'Fair' | 'Poor' | 'Disturbed';
export type ExerciseType = 'Walking' | 'Light Workout';

export interface DailyLog {
    date: string; // ISO date string YYYY-MM-DD
    bleeding?: {
        flow?: BleedingFlow;
        color?: BleedingColor;
    };
    moods?: Mood[];
    cravings?: Craving[];
    workLoad?: WorkLoad;
    symptoms?: Symptom[];
    birthControl?: boolean;
    smoke?: boolean;
    alcohol?: boolean;
    sleep?: {
        hours?: number;
        quality?: SleepQuality;
    };
    weight?: number; // kg
    exercise?: {
        types?: ExerciseType[];
        stepCount?: number;
    };
}
