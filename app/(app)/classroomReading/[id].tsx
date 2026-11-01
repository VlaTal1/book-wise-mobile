import React, {useCallback, useEffect, useState} from "react";
import {ScrollView, XStack, YStack} from "tamagui";
import {useLocalSearchParams, useRouter} from "expo-router";
import {useBackHandler} from "@react-native-community/hooks";
import {ActivityIndicator, RefreshControl} from "react-native";
import Feather from "@expo/vector-icons/Feather";

import CustomStackScreen from "@/components/CustomStackScreen";
import Header from "@/components/Header";
import HeaderButton from "@/components/buttons/HeaderButton";
import {CustomText} from "@/components/CustomText";
import {formatAttempts, formatFragment, formatTimeLimit} from "@/components/buttons/ClassroomReadingCard";
import i18n from "@/localization/i18n";
import useApi from "@/hooks/useApi";
import classroomReadingApi from "@/api/endpoints/classroomReadingApi";
import {ClassroomReadingResults, StudentReadingResult} from "@/types/ClassroomReading";

const gradeColors = (grade: number) => {
    if (grade >= 7) {
        return {bg: "#E7F3EA", text: "#2F6B45"};
    }
    if (grade >= 4) {
        return {bg: "#FBF1DC", text: "#8A6416"};
    }
    return {bg: "#FBEAE8", text: "#C1443A"};
};

const StudentRow = ({result, position, maxAttempts, onPress}: {
    result: StudentReadingResult;
    position: number | null;
    maxAttempts: number | null;
    onPress?: () => void;
}) => {
    const colors = result.bestGrade !== null ? gradeColors(result.bestGrade) : null;
    const attempts = maxAttempts === null
        ? i18n.t("reading_results_attempts", {count: result.attemptsCount})
        : i18n.t("reading_results_attempts_of", {count: result.attemptsCount, max: maxAttempts});

    return (
        <XStack
            backgroundColor="#FFFFFF"
            borderRadius={16}
            paddingHorizontal={14}
            paddingVertical={12}
            borderWidth={1}
            borderColor="$gray-85"
            alignItems="center"
            gap={12}
            pressStyle={onPress ? {opacity: 0.7} : undefined}
            onPress={onPress}
        >
            <CustomText size="h5Medium" color="$gray-40" width={24} textAlign="center">
                {position ?? "—"}
            </CustomText>
            <YStack flex={1} gap={2}>
                <CustomText size="p1Medium" color="$gray-20" numberOfLines={1}>
                    {result.participantName}
                </CustomText>
                <CustomText size="p3Regular" color="$gray-40">
                    {result.attemptsCount === 0 ? i18n.t("reading_results_no_attempts") : attempts}
                    {result.bestWpm !== null ? ` · ${i18n.t("reading_results_wpm", {wpm: Math.round(result.bestWpm)})}` : ""}
                </CustomText>
                {result.gradePending && (
                    <XStack alignItems="center" gap={6}>
                        <ActivityIndicator size={10} color="#A68A63"/>
                        <CustomText size="p3Regular" color="#A68A63">
                            {i18n.t("reading_results_pending")}
                        </CustomText>
                    </XStack>
                )}
            </YStack>
            {colors && result.bestGrade !== null ? (
                <XStack backgroundColor={colors.bg} paddingHorizontal={12} paddingVertical={6} borderRadius={999}>
                    <CustomText size="h5Medium" color={colors.text}>
                        {result.bestGrade}/10
                    </CustomText>
                </XStack>
            ) : (
                <CustomText size="h5Medium" color="$gray-60">—</CustomText>
            )}
        </XStack>
    );
};

