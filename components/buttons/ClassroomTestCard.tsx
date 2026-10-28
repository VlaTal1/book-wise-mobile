import React, {FC, useMemo} from "react";
import {ActivityIndicator} from "react-native";
import {XStack, YStack} from "tamagui";
import Feather from "@expo/vector-icons/Feather";

import {CustomText} from "@/components/CustomText";
import i18n from "@/localization/i18n";
import {ClassroomTest} from "@/types/Classroom";

type Props = {
    test: ClassroomTest;
    onRegenerate: () => void;
    onDelete: () => void;
    disabled?: boolean;
};

// Тест класу на сторінці класу у вчителя: стан генерації, скільки учнів
// пройшли, перегенерація (якщо генерація впала) і видалення.
const ClassroomTestCard: FC<Props> = ({test, onRegenerate, onDelete, disabled = false}) => {
    const status = useMemo(() => {
        switch (test.generationStatus) {
            case "GENERATING":
                return {bg: "#EEF1F6", text: "#4A5A78", label: i18n.t("test_generating")};
            case "FAILED":
                return {bg: "#FBEAE8", text: "#C1443A", label: i18n.t("test_generation_failed")};
            default:
                return {bg: "#E7F3EA", text: "#2F6B45", label: i18n.t("test_ready")};
        }
    }, [test.generationStatus]);

    return (
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
                        {test.bookTitle}
                    </CustomText>
                    <CustomText size="p3Regular" color="$gray-40">
                        {i18n.t("pages_range", {start: test.startPage, end: test.endPage})}
                        {" · "}
                        {i18n.t("test_button_questions_amount", {questionsAmount: test.questionsAmount})}
                    </CustomText>
                </YStack>
                <XStack
                    backgroundColor={status.bg}
                    paddingHorizontal={10}
                    paddingVertical={4}
                    borderRadius={999}
                    alignItems="center"
                    gap={6}
                >
                    {test.generationStatus === "GENERATING" && <ActivityIndicator size={10} color={status.text}/>}
                    <CustomText size="p3Medium" color={status.text} style={{fontSize: 11}}>
                        {status.label}
                    </CustomText>
                </XStack>
            </XStack>

            <XStack
                justifyContent="space-between"
                alignItems="center"
                borderTopWidth={1}
                borderTopColor="$gray-93"
                paddingTop={10}
                gap={8}
            >
                <CustomText size="p2Regular" color="$gray-40">
                    {i18n.t("classroom_test_completed", {completed: test.completedCount, total: test.testsCount})}
                </CustomText>
                <XStack gap={14} alignItems="center">
                    {test.generationStatus === "FAILED" && (
                        <XStack
                            alignItems="center"
                            gap={4}
                            pressStyle={{opacity: 0.6}}
                            onPress={disabled ? undefined : onRegenerate}
                            opacity={disabled ? 0.5 : 1}
                        >
                            <Feather name="refresh-cw" size={14} color="#CB5A2E"/>
                            <CustomText size="p2Medium" color="#CB5A2E">
                                {i18n.t("regenerate_test")}
                            </CustomText>
                        </XStack>
                    )}
                    <XStack
                        pressStyle={{opacity: 0.6}}
                        onPress={disabled ? undefined : onDelete}
                        opacity={disabled ? 0.5 : 1}
                        hitSlop={8}
                    >
                        <Feather name="trash-2" size={16} color="#C1443A"/>
                    </XStack>
                </XStack>
            </XStack>
        </YStack>
    );
};

export default ClassroomTestCard;
