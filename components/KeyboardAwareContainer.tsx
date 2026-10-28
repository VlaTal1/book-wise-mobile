import React, {ReactNode} from "react";
import {KeyboardAvoidingView, ScrollView} from "react-native";

type Props = {
    children: ReactNode;
};

// Піднімає вміст над клавіатурою (поля вводу й кнопки лишаються видимими)
// і дає прокрутити його, якщо разом з клавіатурою він не вміщується.
// На Android з edge-to-edge adjustResize не працює, тому "padding" для обох платформ.
const KeyboardAwareContainer = ({children}: Props) => (
    <KeyboardAvoidingView style={{flex: 1}} behavior="padding">
        <ScrollView
            contentContainerStyle={{flexGrow: 1}}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            showsVerticalScrollIndicator={false}
        >
            {children}
        </ScrollView>
    </KeyboardAvoidingView>
);

export default KeyboardAwareContainer;
