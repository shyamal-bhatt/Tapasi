// db/sync.ts
// WatermelonDB ↔ Supabase Sync Service
// Uses WatermelonDB's built-in synchronize() with Supabase RPC functions

import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './index';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// --- Types ---
interface PullResponse {
    changes: {
        daily_logs: {
            created: RawRecord[];
            updated: RawRecord[];
            deleted: string[];
        };
    };
    timestamp: number;
}

interface RawRecord {
    id: string;
    [key: string]: unknown;
}

// --- Sync State ---
let isSyncing = false;
let syncTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Core sync function using WatermelonDB's built-in synchronize().
 * Implements pull (server → local) and push (local → server).
 */
export async function syncDatabase(): Promise<void> {
    // Guard: don't sync if already in progress
    if (isSyncing) {
        console.log('[Sync] Sync already in progress, skipping');
        return;
    }

    // Guard: don't sync if no session
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) {
        console.log('[Sync] No authenticated session, skipping sync');
        return;
    }

    isSyncing = true;
    console.log('[Sync] Starting sync for user:', session.user.email);

    try {
        await synchronize({
            database,
            pullChanges: async ({ lastPulledAt }) => {
                console.log('[Sync] Pulling changes since:', lastPulledAt);

                const { data, error } = await supabase.rpc('watermelon_pull', {
                    last_pulled_at: lastPulledAt ?? 0,
                });

                if (error) {
                    console.error('[Sync] Pull error:', error);
                    throw new Error(`Pull failed: ${error.message}`);
                }

                // Handle new user / no data case:
                // The RPC returns { changes: { daily_logs: { created: [], updated: [], deleted: [] } }, timestamp }
                // COALESCE in SQL ensures empty arrays, never null
                const pullData = data as PullResponse;

                console.log('[Sync] Pull complete:', {
                    created: pullData.changes.daily_logs.created.length,
                    updated: pullData.changes.daily_logs.updated.length,
                    deleted: pullData.changes.daily_logs.deleted.length,
                    timestamp: pullData.timestamp,
                });

                return {
                    changes: pullData.changes,
                    timestamp: pullData.timestamp,
                };
            },

            pushChanges: async ({ changes }) => {
                // SyncDatabaseChangeSet is dynamically keyed by table name
                const dailyLogs = (changes as Record<string, { created: unknown[]; updated: unknown[]; deleted: string[] }>)['daily_logs'];
                console.log('[Sync] Pushing changes:', {
                    created: dailyLogs?.created?.length ?? 0,
                    updated: dailyLogs?.updated?.length ?? 0,
                    deleted: dailyLogs?.deleted?.length ?? 0,
                });

                // Skip push if there are no changes to push
                if (
                    !dailyLogs ||
                    (dailyLogs.created.length === 0 &&
                        dailyLogs.updated.length === 0 &&
                        dailyLogs.deleted.length === 0)
                ) {
                    console.log('[Sync] No changes to push, skipping');
                    return;
                }

                // WatermelonDB sends raw records with _status and _changed fields.
                // The SQL RPC ignores those fields, so we can pass them as-is.
                const { error } = await supabase.rpc('watermelon_push', {
                    changes: changes as unknown as Record<string, unknown>,
                });

                if (error) {
                    console.error('[Sync] Push error:', error);
                    throw new Error(`Push failed: ${error.message}`);
                }

                console.log('[Sync] Push complete');
            },

        });

        console.log('[Sync] Sync completed successfully ✓');
    } catch (error) {
        console.error('[Sync] Sync failed:', error);
        // Per WatermelonDB docs: retry once on failure
        throw error;
    } finally {
        isSyncing = false;
    }
}

/**
 * Debounced sync trigger — prevents excessive sync calls.
 * Waits 2 seconds after the last call before actually syncing.
 * Implements retry-once on failure per WatermelonDB recommendations.
 */
export function triggerSync(): void {
    if (syncTimeout) {
        clearTimeout(syncTimeout);
    }

    syncTimeout = setTimeout(async () => {
        try {
            await syncDatabase();
        } catch (error) {
            console.warn('[Sync] First attempt failed, retrying once...', error);
            try {
                await syncDatabase();
            } catch (retryError) {
                console.error('[Sync] Retry also failed:', retryError);
            }
        }
    }, 2000);
}
