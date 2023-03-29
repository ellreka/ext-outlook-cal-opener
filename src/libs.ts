import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const userTimezone = dayjs.tz.guess();

dayjs.tz.setDefault(userTimezone);

export { dayjs };
