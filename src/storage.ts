import browser from "webextension-polyfill";
import { Config, GetTokenResponse, MyEvent, STORAGE_KEYS } from "./types";

export const storages = {
  async getToken() {
    const res = await browser.storage.local.get(STORAGE_KEYS.TOKEN);
    return res?.[STORAGE_KEYS.TOKEN] as GetTokenResponse | undefined;
  },
  async setToken(token: GetTokenResponse | undefined) {
    const now = Date.now();
    const expiresAt = now + (token?.expires_in ?? 0) * 1000;
    await browser.storage.local.set({
      [STORAGE_KEYS.TOKEN]: token
        ? { ...token, expires_at: expiresAt }
        : undefined,
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
  async getEvent(id: string) {
    const events = await storages.getEvents();
    return events?.find((event) => event.id === id);
  },
  async setEvents(events: MyEvent[]) {
    await browser.storage.local.set({ [STORAGE_KEYS.EVENTS]: events });
  },
  async clearEvents() {
    await browser.storage.local.remove(STORAGE_KEYS.EVENTS);
  },
  async getConfig() {
    const res = await browser.storage.local.get(STORAGE_KEYS.CONFIG);
    return res?.[STORAGE_KEYS.CONFIG] as Config | undefined;
  },
  async setConfig(config: Config) {
    await browser.storage.local.set({ [STORAGE_KEYS.CONFIG]: config });
  },
};
