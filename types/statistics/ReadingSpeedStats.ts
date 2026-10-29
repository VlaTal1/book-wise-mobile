import {Participant} from "@/types/Paticipant";

export type ReadingSpeedStatsByParticipant = {
    participant: Participant;
    attemptsCount: number;
    averageWpm: number;
    averageAccuracy: number;
    // null, якщо жодна спроба ще не має завершеного (DONE) результату шару
    // перевірки наголосу — асинхронна метрика, рахується не одразу.
    averageStressAccuracy: number | null;
    stressCheckedAttemptsCount: number;
    // Оцінки 1-10 — null, якщо оціненої спроби ще немає.
    averageGrade: number | null;
    gradedAttemptsCount: number;
    lastGrade: number | null;
    // Середнє 3 останніх оцінок мінус середнє 3 попередніх (>0 — покращення);
    // null, якщо оцінок менше 4.
    gradeTrend: number | null;
};
