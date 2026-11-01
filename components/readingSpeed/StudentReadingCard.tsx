import React, {FC} from "react";
import {XStack, YStack} from "tamagui";

import {CustomText} from "@/components/CustomText";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import {formatFragment, formatTimeLimit} from "@/components/buttons/ClassroomReadingCard";
import i18n from "@/localization/i18n";
import {ClassroomReading} from "@/types/ClassroomReading";

type Props = {
    reading: ClassroomReading;
    onStart: () => void;
};

// Завдання від вчителя на екрані читання учня: що читати, скільки часу,
// скільки спроб лишилося і найкраща оцінка.
export const StudentReadingCard: FC<Props> = ({reading, onStart}) => {
    const used = reading.attemptsUsed ?? 0;
    const attemptsLeft = reading.maxAttempts === null ? null : Math.max(reading.maxAttempts - used, 0);
    const exhausted = attemptsLeft === 0;

    return (
        <YStack
            backgroundColor="#FFFFFF"
            borderRadius={20}
            padding={16}
            borderWidth={1}
            borderColor="$gray-85"
            gap={10}
        >
            <YStack gap={2}>
                <CustomText size="h5Medium" color="$gray-20" numberOfLines={2}>
                    {reading.bookTitle}
                </CustomText>
                <CustomText size="p3Regular" color="$gray-40">
                    {formatFragment(reading)}
                    {" · "}
                    {reading.timeLimitSeconds === null ? i18n.t("reading_no_time_limit_hint") : formatTimeLimit(reading.timeLimitSeconds)}
                </CustomText>
            </YStack>
            {reading.preview && (
                <CustomText size="p2Regular" color="$gray-40" fontStyle="italic" numberOfLines={2}>
                    {reading.preview}
                </CustomText>
            )}
            <XStack justifyContent="space-between" alignItems="center" gap={8}>
                <YStack flex={1} gap={2}>
                    <CustomText size="p2Regular" color={exhausted ? "$error-primary" : "$gray-40"}>
                        {attemptsLeft === null
                            ? i18n.t("reading_attempts_unlimited")
                            : exhausted
                                ? i18n.t("reading_no_attempts_left")
                                : i18n.t("reading_attempts_left", {count: attemptsLeft})}
                    </CustomText>
                    {reading.bestGrade != null && (
                        <CustomText size="p2Medium" color="$gray-20">
                            {i18n.t("reading_best_grade", {grade: `${reading.bestGrade}/10`})}
                        </CustomText>
                    )}
                </YStack>
                <PrimaryButton
                    text={i18n.t("reading_start_assignment")}
                    onPress={onStart}
                    disabled={exhausted}
                    width={120}
                />
            </XStack>
        </YStack>
    );
};
