import apiRequest, {ApiResponse} from "@/api";
import {ReadingSpeedAttempt} from "@/types/ReadingSpeed";

const readingSpeedAttemptApi = {
    // Використовується екраном результатів читання для опитування статусу
    // асинхронного шару перевірки наголосу (stressStatus), поки триває
    // обробка на бекенді — див. app/(app)/readingSpeed/index.tsx.
    getById: async (id: number): Promise<ApiResponse<ReadingSpeedAttempt>> => {
        return apiRequest<ReadingSpeedAttempt>({
            path: `/api/reading-speed-attempts/${id}`,
            method: "GET",
        });
    },
};

export default readingSpeedAttemptApi;
