import React from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Pencil } from 'lucide-react-native';

interface ActivityCardProps {
    title: string;
    visibleOptions: string[]; // Options to display on the card
    selectedValues: any; // Currently logged values (single or array)
    onToggle: (value: any) => void; // Function to log/unlog a value
    onEdit: () => void; // Function to open the filter modal
    color?: string;
    type: 'single' | 'multi' | 'boolean';
}

export function ActivityCard({
    title,
    visibleOptions,
    selectedValues,
    onToggle,
    onEdit,
    color = 'white',
    type
}: ActivityCardProps) {

    const isSelected = (optionValue: string) => {
        if (Array.isArray(selectedValues)) {
            return selectedValues.includes(optionValue);
        }
        return selectedValues === optionValue;
    };

    const handlePress = (optionValue: string) => {
        console.log(`[ActivityCard] Pressed: ${optionValue}, Type: ${type}`);
        console.log(`[ActivityCard] Current Selected:`, selectedValues);

        if (type === 'multi') {
            const current = (selectedValues as any[]) || [];
            if (current.includes(optionValue)) {
                const newValue = current.filter(v => v !== optionValue);
                console.log(`[ActivityCard] New Value (Multi - Remove):`, newValue);
                onToggle(newValue);
            } else {
                const newValue = [...current, optionValue];
                console.log(`[ActivityCard] New Value (Multi - Add):`, newValue);
                onToggle(newValue);
            }
        } else {
            // Single select (toggle off if same, else select new)
            const newValue = selectedValues === optionValue ? undefined : optionValue;
            console.log(`[ActivityCard] New Value (Single):`, newValue);
            onToggle(newValue);
        }
    };

    return (
        <View
            className={`p-4 rounded-2xl shadow-sm mb-4 flex-row justify-between items-start`}
            style={{ backgroundColor: color }}
        >
            <View className="flex-1 mr-4">
                <Text className="text-base font-bold text-gray-800 mb-2">{title}</Text>

                <View className="flex-row flex-wrap gap-2">
                    {visibleOptions.length > 0 ? (
                        visibleOptions.map((option) => {
                            const active = isSelected(option);
                            return (
                                <Pressable
                                    key={option}
                                    onPress={() => handlePress(option)}
                                    className={`px-4 py-2 rounded-full border ${active
                                        ? 'bg-rose-500 border-rose-500'
                                        : 'bg-white border-gray-200'
                                        }`}
                                >
                                    <Text className={`font-medium ${active ? 'text-white' : 'text-gray-600'
                                        }`}>
                                        {option}
                                    </Text>
                                </Pressable>
                            );
                        })
                    ) : (
                        <Text className="text-gray-400 text-sm italic">
                            No options visible. Tap edit to add.
                        </Text>
                    )}
                </View>
            </View>

            <TouchableOpacity
                onPress={onEdit}
                className="p-2 bg-gray-100 rounded-full mt-1"
            >
                <Pencil size={16} color="#4b5563" />
            </TouchableOpacity>
        </View>
    );
}
