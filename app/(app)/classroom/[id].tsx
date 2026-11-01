import React, {useCallback, useEffect, useState} from "react";
import {ScrollView, View, XStack, YStack} from "tamagui";
import {useLocalSearchParams, useRouter} from "expo-router";
import {useBackHandler} from "@react-native-community/hooks";
import {ActivityIndicator, Alert, RefreshControl, Share} from "react-native";
import Feather from "@expo/vector-icons/Feather";

import CustomStackScreen from "@/components/CustomStackScreen";
import i18n from "@/localization/i18n";
import Header from "@/components/Header";
import HeaderButton from "@/components/buttons/HeaderButton";
import {CustomText} from "@/components/CustomText";
import useApi from "@/hooks/useApi";
import classroomApi from "@/api/endpoints/classroomApi";
import {Classroom, ClassroomDetails, ClassroomTest} from "@/types/Classroom";
import {Book} from "@/types/Book";
import ParticipantButton from "@/components/buttons/ParticipantButton";
import BookButton from "@/components/buttons/BookButton";
import ClassroomTestCard from "@/components/buttons/ClassroomTestCard";
import BottomButtonGroup from "@/components/buttons/BottomButtonGroup";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";
import BookSelectModal from "@/components/modal/book-select-modal";
import CreateTestModal from "@/components/modal/create-test-modal";
import JoinClassroomModal from "@/components/modal/join-classroom-modal";
import CreateClassroomModal from "@/components/modal/create-classroom-modal";
import {useRole} from "@/hooks/roleContext";

