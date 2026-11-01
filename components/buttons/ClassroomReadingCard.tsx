import React, {FC} from "react";
import {XStack, YStack} from "tamagui";
import Feather from "@expo/vector-icons/Feather";

import {CustomText} from "@/components/CustomText";
import i18n from "@/localization/i18n";
import {ClassroomReading} from "@/types/ClassroomReading";

type Props = {
    reading: ClassroomReading;
    onPress: () => void;
    onDelete: () => void;
    disabled?: boolean;
};

export const formatTimeLimit = (seconds: number | null) =>
    seconds === null ? i18n.t("reading_no_time_limit") : i18n.t("minutes_short", {count: Math.round(seconds / 6) / 10});

export const formatAttempts = (maxAttempts: number | null) =>
    maxAttempts === null ? i18n.t("reading_attempts_unlimited") : i18n.t("reading_attempts_value", {count: maxAttempts});

// Фрагмент для читання на сторінці класу у вчителя: книга, сторінки, обсяг,
// умови й скільки учнів уже читали. Натискання — результати по учнях.
const ClassroomReadingCard: FC<Props> = ({reading, onPress, onDelete, disabled = false}) => (
    <YStack
        backgroundColor="#FFFFFF"
        borderRadius={20}
        padding={16}
        borderWidth={1}
        borderColor="$gray-85"
        gap={10}
        pressStyle={{opacity: 0.8}}
        onPress={onPress}
        style={{
            shadowColor: "rgba(43, 32, 19, 0.06)",
            shadowOffset: {width: 0, height: 2},
            shadowRadius: 6,
            shadowOpacity: 1,
        }}
    >
        <YStack gap={2}>
            <CustomText size="h5Medium" color="$gray-20" numberOfLines={2}>
                {reading.bookTitle}
            </CustomText>
            <CustomText size="p3Regular" color="$gray-40">
                {i18n.t("pages_range", {start: reading.startPage, end: reading.endPage})}
                {" · "}
                {i18n.t("reading_words_count", {count: reading.wordCount})}
            </CustomText>
            <CustomText size="p3Regular" color="$gray-40">
                {formatTimeLimit(reading.timeLimitSeconds)}
                {" · "}
                {formatAttempts(reading.maxAttempts)}
            </CustomText>
        </YStack>
        <CustomText size="p2Regular" color="$gray-40" numberOfLines={2} fontStyle="italic">
            {reading.preview}
        </CustomText>
        <XStack
            justifyContent="space-between"
            alignItems="center"
            borderTopWidth={1}
            borderTopColor="$gray-93"
            paddingTop={10}
        >
            <CustomText size="p2Regular" color="$gray-40">
                {i18n.t("classroom_reading_completed", {completed: reading.completedCount ?? 0, total: reading.studentsCount ?? 0})}
            </CustomText>
            <XStack gap={14} alignItems="center">
                <XStack
                    pressStyle={{opacity: 0.6}}
                    onPress={disabled ? undefined : onDelete}
                    opacity={disabled ? 0.5 : 1}
                    hitSlop={8}
                >
                    <Feather name="trash-2" size={16} color="#C1443A"/>
                </XStack>
                <Feather name="chevron-right" size={18} color="#A68A63"/>
            </XStack>
        </XStack>
    </YStack>
);

export default ClassroomReadingCard;
