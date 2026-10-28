import {useCallback, useEffect, useRef, useState} from "react";
import {Alert} from "react-native";
import {useRouter} from "expo-router";
import {AlertButton} from "react-native/Libraries/Alert/Alert";
import {ExpoRouter} from "expo-router/build/typed-routes/types";

import {ApiErrorCode, ApiResponse} from "@/api";
import i18n from "@/localization/i18n";

type ErrorHandler = {
    title: string;
    message: string;
    options?: {
        onDismiss?: () => void;
        navigate?: {
            mode: "replace" | "push" | "dismissTo";
            path: ExpoRouter.__routes["href"];
        } | {
            mode: "back";
        };
        cancel?: boolean;
        tryAgain?: boolean;
        customButtons?: AlertButton[];
    };
};

interface UseApiOptions<T, P> {
    onSuccess?: (data: T, params?: P) => void;
    onError?: (error: ApiResponse<T>) => void;
    errorHandler?: ErrorHandler | ((error: ApiResponse<T>) => ErrorHandler);
    loadingState?: boolean;
    setLoadingState?: (loading: boolean) => void;
    debounceTime?: number;
    revalidate?: boolean;
    onFinally?: () => void;
    abortOnUnmount?: boolean;
    onCancel?: () => void;
    cancelPreviousRequest?: boolean;
}

function useApi<T, P = void>(
    apiCall: (params: P) => Promise<ApiResponse<T>>,
    options: UseApiOptions<T, P> = {},
) {
    const router = useRouter();

    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<ApiResponse<T> | null>(null);
    const [loading, setLoading] = useState(false);

    // Reference to the current AbortController
    const abortControllerRef = useRef<AbortController | null>(null);

    // Cleanup function to cancel any pending requests when the component unmounts
    useEffect(() => {
        return () => {
            if (options.abortOnUnmount && abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        };
    }, [options.abortOnUnmount]);

    // Use provided loading state setter if available
    const setLoadingState = options.setLoadingState || setLoading;

    const handleError = useCallback(
        (errorResponse: ApiResponse<T>) => {
            setError(errorResponse);

            if (options.onError) {
                options.onError(errorResponse);
                return;
            }

            let errorHandler: ErrorHandler;
            if (typeof options.errorHandler === "function") {
                errorHandler = options.errorHandler(errorResponse);
            } else if (options.errorHandler) {
                errorHandler = options.errorHandler;
            } else {
                // Default error handler
                errorHandler = {
                    title: i18n.t("error"),
                    message: i18n.t("please_try_again_later"),
                };
            }

            const buttons: AlertButton[] = [];

            // Add "try again" button if requested
            if (errorHandler.options?.tryAgain) {
                buttons.push({
                    text: i18n.t("try_again"),
                    onPress: () => execute(lastParams as P),
                });
            }

            // Add custom buttons if provided
            if (errorHandler.options?.customButtons) {
                buttons.push(...errorHandler.options.customButtons);
            }

            // Add cancel button if none provided
            if (buttons.length === 0 || errorHandler.options?.cancel) {
                buttons.push({
                    text: i18n.t("ok"),
                    style: "cancel",
                    onPress: () => {
                        if (errorHandler.options?.navigate) {
                            switch (errorHandler.options.navigate.mode) {
                                case "back":
                                    router.back();
                                    break;
                                case "replace":
                                    router.replace(errorHandler.options.navigate.path);
                                    break;
                                case "dismissTo":
                                    router.dismissTo(errorHandler.options.navigate.path);
                                    break;
                                default:
                                    router.navigate(errorHandler.options.navigate.path);
                            }
                        } else if (errorHandler.options?.onDismiss) {
                            errorHandler.options.onDismiss();
                        }
                    },
                });
            }

            Alert.alert(errorHandler.title, errorHandler.message, buttons);
        },
        [options],
    );

    // Store last params to enable retry functionality
    let lastParams: P | undefined;

    // Create debounced function if needed
    let debouncedExecute: ((params: P) => void) | null = null;
    if (options.debounceTime && options.debounceTime > 0) {
        // eslint-disable-next-line react-hooks/rules-of-hooks,react-hooks/exhaustive-deps
        debouncedExecute = useCallback(
            debounce((params: P) => {
                execute(params);
            }, options.debounceTime),
            [apiCall],
        );
    }

    // Function to cancel the current request
    const cancelRequest = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    const execute = useCallback(
        async (params: P) => {
            // Cancel previous request if option is enabled
            if (options.cancelPreviousRequest) {
                cancelRequest();
            }

            // Create a new AbortController for this request
            const abortController = new AbortController();
            abortControllerRef.current = abortController;

            lastParams = params;

            try {
                setLoadingState(true);

                // Include the signal in the API call parameters if the original params is an object
                const paramsWithSignal = typeof params === "object" && params !== null
                    ? {...params as object, signal: abortController.signal} as P
                    : params;

                const response = await apiCall(paramsWithSignal);

                // If request was aborted, don't update state
                if (abortController.signal.aborted) {
                    if (options.onCancel) {
                        options.onCancel();
                    }
                    return;
                }

                if (response.success) {
                    setData(response.data);
                    if (options.onSuccess) {
                        options.onSuccess(response.data, params);
                    }
                } else {
                    if (response.error?.code === ApiErrorCode.REQUEST_ABORTED) {
                        return;
                    }
                    handleError(response);
                }
            } catch (err) {
                console.error("Unhandled error in API call:", err);
                handleError({
                    success: false,
                    error: {
                        code: "UNEXPECTED_ERROR",
                        message: err instanceof Error ? err.message : "Unexpected error",
                        details: err,
                    },
                } as ApiResponse<T>);
            } finally {
                // Clear the abortController reference if it's still the current one
                if (abortControllerRef.current === abortController) {
                    abortControllerRef.current = null;
                }

                setLoadingState(false);
                if (options.onFinally) {
                    options.onFinally();
                }
            }
        },
        [apiCall, handleError, options, setLoadingState, cancelRequest],
    );

    return {
        execute,
        executeDebouncedIfAvailable: debouncedExecute || execute,
        data,
        error,
        loading: options.loadingState !== undefined ? options.loadingState : loading,
        cancelRequest,
        reset: useCallback(() => {
            setData(null);
            setError(null);
            setLoading(false);
            cancelRequest();
        }, [cancelRequest]),
    };
}

// Utility function for debouncing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>): void => {
        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
}

export default useApi;