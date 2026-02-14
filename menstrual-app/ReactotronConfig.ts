import Reactotron from 'reactotron-react-native';
import zustandPlugin from 'reactotron-plugin-zustand';

// @ts-ignore
const reactotron = Reactotron.configure({
    name: 'Menstrual App',
})
    .useReactNative({
        asyncStorage: false, // We use MMKV
        networking: {
            ignoreUrls: /symbolicate/,
        },
        editor: false,
        errors: { veto: (stackFrame) => false },
        overlay: false,
    })
    .use(zustandPlugin({ stores: [] }))
    .connect();

// We can add a custom command to clear MMKV or log it
reactotron.onCustomCommand({
    command: 'Log MMKV',
    handler: () => {
        // Require here to avoid circular dependency
        const { storage } = require('./store/authStore');
        const keys = storage.getAllKeys();
        const values = {};
        keys.forEach((key: string) => {
            // @ts-ignore
            values[key] = storage.getString(key) || storage.getNumber(key) || storage.getBoolean(key);
        });
        console.log('MMKV Storage:', values);
        Reactotron.display({
            name: 'MMKV',
            value: values,
            preview: 'MMKV Storage Dump'
        });
    },
    title: "Log MMKV Storage",
    description: "Dumps all MMKV keys and values to Reactotron timeline"
});

reactotron.onCustomCommand({
    command: 'Log Auth State',
    handler: () => {
        const { useAuthStore } = require('./store/authStore');
        const state = useAuthStore.getState();
        console.log('[Reactotron] Dumping Auth State', state);
        Reactotron.display({
            name: 'Auth State',
            value: state,
            preview: 'Current Auth State (User & Tokens)'
        });
    },
    title: "Log Auth State",
    description: "Dumps the current Auth Store state (including tokens) to the timeline"
});

export default reactotron;
