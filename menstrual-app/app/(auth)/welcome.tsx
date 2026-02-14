import { View, Text, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
    const router = useRouter();

    const handleLogin = () => {
        router.push('/(auth)/login');
    };

    return (
        <SafeAreaView className="flex-1 bg-white justify-between p-6">
            <View className="items-center mt-20">
                <View className="w-40 h-40 bg-rose-100 rounded-full items-center justify-center mb-8">
                    <Text className="text-6xl">🌸</Text>
                </View>
                <Text className="text-4xl font-bold text-gray-900 text-center mb-4">
                    Welcome to FlowTrack
                </Text>
                <Text className="text-lg text-gray-500 text-center px-4">
                    Track your cycle, understand your body, and live in sync with your rhythm.
                </Text>
            </View>

            <View className="w-full gap-4 mb-8">
                {/* Common Options */}
                <Pressable
                    onPress={handleLogin}
                    className="w-full bg-rose-500 p-4 rounded-xl items-center active:bg-rose-600"
                >
                    <Text className="text-white font-bold text-lg">Sign In / Sign Up</Text>
                </Pressable>

                <Pressable
                    className="w-full bg-white border border-gray-200 p-4 rounded-xl items-center flex-row justify-center gap-3 active:bg-gray-50"
                >
                    <Text className="text-2xl">G</Text>
                    <Text className="text-gray-700 font-semibold text-lg">Continue with Google</Text>
                </Pressable>

                {/* iOS Specific Option */}
                {Platform.OS === 'ios' && (
                    <Pressable
                        className="w-full bg-black p-4 rounded-xl items-center flex-row justify-center gap-3 active:bg-gray-800"
                    >
                        <Text className="text-white text-2xl"></Text>
                        <Text className="text-white font-semibold text-lg">Continue with Apple</Text>
                    </Pressable>
                )}
            </View>
        </SafeAreaView>
    );
}
