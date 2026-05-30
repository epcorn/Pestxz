export const progress = (status) => {
  let text = "text-blue-700 bg-blue-100";
  if (status === "Close") text = "text-red-700 bg-red-100";
  else if (status === "In Progress") text = "text-yellow-600 bg-yellow-100";
  else if (status === "Reopen") text = "text-green-600 bg-green-100";
  else if (status === "Close Req") text = "text-amber-700 bg-amber-100";
  return text;
};
export const progressBlink = (status) => {
  let text = "bg-blue-700";
  if (status === "Close") text = "bg-red-700";
  else if (status === "In Progress") text = "bg-yellow-700";
  else if (status === "Reopen") text = "bg-green-600";
  else if (status === "Close Req") text = "bg-amber-700";
  return text;
};

export const positive = (res, id) => {
  let style;
  if (res.id === id && res.rating === true)
    style = `text-blue-600 active:scale-105`;
  else style = ``;

  return style;
};
export const nagative = (res, id) => {
  let style;
  if (res.id === id && res.rating === false)
    style = `text-red-600 active:scale-105`;
  else style = ``;

  return style;
};

export const dateFormat = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  // return `${date.split("T")[0]}, ${date.split("T")[1].slice(0, 5)}`;
  // const formattedDate = new Date(date).toLocaleString();
  // return formattedDate;
};

export function decodeBase64Svg(base64String) {
  if (!base64String) return "";

  try {
    let cleanedString = base64String.replace(/\s/g, "");
    cleanedString = cleanedString.replace(/-/g, "+").replace(/_/g, "/");
    while (cleanedString.length % 4 !== 0) {
      cleanedString += "=";
    }
    return atob(cleanedString);
  } catch (error) {
    console.error("Failed to decode SVG string:", error);
    return "";
  }
}

// DATE FORMAT → 01-Jun
export const formatShortDate = (date) => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[d.getMonth()];
  return `${day}-${month}`;
};

export function getWorkStatus(schedules) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const missed = schedules.filter((sc) => {
    if (sc.completed) return false;
    const scheduleDate = new Date(sc.date);
    scheduleDate.setHours(0, 0, 0, 0);
    return scheduleDate < today;
  });

  return missed;
}

export const frequencies = [
  "daily",
  "alternate days",
  "twice a week",
  "twice a week",
  "weekly",
  "fortnightly",
  "twice monthly",
  "thrice a month",
  "monthly",
  "alternate monthly",
  "quarterly",
  "half yearly",
  "once",
  "3 services once in 4 month",
  "2 services once in 6 month",
  "yearly",
];
