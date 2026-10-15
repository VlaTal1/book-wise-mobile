import apiRequest, {ApiResponse} from "@/api";
import {GradeByParticipant} from "@/types/statistics/GradeByParticipant";
import {ParticipantDailyStats} from "@/types/statistics/DailyStatistics";
import {WeeklyStatsByParticipant} from "@/types/statistics/YearStatistics";
import {ReadingSpeedStatsByParticipant} from "@/types/statistics/ReadingSpeedStats";
import {ReadingSpeedDailyStats} from "@/types/statistics/ReadingSpeedDailyStats";

const statisticsApi = {
    getAvgGrade: async (): Promise<ApiResponse<GradeByParticipant[]>> => {
        return apiRequest<GradeByParticipant[]>({
            path: "/api/statistics/participants/avgGrade",
        });
    },
    getDaily: async (): Promise<ApiResponse<ParticipantDailyStats[]>> => {
        return apiRequest<ParticipantDailyStats[]>({
            path: "/api/statistics/participants/daily",
        });
    },
    getWeekly: async (): Promise<ApiResponse<WeeklyStatsByParticipant[]>> => {
        return apiRequest<WeeklyStatsByParticipant[]>({
            path: "/api/statistics/participants/weekly",
        });
    },
    getReadingSpeed: async (): Promise<ApiResponse<ReadingSpeedStatsByParticipant[]>> => {
        return apiRequest<ReadingSpeedStatsByParticipant[]>({
            path: "/api/statistics/participants/reading-speed",
        });
    },
    getReadingSpeedDaily: async (participantId: string): Promise<ApiResponse<ReadingSpeedDailyStats[]>> => {
        return apiRequest<ReadingSpeedDailyStats[]>({
            path: `/api/statistics/participants/${participantId}/reading-speed/daily`,
        });
    },
};

export default statisticsApi;