import React, {FC, useCallback, useEffect, useMemo, useState} from "react";
import {XStack, YStack} from "tamagui";
import {ActivityIndicator} from "react-native";

import i18n from "@/localization/i18n";
import Modal from "@/components/modal/index";
import SecondaryButton from "@/components/buttons/SecondaryButton";
import useWindow from "@/hooks/useWindow";
import useApi from "@/hooks/useApi";
import ListButton from "@/components/buttons/ListButton";
import ArrowRightIcon from "@/assets/images/icons/next-icon.svg";
import bookApi from "@/api/endpoints/bookApi";
import {Book, CatalogBook} from "@/types/Book";
import {CustomText} from "@/components/CustomText";

type Props = {
    onClose: () => void;
    isOpen: boolean;
    onSelectId?: (bookId: string) => void;
    onSelectBook?: (book: Book) => void;
    // Якщо передано — показуємо лише ці книги (напр. книги класу) замість усіх книг вчителя.
    books?: Book[];
    // Показати також предзаготовлені книги з каталогу застосунку.
    showCatalog?: boolean;
}

const BookSelectModal: FC<Props> = ({onClose, isOpen, onSelectId, onSelectBook, books: providedBooks, showCatalog = false}) => {
    const {keyboardVisible, availableContentHeight} = useWindow()

    const [books, setBooks] = useState<Book[]>([]);
    const [catalog, setCatalog] = useState<CatalogBook[]>([]);

    const fetchBooksApi = useApi(
        bookApi.fetchBooks,
        {
            onSuccess: (data) => {
                setBooks(data);
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_fetch_books")}\n${i18n.t("please_try_again_later")}`,
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

    const fetchCatalogApi = useApi(
        bookApi.fetchCatalog,
        {
            onSuccess: (data) => {
                setCatalog(data);
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_fetch_books")}\n${i18n.t("please_try_again_later")}`,
                options: {
                    tryAgain: true,
                    cancel: true,
                },
            },
        },
    );

    const handleSelect = useCallback(async (book: Book) => {
        if (onSelectId) {
            onSelectId(book.id.toString())
        }
        if (onSelectBook) {
            onSelectBook(book)
        }
        onClose()
    }, [onClose, onSelectBook, onSelectId]);

    const addCatalogBookApi = useApi(
        bookApi.addCatalogBook,
        {
            // Книга з каталогу вже додана до бібліотеки вчителя — далі як звичайна книга.
            onSuccess: (book) => {
                handleSelect(book);
            },
            errorHandler: {
                title: i18n.t("error"),
                message: `${i18n.t("failed_to_add_catalog_book")}\n${i18n.t("please_try_again_later")}`,
                options: {
                    cancel: true,
                },
            },
        },
    );

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        if (!providedBooks) {
            fetchBooksApi.execute();
        }
        if (showCatalog) {
            fetchCatalogApi.execute();
        }
    }, [isOpen]);

    const onCancel = useCallback(() => {
        onClose();
    }, [onClose]);

    const ownBooks = providedBooks ?? books;

    // Каталожні книги, які вчитель уже додав, і так є серед «Моїх книг».
    const availableCatalog = useMemo(() => {
        const addedKeys = new Set(ownBooks.map((book) => book.catalogKey).filter(Boolean));
        return catalog.filter((book) => !addedKeys.has(book.key));
    }, [catalog, ownBooks]);

    const isLoading = fetchBooksApi.loading || (showCatalog && fetchCatalogApi.loading);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            headerText={i18n.t("select_book")}
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
            {isLoading ? (
                <ActivityIndicator size="small" color="#CB5A2E"/>
            ) : (
                <YStack>
                    {showCatalog && ownBooks.length > 0 && (
                        <CustomText size="h5Medium" color="$gray-20" paddingTop={8}>
                            {i18n.t("my_books")}
                        </CustomText>
                    )}
                    {ownBooks.map((book) => (
                        <ListButton
                            key={book.id}
                            onPress={() => handleSelect(book)}
                            text={book.title}
                            icon={ArrowRightIcon}
                        />
                    ))}

                    {showCatalog && availableCatalog.length > 0 && (
                        <>
                            <CustomText size="h5Medium" color="$gray-20" paddingTop={16}>
                                {i18n.t("book_catalog")}
                            </CustomText>
                            {availableCatalog.map((book) => (
                                <ListButton
                                    key={book.key}
                                    onPress={() => addCatalogBookApi.execute(book.key)}
                                    disabled={addCatalogBookApi.loading}
                                    text={`${book.title} — ${book.author}`}
                                    icon={ArrowRightIcon}
                                    rightPart={book.grade ? (
                                        <CustomText size="p2Regular" color="$gray-40">
                                            {i18n.t("catalog_book_grade", {grade: book.grade})}
                                        </CustomText>
                                    ) : undefined}
                                />
                            ))}
                        </>
                    )}
                </YStack>
            )}
        </Modal>
    )
}

export default BookSelectModal;
