import React, {useEffect, useMemo, useState} from "react";
import {ActivityIndicator} from "react-native";
import {ScrollView, XStack, YStack} from "tamagui";

import {CustomText} from "@/components/CustomText";
import i18n from "@/localization/i18n";
import useApi from "@/hooks/useApi";
import statisticsApi from "@/api/endpoints/statisticsApi";
import participantApi from "@/api/endpoints/participantApi";
import SegmentedControl from "@/components/SegmentedControl";
import ReadingSpeedStatsChart from "@/components/statistics/charts/ReadingSpeedStatsChart";
import ReadingSpeedDailyChart from "@/components/statistics/charts/ReadingSpeedDailyChart";

const cardShadow = {
    shadowColor: "rgba(43, 32, 19, 0.06)",
    shadowOffset: {width: 0, height: 3},
    shadowRadius: 8,
    shadowOpacity: 1,
};

// Дочірній пікер для вкладки "По днях" — той самий підхід (горизонтальний
// ряд "піллів"), що і в ReadingStatsPage.tsx (стара денна статистика
// сторінок/часу читання), лише в Tamagui-стилі замість StyleSheet.
const ParticipantPicker = ({participants, selectedId, onSelect}: {
    participants: { id: number; name: string }[];
    selectedId: number | null;
    onSelect: (id: number) => void;
}) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 16, gap: 8}}>
        {participants.map((participant) => {
            const selected = participant.id === selectedId;
            return (
                <XStack
                    key={participant.id}
                    paddingHorizontal={16}
                    paddingVertical={10}
                    borderRadius={20}
                    backgroundColor={selected ? "#CB5A2E" : "#F3E7CE"}
                    borderWidth={1}
                    borderColor={selected ? "#CB5A2E" : "#E8DCC3"}
                    onPress={() => onSelect(participant.id)}
                    pressStyle={{opacity: 0.9}}
                >
                    <CustomText size="p2Medium" color={selected ? "#FFFFFF" : "$gray-20"}>
                        {participant.name}
                    </CustomText>
                </XStack>
            );
        })}
    </ScrollView>
);

const ReadingSpeedStatistics = () => {
    const innerTabs = useMemo(() => ([
        i18n.t("reading_speed_stats_average"),
        i18n.t("reading_speed_stats_daily"),
    ]), []);
    const [innerTab, setInnerTab] = useState(0);
    const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(null);

    const getReadingSpeedApi = useApi(
        statisticsApi.getReadingSpeed,
        {
            errorHandler: {
                title: i18n.t("error_header"),
                message: i18n.t("error_load_statistics"),
                options: {tryAgain: true, navigate: {mode: "back"}},
            },
        },
    );

    const fetchParticipantsApi = useApi(
        participantApi.fetchStudents,
        {
            onSuccess: (participants) => {
                if (selectedParticipantId === null && participants.length > 0) {
                    setSelectedParticipantId(participants[0].id);
                }
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_fetch_students")}\n${i18n.t("please_try_again_later")}`,
                options: {tryAgain: true, cancel: true},
            },
        },
    );

    const getDailyApi = useApi(
        statisticsApi.getReadingSpeedDaily,
        {
            errorHandler: {
                title: i18n.t("error_header"),
                message: i18n.t("error_load_statistics"),
                options: {tryAgain: true, cancel: true},
            },
        },
    );

    useEffect(() => {
        if (innerTab === 0) {
            getReadingSpeedApi.execute();
        } else {
            fetchParticipantsApi.execute();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [innerTab]);

    useEffect(() => {
        if (innerTab === 1 && selectedParticipantId !== null) {
            getDailyApi.execute(selectedParticipantId.toString());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [innerTab, selectedParticipantId]);

    const participants = fetchParticipantsApi.data ?? [];

    return (
        <YStack gap={16} flex={1}>
            <SegmentedControl
                variant="white"
                options={innerTabs}
                currentTab={innerTab}
                onChange={setInnerTab}
            />
            <YStack
                borderRadius={24}
                paddingVertical={20}
                backgroundColor="$gray-100"
                borderWidth={1}
                borderColor="$gray-85"
                height="100%"
                flex={1}
                style={cardShadow}
            >
                {innerTab === 0 && (
                    getReadingSpeedApi.loading || !getReadingSpeedApi.data ? (
                        <ActivityIndicator size="large" color="#CB5A2E"/>
                    ) : (
                        <ReadingSpeedStatsChart data={getReadingSpeedApi.data}/>
                    )
                )}

                {innerTab === 1 && (
                    fetchParticipantsApi.loading && participants.length === 0 ? (
                        <ActivityIndicator size="large" color="#CB5A2E"/>
                    ) : participants.length === 0 ? (
                        <CustomText size="p1Regular" color="$gray-40" textAlign="center">
                            {i18n.t("no_students_yet")}
                        </CustomText>
                    ) : (
                        <YStack gap={16}>
                            <ParticipantPicker
                                participants={participants}
                                selectedId={selectedParticipantId}
                                onSelect={setSelectedParticipantId}
                            />
                            {getDailyApi.loading || !getDailyApi.data ? (
                                <ActivityIndicator size="large" color="#CB5A2E"/>
                            ) : (
                                <ReadingSpeedDailyChart data={getDailyApi.data}/>
                            )}
                        </YStack>
                    )
                )}
            </YStack>
        </YStack>
    );
};

export default ReadingSpeedStatistics;
