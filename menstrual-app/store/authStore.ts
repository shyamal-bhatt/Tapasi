import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { type Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

import { storage } from '../lib/storage';
import { database } from '../db';
import { syncDatabase } from '../db/sync';

const zustandStorage: StateStorage = {
    setItem: (name, value) => storage.set(name, value),
    getItem: (name) => {
        const value = storage.getString(name);
        return value ?? null;
    },
    removeItem: (name) => storage.remove(name),
};

interface AuthState {
    session: Session | null;
    _hasHydrated: boolean;
    setSession: (session: Session | null) => void;
    logout: () => Promise<void>;
    setHasHydrated: (state: boolean) => void;
}

const storeCreator = persist<AuthState, [], [], Pick<AuthState, 'session'>>(
    (set) => ({
        session: null,
        _hasHydrated: false,
        setSession: (session) => {
            console.log('[Auth Store] Setting session', { session: session?.user?.email });
            set({ session });
        },
        logout: async () => {
            console.log('[User Action] Auth - Logout Initiated');
            try {
                // 1. Sync pending local changes to Supabase
                console.log('[User Action] Auth - Syncing pending changes before logout...');
                await syncDatabase();

                // 2. Wipe the SQLite data and safely rebuild the empty schema
                console.log('[User Action] Auth - Resetting WatermelonDB...');
                await database.write(async () => {
                    await database.unsafeResetDatabase();
                });
                // Ensure the sync memory is completely zeroed out
                await database.adapter.removeLocal('__watermelon_last_pulled_at');

                // 3. Sign out of Supabase
                console.log('[User Action] Auth - Signing out from Supabase...');
                await supabase.auth.signOut();

                console.log('[User Action] Auth - Logout Flow Complete');
            } catch (error) {
                console.error('[User Action] Auth - Error signing out or resetting DB', error);
            }
            // Session will be cleared by the auth listener in _layout.tsx
        },
        setHasHydrated: (state) => set({ _hasHydrated: state })
    }),
    {
        name: 'auth-storage',
        storage: createJSONStorage(() => zustandStorage),
        partialize: (state) => ({ session: state.session }),
        onRehydrateStorage: () => (state) => {
            state?.setHasHydrated(true);
        }
    }
);

export const useAuthStore = create<AuthState>()(
    (__DEV__ && require('../ReactotronConfig').default?.createEnhancer)
        ? require('../ReactotronConfig').default.createEnhancer({ name: 'Auth Store' })(storeCreator)
        : storeCreator
);
