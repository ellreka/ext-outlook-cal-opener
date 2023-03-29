import { h, render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { dayjs } from "./libs";
import { MESSAGE_TYPES, MyEvent, SendMessage } from "./types";
import { getEvents } from "./utils";
import { getToken } from "./auth";
import browser from "webextension-polyfill";

const Popup = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [events, setEvents] = useState<MyEvent[]>([]);
  const onSignIn = async () => {
    const ev = await browser.runtime.sendMessage({
      type: MESSAGE_TYPES.SIGN_IN,
    });
    setEvents(ev);
    setIsLogin(true);
  };

  const onSignOut = async () => {
    await browser.runtime.sendMessage({
      type: MESSAGE_TYPES.SIGN_OUT,
    });
    setIsLogin(false);
    setEvents([]);
  };

  const refreshEvents = async () => {
    const ev = await browser.runtime.sendMessage({
      type: MESSAGE_TYPES.REFRESH_EVENTS,
    });
    setEvents(ev);
  };

  useEffect(() => {
    (async () => {
      const token = await getToken(false);
      if (token) {
        setIsLogin(true);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const ev = await getEvents();
      setEvents(ev);
    })();
  }, []);

  return (
    <div className="relative w-[480px] px-3 bg-slate-800">
      <div className="flex items-center justify-end">
        <a
          className="btn btn-link"
          href="https://github.com/ellreka/ext-outlook-cal-opener"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        {isLogin ? (
          <div>
            <button className="btn btn-link" onClick={refreshEvents}>
              Update
            </button>
            <button className="btn btn-link" onClick={onSignOut}>
              sign out
            </button>
          </div>
        ) : (
          <div>
            <button className="btn btn-link" onClick={onSignIn}>
              sign in
            </button>
          </div>
        )}
      </div>
      <p className="text-base font-bold inline-block">
        {dayjs().format("MM/DD")}
      </p>
      {events?.length <= 0 && (
        <p className="text-center text-base mt-3">Today, you have no events.</p>
      )}
      <ul class="flex flex-col gap-2 py-3">
        {events.map((event) => {
          const start = dayjs(event.start).format("HH:mm");
          const end = dayjs(event.end).format("HH:mm");
          return (
            <li
              key={event.id}
              className="border-l-4 border-primary px-2 py-2 flex gap-3 items-start justify-between"
            >
              <div>
                <div>
                  <time dateTime={start}>{start}</time>
                  <span>~</span>
                  <time dateTime={end}>{end}</time>
                </div>
                <h2 className="text-sm">{event.subject}</h2>
              </div>
              {event.meetingUrl && (
                <a
                  href={event.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-circle"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                    />
                  </svg>
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

render(<Popup />, document.body);
