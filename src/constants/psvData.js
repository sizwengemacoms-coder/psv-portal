// src/constants/psvData.js

export const INITIAL_JOBS = [];
export const INITIAL_ADS  = [];

export const CATEGORIES = [
  "All", "Administration", "Business Development", "Compliance", "Economics",
  "Education", "Finance", "Human Resources", "IT & Technology", "Legal",
  "Management", "Supply Chain",
];

export const LEVELS = [
  "All Levels",
  "Level 02", "Level 03", "Level 04", "Level 05", "Level 06",
  "Level 07", "Level 08", "Level 09", "Level 10", "Level 11",
  "Level 12", "Level 13", "Level 14", "Level 15", "OSD",
];

export const LEVEL_COLORS = {
  "Level 02": { bg: "#F5F5F5", text: "#6B6B6B" },
  "Level 03": { bg: "#F5F5F5", text: "#6B6B6B" },
  "Level 04": { bg: "#F0F4FF", text: "#3D52A0" },
  "Level 05": { bg: "#F0F4FF", text: "#3D52A0" },
  "Level 06": { bg: "#E8F0FE", text: "#1A56DB" },
  "Level 07": { bg: "#F0F7FF", text: "#0369A1" },
  "Level 08": { bg: "#ECFDF5", text: "#065F46" },
  "Level 09": { bg: "#F0FDF4", text: "#166534" },
  "Level 10": { bg: "#FEFCE8", text: "#854D0E" },
  "Level 11": { bg: "#FFF7ED", text: "#9A3412" },
  "Level 12": { bg: "#FFF4E6", text: "#C2410C" },
  "Level 13": { bg: "#FDF4FF", text: "#7E22CE" },
  "Level 14": { bg: "#FFF1F2", text: "#9F1239" },
  "Level 15": { bg: "#1C1C1E", text: "#FFFFFF" },
  "OSD":      { bg: "#F0F9FF", text: "#0C4A6E" },
};

export const getLevelStyle = (level) =>
  LEVEL_COLORS[level] || { bg: "#F3F4F6", text: "#374151" };
