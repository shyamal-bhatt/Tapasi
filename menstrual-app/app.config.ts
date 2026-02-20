import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    const iosUrlScheme = iosClientId
        ? `com.googleusercontent.apps.${iosClientId.split('.apps.googleusercontent.com')[0]}`
        : 'com.googleusercontent.apps.REPLACE_WITH_YOUR_ID';

    return {
        ...config,
        scheme: "tapasi",
        name: "tapasi",
        slug: "tapasi",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        newArchEnabled: true,
        splash: {
            image: "./assets/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.sam.tapasi"
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
            edgeToEdgeEnabled: true,
            package: "com.sam.tapasi"
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        plugins: [
            "expo-router",
            "expo-font",
            [
                "@react-native-google-signin/google-signin",
                {
                    iosUrlScheme
                }
            ],
            [
                "expo-build-properties",
                {
                    "android": {
                        "minSdkVersion": 26
                    },
                    "ios": {
                        "deploymentTarget": "15.1"
                    }
                }
            ],
            "expo-sqlite"
        ]
    };
};
