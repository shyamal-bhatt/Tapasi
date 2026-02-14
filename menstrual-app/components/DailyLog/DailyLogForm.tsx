import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { isAfter, startOfDay } from 'date-fns';
import { DailyLog } from '../../types/logs';
import { ActivityCard } from './ActivityCard';
import { EditOptionsModal } from './EditOptionsModal';

interface DailyLogFormProps {
    selectedDate: Date;
    log: DailyLog;
    onUpdateLog: (updates: Partial<DailyLog>) => void;
}

const MOOD_OPTIONS = [
    { label: 'Happy', value: 'Happy' },
    { label: 'Neutral', value: 'Neutral' },
    { label: 'Sensitive', value: 'Sensitive' },
    { label: 'Irritable', value: 'Irritable' },
    { label: 'Sad', value: 'Sad' },
    { label: 'Low Self-Esteem', value: 'Low Self-Esteem' },
    { label: 'Procrastinating', value: 'Procrastinating' },
];

const SYMPTOM_OPTIONS = [
    { label: 'Cramps', value: 'Cramps' },
    { label: 'Backache', value: 'Backache' },
    { label: 'Bloating', value: 'Bloating' },
    { label: 'Nausea', value: 'Nausea' },
    { label: 'Fatigue', value: 'Fatigue' },
    { label: 'Facial Hair', value: 'Facial Hair' },
    { label: 'Acne', value: 'Acne' },
];

const CRAVING_OPTIONS = [
    { label: 'Sugar', value: 'Sugar' },
    { label: 'Snacking', value: 'Snacking' },
    { label: 'Sour', value: 'Sour' },
];

const WORKLOAD_OPTIONS = [
    { label: 'Easy', value: 'Easy' },
    { label: 'Moderate', value: 'Moderate' },
    { label: 'High', value: 'High' },
    { label: 'Overwhelming', value: 'Overwhelming' },
    { label: 'Brain Fog', value: 'Brain Fog' },
];

const EXERCISE_OPTIONS = [
    { label: 'Walking', value: 'Walking' },
    { label: 'Light Workout', value: 'Light Workout' },
];

type VisibleStateKey = 'moods' | 'symptoms' | 'cravings' | 'workLoad' | 'exerciseTypes';

