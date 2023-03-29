import { Client } from "@microsoft/microsoft-graph-client";
import { Event } from "@microsoft/microsoft-graph-types";
import { dayjs } from "./libs";
import {
  ALARMS_TYPES,
  MESSAGE_TYPES,
  MyEvent,
  SendMessage,
  STORAGE_KEYS,
} from "./types";
import { clearEvents, getEvent, setEvents } from "./utils";
import browser from "webextension-polyfill";
import { config } from "./config";
import { getToken, signOut } from "./auth";

const getCalendarEvents = async () => {
  const token = await getToken();
  if (token == null) throw new Error("Token is null");
  const client = Client.init({
    authProvider: (done) => {
      done(null, token);
    },
  });

  const now = dayjs().tz();
  const startDateTime = now.startOf("day").toISOString();
  const endDateTime = now.endOf("day").toISOString();
  const query = new URLSearchParams({
    startDateTime,
    endDateTime,
  });
  const url = `/me/calendarview?${query.toString()}`;
  const response = await client
    .api(url)
    .get()
    .catch((e) => {
      console.error(e);
    });
  const value = response.value as Event[];
  const events: MyEvent[] = value
    .filter((event) => {
      if (event.isCancelled) return false;
      if (event.isAllDay) return false;
      return true;
    })
    .map((event, i) => {
      return {
        id: event.id ?? String(i),
        subject: event.subject ?? "",
        start: dayjs.utc(event.start?.dateTime).tz().toISOString(),
        end: dayjs.utc(event.end?.dateTime).tz().toISOString(),
        meetingUrl: event.onlineMeeting?.joinUrl ?? undefined,
      };
    })
    .sort((a, b) => {
      return dayjs(a.start).isBefore(dayjs(b.start)) ? -1 : 1;
    });
  return events;
};

const updateEvents = async () => {
  const events = await getCalendarEvents();
  await setEvents(events);
  for (const event of events) {
    const alarm = await browser.alarms.get(event.id);

    // Alarmがない場合は作成する
    if (alarm == null) {
      if (event?.meetingUrl == null) continue;
      // 過去のイベントは無視する
      if (dayjs(event.start).isAfter(dayjs())) {
        browser.alarms.create(event.id, {
          when: dayjs(event.start).valueOf() - config.offset,
        });
      }
      // Alarmがある場合は時間が変わっていたら更新する
    } else if (
      alarm.scheduledTime + config.offset !==
      dayjs(event.start).valueOf()
    ) {
      await browser.alarms.clear(event.id);
      browser.alarms.create(event.id, {
        when: dayjs(event.start).valueOf() - config.offset,
      });
    } else {
      // No Change
    }
  }
  return events;
};

browser.alarms.onAlarm.addListener(async (alarm) => {
  switch (alarm.name) {
    case ALARMS_TYPES.UPDATE_EVENTS:
      console.log(alarm);
      await updateEvents();
      break;
    default:
      const event = await getEvent(alarm.name);
      if (event?.meetingUrl) {
        await browser.tabs.create({ url: event.meetingUrl });
      }
      break;
  }
});

browser.runtime.onMessage.addListener(async (message: SendMessage, sender) => {
  switch (message.type) {
    case MESSAGE_TYPES.SIGN_IN:
      return await updateEvents();
    case MESSAGE_TYPES.SIGN_OUT:
      await signOut();
      await browser.storage.local.remove([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.EVENTS,
        STORAGE_KEYS.CODE_VERIFIER,
      ]);
      await browser.alarms.clearAll();
      break;
    case MESSAGE_TYPES.REFRESH_EVENTS:
      return await updateEvents();
    default:
      break;
  }
});

browser.runtime.onInstalled.addListener(async () => {
  await browser.alarms.clearAll();
  await clearEvents();
});

const init = async () => {
  const token = await getToken();
  if (token != null) {
    await updateEvents();
  }
  browser.alarms.create(ALARMS_TYPES.UPDATE_EVENTS, {
    periodInMinutes: 5,
  });
};

init();
