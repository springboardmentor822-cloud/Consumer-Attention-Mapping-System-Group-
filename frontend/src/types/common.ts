export interface ApiErrorPayload {
  detail?: string | { loc?: Array<string | number>; msg?: string }[];
}

export interface SelectOption<T extends string = string> {
  label: string;
  value: T;
}
