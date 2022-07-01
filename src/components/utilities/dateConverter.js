import { formatDistanceToNow, isThisWeek, isToday } from "date-fns";

export const dateConverter = (date) => {
  const dateInfo = new Date(date);
  return formatDistanceToNow(dateInfo);
};
