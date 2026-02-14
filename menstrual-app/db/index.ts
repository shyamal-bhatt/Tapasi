import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import { mySchema } from './schema'
import DailyLog from './model/DailyLog'

// First, create the adapter to the underlying database:
const adapter = new SQLiteAdapter({
    schema: mySchema,
    // (You might want to comment out the following line for production)
    // schemaVersion: 1, 
    // migrations, // optional migrations
    jsi: true, /* Platform.OS === 'ios' */
    onSetUpError: error => {
        // Database failed to load -- often because of schema mismatch or connection issues
        console.error('Database setup error:', error)
    }
})

// Then, make a Watermelon database from it!
export const database = new Database({
    adapter,
    modelClasses: [
        DailyLog,
    ],
})

// Debugging: Log database path
import * as FileSystem from 'expo-file-system/legacy';
console.log('[DB Path] Document Directory:', FileSystem.documentDirectory);
console.log('[DB Path] Expected SQLite DB:', `${FileSystem.documentDirectory}SQLite/watermelon.db`);
