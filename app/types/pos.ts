export interface POSRegister {
  id: number;
  name: string;
  session_id: number | null;
  session_state:
    | "opened"
    | "closed"
    | "opening_control"
    | "closing_control"
    | "unknown";
}
