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
};
