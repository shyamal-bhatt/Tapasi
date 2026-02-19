// app/_layout.tsx
if (__DEV__) {
  require('../ReactotronConfig');
}

// Import global CSS for NativeWind
import '../global.css';

import { View, AppState, AppStateStatus } from 'react-native';
import { Stack, useRouter, Slot, useSegments, router, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { SplashScreen } from '../components/SplashScreen';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { triggerSync } from '../db/sync';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const { session, _hasHydrated, setSession } = useAuthStore();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  // Supabase auth state listener
  useEffect(() => {
    console.log('[App Launch] Setting up Supabase auth listener');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Supabase Auth Event]', event, { user: session?.user?.email });

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(session);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
        } else if (event === 'INITIAL_SESSION') {
          setSession(session);
        }
      }
    );

    // Trigger initial sync after auth is established
    if (session) {
      console.log('[Sync] Auth listener detected session, triggering initial sync');
      triggerSync();
    }

    return () => {
      console.log('[App Cleanup] Unsubscribing from Supabase auth listener');
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Wait for the root navigation to be ready
    if (!rootNavigationState?.key) return;

    // Log startup status
    if (!_hasHydrated) {
      console.log('[App Launch] Waiting for hydration...');
      return;
    }

    console.log('[App Launch] State hydrated. Checking auth status...', {
      hasSession: !!session,
      user: session?.user?.email,
      currentSegment: segments[0]
    });

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      console.log('[Navigation] Redirecting to login (No session)');
      setTimeout(() => router.replace('/(auth)/login'), 0);
    } else if (session && inAuthGroup) {
      console.log('[Navigation] Redirecting to tabs (Session exists)');
      setTimeout(() => router.replace('/(tabs)'), 0);
    } else {
      // console.log('[Navigation] No redirect needed');
    }
  }, [session, segments, isReady, _hasHydrated]);

  // Sync on app foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && session) {
        console.log('[Sync] App came to foreground, triggering sync');
        triggerSync();
      }
    });
    return () => subscription.remove();
  }, [session]);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>

      {(!isReady || !_hasHydrated) && (
        <View className="absolute inset-0 z-50">
          <SplashScreen onFinish={() => {
            console.log('[App Launch] Splash screen finished');
            setIsReady(true);
          }} />
        </View>
      )}
      <StatusBar style="dark" />
    </View>
  );
}
