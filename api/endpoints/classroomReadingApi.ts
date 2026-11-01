import apiRequest, {ApiResponse} from "@/api";
import {ClassroomReading, ClassroomReadingRequest, ClassroomReadingResults} from "@/types/ClassroomReading";

const classroomReadingApi = {
    // Абзаци чистого тексту сторінок книги — вчитель обирає перший і останній.
    previewParagraphs: async ({classroomId, bookId, startPage, endPage}: {
        classroomId: string;
        bookId: number;
        startPage: number;
        endPage: number;
    }): Promise<ApiResponse<string[]>> => {
        return apiRequest<string[]>({
            path: `/api/classrooms/${classroomId}/reading-preview`,
            queryParams: {
                bookId: bookId.toString(),
                startPage: startPage.toString(),
                endPage: endPage.toString(),
            },
        });
    },
    createReading: async ({classroomId, reading}: {
        classroomId: string;
        reading: ClassroomReadingRequest;
    }): Promise<ApiResponse<ClassroomReading>> => {
        return apiRequest<ClassroomReading>({
            path: `/api/classrooms/${classroomId}/readings`,
            method: "POST",
            body: reading,
            headers: {
                "Accept": "application/json",
            },
        });
    },
    deleteReading: async ({classroomId, readingId}: {
        classroomId: string;
        readingId: string;
    }): Promise<ApiResponse<void>> => {
        return apiRequest<void>({
            path: `/api/classrooms/${classroomId}/readings/${readingId}`,
            method: "DELETE",
            responseType: "none",
        });
    },
    fetchResults: async ({classroomId, readingId}: {
        classroomId: string;
        readingId: string;
    }): Promise<ApiResponse<ClassroomReadingResults>> => {
        return apiRequest<ClassroomReadingResults>({
            path: `/api/classrooms/${classroomId}/readings/${readingId}/results`,
        });
    },
    // Учень — завдання свого класу зі своїми спробами й найкращою оцінкою.
    fetchMyReadings: async (): Promise<ApiResponse<ClassroomReading[]>> => {
        return apiRequest<ClassroomReading[]>({
            path: "/api/classroom-readings/my",
        });
    },
};

export default classroomReadingApi;
