import React, {FC, useMemo} from "react";
import {GetProps, ThemeableStack, XStack, YStack} from "tamagui";
import Feather from "@expo/vector-icons/Feather";
import {ActivityIndicator} from "react-native";

import {CustomText} from "@/components/CustomText";
import {Test} from "@/types/Test";
import i18n from "@/localization/i18n";
import CompleteStatus from "@/types/CompleteStatus";

type Props = {
    test: Test;
    onPress?: () => void;
    disabled?: boolean;
} & GetProps<typeof ThemeableStack>;

const TestButton: FC<Props> = ({test, onPress, disabled = false, ...props}) => {
    // Питання генерує Python-сервіс асинхронно (RabbitMQ) — поки вони не
    // готові, пройти тест неможливо.
    const isGenerating = test.generationStatus === "GENERATING";

    const statusDetails = useMemo(() => {
        if (isGenerating) {
            return {
                bg: "#EEF1F6",
                text: "#4A5A78",
                label: i18n.t("test_generating"),
            };
        }
        if (test.generationStatus === "FAILED") {
            return {
                bg: "#FBEAE8",
                text: "#C1443A",
                label: i18n.t("test_generation_failed"),
            };
        }
        switch (test.completed) {
            case CompleteStatus.COMPLETED:
                return {
                    bg: "#E7F3EA",
                    text: "#2F6B45",
                    label: i18n.t("COMPLETED"),
                };
            case CompleteStatus.IN_PROGRESS:
                return {
                    bg: "#FBF0D9",
                    text: "#B07A1E",
                    label: i18n.t("IN_PROGRESS"),
                };
            default:
                return {
                    bg: "#FBF6EC",
                    text: "#7A6248",
                    label: i18n.t("NOT_STARTED"),
                };
        }
    }, [test.completed, test.generationStatus, isGenerating]);

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
            <YStack
                backgroundColor="#FFFFFF"
                borderRadius={20}
                padding={16}
                borderWidth={1}
                borderColor="$gray-85"
                gap={12}
                style={{
                    shadowColor: "rgba(43, 32, 19, 0.06)",
                    shadowOffset: {width: 0, height: 2},
                    shadowRadius: 6,
                    shadowOpacity: 1,
                }}
            >
                <XStack justifyContent="space-between" alignItems="flex-start" gap={8}>
                    <YStack gap={2} flex={1}>
                        <CustomText size="h5Medium" color="$gray-20" numberOfLines={2}>
                            {test.progress.book.title}
                        </CustomText>
                        <CustomText size="p3Regular" color="$gray-40">
                            {test.progress.book.author}
                        </CustomText>
                    </YStack>
                    <XStack
                        backgroundColor={statusDetails.bg}
                        paddingHorizontal={10}
                        paddingVertical={4}
                        borderRadius={999}
                        alignItems="center"
                        gap={6}
                    >
                        {isGenerating && <ActivityIndicator size={10} color={statusDetails.text}/>}
                        <CustomText
                            size="p3Medium"
                            color={statusDetails.text}
                            style={{fontSize: 11}}
                        >
                            {statusDetails.label}
                        </CustomText>
                    </XStack>
                </XStack>

                <XStack gap={16} paddingVertical={4} borderTopWidth={1} borderTopColor="$gray-93" paddingTop={10}>
                    <XStack alignItems="center" gap={6}>
                        <Feather name="book-open" size={14} color="#A68A63" />
                        <CustomText size="p2Regular" color="$gray-40">
                            {i18n.t("pages_range", {start: test.startPage, end: test.endPage})}
                        </CustomText>
                    </XStack>
                    <XStack alignItems="center" gap={6}>
                        <Feather name="help-circle" size={14} color="#A68A63" />
                        <CustomText size="p2Regular" color="$gray-40">
                            {i18n.t("test_button_questions_amount", {questionsAmount: test.questionsAmount})}
                        </CustomText>
                    </XStack>
                </XStack>

                {test.completed === CompleteStatus.COMPLETED && (
                    <XStack
                        justifyContent="space-between"
                        alignItems="center"
                        backgroundColor="#FBEAD9"
                        padding={10}
                        borderRadius={14}
                    >
                        <CustomText size="p2Medium" color="#A8451F">
                            {i18n.t("test_status")} {i18n.t("COMPLETED")}
                        </CustomText>
                        <CustomText size="p2Medium" color="#A8451F">
                            {i18n.t("result_grade", {grade: test.grade})}
                        </CustomText>
                    </XStack>
                )}
            </YStack>
        </ThemeableStack>
    );
};

export default TestButton;