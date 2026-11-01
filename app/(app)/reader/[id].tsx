import React, {useCallback, useEffect, useState} from "react";
import {View, XStack, YStack} from "tamagui";
import {useLocalSearchParams, useRouter} from "expo-router";
import {useBackHandler} from "@react-native-community/hooks";
import Pdf from "react-native-pdf";
import {ActivityIndicator, Dimensions} from "react-native";
import * as FileSystem from "expo-file-system/legacy";

import CustomStackScreen from "@/components/CustomStackScreen";
import i18n from "@/localization/i18n";
import Header from "@/components/Header";
import HeaderButton from "@/components/buttons/HeaderButton";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import {CustomText} from "@/components/CustomText";
import BackIcon from "@/assets/images/icons/back-icon.svg";
import NextIcon from "@/assets/images/icons/next-icon.svg";
import {getAuthHeaders} from "@/auth/actingStudent";
import {getApiBaseUrl} from "@/api";
import BottomButtonGroup from "@/components/buttons/BottomButtonGroup";
import {useRole} from "@/hooks/roleContext";
import useApi from "@/hooks/useApi";
import testApi from "@/api/endpoints/testApi";
import {Test} from "@/types/Test";
import Message from "@/components/Message";
import {useAppDispatch, useAppSelector} from "@/store";
import {setCurrentTest} from "@/store/testSlice";
import {
    saveSession,
    setEndPage,
    setEndTime,
    setProgress,
    setReadPages,
    setStartPage,
    setStartTime,
    updateProgress,
} from "@/store/sessionSlice";
import progressApi from "@/api/endpoints/progressApi";

interface PdfState {
    uri: string | null;
    totalPages: number;
    currentPage: number;
    isLoading: boolean;
}

