// src/constants/psvData.js

export const INITIAL_JOBS = [];

export const INITIAL_ADS = [];

export const CATEGORIES = ["All", "Administration", "Business Development", "Compliance", "Economics", "Education", "Finance", "Human Resources", "IT & Technology", "Legal", "Management", "Supply Chain"];
export const LEVELS = ["All Levels", "Level 05", "Level 07", "Level 09", "Level 10", "Level 11", "Level 13", "Level 14", "Level 15"];

export const LEVEL_COLORS = {
  "Level 05": { bg: "#F0F4FF", text: "#3D52A0" },
  "Level 07": { bg: "#F0F7FF", text: "#0369A1" },
  "Level 09": { bg: "#F0FDF4", text: "#166534" },
  "Level 10": { bg: "#FEFCE8", text: "#854D0E" },
  "Level 11": { bg: "#FFF7ED", text: "#9A3412" },
  "Level 13": { bg: "#FDF4FF", text: "#7E22CE" },
  "Level 14": { bg: "#FFF1F2", text: "#9F1239" },
  "Level 15": { bg: "#1C1C1E", text: "#FFFFFF" },
};

export const getLevelStyle = (level) => LEVEL_COLORS[level] || { bg: "#F3F4F6", text: "#374151" };
