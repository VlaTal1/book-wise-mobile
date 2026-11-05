import {WordStatus} from "@/types/ReadingSpeed";

// Спільна мапа кольорів ФОНУ під словом — використовується і "наживо" під
// час читання (HighlightedWordText), і при перегляді історії
// (app/(app)/readingHistory/[id].tsx), і в легенді (?) на обох екранах, щоб
// колір завжди означав те саме. Сам текст лишається темним (WORD_TEXT_COLOR),
// а статус передається заливкою — так він помітніший і текст читабельний.
// Пастельні відтінки з різних частин спектра (зелений / червоний / жовтий /
// синій / нейтрально-сірий), щоб їх не плутати між собою і з теплим фоном
// застосунку.
export const WORD_STATUS_COLORS: Record<WordStatus, string> = {
    correct: "#BFE5C2",
    error: "#F5B3AC",
    skipped: "#FFD966",
    not_in_vocabulary: "#BBD3F2",
    // На практиці в живому читанні майже не видно (приходить в останню мить
    // сесії), але в історії "хвіст" уривка, до якого не дочитали, підсвічений
    // саме цим кольором.
    not_reached: "#DCDCDC",
};

// Колір тексту слова поверх заливки статусу.
export const WORD_TEXT_COLOR = "$gray-20";

// Чорновий (ще не підтверджений) статус під час живого читання.
export const WORD_TENTATIVE_BACKGROUND = "#ECECEC";

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
// Фіолетовий — не збігається з жодною заливкою статусу.
export const STRESS_ERROR_UNDERLINE_COLOR = "#7C3AED";
