import React, {useEffect, useRef, useState} from "react";
import {ActivityIndicator, ScrollView} from "react-native";
import {XStack, YStack} from "tamagui";
import {useBackHandler} from "@react-native-community/hooks";
import {useRouter} from "expo-router";

import CustomStackScreen from "@/components/CustomStackScreen";
import Header from "@/components/Header";
import HeaderButton from "@/components/buttons/HeaderButton";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import {CustomText} from "@/components/CustomText";
import {HighlightedWordText} from "@/components/readingSpeed/HighlightedWordText";
import i18n from "@/localization/i18n";
import {useUserMode} from "@/hooks/userModeContext";
import {requestMicrophonePermission, startAudioStream, stopAudioStream} from "@/services/audioStreamRecorder";
import {ReadingSpeedSocket} from "@/services/readingSpeedSocket";
import readingSpeedAttemptApi from "@/api/endpoints/readingSpeedAttemptApi";
import {ReadingSpeedMetrics, ReferenceWord, StressStatus, WordStatus} from "@/types/ReadingSpeed";

// Скільки чекати між опитуваннями стану шару перевірки наголосу — forced
// alignment триває секунди, не мілісекунди (docs/reading-speed-implementation-
// overview.md), тому частіше опитувати немає сенсу.
const STRESS_POLL_INTERVAL_MS = 3000;
const STRESS_TERMINAL_STATUSES: StressStatus[] = ["DONE", "FAILED", "NOT_APPLICABLE"];

// MVP: один захардкоджений текст на бекенді (розділ 7 дизайн-дока), пізніше
// стане параметром екрана з вибором уривку книги.
const DEFAULT_TEXT_ID = "text_1";

type Phase = "idle" | "connecting" | "reading" | "finished";

