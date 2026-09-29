import React from "react";
import {XStack, YStack} from "tamagui";

import BottomSheetModal from "@/components/modal";
import {CustomText} from "@/components/CustomText";
import i18n from "@/localization/i18n";
import {
    STRESS_ERROR_UNDERLINE_COLOR,
    WORD_STATUS_COLORS,
    WORD_STATUS_LABEL_KEYS,
    WORD_STATUS_LEGEND_ORDER,
} from "@/constants/wordStatusColors";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

// Пояснення кольорової розмітки розпізнаного тексту — відкривається кнопкою
// "?" на екрані деталей історії читання (app/(app)/readingHistory/[id].tsx).
export const WordStatusLegendModal = ({isOpen, onClose}: Props) => {
    return (
        <BottomSheetModal
            isOpen={isOpen}
            onClose={onClose}
            headerText={i18n.t("word_status_legend_title")}
            scrollable={false}
        >
            <YStack gap={16} paddingVertical={8}>
                {WORD_STATUS_LEGEND_ORDER.map((status) => (
                    <XStack key={status} alignItems="center" gap={12}>
                        <YStack
                            width={16}
                            height={16}
                            borderRadius={8}
                            backgroundColor={WORD_STATUS_COLORS[status]}
                        />
                        <CustomText size="p1Regular" color="$gray-20" flex={1}>
                            {i18n.t(WORD_STATUS_LABEL_KEYS[status])}
                        </CustomText>
                    </XStack>
                ))}
                <XStack alignItems="center" gap={12}>
                    <YStack
                        width={16}
                        height={16}
                        borderRadius={8}
                        backgroundColor="transparent"
                        borderBottomWidth={3}
                        borderColor={STRESS_ERROR_UNDERLINE_COLOR}
                    />
                    <CustomText size="p1Regular" color="$gray-20" flex={1}>
                        {i18n.t("word_status_stress_error")}
                    </CustomText>
                </XStack>
            </YStack>
        </BottomSheetModal>
    );
};
