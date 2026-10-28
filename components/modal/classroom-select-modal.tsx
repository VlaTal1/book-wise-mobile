import React, {FC, useCallback, useEffect, useState} from "react";
import {XStack} from "tamagui";
import {ActivityIndicator} from "react-native";

import i18n from "@/localization/i18n";
import Modal from "@/components/modal/index";
import SecondaryButton from "@/components/buttons/SecondaryButton";
import useWindow from "@/hooks/useWindow";
import DiscardBookAddingModal from "@/components/modal/discard/discard-book-adding-modal";
import useApi from "@/hooks/useApi";
import classroomApi from "@/api/endpoints/classroomApi";
import {Classroom} from "@/types/Classroom";
import ListButton from "@/components/buttons/ListButton";
import ArrowRightIcon from "@/assets/images/icons/next-icon.svg";

type Props = {
    onClose: () => void;
    isOpen: boolean;
    onSelectId?: (classroomId: string) => void;
    onSelectClassroom?: (classroom: Classroom) => void;
}

const ClassroomSelectModal: FC<Props> = ({onClose, isOpen, onSelectId, onSelectClassroom}) => {
    const {keyboardVisible, availableContentHeight} = useWindow()

    const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);

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

    useEffect(() => {
        if (isOpen) {
            invokeFetchClassrooms()
        }
    }, [isOpen]);

    const onCancel = useCallback(() => {
        onClose();
    }, [onClose]);

    const handleSelect = useCallback(async (classroom: Classroom) => {
        if (onSelectId) {
            onSelectId(classroom.id.toString())
        }
        if (onSelectClassroom) {
            onSelectClassroom(classroom)
        }
        onClose()
    }, [onClose]);

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onCancel}
                headerText={i18n.t("select_classroom")}
                modalActions={(
                    <XStack gap={6}>
                        <SecondaryButton
                            flex={1}
                            text={i18n.t("cancel")}
                            onPress={onCancel}
                        />
                    </XStack>
                )}
                isKeyboardVisible={keyboardVisible}
                height={availableContentHeight}
            >
                {fetchClassroomsApi.loading || !classrooms ? (
                    <ActivityIndicator size="small" color="#CB5A2E"/>
                ) : (
                    classrooms.map((classroom) => (
                        <ListButton
                            key={classroom.id}
                            onPress={() => handleSelect(classroom)}
                            text={classroom.name}
                            icon={ArrowRightIcon}
                        />
                    ))
                )}
            </Modal>

            <DiscardBookAddingModal
                isOpen={isDiscardModalOpen}
                onClose={() => setIsDiscardModalOpen(false)}
                onStay={() => setIsDiscardModalOpen(false)}
                onDiscard={() => {
                    setIsDiscardModalOpen(false)
                    onCancel()
                }}
            />
        </>
    )
}

export default ClassroomSelectModal