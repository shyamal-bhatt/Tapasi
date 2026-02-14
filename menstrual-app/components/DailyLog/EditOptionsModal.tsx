import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { X } from 'lucide-react-native';

interface Option {
    label: string;
    value: string | number | boolean;
}

interface EditOptionsModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    options: Option[];
    selectedValues: any; // Single value or array
    onSelect: (value: any) => void;
    type: 'single' | 'multi' | 'boolean';
}

export function EditOptionsModal({
    visible,
    onClose,
    title,
    options,
    selectedValues,
    onSelect,
    type
}: EditOptionsModalProps) {

    const handleSelect = (optionValue: any) => {
        if (type === 'single' || type === 'boolean') {
            // Toggle: If already selected, unselect (pass undefined). Otherwise select.
            const newValue = selectedValues === optionValue ? undefined : optionValue;
            onSelect(newValue);
            // Only close if we are selecting a value, not unselecting? 
            // Or maybe keep it open? User said "press it again to unselect".
            // Usually single select closes on selection.
            // If I unselect, I probably want to see it unselected.
            // Let's close on selection, stay open on unselection? 
            // Or just close on both?
            // Let's stick to closing on selection (change), but maybe unselecting implies "I changed my mind, I want nothing".
            // Actually, if I click "Happy" and it closes. I open it again, it's selected. I click "Happy" again -> it unselects. Should it close?
            // Probably yes, interaction is "I made my choice (which is nothing)".
            onClose();
        } else if (type === 'multi') {
            const current = (selectedValues as any[]) || [];
            if (current.includes(optionValue)) {
                onSelect(current.filter(v => v !== optionValue));
            } else {
                onSelect([...current, optionValue]);
            }
        }
    };

    const isSelected = (optionValue: any) => {
        if (type === 'multi') {
            return (selectedValues as any[])?.includes(optionValue);
        }
        return selectedValues === optionValue;
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-white rounded-t-3xl p-6 h-[50%]">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-bold text-gray-900">{title}</Text>
                        <TouchableOpacity onPress={onClose} className="p-2 bg-gray-100 rounded-full">
                            <X size={20} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View className="flex-row flex-wrap gap-3 pb-10">
                            {options.map((option) => (
                                <Pressable
                                    key={option.label}
                                    onPress={() => handleSelect(option.value)}
                                    className={`px-5 py-3 rounded-full border ${isSelected(option.value)
                                        ? 'bg-rose-500 border-rose-500'
                                        : 'bg-white border-gray-200'
                                        }`}
                                >
                                    <Text className={`font-medium text-base ${isSelected(option.value) ? 'text-white' : 'text-gray-700'
                                        }`}>
                                        {option.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
