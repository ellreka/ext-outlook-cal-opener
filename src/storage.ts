import browser from "webextension-polyfill";
import { GetTokenResponse, MyEvent, STORAGE_KEYS } from "./types";

export const storages = {
  async getToken() {
    const res = await browser.storage.local.get(STORAGE_KEYS.TOKEN);
    return res?.[STORAGE_KEYS.TOKEN] as GetTokenResponse | undefined;
  },
  async setToken(token: GetTokenResponse) {
    const now = Date.now();
    const expiresAt = now + (token?.expires_in ?? 0) * 1000;
    await browser.storage.local.set({
      [STORAGE_KEYS.TOKEN]: { ...token, expires_at: expiresAt },
    });
  },
  async getCodeVerifier() {
    const res = await browser.storage.local.get(STORAGE_KEYS.CODE_VERIFIER);
    return res?.[STORAGE_KEYS.CODE_VERIFIER] as string | undefined;
  },
  async setCodeVerifier(codeVerifier: string) {
    await browser.storage.local.set({
      [STORAGE_KEYS.CODE_VERIFIER]: codeVerifier,
    });
  },
  async getEvents() {
    const res = await browser.storage.local.get(STORAGE_KEYS.EVENTS);
    return res?.[STORAGE_KEYS.EVENTS] as MyEvent[] | undefined;
  },
  async setEvents(events: MyEvent[]) {
    await browser.storage.local.set({ [STORAGE_KEYS.EVENTS]: events });
  },
  async clearEvents() {
    await browser.storage.local.remove(STORAGE_KEYS.EVENTS);
  },
};
