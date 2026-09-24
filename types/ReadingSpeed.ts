export type WordStatus = "correct" | "error" | "skipped" | "not_in_vocabulary";

export interface ReferenceWord {
    index: number;
    word: string;
    in_vocabulary: boolean;
}

export interface ReferenceTextMessage {
    type: "reference";
    text_id: string;
    title: string;
    words: ReferenceWord[];
}

export interface WordEventMessage {
    type: "word_event";
    index: number;
    status: WordStatus;
    // Чорновий прогноз, ще не підтверджений (може бути перезаписаний пізніше
    // тим самим index'ом з tentative=false) — рендериться менш насичено.
    tentative: boolean;
}

export interface ReadingSpeedMetrics {
    total_words: number;
    correct_count: number;
    error_count: number;
    skipped_count: number;
    not_in_vocabulary_count: number;
    duration_seconds: number;
    wpm: number;
    accuracy: number;
}

export interface ResultMessage {
    type: "result";
    text_id: string;
    metrics: ReadingSpeedMetrics;
    // Id збереженого ReadingSpeedAttempt у Java — використовується для
    // опитування статусу окремого (асинхронного) шару перевірки наголосу,
    // див. StressStatus / readingSpeedAttemptApi. Відсутній, якщо збереження
    // в Java не вдалося — тоді шар наголосу теж не запускається на бекенді.
    attempt_id: number | null;
}

export type ReadingSpeedServerMessage = ReferenceTextMessage | WordEventMessage | ResultMessage;

// Рахується ПІСЛЯ основної сесії читання (потрібен повний аудіофайл) —
// продовжується в фоні на бекенді, навіть якщо користувач покинув екран
// результатів або застосунок; мобілка лише опитує стан.
export type StressStatus = "PENDING" | "PROCESSING" | "DONE" | "FAILED" | "NOT_APPLICABLE";

export interface StressWordVerdict {
    index: number;
    word: string;
    checked: boolean;
    correct: boolean | null;
    predictedSyllable: number | null;
    referenceSyllables: number[] | null;
}

export interface ReadingSpeedAttempt {
    id: number;
    participantId: number;
    textId: string;
    totalWords: number;
    correctCount: number;
    errorCount: number;
    skippedCount: number;
    notInVocabularyCount: number;
    durationSeconds: number;
    wpm: number;
    accuracy: number;
    wordsJson: string;
    stressStatus: StressStatus;
    // 0-100, best-effort (кілька грубих етапів пайплайну forced alignment,
    // не гранулярний прогрес) — може бути відсутнім навіть у PROCESSING.
    stressProgress: number | null;
    stressAccuracy: number | null;
    stressCheckedWords: number | null;
    stressCorrectWords: number | null;
    stressWordsJson: string | null;
    stressError: string | null;
}
