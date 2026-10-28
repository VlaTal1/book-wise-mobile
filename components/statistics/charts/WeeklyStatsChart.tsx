import React, {useMemo, useState} from "react";
import {Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ScrollView} from "react-native";
import {BarChart} from "react-native-gifted-charts";

import i18n from "@/localization/i18n";
import {WeeklyStatsByParticipant} from "@/types/statistics/YearStatistics";

type Props = {
    data: WeeklyStatsByParticipant[];
};

interface ChartDataItem {
    label: string;
    value: number;
    frontColor: string;
    topLabelComponent: () => React.JSX.Element;
    weekKey?: string;
    minutes?: number;
    rating?: number;
}

const {width: SCREEN_WIDTH} = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 50;

const WeeklyStatsChart: React.FC<Props> = ({data}) => {
    const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(
        data.length > 0 ? data[0].participant.id : null,
    );

    const formatWeekForDisplay = (weekStr: string): string => {
        const week = weekStr.split("-W")[1];
        return `W ${week}`;
    };

    const {weeklyChartsData, summaryData} = useMemo(() => {
        if (!selectedParticipantId) {
            return {weeklyChartsData: {pages: [], time: [], rating: []}, summaryData: {totalPages: 0, totalMinutes: 0, avgRating: 0}};
        }

        const selectedParticipant = data.find(
            (item) => item.participant.id === selectedParticipantId,
        );

        if (!selectedParticipant) {
            return {weeklyChartsData: {pages: [], time: [], rating: []}, summaryData: {totalPages: 0, totalMinutes: 0, avgRating: 0}};
        }

        const sortedWeeks = Object.keys(selectedParticipant.weeklyStats).sort();

        const weeklyChartsData = sortedWeeks.map((week) => {
            const stats = selectedParticipant.weeklyStats[week];
            return {
                label: formatWeekForDisplay(week),
                weekKey: week,
                value: stats.totalPagesRead,
                frontColor: "#3F8A5D",
                minutes: Math.round(stats.totalReadingTimeMinutes),
                rating: Number(stats.averageRating.toFixed(1)),
                topLabelComponent: () => (
                    <Text style={styles.topLabel}>{stats.totalPagesRead}</Text>
                ),
            };
        });

        const timeData = sortedWeeks.map((week) => {
            const stats = selectedParticipant.weeklyStats[week];
            return {
                label: formatWeekForDisplay(week),
                value: Math.round(stats.totalReadingTimeMinutes),
                frontColor: "#2F6F62",
                topLabelComponent: () => (
                    <Text style={styles.topLabel}>{Math.round(stats.totalReadingTimeMinutes)}</Text>
                ),
            };
        });

        const ratingData = sortedWeeks.map((week) => {
            const stats = selectedParticipant.weeklyStats[week];
            return {
                label: formatWeekForDisplay(week),
                value: stats.averageRating,
                frontColor: "#D69E2E",
                topLabelComponent: () => (
                    <Text style={styles.topLabel}>{stats.averageRating.toFixed(1)}</Text>
                ),
            };
        });

        const summaryData = {
            totalPages: sortedWeeks.reduce((sum, week) => sum + selectedParticipant.weeklyStats[week].totalPagesRead, 0),
            totalMinutes: Math.round(sortedWeeks.reduce((sum, week) => sum + selectedParticipant.weeklyStats[week].totalReadingTimeMinutes, 0)),
            avgRating: sortedWeeks.length > 0
                ? Number((sortedWeeks.reduce((sum, week) => sum + selectedParticipant.weeklyStats[week].averageRating, 0) / sortedWeeks.length).toFixed(1))
                : 0,
        };

        return {
            weeklyChartsData: {
                pages: weeklyChartsData,
                time: timeData,
                rating: ratingData,
            },
            summaryData,
        };
    }, [data, selectedParticipantId]);

    const chartConfig = {
        width: CHART_WIDTH,
        height: 220,
        spacing: CHART_WIDTH / 4,
        showYAxisIndices: true,
        showXAxisIndices: false,
        hideYAxisText: false,
        yAxisTextStyle: styles.axisText,
        xAxisLabelTextStyle: styles.axisText,
        isAnimated: true,
        animationDuration: 800,
        noOfSections: 4,
        maxValue: undefined,
    };

    const renderParticipantSelector = () => (
        <View style={styles.selectorContainer}>
            <Text style={styles.selectorTitle}>{i18n.t("select_student")}</Text>
            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                <View style={styles.participantButtons}>
                    {data.map((item) => (
                        <TouchableOpacity
                            key={item.participant.id}
                            style={[
                                styles.participantButton,
                                selectedParticipantId === item.participant.id &&
                                styles.selectedParticipantButton,
                            ]}
                            onPress={() => setSelectedParticipantId(item.participant.id)}
                        >
                            <Text
                                style={[
                                    styles.participantButtonText,
                                    selectedParticipantId === item.participant.id &&
                                    styles.selectedParticipantButtonText,
                                ]}
                            >
                                {item.participant.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );

    const renderChart = (
        title: string,
        chartData: ChartDataItem[],
        maxValueOverride?: number,
    ) => {
        if (chartData.length === 0) {
            return (
                <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>{title}</Text>
                    <Text style={styles.noDataText}>Нет данных</Text>
                </View>
            );
        }

        const maxValue = maxValueOverride || Math.max(...chartData.map((item) => item.value));
        const adjustedMaxValue = maxValue + Math.ceil(maxValue * 0.2);

        return (
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>{title}</Text>
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                    <BarChart
                        data={chartData}
                        {...chartConfig}
                        width={Math.max(CHART_WIDTH, chartData.length * 80)}
                        maxValue={adjustedMaxValue}
                        spacing={CHART_WIDTH / 10}
                    />
                </ScrollView>
            </View>
        );
    };

    const renderSummaryCards = () => (
        <View style={styles.summaryContainer}>
            <View style={styles.summaryCards}>
                <View style={[styles.summaryCard, {backgroundColor: "#E7F3EA"}]}>
                    <Text style={[styles.summaryValue, {color: "#3F8A5D"}]}>
                        {summaryData.totalPages}
                    </Text>
                    <Text style={styles.summaryLabel}>{i18n.t("total_pages")}</Text>
                </View>
                <View style={[styles.summaryCard, {backgroundColor: "#E1F0EA"}]}>
                    <Text style={[styles.summaryValue, {color: "#2F6F62"}]}>
                        {summaryData.totalMinutes}
                    </Text>
                    <Text style={styles.summaryLabel}>{i18n.t("total_minutes")}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {renderParticipantSelector()}

                {renderSummaryCards()}

                <View style={styles.chartsContainer}>
                    {weeklyChartsData.pages && renderChart(
                        i18n.t("pages_by_week"),
                        weeklyChartsData.pages,
                    )}

                    {weeklyChartsData.time && renderChart(
                        i18n.t("minutes_by_week"),
                        weeklyChartsData.time,
                    )}
                </View>

                {weeklyChartsData.pages?.length === 0 && (
                    <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>Нет данных для отображения</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FBF6EC",
    },
    pageTitle: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 20,
        marginTop: 10,
        color: "#3A2E20",
        textAlign: "center",
        paddingHorizontal: 16,
    },
    selectorContainer: {
        marginBottom: 20,
        paddingHorizontal: 16,
    },
    selectorTitle: {
        fontSize: 16,
        marginBottom: 10,
        color: "#3A2E20",
        fontWeight: "600",
    },
    participantButtons: {
        flexDirection: "row",
        gap: 10,
        paddingRight: 16,
    },
    participantButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: "#F3E7CE",
        borderWidth: 1,
        borderColor: "#E8DCC3",
    },
    selectedParticipantButton: {
        backgroundColor: "#CB5A2E",
        borderColor: "#CB5A2E",
    },
    participantButtonText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#3A2E20",
    },
    selectedParticipantButtonText: {
        color: "#FFFFFF",
    },
    summaryContainer: {
        marginBottom: 20,
        paddingHorizontal: 16,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#3A2E20",
        marginBottom: 12,
    },
    summaryCards: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
    },
    summaryCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 12,
        color: "#7A6248",
        textAlign: "center",
    },
    chartsContainer: {
        gap: 20,
        paddingBottom: 20,
    },
    chartContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        shadowColor: "#1A1209",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 15,
        color: "#3A2E20",
    },
    axisText: {
        fontSize: 10,
        color: "#7A6248",
        fontWeight: "500",
    },
    topLabel: {
        fontSize: 10,
        color: "#3A2E20",
        fontWeight: "600",
        textAlign: "center",
    },
    noDataText: {
        fontSize: 14,
        color: "#8A7454",
        textAlign: "center",
        marginVertical: 20,
    },
    noDataContainer: {
        paddingVertical: 40,
        paddingHorizontal: 16,
    },
});

export default WeeklyStatsChart;