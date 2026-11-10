import React, {useCallback, useEffect} from "react";
import {useLocalSearchParams, useRouter} from "expo-router";
import {useBackHandler} from "@react-native-community/hooks";
import {ScrollView, XStack, YStack} from "tamagui";
import {Alert, FlatList, RefreshControl} from "react-native";
import Feather from "@expo/vector-icons/Feather";

import CustomStackScreen from "@/components/CustomStackScreen";
import Header from "@/components/Header";
import HeaderButton from "@/components/buttons/HeaderButton";
import {CustomText} from "@/components/CustomText";
import i18n from "@/localization/i18n";
import useApi from "@/hooks/useApi";
import readingSpeedAttemptApi from "@/api/endpoints/readingSpeedAttemptApi";
import {ReadingSpeedAttempt} from "@/types/ReadingSpeed";
import {formatGrade, gradeColors} from "@/constants/readingGrade";
import {GradeBreakdown} from "@/components/readingSpeed/GradeBreakdown";

const formatDate = (iso: string): string => {
    const date = new Date(iso);
    return date.toLocaleDateString(undefined, {day: "2-digit", month: "2-digit", year: "numeric"}) +
        " " + date.toLocaleTimeString(undefined, {hour: "2-digit", minute: "2-digit"});
};

const ReadingHistoryRow = ({attempt, onPress, onDelete}: {
    attempt: ReadingSpeedAttempt;
    onPress: () => void;
    onDelete: () => void;
}) => {
    // Як на сторінці спроби: оцінки ще немає, бо рахується наголос або учень
    // ще не відповів на тест.
    const gradePending = attempt.grade == null && (
        attempt.stressStatus === "PENDING" || attempt.stressStatus === "PROCESSING" ||
        (attempt.quizTotal != null && attempt.quizTotal > 0 && attempt.quizCorrect == null)
    );

    const confirmDelete = () => {
        Alert.alert(
            i18n.t("reading_history_delete_confirm_title"),
            i18n.t("reading_history_delete_confirm_message"),
            [
                {text: i18n.t("cancel"), style: "cancel"},
                {text: i18n.t("reading_history_delete"), style: "destructive", onPress: onDelete},
            ],
        );
    };

    return (
        <YStack
            backgroundColor="#FFFFFF"
            borderRadius={20}
            padding={16}
            borderWidth={1}
            borderColor="$gray-85"
            gap={10}
            onPress={onPress}
            pressStyle={{opacity: 0.9, scale: 0.99}}
        >
            <XStack justifyContent="space-between" alignItems="flex-start" gap={10}>
                <YStack flex={1} gap={2}>
                    <CustomText size="h5Medium" color="$gray-20" numberOfLines={2}>
                        {attempt.classroomReadingTitle ?? i18n.t("reading_free_practice")}
                    </CustomText>
                    <CustomText size="p3Regular" color="$gray-40">
                        {formatDate(attempt.createdAt)}
                    </CustomText>
                </YStack>
                <XStack alignItems="center" gap={10}>
                    {attempt.grade != null && (
                        <XStack
                            backgroundColor={gradeColors(attempt.grade).bg}
                            paddingHorizontal={10}
                            paddingVertical={2}
                            borderRadius={999}
                        >
                            <CustomText size="p2Medium" color={gradeColors(attempt.grade).text}>
                                {formatGrade(attempt.grade)}
                            </CustomText>
                        </XStack>
                    )}
                    <XStack padding={4} onPress={confirmDelete} hitSlop={8}>
                        <Feather name="trash-2" size={16} color="#A68A63"/>
                    </XStack>
                </XStack>
            </XStack>
            <GradeBreakdown data={attempt} pending={gradePending}/>
        </YStack>
    );
};

// Історія читання ОДНІЄЇ дитини — для дитячого режиму це власна історія
// (index.tsx одразу сюди редіректить), для батьківського — обраної зі
// списку дітей дитини (app/(app)/readingHistory/index.tsx).
const ParticipantReadingHistory = () => {
    const router = useRouter();
    const {participantId, participantName} = useLocalSearchParams();
    const id = typeof participantId === "string" ? participantId : participantId?.[0];
    const name = typeof participantName === "string" ? participantName : undefined;

    const onCancel = useCallback(() => {
        router.back();
    }, [router]);

    useBackHandler(() => {
        onCancel();
        return true;
    });

    const fetchHistoryApi = useApi(
        readingSpeedAttemptApi.getHistory,
        {
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("reading_history_fetch_failed")}\n${i18n.t("please_try_again_later")}`,
                options: {tryAgain: true, cancel: true},
            },
        },
    );

    const invokeFetch = useCallback(() => {
        if (id) {
            fetchHistoryApi.execute(id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        invokeFetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const deleteAttemptApi = useApi(
        readingSpeedAttemptApi.deleteAttempt,
        {
            onSuccess: () => {
                invokeFetch();
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("reading_history_delete_failed")}\n${i18n.t("please_try_again_later")}`,
                options: {cancel: true},
            },
        },
    );

    const attempts = fetchHistoryApi.data ?? [];

    return (
        <>
            <CustomStackScreen/>
            <YStack flex={1}>
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
                <ScrollView
                    contentContainerStyle={{flex: attempts.length === 0 ? 1 : "unset", paddingHorizontal: 16}}
                    refreshControl={<RefreshControl refreshing={fetchHistoryApi.loading} onRefresh={invokeFetch}/>}
                >
                    <CustomText size="h2">
                        {name ?? i18n.t("reading_history_title")}
                    </CustomText>
                    {attempts.length === 0 && !fetchHistoryApi.loading && (
                        <YStack flex={1} justifyContent="center" alignItems="center">
                            <CustomText size="p1Regular" color="$gray-40">
                                {i18n.t("reading_history_empty")}
                            </CustomText>
                        </YStack>
                    )}
                    <YStack paddingBottom={80}>
                        <FlatList
                            numColumns={1}
                            contentContainerStyle={{marginVertical: 11, gap: 8}}
                            scrollEnabled={false}
                            data={attempts}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({item}) => (
                                <ReadingHistoryRow
                                    attempt={item}
                                    onPress={() => router.navigate(`/readingHistory/${item.id}`)}
                                    onDelete={() => deleteAttemptApi.execute(item.id)}
                                />
                            )}
                        />
                    </YStack>
                </ScrollView>
            </YStack>
        </>
    );
};

export default ParticipantReadingHistory;
