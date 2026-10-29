import React, {useEffect, useMemo, useState} from "react";
import {ActivityIndicator, Dimensions} from "react-native";
import {LineChart} from "react-native-gifted-charts";
import {XStack, YStack} from "tamagui";
import Feather from "@expo/vector-icons/Feather";

import {CustomText} from "@/components/CustomText";
import i18n from "@/localization/i18n";
import useApi from "@/hooks/useApi";
import statisticsApi from "@/api/endpoints/statisticsApi";
import {Participant} from "@/types/Paticipant";
import {ReadingSpeedStatsByParticipant} from "@/types/statistics/ReadingSpeedStats";

type Props = {
    // Уже відсортовано бекендом за середньою оцінкою (без оцінок — наприкінці).
    stats: ReadingSpeedStatsByParticipant[];
    // Усі учні, яких бачить користувач — щоб показати й тих, хто ще не читав.
    students: Participant[];
};

const {width: SCREEN_WIDTH} = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 150;
const GRADE_COLOR = "#CB5A2E";

const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1).toString().padStart(2, "0")}`;
};

// Зміна за останні спроби: стрілка й колір показують, покращується учень чи ні.
const TrendBadge = ({trend}: { trend: number | null }) => {
    if (trend == null || Math.abs(trend) < 0.05) {
        return null;
    }
    const improving = trend > 0;
    return (
        <XStack alignItems="center" gap={2}>
            <Feather name={improving ? "arrow-up-right" : "arrow-down-right"} size={14} color={improving ? "#3F8A5D" : "#C1443A"}/>
            <CustomText size="p3Medium" color={improving ? "#3F8A5D" : "#C1443A"}>
                {`${improving ? "+" : ""}${trend.toFixed(1)}`}
            </CustomText>
        </XStack>
    );
};

// Оцінки 1-10 за читання на швидкість: рейтинг учнів за середнім балом
// (для учня — лише він сам) і динаміка оцінок обраного учня по днях.
const GradesStatistics = ({stats, students}: Props) => {
    const [selectedId, setSelectedId] = useState<number | null>(stats[0]?.participant.id ?? null);

    const getDailyApi = useApi(
        statisticsApi.getReadingSpeedDaily,
        {
            errorHandler: {
                title: i18n.t("error_header"),
                message: i18n.t("error_load_statistics"),
                options: {cancel: true},
            },
        },
    );

    useEffect(() => {
        if (selectedId !== null) {
            getDailyApi.execute(selectedId.toString());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId]);

    const notReadYet = useMemo(() => {
        const withStats = new Set(stats.map((item) => item.participant.id));
        return students.filter((student) => !withStats.has(student.id));
    }, [stats, students]);

    const classAverage = useMemo(() => {
        const grades = stats.map((item) => item.averageGrade).filter((grade): grade is number => grade != null);
        return grades.length > 0 ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length : null;
    }, [stats]);

    const chartData = useMemo(() => (getDailyApi.data ?? [])
        .filter((day) => day.averageGrade != null)
        .map((day) => ({
            value: day.averageGrade as number,
            label: formatDate(day.date),
            dataPointText: (day.averageGrade as number).toFixed(1),
        })), [getDailyApi.data]);

    const selectedName = stats.find((item) => item.participant.id === selectedId)?.participant.name;

    if (stats.length === 0 && notReadYet.length === 0) {
        return (
            <CustomText size="p1Regular" color="$gray-40" textAlign="center">
                {i18n.t("reading_history_empty")}
            </CustomText>
        );
    }

    return (
        <YStack gap={16} paddingHorizontal={16}>
            {classAverage !== null && stats.length > 1 && (
                <XStack justifyContent="space-between" alignItems="center">
                    <CustomText size="p1Regular" color="$gray-40">
                        {i18n.t("grades_class_average")}
                    </CustomText>
                    <CustomText size="h3Medium" color={GRADE_COLOR}>
                        {classAverage.toFixed(1)}
                    </CustomText>
                </XStack>
            )}

            <YStack gap={8}>
                {stats.map((item, index) => {
                    const selected = item.participant.id === selectedId;
                    return (
                        <XStack
                            key={item.participant.id}
                            alignItems="center"
                            gap={12}
                            padding={12}
                            borderRadius={16}
                            borderWidth={1}
                            borderColor={selected ? "#E8DCC3" : "#F3E7CE"}
                            backgroundColor={selected ? "#FBF6EC" : "#FFFFFF"}
                            pressStyle={{opacity: 0.9}}
                            onPress={() => setSelectedId(item.participant.id)}
                        >
                            <CustomText size="p2Medium" color="$gray-40" width={22}>
                                {item.averageGrade != null ? `${index + 1}.` : ""}
                            </CustomText>
                            <YStack flex={1} gap={2}>
                                <CustomText size="p1Medium" color="$gray-20" numberOfLines={1}>
                                    {item.participant.name}
                                </CustomText>
                                <CustomText size="p3Regular" color="$gray-40">
                                    {i18n.t("grades_graded_attempts", {count: item.gradedAttemptsCount ?? 0})}
                                    {item.lastGrade != null ? ` · ${i18n.t("grades_last", {grade: item.lastGrade})}` : ""}
                                </CustomText>
                            </YStack>
                            <TrendBadge trend={item.gradeTrend}/>
                            <CustomText size="h4Medium" color={item.averageGrade != null ? GRADE_COLOR : "$gray-60"}>
                                {item.averageGrade != null ? item.averageGrade.toFixed(1) : "—"}
                            </CustomText>
                        </XStack>
                    );
                })}

                {notReadYet.map((student) => (
                    <XStack
                        key={student.id}
                        alignItems="center"
                        gap={12}
                        padding={12}
                        borderRadius={16}
                        borderWidth={1}
                        borderColor="#F3E7CE"
                        backgroundColor="#FFFFFF"
                        opacity={0.7}
                    >
                        <CustomText size="p2Medium" color="$gray-40" width={22}>{""}</CustomText>
                        <CustomText size="p1Medium" color="$gray-20" flex={1} numberOfLines={1}>
                            {student.name}
                        </CustomText>
                        <CustomText size="p3Regular" color="$gray-40">
                            {i18n.t("grades_not_read_yet")}
                        </CustomText>
                    </XStack>
                ))}
            </YStack>

            {selectedId !== null && (
                <YStack gap={8} paddingTop={8}>
                    <CustomText size="h5Medium" color="$gray-20">
                        {i18n.t("grades_dynamics", {name: selectedName ?? ""})}
                    </CustomText>
                    {getDailyApi.loading ? (
                        <ActivityIndicator size="small" color={GRADE_COLOR}/>
                    ) : chartData.length === 0 ? (
                        <CustomText size="p2Regular" color="$gray-40">
                            {i18n.t("grades_no_grades_yet")}
                        </CustomText>
                    ) : (
                        <LineChart
                            data={chartData}
                            color={GRADE_COLOR}
                            thickness={2}
                            dataPointsColor={GRADE_COLOR}
                            width={CHART_WIDTH}
                            height={180}
                            spacing={CHART_WIDTH / Math.max(chartData.length, 4) / 1.5}
                            initialSpacing={16}
                            maxValue={10}
                            noOfSections={5}
                            curved
                            textColor1="#A68A63"
                            textFontSize={10}
                            textShiftY={-6}
                            hideDataPoints={chartData.length > 12}
                            yAxisTextStyle={{fontSize: 11, color: "#A68A63"}}
                            xAxisLabelTextStyle={{fontSize: 11, color: "#A68A63"}}
                            xAxisColor="#E8DCC3"
                            yAxisColor="#E8DCC3"
                            rulesColor="#E8DCC3"
                            rulesType="dashed"
                            dashWidth={5}
                            dashGap={5}
                            isAnimated
                            animationDuration={300}
                        />
                    )}
                </YStack>
            )}
        </YStack>
    );
};

export default GradesStatistics;
