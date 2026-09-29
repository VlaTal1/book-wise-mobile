import React, {useMemo, useState} from "react";
import {Circle, View, XStack, YStack} from "tamagui";
import { BackHandler} from "react-native";
import {useBackHandler} from "@react-native-community/hooks";
import {useRouter} from "expo-router";

import BurgerIcon from "@/assets/images/icons/burger-icon.svg";
import {useAuth} from "@/auth/SupabaseAuthProvider";
import CustomStackScreen from "@/components/CustomStackScreen";
import {HomeMenuCard} from "@/components/home/HomeMenuCard";
import {CustomText} from "@/components/CustomText";
import i18n from "@/localization/i18n";
import BurgerMenu from "@/components/BurgerMenu";
import {useUserMode} from "@/hooks/userModeContext";
import {getAvatarColor, getInitial} from "@/constants/avatarPalette";

const Home = () => {
    const {user, profile, isLoading: isProfileLoading, signOut} = useAuth();
    const {isParentMode} = useUserMode();
    const router = useRouter();

    useBackHandler(() => {
        BackHandler.exitApp();
        return true;
    })

    const onLogout = async () => {
        await signOut();
        setIsBurgerOpen(false);
    };

    const [isBurgerOpen, setIsBurgerOpen] = useState(false)

    const avatarColor = useMemo(() => getAvatarColor(user?.email ?? undefined), [user?.email]);
    const avatarInitial = useMemo(() => getInitial(user?.email ?? undefined), [user?.email]);

    return (
        <>
            <CustomStackScreen/>
            <View padding={16} flexDirection="column" flex={1} justifyContent="flex-end">
                <YStack flex={1} justifyContent="flex-start" gap={4}>
                    <XStack alignItems="center" justifyContent="space-between">
                        <Circle
                            size={44}
                            backgroundColor={avatarColor.bg}
                            alignItems="center"
                            justifyContent="center"
                        >
                            <CustomText size="h5Medium" color={avatarColor.text} style={{lineHeight: undefined, paddingTop: 0}}>
                                {avatarInitial}
                            </CustomText>
                        </Circle>
                        <Circle
                            size={44}
                            pressStyle={{opacity: 0.6, scale: 0.94}}
                            backgroundColor="#FFFFFF"
                            borderColor="$gray-85"
                            borderWidth={1}
                            onPress={() => setIsBurgerOpen(true)}
                        >
                            <BurgerIcon width={20} height={20} fill="#3A2E20"/>
                        </Circle>
                    </XStack>
                    <YStack paddingTop={28} gap={2}>
                        <CustomText size="p1Regular" color="$gray-40">
                            {i18n.t("welcome_to")}
                        </CustomText>
                        <CustomText size="h1" color="$gray-20">
                            {i18n.t("app_name")}
                        </CustomText>
                    </YStack>
                </YStack>
                <XStack flexDirection="column" gap={10}>
                    <HomeMenuCard
                        title={i18n.t("books")}
                        type="books"
                        onPress={() => router.navigate("/books")}
                    />
                    <HomeMenuCard
                        title={i18n.t("tests")}
                        type="tests"
                        onPress={() => router.navigate("/tests")}
                    />
                    {!isParentMode && (
                        <HomeMenuCard
                            title={i18n.t("reading_speed_title")}
                            type="readingSpeed"
                            onPress={() => router.navigate("/readingSpeed")}
                        />
                    )}
                    {isParentMode && (
                        <HomeMenuCard
                            title={i18n.t("children")}
                            type="participants"
                            onPress={() => router.navigate("/participants")}
                        />
                    )}
                    <HomeMenuCard
                        title={i18n.t("statistics")}
                        type="statistics"
                        onPress={() => router.navigate("/statistics")}
                    />
                    <HomeMenuCard
                        title={i18n.t("reading_history_title")}
                        type="readingHistory"
                        onPress={() => router.navigate("/readingHistory")}
                    />
                </XStack>
            </View>

            <BurgerMenu
                isOpen={isBurgerOpen}
                onClose={() => setIsBurgerOpen(false)}
                onLogout={onLogout}
            />
        </>
    )
}

export default Home;
