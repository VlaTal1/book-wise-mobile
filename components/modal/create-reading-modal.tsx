import React, {FC, useCallback, useMemo, useState} from "react";
import {ScrollView, XStack, YStack} from "tamagui";
import {ActivityIndicator, TouchableOpacity} from "react-native";

import i18n from "@/localization/i18n";
import Modal from "@/components/modal/index";
import Input from "@/components/input";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";
import useWindow from "@/hooks/useWindow";
import LabelledInput from "@/components/LabelledInput";
import useApi from "@/hooks/useApi";
import classroomReadingApi from "@/api/endpoints/classroomReadingApi";
import BookSelectModal from "@/components/modal/book-select-modal";
import {CustomText} from "@/components/CustomText";
import {Book} from "@/types/Book";
import {ReadingMode} from "@/types/ClassroomReading";
import NextIcon from "@/assets/images/icons/next-icon.svg";

type Props = {
    onClose: () => void;
    isOpen: boolean;
    onSave: () => void;
    classroomId: number;
    classroomName: string;
    // Фрагмент можна взяти лише з книги, призначеної класу.
    books: Book[];
}

// Той самий ліміт, що й на бекенді (ClassroomReadingService.MAX_WORDS).
const MAX_WORDS = 1500;

// null — без обмежень.
const TIME_LIMIT_OPTIONS: (number | null)[] = [60, 120, 180, 300, null];
const ATTEMPTS_OPTIONS: (number | null)[] = [1, 2, 3, 5, null];

const WORD_RE = /[\p{L}\p{N}]+/gu;
const countWords = (text: string) => text.match(WORD_RE)?.length ?? 0;

const Chip: FC<{label: string; selected: boolean; onPress: () => void}> = ({label, selected, onPress}) => (
    <XStack
        paddingHorizontal={14}
        paddingVertical={8}
        borderRadius={999}
        backgroundColor={selected ? "#CB5A2E" : "$gray-93"}
        pressStyle={{opacity: 0.7}}
        onPress={onPress}
    >
        <CustomText size="p2Medium" color={selected ? "#FFFFFF" : "$gray-20"}>
            {label}
        </CustomText>
    </XStack>
);

