// not_reached: еталонний текст навмисно довший (300-340 слів, запас на темп
// читання), ніж дитина встигає прочитати за виділену хвилину — "хвіст", до
// якого сесія не дійшла, не помилка читання і виключений з метрики точності
// (ReadingSpeedMetrics.total_words на бекенді враховує лише прочитане).
export type WordStatus = "correct" | "error" | "skipped" | "not_in_vocabulary" | "not_reached";

export interface ReferenceWord {
    index: number;
    word: string;
    in_vocabulary: boolean;
    // Оригінальний фрагмент тексту (регістр + пунктуація одразу за словом,
    // напр. "музики." чи "такої,") — саме це рендериться на екрані читання;
    // word (нормалізоване, без пунктуації) — лише для внутрішньої логіки.
    display: string;
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

// Поля саме в snake_case — це сирий JSON з Python-моделі (models/stress.py,
// StressWordVerdict), Java зберігає і повертає stressWordsJson як є, не
// перейменовуючи ключі під камелкейс (на відміну від решти полів DTO).
export interface StressWordVerdict {
    index: number;
    word: string;
    checked: boolean;
    correct: boolean | null;
    predicted_syllable: number | null;
    reference_syllables: number[] | null;
}

export interface ReadingSpeedAttempt {
    id: number;
    participantId: number;
    // Заповнено лише в елементах списку "усі мої діти" (батьківський режим
    // історії, readingSpeedAttemptApi.getAllHistory) — щоб показати, чия це
    // спроба, коли список змішує кількох дітей.
    participantName: string | null;
    textId: string;
    totalWords: number;
    correctCount: number;
    errorCount: number;
    skippedCount: number;
    notInVocabularyCount: number;
    durationSeconds: number;
    wpm: number;
    accuracy: number;
    // JSON-масив WordEventRecord (index+status) — розпізнаний результат.
    wordsJson: string;
    // JSON-масив ReferenceWord — сам еталонний текст (з display для показу),
    // без нього wordsJson не можна перетворити на кольоровий текст.
    referenceWordsJson: string | null;
    stressStatus: StressStatus;
    // 0-100, best-effort (кілька грубих етапів пайплайну forced alignment,
    // не гранулярний прогрес) — може бути відсутнім навіть у PROCESSING.
    stressProgress: number | null;
    stressAccuracy: number | null;
    stressCheckedWords: number | null;
    stressCorrectWords: number | null;
    stressWordsJson: string | null;
    stressError: string | null;
    // MinIO object key — присутній, лише якщо завантаження аудіо в MinIO
    // вдалося (services/reading_speed_session.py, Python); якщо null, плеєр
    // в історії не показуємо.
    audioFileName: string | null;
    createdAt: string;
    updatedAt: string;
}

// Один елемент розпарсеного wordsJson.
export interface WordEventRecord {
    index: number;
    status: WordStatus;
}
