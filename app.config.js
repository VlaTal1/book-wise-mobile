import "dotenv/config";
import {version as pkgVersion} from "./package.json";

// Check for the environment
const ENV = process.env.APP_ENV || "development";

// Load environment-specific variables
const envFile = ENV === "production" ? ".env.production" : ".env.development";
// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-require-imports
require("dotenv").config({path: envFile});

export default {
    expo: {
        name: "reader-ai",
        owner: "vlatal-org",
        slug: "reader-ai",
        version: pkgVersion,
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "myapp",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        ios: {
            bundleIdentifier: "com.vlatalorg.readerai",
            supportsTablet: true,
            infoPlist: {
                NSMicrophoneUsageDescription: "Мікрофон потрібен для замірювання швидкості читання вголос",
            },
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#ffffff",
            },
            permissions: [
                "android.permission.CAMERA",
                "android.permission.RECORD_AUDIO",
                "android.permission.WRITE_EXTERNAL_STORAGE",
                "android.permission.READ_EXTERNAL_STORAGE",
            ],
            package: "com.vlatalorg.readerai",
        },
        web: {
            bundler: "metro",
            output: "static",
            favicon: "./assets/images/favicon.png",
        },
        plugins: [
            "expo-status-bar",
            "expo-web-browser",
            [
                "expo-build-properties",
                {
                    "android": {
                        "usesCleartextTraffic": true,
                    },
                },
            ],
            "expo-router",
            [
                "expo-splash-screen",
                {
                    "image": "./assets/images/splash-icon.png",
                    "imageWidth": 200,
                    "resizeMode": "contain",
                    "backgroundColor": "#ffffff",
                },
            ],
            "expo-localization",
            "expo-font",
            "expo-audio",
            // Google Sign-In: на Android (без Firebase) config plugin не
            // потрібен — достатньо autolinking. Для iOS плагін додає URL
            // scheme (reversed iOS Client ID); без опцій він вмикається в
            // режимі Firebase і вимагає google-services.json, тому додаємо
            // його лише коли задано GOOGLE_AUTH_IOS_URL_SCHEME.
            ...(process.env.GOOGLE_AUTH_IOS_URL_SCHEME
                ? [["@react-native-google-signin/google-signin", {iosUrlScheme: process.env.GOOGLE_AUTH_IOS_URL_SCHEME}]]
                : []),
        ],
        experiments: {
            typedRoutes: true,
        },
        extra: {
            apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
            pythonWsBaseUrl: process.env.EXPO_PUBLIC_PYTHON_WS_BASE_URL,
            supabaseUrl: process.env.SUPABASE_URL,
            supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
            // OAuth client типу "Web application" з Google Cloud — потрібен
            // для отримання idToken, який приймає Supabase.
            googleAuthWebClientId: process.env.GOOGLE_AUTH_WEB_CLIENT_ID,
            environment: ENV,
            eas: {
                projectId: "6b8685a6-d029-4f3c-9f98-2d9f4ed69b76",
            },
        },
    },
};
