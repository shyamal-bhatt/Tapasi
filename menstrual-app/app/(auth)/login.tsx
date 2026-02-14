import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Image, Alert } from 'react-native';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

// Configure Google Sign-In
// REPLACE WITH YOUR ACTUAL CLIENT IDs
GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

export default function LoginScreen() {
    const { session } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginMode, setIsLoginMode] = useState(true);

    // Redirect if already authenticated
    useEffect(() => {
        if (session) {
            router.replace('/(tabs)');
        }
    }, [session]);

    const handleGoogleSignIn = async () => {
        try {
            // Step 1: Get Google credentials via native sign-in
            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();

            if (!response.data?.idToken) {
                Alert.alert('Error', 'Failed to get Google credentials');
                return;
            }

            console.log('[Google Sign-In] Success, exchanging token with Supabase...');

            // Step 2: Exchange Google token for Supabase session
            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.data.idToken,
            });

            if (error) {
                console.error('[Supabase Token Exchange] Error:', error);
                Alert.alert('Authentication Error', error.message);
                return;
            }

            console.log('[Supabase Token Exchange] Success:', data.user?.email);
            // Session will be set by the auth listener in _layout.tsx
            // Navigation will also be handled by _layout.tsx

        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // user cancelled the login flow
                console.log('Login cancelled');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // operation (e.g. sign in) is in progress already
                console.log('Login in progress');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                // play services not available or outdated
                Alert.alert('Error', 'Play services not available');
            } else {
                // some other error happened
                console.error(error);
                Alert.alert('Error', 'Google Sign-In failed');
            }
        }
    };

    const handleManualSubmit = () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        // TODO: Implement email/password authentication with Supabase
        console.log(`[Manual ${isLoginMode ? 'Login' : 'Signup'}] Email: ${email}, Password: ${password}`);
        Alert.alert('Not Implemented', 'Email/password authentication coming soon. Please use Google Sign-In.');
    };

    return (
        <View className="flex-1 bg-white p-6 justify-center">
            <View className="items-center mb-10">
                <Text className="text-4xl mb-2">🌸</Text>
                <Text className="text-3xl font-bold text-rose-500">Tapasi</Text>
                <Text className="text-gray-500 font-medium mt-2">Welcome back!</Text>
            </View>

            {/* Google Sign In */}
            <View className="items-center mb-8">
                <GoogleSigninButton
                    size={GoogleSigninButton.Size.Wide}
                    color={GoogleSigninButton.Color.Dark}
                    onPress={handleGoogleSignIn}
                />
            </View>

            <View className="flex-row items-center mb-8">
                <View className="flex-1 h-px bg-gray-200" />
                <Text className="mx-4 text-gray-400">or</Text>
                <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* Manual Form */}
            <View className="space-y-4">
                <View>
                    <Text className="text-gray-700 font-medium mb-2">Email</Text>
                    <TextInput
                        className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900"
                        placeholder="hello@example.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View>
                    <Text className="text-gray-700 font-medium mb-2">Password</Text>
                    <TextInput
                        className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900"
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <Pressable
                    onPress={handleManualSubmit}
                    className="w-full bg-rose-500 p-4 rounded-xl items-center mt-4"
                >
                    <Text className="text-white font-bold text-lg">
                        {isLoginMode ? 'Log In' : 'Create Account'}
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() => setIsLoginMode(!isLoginMode)}
                    className="items-center mt-4"
                >
                    <Text className="text-rose-500 font-medium">
                        {isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}
