import React from "react";
import {XStack} from "tamagui";

import {CustomText} from "@/components/CustomText";
import {
    WORD_STATUS_COLORS,
    WORD_TENTATIVE_BACKGROUND,
    WORD_TEXT_COLOR,
} from "@/constants/wordStatusColors";
import {ReferenceWord, WordStatus} from "@/types/ReadingSpeed";

interface Props {
    words: ReferenceWord[];
    statuses: Record<number, WordStatus>;
    tentativeStatuses?: Record<number, WordStatus>;
}

// Статус слова передається кольором ФОНУ під словом (а не кольором тексту) —
// так наочніше. Відступи однакові для всіх слів незалежно від статусу, тому
// зміна заливки не зсуває текст під час читання. Підтверджений статус
// (statuses) завжди має пріоритет над чорновим (tentativeStatuses).
export const HighlightedWordText = ({words, statuses, tentativeStatuses = {}}: Props) => {
    return (
        <XStack flexWrap="wrap" columnGap={2} rowGap={4}>
            {words.map((word) => {
                const confirmedStatus = statuses[word.index];
                const isTentative = !confirmedStatus && tentativeStatuses[word.index] !== undefined;

                let backgroundColor = "transparent";
                if (confirmedStatus) {
                    backgroundColor = WORD_STATUS_COLORS[confirmedStatus];
                } else if (isTentative) {
                    backgroundColor = WORD_TENTATIVE_BACKGROUND;
                }

                return (
                    <CustomText
                        key={word.index}
                        size="h5Regular"
                        color={WORD_TEXT_COLOR}
                        backgroundColor={backgroundColor}
                        paddingHorizontal={3}
                        borderRadius={4}
                        overflow="hidden"
                    >
                        {word.display}
                    </CustomText>
                );
            })}
        </XStack>
    );
};
