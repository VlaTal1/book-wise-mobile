import React, {FC, useCallback} from "react";
import {ScrollView, XStack, YStack} from "tamagui";
import {Controller, useForm} from "react-hook-form";
import {ActivityIndicator} from "react-native";

import {isBlank} from "@/functions";
import i18n from "@/localization/i18n";
import Modal from "@/components/modal/index";
import Input from "@/components/input";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";
import useWindow from "@/hooks/useWindow";
import LabelledInput from "@/components/LabelledInput";
import useApi from "@/hooks/useApi";
import classroomApi from "@/api/endpoints/classroomApi";
import {Classroom} from "@/types/Classroom";

type Props = {
    onClose: () => void;
    isOpen: boolean;
    onSave: (classroom: Classroom) => void;
}

type FormValues = {
    name: string;
};

const CreateClassroomModal: FC<Props> = ({onClose, isOpen, onSave}) => {
    const {keyboardVisible, availableContentHeight} = useWindow()

    const {control, handleSubmit, setValue, watch, reset, formState: {errors, isDirty}} = useForm<FormValues>({
        defaultValues: {
            name: "",
        },
        mode: "onChange",
    });

    const formValues = watch();

    const handleReset = useCallback(() => {
        reset({
            name: "",
        });
    }, [reset]);

    const onCancel = useCallback(() => {
        onClose();
        handleReset();
    }, [onClose, handleReset]);

    const saveApi = useApi(
        classroomApi.createClassroom,
        {
            onSuccess: (classroom) => {
                onClose();
                handleReset();
                onSave(classroom);
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_create_classroom")}\n${i18n.t("please_try_again_later")}`,
                options: {
                    tryAgain: true,
                    cancel: true,
                },
            },
        },
    );

    const handleSave = useCallback(async (data: FormValues) => {
        await saveApi.execute({name: data.name.trim()});
    }, [saveApi]);

    const isValid = !isBlank(formValues.name)

    return (
        <Modal
                isOpen={isOpen}
                onClose={onCancel}
                headerText={i18n.t("create_classroom")}
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
                            <LabelledInput label={i18n.t("name")} htmlFor="name">
                                <Controller
                                    control={control}
                                    name="name"
                                    rules={{
                                        required: {
                                            value: true,
                                            message: i18n.t("name_validation"),
                                        },
                                    }}
                                    render={({field: {onChange, value}}) => (
                                        <Input
                                            id="name"
                                            value={value}
                                            setValue={onChange}
                                            placeholder={i18n.t("classroom_name")}
                                            errorMessage={errors.name?.message}
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

export default CreateClassroomModal