// Результати фрагмента для читання по учнях класу: від найкращої оцінки до
// найгіршої (найкраща спроба кожного учня) з кількістю використаних спроб.
const ClassroomReadingResultsScreen = () => {
    const router = useRouter();
    const {id, classroomId} = useLocalSearchParams<{id: string; classroomId: string}>();

    const [results, setResults] = useState<ClassroomReadingResults | undefined>(undefined);

    const onBack = useCallback(() => {
        router.back();
    }, [router]);

    useBackHandler(() => {
        onBack();
        return true;
    });

    const fetchResultsApi = useApi(
        classroomReadingApi.fetchResults,
        {
            onSuccess: (data) => {
                setResults(data);
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_fetch_reading_results")}\n${i18n.t("please_try_again_later")}`,
                options: {
                    tryAgain: true,
                    cancel: true,
                    navigate: {
                        mode: "back",
                    },
                },
            },
        },
    );

    const invokeFetch = useCallback(() => {
        fetchResultsApi.execute({classroomId, readingId: id});
    }, [fetchResultsApi, classroomId, id]);

    useEffect(() => {
        invokeFetch();
    }, []);

    const reading = results?.reading;
    let position = 0;

    return (
        <>
            <CustomStackScreen/>
            <YStack flex={1}>
                <Header backgroundColor="transparent">
                    <XStack justifyContent="space-between" width="100%">
                        <HeaderButton
                            onPress={onBack}
                            backgroundColor="transparent"
                            color="$gray-20"
                            text={i18n.t("back")}
                        />
                    </XStack>
                </Header>

                {!results || !reading ? (
                    <YStack flex={1} justifyContent="center" alignItems="center">
                        <ActivityIndicator size="large" color="#CB5A2E"/>
                    </YStack>
                ) : (
                    <ScrollView
                        contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 40}}
                        refreshControl={
                            <RefreshControl refreshing={fetchResultsApi.loading} onRefresh={invokeFetch}/>
                        }
                    >
                        <YStack gap={20}>
                            <YStack
                                backgroundColor="#FFFFFF"
                                borderRadius={28}
                                padding={20}
                                borderWidth={1}
                                borderColor="$gray-85"
                                gap={8}
                            >
                                <XStack alignItems="center" gap={8}>
                                    <Feather name="book-open" size={20} color="#2F6F62"/>
                                    <CustomText size="h3Medium" color="$gray-20" flex={1}>
                                        {i18n.t("reading_results")}
                                    </CustomText>
                                </XStack>
                                <CustomText size="h5Medium" color="$gray-20">
                                    {reading.bookTitle}
                                </CustomText>
                                <CustomText size="p2Regular" color="$gray-40">
                                    {formatFragment(reading)}
                                </CustomText>
                                <CustomText size="p2Regular" color="$gray-40">
                                    {formatTimeLimit(reading.timeLimitSeconds)}
                                    {" · "}
                                    {formatAttempts(reading.maxAttempts)}
                                </CustomText>
                                {reading.preview && (
                                    <CustomText size="p2Regular" color="$gray-40" fontStyle="italic" numberOfLines={3}>
                                        {reading.preview}
                                    </CustomText>
                                )}
                            </YStack>

                            <YStack gap={8}>
                                {results.students.length === 0 && (
                                    <CustomText size="p2Regular" color="$gray-40" paddingLeft={4}>
                                        {i18n.t("reading_results_empty")}
                                    </CustomText>
                                )}
                                {results.students.map((result) => {
                                    // Місце в рейтингу — лише в учнів з оцінкою.
                                    const rank = result.bestGrade !== null ? ++position : null;
                                    return (
                                        <StudentRow
                                            key={result.participantId}
                                            result={result}
                                            position={rank}
                                            maxAttempts={reading.maxAttempts}
                                            onPress={result.bestAttemptId !== null
                                                ? () => router.navigate(`/readingHistory/${result.bestAttemptId}`)
                                                : undefined}
                                        />
                                    );
                                })}
                            </YStack>
                        </YStack>
                    </ScrollView>
                )}
            </YStack>
        </>
    );
};

export default ClassroomReadingResultsScreen;
