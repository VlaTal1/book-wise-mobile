import apiRequest, {ApiResponse, getApiBaseUrl} from "@/api";
import {getAccessToken} from "@/auth/supabase";
import {ReadingSpeedAttempt} from "@/types/ReadingSpeed";

const readingSpeedAttemptApi = {
    // Використовується екраном результатів читання для опитування статусу
    // асинхронного шару перевірки наголосу (stressStatus), поки триває
    // обробка на бекенді (app/(app)/readingSpeed/index.tsx), а також екраном
    // деталей історії читання (app/(app)/readingHistory/[id].tsx).
    getById: async (id: number): Promise<ApiResponse<ReadingSpeedAttempt>> => {
        return apiRequest<ReadingSpeedAttempt>({
            path: `/api/reading-speed-attempts/${id}`,
            method: "GET",
        });
    },

    // Дитячий режим — історія лише цієї дитини.
    getHistory: async (participantId: string): Promise<ApiResponse<ReadingSpeedAttempt[]>> => {
        return apiRequest<ReadingSpeedAttempt[]>({
            path: `/api/reading-speed-attempts/participant/${participantId}`,
            method: "GET",
        });
    },

    // Батьківський режим — історія по УСІХ дітях поточного користувача
    // одним списком (кожен елемент несе participantName).
    getAllHistory: async (): Promise<ApiResponse<ReadingSpeedAttempt[]>> => {
        return apiRequest<ReadingSpeedAttempt[]>({
            path: "/api/reading-speed-attempts",
            method: "GET",
        });
    },

    deleteAttempt: async (id: number): Promise<ApiResponse<null>> => {
        return apiRequest<null>({
            path: `/api/reading-speed-attempts/${id}`,
            method: "DELETE",
            responseType: "none",
        });
    },

    // expo-audio (useAudioPlayer) приймає AudioSource у формі {uri, headers}
    // — саме так передаємо Bearer-токен на захищений ендпоінт, окремого
    // публічного/підписаного URL на аудіо немає.
    getAudioSource: async (id: number): Promise<{ uri: string; headers: Record<string, string> }> => {
        const token = await getAccessToken();
        return {
            uri: `${getApiBaseUrl()}/api/reading-speed-attempts/${id}/audio`,
            headers: token ? {Authorization: `Bearer ${token}`} : {},
        };
    },
};

export default readingSpeedAttemptApi;
