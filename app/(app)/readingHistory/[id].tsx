import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useLocalSearchParams, useRouter} from "expo-router";
import {useBackHandler} from "@react-native-community/hooks";
import {ActivityIndicator, Alert, ScrollView} from "react-native";
import {XStack, YStack} from "tamagui";
import Feather from "@expo/vector-icons/Feather";

import CustomStackScreen from "@/components/CustomStackScreen";
import Header from "@/components/Header";
import HeaderButton from "@/components/buttons/HeaderButton";
import {CustomText} from "@/components/CustomText";
import i18n from "@/localization/i18n";
import useApi from "@/hooks/useApi";
import readingSpeedAttemptApi from "@/api/endpoints/readingSpeedAttemptApi";
import {AudioPlayerBar} from "@/components/readingSpeed/AudioPlayerBar";
import {RecognizedTextView} from "@/components/readingSpeed/RecognizedTextView";
import {WordStatusLegendModal} from "@/components/readingSpeed/WordStatusLegendModal";
import {ReadingSpeedAttempt, ReferenceWord, StressWordVerdict, WordEventRecord, WordStatus} from "@/types/ReadingSpeed";

const ReadingHistoryDetails = () => {
    const router = useRouter();
    const {id} = useLocalSearchParams();
    const attemptId = Number(Array.isArray(id) ? id[0] : id);

    const [isLegendOpen, setIsLegendOpen] = useState(false);

    const onCancel = useCallback(() => {
        router.back();
    }, [router]);

    useBackHandler(() => {
        onCancel();
        return true;
    });

    const fetchAttemptApi = useApi(
        readingSpeedAttemptApi.getById,
        {
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("reading_history_fetch_failed")}\n${i18n.t("please_try_again_later")}`,
                options: {tryAgain: true, cancel: true, navigate: {mode: "back"}},
            },
        },
    );

    useEffect(() => {
        if (Number.isFinite(attemptId)) {
            fetchAttemptApi.execute(attemptId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attemptId]);

    const deleteAttemptApi = useApi(
        readingSpeedAttemptApi.deleteAttempt,
        {
            onSuccess: () => {
                router.back();
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("reading_history_delete_failed")}\n${i18n.t("please_try_again_later")}`,
                options: {cancel: true},
            },
        },
    );

    const confirmDelete = () => {
        Alert.alert(
            i18n.t("reading_history_delete_confirm_title"),
            i18n.t("reading_history_delete_confirm_message"),
            [
                {text: i18n.t("cancel"), style: "cancel"},
                {text: i18n.t("reading_history_delete"), style: "destructive", onPress: () => deleteAttemptApi.execute(attemptId)},
            ],
        );
    };

    const attempt: ReadingSpeedAttempt | null = fetchAttemptApi.data;

    const referenceWords: ReferenceWord[] = useMemo(() => {
        if (!attempt?.referenceWordsJson) {
            return [];
        }
        try {
            return JSON.parse(attempt.referenceWordsJson) as ReferenceWord[];
        } catch {
            return [];
        }
    }, [attempt?.referenceWordsJson]);

    const wordStatuses: Record<number, WordStatus> = useMemo(() => {
        if (!attempt?.wordsJson) {
            return {};
        }
        try {
            const events = JSON.parse(attempt.wordsJson) as WordEventRecord[];
            return Object.fromEntries(events.map((e) => [e.index, e.status]));
        } catch {
            return {};
        }
    }, [attempt?.wordsJson]);

    const stressIncorrectIndices: Set<number> = useMemo(() => {
        if (!attempt?.stressWordsJson) {
            return new Set();
        }
        try {
            const verdicts = JSON.parse(attempt.stressWordsJson) as StressWordVerdict[];
            return new Set(verdicts.filter((v) => v.checked && v.correct === false).map((v) => v.index));
        } catch {
            return new Set();
        }
    }, [attempt?.stressWordsJson]);

    const stressLabel = attempt?.stressStatus === "DONE" && attempt.stressAccuracy !== null
        ? `${Math.round(attempt.stressAccuracy * 100)}%`
        : attempt?.stressStatus === "PROCESSING" || attempt?.stressStatus === "PENDING"
            ? i18n.t("reading_speed_stress_processing")
            : attempt?.stressStatus === "FAILED"
                ? i18n.t("reading_speed_stress_failed")
                : null;

    return (
        <>
            <CustomStackScreen/>
            <YStack flex={1}>
                <Header backgroundColor="transparent">
                    <XStack justifyContent="space-between" alignItems="center" width="100%" paddingHorizontal={8}>
                        <HeaderButton
                            onPress={onCancel}
                            backgroundColor="transparent"
                            color="$gray-20"
                            text={i18n.t("back")}
                        />
                        <XStack alignItems="center" gap={8}>
                            <XStack
                                width={36}
                                height={36}
                                borderRadius={18}
                                backgroundColor="#FFFFFF"
                                borderWidth={1}
                                borderColor="$gray-85"
                                alignItems="center"
                                justifyContent="center"
                                onPress={() => setIsLegendOpen(true)}
                                pressStyle={{opacity: 0.8}}
                            >
                                <Feather name="help-circle" size={18} color="#3A2E20"/>
                            </XStack>
                            <XStack
                                width={36}
                                height={36}
                                borderRadius={18}
                                backgroundColor="#FFFFFF"
                                borderWidth={1}
                                borderColor="$gray-85"
                                alignItems="center"
                                justifyContent="center"
                                onPress={confirmDelete}
                                pressStyle={{opacity: 0.8}}
                            >
                                <Feather name="trash-2" size={16} color="#A68A63"/>
                            </XStack>
                        </XStack>
                    </XStack>
                </Header>

                {fetchAttemptApi.loading && !attempt && (
                    <YStack flex={1} justifyContent="center" alignItems="center">
                        <ActivityIndicator size="large" color="#CB5A2E"/>
                    </YStack>
                )}

                {attempt && (
                    <ScrollView contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 32}}>
                        <YStack gap={16}>
                            <YStack
                                backgroundColor="#FFFFFF"
                                borderRadius={28}
                                padding={24}
                                borderWidth={1}
                                borderColor="$gray-85"
                                gap={12}
                            >
                                <XStack justifyContent="space-between">
                                    <CustomText size="p1Regular" color="$gray-40">
                                        {i18n.t("reading_speed_wpm")}
                                    </CustomText>
                                    <CustomText size="h4Medium" color="$gray-20">
                                        {attempt.wpm}
                                    </CustomText>
                                </XStack>
                                <XStack justifyContent="space-between">
                                    <CustomText size="p1Regular" color="$gray-40">
                                        {i18n.t("reading_speed_accuracy")}
                                    </CustomText>
                                    <CustomText size="h4Medium" color="$gray-20">
                                        {Math.round(attempt.accuracy * 100)}%
                                    </CustomText>
                                </XStack>
                                <XStack justifyContent="space-between">
                                    <CustomText size="p2Regular" color="$gray-40">
                                        {i18n.t("reading_speed_correct")}
                                    </CustomText>
                                    <CustomText size="p2Medium" color="$gray-20">
                                        {attempt.correctCount}/{attempt.totalWords}
                                    </CustomText>
                                </XStack>
                                {stressLabel && (
                                    <XStack justifyContent="space-between" paddingTop={8} borderTopWidth={1} borderColor="$gray-85">
                                        <CustomText size="p1Regular" color="$gray-40">
                                            {i18n.t("reading_speed_stress_accuracy")}
                                        </CustomText>
                                        <CustomText size="h4Medium" color="$gray-20">
                                            {stressLabel}
                                        </CustomText>
                                    </XStack>
                                )}
                            </YStack>

                            {attempt.audioFileName && (
                                <AudioPlayerBar attemptId={attempt.id}/>
                            )}

                            {referenceWords.length > 0 && (
                                <YStack
                                    backgroundColor="#FFFFFF"
                                    borderRadius={28}
                                    padding={20}
                                    borderWidth={1}
                                    borderColor="$gray-85"
                                >
                                    <RecognizedTextView
                                        words={referenceWords}
                                        statuses={wordStatuses}
                                        stressIncorrectIndices={stressIncorrectIndices}
                                    />
                                </YStack>
                            )}
                        </YStack>
                    </ScrollView>
                )}
            </YStack>

            <WordStatusLegendModal isOpen={isLegendOpen} onClose={() => setIsLegendOpen(false)}/>
        </>
    );
};

export default ReadingHistoryDetails;
