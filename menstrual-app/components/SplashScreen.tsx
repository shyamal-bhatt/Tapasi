import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withDelay,
    runOnJS
} from 'react-native-reanimated';

interface SplashScreenProps {
    onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        scale.value = withSequence(
            withSpring(1.2),
            withSpring(1)
        );
        opacity.value = withDelay(500, withSpring(1));

        // Simulate loading time
        const timer = setTimeout(() => {
            onFinish();
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <View className="flex-1 bg-rose-50 items-center justify-center">
            <Animated.View style={[logoStyle]} className="bg-rose-500 w-32 h-32 rounded-full items-center justify-center mb-6 shadow-lg">
                <Text className="text-6xl">🩸</Text>
            </Animated.View>

            <Animated.View style={[textStyle]}>
                <Text className="text-3xl font-bold text-rose-900 font-nunito">
                    FlowTrack
                </Text>
                <Text className="text-rose-700 text-center mt-2 font-nunito">
                    Understand your cycle
                </Text>
            </Animated.View>
        </View>
    );
}
