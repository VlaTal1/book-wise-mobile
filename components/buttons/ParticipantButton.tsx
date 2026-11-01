import React, {FC, useMemo} from "react";
import {GetProps, ThemeableStack, View, XStack, YStack} from "tamagui";
import Feather from "@expo/vector-icons/Feather";

import {CustomText} from "@/components/CustomText";
import {Participant} from "@/types/Paticipant";
import {getAvatarColor, getInitial} from "@/constants/avatarPalette";
import i18n from "@/localization/i18n";

type Props = {
    participant: Participant;
    onPress?: () => void;
    disabled?: boolean;
    // Замість стрілки праворуч (напр. дії з локальним учнем).
    rightElement?: React.ReactNode;
} & GetProps<typeof ThemeableStack>;

const ParticipantButton: FC<Props> = ({participant, onPress, disabled = false, rightElement, ...props}) => {
    const themeColor = useMemo(() => getAvatarColor(participant.name), [participant.name]);
    const initial = useMemo(() => getInitial(participant.name), [participant.name]);

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
                        backgroundColor={themeColor.bg}
                        alignItems="center"
                        justifyContent="center"
                    >
                        <CustomText
                            size="h5Medium"
                            color={themeColor.text}
                            style={{lineHeight: undefined, paddingTop: 0}}
                        >
                            {initial}
                        </CustomText>
                    </View>
                    <YStack flex={1}>
                        <CustomText size="h5Medium" color="$gray-20" numberOfLines={1}>
                            {participant.name}
                        </CustomText>
                        {participant.local && (
                            <CustomText size="p3Regular" color="$gray-40">
                                {i18n.t("local_student_badge")}
                            </CustomText>
                        )}
                    </YStack>
                </XStack>
                {rightElement ?? <Feather name="chevron-right" size={16} color="#A68A63" />}
            </XStack>
        </ThemeableStack>
    );
};

export default ParticipantButton;