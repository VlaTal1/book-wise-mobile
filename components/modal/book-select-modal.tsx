import React, {FC, useCallback, useEffect, useState} from "react";
import {XStack} from "tamagui";
import {ActivityIndicator} from "react-native";

import i18n from "@/localization/i18n";
import Modal from "@/components/modal/index";
import SecondaryButton from "@/components/buttons/SecondaryButton";
import useWindow from "@/hooks/useWindow";
import useApi from "@/hooks/useApi";
import ListButton from "@/components/buttons/ListButton";
import ArrowRightIcon from "@/assets/images/icons/next-icon.svg";
import bookApi from "@/api/endpoints/bookApi";
import {Book} from "@/types/Book";

type Props = {
    onClose: () => void;
    isOpen: boolean;
    onSelectId?: (bookId: string) => void;
    onSelectBook?: (book: Book) => void;
    // Якщо передано — показуємо лише ці книги (напр. книги класу) замість усіх книг вчителя.
    books?: Book[];
}

const BookSelectModal: FC<Props> = ({onClose, isOpen, onSelectId, onSelectBook, books: providedBooks}) => {
    const {keyboardVisible, availableContentHeight} = useWindow()

    const [books, setBooks] = useState<Book[]>([]);

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

    const invokeFetchBooks = useCallback(() => {
        fetchBooksApi.execute();
    }, []);

    useEffect(() => {
        if (isOpen && !providedBooks) {
            invokeFetchBooks()
        }
    }, [isOpen]);

    const onCancel = useCallback(() => {
        onClose();
    }, [onClose]);

    const handleSelect = useCallback(async (book: Book) => {
        if (onSelectId) {
            onSelectId(book.id.toString())
        }
        if (onSelectBook) {
            onSelectBook(book)
        }
        onClose()
    }, [onClose, onSelectBook, onSelectId]);

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
            {fetchBooksApi.loading || !books ? (
                <ActivityIndicator size="small" color="#CB5A2E"/>
            ) : (
                (providedBooks ?? books).map((book) => (
                    <ListButton
                        key={book.id}
                        onPress={() => handleSelect(book)}
                        text={book.title}
                        icon={ArrowRightIcon}
                    />
                ))
            )}
        </Modal>
    )
}

export default BookSelectModal;