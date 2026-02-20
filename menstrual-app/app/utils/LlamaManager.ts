import { documentDirectory, getInfoAsync, createDownloadResumable, deleteAsync } from 'expo-file-system/legacy';
import { LlamaContext, initLlama } from 'llama.rn';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MODEL_FILENAME = 'model.gguf';
const MODEL_PATH = `${documentDirectory}${MODEL_FILENAME}`;
const STORAGE_KEY = 'last_downloaded_model_url';
const STORAGE_NAME_KEY = 'last_downloaded_model_name';

// Fallback TinyLlama 1.1b URL if table is missing/empty
const FALLBACK_MODEL_URL = 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';

export class LlamaManager {
    static context: LlamaContext | null = null;
    static currentDownload: any | null = null;
    static activeModelUrl: string | null = null;
    static activeModelName: string | null = null;

    /**
     * Helper to fetch the latest URL and Name from Supabase
     */
    private static async fetchRemoteConfig(): Promise<{ url: string, name: string }> {
        try {
            const { data, error } = await supabase
                .from('app_model_config')
                .select('bucket_link, model_name')
                .eq('status', true)
                .single();

            if (error) throw error;
            return {
                url: data?.bucket_link || FALLBACK_MODEL_URL,
                name: data?.model_name || 'TinyLlama' // fallback name
            };
        } catch (err) {
            console.warn('[LlamaManager] Failed to fetch remote config, using cache/fallback', err);
            return { url: FALLBACK_MODEL_URL, name: 'TinyLlama' };
        }
    }

    /**
     * Proactive "Smart Health Check" Logic
     * Computes HEAD request content-length against local FileSystem size.
     */
    static async validateModelIntegrity(remoteUrl: string): Promise<boolean> {
        try {
            const info = await getInfoAsync(MODEL_PATH);

            if (!info.exists || info.isDirectory) {
                console.log('[LlamaManager] Validate: Local model file does not exist.');
                return false;
            }

            // Check if the URL has changed compared to last download
            const lastDownloadedUrl = await AsyncStorage.getItem(STORAGE_KEY);
            if (lastDownloadedUrl && lastDownloadedUrl !== remoteUrl) {
                console.warn('[LlamaManager] Validate: Expected URL changed. Current file belongs to an older configuration.');
                return false;
            }

            // Perform HEAD request to get exact byte size from server
            try {
                const response = await fetch(remoteUrl, { method: 'HEAD' });
                if (!response.ok) throw new Error('HEAD request failed');

                const contentLengthHeader = response.headers.get('content-length');
                if (contentLengthHeader) {
                    const expectedSize = parseInt(contentLengthHeader, 10);
                    // Due to some CDN chunks, we give a tiny variance buffer.
                    // But generally it should match exactly if finished cleanly.
                    if (Math.abs(info.size - expectedSize) > 8000) {
                        console.warn(`[LlamaManager] Validate: Size mismatch. Local: ${info.size}, Remote: ${expectedSize}. Required redownload.`);
                        return false;
                    }
                    console.log('[LlamaManager] Validate: Smart Health Check passed. Size matches perfectly.');
                    return true;
                } else {
                    // Fail open if head request doesn't return content length but file exists physically
                    console.log('[LlamaManager] Validate: Could not determine remote size, relying on blind file existence.');
                    return true;
                }
            } catch (networkErr) {
                // FAIL OPEN for Offline use cases!
                console.log(`[LlamaManager] Validate: Offline or network error. Falling back to local existence. (${info.size} bytes found).`);
                return true;
            }
        } catch (error) {
            console.error('[LlamaManager] Error validating model integrity:', error);
            return false;
        }
    }

    /**
     * Orchestrates the prepare logic: Fetch -> Check -> Clean or proceed.
     * Returns true if the model is ready to be initialized into Context.
     */
    static async prepareModel(): Promise<{ isReady: boolean; targetUrl: string }> {
        const config = await this.fetchRemoteConfig();
        this.activeModelUrl = config.url;
        this.activeModelName = config.name;

        // Try to load cached name if we fail-open
        const cachedName = await AsyncStorage.getItem(STORAGE_NAME_KEY);
        if (cachedName && this.activeModelUrl === FALLBACK_MODEL_URL) {
            this.activeModelName = cachedName;
        }

        const isHealthy = await this.validateModelIntegrity(config.url);

        if (!isHealthy) {
            // Check if there is an existing corrupt/old file to clean up before download
            const info = await getInfoAsync(MODEL_PATH);
            if (info.exists) {
                console.log('[LlamaManager] prepareModel: Cleaning up old/corrupted file before prompting download.');
                await deleteAsync(MODEL_PATH, { idempotent: true });
                await AsyncStorage.removeItem(STORAGE_KEY);
                await AsyncStorage.removeItem(STORAGE_NAME_KEY);
            }
            return { isReady: false, targetUrl: config.url };
        }

        // Cache the healthy model name for offline views
        if (this.activeModelName) {
            await AsyncStorage.setItem(STORAGE_NAME_KEY, this.activeModelName);
        }

        return { isReady: true, targetUrl: config.url };
    }

