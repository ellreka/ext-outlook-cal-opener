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
import { getMeetingUrl } from "./utils";
import browser from "webextension-polyfill";
import { config } from "./config";
import { getToken, refreshToken, signOut } from "./auth";
import { storages } from "./storage";

const getCalendarEvents = async (token: string) => {
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
      const meetingUrl = getMeetingUrl(event);
      return {
        id: event.id ?? String(i),
        subject: event.subject ?? "",
        start: dayjs.utc(event.start?.dateTime).tz().format(),
        end: dayjs.utc(event.end?.dateTime).tz().format(),
        meetingUrl,
      };
    })
    .sort((a, b) => {
      return dayjs(a.start).isBefore(dayjs(b.start)) ? -1 : 1;
    });
  return events;
};

const updateEvents = async (token: string) => {
  const events = await getCalendarEvents(token);
  await storages.setEvents(events);
  for (const event of events) {
    const alarm = await browser.alarms.get(event.id);
    // Alarmがない場合は作成する
    if (alarm == null) {
      if (event?.meetingUrl == null) continue;
      // 過去のイベントは無視する
      if (dayjs(event.start).subtract(config.offset, "ms").isAfter(dayjs())) {
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
  const alarms = await browser.alarms.getAll();
  console.table(alarms);
  switch (alarm.name) {
    case ALARMS_TYPES.UPDATE_EVENTS:
      const token = await refreshToken();
      if (token?.access_token != null) {
        await updateEvents(token.access_token);
      }
      break;
    default: {
      const event = await storages.getEvent(alarm.name);
      await browser.alarms.clear(alarm.name);
      if (event?.meetingUrl) {
        // 既に開いていたらupdateする
        const tabs = await browser.tabs.query({
          url: event.meetingUrl,
        });
        if (tabs.length > 0) {
          await browser.tabs.update(tabs[0].id, { active: true });
        } else {
          await browser.tabs.create({ url: event.meetingUrl });
        }
        break;
      }
      break;
    }
  }
});

browser.runtime.onMessage.addListener(async (message: SendMessage, sender) => {
  switch (message.type) {
    case MESSAGE_TYPES.SIGN_IN: {
      const token = await getToken(true);
      if (token?.access_token != null) {
        return await updateEvents(token.access_token);
      }
      return;
    }
    case MESSAGE_TYPES.SIGN_OUT: {
      await browser.storage.local.remove([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.EVENTS,
        STORAGE_KEYS.CODE_VERIFIER,
      ]);
      await browser.alarms.clearAll();
      await signOut();
      break;
    }
    case MESSAGE_TYPES.REFRESH_EVENTS: {
      const token = await refreshToken();
      if (token?.access_token != null) {
        return await updateEvents(token.access_token);
      }
      return;
    }
    default: {
      break;
    }
  }
});

browser.runtime.onInstalled.addListener(async () => {
  await browser.alarms.clearAll();
  await storages.clearEvents();
});

const init = async () => {
  const token = await getToken(false);
  if (token?.access_token != null) {
    await updateEvents(token?.access_token);
  }
  browser.alarms.create(ALARMS_TYPES.UPDATE_EVENTS, {
    periodInMinutes: 1,
  });
};

init();
