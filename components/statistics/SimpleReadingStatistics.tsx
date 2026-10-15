import React, {useEffect, useMemo, useState} from "react";
import {ActivityIndicator} from "react-native";
import {YStack} from "tamagui";

import useApi from "@/hooks/useApi";
import i18n from "@/localization/i18n";
import statisticsApi from "@/api/endpoints/statisticsApi";
import {GradeByParticipant} from "@/types/statistics/GradeByParticipant";
import SegmentedControl from "@/components/SegmentedControl";
import StatisticsChart from "@/components/statistics/charts";
import {StatisticsType} from "@/types/statistics";
import {ParticipantDailyStats} from "@/types/statistics/DailyStatistics";
import {WeeklyStatsByParticipant} from "@/types/statistics/YearStatistics";

// "Просте" читання — оцінки за тести й сторінки/час читання (ReadingSession,
// не пов'язано з WPM-фічею вимірювання швидкості читання, див. сусідній
// ReadingSpeedStatistics). Винесено з app/(app)/statistics.tsx як є, без
// змін логіки — лише один з двох зовнішніх табів екрана статистики тепер.
const SimpleReadingStatistics = () => {
    const tabs = useMemo(() => ([
        i18n.t("avg_grade"),
        i18n.t("reading_statistics"),
        i18n.t("weekly_statistics"),
    ]), [])

    const [avgData, setAvgData] = useState<GradeByParticipant[] | undefined>(undefined)
    const [dailyData, setDailyData] = useState<ParticipantDailyStats[] | undefined>(undefined)
    const [weeklyData, setWeeklyData] = useState<WeeklyStatsByParticipant[] | undefined>(undefined)

    const [currentTab, setCurrentTab] = useState(0)
    const [chartType, setChartType] = useState<StatisticsType>("avgGrade")

    const changeTab = (newTab: number) => {
        if (newTab < 0 || newTab >= tabs.length) {
            return
        }
        setCurrentTab(newTab)
        if (newTab === 0) {
            setChartType("avgGrade")
        } else if (newTab === 1) {
            setChartType("daily")
        } else {
            setChartType("weekly")
        }
    }

    const getAvgGradeApi = useApi(
        statisticsApi.getAvgGrade,
        {
            onSuccess: (data) => {
                setAvgData(data)
            },
            errorHandler: {
                title: i18n.t("error_header"),
                message: i18n.t("error_load_statistics"),
                options: {
                    tryAgain: true,
                    navigate: {
                        mode: "back",
                    },
                },
            },
        },
    )

    const getDailyApi = useApi(
        statisticsApi.getDaily,
        {
            onSuccess: (data) => {
                setDailyData(data)
            },
            errorHandler: {
                title: i18n.t("error_header"),
                message: i18n.t("error_load_statistics"),
                options: {
                    tryAgain: true,
                    navigate: {
                        mode: "back",
                    },
                },
            },
        },
    )

    const getWeeklyApi = useApi(
        statisticsApi.getWeekly,
        {
            onSuccess: (data) => {
                setWeeklyData(data)
            },
            errorHandler: {
                title: i18n.t("error_header"),
                message: i18n.t("error_load_statistics"),
                options: {
                    tryAgain: true,
                    navigate: {
                        mode: "back",
                    },
                },
            },
        },
    )

    useEffect(() => {
        if (currentTab === 0) {
            getAvgGradeApi.execute()
        } else if (currentTab === 1) {
            getDailyApi.execute()
        } else {
            getWeeklyApi.execute()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTab]);

    const isCurrentTabLoading = chartType === "avgGrade" ? (getAvgGradeApi.loading || !avgData)
        : chartType === "daily" ? (getDailyApi.loading || !dailyData)
            : (getWeeklyApi.loading || !weeklyData);

    return (
        <YStack gap={16} flex={1}>
            <SegmentedControl
                variant="white"
                options={tabs}
                currentTab={currentTab}
                onChange={changeTab}
            />
            <YStack
                borderRadius={24}
                paddingVertical={20}
                backgroundColor="$gray-100"
                borderWidth={1}
                borderColor="$gray-85"
                height="100%"
                flex={1}
                style={{
                    shadowColor: "rgba(43, 32, 19, 0.06)",
                    shadowOffset: {width: 0, height: 3},
                    shadowRadius: 8,
                    shadowOpacity: 1,
                }}
            >
                {isCurrentTabLoading ? (
                    <ActivityIndicator size="large" color="#CB5A2E"/>
                ) : (
                    <StatisticsChart
                        avgData={avgData}
                        dailyData={dailyData}
                        weeklyData={weeklyData}
                        type={chartType}
                    />
                )}
            </YStack>
        </YStack>
    );
};

export default SimpleReadingStatistics;
