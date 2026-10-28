import React, {createContext, ReactNode, useContext, useEffect, useRef, useState} from "react";
import {PostgrestError, Session, User} from "@supabase/supabase-js";
// import {GoogleSignin} from "@react-native-google-signin/google-signin";

import {supabase} from "@/auth/supabase";

const logEvent = (event: string, details?: unknown) => {
    const timestamp = new Date().toISOString();
    console.log(`[Auth ${timestamp}] ${event}`);
    if (details) {
        console.log("[Auth Details]", JSON.stringify(details, null, 2));
    }
};

interface AuthError {
    message: string;
    status?: number;
    code?: string;
    name?: string;
    details?: string;
}

interface ApplicationError {
    message: string;
    code?: string;
    details?: unknown;
}

type ErrorType = PostgrestError | AuthError | ApplicationError | Error;

interface Profile {
    id: string;
    full_name: string | null;
    emoji: string | null;
    new: boolean;
}

type AuthContextType = {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: ErrorType | null }>;
    // signInWithGoogle: () => Promise<{ error: ErrorType | null }>;
    signUp: (email: string, password: string) => Promise<{ error: ErrorType | null, user?: User | null }>;
    signOut: () => Promise<void>;
    updateProfile: (updates: { full_name?: string; emoji?: string }) => Promise<{
        error: ErrorType | null
    }>;
    resetPassword: (email: string) => Promise<{ error: ErrorType | null }>;
    updatePassword: (password: string) => Promise<{ error: ErrorType | null }>;
    verifyPasswordResetCode: (email: string, code: string) => Promise<{
        error: ErrorType | null,
        session?: Session | null
    }>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    profile: null,
    isLoading: true,
    signIn: async () => ({error: null}),
    // signInWithGoogle: async () => ({error: null}),
    signUp: async () => ({error: null}),
    signOut: async () => {
    },
    updateProfile: async () => ({error: null}),
    resetPassword: async () => ({error: null}),
    updatePassword: async () => ({error: null}),
    verifyPasswordResetCode: async () => ({error: null}),
});

export const useAuth = () => useContext(AuthContext);

type Props = {
    children: ReactNode;
};

