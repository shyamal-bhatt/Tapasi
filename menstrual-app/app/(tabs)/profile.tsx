import React from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, ChevronRight, LogOut, Trash2 } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
    const { session, logout } = useAuthStore();
    const user = session?.user;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView className="flex-1">
                <View className="p-6 items-center bg-white pb-8 rounded-b-3xl shadow-sm">
                    <View className="w-24 h-24 bg-rose-100 rounded-full items-center justify-center mb-4">
                        {user?.user_metadata?.avatar_url ? (
                            <Image
                                source={{ uri: user.user_metadata.avatar_url }}
                                className="w-24 h-24 rounded-full"
                            />
                        ) : (
                            <Text className="text-4xl">👤</Text>
                        )}
                    </View>
                    <Text className="text-2xl font-bold text-gray-900">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest User'}</Text>
                    <Text className="text-gray-500">{user?.email || 'guest@example.com'}</Text>
                </View>

                <View className="p-6 gap-6">
                    <View>
                        <Text className="text-sm font-bold text-gray-400 uppercase mb-3 ml-2">My Details</Text>
                        <View className="bg-white rounded-2xl overflow-hidden">
                            <DetailItem label="Cycle Length" value="28 Days" />
                            <DetailItem label="Period Length" value="5 Days" />
                            <DetailItem label="Last Period" value="Dec 1, 2025" isLast />
                        </View>
                    </View>

                    <View>
                        <Text className="text-sm font-bold text-gray-400 uppercase mb-3 ml-2">Settings</Text>
                        <View className="bg-white rounded-2xl overflow-hidden">
                            <SettingItem icon={Settings} label="General Settings" />
                            <SettingItem icon={LogOut} label="Sign Out" onPress={logout} />
                            <SettingItem icon={Trash2} label="Delete Account" isDestructive isLast />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function DetailItem({ label, value, isLast }: { label: string, value: string, isLast?: boolean }) {
    return (
        <View className={`flex-row justify-between p-4 ${!isLast ? 'border-b border-gray-100' : ''}`}>
            <Text className="text-gray-600">{label}</Text>
            <Text className="font-semibold text-gray-900">{value}</Text>
        </View>
    );
}

function SettingItem({ icon: Icon, label, isDestructive, isLast, onPress }: any) {
    return (
        <Pressable
            onPress={onPress}
            className={`flex-row items-center p-4 active:bg-gray-50 ${!isLast ? 'border-b border-gray-100' : ''}`}
        >
            <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isDestructive ? 'bg-red-50' : 'bg-gray-100'}`}>
                <Icon size={16} color={isDestructive ? '#EF4444' : '#374151'} />
            </View>
            <Text className={`flex-1 font-medium ${isDestructive ? 'text-red-500' : 'text-gray-900'}`}>
                {label}
            </Text>
            <ChevronRight size={20} color="#9CA3AF" />
        </Pressable>
    );
}
