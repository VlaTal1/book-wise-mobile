import React, {FC, ReactNode} from "react";
import {ActivityIndicator} from "react-native";
import {XStack, YStack} from "tamagui";

import {CustomText} from "@/components/CustomText";
import {GRADE_COMPONENT_MAX} from "@/constants/readingGrade";

const ACCENT = "#CB5A2E";

// Блок одного показника оцінки: назва й бал «3/4» праворуч, під ними —
// сирі показники, з яких цей бал порахований.
export const ScoreSection: FC<{
    title: string;
    score: number | null | undefined;
    pending: boolean;
    children: ReactNode;
}> = ({title, score, pending, children}) => (
    <YStack gap={6} paddingTop={14} borderTopWidth={1} borderColor="$gray-85">
        <XStack justifyContent="space-between" alignItems="center">
            <CustomText size="h5Medium" color="$gray-20">
                {title}
            </CustomText>
            {score != null ? (
                <XStack backgroundColor="#FBEAD9" paddingHorizontal={10} paddingVertical={2} borderRadius={999}>
                    <CustomText size="h5Medium" color={ACCENT}>
                        {score}/{GRADE_COMPONENT_MAX}
                    </CustomText>
                </XStack>
            ) : pending ? (
                <ActivityIndicator size="small" color={ACCENT}/>
            ) : (
                <CustomText size="h5Medium" color="$gray-40">—</CustomText>
            )}
        </XStack>
        {children}
    </YStack>
);

// Рядок сирого показника всередині блоку.
export const MetricLine: FC<{ label: string; value: ReactNode }> = ({label, value}) => (
    <XStack justifyContent="space-between" alignItems="center">
        <CustomText size="p1Regular" color="$gray-40">
            {label}
        </CustomText>
        {typeof value === "string" || typeof value === "number" ? (
            <CustomText size="p1Medium" color="$gray-20">
                {value}
            </CustomText>
        ) : value}
    </XStack>
);
