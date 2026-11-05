import {useEffect, useState} from "react";
import {Keyboard, KeyboardEvent, Platform} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";

type KeyboardInset = {
    keyboardVisible: boolean;
    // Скільки пікселів (dp) від НИЖНЬОГО КРАЮ ЕКРАНА перекриває клавіатура.
    keyboardInset: number;
};

// Висота клавіатури, відрахована від нижнього краю екрана.
//
// На Android з edge-to-edge (RN 0.86, edgeToEdgeEnabled=true) вікно не
// змінює розмір під клавіатуру (adjustResize не діє), тому піднімати вміст
// треба вручну. При цьому RN віддає в endCoordinates.height висоту
// клавіатури МІНУС нижню системну панель (ReactRootView.checkForKeyboardEvents:
// imeInsets.bottom - systemBars.bottom), тож додаємо її назад.
// На iOS endCoordinates.height — уже повна висота від краю екрана.
const useKeyboardInset = (): KeyboardInset => {
    const insets = useSafeAreaInsets();
    const [rawHeight, setRawHeight] = useState(0);

    useEffect(() => {
        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const onShow = (e: KeyboardEvent) => setRawHeight(e.endCoordinates.height);
        const onHide = () => setRawHeight(0);

        const showSub = Keyboard.addListener(showEvent, onShow);
        const hideSub = Keyboard.addListener(hideEvent, onHide);
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const keyboardVisible = rawHeight > 0;
    const keyboardInset = !keyboardVisible
        ? 0
        : Platform.OS === "android" ? rawHeight + insets.bottom : rawHeight;

    return {keyboardVisible, keyboardInset};
};

export default useKeyboardInset;
