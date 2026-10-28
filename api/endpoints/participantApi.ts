import apiRequest, {ApiResponse} from "@/api";
import {Participant, UserRole} from "@/types/Paticipant";

const participantApi = {
    // 404 — користувач ще не обрав роль після реєстрації.
    fetchMe: async (): Promise<ApiResponse<Participant>> => {
        return apiRequest<Participant>({
            path: "/api/participant/me",
        });
    },
    createMe: async ({name, role}: {
        name: string;
        role: UserRole;
    }): Promise<ApiResponse<Participant>> => {
        return apiRequest<Participant>({
            path: "/api/participant/me",
            method: "POST",
            body: {name, role},
            headers: {
                "Accept": "application/json",
            },
        });
    },
    // Вчитель — усі учні його класів, учень — лише він сам.
    fetchStudents: async (): Promise<ApiResponse<Participant[]>> => {
        return apiRequest<Participant[]>({
            path: "/api/participant/students",
        });
    },
    fetchParticipantById: async (participantId: string): Promise<ApiResponse<Participant>> => {
        return apiRequest<Participant>({
            path: `/api/participant/${participantId}`,
        });
    },
};

export default participantApi;
