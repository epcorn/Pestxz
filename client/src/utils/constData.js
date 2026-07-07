export const types = [
  { label: "Service", value: "Service" },
  { label: "Product", value: "Product" },
];

export const operatorComment = [
  { label: "All job done", value: "All job done" },
  { label: "Job not completed", value: "Job not completed" },
  { label: "Room was closed", value: "Room was close" },
  { label: "Guest were present", value: "Guest were present" },
];

export const jobStatus = [
  { label: "In Progress", value: "In Progress" },
  { label: "Close Req", value: "Close Req" },
];
export const clientAdminStatus = [
  { label: "Close", value: "Close" },
  { label: "Reopen", value: "Reopen" },
];

export const serviceActions = [
  { label: "Gel", value: "Gel" },
  { label: "Spray", value: "Spray" },
  { label: "Gel & Spray", value: "Gel & Spray" },
  { label: "New Trap Placed", value: "New Trap Placed" },
  { label: "Trap Replaced", value: "Trap Replaced" },
];

export const pestRoles = [
  { label: "BranchAdmin", value: "BranchAdmin" },
  { label: "TeamLeader", value: "TeamLeader" },
  { label: "Supervisor", value: "Supervisor" },
  { label: "Operator", value: "Operator" },
];

export const clientRoles = [
  { label: "ClientAdmin", value: "ClientAdmin" },
  { label: "ClientEmployee", value: "ClientEmployee" },
];

export const endDateList = [
  { label: "1 Month (30 Days)", value: "1" },
  { label: "2 Months (60 Days)", value: "2" },
  { label: "3 Months (90 Days)", value: "3" },
  { label: "4 Months (120 Days)", value: "4" },
  { label: "5 Months (150 Days)", value: "5" },
  { label: "6 Months (180 Days)", value: "6" },
  { label: "7 Months (210 Days)", value: "7" },
  { label: "8 Months (240 Days)", value: "8" },
  { label: "9 Months (270 Days)", value: "9" },
  { label: "10 Months (300 Days)", value: "10" },
  { label: "11 Months (330 Days)", value: "11" },
  { label: "1 Year", value: "12" },
  { label: "2 Year", value: "24" },
  { label: "3 Year", value: "36" },
  { label: "4 Year", value: "48" },
  { label: "5 Year", value: "60" },
];

export const timeList = [
  { value: "10 am - 12 pm", label: "10 am - 12 pm" },
  { value: "11 am - 1 pm", label: "11 am - 1 pm" },
  { value: "12 pm - 2 pm", label: "12 pm - 2 pm" },
  { value: "2 pm - 4 pm", label: "2 pm - 4 pm" },
  { value: "4 pm - 6 pm", label: "4 pm - 6 pm" },
  { value: "6 pm - 8 pm", label: "6 pm - 8 pm" },
  { value: "Night", label: "Night" },
  { value: "Anytime", label: "Anytime" },
];

export const productCalibrationMapping = {
  "Glue Board": "Replaced",
  GlueBoard: "Replaced",
  Bait: "Refilled",
  "Bait-1": "Refilled",
  "Dead Rat Found": "Found",
  "Liquid Refill": "Refilled",
  "Spray Refill": "Refilled",
  Tubelight: "Need Replacement",
  "LED Box": "Need Replacement",
  TubeLight: "Need Replacement",
  CFL: "Need Replacement",
  "Snapper Sheet": "Need Replacement",
  "Vaporiser Bag": "Need Replacement",
  "Battery Replace": "Need Replacement",
  "Bettary Replace": "Need Replacement",
  "Bettery Replace": "Need Replacement",
  TrapSheet: "Need Replacement",
};
