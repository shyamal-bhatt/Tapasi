import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const mySchema = appSchema({
    version: 1,
    tables: [
        tableSchema({
            name: 'daily_logs',
            columns: [
                { name: 'date', type: 'string', isIndexed: true },
                // Bleeding (stored as separate columns for easier querying if needed, or we could JSON it)
                // Let's store flow and color as columns because they are single values.
                { name: 'bleeding_flow', type: 'string', isOptional: true },
                { name: 'bleeding_color', type: 'string', isOptional: true },

                // JSON Arrays/Objects
                { name: 'moods_json', type: 'string', isOptional: true },
                { name: 'symptoms_json', type: 'string', isOptional: true },
                { name: 'cravings_json', type: 'string', isOptional: true },
                { name: 'exercise_json', type: 'string', isOptional: true }, // stores types + stepCount

                // Single Values
                { name: 'work_load', type: 'string', isOptional: true },
                { name: 'sleep_hours', type: 'number', isOptional: true },
                { name: 'sleep_quality', type: 'string', isOptional: true },
                { name: 'weight', type: 'number', isOptional: true },

                // Booleans
                { name: 'birth_control', type: 'boolean', isOptional: true },
                { name: 'smoke', type: 'boolean', isOptional: true },
                { name: 'alcohol', type: 'boolean', isOptional: true },

                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ]
        }),
    ]
})