export function DailyLogForm({ selectedDate, log, onUpdateLog }: DailyLogFormProps) {
    const isFuture = isAfter(startOfDay(selectedDate), startOfDay(new Date()));

    // Local state for numeric inputs to allow smooth typing (decimals, clearing)
    const [sleepInput, setSleepInput] = useState(log.sleep?.hours?.toString() || '');
    const [weightInput, setWeightInput] = useState(log.weight?.toString() || '');

    // Sync local state when external log data changes (e.g. changing date)
    useEffect(() => {
        setSleepInput(log.sleep?.hours?.toString() || '');
        setWeightInput(log.weight?.toString() || '');
    }, [log.date, log.sleep?.hours, log.weight]);

    const [visibleOptions, setVisibleOptions] = useState<{
        moods: string[];
        symptoms: string[];
        cravings: string[];
        workLoad: string[];
        exerciseTypes: string[];
    }>({
        moods: ['Happy', 'Sad', 'Sensitive'],
        symptoms: ['Cramps', 'Bloating', 'Fatigue'],
        cravings: ['Sugar', 'Snacking'],
        workLoad: ['Moderate', 'High'],
        exerciseTypes: ['Walking', 'Light Workout'],
    });

    const [modalConfig, setModalConfig] = useState<{
        visible: boolean;
        title: string;
        options: any[];
        key: VisibleStateKey;
    }>({
        visible: false,
        title: '',
        options: [],
        key: 'moods',
    });

    const handleUpdateLog = (updates: Partial<DailyLog>) => {
        console.log(`[DailyLog] Updating log for ${log.date}:`, updates);
        onUpdateLog(updates);
    };

    const openFilterModal = (
        title: string,
        options: any[],
        key: VisibleStateKey
    ) => {
        setModalConfig({
            visible: true,
            title,
            options,
            key,
        });
    };

    const handleFilterUpdate = (newVisibleList: string[]) => {
        setVisibleOptions(prev => ({
            ...prev,
            [modalConfig.key]: newVisibleList
        }));
    };

    if (isFuture) {
        return (
            <View className="p-6 bg-gray-50 rounded-3xl items-center justify-center min-h-[200px]">
                <Text className="text-4xl mb-4">🔮</Text>
                <Text className="text-gray-500 text-center font-medium">
                    You cannot log activities for future dates.
                </Text>
            </View>
        );
    }

    return (
        <View className="pb-32">
            <Text className="text-xl font-bold text-gray-900 mb-6 px-2 mt-8">
                Daily Log
            </Text>

            {/* Bleeding Card */}
            <View className="bg-rose-100 p-4 rounded-2xl mb-6">
                <Text className="text-base font-bold text-rose-900 mb-3">Bleeding</Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                    {['Heavy', 'Medium', 'Light', 'Spotting', 'Clots'].map((flow) => (
                        <Pressable
                            key={flow}
                            onPress={() => handleUpdateLog({
                                bleeding: { ...log.bleeding, flow: log.bleeding?.flow === flow ? undefined : flow as any }
                            })}
                            className={`px-4 py-2 rounded-full border ${log.bleeding?.flow === flow
                                ? 'bg-rose-500 border-rose-500'
                                : 'bg-white/50 border-rose-200'
                                }`}
                        >
                            <Text className={`font-medium ${log.bleeding?.flow === flow ? 'text-white' : 'text-rose-900'
                                }`}>
                                {flow}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {log.bleeding?.flow && (
                    <View>
                        <Text className="text-sm font-semibold text-rose-800 mb-2">Color</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {['Bright Red', 'Light Pink', 'Dark Red/Purple', 'Brown Muddy'].map((color) => (
                                <Pressable
                                    key={color}
                                    onPress={() => handleUpdateLog({
                                        bleeding: { ...log.bleeding, color: color as any }
                                    })}
                                    className={`px-3 py-1.5 rounded-full border ${log.bleeding?.color === color
                                        ? 'bg-rose-500 border-rose-500'
                                        : 'bg-white/50 border-rose-200'
                                        }`}
                                >
                                    <Text className={`text-xs font-medium ${log.bleeding?.color === color ? 'text-white' : 'text-rose-900'
                                        }`}>
                                        {color}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                )}
            </View>

            {/* Activity Cards */}
            <ActivityCard
                title="Mood"
                type="multi"
                visibleOptions={visibleOptions.moods}
                selectedValues={log.moods}
                onToggle={(val) => handleUpdateLog({ moods: val })}
                onEdit={() => openFilterModal('Filter Moods', MOOD_OPTIONS, 'moods')}
            />

            <ActivityCard
                title="Symptoms"
                type="multi"
                visibleOptions={visibleOptions.symptoms}
                selectedValues={log.symptoms}
                onToggle={(val) => handleUpdateLog({ symptoms: val })}
                onEdit={() => openFilterModal('Filter Symptoms', SYMPTOM_OPTIONS, 'symptoms')}
            />

            <ActivityCard
                title="Cravings"
                type="multi"
                visibleOptions={visibleOptions.cravings}
                selectedValues={log.cravings}
                onToggle={(val) => handleUpdateLog({ cravings: val })}
                onEdit={() => openFilterModal('Filter Cravings', CRAVING_OPTIONS, 'cravings')}
            />

            <ActivityCard
                title="Work Load"
                type="single"
                visibleOptions={visibleOptions.workLoad}
                selectedValues={log.workLoad}
                onToggle={(val) => handleUpdateLog({ workLoad: val })}
                onEdit={() => openFilterModal('Filter Work Load', WORKLOAD_OPTIONS, 'workLoad')}
            />

            <ActivityCard
                title="Exercise"
                type="multi"
                visibleOptions={visibleOptions.exerciseTypes}
                selectedValues={log.exercise?.types}
                onToggle={(val) => handleUpdateLog({ exercise: { ...log.exercise, types: val } })}
                onEdit={() => openFilterModal('Filter Exercise', EXERCISE_OPTIONS, 'exerciseTypes')}
            />

            {/* Sleep Section (Controlled Input) */}
            <View className="bg-indigo-50 p-4 rounded-2xl mb-4">
                <Text className="text-base font-bold text-indigo-900 mb-3">Sleep</Text>
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-gray-700 font-medium">Hours Slept</Text>
                    <TextInput
                        className="bg-white px-4 py-2 rounded-xl text-indigo-900 font-bold border border-indigo-100 w-24 text-center"
                        keyboardType="numeric"
                        placeholder="0"
                        value={sleepInput}
                        onChangeText={setSleepInput}
                        onBlur={() => {
                            const hours = parseFloat(sleepInput);
                            if (sleepInput === '' || isNaN(hours)) {
                                onUpdateLog({ sleep: { ...log.sleep, hours: undefined } });
                            } else {
                                onUpdateLog({ sleep: { ...log.sleep, hours } });
                            }
                        }}
                    />
                </View>
                <View className="flex-row flex-wrap gap-2">
                    {(['Good', 'Fair', 'Poor'] as const).map((quality) => (
                        <Pressable
                            key={quality}
                            onPress={() => handleUpdateLog({
                                sleep: { ...log.sleep, quality: log.sleep?.quality === quality ? undefined : quality }
                            })}
                            className={`px-4 py-2 rounded-full border ${log.sleep?.quality === quality
                                ? 'bg-indigo-500 border-indigo-500'
                                : 'bg-white border-indigo-100'
                                }`}
                        >
                            <Text className={`font-medium ${log.sleep?.quality === quality ? 'text-white' : 'text-indigo-900'
                                }`}>
                                {quality}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* Weight Section (Controlled Input) */}
            <View className="bg-emerald-50 p-4 rounded-2xl mb-4 flex-row items-center justify-between">
                <Text className="text-base font-bold text-emerald-900">Weight (kg)</Text>
                <TextInput
                    className="bg-white px-4 py-2 rounded-xl text-emerald-900 font-bold border border-emerald-100 w-24 text-center"
                    keyboardType="numeric"
                    placeholder="0.0"
                    value={weightInput}
                    onChangeText={setWeightInput}
                    onBlur={() => {
                        const weight = parseFloat(weightInput);
                        if (weightInput === '' || isNaN(weight)) {
                            onUpdateLog({ weight: undefined });
                        } else {
                            onUpdateLog({ weight });
                        }
                    }}
                />
            </View>

            {/* Birth Control Section */}
            <View className="bg-fuchsia-50 p-4 rounded-2xl mb-4 flex-row items-center justify-between">
                <Text className="text-base font-bold text-fuchsia-900">Birth Control</Text>
                <Pressable
                    onPress={() => handleUpdateLog({ birthControl: !log.birthControl })}
                    className={`px-6 py-2 rounded-full border ${log.birthControl
                        ? 'bg-fuchsia-500 border-fuchsia-500'
                        : 'bg-white border-fuchsia-100'
                        }`}
                >
                    <Text className={`font-medium ${log.birthControl ? 'text-white' : 'text-fuchsia-900'
                        }`}>
                        {log.birthControl ? 'Pill Taken' : 'Not Taken'}
                    </Text>
                </Pressable>
            </View>

            {/* Habits Section */}
            <View className="bg-orange-50 p-4 rounded-2xl mb-4">
                <Text className="text-base font-bold text-orange-900 mb-3">Habits</Text>
                <View className="flex-row flex-wrap gap-2">
                    {[
                        { label: 'Smoke', key: 'smoke' },
                        { label: 'Alcohol', key: 'alcohol' }
                    ].map((habit) => {
                        const isActive = !!(log as any)[habit.key];
                        return (
                            <Pressable
                                key={habit.key}
                                onPress={() => handleUpdateLog({ [habit.key]: !isActive })}
                                className={`px-4 py-2 rounded-full border ${isActive
                                    ? 'bg-orange-500 border-orange-500'
                                    : 'bg-white border-orange-100'
                                    }`}
                            >
                                <Text className={`font-medium ${isActive ? 'text-white' : 'text-orange-900'
                                    }`}>
                                    {habit.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            <EditOptionsModal
                visible={modalConfig.visible}
                onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                title={modalConfig.title}
                options={modalConfig.options}
                selectedValues={visibleOptions[modalConfig.key]}
                onSelect={handleFilterUpdate}
                type="multi"
            />
        </View>
    );
}
