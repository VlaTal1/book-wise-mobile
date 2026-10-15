import {useBackHandler} from "@react-native-community/hooks";
import {useRouter} from "expo-router";
import React, {useCallback, useMemo, useState} from "react"
import {ScrollView, XStack, YStack} from "tamagui";

import HeaderButton from "@/components/buttons/HeaderButton";
import CustomStackScreen from "@/components/CustomStackScreen";
import {CustomText} from "@/components/CustomText";
import Header from "@/components/Header";
import i18n from "@/localization/i18n";
import SegmentedControl from "@/components/SegmentedControl";
import SimpleReadingStatistics from "@/components/statistics/SimpleReadingStatistics";
import ReadingSpeedStatistics from "@/components/statistics/ReadingSpeedStatistics";

// Два незалежних розділи статистики — "просте" читання (оцінки за тести,
// сторінки/час, ReadingSession) і читання на швидкість (WPM/точність/
// наголос, ReadingSpeedAttempt) — кожен зі своїми внутрішніми вкладками,
// див. components/statistics/{SimpleReadingStatistics,ReadingSpeedStatistics}.
const StatisticsView = () => {
    const router = useRouter();

    const sections = useMemo(() => ([
        i18n.t("simple_reading_statistics"),
        i18n.t("reading_speed_statistics"),
    ]), [])

    const [currentSection, setCurrentSection] = useState(0)

    const onCancel = useCallback(() => {
        router.back();
    }, [router]);

    useBackHandler(() => {
        onCancel();
        return true;
    });

    return (
        <>
            <CustomStackScreen/>
            <YStack flex={1} justifyContent="space-between" height="100%">
                <Header backgroundColor="transparent">
                    <XStack justifyContent="space-between" width="100%">
                        <HeaderButton
                            onPress={onCancel}
                            backgroundColor="transparent"
                            color="$gray-20"
                            text={i18n.t("back")}
                        />
                    </XStack>
                </Header>
                <ScrollView contentContainerStyle={{flexGrow: 1}}>
                    <YStack
                        flex={1}
                        gap={16}
                        marginHorizontal={16}
                        justifyContent="space-between"
                        marginBottom={20}
                        paddingTop={28}
                        overflow="hidden"
                    >
                        <CustomText size="h1" color="$gray-20">
                            {i18n.t("statistics")}
                        </CustomText>
                        <SegmentedControl
                            variant="white"
                            options={sections}
                            currentTab={currentSection}
                            onChange={setCurrentSection}
                        />
                        {currentSection === 0 ? <SimpleReadingStatistics/> : <ReadingSpeedStatistics/>}
                    </YStack>
                </ScrollView>
            </YStack>
        </>
    )
}

export default StatisticsView;
