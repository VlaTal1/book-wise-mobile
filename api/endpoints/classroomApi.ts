import apiRequest, {ApiResponse} from "@/api";
import {Classroom, ClassroomDetails, ClassroomTestRequest} from "@/types/Classroom";
import {Test} from "@/types/Test";

const classroomApi = {
    createClassroom: async ({name}: {
        name: string;
    }): Promise<ApiResponse<Classroom>> => {
        return apiRequest<Classroom>({
            path: "/api/classrooms",
            method: "POST",
            body: {name},
            headers: {
                "Accept": "application/json",
            },
        });
    },
    fetchClassrooms: async (): Promise<ApiResponse<Classroom[]>> => {
        return apiRequest<Classroom[]>({
            path: "/api/classrooms",
        });
    },
    fetchClassroomById: async (classroomId: string): Promise<ApiResponse<ClassroomDetails>> => {
        return apiRequest<ClassroomDetails>({
            path: `/api/classrooms/${classroomId}`,
        });
    },
    deleteClassroom: async (classroomId: string): Promise<ApiResponse<void>> => {
        return apiRequest<void>({
            path: `/api/classrooms/${classroomId}`,
            method: "DELETE",
            responseType: "none",
        });
    },
    joinClassroom: async ({code}: {
        code: string;
    }): Promise<ApiResponse<Classroom>> => {
        return apiRequest<Classroom>({
            path: "/api/classrooms/join",
            method: "POST",
            body: {code},
            headers: {
                "Accept": "application/json",
            },
        });
    },
    assignBook: async ({classroomId, bookId}: {
        classroomId: string;
        bookId: string;
    }): Promise<ApiResponse<ClassroomDetails>> => {
        return apiRequest<ClassroomDetails>({
            path: `/api/classrooms/${classroomId}/books/${bookId}`,
            method: "POST",
            headers: {
                "Accept": "application/json",
            },
        });
    },
    regenerateTest: async ({classroomId, classroomTestId}: {
        classroomId: string;
        classroomTestId: string;
    }): Promise<ApiResponse<ClassroomDetails>> => {
        return apiRequest<ClassroomDetails>({
            path: `/api/classrooms/${classroomId}/tests/${classroomTestId}/regenerate`,
            method: "POST",
            headers: {
                "Accept": "application/json",
            },
        });
    },
    // Разом з тестами учнів, їхніми відповідями й оцінками.
    deleteTest: async ({classroomId, classroomTestId}: {
        classroomId: string;
        classroomTestId: string;
    }): Promise<ApiResponse<ClassroomDetails>> => {
        return apiRequest<ClassroomDetails>({
            path: `/api/classrooms/${classroomId}/tests/${classroomTestId}`,
            method: "DELETE",
            headers: {
                "Accept": "application/json",
            },
        });
    },
    createTest: async ({classroomId, test}: {
        classroomId: string;
        test: ClassroomTestRequest;
    }): Promise<ApiResponse<Test[]>> => {
        return apiRequest<Test[]>({
            path: `/api/classrooms/${classroomId}/tests`,
            method: "POST",
            body: test,
            headers: {
                "Accept": "application/json",
            },
        });
    },
};

export default classroomApi;
