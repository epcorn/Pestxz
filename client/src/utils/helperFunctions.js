export const progress = (status) => {
  let text = "text-blue-700 bg-blue-100";
  if (status === "Close") text = "text-green-700 bg-green-100";
  else if (status === "In Progress") text = "text-red-600 bg-red-100";

  return text;
};

export const dateFormat = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
};
