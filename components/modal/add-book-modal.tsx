import React, {FC, useCallback, useState} from "react";
import {ScrollView, XStack, YStack} from "tamagui";
import {Controller, useForm} from "react-hook-form";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import {ActivityIndicator} from "react-native";

import {isBlank} from "@/functions";
import i18n from "@/localization/i18n";
import Modal from "@/components/modal/index";
import Input from "@/components/input";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";
import LabelledInput from "@/components/LabelledInput";
import DiscardBookAddingModal from "@/components/modal/discard/discard-book-adding-modal";
import {CustomText} from "@/components/CustomText";
import useApi from "@/hooks/useApi";
import bookApi from "@/api/endpoints/bookApi";

type Props = {
    onClose: () => void;
    isOpen: boolean;
    onSave: () => void;
}

type FormValues = {
    name: string;
    author: string;
    file: DocumentPicker.DocumentPickerAsset | null;
};

const AddBookModal: FC<Props> = ({onClose, isOpen, onSave}) => {

    const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)
    const [selectedFileName, setSelectedFileName] = useState<string>("");

    const {control, handleSubmit, setValue, watch, reset, formState: {errors, isDirty}} = useForm<FormValues>({
        defaultValues: {
            name: "",
            author: "",
            file: null,
        },
        mode: "onChange",
    });

    const formValues = watch();

    const handleReset = useCallback(() => {
        reset({
            name: "",
            author: "",
            file: null,
        });
        setSelectedFileName("");
    }, [reset]);

    const onCancel = useCallback(() => {
        onClose();
        handleReset();
    }, [onClose, handleReset]);

    const uploadBookApi = useApi(
        bookApi.uploadBook,
        {
            onSuccess: () => {
                onClose();
                handleReset();
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_upload_book")}\n${i18n.t("please_try_again_later")}`,
                options: {
                    tryAgain: true,
                    cancel: true,
                },
            },
        },
    );

    const handleSave = useCallback(async (data: FormValues) => {
        if (!data.file) {
            return;
        }

        try {
            // Create a FormData object
            const formData = new FormData();

            // Add title and author to FormData
            formData.append("title", data.name);
            formData.append("author", data.author);

            // Get file URI and prepare for upload
            const fileUri = data.file.uri;
            const fileInfo = await FileSystem.getInfoAsync(fileUri);

            if (!fileInfo.exists) {
                console.error("File does not exist at URI:", fileUri);
                return;
            }

            // Fetch the file locally and convert it to a Blob
            const response = await fetch(fileUri);
            const rawBlob = await response.blob();
            const blob = new Blob([rawBlob], { type: data.file.mimeType || "application/octet-stream" });

            // Create file object for FormData
            formData.append("file", blob, data.file.name);

            // Upload the book
            await uploadBookApi.execute({formData}).then(onSave);

        } catch (error) {
            console.error("Error preparing file for upload:", error);
        }
    }, [uploadBookApi, handleReset, onClose]);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ["application/epub+zip", "application/pdf"],
                copyToCacheDirectory: true,
            });

            if (result.canceled) {
                console.log("Document picking was canceled");
                return;
            }

            const file = result.assets[0];

            // Check if the file is PDF or EPUB
            const fileType = file.mimeType?.toLowerCase();
            if (fileType !== "application/pdf" && fileType !== "application/epub+zip") {
                // Handle invalid file type
                console.log("Invalid file type. Please select PDF or EPUB file.");
                return;
            }

            // Set the file in the form
            setValue("file", file, {shouldDirty: true});
            setSelectedFileName(file.name);

            // If book name is empty, use the filename (without extension) as default
            if (isBlank(formValues.name)) {
                const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
                setValue("name", nameWithoutExtension, {shouldDirty: true});
            }

        } catch (error) {
            console.log("Error picking document:", error);
        }
    };

    const isValid =
        !isBlank(formValues.name) &&
        !isBlank(formValues.author) &&
        formValues.file !== null;

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={() => isDirty ? setIsDiscardModalOpen(true) : onCancel()}
                headerText={i18n.t("add_book")}
                modalActions={(
                    <XStack gap={6}>
                        <SecondaryButton
                            flex={1}
                            text={i18n.t("cancel")}
                            onPress={onCancel}
                        />
                        <PrimaryButton
                            flex={1}
                            text={uploadBookApi.loading ? "" : i18n.t("save")}
                            disabled={!isValid || uploadBookApi.loading}
                            onPress={handleSubmit(handleSave)}
                        />
                    </XStack>
                )}
            >
                {uploadBookApi.loading ? (
                    <ActivityIndicator size="small" color="#CB5A2E"/>
                ) : (
                    <ScrollView contentContainerStyle={{flexGrow: 1}} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
                        <YStack gap={12}>
                            {/* Book Name */}
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
                                            placeholder={i18n.t("name")}
                                            errorMessage={errors.name?.message}
                                        />
                                    )}
                                />
                            </LabelledInput>

                            {/* Author */}
                            <LabelledInput label={i18n.t("author")} htmlFor="author">
                                <Controller
                                    control={control}
                                    name="author"
                                    rules={{
                                        required: {
                                            value: true,
                                            message: i18n.t("author_validation"),
                                        },
                                    }}
                                    render={({field: {onChange, value}}) => (
                                        <Input
                                            id="author"
                                            value={value}
                                            setValue={onChange}
                                            placeholder={i18n.t("author")}
                                            errorMessage={errors.author?.message}
                                        />
                                    )}
                                />
                            </LabelledInput>

                            {/* Book */}
                            <YStack gap={8} width="100%">
                                <CustomText
                                    size="p1Regular"
                                >
                                    {i18n.t("select_book")}
                                </CustomText>
                                <XStack gap={8}>
                                    <YStack borderRadius={12} padding={12} backgroundColor="$gray-93" flex={1}
                                            justifyContent="center">
                                        <CustomText size="p1Light" color={selectedFileName ? "$gray-20" : "$gray-60"}
                                                    numberOfLines={1}>
                                            {selectedFileName || i18n.t("file_name")}
                                        </CustomText>
                                    </YStack>
                                    <PrimaryButton
                                        text={i18n.t("select")}
                                        onPress={pickDocument}
                                        flex={0.5}
                                    />
                                </XStack>
                            </YStack>
                        </YStack>
                    </ScrollView>
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

export default AddBookModal