export const SupabaseAuthProvider = ({children}: Props) => {
    logEvent("AuthProvider initialized");

    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Using useRef to track intentional sign out
    const intentionalSignOut = useRef(false);
    // Using useRef to track current initialization state
    const isInitializing = useRef(true);

    /**
     Fetches the profile for a given user ID from the database.
     @param userId The user ID to fetch the profile for.
     @returns The profile object if found, otherwise null.
     */
    const fetchProfile = async (userId: string) => {
        logEvent(`Fetching profile for user: ${userId}`);

        try {
            const {data, error} = await supabase
                .from("profiles")
                .select("id, full_name, emoji, new")
                .eq("id", userId)
                .single();

            if (error) {
                logEvent(`Error fetching profile for ${userId}`, {error: error.message, code: error.code});
                return null;
            }

            logEvent(`Profile retrieved successfully for ${userId}`, {
                hasFullName: !!data.full_name,
                hasEmoji: !!data.emoji,
            });

            return data as Profile;
        } catch (e) {
            logEvent(`Exception when fetching profile for ${userId}`, {error: e});
            return null;
        }
    };

    // Restoring the session on application load
    useEffect(() => {
        const initializeAuth = async () => {
            logEvent("Initializing authentication");
            setIsLoading(true);
            isInitializing.current = true;

            try {
                // Checking for existing session
                logEvent("Retrieving current session");
                const {data: {session: currentSession}} = await supabase.auth.getSession();

                if (currentSession) {
                    logEvent("Session found", {
                        userId: currentSession.user.id,
                        expiresAt: currentSession.expires_at,
                        providerToken: !!currentSession.provider_token,
                    });

                    setSession(currentSession);
                    setUser(currentSession.user);

                    // Retrieving the user profile
                    logEvent("Session exists, fetching user profile");
                    const userProfile = await fetchProfile(currentSession.user.id);
                    if (userProfile) {
                        logEvent("User profile set for authenticated session");
                        setProfile(userProfile);
                    } else {
                        logEvent("Failed to retrieve user profile for authenticated session");
                    }
                } else {
                    logEvent("No existing session found");
                }
            } catch (e) {
                logEvent("Error during auth initialization", {error: e});
            } finally {
                setIsLoading(false);
                setTimeout(() => {
                    isInitializing.current = false;
                    logEvent("Auth initialization completed and timeout finished");
                }, 500); // Small delay to ensure all operations have completed
            }
        };

        initializeAuth();

        // Listening for changes in the session
        logEvent("Setting up auth state change listener");
        const {data: authListener} = supabase.auth.onAuthStateChange(async (event, newSession) => {
            // Ignore SIGNED_OUT events during initialization or immediately after SIGNED_IN
            if (event === "SIGNED_OUT" && !intentionalSignOut.current && (isInitializing.current || user !== null)) {
                logEvent("Ignoring automatic SIGNED_OUT event during initialization or after recent sign-in", {
                    isInitializing: isInitializing.current,
                    hasUser: !!user,
                });
                return;
            }

            setIsLoading(true);

            logEvent(`Auth state changed: ${event}`, {
                hasSession: !!newSession,
                userId: newSession?.user?.id,
                intentionalSignOut: intentionalSignOut.current,
            });

            if (event === "SIGNED_IN") {
                setSession(newSession);
                setUser(newSession?.user ?? null);

                if (newSession?.user) {
                    logEvent("New session detected, fetching user profile");
                    const userProfile = await fetchProfile(newSession.user.id);
                    if (userProfile) {
                        logEvent("User profile set after auth state change");
                        setProfile(userProfile);
                    } else {
                        logEvent("Failed to retrieve user profile after auth state change");
                    }
                }
            } else if (event === "SIGNED_OUT" && intentionalSignOut.current) {
                intentionalSignOut.current = false;
                logEvent("Intentional sign out completed, clearing state");
                setSession(null);
                setUser(null);
                setProfile(null);
            }

            setIsLoading(false);
        });

        // Cleanup the listener on unmount
        return () => {
            logEvent("Cleaning up auth state change listener");
            authListener.subscription.unsubscribe();
        };
    }, []);

    /**
     * Function to sign in with email and password
     * @param email
     * @param password
     * @returns {Promise<{error: ErrorType | null}>}
     */
    const signIn = async (email: string, password: string): Promise<{ error: ErrorType | null }> => {
        logEvent("Sign in attempt", {email: email.substring(0, 3) + "***"});

        try {
            const {data, error} = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                logEvent("Sign in failed", {error: error.message, code: error.code});
                return {error};
            }

            logEvent("Sign in successful", {
                userId: data.user?.id,
                hasSession: !!data.session,
            });

            // Immediately set the session and user without waiting for the event
            if (data.session && data.user) {
                setSession(data.session);
                setUser(data.user);

                // Retrieve the profile
                const userProfile = await fetchProfile(data.user.id);
                if (userProfile) {
                    setProfile(userProfile);
                    logEvent("Profile loaded immediately after sign in");
                }
            }

            return {error: null};
        } catch (e) {
            const error = e as Error;
            logEvent("Exception during sign in", {error: error.message});
            return {error};
        }
    };

    // const signInWithGoogle = async (): Promise<{ error: ErrorType | null }> => {
    //     logEvent("Google sign in attempt");
    //
    //     try {
    //         // Check if your device supports Google Play
    //         await GoogleSignin.hasPlayServices();
    //
    //         // Get the user ID token
    //         const userInfo = await GoogleSignin.signIn()
    //         if (!userInfo.data?.idToken) {
    //             logEvent("Google sign in failed: No ID token present");
    //             return {error: new Error("no ID token present!")}
    //         }
    //
    //         const {data, error} = await supabase.auth.signInWithIdToken({
    //             provider: "google",
    //             token: userInfo.data.idToken,
    //         })
    //
    //         if (error) {
    //             logEvent("Google sign in failed", {error: error.message, code: error.code});
    //             return {error};
    //         }
    //
    //         logEvent("Google sign in successful", {
    //             userId: data.user?.id,
    //             hasSession: !!data.session,
    //         });
    //
    //         // Immediately set the session and user without waiting for the event
    //         if (data.session && data.user) {
    //             setSession(data.session);
    //             setUser(data.user);
    //
    //             // Retrieve the profile
    //             const userProfile = await fetchProfile(data.user.id);
    //             if (!userProfile) {
    //                 return {error: new Error("Failed to retrieve profile after Google sign in")}
    //             }
    //
    //             setProfile(userProfile);
    //             logEvent("Profile loaded immediately after Google sign in");
    //
    //             if (userProfile.new) {
    //                 await triggerUserSetup(data.session);
    //             }
    //         }
    //
    //         return {error: null};
    //     } catch (e) {
    //         const error = e as Error;
    //         logEvent("Exception during Google sign in", {error: error.message});
    //         return {error};
    //     }
    // };

    /**
     * Function to sign up with email and password
     * @param email
     * @param password
     * @returns {Promise<{error: ErrorType | null, user?: User | null}>}
     */
    const signUp = async (email: string, password: string): Promise<{
        error: ErrorType | null,
        user?: User | null
    }> => {
        logEvent("Sign up attempt", {email: email.substring(0, 3) + "***"});

        try {
            const {data, error} = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: email.split("@")[0],
                    },
                },
            });

            if (error) {
                logEvent("Sign up failed", {error: error.message, code: error.code});
                return {error, user: null};
            }

            logEvent("Sign up successful", {
                userId: data.user?.id,
                hasSession: !!data.session,
            });

            // Підтвердження пошти в Supabase вимкнене — сесія приходить одразу,
            // ставимо її до завантаження профілю, щоб користувача відразу пустило в застосунок.
            if (data.user && data.session) {
                setSession(data.session);
                setUser(data.user);
                logEvent("Session and user set immediately after sign up");

                const userProfile = await fetchProfile(data.user.id);
                if (userProfile) {
                    setProfile(userProfile);
                }
            } else if (data.user) {
                // Сесії немає (напр. підтвердження пошти знову ввімкнули) — пробуємо
                // одразу увійти тими ж даними.
                logEvent("No session after sign up, signing in");
                const {error: signInError} = await signIn(email, password);
                if (signInError) {
                    return {error: signInError, user: data.user};
                }
            }

            return {error: null, user: data.user};
        } catch (e) {
            const error = e as Error;
            logEvent("Exception during sign up", {error: error.message});
            return {error};
        }
    };

    /**
     * Function to sign out
     * @returns {Promise<void>}
     */
    const signOut = async () => {
        logEvent("Sign out attempt - marking as intentional");
        intentionalSignOut.current = true;

        try {
            await supabase.auth.signOut();
            logEvent("Sign out successful");
        } catch (error) {
            logEvent("Error during sign out", {error});

            // Even if there is an error, we clear the state
            setSession(null);
            setUser(null);
            setProfile(null);
        }
    };

    /**
     * Function to update the profile
     * @param updates - The updates to apply to the profile
     * @returns {Promise<{error: ErrorType | null}>}
     * */
    const updateProfile = async (updates: { full_name?: string; emoji?: string }): Promise<{
        error: ErrorType | null
    }> => {
        if (!user) {
            logEvent("Profile update failed: No authenticated user");
            return {error: new Error("User is not authenticated")};
        }

        logEvent("Profile update attempt", {
            userId: user.id,
            updatingName: !!updates.full_name,
            updatingEmoji: !!updates.emoji,
        });

        try {
            // Create an object with updates for the profile
            const profileUpdates: {
                full_name?: string;
                emoji?: string;
            } = {};
            if (updates.full_name !== undefined) {
                profileUpdates.full_name = updates.full_name;
            }
            if (updates.emoji !== undefined) {
                profileUpdates.emoji = updates.emoji;
            }

            logEvent("Updating profile in database", {
                fields: Object.keys(profileUpdates),
            });

            // Update the profile in the database
            const {error} = await supabase
                .from("profiles")
                .update(profileUpdates)
                .eq("id", user.id);

            if (error) {
                logEvent("Profile database update failed", {error: error.message, code: error.code});
                return {error};
            }

            logEvent("Profile database update successful");

            // Update the local profile state
            if (profile) {
                const newProfile = {
                    ...profile,
                    ...profileUpdates,
                };

                setProfile(newProfile);
                logEvent("Local profile state updated", {
                    newName: !!newProfile.full_name,
                    newEmoji: newProfile.emoji,
                });
            }

            return {error: null};
        } catch (e) {
            const error = e as Error;
            logEvent("Exception during profile update", {error: error.message});
            return {error};
        }
    };

    // Monitoring the user and profile state for additional logging
    useEffect(() => {
        logEvent("Auth state updated", {
            isAuthenticated: !!user,
            hasProfile: !!profile,
            isLoading,
            sessionExists: !!session,
        });
    }, [user, profile, isLoading, session]);

    /**
     * Function to send a password reset email with OTP
     * @param email - The email address to send the reset code to
     * @returns {Promise<{error: ErrorType | null}>}
     */
    const resetPassword = async (email: string): Promise<{ error: ErrorType | null }> => {
        logEvent("Password reset attempt", {email: email.substring(0, 3) + "***"});

        try {
            // Since we don't have deeplinking, we'll use OTP (one-time password) option
            const {error} = await supabase.auth.resetPasswordForEmail(email);

            if (error) {
                logEvent("Password reset failed", {error: error.message, code: error.code});
                return {error};
            }

            logEvent("Password reset email sent successfully");
            return {error: null};
        } catch (e) {
            const error = e as Error;
            logEvent("Exception during password reset", {error: error.message});
            return {error};
        }
    };

    /**
     * Function to verify a password reset code
     * @param email - The user's email
     * @param code - The verification code from the email
     * @returns {Promise<{error: ErrorType | null, session?: Session | null}>}
     */
    const verifyPasswordResetCode = async (email: string, code: string): Promise<{
        error: ErrorType | null,
        session?: Session | null
    }> => {
        logEvent("Verifying password reset code");

        try {
            const {data, error} = await supabase.auth.verifyOtp({
                email,
                token: code,
                type: "recovery",
            });

            if (error) {
                logEvent("Code verification failed", {error: error.message, code: error.code});
                return {error};
            }

            logEvent("Code verification successful", {
                hasSession: !!data.session,
                userId: data.user?.id,
            });

            // Set session and user if verification is successful
            if (data.session) {
                setSession(data.session);
                setUser(data.user);
            }

            return {error: null, session: data.session};
        } catch (e) {
            const error = e as Error;
            logEvent("Exception during code verification", {error: error.message});
            return {error};
        }
    };

    /**
     * Function to update the user's password
     * @param password - The new password
     * @returns {Promise<{error: ErrorType | null}>}
     */
    const updatePassword = async (password: string): Promise<{ error: ErrorType | null }> => {
        logEvent("Password update attempt");

        if (!session) {
            logEvent("Password update failed: No active session");
            return {error: new Error("No active session")};
        }

        try {
            const {error} = await supabase.auth.updateUser({
                password,
            });

            if (error) {
                logEvent("Password update failed", {error: error.message, code: error.code});
                return {error};
            }

            logEvent("Password updated successfully");
            return {error: null};
        } catch (e) {
            const error = e as Error;
            logEvent("Exception during password update", {error: error.message});
            return {error};
        }
    };


    // useEffect(() => {
    //     const envVars = Constants.expoConfig!.extra!;
    //     const googleAuthWebClientId = envVars["googleAuthWebClientId"]!
    //
    //     GoogleSignin.configure({
    //         webClientId: googleAuthWebClientId,
    //     });
    // }, []);

    const value = {
        user,
        session,
        profile,
        isLoading,
        signIn,
        // signInWithGoogle,
        signUp,
        signOut,
        updateProfile,
        resetPassword,
        updatePassword,
        verifyPasswordResetCode,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};