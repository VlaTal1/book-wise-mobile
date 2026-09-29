import {WordStatus} from "@/types/ReadingSpeed";

// Спільна мапа кольорів для підсвітки слів — використовується і "наживо" під
// час читання (HighlightedWordText), і при перегляді історії
// (app/(app)/readingHistory/[id].tsx), і в легенді (?) на обох екранах, щоб
// колір завжди означав те саме.
export const WORD_STATUS_COLORS: Record<WordStatus, string> = {
    correct: "#3F8A5D",
    error: "$error-primary",
    skipped: "$gray-60",
    not_in_vocabulary: "#2F6F62",
    // На практиці в живому читанні майже не видно (приходить в останню мить
    // сесії), але в історії "хвіст" уривка, до якого не дочитали, підсвічений
    // саме цим кольором.
    not_reached: "$gray-85",
};

// Порядок і ключі i18n для легенди — статуси, які варто пояснювати
// користувачу (not_reached пояснюється окремим текстом, не кольором слова).
export const WORD_STATUS_LEGEND_ORDER: WordStatus[] = [
    "correct",
    "error",
    "skipped",
    "not_in_vocabulary",
    "not_reached",
];

export const WORD_STATUS_LABEL_KEYS: Record<WordStatus, string> = {
    correct: "word_status_correct",
    error: "word_status_error",
    skipped: "word_status_skipped",
    not_in_vocabulary: "word_status_not_in_vocabulary",
    not_reached: "word_status_not_reached",
};

// Колір підкреслення слів з неправильним наголосом (окремий шар поверх
// кольору точності читання, тому НЕ з WORD_STATUS_COLORS — вони можуть
// збігтися на одному й тому самому слові).
export const STRESS_ERROR_UNDERLINE_COLOR = "#B45309";
