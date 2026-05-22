export const progress = (status) => {
  let text = "text-blue-700 bg-blue-100";
  if (status === "Close") text = "text-green-700 bg-green-100";
  else if (status === "In Progress") text = "text-red-600 bg-red-100";

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
    // 1. Strip all whitespaces, tabs, and newlines (\r, \n)
    let cleanedString = base64String.replace(/\s/g, "");

    // 2. Fix URL-safe base64 variations if they exist
    cleanedString = cleanedString.replace(/-/g, "+").replace(/_/g, "/");

    // 3. Add trailing padding if missing
    while (cleanedString.length % 4 !== 0) {
      cleanedString += "=";
    }

    // 4. Safely decode
    return atob(cleanedString);
  } catch (error) {
    console.error("Failed to decode SVG string:", error);
    return "";
  }
}
