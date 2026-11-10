import React, {FC} from "react";
import {ActivityIndicator} from "react-native";
import {XStack, YStack} from "tamagui";

import {CustomText} from "@/components/CustomText";
import i18n from "@/localization/i18n";
import {GRADE_COMPONENT_MAX, gradeColors, GRADE_MAX} from "@/constants/readingGrade";

export type GradeBreakdownData = {
    speedScore: number | null | undefined;
    pronunciationScore: number | null | undefined;
    comprehensionScore: number | null | undefined;
    wpm: number | null | undefined;
    accuracy: number | null | undefined;
    quizTotal: number | null | undefined;
    quizCorrect: number | null | undefined;
};

// Одна плитка: назва показника зверху, бал «4/5» по центру, під ним — сирий
// показник, з якого бал порахований (сл/хв, % правильно, відповіді тесту).
const ScoreTile: FC<{
    label: string;
    score: number | null | undefined;
    metric: string;
    pending: boolean;
}> = ({label, score, metric, pending}) => {
    // Колір як у підсумкової оцінки, перерахований з 0-5 на 0-15.
    const colors = score != null ? gradeColors(score * (GRADE_MAX / GRADE_COMPONENT_MAX)) : null;
    return (
        <YStack
            flex={1}
            alignItems="center"
            gap={4}
            paddingVertical={8}
            paddingHorizontal={4}
            borderRadius={12}
            backgroundColor="$gray-93"
        >
            <CustomText size="p3Regular" color="$gray-40" numberOfLines={1}>
                {label}
            </CustomText>
            {colors && score != null ? (
                <XStack backgroundColor={colors.bg} paddingHorizontal={8} paddingVertical={1} borderRadius={999}>
                    <CustomText size="p2Medium" color={colors.text}>
                        {score}/{GRADE_COMPONENT_MAX}
                    </CustomText>
                </XStack>
            ) : pending ? (
                <ActivityIndicator size="small" color="#A68A63"/>
            ) : (
                <CustomText size="p2Medium" color="$gray-60">—</CustomText>
            )}
            <CustomText size="p3Regular" color="$gray-20" numberOfLines={1}>
                {metric}
            </CustomText>
        </YStack>
    );
};

// Три складові оцінки читання на швидкість у картках результатів.
export const GradeBreakdown: FC<{data: GradeBreakdownData; pending?: boolean}> = ({data, pending = false}) => {
    const hasQuiz = data.quizTotal != null && data.quizTotal > 0;
    return (
        <XStack gap={6}>
            <ScoreTile
                label={i18n.t("reading_grade_speed")}
                score={data.speedScore}
                metric={data.wpm != null ? i18n.t("reading_results_wpm", {wpm: Math.round(data.wpm)}) : "—"}
                pending={pending}
            />
            <ScoreTile
                label={i18n.t("reading_grade_pronunciation")}
                score={data.pronunciationScore}
                metric={data.accuracy != null
                    ? i18n.t("reading_metric_correct_percent", {percent: Math.round(data.accuracy * 100)})
                    : "—"}
                pending={pending}
            />
            <ScoreTile
                label={i18n.t("reading_grade_comprehension")}
                score={data.comprehensionScore}
                metric={hasQuiz
                    ? i18n.t("reading_metric_quiz", {correct: data.quizCorrect ?? "—", total: data.quizTotal})
                    : i18n.t("reading_grade_no_quiz")}
                pending={pending && hasQuiz}
            />
        </XStack>
    );
};
