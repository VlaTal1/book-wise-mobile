import React, {useCallback, useEffect} from "react";
import {useRouter} from "expo-router";
import {useBackHandler} from "@react-native-community/hooks";
import {ActivityIndicator, FlatList, RefreshControl} from "react-native";
import {ScrollView, XStack, YStack} from "tamagui";

import CustomStackScreen from "@/components/CustomStackScreen";
import Header from "@/components/Header";
import HeaderButton from "@/components/buttons/HeaderButton";
import {CustomText} from "@/components/CustomText";
import i18n from "@/localization/i18n";
import useApi from "@/hooks/useApi";
import participantApi from "@/api/endpoints/participantApi";
import ParticipantButton from "@/components/buttons/ParticipantButton";
import {useUserMode} from "@/hooks/userModeContext";

// Дитячий режим: власна історія — без вибору, одразу редірект на
// readingHistory/participant/[participantId] (одне й те саме дитя).
// Батьківський режим: спочатку список дітей, по натисканню — історія
// саме цієї дитини (той самий екран participant/[participantId]).
const ReadingHistory = () => {
    const router = useRouter();
    const {childId, isChildMode, isParentMode} = useUserMode();

    const onCancel = useCallback(() => {
        router.back();
    }, [router]);

    useBackHandler(() => {
        onCancel();
        return true;
    });

    useEffect(() => {
        if (isChildMode && childId) {
            router.replace(`/readingHistory/participant/${childId}`);
        }
    }, [childId, isChildMode, router]);

    const fetchAllParticipantApi = useApi(
        participantApi.fetchAllParticipants,
        {
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_fetch_children")}\n${i18n.t("please_try_again_later")}`,
                options: {tryAgain: true, cancel: true},
            },
        },
    );

    const invokeFetchParticipants = useCallback(() => {
        fetchAllParticipantApi.execute();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (isParentMode) {
            invokeFetchParticipants();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isParentMode]);

    if (isChildMode) {
        return (
            <>
                <CustomStackScreen/>
                <YStack flex={1} justifyContent="center" alignItems="center">
                    <ActivityIndicator size="large" color="#CB5A2E"/>
                </YStack>
            </>
        );
    }

    const participants = fetchAllParticipantApi.data ?? [];

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
                    contentContainerStyle={{flex: participants.length === 0 ? 1 : "unset", paddingHorizontal: 16}}
                    refreshControl={
                        <RefreshControl refreshing={fetchAllParticipantApi.loading} onRefresh={invokeFetchParticipants}/>
                    }
                >
                    <CustomText size="h2">
                        {i18n.t("reading_history_title")}
                    </CustomText>
                    <CustomText size="p1Regular" color="$gray-40" paddingTop={4}>
                        {i18n.t("reading_history_select_child")}
                    </CustomText>
                    {participants.length === 0 && !fetchAllParticipantApi.loading && (
                        <YStack flex={1} justifyContent="center" alignItems="center">
                            <CustomText size="p1Regular" color="$gray-40">
                                {i18n.t("reading_history_no_children")}
                            </CustomText>
                        </YStack>
                    )}
                    <YStack flex={1} height="100%" paddingTop={16} paddingBottom={80}>
                        <FlatList
                            numColumns={1}
                            contentContainerStyle={{gap: 8}}
                            scrollEnabled={false}
                            data={participants}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({item}) => (
                                <ParticipantButton
                                    key={item.id}
                                    participant={item}
                                    onPress={() => router.navigate({
                                        pathname: "/readingHistory/participant/[participantId]",
                                        params: {participantId: item.id.toString(), participantName: item.name},
                                    })}
                                />
                            )}
                        />
                    </YStack>
                </ScrollView>
            </YStack>
        </>
    );
};

export default ReadingHistory;
