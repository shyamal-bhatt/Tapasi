
import React, { useState, useMemo } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { Calendar } from '../../components/Calendar';
import { DailyLogContainer } from '../../components/DailyLog/DailyLogContainer';
import { DailyLog as DailyLogType } from '../../types/logs';
import { router } from 'expo-router';

// WatermelonDB
import { withObservables } from '@nozbe/watermelondb/react';
import { database } from '../../db';
import DailyLog from '../../db/model/DailyLog';

interface CalendarScreenProps {
    logs: DailyLog[]; // Injected by withObservables
}

// Default empty log state for new entries
const createEmptyLog = (date: string): DailyLogType => ({
    date,
    moods: [],
    cravings: [],
    symptoms: [],
    exercise: { types: [], stepCount: undefined },
    bleeding: { flow: undefined, color: undefined },
    sleep: { hours: 0, quality: 'Good' }, // Default
    weight: undefined,
    workLoad: undefined,
    birthControl: false,
    smoke: false,
    alcohol: false,
});

function CalendarScreen({ logs }: CalendarScreenProps) {
    const today = useMemo(() => new Date(), []);
    const [selectedDate, setSelectedDate] = useState(today);
    const [currentDate, setCurrentDate] = useState(today);

    // Convert logs array to a Map for easier lookup by date string
    // using useMemo so we don't rebuild on every render unless logs change
    const logsMap = useMemo(() => {
        const map: Record<string, DailyLog> = {};
        logs.forEach(log => {
            map[log.date] = log;
        });
        return map;
    }, [logs]);

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const currentLogModel = logsMap[dateKey];

    // Derived data for Calendar markings
    const periodDates = useMemo(() => {
        return logs
            .filter(log => log.bleeding?.flow)
            .map(log => log.date);
    }, [logs]);

    const activityDates = useMemo(() => {
        return logs
            .filter(log => {
                const hasExercise = log.exercise?.types?.length || log.exercise?.stepCount;
                const hasSymptoms = log.symptoms?.length;
                const hasMoods = log.moods?.length;
                // Add more conditions as needed
                return hasExercise || hasSymptoms || hasMoods;
            })
            .map(log => log.date);
    }, [logs]);

    const handleUpdateLog = async (updates: Partial<DailyLogType>) => {
        console.log('[DB] Updating log with:', updates);
        if (currentLogModel) {
            // UPDATE existing log
            await currentLogModel.updateLog(updates);
            console.log('[DB] Updated existing log for', currentLogModel.date);
        } else {
            // CREATE new log
            await database.write(async () => {
                const newLog = await database.collections.get<DailyLog>('daily_logs').create(log => {
                    log.date = dateKey;

                    // Merge default empty log with updates
                    const fullData = { ...createEmptyLog(dateKey), ...updates };

                    if (fullData.bleeding) {
                        log.bleedingFlow = fullData.bleeding.flow ?? null;
                        log.bleedingColor = fullData.bleeding.color ?? null;
                    }
                    if (fullData.moods) log.moods = fullData.moods;
                    if (fullData.symptoms) log.symptoms = fullData.symptoms;
                    if (fullData.cravings) log.cravings = fullData.cravings;
                    if (fullData.exercise) log.exercise = fullData.exercise;

                    log.workLoad = fullData.workLoad ?? null;
                    if (fullData.sleep) {
                        log.sleepHours = fullData.sleep.hours ?? null;
                        log.sleepQuality = fullData.sleep.quality ?? null;
                    }
                    log.weight = fullData.weight ?? null;
                    log.birthControl = fullData.birthControl ?? false;
                    log.smoke = fullData.smoke ?? false;
                    log.alcohol = fullData.alcohol ?? false;
                });
                console.log('[DB] Created new log:', newLog);
            });
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Calendar
                    currentDate={currentDate}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    onMonthChange={setCurrentDate}
                    periodDates={periodDates}
                    activityDates={activityDates}
                />

                <DailyLogContainer
                    selectedDate={selectedDate}
                    model={currentLogModel}
                    onUpdateLog={handleUpdateLog}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

// Enhance with WatermelonDB Observables
const enhance = withObservables([], () => ({
    logs: database.collections.get<DailyLog>('daily_logs').query(),
}));

export default enhance(CalendarScreen);
