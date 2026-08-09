import api from "./client";

export interface Employee {
  id: number;
  store_id: number;
  full_name: string;
  role: string;
  phone: string | null;
  email: string | null;
  shift_start: string;
  shift_end: string;
  is_active: boolean;
  created_at: string;
}

export interface AttendanceRecord {
  employee_id: number;
  employee_name: string;
  role: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  // Populated automatically once a connected employee-identification
  // mechanism (or DEMO_ATTENDANCE) recognizes this employee on camera -
  // null until then. See the backend's employee_identification service.
  first_seen: string | null;
  last_seen: string | null;
  is_late: boolean;
  working_duration_seconds: number | null;
  source: string | null;
  shift_start: string;
  shift_end: string;
  status: string;
}

export interface AttendanceResponse {
  store_id: number;
  date: string;
  records: AttendanceRecord[];
  present_count: number;
  late_count: number;
  absent_count: number;
}

export const EMPLOYEE_ROLES = ["Cashier", "Floor Staff", "Security", "Manager"];

export interface EmployeePayload {
  store_id: number;
  full_name: string;
  role: string;
  phone: string | null;
  email: string | null;
  shift_start: string;
  shift_end: string;
  is_active: boolean;
}

export const employeesApi = {
  list: (storeId?: number) => api.get<Employee[]>("/employees", { params: storeId ? { store_id: storeId } : {} }),
  create: (payload: EmployeePayload) => api.post<Employee>("/employees", payload),
  update: (id: number, payload: Partial<EmployeePayload>) => api.put<Employee>(`/employees/${id}`, payload),
  remove: (id: number) => api.delete(`/employees/${id}`),
  checkIn: (id: number) => api.post(`/employees/${id}/check-in`),
  checkOut: (id: number) => api.post(`/employees/${id}/check-out`),
  attendance: (storeId?: number) =>
    api.get<AttendanceResponse>("/employees/attendance", { params: storeId ? { store_id: storeId } : {} }),
};
