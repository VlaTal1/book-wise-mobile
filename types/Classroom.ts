import {Participant} from "@/types/Paticipant";
import {Book} from "@/types/Book";
import {GenerationStatus} from "@/types/Test";

export type Classroom = {
    id: number;
    name: string;
    code: string;
    teacherName: string | null;
    studentsCount: number;
    // Норма темпу читання (правильних слів/хв) — для оцінки читання на швидкість.
    targetWpm: number;
}

// Тест класу з точки зору вчителя: стан генерації та скільки учнів пройшли.
export type ClassroomTest = {
    id: number;
    bookId: number;
    bookTitle: string;
    startPage: number;
    endPage: number;
    questionsAmount: number;
    generationStatus: GenerationStatus;
    testsCount: number;
    completedCount: number;
}

export type ClassroomDetails = Classroom & {
    students: Participant[];
    books: Book[];
    tests: ClassroomTest[];
}

export type ClassroomTestRequest = {
    bookId: number;
    startPage: number;
    endPage: number;
    questionsAmount: number;
}
