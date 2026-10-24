const DAY_MS = 24 * 60 * 60 * 1000;

const toDateString = (date) => date.toISOString().slice(0, 10);

// Returns the Monday and Sunday (YYYY-MM-DD) of an ISO week, or null if that week does not exist in the year.
const getIsoWeekRange = (year, week) => {
  // January 4th always belongs to ISO week 1.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Weekday = jan4.getUTCDay() || 7; // Monday = 1 ... Sunday = 7
  const monday = new Date(jan4.getTime() + ((week - 1) * 7 - (jan4Weekday - 1)) * DAY_MS);

  // An ISO week belongs to the year that contains its Thursday (e.g. week 53 does not exist in every year).
  const thursday = new Date(monday.getTime() + 3 * DAY_MS);
  if (thursday.getUTCFullYear() !== year) return null;

  const sunday = new Date(monday.getTime() + 6 * DAY_MS);
  return { startDate: toDateString(monday), endDate: toDateString(sunday) };
};

module.exports = { getIsoWeekRange };
