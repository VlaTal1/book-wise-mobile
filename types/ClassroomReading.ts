// Фрагмент книги для читання на швидкість, призначений вчителем класу.
// null у timeLimitSeconds / maxAttempts — без обмежень.
// FIXED — фрагмент, обраний вчителем; RANDOM — щоразу випадковий уривок з книги.
export type ReadingMode = "FIXED" | "RANDOM";

export type ClassroomReading = {
    id: number;
    classroomId: number;
    mode: ReadingMode;
    bookId: number;
    bookTitle: string;
    // Сторінки, обсяг і початок тексту — лише для FIXED.
    startPage: number | null;
    endPage: number | null;
    wordCount: number | null;
    preview: string | null;
    timeLimitSeconds: number | null;
    maxAttempts: number | null;
    // Лише для вчителя (сторінка класу).
    studentsCount?: number | null;
    completedCount?: number | null;
    // Лише для учня (свої завдання).
    attemptsUsed?: number | null;
    bestGrade?: number | null;
}

export type ClassroomReadingRequest = {
    mode: ReadingMode;
    bookId: number;
    startPage?: number;
    endPage?: number;
    startParagraph?: number;
    endParagraph?: number;
    timeLimitSeconds: number | null;
    maxAttempts: number | null;
}

export type StudentReadingResult = {
    participantId: number;
    participantName: string;
    attemptsCount: number;
    bestGrade: number | null;
    bestAttemptId: number | null;
    bestWpm: number | null;
    gradePending: boolean;
}

export type ClassroomReadingResults = {
    reading: ClassroomReading;
    // Від найкращої оцінки до найгіршої; без оцінки — у кінці.
    students: StudentReadingResult[];
}
