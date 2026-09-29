import React from "react";
import {XStack} from "tamagui";

import {CustomText} from "@/components/CustomText";
import {ReferenceWord, WordStatus} from "@/types/ReadingSpeed";

const STATUS_COLORS: Record<WordStatus, string> = {
    correct: "#3F8A5D",
    error: "$error-primary",
    skipped: "$gray-60",
    not_in_vocabulary: "#2F6F62",
    // На практиці ці події приходять лише в останню мить сесії (finalize),
    // коли екран уже перемикається на "finished" — колір лише для повноти
    // Record<WordStatus, ...>, не очікується видимим у звичайному потоці.
    not_reached: "$gray-85",
};

const PENDING_COLOR = "$gray-20";
const TENTATIVE_COLOR = "$gray-60";

interface Props {
    words: ReferenceWord[];
    statuses: Record<number, WordStatus>;
    tentativeStatuses?: Record<number, WordStatus>;
}

// Лише колір, без courту/opacity — зміна накреслення шрифту (курсив/жирність)
// зсуває метрики глифів і "стрибає" текст під час читання, тому статус
// передається виключно кольором. Підтверджений статус (statuses) завжди має
// пріоритет над чорновим (tentativeStatuses) для того самого слова.
export const HighlightedWordText = ({words, statuses, tentativeStatuses = {}}: Props) => {
    return (
        <XStack flexWrap="wrap" gap={6}>
            {words.map((word) => {
                const confirmedStatus = statuses[word.index];
                const isTentative = !confirmedStatus && tentativeStatuses[word.index] !== undefined;

                let color = PENDING_COLOR;
                if (confirmedStatus) {
                    color = STATUS_COLORS[confirmedStatus];
                } else if (isTentative) {
                    color = TENTATIVE_COLOR;
                }

                return (
                    <CustomText
                        key={word.index}
                        size="h5Regular"
                        color={color}
                    >
                        {word.word}
                    </CustomText>
                );
            })}
        </XStack>
    );
};
