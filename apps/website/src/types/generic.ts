export type OmitUnknown<T> = Omit<T, "unknown">;
export type OmitNone<T> = Omit<T, "none">;
export type Allable<T> = T | "ALL";
export type Range = { min?: number, max?: number }
