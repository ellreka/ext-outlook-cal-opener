import _dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

_dayjs.extend(utc);
_dayjs.extend(timezone);

const userTimezone = _dayjs.tz.guess();
_dayjs.tz.setDefault(userTimezone);

const dayjs = _dayjs;

export { dayjs };
