import Constants from "expo-constants";

import {getAccessToken} from "@/auth/supabase";
import {ACT_AS_HEADER, getActingStudentId} from "@/auth/actingStudent";
import {returnSuccessData} from "@/api/apiHelpers";

const logEvent = (event: string, details?: unknown) => {
    const timestamp = new Date().toISOString();
    console.log(`[API ${timestamp}] ${event}`);
    if (details) {
        console.log("[API Details]", JSON.stringify(details, null, 2));
    }
};

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export enum ApiErrorCode {
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    NOT_FOUND = "NOT_FOUND",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    SERVER_ERROR = "SERVER_ERROR",
    LARGE_IMAGE = "LARGE_IMAGE",
    REQUEST_ABORTED = "REQUEST_ABORTED",
    UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
}

export type ApiError = {
    code: ApiErrorCode | string;
    message: string;
    details?: unknown;
    statusCode?: number;
};

export type ApiResponse<T> = {
    success: true;
    data: T;
} | {
    success: false;
    error: ApiError;
};

export interface RequestConfig {
    path: string;
    method?: HttpMethod;
    headers?: Record<string, string>;
    queryParams?: Record<string, string | undefined>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any;
    responseType?: "json" | "blob" | "text" | "none";
    accessToken?: string | boolean;
    signal?: AbortSignal;
    skipSentryLogging?: boolean,
    retry?: {
        maxRetries: number;
        delayMs: number;
        retryableStatusCodes?: number[];
    };
}

export const getApiBaseUrl = (): string => {
    const envVars = Constants.expoConfig?.extra;
    if (!envVars?.["apiBaseUrl"]) {
        throw new Error("API base URL is not set");
    }
    return envVars["apiBaseUrl"];
};

const buildUrl = (path: string, queryParams?: Record<string, string | undefined>): string => {
    const baseUrl = getApiBaseUrl();

    if (!queryParams || Object.keys(queryParams).length === 0) {
        return `${baseUrl}${path}`;
    }

    const params = new URLSearchParams();

    Object.entries(queryParams)
        // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
        .filter(([_, value]) => value !== undefined && value !== "")
        .forEach(([key, value]) => {
            params.append(key, value as string);
        });

    const queryString = params.toString();
    return queryString ? `${baseUrl}${path}?${queryString}` : `${baseUrl}${path}`;
};

const processResponse = async <T>(response: Response, responseType: RequestConfig["responseType"]): Promise<ApiResponse<T>> => {
    if (response.status === 204 || response.headers.get("Content-Length") === "0") {
        return returnSuccessData(null as unknown as T);
    }

    const contentType = response.headers.get("Content-Type");
    if (responseType === "json" && contentType?.includes("application/json")) {
        const text = await response.text();
        if (!text || text.trim() === "") {
            return returnSuccessData(null as unknown as T);
        }

        try {
            const json = JSON.parse(text);
            return returnSuccessData(json);
        } catch (e) {
            console.error("JSON Parse error for response:", text);
            return returnSuccessData(null as unknown as T);
        }
    }

    switch (responseType) {
        case "json":
            try {
                return returnSuccessData(await response.json());
            } catch (e) {
                console.error("JSON Parse error:", e);
                return returnSuccessData(null as unknown as T);
            }
        case "blob":
            return returnSuccessData(await response.blob());
        case "text":
            return returnSuccessData(await response.text());
        case "none":
            return returnSuccessData(undefined);
        default:
            try {
                return returnSuccessData(await response.json());
            } catch (e) {
                console.error("Default JSON Parse error:", e);
                return returnSuccessData(null as unknown as T);
            }
    }
};

const defaultErrorHandler = async (response: Response, responseType: RequestConfig["responseType"]): Promise<ApiError> => {
    let errorCode: ApiErrorCode | string = `HTTP_${response.status}`;
    let errorMessage = response.statusText;
    let errorDetails: unknown;

    if (response.status === 401) {
        errorCode = ApiErrorCode.UNAUTHORIZED;
    } else if (response.status === 403) {
        errorCode = ApiErrorCode.FORBIDDEN;
    } else if (response.status === 404) {
        errorCode = ApiErrorCode.NOT_FOUND;
    } else if (response.status === 413) {
        errorCode = ApiErrorCode.LARGE_IMAGE;
        errorMessage = "The image size is too large";
    } else if (response.status >= 400 && response.status < 500) {
        errorCode = ApiErrorCode.VALIDATION_ERROR;
    } else if (response.status >= 500) {
        errorCode = ApiErrorCode.SERVER_ERROR;
    }

    if (responseType === "json") {
        try {
            const errorData = await response.json();
            errorDetails = errorData;

            const errorFields = ["error", "message", "detail", "errorMessage", "description"];
            for (const field of errorFields) {
                if (errorData[field]) {
                    errorMessage = Array.isArray(errorData[field])
                        ? errorData[field][0]
                        : errorData[field];
                    break;
                }
            }

            if (errorData.code && typeof errorData.code === "string") {
                errorCode = errorData.code;
            }
        } catch {
            try {
                const textError = await response.text();
                errorMessage = textError || errorMessage;
            } catch {
                /* empty */
            }
        }
    }

    return {
        code: errorCode,
        message: errorMessage,
        details: errorDetails,
        statusCode: response.status,
    };
};

