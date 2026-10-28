import React, {useState} from "react";
import {ActivityIndicator, Alert} from "react-native";
import {View, XStack, YStack} from "tamagui";
import Feather from "@expo/vector-icons/Feather";

import i18n from "@/localization/i18n";
import {CustomText} from "@/components/CustomText";
import Input from "@/components/input";
import LabelledInput from "@/components/LabelledInput";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import SecondaryButton from "@/components/buttons/SecondaryButton";
import {useRole} from "@/hooks/roleContext";
import {useAuth} from "@/auth/SupabaseAuthProvider";
import {isBlank} from "@/functions";
import {UserRole} from "@/types/Paticipant";
import KeyboardAwareContainer from "@/components/KeyboardAwareContainer";

const RoleCard = ({role, selected, onPress}: {
    role: UserRole;
    selected: boolean;
    onPress: () => void;
}) => {
    const isTeacher = role === "TEACHER";
    return (
        <XStack
            flex={1}
            backgroundColor={selected ? "#FBEAD9" : "#FFFFFF"}
            borderColor={selected ? "#CB5A2E" : "$gray-85"}
            borderWidth={1.5}
            borderRadius={24}
            padding={16}
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
            gap={8}
            pressStyle={{scale: 0.97}}
            onPress={onPress}
        >
            <Feather name={isTeacher ? "briefcase" : "book"} size={28} color="#CB5A2E"/>
            <CustomText size="h5Medium" color="$gray-20">
                {i18n.t(isTeacher ? "role_teacher" : "role_student")}
            </CustomText>
        </XStack>
    );
};

// Показується одразу після реєстрації (або першого входу), поки в
// користувача немає профілю на бекенді — він обирає, вчитель він чи учень.
const RoleOnboarding = () => {
    const {createProfile} = useRole();
    const {signOut} = useAuth();

    const [name, setName] = useState("");
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(false);

    const onSave = async () => {
        if (!role || isBlank(name)) {
            return;
        }
        setLoading(true);
        const success = await createProfile(name.trim(), role);
        setLoading(false);
        if (!success) {
            Alert.alert(i18n.t("error"), `${i18n.t("failed_to_create_profile")}\n${i18n.t("please_try_again_later")}`);
        }
    };

    if (loading) {
        return (
            <YStack flex={1} justifyContent="center" alignItems="center">
                <ActivityIndicator size="large" color="#CB5A2E"/>
            </YStack>
        );
    }

    return (
        <KeyboardAwareContainer>
            <YStack flex={1} padding={16} justifyContent="space-between" gap={24}>
                <YStack gap={24} paddingTop={28}>
                    <YStack gap={4}>
                        <CustomText size="h2" color="$gray-20">
                            {i18n.t("onboarding_title")}
                        </CustomText>
                        <CustomText size="p1Regular" color="$gray-40">
                            {i18n.t("onboarding_description")}
                        </CustomText>
                    </YStack>

                    <XStack gap={10}>
                        <RoleCard role="TEACHER" selected={role === "TEACHER"} onPress={() => setRole("TEACHER")}/>
                        <RoleCard role="STUDENT" selected={role === "STUDENT"} onPress={() => setRole("STUDENT")}/>
                    </XStack>

                    <LabelledInput label={i18n.t("your_name")} htmlFor="profileName">
                        <Input
                            id="profileName"
                            value={name}
                            setValue={setName}
                            placeholder={i18n.t("name")}
                            autoCapitalize="words"
                        />
                    </LabelledInput>
                </YStack>

                <View gap={6}>
                    <PrimaryButton
                        text={i18n.t("continue")}
                        disabled={!role || isBlank(name)}
                        onPress={onSave}
                    />
                    <SecondaryButton
                        text={i18n.t("logout")}
                        onPress={signOut}
                    />
                </View>
            </YStack>
        </KeyboardAwareContainer>
    );
};

export default RoleOnboarding;
