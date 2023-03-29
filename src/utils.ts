import browser from "webextension-polyfill";
import { MyEvent, STORAGE_KEYS } from "./types";

export const getEvents = async () => {
  const result = await browser.storage.local.get(STORAGE_KEYS.EVENTS);
  return (result[STORAGE_KEYS.EVENTS] ?? []) as MyEvent[];
};

export const getEvent = async (id: string) => {
  const events = await getEvents();
  return events.find((event) => event.id === id);
};

export const setEvents = async (events: MyEvent[]) => {
  await browser.storage.local.set({ [STORAGE_KEYS.EVENTS]: events });
};

export const clearEvents = async () => {
  await browser.storage.local.remove(STORAGE_KEYS.EVENTS);
};