const createErrorFromException = (err: unknown, config: RequestConfig): ApiError => {
    let code = ApiErrorCode.UNEXPECTED_ERROR;
    let message = "Unexpected error";

    if (err instanceof Error) {
        if (err.name === "AbortError") {
            code = ApiErrorCode.REQUEST_ABORTED;
            message = "Request was cancelled";
        } else {
            message = `Unexpected error: ${err.message}`;
        }
    }

    logEvent(`Caught error : ${config.method || "GET"} ${config.path}`, {
        code,
        message,
        details: err,
    });

    return {
        code,
        message,
        details: err,
    };
};

const handleErrorResponse = async <T>(response: Response, requestUrl: string, config: RequestConfig): Promise<ApiResponse<T>> => {
    const error = await defaultErrorHandler(response, config.responseType);

    logEvent(`Error : ${config.method || "GET"} ${config.path}`, error);

    return {
        success: false,
        error,
    };
};

const executeRequest = async <T>(requestFn: () => Promise<Response>, requestUrl: string, config: RequestConfig): Promise<ApiResponse<T>> => {
    const response = await requestFn();

    if (!response.ok) {
        return handleErrorResponse(response, requestUrl, config);
    }

    logEvent(`Success : ${config.method || "GET"} ${config.path}`);
    return processResponse<T>(response, config.responseType);
};

const executeRequestWithRetry = async <T>(requestFn: () => Promise<Response>, requestUrl: string, config: RequestConfig): Promise<ApiResponse<T>> => {
    if (!config.retry) {
        return executeRequest(requestFn, requestUrl, config);
    }

    const {maxRetries, delayMs, retryableStatusCodes = [408, 429, 500, 502, 503, 504]} = config.retry;
    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await requestFn();

            if (response.ok) {
                if (attempt > 0) {
                    logEvent(`Success after ${attempt} retries: ${config.method || "GET"} ${config.path}`);
                } else {
                    logEvent(`Success : ${config.method || "GET"} ${config.path}`);
                }
                return processResponse<T>(response, config.responseType);
            }

            if (attempt < maxRetries && retryableStatusCodes.includes(response.status)) {
                lastError = await defaultErrorHandler(response, config.responseType);

                await new Promise(resolve => setTimeout(resolve, delayMs));
                continue;
            }

            return handleErrorResponse(response, requestUrl, config);
        } catch (err) {
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
                continue;
            }

            const error = createErrorFromException(err, config);

            return {
                success: false,
                error,
            };
        }
    }

    return {
        success: false,
        error: lastError || {
            code: ApiErrorCode.UNEXPECTED_ERROR,
            message: "Max retries reached",
        },
    };
};

const apiRequest = async <T>(config: RequestConfig): Promise<ApiResponse<T>> => {
    const {
        path,
        method = "GET",
        headers = {},
        queryParams = {},
        body,
        responseType = "json",
        accessToken = true,
        signal,
    } = config;

    const url = buildUrl(path, queryParams);

    try {
        const requestHeaders: Record<string, string> = {...headers};

        if (accessToken) {
            const authToken = typeof accessToken === "string"
                ? accessToken
                : await getAccessToken();

            if (!authToken) {
                console.log("[API DEBUG] ⚠️ No auth token available! Request to:", path, "will fail with 403");
                const error = {
                    code: ApiErrorCode.UNAUTHORIZED,
                    message: "Access token is not set",
                    statusCode: 401,
                };

                return {
                    success: false,
                    error,
                };
            }

            requestHeaders["Authorization"] = `Bearer ${authToken}`;
            // Режим учня на телефоні вчителя (локальний учень без акаунта).
            const actingStudentId = getActingStudentId();
            if (actingStudentId !== null) {
                requestHeaders[ACT_AS_HEADER] = actingStudentId.toString();
            }
            console.log("[API DEBUG] ✅ Token set for:", path, "| length:", authToken.length);
        } else {
            console.log("[API DEBUG] accessToken=false for:", path);
        }

        if (responseType === "json" && !requestHeaders["Content-Type"] && !(body instanceof FormData)) {
            requestHeaders["Content-Type"] = "application/json";
        }

        const requestOptions: RequestInit = {
            method,
            headers: requestHeaders,
            cache: "no-store",
        };

        if (body) {
            requestOptions.body = body instanceof FormData
                ? body
                : (typeof body === "string" ? body : JSON.stringify(body));
        }

        if (signal) {
            requestOptions.signal = signal;
        }

        return await executeRequestWithRetry<T>(() => fetch(url, requestOptions), url, config);
    } catch (err) {
        const error = createErrorFromException(err, config);

        return {
            success: false,
            error,
        };
    }
}

export default apiRequest;