import React from "react";
import {GetProps, ThemeableStack, View, XStack, YStack} from "tamagui";
import Feather from "@expo/vector-icons/Feather";

import {CustomText} from "@/components/CustomText";

type HomeMenuCardProps = {
    title: string;
    type: "books" | "tests" | "participants" | "statistics" | "readingSpeed" | "readingHistory";
    onPress?: () => void;
    disabled?: boolean;
} & GetProps<typeof ThemeableStack>;

export const HomeMenuCard = ({title, type, onPress, disabled, ...props}: HomeMenuCardProps) => {
    let iconName: React.ComponentProps<typeof Feather>["name"] = "book-open";
    let iconColor = "#CB5A2E";
    let iconBg = "#FBEAD9";
    let description = "";

    switch (type) {
        case "books":
            iconName = "book-open";
            iconColor = "#CB5A2E";
            iconBg = "#FBEAD9";
            description = "Explore library & read PDFs";
            break;
        case "tests":
            iconName = "clipboard";
            iconColor = "#3F8A5D";
            iconBg = "#E7F3EA";
            description = "Assess reading comprehension";
            break;
        case "participants":
            iconName = "users";
            iconColor = "#2F6F62";
            iconBg = "#E1F0EA";
            description = "Manage student access profiles";
            break;
        case "statistics":
            iconName = "bar-chart-2";
            iconColor = "#D69E2E";
            iconBg = "#FBF0D9";
            description = "Monitor times & performance metrics";
            break;
        case "readingSpeed":
            iconName = "mic";
            iconColor = "#9C4F86";
            iconBg = "#F5E9F1";
            description = "Measure reading speed & accuracy";
            break;
        case "readingHistory":
            iconName = "clock";
            iconColor = "#CB5A2E";
            iconBg = "#FBEAD9";
            description = "Review past reading sessions";
            break;
    }

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
                borderRadius={24}
                padding={16}
                alignItems="center"
                justifyContent="space-between"
                borderWidth={1}
                borderColor="$gray-85"
                gap={16}
                style={{
                    shadowColor: "rgba(43, 32, 19, 0.06)",
                    shadowOffset: {width: 0, height: 3},
                    shadowRadius: 8,
                    shadowOpacity: 1,
                }}
            >
                <XStack alignItems="center" gap={16} flex={1}>
                    <View
                        backgroundColor={iconBg}
                        padding={12}
                        borderRadius={18}
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Feather name={iconName} size={24} color={iconColor} />
                    </View>
                    <YStack gap={2} flex={1}>
                        <CustomText size="h5Medium" color="$gray-20">
                            {title}
                        </CustomText>
                        {description ? (
                            <CustomText size="p3Regular" color="$gray-40">
                                {description}
                            </CustomText>
                        ) : null}
                    </YStack>
                </XStack>
                <Feather name="chevron-right" size={20} color="#A68A63" />
            </XStack>
        </ThemeableStack>
    );
};
