import { Event } from "@microsoft/microsoft-graph-types";

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
