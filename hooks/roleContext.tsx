import React, {createContext, ReactNode, useCallback, useContext, useEffect, useState} from "react";

import {useAuth} from "@/auth/SupabaseAuthProvider";
import participantApi from "@/api/endpoints/participantApi";
import {ApiErrorCode} from "@/api";
import {setActingStudentId} from "@/auth/actingStudent";
import {Participant, UserRole} from "@/types/Paticipant";

interface RoleContextType {
    profile: Participant | null;
    isTeacher: boolean;
    isStudent: boolean;
    // id профілю учня (для учня — завжди власний, у вчителя — null).
    studentId: string | null;
    // Користувач зареєструвався в Supabase, але ще не обрав роль.
    needsOnboarding: boolean;
    isLoading: boolean;
    createProfile: (name: string, role: UserRole) => Promise<boolean>;
    refreshProfile: () => Promise<void>;
    // Режим учня на телефоні вчителя: застосунок працює від імені локального
    // учня (profile — його профіль), поки вчитель не вийде з режиму.
    actingStudent: Participant | null;
    startStudentMode: (student: Participant) => Promise<void>;
    exitStudentMode: () => Promise<void>;
}

const defaultContextValue: RoleContextType = {
    profile: null,
    isTeacher: false,
    isStudent: false,
    studentId: null,
    needsOnboarding: false,
    isLoading: true,
    createProfile: async () => false,
    refreshProfile: async () => {},
    actingStudent: null,
    startStudentMode: async () => {},
    exitStudentMode: async () => {},
};

export const RoleContext = createContext<RoleContextType>(defaultContextValue);

export const useRole = (): RoleContextType => useContext(RoleContext);

export const RoleProvider: React.FC<{ children: ReactNode }> = ({children}) => {
    const {user} = useAuth();
    // Залежимо саме від id: об'єкт user змінюється при кожному оновленні токена.
    const userId = user?.id;
    const [profile, setProfile] = useState<Participant | null>(null);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [actingStudent, setActingStudent] = useState<Participant | null>(null);

    const refreshProfile = useCallback(async () => {
        if (!userId) {
            setProfile(null);
            setNeedsOnboarding(false);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const response = await participantApi.fetchMe();
        if (response.success) {
            setProfile(response.data);
            setNeedsOnboarding(false);
        } else if (response.error.code === ApiErrorCode.NOT_FOUND) {
            setProfile(null);
            setNeedsOnboarding(true);
        }
        setIsLoading(false);
    }, [userId]);

    useEffect(() => {
        refreshProfile();
    }, [refreshProfile]);

    const createProfile = useCallback(async (name: string, role: UserRole): Promise<boolean> => {
        const response = await participantApi.createMe({name, role});
        if (!response.success) {
            return false;
        }
        setProfile(response.data);
        setNeedsOnboarding(false);
        return true;
    }, []);

    const startStudentMode = useCallback(async (student: Participant) => {
        setActingStudentId(student.id);
        setActingStudent(student);
        await refreshProfile();
    }, [refreshProfile]);

    const exitStudentMode = useCallback(async () => {
        setActingStudentId(null);
        setActingStudent(null);
        await refreshProfile();
    }, [refreshProfile]);

    // Вихід з акаунта — і з режиму учня.
    useEffect(() => {
        if (!userId) {
            setActingStudentId(null);
            setActingStudent(null);
        }
    }, [userId]);

    const contextValue: RoleContextType = {
        profile,
        isTeacher: profile?.role === "TEACHER",
        isStudent: profile?.role === "STUDENT",
        studentId: profile?.role === "STUDENT" ? profile.id.toString() : null,
        needsOnboarding,
        isLoading,
        createProfile,
        refreshProfile,
        actingStudent,
        startStudentMode,
        exitStudentMode,
    };

    return (
        <RoleContext.Provider value={contextValue}>
            {children}
        </RoleContext.Provider>
    );
};