// Вчитель обирає книгу й сторінки, бачить їх чистий текст абзацами і
// позначає перший та останній абзац фрагмента; ліміт часу й спроб — чипами.
const CreateReadingModal: FC<Props> = ({onClose, isOpen, onSave, classroomId, classroomName, books}) => {
    const {keyboardVisible, availableContentHeight} = useWindow();

    const [mode, setMode] = useState<ReadingMode>("FIXED");
    const [selectedBook, setSelectedBook] = useState<Book | undefined>(undefined);
    const [isBookSelectModalOpen, setIsBookSelectModalOpen] = useState(false);
    const [startPage, setStartPage] = useState("1");
    const [endPage, setEndPage] = useState("1");
    // Абзаци попереднього перегляду — для сторінок, з якими їх завантажено.
    const [paragraphs, setParagraphs] = useState<string[] | null>(null);
    const [startParagraph, setStartParagraph] = useState<number | null>(null);
    const [endParagraph, setEndParagraph] = useState<number | null>(null);
    const [timeLimitSeconds, setTimeLimitSeconds] = useState<number | null>(60);
    const [maxAttempts, setMaxAttempts] = useState<number | null>(null);

    const pdfBooks = useMemo(() => books.filter((book) => book.fileType === "application/pdf"), [books]);

    const resetText = useCallback(() => {
        setParagraphs(null);
        setStartParagraph(null);
        setEndParagraph(null);
    }, []);

    const onCancel = useCallback(() => {
        onClose();
        setMode("FIXED");
        setSelectedBook(undefined);
        setStartPage("1");
        setEndPage("1");
        setTimeLimitSeconds(60);
        setMaxAttempts(null);
        resetText();
    }, [onClose, resetText]);

    const previewApi = useApi(
        classroomReadingApi.previewParagraphs,
        {
            onSuccess: (data) => {
                setParagraphs(data);
                setStartParagraph(null);
                setEndParagraph(null);
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_load_reading_text")}\n${i18n.t("please_try_again_later")}`,
                options: {
                    cancel: true,
                },
            },
        },
    );

    const createReadingApi = useApi(
        classroomReadingApi.createReading,
        {
            onSuccess: () => {
                onSave();
                onCancel();
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_create_reading")}\n${i18n.t("please_try_again_later")}`,
                options: {
                    cancel: true,
                },
            },
        },
    );

    const pagesValid = Number(startPage) >= 1 && Number(endPage) >= Number(startPage);

    const onShowText = useCallback(() => {
        if (!selectedBook || !pagesValid) {
            return;
        }
        previewApi.execute({
            classroomId: classroomId.toString(),
            bookId: selectedBook.id,
            startPage: Number(startPage),
            endPage: Number(endPage),
        });
    }, [previewApi, classroomId, selectedBook, startPage, endPage, pagesValid]);

    // Перший дотик — початок, другий — кінець (якщо раніше за початок —
    // міняємо місцями); дотик після обраного діапазону починає вибір заново.
    const onParagraphPress = useCallback((index: number) => {
        if (startParagraph === null || endParagraph !== null) {
            setStartParagraph(index);
            setEndParagraph(null);
        } else if (index < startParagraph) {
            setEndParagraph(startParagraph);
            setStartParagraph(index);
        } else {
            setEndParagraph(index);
        }
    }, [startParagraph, endParagraph]);

    const selectedWords = useMemo(() => {
        if (!paragraphs || startParagraph === null) {
            return 0;
        }
        const end = endParagraph ?? startParagraph;
        return countWords(paragraphs.slice(startParagraph, end + 1).join(" "));
    }, [paragraphs, startParagraph, endParagraph]);

    const isValid = mode === "RANDOM" ? selectedBook !== undefined : selectedBook !== undefined
        && paragraphs !== null
        && startParagraph !== null
        && endParagraph !== null
        && selectedWords > 0
        && selectedWords <= MAX_WORDS;

    const handleSave = useCallback(() => {
        if (!isValid || !selectedBook) {
            return;
        }
        if (mode === "RANDOM") {
            createReadingApi.execute({
                classroomId: classroomId.toString(),
                reading: {mode, bookId: selectedBook.id, timeLimitSeconds, maxAttempts},
            });
            return;
        }
        if (startParagraph === null || endParagraph === null) {
            return;
        }
        createReadingApi.execute({
            classroomId: classroomId.toString(),
            reading: {
                mode,
                bookId: selectedBook.id,
                startPage: Number(startPage),
                endPage: Number(endPage),
                startParagraph,
                endParagraph,
                timeLimitSeconds,
                maxAttempts,
            },
        });
    }, [isValid, mode, selectedBook, startParagraph, endParagraph, createReadingApi, classroomId, startPage, endPage, timeLimitSeconds, maxAttempts]);

    const isInRange = (index: number) => {
        if (startParagraph === null) {
            return false;
        }
        const end = endParagraph ?? startParagraph;
        return index >= startParagraph && index <= end;
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onCancel}
                headerText={i18n.t("create_reading")}
                headerDescription={i18n.t("create_reading_for_classroom", {classroomName})}
                modalActions={(
                    <XStack gap={6}>
                        <SecondaryButton
                            flex={1}
                            text={i18n.t("cancel")}
                            onPress={onCancel}
                        />
                        <PrimaryButton
                            flex={1}
                            text={createReadingApi.loading ? "" : i18n.t("save")}
                            disabled={!isValid || createReadingApi.loading}
                            onPress={handleSave}
                        />
                    </XStack>
                )}
                isKeyboardVisible={keyboardVisible}
                height={availableContentHeight}
            >
                <ScrollView contentContainerStyle={{flexGrow: 1, paddingBottom: 24}}>
                    <YStack gap={12}>
                        <XStack gap={6} flexWrap="wrap">
                            <Chip label={i18n.t("reading_mode_fixed")} selected={mode === "FIXED"} onPress={() => setMode("FIXED")}/>
                            <Chip label={i18n.t("reading_mode_random")} selected={mode === "RANDOM"} onPress={() => setMode("RANDOM")}/>
                        </XStack>

                        <LabelledInput label={i18n.t("book")} htmlFor="readingBook">
                            <TouchableOpacity onPress={() => setIsBookSelectModalOpen(true)} activeOpacity={0.7}>
                                <Input
                                    inputEnabled={false}
                                    id="readingBook"
                                    value={selectedBook?.title ?? ""}
                                    placeholder={i18n.t("book")}
                                    rightElement={<NextIcon fill="black"/>}
                                />
                            </TouchableOpacity>
                        </LabelledInput>

                        {mode === "RANDOM" && (
                            <CustomText size="p2Regular" color="$gray-40">
                                {i18n.t("reading_mode_random_hint")}
                            </CustomText>
                        )}

                        {mode === "FIXED" && (<>
                        <XStack gap={8}>
                            <LabelledInput label={i18n.t("start_page")} htmlFor="readingStartPage" flex={1}>
                                <Input
                                    id="readingStartPage"
                                    value={startPage}
                                    keyboardType="number-pad"
                                    setValue={(value) => {
                                        setStartPage(value.replace(/\D/g, ""));
                                        resetText();
                                    }}
                                />
                            </LabelledInput>
                            <LabelledInput label={i18n.t("end_page")} htmlFor="readingEndPage" flex={1}>
                                <Input
                                    id="readingEndPage"
                                    value={endPage}
                                    keyboardType="number-pad"
                                    setValue={(value) => {
                                        setEndPage(value.replace(/\D/g, ""));
                                        resetText();
                                    }}
                                />
                            </LabelledInput>
                        </XStack>

                        <SecondaryButton
                            text={i18n.t("reading_show_text")}
                            onPress={onShowText}
                            disabled={!selectedBook || !pagesValid || previewApi.loading}
                        />

                        {previewApi.loading && <ActivityIndicator size="small" color="#CB5A2E"/>}

                        {paragraphs !== null && !previewApi.loading && (
                            paragraphs.length === 0 ? (
                                <CustomText size="p2Regular" color="$gray-40">
                                    {i18n.t("reading_no_text")}
                                </CustomText>
                            ) : (
                                <YStack gap={8}>
                                    <CustomText size="p2Regular" color="$gray-40">
                                        {i18n.t("reading_select_hint")}
                                    </CustomText>
                                    {paragraphs.map((paragraph, index) => {
                                        const inRange = isInRange(index);
                                        const label = index === startParagraph
                                            ? i18n.t("reading_fragment_start")
                                            : index === endParagraph ? i18n.t("reading_fragment_end") : null;
                                        return (
                                            <YStack
                                                key={index}
                                                padding={10}
                                                borderRadius={12}
                                                borderWidth={1}
                                                borderColor={inRange ? "#CB5A2E" : "$gray-85"}
                                                backgroundColor={inRange ? "#FBEFE6" : "#FFFFFF"}
                                                pressStyle={{opacity: 0.7}}
                                                onPress={() => onParagraphPress(index)}
                                                gap={4}
                                            >
                                                {label && (
                                                    <CustomText size="p3Medium" color="#CB5A2E">
                                                        {label}
                                                    </CustomText>
                                                )}
                                                <CustomText size="p2Regular" color="$gray-20" numberOfLines={inRange ? undefined : 3}>
                                                    {paragraph}
                                                </CustomText>
                                            </YStack>
                                        );
                                    })}
                                    {startParagraph !== null && (
                                        <CustomText
                                            size="p2Medium"
                                            color={selectedWords > MAX_WORDS ? "$error-primary" : "$gray-20"}
                                        >
                                            {selectedWords > MAX_WORDS
                                                ? i18n.t("reading_too_long", {max: MAX_WORDS})
                                                : i18n.t("reading_selected_words", {count: selectedWords})}
                                        </CustomText>
                                    )}
                                </YStack>
                            )
                        )}
                        </>)}

                        <YStack gap={8}>
                            <CustomText size="p2Regular" color="$gray-20">
                                {i18n.t("reading_time_limit")}
                            </CustomText>
                            <XStack gap={6} flexWrap="wrap">
                                {TIME_LIMIT_OPTIONS.map((option) => (
                                    <Chip
                                        key={option ?? "none"}
                                        label={option === null ? i18n.t("reading_no_time_limit") : i18n.t("minutes_short", {count: option / 60})}
                                        selected={timeLimitSeconds === option}
                                        onPress={() => setTimeLimitSeconds(option)}
                                    />
                                ))}
                            </XStack>
                        </YStack>

                        <YStack gap={8}>
                            <CustomText size="p2Regular" color="$gray-20">
                                {i18n.t("reading_attempts")}
                            </CustomText>
                            <XStack gap={6} flexWrap="wrap">
                                {ATTEMPTS_OPTIONS.map((option) => (
                                    <Chip
                                        key={option ?? "none"}
                                        label={option === null ? i18n.t("reading_unlimited_attempts") : option.toString()}
                                        selected={maxAttempts === option}
                                        onPress={() => setMaxAttempts(option)}
                                    />
                                ))}
                            </XStack>
                        </YStack>
                    </YStack>
                </ScrollView>
            </Modal>

            <BookSelectModal
                isOpen={isBookSelectModalOpen}
                onClose={() => setIsBookSelectModalOpen(false)}
                onSelectBook={(book) => {
                    setSelectedBook(book);
                    resetText();
                }}
                books={pdfBooks}
            />
        </>
    );
};

export default CreateReadingModal;
