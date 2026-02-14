import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';

interface Option {
    label: string;
    value: string | number | boolean;
}

interface LogSectionProps {
    title: string;
    type: 'single' | 'multi' | 'input' | 'boolean';
    options?: Option[];
    value?: any;
    onChange: (value: any) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'numeric';
}

export function LogSection({
    title,
    type,
    options,
    value,
    onChange,
    placeholder,
    keyboardType = 'default'
}: LogSectionProps) {

    const handleSelect = (optionValue: any) => {
        if (type === 'single') {
            // Toggle off if already selected, otherwise select
            onChange(value === optionValue ? undefined : optionValue);
        } else if (type === 'multi') {
            const currentValues = (value as any[]) || [];
            if (currentValues.includes(optionValue)) {
                onChange(currentValues.filter(v => v !== optionValue));
            } else {
                onChange([...currentValues, optionValue]);
            }
        } else if (type === 'boolean') {
            onChange(optionValue);
        }
    };

    return (
        <View className="mb-6 bg-white p-4 rounded-2xl shadow-sm">
            <Text className="text-base font-bold text-gray-800 mb-3">{title}</Text>

            {type === 'input' ? (
                <TextInput
                    className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-gray-800"
                    placeholder={placeholder}
                    value={value?.toString()}
                    onChangeText={onChange}
                    keyboardType={keyboardType}
                />
            ) : (
                <View className="flex-row flex-wrap gap-2">
                    {options?.map((option) => {
                        const isSelected = type === 'multi'
                            ? (value as any[])?.includes(option.value)
                            : value === option.value;

                        return (
                            <Pressable
                                key={option.label}
                                onPress={() => handleSelect(option.value)}
                                className={`px-4 py-2 rounded-full border ${isSelected
                                        ? 'bg-rose-500 border-rose-500'
                                        : 'bg-white border-gray-200'
                                    }`}
                            >
                                <Text className={`font-medium ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                                    {option.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            )}
        </View>
    );
}
