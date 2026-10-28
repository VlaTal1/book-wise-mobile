import {Progress} from "@/types/Progress";
import {Question} from "@/types/Question";
import CompleteStatus from "@/types/CompleteStatus";

export type GenerationStatus = "GENERATING" | "READY" | "FAILED";

export type Test = {
    id: number;
    progress: Progress;
    questionsAmount: number;
    startPage: number;
    endPage: number;
    completed: CompleteStatus;
    dueTo: Date;
    passedDate: Date;
    grade: number;
    correctAnswers: number;
    questions: Question[]
    generationStatus: GenerationStatus;
}