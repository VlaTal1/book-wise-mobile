import React, {FC, useCallback} from "react";
import {ScrollView, XStack, YStack} from "tamagui";
import {Controller, useForm} from "react-hook-form";
import {ActivityIndicator} from "react-native";

import i18n from "@/localization/i18n";
import Modal from "@/components/modal/index";
import Input from "@/components/input";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";
import useWindow from "@/hooks/useWindow";
import LabelledInput from "@/components/LabelledInput";
import useApi from "@/hooks/useApi";
import classroomApi from "@/api/endpoints/classroomApi";
import {ApiErrorCode} from "@/api";
import {Classroom} from "@/types/Classroom";

type Props = {
    onClose: () => void;
    isOpen: boolean;
    onSave: (classroom: Classroom) => void;
    // Учень уже в класі — вступ до нового замінить попередній.
    hasClassroom?: boolean;
}

type FormValues = {
    code: string;
};

const JoinClassroomModal: FC<Props> = ({onClose, isOpen, onSave, hasClassroom = false}) => {
    const {keyboardVisible, availableContentHeight} = useWindow()

    const {control, handleSubmit, setValue, watch, reset, formState: {errors, isDirty}} = useForm<FormValues>({
        defaultValues: {
            code: "",
        },
        mode: "onChange",
    });

    const formValues = watch();

    const handleReset = useCallback(() => {
        reset({
            code: "",
        });
    }, [reset]);

    const onCancel = useCallback(() => {
        onClose();
        handleReset();
    }, [onClose, handleReset]);

    const saveApi = useApi(
        classroomApi.joinClassroom,
        {
            onSuccess: (classroom) => {
                onClose();
                handleReset();
                onSave(classroom);
            },
            errorHandler: (error) => ({
                title: i18n.t("error"),
                message: !error.success && error.error.code === ApiErrorCode.NOT_FOUND
                    ? i18n.t("classroom_not_found")
                    : `${i18n.t("failed_to_join_classroom")}\n${i18n.t("please_try_again_later")}`,
                options: {
                    cancel: true,
                },
            }),
        },
    );

    const handleSave = useCallback(async (data: FormValues) => {
        await saveApi.execute({code: data.code.trim().toUpperCase()});
    }, [saveApi]);

    const isValid = formValues.code.trim().length === 6

    return (
        <Modal
                isOpen={isOpen}
                onClose={onCancel}
                headerText={i18n.t("join_classroom")}
                headerDescription={i18n.t(hasClassroom ? "join_classroom_replace_warning" : "join_classroom_description")}
                modalActions={(
                    <XStack gap={6}>
                        <SecondaryButton
                            flex={1}
                            text={i18n.t("cancel")}
                            onPress={onCancel}
                        />
                        <PrimaryButton
                            flex={1}
                            text={saveApi.loading ? "" : i18n.t("save")}
                            disabled={!isValid || saveApi.loading}
                            onPress={handleSubmit(handleSave)}
                        />
                    </XStack>
                )}
                isKeyboardVisible={keyboardVisible}
                height={availableContentHeight}
            >
                {saveApi.loading ? (
                    <ActivityIndicator size="small" color="#CB5A2E"/>
                ) : (
                    <ScrollView contentContainerStyle={{flexGrow: 1}}>
                        <YStack gap={12}>
                            <LabelledInput label={i18n.t("classroom_code")} htmlFor="code">
                                <Controller
                                    control={control}
                                    name="code"
                                    rules={{
                                        required: {
                                            value: true,
                                            message: i18n.t("classroom_code_validation"),
                                        },
                                    }}
                                    render={({field: {onChange, value}}) => (
                                        <Input
                                            id="code"
                                            value={value}
                                            setValue={onChange}
                                            placeholder={i18n.t("classroom_code")}
                                            autoCapitalize="characters"
                                            maxLength={6}
                                            errorMessage={errors.code?.message}
                                        />
                                    )}
                                />
                            </LabelledInput>
                        </YStack>
                    </ScrollView>
                )}
            </Modal>
    )
}

export default JoinClassroomModal