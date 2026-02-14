import React from 'react';
import { withObservables } from '@nozbe/watermelondb/react';
import DailyLog from '../../db/model/DailyLog';
import { DailyLog as DailyLogType } from '../../types/logs';
import { DailyLogForm } from './DailyLogForm';

interface DailyLogContainerProps {
    model?: DailyLog;
    selectedDate: Date;
    onUpdateLog: (updates: Partial<DailyLogType>) => void;
}

// Data converter helper (copied/refactored from CalendarScreen)
const modelToLogType = (model: DailyLog): DailyLogType => ({
    date: model.date,
    bleeding: model.bleeding as any,
    moods: model.moods as any,
    symptoms: model.symptoms as any,
    cravings: model.cravings as any,
    workLoad: model.workLoad as any,
    sleep: model.sleep as any,
    weight: model.weight || undefined,
    exercise: model.exercise as any,
    birthControl: model.birthControl || false,
    smoke: model.smoke || false,
    alcohol: model.alcohol || false
});

const createEmptyLog = (dateStr: string): DailyLogType => ({
    date: dateStr,
    moods: [],
    cravings: [],
    symptoms: [],
    exercise: { types: [], stepCount: undefined },
    bleeding: { flow: undefined, color: undefined },
    sleep: { hours: 0, quality: 'Good' },
    weight: undefined,
    workLoad: undefined,
    birthControl: false,
    smoke: false,
    alcohol: false,
});

// Inner component receives the *observed* model (always up to date)
const ObservedForm = ({ model, selectedDate, onUpdateLog }: { model: DailyLog } & Omit<DailyLogContainerProps, 'model'>) => {
    const logData = modelToLogType(model);
    return <DailyLogForm log={logData} selectedDate={selectedDate} onUpdateLog={onUpdateLog} />;
};

// Wrap with WatermelonDB observer
const EnhancedObservedForm = withObservables(['model'], ({ model }) => ({
    model: model.observe() // observing the model triggers re-render on changes
}))(ObservedForm);

export const DailyLogContainer = ({ model, selectedDate, onUpdateLog }: DailyLogContainerProps) => {
    if (model) {
        return <EnhancedObservedForm model={model} selectedDate={selectedDate} onUpdateLog={onUpdateLog} />;
    }

    // No model yet (new entry state)
    const emptyLog = createEmptyLog(selectedDate.toISOString().split('T')[0]);
    return <DailyLogForm log={emptyLog} selectedDate={selectedDate} onUpdateLog={onUpdateLog} />;
};
