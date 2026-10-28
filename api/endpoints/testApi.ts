import apiRequest, {ApiResponse} from "@/api";
import {Test} from "@/types/Test";

const testApi = {
    fetchTestsByParticipantId: async (participantId: string): Promise<ApiResponse<Test[]>> => {
        return apiRequest<Test[]>({
            path: `/api/test/participant/${participantId}`,
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        });
    },
    fetchTestsByParticipantIdAndBookId: async ({participantId, bookId}: {
        participantId: string,
        bookId: string
    }): Promise<ApiResponse<Test[]>> => {
        return apiRequest<Test[]>({
            path: `/api/test/participant/${participantId}/book/${bookId}`,
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        });
    },
    fetchTests: async (): Promise<ApiResponse<Test[]>> => {
        return apiRequest<Test[]>({
            path: "/api/test/",
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        });
    },
    fetchFirstTestByParticipantIdAndBookId: async ({participantId, bookId}: {
        participantId: string,
        bookId: string,
    }): Promise<ApiResponse<Test>> => {
        return apiRequest<Test>({
            path: `/api/test/participant/${participantId}/book/${bookId}/firstTest`,
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        });
    },
    saveTest: async (test: Test): Promise<ApiResponse<Test>> => {
        return apiRequest<Test>({
            path: "/api/test/pass",
            method: "POST",
            body: test,
            headers: {
                "Accept": "application/json",
            },
        });
    },
};

export default testApi;