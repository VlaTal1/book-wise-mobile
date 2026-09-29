import React from "react";
import {XStack} from "tamagui";

import {CustomText} from "@/components/CustomText";
import {STRESS_ERROR_UNDERLINE_COLOR, WORD_STATUS_COLORS} from "@/constants/wordStatusColors";
import {ReferenceWord, WordStatus} from "@/types/ReadingSpeed";

const UNKNOWN_COLOR = "$gray-40";

interface Props {
    words: ReferenceWord[];
    statuses: Record<number, WordStatus>;
    // index-и слів, де наголос перевірений і виявився неправильним (окремий
    // шар поверх кольору точності читання — див. WordStatusLegendModal).
    stressIncorrectIndices?: Set<number>;
}

// Показ уже завершеної (історичної) сесії читання — на відміну від
// HighlightedWordText (яка показує "наживо" з tentative-станом), тут усі
// статуси вже остаточні, плюс підкреслення слів з неправильним наголосом.
export const RecognizedTextView = ({words, statuses, stressIncorrectIndices}: Props) => {
    return (
        <XStack flexWrap="wrap" gap={6}>
            {words.map((word) => {
                const status = statuses[word.index];
                const color = status ? WORD_STATUS_COLORS[status] : UNKNOWN_COLOR;
                const hasStressError = stressIncorrectIndices?.has(word.index) ?? false;

                return (
                    <CustomText
                        key={word.index}
                        size="h5Regular"
                        color={color}
                        borderBottomWidth={hasStressError ? 2 : 0}
                        borderColor={hasStressError ? STRESS_ERROR_UNDERLINE_COLOR : "transparent"}
                    >
                        {word.display}
                    </CustomText>
                );
            })}
        </XStack>
    );
};
