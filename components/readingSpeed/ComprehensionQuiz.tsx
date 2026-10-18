import React, {useMemo, useState} from "react";
import {TouchableOpacity} from "react-native";
import {View, XStack, YStack} from "tamagui";

import {CustomText} from "@/components/CustomText";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import i18n from "@/localization/i18n";
import {ComprehensionQuizQuestion} from "@/types/ReadingSpeed";

const OPTION_LABELS = ["A", "B", "C", "D"];

interface Props {
    questions: ComprehensionQuizQuestion[];
}

// Невеликий тест на розуміння прочитаного одразу під результатами читання на
// швидкість (1-3 питання, кількість обирає AI на бекенді залежно від того,
// скільки встигла прочитати дитина — services/comprehension_quiz.py). На
// відміну від app/(app)/testPassing/test.tsx, тут усе лише в локальному
// стані екрана: питання ефемерні (не мають id, ніде не зберігаються в Java),
// тому без Redux і без збереження прогресу/оцінки.
export const ComprehensionQuiz = ({questions}: Props) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [correctCount, setCorrectCount] = useState(0);
    const [finished, setFinished] = useState(false);

    const currentQuestion = questions[currentIndex];
    const isLastQuestion = currentIndex === questions.length - 1;

    const correctAnswerIndex = useMemo(
        () => currentQuestion?.answers.findIndex((answer) => answer.correct) ?? -1,
        [currentQuestion]
    );

    const onAnswerSelected = (index: number) => {
        if (selectedIndex !== null) {
            return;
        }
        setSelectedIndex(index);
        if (index === correctAnswerIndex) {
            setCorrectCount((prev) => prev + 1);
        }
    };

    const onNext = () => {
        if (isLastQuestion) {
            setFinished(true);
            return;
        }
        setCurrentIndex((prev) => prev + 1);
        setSelectedIndex(null);
    };

    if (finished) {
        return (
            <YStack
                backgroundColor="#FFFFFF"
                borderRadius={28}
                padding={24}
                borderWidth={1}
                borderColor="$gray-85"
                gap={8}
                alignItems="center"
            >
                <CustomText size="h5Medium" color="$gray-20" textAlign="center">
                    {i18n.t("reading_speed_quiz_done")}
                </CustomText>
                <CustomText size="h3Medium" color="#CB5A2E">
                    {`${correctCount}/${questions.length}`}
                </CustomText>
            </YStack>
        );
    }

    return (
        <YStack
            backgroundColor="#FFFFFF"
            borderRadius={28}
            padding={24}
            borderWidth={1}
            borderColor="$gray-85"
            gap={16}
        >
            <XStack justifyContent="space-between" alignItems="center">
                <CustomText size="p3Medium" color="$gray-40">
                    {i18n.t("reading_speed_quiz_title")}
                </CustomText>
                <CustomText size="p3Medium" color="#CB5A2E">
                    {i18n.t("reading_speed_quiz_progress", {current: currentIndex + 1, total: questions.length})}
                </CustomText>
            </XStack>

            <CustomText size="h5Medium" color="$gray-20">
                {currentQuestion.question}
            </CustomText>

            <YStack gap={10}>
                {currentQuestion.answers.map((answer, index) => {
                    const isSelected = selectedIndex === index;
                    const isCorrectAnswer = index === correctAnswerIndex;
                    const revealed = selectedIndex !== null;

                    let borderColor = "$gray-85";
                    if (revealed && isCorrectAnswer) {
                        borderColor = "#3F8A5D";
                    } else if (revealed && isSelected) {
                        borderColor = "$error-primary";
                    }

                    return (
                        <TouchableOpacity
                            key={index}
                            activeOpacity={0.8}
                            disabled={revealed}
                            onPress={() => onAnswerSelected(index)}
                        >
                            <XStack
                                backgroundColor="#FFFFFF"
                                borderRadius={16}
                                padding={14}
                                alignItems="center"
                                borderWidth={1}
                                borderColor={borderColor}
                                gap={12}
                            >
                                <View
                                    width={32}
                                    height={32}
                                    borderRadius={16}
                                    backgroundColor="#FBEAD9"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <CustomText size="p2Medium" color="#CB5A2E">
                                        {OPTION_LABELS[index] ?? "?"}
                                    </CustomText>
                                </View>
                                <CustomText size="p1Regular" color="$gray-20" flex={1}>
                                    {answer.answer}
                                </CustomText>
                            </XStack>
                        </TouchableOpacity>
                    );
                })}
            </YStack>

            {selectedIndex !== null && (
                <PrimaryButton
                    text={isLastQuestion ? i18n.t("reading_speed_quiz_finish") : i18n.t("reading_speed_quiz_next")}
                    onPress={onNext}
                />
            )}
        </YStack>
    );
};
