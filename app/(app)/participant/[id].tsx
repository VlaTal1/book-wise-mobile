import React, {useCallback, useEffect, useState} from "react";
import {ScrollView, View, XStack, YStack} from "tamagui";
import {useLocalSearchParams, useRouter} from "expo-router";
import {useBackHandler} from "@react-native-community/hooks";
import {ActivityIndicator} from "react-native";

import CustomStackScreen from "@/components/CustomStackScreen";
import i18n from "@/localization/i18n";
import Header from "@/components/Header";
import HeaderButton from "@/components/buttons/HeaderButton";
import {CustomText} from "@/components/CustomText";
import useApi from "@/hooks/useApi";
import {useRole} from "@/hooks/roleContext";
import participantApi from "@/api/endpoints/participantApi";
import {Participant} from "@/types/Paticipant";
import testApi from "@/api/endpoints/testApi";
import {Test} from "@/types/Test";
import TestButton from "@/components/buttons/TestButton";
import {useAppSelector} from "@/store";
import {getAvatarColor, getInitial} from "@/constants/avatarPalette";

const ParticipantDetails = () => {
    const {isTeacher} = useRole();
    const {id} = useLocalSearchParams();
    const router = useRouter();
    const {testBook} = useAppSelector((state) => state.book)

    const [participant, setParticipant] = useState<Participant | undefined>(undefined);
    const [tests, setTests] = useState<Test[]>([])

    const onCancel = useCallback(() => {
        router.back();
    }, [router]);

    useBackHandler(() => {
        onCancel();
        return true;
    });

    const fetchParticipantByIdApi = useApi(
        participantApi.fetchParticipantById,
        {
            onSuccess: (data) => {
                setParticipant(data);
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_fetch_student")}\n${i18n.t("please_try_again_later")}`,
                options: {
                    tryAgain: true,
                    cancel: true,
                },
            },
        },
    );

    const invokeFetchParticipantByIdApi = useCallback(() => {
        fetchParticipantByIdApi.execute(typeof id === "string" ? id : id[0]);
    }, [fetchParticipantByIdApi, id]);

    useEffect(() => {
        invokeFetchParticipantByIdApi()
    }, []);

    const fetchTestsByParticipantIdApi = useApi(
        testApi.fetchTestsByParticipantId,
        {
            onSuccess: (data) => {
                setTests(data);
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_fetch_tests")}\n${i18n.t("please_try_again_later")}`,
                options: {
                    tryAgain: true,
                    cancel: true,
                },
            },
        },
    );

    const fetchTestsByParticipantIdAndBookIdApi = useApi(
        testApi.fetchTestsByParticipantIdAndBookId,
        {
            onSuccess: (data) => {
                setTests(data);
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_fetch_tests")}\n${i18n.t("please_try_again_later")}`,
                options: {
                    tryAgain: true,
                    cancel: true,
                },
            },
        },
    );

    const invokeFetchTestsByParticipantIdApi = useCallback(() => {
        if (participant) {
            fetchTestsByParticipantIdApi.execute(participant.id.toString());
        }
    }, [participant]);

    const invokeFetchTestsByParticipantIdAndBookIdApi = useCallback(() => {
        if (participant && testBook) {
            fetchTestsByParticipantIdAndBookIdApi.execute({
                participantId: participant.id.toString(),
                bookId: testBook.id.toString(),
            });
        }
    }, [participant, testBook]);

    useEffect(() => {
        if (testBook) {
            invokeFetchTestsByParticipantIdAndBookIdApi()
        } else {
            invokeFetchTestsByParticipantIdApi()
        }
    }, [participant]);

    if (fetchParticipantByIdApi.loading || !participant) {
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
                    <YStack flex={1} justifyContent="center" alignItems="center">
                        <ActivityIndicator size="large" color="#CB5A2E"/>
                    </YStack>
                </YStack>
            </>
        )
    }

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

                <YStack flex={1} paddingHorizontal={16} gap={24}>
                    
                    {/* Participant Profile Card */}
                    <YStack
                        backgroundColor="#FFFFFF"
                        borderRadius={28}
                        padding={24}
                        alignItems="center"
                        borderWidth={1}
                        borderColor="$gray-85"
                        gap={16}
                        style={{
                            shadowColor: "rgba(43, 32, 19, 0.08)",
                            shadowOffset: {width: 0, height: 4},
                            shadowRadius: 10,
                            shadowOpacity: 1,
                        }}
                    >
                        {(() => {
                            const themeColor = getAvatarColor(participant.name);
                            const initial = getInitial(participant.name);

                            return (
                                <View
                                    width={64}
                                    height={64}
                                    borderRadius={32}
                                    backgroundColor={themeColor.bg}
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <CustomText size="h3Medium" color={themeColor.text}>
                                        {initial}
                                    </CustomText>
                                </View>
                            );
                        })()}

                        <YStack alignItems="center" gap={4}>
                            <CustomText size="h2" color="$gray-20" textAlign="center">
                                {participant.name}
                            </CustomText>
                            <CustomText size="p2Regular" color="$gray-40" textAlign="center">
                                {participant.classroomName ?? i18n.t("student_account_profile")}
                            </CustomText>
                        </YStack>
                    </YStack>

                    {isTeacher && (
                        <YStack gap={12} flex={1}>
                            <CustomText size="h5Medium" color="$gray-20" paddingLeft={4}>
                                {i18n.t("tests") || "Assigned Reading Assessments"}
                            </CustomText>
                            <ScrollView contentContainerStyle={{paddingBottom: 180}}>
                                <YStack gap={10}>
                                    {
                                        tests.map((test) => (
                                            <TestButton key={test.id} test={test}/>
                                        ))
                                    }
                                </YStack>
                            </ScrollView>
                        </YStack>
                    )}
                </YStack>
            </YStack>
        </>
    )
};

export default ParticipantDetails;