import React, {FC, useCallback, useEffect, useState} from "react";
import {XStack} from "tamagui";
import {ActivityIndicator} from "react-native";

import i18n from "@/localization/i18n";
import Modal from "@/components/modal/index";
import SecondaryButton from "@/components/buttons/SecondaryButton";
import useWindow from "@/hooks/useWindow";
import DiscardBookAddingModal from "@/components/modal/discard/discard-book-adding-modal";
import useApi from "@/hooks/useApi";
import participantApi from "@/api/endpoints/participantApi";
import {Participant} from "@/types/Paticipant";
import ListButton from "@/components/buttons/ListButton";
import ArrowRightIcon from "@/assets/images/icons/next-icon.svg";

type Props = {
    onClose: () => void;
    isOpen: boolean;
    onSelectId?: (participantId: string) => void;
    onSelectParticipant?: (participant: Participant) => void;
}

const ParticipantSelectModal: FC<Props> = ({onClose, isOpen, onSelectId, onSelectParticipant}) => {
    const {keyboardVisible, availableContentHeight} = useWindow()

    const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)
    const [participants, setParticipants] = useState<Participant[]>([]);

    const fetchAllParticipantApi = useApi(
        participantApi.fetchStudents,
        {
            onSuccess: (data) => {
                setParticipants(data);
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

    useEffect(() => {
        if (isOpen) {
            invokeFetchAllParticipants()
        }
    }, [isOpen]);

    const onCancel = useCallback(() => {
        onClose();
    }, [onClose]);

    const handleSelect = useCallback(async (participant: Participant) => {
        if (onSelectId) {
            onSelectId(participant.id.toString())
        }
        if (onSelectParticipant) {
            onSelectParticipant(participant)
        }
        onClose()
    }, [onClose]);

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onCancel}
                headerText={i18n.t("select_student")}
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
                {fetchAllParticipantApi.loading || !participants ? (
                    <ActivityIndicator size="small" color="#CB5A2E"/>
                ) : (
                    participants.map((participant) => (
                        <ListButton
                            key={participant.id}
                            onPress={() => handleSelect(participant)}
                            text={participant.name}
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

export default ParticipantSelectModal