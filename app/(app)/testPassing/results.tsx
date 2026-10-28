import React, {useMemo} from "react";
import {View, XStack, YStack} from "tamagui";
import {ActivityIndicator, TouchableOpacity} from "react-native";
import {useRouter} from "expo-router";
import Feather from "@expo/vector-icons/Feather";

import {useAppDispatch, useAppSelector} from "@/store";
import CustomStackScreen from "@/components/CustomStackScreen";
import {CustomText} from "@/components/CustomText";
import {Status} from "@/types";
import i18n from "@/localization/i18n";
import BottomButtonGroup from "@/components/buttons/BottomButtonGroup";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import {resetCurrentTest} from "@/store/testSlice";

const Results = () => {
    const {currentTest, savingTestInfo} = useAppSelector((state) => state.test);

    const router = useRouter();
    const dispatch = useAppDispatch();

    const handleHomeButtonPress = () => {
        dispatch(resetCurrentTest());
        router.dismissTo("/");
    };

    // Calculate score details
    const scoreColor = useMemo(() => {
        if (!currentTest) return "#CB5A2E";
        if (currentTest.grade >= 8) return "#3F8A5D"; // Emerald
        if (currentTest.grade >= 5) return "#D69E2E"; // Amber
        return "#C1443A"; // Red
    }, [currentTest]);

    const celebrationMessage = useMemo(() => {
        if (!currentTest) return "";
        if (currentTest.grade >= 8) return i18n.t("result_message_excellent");
        if (currentTest.grade >= 5) return i18n.t("result_message_good");
        return i18n.t("result_message_keep_practicing");
    }, [currentTest]);

    const totalQuestions = useMemo(() => {
        if (!currentTest) return 0;
        return currentTest.questions.length;
    }, [currentTest]);

    if (!currentTest || savingTestInfo.status === Status.LOADING) {
        return (
            <>
                <CustomStackScreen/>
                <YStack flex={1}>
                    <YStack flex={1} justifyContent="center" alignItems="center">
                        <ActivityIndicator size="large" color="#CB5A2E"/>
                    </YStack>
                </YStack>
            </>
        );
    }

    return (
        <>
            <CustomStackScreen/>
            <YStack flex={1} paddingHorizontal={16} gap={24} justifyContent="center" alignItems="center" paddingBottom={80}>
                
                {/* Score Circle */}
                <View
                    width={160}
                    height={160}
                    borderRadius={80}
                    borderWidth={8}
                    borderColor={scoreColor}
                    justifyContent="center"
                    alignItems="center"
                    backgroundColor="#FFFFFF"
                    style={{
                        shadowColor: scoreColor,
                        shadowOffset: {width: 0, height: 8},
                        shadowRadius: 16,
                        shadowOpacity: 0.15,
                        elevation: 6,
                    }}
                >
                    <YStack alignItems="center" gap={2}>
                        <CustomText size="h1" color="$gray-20" style={{fontSize: 36, lineHeight: 40}}>
                            {currentTest.grade.toFixed(0)}
                        </CustomText>
                        <CustomText size="p2Medium" color="$gray-40">
                            / 10 points
                        </CustomText>
                    </YStack>
                </View>

                {/* Celebration Title */}
                <YStack alignItems="center" gap={8} marginTop={12}>
                    <CustomText size="h2" color="$gray-20" textAlign="center">
                        {celebrationMessage}
                    </CustomText>
                    <CustomText size="p1Regular" color="$gray-40" textAlign="center">
                        You have successfully completed the test!
                    </CustomText>
                </YStack>

                {/* Reward Card / Summary */}
                <YStack
                    backgroundColor="#FFFFFF"
                    borderRadius={24}
                    padding={20}
                    borderWidth={1}
                    borderColor="$gray-85"
                    width="100%"
                    gap={14}
                    style={{
                        shadowColor: "rgba(43, 32, 19, 0.08)",
                        shadowOffset: {width: 0, height: 4},
                        shadowRadius: 8,
                        shadowOpacity: 1,
                    }}
                >
                    {/* Book name and details */}
                    <XStack gap={12} alignItems="center" borderBottomWidth={1} borderBottomColor="$gray-93" paddingBottom={12}>
                        <View
                            backgroundColor="#FBEAD9"
                            padding={8}
                            borderRadius={14}
                        >
                            <Feather name="book" size={20} color="#CB5A2E" />
                        </View>
                        <YStack flex={1} gap={2}>
                            <CustomText size="p2Medium" color="$gray-20" numberOfLines={1}>
                                {currentTest.progress.book.title}
                            </CustomText>
                            <CustomText size="p3Regular" color="$gray-40">
                                {currentTest.progress.book.author}
                            </CustomText>
                        </YStack>
                    </XStack>

                    {/* Score stats */}
                    <CustomText size="p2Medium" color="$gray-20">
                        {i18n.t("correct_answer_amount", {amount: currentTest.correctAnswers})}
                    </CustomText>

                    {/* Progress details */}
                    <CustomText size="p2Medium" color="$gray-20">
                        {i18n.t("pages_range", {start: currentTest.startPage, end: currentTest.endPage})}
                    </CustomText>
                </YStack>

            </YStack>

            <BottomButtonGroup>
                <PrimaryButton
                    onPress={handleHomeButtonPress}
                    text={i18n.t("back_to_home")}
                />
            </BottomButtonGroup>
        </>
    );
};

export default Results;