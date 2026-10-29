// Часовий ряд ОДНІЄЇ дитини (на відміну від ReadingSpeedStatsByParticipant,
// яке усереднює по всіх дітях одразу) — для графіка "3 лінії по днях".
export type ReadingSpeedDailyStats = {
    date: string;
    attemptsCount: number;
    averageWpm: number;
    averageAccuracy: number;
    // null, якщо жодна спроба цього дня ще не має завершеного (DONE)
    // результату шару перевірки наголосу.
    averageStressAccuracy: number | null;
    // null, якщо цього дня немає оціненої спроби.
    averageGrade: number | null;
};
