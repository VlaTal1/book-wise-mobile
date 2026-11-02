import React from "react";
import {Alert} from "react-native";
import {XStack} from "tamagui";
import Feather from "@expo/vector-icons/Feather";
import {useRouter} from "expo-router";

import {CustomText} from "@/components/CustomText";
import i18n from "@/localization/i18n";
import {useRole} from "@/hooks/roleContext";

// Плашка над усіма екранами, поки вчитель дав телефон локальному учню:
// видно, від чийого імені все відбувається, і як повернутися до вчителя.
const StudentModeBanner = () => {
    const {actingStudent, exitStudentMode} = useRole();
    const router = useRouter();

    if (!actingStudent) {
        return null;
    }

    const onExit = () => {
        Alert.alert(
            i18n.t("student_mode_exit"),
            i18n.t("student_mode_exit_confirm", {name: actingStudent.name}),
            [
                {text: i18n.t("cancel"), style: "cancel"},
                {
                    text: i18n.t("student_mode_exit"),
                    // Спершу на головну (екрани учня закриваються ще з його
                    // профілем), потім повернення профілю вчителя — див.
                    // onStartStudentMode у classroom/[id].tsx.
                    onPress: async () => {
                        router.dismissTo("/");
                        await exitStudentMode();
                    },
                },
            ],
        );
    };

    return (
        <XStack
            backgroundColor="#2F6F62"
            paddingHorizontal={16}
            paddingVertical={8}
            alignItems="center"
            justifyContent="space-between"
            gap={8}
        >
            <XStack alignItems="center" gap={8} flex={1}>
                <Feather name="user" size={16} color="#FFFFFF"/>
                <CustomText size="p2Medium" color="#FFFFFF" numberOfLines={1} flex={1}>
                    {i18n.t("student_mode_banner", {name: actingStudent.name})}
                </CustomText>
            </XStack>
            <XStack
                alignItems="center"
                gap={4}
                paddingHorizontal={10}
                paddingVertical={4}
                borderRadius={999}
                backgroundColor="rgba(255,255,255,0.18)"
                pressStyle={{opacity: 0.7}}
                onPress={onExit}
            >
                <Feather name="log-out" size={14} color="#FFFFFF"/>
                <CustomText size="p3Medium" color="#FFFFFF">
                    {i18n.t("student_mode_exit")}
                </CustomText>
            </XStack>
        </XStack>
    );
};

export default StudentModeBanner;
