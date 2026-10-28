import React from "react";
import {ImageBackground, StyleSheet, useColorScheme} from "react-native";
import {Slot} from "expo-router";
import {SafeAreaView} from "react-native-safe-area-context";
import {TamaguiProvider} from "tamagui";
import {useFonts} from "expo-font";

import tamaguiConfig from "@/styles/tamagui.config";
import {LanguageProvider} from "@/components/provider/LanguageProvider";
import {SupabaseAuthProvider} from "@/auth/SupabaseAuthProvider";
import {RoleProvider} from "@/hooks/roleContext";
import {Provider} from "react-redux";
import {store} from "@/store";

// Root layout. Accessible for both authenticated and not users.
// In future public pages should be added in app directory.
export default function Root() {
    const colorScheme = useColorScheme();

    const [loaded] = useFonts({
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        GeistRegular: require("@/assets/fonts/Geist/Geist-Regular.otf"),
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        GeistMedium: require("@/assets/fonts/Geist/Geist-Medium.otf"),
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        GeistSemiBold: require("@/assets/fonts/Geist/Geist-SemiBold.otf"),
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        GeistBold: require("@/assets/fonts/Geist/Geist-Bold.otf"),
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        InterLight: require("@/assets/fonts/Inter/InterDisplay-Light.otf"),
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        InterRegular: require("@/assets/fonts/Inter/InterDisplay-Regular.otf"),
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        InterMedium: require("@/assets/fonts/Inter/InterDisplay-Medium.otf"),
    });

    if (!loaded) {
        return null;
    }

    const backgroundColor = "#F6EFE1"

    return (
        <LanguageProvider>
            <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme!}>
                <Provider store={store}>
                    <SupabaseAuthProvider>
                        <RoleProvider>
                            <ImageBackground
                                style={[styles.backgroundImage, {backgroundColor}]}
                            >
                                <SafeAreaView style={[styles.safeArea]}>
                                    <Slot/>
                                </SafeAreaView>
                            </ImageBackground>
                        </RoleProvider>
                    </SupabaseAuthProvider>
                </Provider>
            </TamaguiProvider>
        </LanguageProvider>
    );
}

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        height: "100%",
        resizeMode: "cover",
    },
    safeArea: {
        height: "100%",
    },
});
