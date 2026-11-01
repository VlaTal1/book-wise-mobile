// Фрагмент книги для читання на швидкість, призначений вчителем класу.
// null у timeLimitSeconds / maxAttempts — без обмежень.
export type ClassroomReading = {
    id: number;
    classroomId: number;
    bookId: number;
    bookTitle: string;
    startPage: number;
    endPage: number;
    wordCount: number;
    preview: string;
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
    bookId: number;
    startPage: number;
    endPage: number;
    startParagraph: number;
    endParagraph: number;
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
