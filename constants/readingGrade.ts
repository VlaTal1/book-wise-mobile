import {ReadingSpeedAttempt} from "@/types/ReadingSpeed";

// Оцінка читання на швидкість: три показники по 0-5 (швидкість, вимова,
// розуміння), підсумок — сума, максимум 15 (ReadingGradeCalculator на Java).
export const GRADE_MAX = 15;
export const GRADE_COMPONENT_MAX = 5;

export type GradeScores = Pick<ReadingSpeedAttempt, "grade" | "speedScore" | "pronunciationScore" | "comprehensionScore" | "targetWpm">;

export const pickGradeScores = (attempt: ReadingSpeedAttempt): GradeScores => ({
    grade: attempt.grade,
    speedScore: attempt.speedScore,
    pronunciationScore: attempt.pronunciationScore,
    comprehensionScore: attempt.comprehensionScore,
    targetWpm: attempt.targetWpm,
});

export const formatGrade = (grade: number) => `${grade}/${GRADE_MAX}`;

// Пороги ті самі, що були на 10-бальній шкалі (7 і 4), перераховані на 15.
export const gradeColors = (grade: number) => {
    if (grade >= 11) {
        return {bg: "#E7F3EA", text: "#2F6B45"};
    }
    if (grade >= 6) {
        return {bg: "#FBF1DC", text: "#8A6416"};
    }
    return {bg: "#FBEAE8", text: "#C1443A"};
};
