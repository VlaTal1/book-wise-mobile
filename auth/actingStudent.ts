// Режим учня на телефоні вчителя: запити йдуть з токеном вчителя, але від
// імені локального учня (заголовок X-Act-As-Participant, бекенд перевіряє,
// що це вчитель класу цього учня). Зберігається лише в пам'яті — після
// перезапуску застосунок відкривається у звичайному режимі вчителя.
import {getAccessToken} from "@/auth/supabase";

export const ACT_AS_HEADER = "X-Act-As-Participant";

let actingStudentId: number | null = null;

export const getActingStudentId = () => actingStudentId;

export const setActingStudentId = (id: number | null) => {
    actingStudentId = id;
};

// Заголовки для запитів, що йдуть повз apiRequest (завантаження PDF, аудіо).
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const token = await getAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    if (actingStudentId !== null) {
        headers[ACT_AS_HEADER] = actingStudentId.toString();
    }
    return headers;
};
