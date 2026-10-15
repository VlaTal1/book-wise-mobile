import React from "react";

import {GradeByParticipant} from "@/types/statistics/GradeByParticipant";
import {StatisticsType} from "@/types/statistics";
import AvgGradeChart from "@/components/statistics/charts/AvgGradeChart";
import ReadingStatsPage from "@/components/statistics/charts/ReadingStatsPage";
import {ParticipantDailyStats} from "@/types/statistics/DailyStatistics";
import WeeklyStatsChart from "@/components/statistics/charts/WeeklyStatsChart";
import {WeeklyStatsByParticipant} from "@/types/statistics/YearStatistics";

const StatisticsChart = ({avgData, dailyData, weeklyData, type}: {
    avgData?: GradeByParticipant[],
    dailyData?: ParticipantDailyStats[],
    weeklyData?: WeeklyStatsByParticipant[],
    type: StatisticsType
}) => {
    if (type === "avgGrade" && avgData) {
        return (
            <AvgGradeChart data={avgData}/>
        );
    }

    if (type === "daily" && dailyData) {
        return (
            <ReadingStatsPage data={dailyData}/>
        )
    }

    if (type === "weekly" && weeklyData) {
        return (
            <WeeklyStatsChart data={weeklyData}/>
        )
    }
}

export default StatisticsChart;
