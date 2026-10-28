import React, {useCallback, useState} from "react";
import {ScrollView, XStack, YStack} from "tamagui";
import {ActivityIndicator, FlatList, RefreshControl} from "react-native";
import {useBackHandler} from "@react-native-community/hooks";
import {useFocusEffect, useRouter} from "expo-router";

import useApi from "@/hooks/useApi";
import classroomApi from "@/api/endpoints/classroomApi";
import i18n from "@/localization/i18n";
import {Classroom} from "@/types/Classroom";
import CustomStackScreen from "@/components/CustomStackScreen";
import Header from "@/components/Header";
import HeaderButton from "@/components/buttons/HeaderButton";
import ClassroomButton from "@/components/buttons/ClassroomButton";
import BottomButtonGroup from "@/components/buttons/BottomButtonGroup";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import CreateClassroomModal from "@/components/modal/create-classroom-modal";
import JoinClassroomModal from "@/components/modal/join-classroom-modal";
import {CustomText} from "@/components/CustomText";
import {useRole} from "@/hooks/roleContext";

// Вчитель: список його класів і створення нового.
// Учень без класу: вступ за кодом (учня з класом головний екран веде
// одразу на classroom/[id]).
const Classrooms = () => {
    const router = useRouter();
    const {isTeacher, refreshProfile} = useRole();

    const [classrooms, setClassrooms] = useState<Classroom[]>([]);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

    const onCancel = useCallback(() => {
        router.back();
    }, [router]);

    useBackHandler(() => {
        onCancel();
        return true;
    })

    const fetchClassroomsApi = useApi(
        classroomApi.fetchClassrooms,
        {
            onSuccess: (data) => {
                setClassrooms(data);
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_fetch_classrooms")}\n${i18n.t("please_try_again_later")}`,
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

    const invokeFetchClassrooms = useCallback(() => {
        fetchClassroomsApi.execute();
    }, [fetchClassroomsApi]);

    // Перезавантажуємо при поверненні з екрана класу (міг бути видалений/змінений).
    useFocusEffect(useCallback(() => {
        invokeFetchClassrooms()
    }, []));

    const onJoined = useCallback(async (classroom: Classroom) => {
        await refreshProfile();
        router.replace(`/classroom/${classroom.id}`);
    }, [refreshProfile, router]);

    if (fetchClassroomsApi.loading && classrooms.length === 0) {
        return (
            <>
                <CustomStackScreen/>
                <YStack flex={1} justifyContent="center" alignItems="center">
                    <ActivityIndicator size="large" color="#CB5A2E"/>
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
                <ScrollView
                    contentContainerStyle={{flex: classrooms.length === 0 ? 1 : "unset", paddingHorizontal: 16}}
                    refreshControl={
                        <RefreshControl
                            refreshing={fetchClassroomsApi.loading}
                            onRefresh={invokeFetchClassrooms}
                        />
                    }
                >
                    <CustomText size="h2">
                        {i18n.t(isTeacher ? "classrooms" : "my_classroom")}
                    </CustomText>
                    {classrooms.length === 0 && (
                        <CustomText size="p1Regular" color="$gray-40" paddingTop={8}>
                            {i18n.t(isTeacher ? "no_classrooms_teacher" : "no_classroom_student")}
                        </CustomText>
                    )}
                    <YStack flex={1} height="100%" paddingBottom={80}>
                        <FlatList
                            numColumns={1}
                            contentContainerStyle={{
                                marginVertical: 11,
                                gap: 8,
                            }}
                            scrollEnabled={false}
                            data={classrooms}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({item}) => (
                                <ClassroomButton
                                    key={item.id}
                                    classroom={item}
                                    onPress={() => router.navigate(`/classroom/${item.id}`)}
                                />
                            )}
                        />
                    </YStack>
                </ScrollView>
            </YStack>

            <BottomButtonGroup>
                {isTeacher ? (
                    <PrimaryButton
                        onPress={() => setIsCreateModalOpen(true)}
                        text={i18n.t("create_classroom")}
                    />
                ) : (
                    <PrimaryButton
                        onPress={() => setIsJoinModalOpen(true)}
                        text={i18n.t("join_classroom")}
                    />
                )}
            </BottomButtonGroup>

            <CreateClassroomModal
                onClose={() => setIsCreateModalOpen(false)}
                isOpen={isCreateModalOpen}
                onSave={(classroom) => router.navigate(`/classroom/${classroom.id}`)}
            />

            <JoinClassroomModal
                onClose={() => setIsJoinModalOpen(false)}
                isOpen={isJoinModalOpen}
                onSave={onJoined}
                hasClassroom={classrooms.length > 0}
            />
        </>
    )
}

export default Classrooms