    /**
     * Downloads the model using `expo-file-system`.
     */
    static async downloadModel(onProgress?: (progress: number) => void): Promise<boolean> {
        if (!this.activeModelUrl) {
            const config = await this.fetchRemoteConfig();
            this.activeModelUrl = config.url;
            this.activeModelName = config.name;
        }

        const targetUrl = this.activeModelUrl;

        try {
            console.log(`[LlamaManager] Starting download from ${targetUrl}`);

            this.currentDownload = createDownloadResumable(
                targetUrl,
                MODEL_PATH,
                {},
                (downloadProgress: any) => {
                    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                    if (onProgress) {
                        onProgress(progress);
                    }
                }
            );

            await this.currentDownload.downloadAsync();
            this.currentDownload = null;

            console.log('[LlamaManager] Download complete or finished, checking integrity...');
            const isValid = await this.validateModelIntegrity(targetUrl);

            if (isValid) {
                // Save the local cache so we know which URL this file belongs to
                await AsyncStorage.setItem(STORAGE_KEY, targetUrl);
                if (this.activeModelName) {
                    await AsyncStorage.setItem(STORAGE_NAME_KEY, this.activeModelName);
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('[LlamaManager] Error downloading model:', error);
            this.currentDownload = null;
            return false;
        }
    }

    /**
     * Cancels the active model download instance.
     */
    static async cancelDownload() {
        if (this.currentDownload) {
            try {
                console.log('[LlamaManager] Canceling active download...');
                await this.currentDownload.cancelAsync();
                this.currentDownload = null;
                await deleteAsync(MODEL_PATH, { idempotent: true }); // Clean up partial download
                console.log('[LlamaManager] Download canceled and partial file removed.');
            } catch (error) {
                console.error('[LlamaManager] Error canceling download:', error);
            }
        }
    }

    /**
     * Deletes the currently downloaded model and clears cache.
     */
    static async deleteModel() {
        try {
            await this.releaseContext();
            await deleteAsync(MODEL_PATH, { idempotent: true });
            await AsyncStorage.removeItem(STORAGE_KEY);
            await AsyncStorage.removeItem(STORAGE_NAME_KEY);
            console.log('[LlamaManager] Model deleted successfully from device.');
        } catch (error) {
            console.error('[LlamaManager] Error deleting model:', error);
        }
    }

    /**
     * Initializes the Llama context with the local GGUF model.
     */
    static async initContext(): Promise<boolean> {
        try {
            // We bypass the health check here if we've reached init because prepareModel/downloadModel
            // already asserts safety prior. We just do a blind existence check.
            const info = await getInfoAsync(MODEL_PATH);
            if (!info.exists || info.isDirectory) {
                console.warn('[LlamaManager] Init: Model is missing.');
                return false;
            }

            if (this.context) {
                console.log('[LlamaManager] Init: Context already initialized.');
                return true;
            }

            console.log('[LlamaManager] Init: Loading model into memory...');
            this.context = await initLlama({
                model: MODEL_PATH,
                use_mlock: true, // Attempt to keep model in RAM
                n_ctx: 4096,     // Max context window
            });

            console.log('[LlamaManager] Init: Context initialized successfully.');
            return true;
        } catch (error) {
            console.error('[LlamaManager] Error initializing context:', error);
            return false;
        }
    }

    /**
     * Generates a streamed completion response.
     */
    static async generateResponse(
        prompt: string,
        onToken: (token: string) => void
    ): Promise<string> {
        if (!this.context) {
            throw new Error('Llama context not initialized');
        }

        try {
            const result = await this.context.completion({
                messages: [
                    { role: 'system', content: 'You are a helpful health assistant AI. Give concise and empathetic answers.' },
                    { role: 'user', content: prompt }
                ],
                n_predict: 512,
                temperature: 0.7,
                top_p: 0.9,
            }, (res) => {
                // If it is an object with token or chunk
                if (res && res.token) {
                    onToken(res.token);
                }
            });
            return result.text;
        } catch (error) {
            console.error('[LlamaManager] Error generating response:', error);
            throw error;
        }
    }

    /**
     * Pass 1: Generates an internal SQLite query based on a user message
     */
    static async generateSqlPass(
        prompt: string,
        currentDate: string
    ): Promise<string> {
        if (!this.context) {
            throw new Error('Llama context not initialized');
        }

        try {
            const systemPrompt = `You are a SQLite expert. Given the schema below, convert the user's natural language question into a valid SQLite query.

SCHEMA:
CREATE TABLE daily_logs (
    id TEXT PRIMARY KEY, 
    date TEXT, 
    bleeding_flow TEXT, 
    bleeding_color TEXT, 
    moods_json TEXT, 
    symptoms_json TEXT, 
    cravings_json TEXT, 
    exercise_json TEXT, 
    work_load TEXT, 
    sleep_hours REAL, 
    sleep_quality TEXT, 
    weight REAL, 
    birth_control INTEGER, 
    smoke INTEGER, 
    alcohol INTEGER, 
    created_at REAL, 
    updated_at REAL
);

RULES:
Return ONLY the SQL code. No explanation. No markdown backticks.
Assume dates are in 'YYYY-MM-DD' format.
Today is ${currentDate}.
Use 'SELECT' statements only. Do not perform any write operations.`;

            const result = await this.context.completion({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                n_predict: 256,
                temperature: 0.1, // Highly deterministic for code generation
                top_p: 0.9,
            });

            // Clean up code block backticks if the model ignored the instruction
            let sql = result.text.trim();
            if (sql.startsWith('```sql')) {
                sql = sql.substring(6);
            } else if (sql.startsWith('```sqlite')) {
                sql = sql.substring(9);
            } else if (sql.startsWith('```')) {
                sql = sql.substring(3);
            }
            if (sql.endsWith('```')) {
                sql = sql.substring(0, sql.length - 3);
            }
            return sql.trim();

        } catch (error) {
            console.error('[LlamaManager] Error generating SQL pass:', error);
            throw error;
        }
    }

    /**
     * Releases memory for the Llama context.
     */
    static async releaseContext() {
        if (this.context) {
            console.log('[LlamaManager] Releasing context...');
            await this.context.release();
            this.context = null;
        }
    }
}
