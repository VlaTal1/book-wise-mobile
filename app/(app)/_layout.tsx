import React from "react";
import {ActivityIndicator} from "react-native";
import {YStack} from "tamagui";
import {Redirect, Stack} from "expo-router";

import {useAuth} from "@/auth/SupabaseAuthProvider";
import CustomStackScreen from "@/components/CustomStackScreen";
import RoleOnboarding from "@/components/RoleOnboarding";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import {CustomText} from "@/components/CustomText";
import i18n from "@/localization/i18n";
import {useRole} from "@/hooks/roleContext";
import StudentModeBanner from "@/components/StudentModeBanner";


export default function App() {
    const {user, isLoading: isProfileLoading} = useAuth();
    const {profile, needsOnboarding, isLoading: isRoleLoading, refreshProfile} = useRole();

    if (!isProfileLoading && !user) {
        return (
            <>
                <CustomStackScreen/>
                <YStack flex={1} justifyContent="center" alignItems="center">
                    <ActivityIndicator size="large" color="#CB5A2E"/>
                </YStack>
                <Redirect href="/login"/>
            </>
        )
    }

    // Спінер лише до першого завантаження профілю — інакше повторне
    // оновлення профілю демонтувало б весь стек навігації.
    if (isProfileLoading || !user || (isRoleLoading && !profile)) {
        return (
            <>
                <CustomStackScreen/>
                <YStack flex={1} justifyContent="center" alignItems="center">
                    <ActivityIndicator size="large" color="#CB5A2E"/>
                </YStack>
            </>
        );
    }

    if (needsOnboarding) {
        return (
            <>
                <CustomStackScreen/>
                <RoleOnboarding/>
            </>
        );
    }

    if (!profile) {
        return (
            <>
                <CustomStackScreen/>
                <YStack flex={1} justifyContent="center" alignItems="center" gap={16} padding={16}>
                    <CustomText size="p1Regular" color="$gray-40" textAlign="center">
                        {i18n.t("failed_to_load_profile")}
                    </CustomText>
                    <PrimaryButton text={i18n.t("try_again")} onPress={refreshProfile}/>
                </YStack>
            </>
        );
    }

    return (
        <YStack flex={1}>
            <StudentModeBanner/>
            <Stack/>
        </YStack>
    );
}
