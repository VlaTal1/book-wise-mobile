import React, {FC} from "react";
import Modal from "react-native-modal";
import {Dimensions, Keyboard, Platform, Pressable} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {View} from "tamagui";
import {DimensionValue} from "react-native/Libraries/StyleSheet/StyleSheetTypes";

import BottomButtonGroup from "@/components/buttons/BottomButtonGroup";
import {CustomText} from "@/components/CustomText";
import KeyboardScrollView from "@/components/KeyboardScrollView";
import useKeyboardInset from "@/hooks/useKeyboardInset";

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    headerImage?: React.ReactNode;
    headerText?: string;
    headerDescription?: string;
    headerActions?: React.ReactNode;
    headerActionsVariant?: "underDescription" | "inHeader";
    modalActions?: React.ReactNode;
    modalActionsVariant?: "default" | "floating";
    scrollable?: boolean;
    onDiscard?: () => unknown;
    minHeight?: DimensionValue | undefined;
    children?: React.ReactNode;
    isSwipeDisable?: boolean;
    swipeThreshold?: number;
    height?: DimensionValue | undefined;
}

const SHEET_PADDING = 22;
const KEYBOARD_GAP = 12;

// Нижня модалка.
// - Модалка (RN Modal) на Android з edge-to-edge малюється під системними
//   панелями, тому знизу додаємо відступ на панель навігації (кнопки/жест),
//   інакше вона перекриває кнопки модалки.
// - Коли відкрита клавіатура, модалка розгортається на весь екран (до верху),
//   а її низ (кнопки) стоїть одразу над клавіатурою; вміст між заголовком і
//   кнопками прокручується, і поле з курсором докручується у видиму зону.
// - Тап по порожньому місцю або прокрутка ховають клавіатуру.
const BottomSheetModal: FC<ModalProps> = (
    {
        isOpen,
        onClose,
        headerImage,
        headerText,
        headerDescription,
        headerActions,
        headerActionsVariant = "underDescription",
        modalActions,
        modalActionsVariant = "default",
        scrollable = true,
        onDiscard = undefined,
        minHeight,
        children,
        isSwipeDisable,
        swipeThreshold,
        height,
    },
) => {
    const insets = useSafeAreaInsets();
    const {keyboardVisible, keyboardInset} = useKeyboardInset();
    // Свайп униз конфліктує з прокруткою вмісту, поки відкрита клавіатура.
    const swipeDisabled = isSwipeDisable || keyboardVisible;

    const paddingTop = keyboardVisible
        ? insets.top + KEYBOARD_GAP
        : (isSwipeDisable ? SHEET_PADDING : 10);
    const paddingBottom = keyboardVisible
        ? keyboardInset + KEYBOARD_GAP
        : SHEET_PADDING + insets.bottom;

    const content = (
        <ModalContent
            image={headerImage}
            title={headerText}
            description={headerDescription}
            actions={headerActions}
            actionsVariant={headerActionsVariant}
        >
            {children}
        </ModalContent>
    );

    return (
        <Modal
            isVisible={isOpen}
            onBackdropPress={onClose}
            onSwipeMove={(_percentageShown, gestureState) => {
                const swipeDistance = Math.abs(gestureState.dy);
                const THRESHOLD = 100; // Replace with your desired threshold
                if (!!onDiscard && swipeDistance > THRESHOLD) {
                    onDiscard();
                }
            }}
            swipeThreshold={swipeThreshold ?? 400}
            onSwipeComplete={onDiscard ? undefined : onClose}
            swipeDirection={swipeDisabled ? undefined : "down"}
            style={{justifyContent: "flex-end", margin: 0}}
            onBackButtonPress={onClose}
            // Явно edge-to-edge, щоб відступи з useSafeAreaInsets збігалися з
            // тим, де реально малюється модалка, а фон закривав увесь екран.
            statusBarTranslucent
            // Пропс RN Modal, якого немає в типах react-native-modal (передається далі як є).
            {...(Platform.OS === "android" ? {navigationBarTranslucent: true} : {})}
            deviceHeight={Dimensions.get("screen").height}
        >
            <Pressable
                onPress={Keyboard.dismiss}
                accessible={false}
                style={keyboardVisible ? {height: "100%"} : {maxHeight: "90%", height}}
            >
                <View
                    flex={keyboardVisible ? 1 : undefined}
                    flexShrink={1}
                    backgroundColor="white"
                    paddingTop={paddingTop}
                    paddingHorizontal={SHEET_PADDING}
                    paddingBottom={paddingBottom}
                    borderTopLeftRadius={!keyboardVisible ? 28 : 0}
                    borderTopRightRadius={!keyboardVisible ? 28 : 0}
                    gap={24}
                >
                    {!swipeDisabled &&
                        <View
                            width={65}
                            height={5}
                            borderRadius={100}
                            backgroundColor="#D8C9AC"
                            alignSelf="center"
                        />
                    }
                    {scrollable ? (
                        <KeyboardScrollView
                            keyboardInset={keyboardInset}
                            contentStyle={{width: "100%", gap: 24, minHeight}}
                        >
                            {content}
                        </KeyboardScrollView>
                    ) : content}
                    {modalActions && (
                        modalActionsVariant === "default" ? (
                            <View width="100%" alignItems="center">
                                {modalActions}
                            </View>
                        ) : (
                            <BottomButtonGroup>
                                {modalActions}
                            </BottomButtonGroup>
                        )
                    )}
                </View>
            </Pressable>
        </Modal>
    )
}

export default BottomSheetModal;

const ModalContent: React.FC<{
    image?: React.ReactNode;
    title?: string;
    description?: string;
    actions?: React.ReactNode;
    actionsVariant?: "underDescription" | "inHeader";
    children?: React.ReactNode;
}> = ({image, title, description, actions, actionsVariant, children}) => {
    return (
        <>
            <View alignItems="center" gap={24} width="100%">
                {image && image}
                <View gap={12} width="100%">
                    {title && (
                        <CustomText size="h4Regular" textAlign="center" color="$gray-20">
                            {title}
                        </CustomText>
                    )}
                    {description && (
                        <CustomText size="p1Light" textAlign="center" color="$gray-40">
                            {description}
                        </CustomText>
                    )}
                    {actionsVariant === "underDescription"
                        ? actions
                        : (
                            <View position="absolute" top={0} right={0}>
                                {actions}
                            </View>
                        )}
                </View>
            </View>
            {children}
        </>
    )
}
