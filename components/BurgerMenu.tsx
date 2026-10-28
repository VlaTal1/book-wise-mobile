import React, {useMemo} from "react";
import {View, YStack, XStack} from "tamagui";
import {TouchableOpacity, Dimensions} from "react-native";
import Modal from "react-native-modal";
import * as Application from "expo-application";
import Constants from "expo-constants";

import CloseIcon from "@/assets/images/icons/close-icon.svg";
import i18n from "@/localization/i18n";
import {CustomText} from "@/components/CustomText";
import {useRole} from "@/hooks/roleContext";
import {useAuth} from "@/auth/SupabaseAuthProvider";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
}

const BurgerMenu: React.FC<Props> = ({isOpen, onClose, onLogout}) => {
    const {profile, isTeacher} = useRole();
    const {user} = useAuth();

    const screenWidth = Dimensions.get("window").width;
    const drawerWidth = screenWidth * 0.8;

    const version = Constants.expoConfig?.version;
    const buildNumber = Application.nativeBuildVersion;

    const userInitial = useMemo(() => {
        const source = profile?.name || user?.email;
        if (source) {
            return source.charAt(0).toUpperCase();
        }
        return "U";
    }, [profile?.name, user?.email]);

    return (
        <Modal
            isVisible={isOpen}
            onBackdropPress={onClose}
            presentationStyle="overFullScreen"
            style={{margin: 0, justifyContent: "flex-start", flexDirection: "row"}}
            onBackButtonPress={onClose}
            animationIn="slideInLeft"
            animationOut="slideOutLeft"
            useNativeDriver={true}
            swipeDirection="left"
            onSwipeComplete={onClose}
            propagateSwipe={true}
        >
            <View
                width={drawerWidth}
                height="100%"
                padding={20}
                backgroundColor="$gray-100"
                borderTopRightRadius={32}
                borderBottomRightRadius={32}
                justifyContent="space-between"
                style={{
                    shadowColor: "rgba(43, 32, 19, 0.2)",
                    shadowOffset: {width: 4, height: 0},
                    shadowRadius: 16,
                    shadowOpacity: 1,
                }}
            >
                <YStack gap={24} flex={1}>
                    {/* Header Row */}
                    <XStack justifyContent="space-between" alignItems="center">
                        <CustomText size="h3Medium" color="$gray-20">
                            {i18n.t("menu")}
                        </CustomText>
                        <TouchableOpacity onPress={onClose}>
                            <View
                                width={40}
                                height={40}
                                borderRadius={20}
                                borderColor="$gray-85"
                                borderWidth={1}
                                alignItems="center"
                                justifyContent="center"
                                backgroundColor="$gray-93"
                            >
                                <CloseIcon fill="#2B2013" width={16} height={16} />
                            </View>
                        </TouchableOpacity>
                    </XStack>

                    {/* User Profile Card */}
                    <XStack
                        backgroundColor="$gray-93"
                        padding={16}
                        borderRadius={20}
                        alignItems="center"
                        gap={12}
                        borderWidth={1}
                        borderColor="$gray-85"
                    >
                        <View
                            width={48}
                            height={48}
                            borderRadius={24}
                            backgroundColor="#FBEAD9"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <CustomText size="h4Medium" color="#CB5A2E">
                                {userInitial}
                            </CustomText>
                        </View>
                        <YStack flex={1} gap={2}>
                            <CustomText size="p2Medium" color="$gray-20" numberOfLines={1}>
                                {profile?.name}
                            </CustomText>
                            <CustomText size="p3Regular" color="$gray-40" numberOfLines={1}>
                                {i18n.t(isTeacher ? "role_teacher" : "role_student")}
                                {user?.email ? ` · ${user.email}` : ""}
                            </CustomText>
                        </YStack>
                    </XStack>
                </YStack>

                {/* Bottom Info and Logout */}
                <YStack gap={16}>
                    <CustomText size="p3Light" textAlign="center" color="$gray-60">
                        {i18n.t("app_version", {version, build: buildNumber})}
                    </CustomText>
                    <TouchableOpacity onPress={onLogout} activeOpacity={0.7}>
                        <View
                            backgroundColor="#FBEAE8"
                            borderColor="#E8A79A"
                            borderWidth={1}
                            borderRadius={999}
                            padding={14}
                            alignItems="center"
                            justifyContent="center"
                        >
                            <CustomText size="p1Medium" color="#C1443A">
                                {i18n.t("logout")}
                            </CustomText>
                        </View>
                    </TouchableOpacity>
                </YStack>
            </View>
        </Modal>
    );
};

export default BurgerMenu;