const ClassroomScreen = () => {
    const {isTeacher, refreshProfile} = useRole();
    const {id} = useLocalSearchParams();
    const classroomId = typeof id === "string" ? id : id[0];
    const router = useRouter();

    const [classroom, setClassroom] = useState<ClassroomDetails | undefined>(undefined);

    const [isBookSelectModalOpen, setIsBookSelectModalOpen] = useState(false);
    const [isCreateTestModalOpen, setIsCreateTestModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const onCancel = useCallback(() => {
        router.back();
    }, [router]);

    useBackHandler(() => {
        onCancel();
        return true;
    });

    const fetchClassroomApi = useApi(
        classroomApi.fetchClassroomById,
        {
            onSuccess: (data) => {
                setClassroom(data);
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_fetch_classroom")}\n${i18n.t("please_try_again_later")}`,
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

    const assignBookApi = useApi(
        classroomApi.assignBook,
        {
            onSuccess: (data) => {
                setClassroom(data);
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_assign_book")}\n${i18n.t("please_try_again_later")}`,
                options: {
                    tryAgain: true,
                    cancel: true,
                },
            },
        },
    );

    const deleteClassroomApi = useApi(
        classroomApi.deleteClassroom,
        {
            onSuccess: () => {
                router.back();
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_delete_classroom")}\n${i18n.t("please_try_again_later")}`,
                options: {
                    cancel: true,
                },
            },
        },
    );

    const regenerateTestApi = useApi(
        classroomApi.regenerateTest,
        {
            onSuccess: (data) => {
                setClassroom(data);
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_regenerate_test")}\n${i18n.t("please_try_again_later")}`,
                options: {
                    cancel: true,
                },
            },
        },
    );

    const deleteTestApi = useApi(
        classroomApi.deleteTest,
        {
            onSuccess: (data) => {
                setClassroom(data);
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_delete_test")}\n${i18n.t("please_try_again_later")}`,
                options: {
                    cancel: true,
                },
            },
        },
    );

    const invokeFetchClassroom = useCallback(() => {
        fetchClassroomApi.execute(classroomId);
    }, [fetchClassroomApi, classroomId]);

    useEffect(() => {
        invokeFetchClassroom()
    }, []);

    // Поки якийсь тест генерується, періодично оновлюємо сторінку, щоб
    // вчитель побачив "Готово" або помилку без ручного оновлення.
    const hasGeneratingTests = classroom?.tests.some((test) => test.generationStatus === "GENERATING") ?? false;
    useEffect(() => {
        if (!hasGeneratingTests) {
            return;
        }
        const interval = setInterval(() => {
            classroomApi.fetchClassroomById(classroomId).then((response) => {
                if (response.success) {
                    setClassroom(response.data);
                }
            });
        }, 5000);
        return () => clearInterval(interval);
    }, [hasGeneratingTests, classroomId]);

    const onRegenerateTest = useCallback((test: ClassroomTest) => {
        regenerateTestApi.execute({classroomId, classroomTestId: test.id.toString()});
    }, [regenerateTestApi, classroomId]);

    const onDeleteTest = useCallback((test: ClassroomTest) => {
        Alert.alert(
            i18n.t("delete_test"),
            i18n.t("delete_test_confirm", {bookTitle: test.bookTitle}),
            [
                {text: i18n.t("cancel"), style: "cancel"},
                {
                    text: i18n.t("delete"),
                    style: "destructive",
                    onPress: () => deleteTestApi.execute({classroomId, classroomTestId: test.id.toString()}),
                },
            ],
        );
    }, [deleteTestApi, classroomId]);

    const handleBookSelect = useCallback((book: Book) => {
        assignBookApi.execute({classroomId, bookId: book.id.toString()});
    }, [assignBookApi, classroomId]);

    const onShareCode = useCallback(() => {
        if (classroom) {
            const message = i18n.t("classroom_share_message", {name: classroom.name, code: classroom.code}) ?? classroom.code;
            Share.share({message});
        }
    }, [classroom]);

    const onDelete = useCallback(() => {
        Alert.alert(
            i18n.t("delete_classroom"),
            i18n.t("delete_classroom_confirm"),
            [
                {text: i18n.t("cancel"), style: "cancel"},
                {
                    text: i18n.t("delete"),
                    style: "destructive",
                    onPress: () => deleteClassroomApi.execute(classroomId),
                },
            ],
        );
    }, [deleteClassroomApi, classroomId]);

    const onJoined = useCallback(async (joined: Classroom) => {
        await refreshProfile();
        router.replace(`/classroom/${joined.id}`);
    }, [refreshProfile, router]);

    if (!classroom) {
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
                        {isTeacher && (
                            <HeaderButton
                                onPress={onDelete}
                                backgroundColor="transparent"
                                color="#C1443A"
                                text={i18n.t("delete")}
                                disabled={deleteClassroomApi.loading}
                            />
                        )}
                    </XStack>
                </Header>

                <ScrollView
                    contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 180}}
                    refreshControl={
                        <RefreshControl
                            refreshing={fetchClassroomApi.loading}
                            onRefresh={invokeFetchClassroom}
                        />
                    }
                >
                    <YStack gap={24}>
                        {/* Classroom Card */}
                        <YStack
                            backgroundColor="#FFFFFF"
                            borderRadius={28}
                            padding={24}
                            alignItems="center"
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
                            <View
                                width={64}
                                height={64}
                                borderRadius={32}
                                backgroundColor="#E1F0EA"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <Feather name="users" size={30} color="#2F6F62"/>
                            </View>
                            <YStack alignItems="center" gap={4}>
                                <CustomText size="h2" color="$gray-20" textAlign="center">
                                    {classroom.name}
                                </CustomText>
                                {classroom.teacherName && (
                                    <CustomText size="p2Regular" color="$gray-40" textAlign="center">
                                        {i18n.t("classroom_teacher", {name: classroom.teacherName})}
                                    </CustomText>
                                )}
                            </YStack>

                            <XStack
                                alignItems="center"
                                gap={6}
                                pressStyle={isTeacher ? {opacity: 0.6} : undefined}
                                onPress={isTeacher ? () => setIsEditModalOpen(true) : undefined}
                            >
                                <CustomText size="p2Regular" color="$gray-40">
                                    {i18n.t("classroom_target_wpm_value", {wpm: classroom.targetWpm})}
                                </CustomText>
                                {isTeacher && <Feather name="edit-2" size={14} color="#A68A63"/>}
                            </XStack>

                            {isTeacher && (
                                <YStack alignItems="center" gap={6}>
                                    <CustomText size="p3Regular" color="$gray-40">
                                        {i18n.t("classroom_code")}
                                    </CustomText>
                                    <XStack
                                        backgroundColor="#F3E7CE"
                                        paddingHorizontal={16}
                                        paddingVertical={8}
                                        borderRadius={999}
                                        alignItems="center"
                                        gap={10}
                                        pressStyle={{opacity: 0.7}}
                                        onPress={onShareCode}
                                    >
                                        <CustomText size="h3Medium" color="$gray-20" style={{letterSpacing: 4}}>
                                            {classroom.code}
                                        </CustomText>
                                        <Feather name="share-2" size={18} color="#A68A63"/>
                                    </XStack>
                                </YStack>
                            )}
                        </YStack>

                        {isTeacher && (
                            <YStack gap={12}>
                                <CustomText size="h5Medium" color="$gray-20" paddingLeft={4}>
                                    {i18n.t("classroom_students", {count: classroom.students.length})}
                                </CustomText>
                                {classroom.students.length === 0 && (
                                    <CustomText size="p2Regular" color="$gray-40" paddingLeft={4}>
                                        {i18n.t("classroom_no_students")}
                                    </CustomText>
                                )}
                                <YStack gap={8}>
                                    {classroom.students.map((student) => (
                                        <ParticipantButton
                                            key={student.id}
                                            participant={student}
                                            onPress={() => router.navigate(`/participant/${student.id}`)}
                                        />
                                    ))}
                                </YStack>
                            </YStack>
                        )}

                        {isTeacher && (
                            <YStack gap={12}>
                                <CustomText size="h5Medium" color="$gray-20" paddingLeft={4}>
                                    {i18n.t("classroom_tests")}
                                </CustomText>
                                {classroom.tests.length === 0 && (
                                    <CustomText size="p2Regular" color="$gray-40" paddingLeft={4}>
                                        {i18n.t("classroom_no_tests")}
                                    </CustomText>
                                )}
                                <YStack gap={8}>
                                    {classroom.tests.map((test) => (
                                        <ClassroomTestCard
                                            key={test.id}
                                            test={test}
                                            onRegenerate={() => onRegenerateTest(test)}
                                            onDelete={() => onDeleteTest(test)}
                                            disabled={regenerateTestApi.loading || deleteTestApi.loading}
                                        />
                                    ))}
                                </YStack>
                            </YStack>
                        )}

                        <YStack gap={12}>
                            <CustomText size="h5Medium" color="$gray-20" paddingLeft={4}>
                                {i18n.t("classroom_books")}
                            </CustomText>
                            {classroom.books.length === 0 && (
                                <CustomText size="p2Regular" color="$gray-40" paddingLeft={4}>
                                    {i18n.t("classroom_no_books")}
                                </CustomText>
                            )}
                            <YStack gap={8}>
                                {classroom.books.map((book) => (
                                    <BookButton
                                        key={book.id}
                                        book={book}
                                        onPress={() => router.navigate(`/book/${book.id}`)}
                                    />
                                ))}
                            </YStack>
                        </YStack>
                    </YStack>
                </ScrollView>
            </YStack>

            <BottomButtonGroup>
                {isTeacher ? (
                    <YStack gap={6}>
                        <PrimaryButton
                            onPress={() => setIsBookSelectModalOpen(true)}
                            text={i18n.t("assign_book")}
                            disabled={assignBookApi.loading}
                        />
                        <SecondaryButton
                            onPress={() => setIsCreateTestModalOpen(true)}
                            text={i18n.t("assign_test")}
                            disabled={classroom.books.length === 0 || classroom.students.length === 0}
                        />
                    </YStack>
                ) : (
                    <SecondaryButton
                        onPress={() => setIsJoinModalOpen(true)}
                        text={i18n.t("change_classroom")}
                    />
                )}
            </BottomButtonGroup>

            {isTeacher && (
                <>
                    <BookSelectModal
                        isOpen={isBookSelectModalOpen}
                        onClose={() => setIsBookSelectModalOpen(false)}
                        onSelectBook={handleBookSelect}
                        showCatalog
                    />
                    <CreateClassroomModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onSave={invokeFetchClassroom}
                        classroom={classroom}
                    />
                    <CreateTestModal
                        isOpen={isCreateTestModalOpen}
                        onClose={() => setIsCreateTestModalOpen(false)}
                        onSave={invokeFetchClassroom}
                        classroomId={classroom.id}
                        classroomName={classroom.name}
                        books={classroom.books}
                    />
                </>
            )}

            {!isTeacher && (
                <JoinClassroomModal
                    isOpen={isJoinModalOpen}
                    onClose={() => setIsJoinModalOpen(false)}
                    onSave={onJoined}
                    hasClassroom={true}
                />
            )}
        </>
    );
};

export default ClassroomScreen;
