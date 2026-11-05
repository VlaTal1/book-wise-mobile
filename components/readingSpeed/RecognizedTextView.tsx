import React from "react";
import {XStack} from "tamagui";

import {CustomText} from "@/components/CustomText";
import {
    STRESS_ERROR_UNDERLINE_COLOR,
    WORD_STATUS_COLORS,
    WORD_TEXT_COLOR,
} from "@/constants/wordStatusColors";
import {ReferenceWord, WordStatus} from "@/types/ReadingSpeed";

interface Props {
    words: ReferenceWord[];
    statuses: Record<number, WordStatus>;
    // index-и слів, де наголос перевірений і виявився неправильним (окремий
    // шар поверх заливки точності читання — див. WordStatusLegendModal).
    stressIncorrectIndices?: Set<number>;
}

// Показ уже завершеної (історичної) сесії читання — на відміну від
// HighlightedWordText (яка показує "наживо" з tentative-станом), тут усі
// статуси вже остаточні, плюс підкреслення слів з неправильним наголосом.
// Статус — колір фону під словом, текст завжди темний.
export const RecognizedTextView = ({words, statuses, stressIncorrectIndices}: Props) => {
    return (
        <XStack flexWrap="wrap" columnGap={2} rowGap={4}>
            {words.map((word) => {
                const status = statuses[word.index];
                const backgroundColor = status ? WORD_STATUS_COLORS[status] : "transparent";
                const hasStressError = stressIncorrectIndices?.has(word.index) ?? false;

                return (
                    <CustomText
                        key={word.index}
                        size="h5Regular"
                        color={WORD_TEXT_COLOR}
                        backgroundColor={backgroundColor}
                        paddingHorizontal={3}
                        borderRadius={4}
                        overflow="hidden"
                        borderBottomWidth={2}
                        borderColor={hasStressError ? STRESS_ERROR_UNDERLINE_COLOR : "transparent"}
                    >
                        {word.display}
                    </CustomText>
                );
            })}
        </XStack>
    );
};
