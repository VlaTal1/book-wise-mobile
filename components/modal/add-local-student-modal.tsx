import React, {FC, useCallback, useState} from "react";
import {XStack, YStack} from "tamagui";

import i18n from "@/localization/i18n";
import Modal from "@/components/modal/index";
import Input from "@/components/input";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";
import LabelledInput from "@/components/LabelledInput";
import {CustomText} from "@/components/CustomText";
import useWindow from "@/hooks/useWindow";
import useApi from "@/hooks/useApi";
import classroomApi from "@/api/endpoints/classroomApi";
import {ClassroomDetails} from "@/types/Classroom";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (classroom: ClassroomDetails) => void;
    classroomId: number;
}

// Учень без реєстрації: вчитель лише вводить ім'я, далі учень читає з
// телефона вчителя (кнопка «Читати» біля учня на сторінці класу).
const AddLocalStudentModal: FC<Props> = ({isOpen, onClose, onSave, classroomId}) => {
    const {keyboardVisible} = useWindow();
    const [name, setName] = useState("");

    const onCancel = useCallback(() => {
        setName("");
        onClose();
    }, [onClose]);

    const createApi = useApi(
        classroomApi.createLocalStudent,
        {
            onSuccess: (data) => {
                onSave(data);
                onCancel();
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_add_local_student")}\n${i18n.t("please_try_again_later")}`,
                options: {
                    cancel: true,
                },
            },
        },
    );

    const onSubmit = useCallback(() => {
        if (name.trim()) {
            createApi.execute({classroomId: classroomId.toString(), name: name.trim()});
        }
    }, [createApi, classroomId, name]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            headerText={i18n.t("add_local_student")}
            modalActions={(
                <XStack gap={6}>
                    <SecondaryButton flex={1} text={i18n.t("cancel")} onPress={onCancel}/>
                    <PrimaryButton
                        flex={1}
                        text={createApi.loading ? "" : i18n.t("save")}
                        disabled={!name.trim() || createApi.loading}
                        onPress={onSubmit}
                    />
                </XStack>
            )}
            isKeyboardVisible={keyboardVisible}
        >
            <YStack gap={12}>
                <CustomText size="p2Regular" color="$gray-40">
                    {i18n.t("add_local_student_hint")}
                </CustomText>
                <LabelledInput label={i18n.t("local_student_name")} htmlFor="localStudentName">
                    <Input
                        id="localStudentName"
                        value={name}
                        setValue={setName}
                        placeholder={i18n.t("local_student_name")}
                        autoCapitalize="words"
                        maxLength={60}
                    />
                </LabelledInput>
            </YStack>
        </Modal>
    );
};

export default AddLocalStudentModal;
