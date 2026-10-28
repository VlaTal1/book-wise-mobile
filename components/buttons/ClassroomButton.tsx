import React, {FC} from "react";
import {GetProps, ThemeableStack, View, XStack, YStack} from "tamagui";
import Feather from "@expo/vector-icons/Feather";

import {CustomText} from "@/components/CustomText";
import i18n from "@/localization/i18n";
import {Classroom} from "@/types/Classroom";

type Props = {
    classroom: Classroom;
    onPress?: () => void;
    disabled?: boolean;
} & GetProps<typeof ThemeableStack>;

const ClassroomButton: FC<Props> = ({classroom, onPress, disabled = false, ...props}) => {
    return (
        <ThemeableStack
            pressStyle={{
                opacity: 0.9,
                scale: 0.98,
            }}
            onPress={onPress}
            disabled={disabled}
            {...props}
        >
            <XStack
                backgroundColor="#FFFFFF"
                borderRadius={20}
                padding={12}
                alignItems="center"
                justifyContent="space-between"
                borderWidth={1}
                borderColor="$gray-85"
                gap={12}
                style={{
                    shadowColor: "rgba(43, 32, 19, 0.08)",
                    shadowOffset: {width: 0, height: 2},
                    shadowRadius: 6,
                    shadowOpacity: 1,
                }}
            >
                <XStack alignItems="center" gap={12} flex={1}>
                    <View
                        width={40}
                        height={40}
                        borderRadius={20}
                        backgroundColor="#E1F0EA"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Feather name="users" size={18} color="#2F6F62"/>
                    </View>
                    <YStack flex={1} gap={2}>
                        <CustomText size="h5Medium" color="$gray-20" numberOfLines={1}>
                            {classroom.name}
                        </CustomText>
                        <CustomText size="p3Regular" color="$gray-40" numberOfLines={1}>
                            {i18n.t("classroom_summary", {count: classroom.studentsCount, code: classroom.code})}
                        </CustomText>
                    </YStack>
                </XStack>
                <Feather name="chevron-right" size={16} color="#A68A63"/>
            </XStack>
        </ThemeableStack>
    );
};

export default ClassroomButton;