const ReadingSpeed = () => {
    const router = useRouter();
    const {childId} = useUserMode();

    const [phase, setPhase] = useState<Phase>("idle");
    const [referenceWords, setReferenceWords] = useState<ReferenceWord[]>([]);
    const [referenceTitle, setReferenceTitle] = useState("");
    const [statuses, setStatuses] = useState<Record<number, WordStatus>>({});
    const [tentativeStatuses, setTentativeStatuses] = useState<Record<number, WordStatus>>({});
    const [metrics, setMetrics] = useState<ReadingSpeedMetrics | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Окремий (асинхронний, рахується в фоні на бекенді) шар перевірки
    // наголосу — attemptId приходить у "result", далі мобілка лише опитує
    // Java за станом. Якщо користувач покине цей екран, поллінг зупиниться
    // (див. cleanup), але сама обробка на бекенді триватиме незалежно.
    const [attemptId, setAttemptId] = useState<number | null>(null);
    const [stressStatus, setStressStatus] = useState<StressStatus | null>(null);
    const [stressProgress, setStressProgress] = useState<number | null>(null);
    const [stressAccuracy, setStressAccuracy] = useState<number | null>(null);

    const socketRef = useRef<ReadingSpeedSocket | null>(null);
    const stressPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopStressPolling = () => {
        if (stressPollRef.current) {
            clearInterval(stressPollRef.current);
            stressPollRef.current = null;
        }
    };

    const startStressPolling = (id: number) => {
        stopStressPolling();

        const poll = async () => {
            const response = await readingSpeedAttemptApi.getById(id);
            if (!response.success) {
                return;
            }
            setStressStatus(response.data.stressStatus);
            setStressProgress(response.data.stressProgress);
            setStressAccuracy(response.data.stressAccuracy);
            if (STRESS_TERMINAL_STATUSES.includes(response.data.stressStatus)) {
                stopStressPolling();
            }
        };

        poll();
        stressPollRef.current = setInterval(poll, STRESS_POLL_INTERVAL_MS);
    };

    const cleanup = () => {
        stopAudioStream();
        socketRef.current?.close();
        socketRef.current = null;
        stopStressPolling();
    };

    useEffect(() => {
        return cleanup;
    }, []);

    // Завершення сесії детектує сервер (навіть якщо останні кілька слів ще не
    // "дозріли" через TAIL_HOLDBACK) і сам шле "result" — клієнту достатньо
    // просто чекати onResult, окремий client-side автостоп не потрібен.

    const onCancel = () => {
        cleanup();
        router.back();
    };

    useBackHandler(() => {
        onCancel();
        return true;
    });

    const handleStart = async () => {
        if (!childId) {
            return;
        }

        setErrorMessage(null);
        setStatuses({});
        setTentativeStatuses({});
        setMetrics(null);
        setAttemptId(null);
        setStressStatus(null);
        setStressProgress(null);
        setStressAccuracy(null);
        stopStressPolling();
        setPhase("connecting");

        const granted = await requestMicrophonePermission();
        if (!granted) {
            setErrorMessage(i18n.t("microphone_permission_denied"));
            setPhase("idle");
            return;
        }

        const socket = new ReadingSpeedSocket();
        socketRef.current = socket;

        try {
            const reference = await socket.connect(childId, DEFAULT_TEXT_ID, {
                onWordEvent: (event) => {
                    if (event.tentative) {
                        setTentativeStatuses((prev) => ({...prev, [event.index]: event.status}));
                    } else {
                        setStatuses((prev) => ({...prev, [event.index]: event.status}));
                    }
                },
                onResult: (result) => {
                    setMetrics(result.metrics);
                    setPhase("finished");
                    stopAudioStream();
                    if (result.attempt_id !== null) {
                        setAttemptId(result.attempt_id);
                        setStressStatus("PENDING");
                        startStressPolling(result.attempt_id);
                    }
                },
                onError: (error) => {
                    console.error("[ReadingSpeed] socket error", error);
                },
                onClose: () => {
                    socketRef.current = null;
                },
            });

            setReferenceWords(reference.words);
            setReferenceTitle(reference.title);
            setPhase("reading");

            startAudioStream((chunk) => {
                socketRef.current?.sendAudioChunk(chunk);
            });
        } catch (error) {
            console.error("[ReadingSpeed] failed to start session", error);
            setErrorMessage(i18n.t("reading_speed_connection_failed"));
            setPhase("idle");
        }
    };

    const handleStop = () => {
        stopAudioStream();
        socketRef.current?.stop();
    };

    const handleRestart = () => {
        socketRef.current?.close();
        socketRef.current = null;
        stopStressPolling();
        setPhase("idle");
    };

    return (
        <>
            <CustomStackScreen/>
            <YStack flex={1}>
                <Header backgroundColor="transparent">
                    <XStack justifyContent="space-between" width="100%" paddingHorizontal={8}>
                        <HeaderButton
                            onPress={onCancel}
                            backgroundColor="transparent"
                            color="$gray-20"
                            text={i18n.t("back")}
                        />
                    </XStack>
                </Header>

                <YStack flex={1} paddingHorizontal={16} paddingVertical={16} gap={24}>
                    <CustomText size="h3Medium" color="$gray-20">
                        {i18n.t("reading_speed_title")}
                    </CustomText>

                    {!childId && (
                        <CustomText size="p1Regular" color="$gray-40">
                            {i18n.t("reading_speed_select_child")}
                        </CustomText>
                    )}

                    {errorMessage && (
                        <CustomText size="p1Regular" color="$error-primary">
                            {errorMessage}
                        </CustomText>
                    )}

                    {phase === "idle" && childId && (
                        <YStack flex={1} justifyContent="center" alignItems="center" gap={16}>
                            <CustomText size="p1Regular" color="$gray-40" textAlign="center">
                                {i18n.t("reading_speed_description")}
                            </CustomText>
                            <PrimaryButton
                                text={i18n.t("reading_speed_start")}
                                onPress={handleStart}
                                width="80%"
                            />
                        </YStack>
                    )}

                    {phase === "connecting" && (
                        <YStack flex={1} justifyContent="center" alignItems="center">
                            <ActivityIndicator size="large" color="#CB5A2E"/>
                        </YStack>
                    )}

                    {phase === "reading" && (
                        <>
                            <CustomText size="h5Medium" color="$gray-40">
                                {referenceTitle}
                            </CustomText>
                            <ScrollView style={{flex: 1}}>
                                <HighlightedWordText
                                    words={referenceWords}
                                    statuses={statuses}
                                    tentativeStatuses={tentativeStatuses}
                                />
                            </ScrollView>
                            <PrimaryButton
                                text={i18n.t("reading_speed_stop")}
                                onPress={handleStop}
                            />
                        </>
                    )}

                    {phase === "finished" && metrics && (
                        <YStack flex={1} gap={16} justifyContent="center">
                            <YStack
                                backgroundColor="#FFFFFF"
                                borderRadius={28}
                                padding={24}
                                borderWidth={1}
                                borderColor="$gray-85"
                                gap={12}
                                style={{
                                    shadowColor: "rgba(43, 32, 19, 0.08)",
                                    shadowOffset: {width: 0, height: 4},
                                    shadowRadius: 10,
                                    shadowOpacity: 1,
                                }}
                            >
                                <XStack justifyContent="space-between">
                                    <CustomText size="p1Regular" color="$gray-40">
                                        {i18n.t("reading_speed_wpm")}
                                    </CustomText>
                                    <CustomText size="h4Medium" color="$gray-20">
                                        {metrics.wpm}
                                    </CustomText>
                                </XStack>
                                <XStack justifyContent="space-between">
                                    <CustomText size="p1Regular" color="$gray-40">
                                        {i18n.t("reading_speed_accuracy")}
                                    </CustomText>
                                    <CustomText size="h4Medium" color="$gray-20">
                                        {Math.round(metrics.accuracy * 100)}%
                                    </CustomText>
                                </XStack>
                                <XStack justifyContent="space-between">
                                    <CustomText size="p2Regular" color="$gray-40">
                                        {i18n.t("reading_speed_correct")}
                                    </CustomText>
                                    <CustomText size="p2Medium" color="$gray-20">
                                        {metrics.correct_count}/{metrics.total_words}
                                    </CustomText>
                                </XStack>
                                <XStack justifyContent="space-between">
                                    <CustomText size="p2Regular" color="$gray-40">
                                        {i18n.t("reading_speed_errors")}
                                    </CustomText>
                                    <CustomText size="p2Medium" color="$gray-20">
                                        {metrics.error_count}
                                    </CustomText>
                                </XStack>
                                <XStack justifyContent="space-between">
                                    <CustomText size="p2Regular" color="$gray-40">
                                        {i18n.t("reading_speed_skipped")}
                                    </CustomText>
                                    <CustomText size="p2Medium" color="$gray-20">
                                        {metrics.skipped_count}
                                    </CustomText>
                                </XStack>

                                {stressStatus && stressStatus !== "NOT_APPLICABLE" && (
                                    <YStack gap={6} paddingTop={4} borderTopWidth={1} borderColor="$gray-85">
                                        <XStack justifyContent="space-between" alignItems="center" paddingTop={8}>
                                            <CustomText size="p1Regular" color="$gray-40">
                                                {i18n.t("reading_speed_stress_accuracy")}
                                            </CustomText>

                                            {stressStatus === "DONE" && (
                                                <CustomText size="h4Medium" color="$gray-20">
                                                    {stressAccuracy !== null ? `${Math.round(stressAccuracy * 100)}%` : "—"}
                                                </CustomText>
                                            )}

                                            {stressStatus === "FAILED" && (
                                                <CustomText size="p2Regular" color="$gray-40">
                                                    {i18n.t("reading_speed_stress_failed")}
                                                </CustomText>
                                            )}

                                            {(stressStatus === "PENDING" || stressStatus === "PROCESSING") && (
                                                <XStack alignItems="center" gap={8}>
                                                    <ActivityIndicator size="small" color="#CB5A2E"/>
                                                    <CustomText size="p2Regular" color="$gray-40">
                                                        {stressProgress !== null
                                                            ? `${stressProgress}%`
                                                            : i18n.t("reading_speed_stress_processing")}
                                                    </CustomText>
                                                </XStack>
                                            )}
                                        </XStack>

                                        {(stressStatus === "PENDING" || stressStatus === "PROCESSING") && (
                                            <>
                                                <YStack height={6} borderRadius={3} backgroundColor="$gray-85" overflow="hidden">
                                                    <YStack
                                                        height="100%"
                                                        width={`${stressProgress ?? 6}%`}
                                                        backgroundColor="#CB5A2E"
                                                        borderRadius={3}
                                                    />
                                                </YStack>
                                                <CustomText size="p3Regular" color="$gray-40">
                                                    {i18n.t("reading_speed_stress_hint")}
                                                </CustomText>
                                            </>
                                        )}
                                    </YStack>
                                )}
                            </YStack>
                            <PrimaryButton
                                text={i18n.t("reading_speed_try_again")}
                                onPress={handleRestart}
                            />
                        </YStack>
                    )}
                </YStack>
            </YStack>
        </>
    );
};

export default ReadingSpeed;
