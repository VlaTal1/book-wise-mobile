import {Access} from "@/types/Access";

export type Book = {
    id: number;
    title: string;
    author: string;
    fileName: string;
    originalFileName: string;
    fileSize: number;
    fileType: string;
    // Ключ книги з вбудованого каталогу; null — книга, завантажена вчителем.
    catalogKey?: string | null;
    accesses: Access[]
}

// Предзаготовлена книга з каталогу застосунку.
export type CatalogBook = {
    key: string;
    title: string;
    author: string;
    grade?: number;
}