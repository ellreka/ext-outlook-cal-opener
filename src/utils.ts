import browser from "webextension-polyfill";
import { MyEvent, STORAGE_KEYS } from "./types";
import { Event } from "@microsoft/microsoft-graph-types";

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

const extractMeetingUrl = (text: string | undefined): string | undefined => {
  if (text) {
    const googleMeetPattern = /https?:\/\/meet.google.com\/\w+\-\w+\-\w+/;

    const patterns = [googleMeetPattern];

    for (const pattern of patterns) {
      const match = text.match(pattern)?.[0];
      return match;
    }
  }
  return undefined;
};

export const getMeetingUrl = (event: Event) => {
  const { bodyPreview, location, onlineMeeting } = event;

  const meetUrlFromLocation = extractMeetingUrl(
    location?.displayName ?? undefined
  );
  if (meetUrlFromLocation) return meetUrlFromLocation;

  if (onlineMeeting?.joinUrl) return onlineMeeting.joinUrl;

  const meetUrlFromBody = extractMeetingUrl(bodyPreview ?? undefined);
  if (meetUrlFromBody) return meetUrlFromBody;
};
