import React, {useEffect, useState, useMemo} from "react";
import {View, XStack, YStack} from "tamagui";
import {ActivityIndicator, TouchableOpacity} from "react-native";
import {useRouter} from "expo-router";

import {useAppDispatch, useAppSelector} from "@/store";
import {Question} from "@/types/Question";
import CustomStackScreen from "@/components/CustomStackScreen";
import {CustomText} from "@/components/CustomText";
import {savePassedTest, selectAnswer} from "@/store/testSlice";
import {Status} from "@/types";
import i18n from "@/localization/i18n";

const Test = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();

    const {currentTest, savingTestInfo} = useAppSelector((state) => state.test);
    const [currentQuestion, setCurrentQuestion] = useState<Question | undefined>();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const optionLabels = useMemo(() => ["A", "B", "C", "D", "E", "F"], []);

    useEffect(() => {
        if (currentTest && currentTest.questions.length > 0) {
            setCurrentQuestion(currentTest.questions[currentQuestionIndex]);
        }
    }, [currentQuestionIndex, currentTest]);

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

    const onAnswerSelected = (answerId: number) => {
        dispatch(selectAnswer({questionIndex: currentQuestionIndex, selectedAnswerId: answerId}));
        if (currentQuestionIndex + 1 >= currentTest.questions.length) {
            dispatch(savePassedTest());
            router.navigate("/testPassing/results");
            return;
        }
        setCurrentQuestionIndex(currentQuestionIndex + 1);
    };

    // Calculate progress percentage
    const progressPercent = currentTest.questions.length > 0
        ? ((currentQuestionIndex + 1) / currentTest.questions.length) * 100
        : 0;

    return (
        <>
            <CustomStackScreen/>
            <YStack flex={1} paddingHorizontal={16} gap={24} justifyContent="space-between" paddingVertical={24}>
                
                {/* Progress bar container */}
                <YStack gap={8}>
                    <XStack justifyContent="space-between" alignItems="center">
                        <CustomText size="p3Medium" color="$gray-40">
                            {i18n.t("reading_assessment").toUpperCase()}
                        </CustomText>
                        <CustomText size="p3Medium" color="#CB5A2E">
                            {i18n.t("reading_speed_quiz_progress", {current: currentQuestionIndex + 1, total: currentTest.questions.length})}
                        </CustomText>
                    </XStack>
                    <View backgroundColor="$gray-85" height={8} borderRadius={999} overflow="hidden">
                        <View
                            backgroundColor="#CB5A2E"
                            height="100%"
                            borderRadius={999}
                            style={{width: `${progressPercent}%`}}
                        />
                    </View>
                </YStack>

                {/* Question Card */}
                <YStack
                    backgroundColor="#FFFFFF"
                    borderRadius={28}
                    padding={24}
                    borderWidth={1}
                    borderColor="$gray-85"
                    justifyContent="center"
                    alignItems="center"
                    flex={1}
                    marginVertical={12}
                >
                    <CustomText size="h3Medium" color="$gray-20" textAlign="center" style={{lineHeight: 34}}>
                        {currentQuestion?.question}
                    </CustomText>
                </YStack>

                {/* Choices/Answers */}
                <YStack gap={12}>
                    {currentQuestion?.answers.map((answer, index) => {
                        const optionLabel = optionLabels[index] || "?";
                        return (
                            <TouchableOpacity
                                key={answer.id}
                                activeOpacity={0.8}
                                onPress={() => onAnswerSelected(answer.id)}
                            >
                                <XStack
                                    backgroundColor="#FFFFFF"
                                    borderRadius={20}
                                    padding={16}
                                    alignItems="center"
                                    borderWidth={1}
                                    borderColor="$gray-85"
                                    gap={16}
                                    style={{
                                        shadowColor: "rgba(43, 32, 19, 0.08)",
                                        shadowOffset: {width: 0, height: 2},
                                        shadowRadius: 4,
                                        shadowOpacity: 1,
                                    }}
                                >
                                    <View
                                        width={36}
                                        height={36}
                                        borderRadius={18}
                                        backgroundColor="#FBEAD9"
                                        alignItems="center"
                                        justifyContent="center"
                                    >
                                        <CustomText size="p2Medium" color="#CB5A2E">
                                            {optionLabel}
                                        </CustomText>
                                    </View>
                                    <CustomText size="p1Regular" color="$gray-20" flex={1}>
                                        {answer.answer}
                                    </CustomText>
                                </XStack>
                            </TouchableOpacity>
                        );
                    })}
                </YStack>

            </YStack>
        </>
    );
};

export default Test;