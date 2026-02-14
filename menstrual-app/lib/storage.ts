import { createMMKV } from 'react-native-mmkv';

// Initialize MMKV storage immediately
// This is exported separately to avoid circular dependencies
export const storage = createMMKV();