const Reader = () => {
    const {studentId, isStudent} = useRole();
    const {id} = useLocalSearchParams();

    const router = useRouter();
    const dispatch = useAppDispatch();

    const screenWidth = Dimensions.get("window").width;
    const screenHeight = Dimensions.get("window").height;

    const [pdfState, setPdfState] = useState<PdfState>({
        uri: null,
        totalPages: 0,
        currentPage: 1,
        isLoading: true,
    });
    const [test, setTest] = useState<Test | undefined>()
    const [isMessageOpen, setIsMessageOpen] = useState(false)

    const readPages = useAppSelector((state) => state.session.progress.readPages)

    const endSession = () => {
        dispatch(setEndTime())
        dispatch(setEndPage(pdfState.currentPage))
        dispatch(saveSession())
        dispatch(updateProgress())
    }

    const onCancel = () => {
        if (isStudent) {
            endSession()
        }
        router.back();
    };

    useBackHandler(() => {
        onCancel();
        return true;
    });

    useEffect(() => {
        if (isStudent) {
            dispatch(setStartTime())
        }
    }, [isStudent]);

    const downloadBook = async (bookId: string) => {
        try {
            setPdfState(prev => ({...prev, isLoading: true}));
            const headers = await getAuthHeaders();
            const apiBaseUrl = getApiBaseUrl()

            const fileUri = `${FileSystem.cacheDirectory}book_${bookId}.pdf`;

            const downloadResult = await FileSystem.downloadAsync(
                `${apiBaseUrl}/api/books/${bookId}/download`,
                fileUri,
                {
                    headers,
                },
            );

            if (downloadResult.status === 200) {
                setPdfState(prev => ({
                    ...prev,
                    uri: downloadResult.uri,
                    isLoading: false,
                }));
            } else {
                setPdfState(prev => ({...prev, isLoading: false}));
                alert(i18n.t("failed_to_fetch_books"));
            }
        } catch (error) {
            setPdfState(prev => ({...prev, isLoading: false}));
            alert(`${i18n.t("error")}: ${i18n.t("failed_to_fetch_books")}`);
        }
    };

    const fetchFirstTestByParticipantIdAndBookId = useApi(
        testApi.fetchFirstTestByParticipantIdAndBookId,
        {
            onSuccess: (data) => {
                setTest(data);
                if (data && data.endPage && isStudent) {
                    dispatch(setCurrentTest(data));
                    setIsMessageOpen(true)
                }
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_fetch_test")}\n${i18n.t("please_try_again_later")}`,
                options: {
                    tryAgain: true,
                    cancel: true,
                },
            },
        },
    );

    const fetchProgressApi = useApi(
        progressApi.fetchProgress,
        {
            onSuccess: (data) => {
                dispatch(setProgress(data))
                const currentPage = data.currentPage === 0 ? 1 : data.currentPage;
                dispatch(setReadPages(data.readPages === 0 ? 1 : data.readPages))
                setPdfState(prev => ({...prev, currentPage: currentPage}));
                dispatch(setStartPage(currentPage))
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_fetch_progress")}\n${i18n.t("please_try_again_later")}`,
                options: {
                    tryAgain: true,
                    cancel: true,
                },
            },
        },
    );

    const invokeFetchFirstTestByParticipantIdAndBookId = useCallback(() => {
        if (studentId) {
            fetchFirstTestByParticipantIdAndBookId.execute({participantId: studentId, bookId: id.toString()});
        }
    }, [fetchFirstTestByParticipantIdAndBookId, studentId]);

    const invokeFetchProgressApi = useCallback(() => {
        if (studentId) {
            fetchProgressApi.execute({
                participantId: studentId,
                bookId: id.toString(),
            });
        }
    }, [studentId, fetchProgressApi, id]);

    useEffect(() => {
        if (id) {
            downloadBook(id.toString());
        } else {
            setPdfState(prev => ({...prev, isLoading: false}));
        }
    }, [id]);

    useEffect(() => {
        if (isStudent && studentId) {
            invokeFetchFirstTestByParticipantIdAndBookId();
        }
    }, [studentId, isStudent]);

    useEffect(() => {
        if (id) {
            invokeFetchProgressApi();
        }
    }, [id]);

    const handlePageChanged = (page: number, totalPages: number) => {
        setPdfState(prev => ({
            ...prev,
            currentPage: page,
            totalPages: totalPages,
        }));
    };

    const goToPreviousPage = () => {
        if (pdfState.currentPage > 1) {
            const newPage = pdfState.currentPage - 1;

            setPdfState(prev => ({
                ...prev,
                currentPage: newPage,
            }));
        }
    };

    const goToNextPage = () => {
        if (isStudent && pdfState.currentPage === test?.endPage) {
            endSession()
            router.navigate("/testPassing/test")
            return
        }
        if (pdfState.currentPage < pdfState.totalPages) {
            const newPage = pdfState.currentPage + 1;

            setPdfState(prev => ({
                ...prev,
                currentPage: newPage,
            }));

            if (!!readPages && newPage > readPages) {
                dispatch(setReadPages(newPage))
            }
        }
    };

    const getNextButtonDisabled = () => {
        if (pdfState.isLoading) {
            return true;
        }
        if (pdfState.currentPage >= pdfState.totalPages) {
            if (isStudent && pdfState.currentPage === test?.endPage) {
                return false;
            }
            return true;
        }
    }
    const getNextButtonIcon = () => {
        if (isStudent && pdfState.currentPage === test?.endPage) {
            return undefined;
        }
        return NextIcon;
    }

    const getNextButtonText = () => {
        if (isStudent && pdfState.currentPage === test?.endPage) {
            return i18n.t("go_to_test");
        }
        return undefined;
    }

    const pdfRef = React.useRef<React.ElementRef<typeof Pdf>>(null);

    return (
        <>
            <CustomStackScreen/>
            <YStack flex={1}>
                <XStack position="absolute" zIndex={9999} top={0} left={0}>
                    <Header backgroundColor="black">
                        <XStack justifyContent="space-between" width="100%">
                            <HeaderButton
                                onPress={onCancel}
                                backgroundColor="transparent"
                                color="$gray-100"
                                text={i18n.t("back")}
                            />
                        </XStack>
                    </Header>
                </XStack>

                <YStack flex={1}>
                    {pdfState.isLoading && (
                        <YStack flex={1} justifyContent="center" alignItems="center">
                            <ActivityIndicator size="large" color="#CB5A2E"/>
                        </YStack>
                    )}

                    {!pdfState.isLoading && pdfState.uri && (
                        <YStack flex={1} width="100%">
                            <XStack justifyContent="center" marginBottom={8}/>

                            <View style={{flex: 1, width: "100%"}}>
                                <Pdf
                                    ref={pdfRef}
                                    source={{uri: pdfState.uri, cache: true}}
                                    style={{
                                        flex: 1,
                                        width: screenWidth,
                                        height: screenHeight,
                                        backgroundColor: "black",
                                    }}
                                    onLoadComplete={(numberOfPages) => {
                                        setPdfState(prev => ({
                                            ...prev,
                                            totalPages: numberOfPages,
                                        }));
                                    }}
                                    page={pdfState.currentPage}
                                    onPageChanged={(page, totalPages) => handlePageChanged(page, totalPages)}
                                    trustAllCerts={false}
                                    enablePaging={true}
                                    horizontal={true}
                                    enableRTL={false}
                                    fitPolicy={0}
                                />
                            </View>

                            <BottomButtonGroup
                                gradientColors={["transparent", "rgba(0,0,0,1)"]}
                            >
                                <XStack justifyContent="space-between" marginTop={16} alignItems="center">
                                    <PrimaryButton
                                        onPress={goToPreviousPage}
                                        disabled={pdfState.currentPage <= 1 || pdfState.isLoading}
                                        icon={BackIcon}
                                        iconFillType="fill"
                                        width="30%"
                                    />
                                    {!pdfState.isLoading && (
                                        <CustomText size="h4Regular" color="$gray-100">
                                            {pdfState.currentPage}/{pdfState.totalPages}
                                        </CustomText>
                                    )}
                                    <PrimaryButton
                                        onPress={goToNextPage}
                                        disabled={getNextButtonDisabled()}
                                        icon={getNextButtonIcon()}
                                        text={getNextButtonText()}
                                        iconFillType="fill"
                                        width="30%"
                                    />
                                </XStack>
                            </BottomButtonGroup>
                        </YStack>
                    )}
                </YStack>
            </YStack>
            <View
                display={isMessageOpen ? "flex" : "none"}
                position="absolute"
                top={50}
                width="100%"
                paddingHorizontal={16}
            >
                <Message
                    message={i18n.t("test_exists_message_text", {page: test?.endPage})}
                    onClose={() => setIsMessageOpen(false)}
                    variant="regular"
                />
            </View>
        </>
    );
};

export default Reader;