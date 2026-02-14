import { createClient } from '@supabase/supabase-js';
import { storage } from './storage';
import 'react-native-url-polyfill/auto';

// MMKV Storage Adapter for Supabase
const MMKVStorageAdapter = {
    getItem: (key: string) => {
        const value = storage.getString(key);
        return value ?? null;
    },
    setItem: (key: string, value: string) => {
        storage.set(key, value);
    },
    removeItem: (key: string) => {
        storage.remove(key);
    },
};

export const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
        auth: {
            storage: MMKVStorageAdapter,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    }
);
