import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { type Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

import { storage } from '../lib/storage';

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
                await supabase.auth.signOut();
                console.log('[User Action] Auth - Supabase SignOut Success');
            } catch (error) {
                console.error('[User Action] Auth - Error signing out from Supabase', error);
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
