import React, {ReactNode} from "react";
import {Keyboard, Pressable} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";

import KeyboardScrollView from "@/components/KeyboardScrollView";
import useKeyboardInset from "@/hooks/useKeyboardInset";

type Props = {
    children: ReactNode;
};

// Піднімає вміст екрана над клавіатурою (поля вводу й кнопки лишаються
// видимими), дає його прокрутити й ховає клавіатуру тапом по порожньому місцю
// або прокруткою.
//
// Екран уже стоїть усередині кореневого SafeAreaView (app/_layout.tsx), тобто
// його низ і так піднятий на нижню системну панель — тому від висоти
// клавіатури (рахованої від краю екрана) її віднімаємо.
// KeyboardAvoidingView тут не підходить: він рахує перекриття від позиції
// всередині батька, а не вікна, і на Android з edge-to-edge недопіднімає вміст.
const KeyboardAwareContainer = ({children}: Props) => {
    const insets = useSafeAreaInsets();
    const {keyboardInset} = useKeyboardInset();
    const paddingBottom = Math.max(0, keyboardInset - insets.bottom);

    return (
        <Pressable style={{flex: 1, paddingBottom}} onPress={Keyboard.dismiss} accessible={false}>
            <KeyboardScrollView keyboardInset={keyboardInset} showsVerticalScrollIndicator={false}>
                {children}
            </KeyboardScrollView>
        </Pressable>
    );
};

export default KeyboardAwareContainer;
