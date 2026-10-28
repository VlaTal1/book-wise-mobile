import React, {useCallback, useEffect, useState} from "react";
import {useRouter} from "expo-router";
import {useBackHandler} from "@react-native-community/hooks";
import {ScrollView, XStack, YStack} from "tamagui";
import { RefreshControl, TouchableOpacity} from "react-native";

import useApi from "@/hooks/useApi";
import i18n from "@/localization/i18n";
import CustomStackScreen from "@/components/CustomStackScreen";
import Header from "@/components/Header";
import HeaderButton from "@/components/buttons/HeaderButton";
import {useRole} from "@/hooks/roleContext";
import {Test} from "@/types/Test";
import testApi from "@/api/endpoints/testApi";
import {CustomText} from "@/components/CustomText";
import TestButton from "@/components/buttons/TestButton";
import participantApi from "@/api/endpoints/participantApi";
import LabelledInput from "@/components/LabelledInput";
import Input from "@/components/input";
import NextIcon from "@/assets/images/icons/next-icon.svg";
import {Participant} from "@/types/Paticipant";
import ParticipantSelectModal from "@/components/modal/participant-select-modal";

const Tests = () => {
    const {studentId, isTeacher} = useRole();
    const router = useRouter();

    const [tests, setTests] = useState<Test[]>([])
    const [currentParticipant, setCurrentParticipant] = useState<Participant | undefined>(undefined)

    const [isParticipantSelectModalOpen, setIsParticipantSelectModalOpen] = useState(false)

    const onCancel = useCallback(() => {
        router.back();
    }, [router]);

    useBackHandler(() => {
        onCancel();
        return true;
    })

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

    const fetchAllParticipantApi = useApi(
        participantApi.fetchStudents,
        {
            onSuccess: (data) => {
                if (data.length > 0) {
                    setCurrentParticipant(data[0])
                }
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_fetch_students")}\n${i18n.t("please_try_again_later")}`,
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

    const invokeFetchAllParticipants = useCallback(() => {
        fetchAllParticipantApi.execute();
    }, [fetchAllParticipantApi]);

    const invokeFetchTestsByParticipantIdApi = useCallback(() => {
        if (studentId) {
            fetchTestsByParticipantIdApi.execute(studentId);
        } else if (currentParticipant) {
            fetchTestsByParticipantIdApi.execute(currentParticipant.id.toString());
        }
    }, [fetchTestsByParticipantIdApi, studentId, currentParticipant]);

    useEffect(() => {
        invokeFetchTestsByParticipantIdApi()
    }, [isTeacher, currentParticipant]);

    useEffect(() => {
        if (isTeacher) {
            invokeFetchAllParticipants()
        }
    }, []);

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
                    refreshControl={
                        <RefreshControl
                            refreshing={fetchTestsByParticipantIdApi.loading}
                            onRefresh={invokeFetchTestsByParticipantIdApi}
                        />
                    }
                    contentContainerStyle={{paddingHorizontal: 16}}
                >
                    <YStack flex={1} gap={20}>
                        <YStack gap={16}>
                            <CustomText size="h2">
                                {i18n.t("tests")}
                            </CustomText>
                            {isTeacher && (
                                <LabelledInput label={i18n.t("student")} htmlFor="studentName">
                                    <TouchableOpacity
                                        onPress={() => setIsParticipantSelectModalOpen(true)}
                                        activeOpacity={0.7}
                                    >
                                        <Input
                                            id="studentName"
                                            inputEnabled={false}
                                            value={currentParticipant?.name || i18n.t("name")}
                                            placeholder={i18n.t("name")}
                                            rightElement={<NextIcon fill="black"/>}
                                        />
                                    </TouchableOpacity>
                                </LabelledInput>
                            )}
                            <YStack gap={6} paddingBottom={80}>
                                {
                                    tests.map((test) => (
                                        <TestButton key={test.id} test={test}/>
                                    ))
                                }
                            </YStack>
                        </YStack>
                    </YStack>
                </ScrollView>
            </YStack>

            <ParticipantSelectModal
                onClose={() => setIsParticipantSelectModalOpen(false)}
                isOpen={isParticipantSelectModalOpen}
                onSelectParticipant={setCurrentParticipant}
            />
        </>
    )
}

export default Tests;