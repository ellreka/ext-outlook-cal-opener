export type MyEvent = {
  id: string;
  subject: string;
  start: string;
  end: string;
  meetingUrl: string | undefined;
};

export type SendMessage = {
  type: keyof typeof MESSAGE_TYPES;
};

export const ALARMS_TYPES = {
  UPDATE_EVENTS: "outlook-cal-opener-update",
} as const;

export const MESSAGE_TYPES = {
  REFRESH_EVENTS: "REFRESH_EVENTS",
  SIGN_IN: "SIGN_IN",
  SIGN_OUT: "SIGN_OUT",
} as const;

export const STORAGE_KEYS = {
  EVENTS: "outlook-cal-opener-events",
  TOKEN: "outlook-cal-opener-token",
  CODE_VERIFIER: "outlook-cal-opener-code-verifier",
  CONFIG: "outlook-cal-opener-config",
} as const;

export type GetTokenResponse = {
  access_token: string;
  expires_in: number;
  ext_expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
  expires_at: number; // 期限が切れる時間 current time + expires_in
};

export type Config = {
  offset: number;
};
