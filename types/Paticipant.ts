export type UserRole = "TEACHER" | "STUDENT";

export type Participant = {
    id: number;
    subId: string;
    name: string;
    userId: string;
    role: UserRole;
    classroomId: number | null;
    classroomName: string | null;
}
