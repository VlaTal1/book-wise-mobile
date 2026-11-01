import apiRequest, {ApiResponse} from "@/api";
import {Book, CatalogBook} from "@/types/Book";

const bookApi = {
    uploadBook: async ({formData}: {
        formData: FormData;
    }): Promise<ApiResponse<Book>> => {
        return apiRequest<Book>({
            path: "/api/books",
            method: "POST",
            body: formData,
            headers: {
                "Accept": "application/json",
            },
        });
    },
    fetchBooks: async (): Promise<ApiResponse<Book[]>> => {
        return apiRequest<Book[]>({
            path: "/api/books",
        });
    },
    fetchCatalog: async (): Promise<ApiResponse<CatalogBook[]>> => {
        return apiRequest<CatalogBook[]>({
            path: "/api/books/catalog",
        });
    },
    // Додає книгу з каталогу до бібліотеки вчителя (повторний виклик повертає ту саму книгу).
    addCatalogBook: async (key: string): Promise<ApiResponse<Book>> => {
        return apiRequest<Book>({
            path: `/api/books/catalog/${encodeURIComponent(key)}`,
            method: "POST",
            headers: {
                "Accept": "application/json",
            },
        });
    },
    fetchBooksByParticipantId: async (participantId: string): Promise<ApiResponse<Book[]>> => {
        return apiRequest<Book[]>({
            path: `/api/books/participant/${participantId}`,
        });
    },
    fetchBookById: async ({bookId}: {
        bookId: string;
    }): Promise<ApiResponse<Book>> => {
        return apiRequest<Book>({
            path: `/api/books/${bookId}`,
        });
    },
};

export default bookApi;