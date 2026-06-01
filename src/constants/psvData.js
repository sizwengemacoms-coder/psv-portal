// src/constants/psvData.js

export const INITIAL_JOBS = [
  { postNo: "15/01", title: "Senior Agricultural Economist", ref: "3/3/1/27/2026", department: "Department of Agriculture", annexure: "A", salary: "R605 742 per annum", level: "Level 10", centre: "Gauteng: Pretoria", closing: "22 May 2026", circular: 15, category: "Economics", enquiries: "Mr S Mazibuko Tel No: (012) 319 8189", requirements: "Grade 12 + 4-year Bachelor's in Agricultural Economics. Minimum 3 years supervisory experience in agricultural trade/economic environment." },
  { postNo: "15/02", title: "ICT Systems Administrator", ref: "3/3/1/30/2026", department: "Department of Agriculture", annexure: "A", salary: "R444 036 per annum", level: "Level 09", centre: "Gauteng: Pretoria", closing: "22 May 2026", circular: 15, category: "IT & Technology", enquiries: "Ms T Nkosi Tel No: (012) 319 7241", requirements: "Grade 12 + 3-year Diploma/Degree in IT. A+ and N+ certifications. Minimum 3 years experience in ICT systems administration." },
  { postNo: "15/03", title: "Human Resources Manager", ref: "3/3/1/31/2026", department: "Department of Health", annexure: "B", salary: "R849 702 per annum", level: "Level 11", centre: "KwaZulu-Natal: Durban", closing: "22 May 2026", circular: 15, category: "Human Resources", enquiries: "Ms P Dlamini Tel No: (031) 560 2500", requirements: "Grade 12 + 3-year Degree in Human Resources or Public Administration. Minimum 5 years management experience." },
  { postNo: "15/04", title: "Finance Director", ref: "3/3/1/32/2026", department: "Department of Finance", annexure: "C", salary: "R1 162 200 per annum", level: "Level 13", centre: "Gauteng: Pretoria", closing: "22 May 2026", circular: 15, category: "Finance", enquiries: "Mr T Nkosi Tel No: (012) 315 5111", requirements: "Grade 12 + 3-year Degree in Finance/Accounting. CA(SA) advantageous. Minimum 8 years experience in financial management." },
  { postNo: "15/05", title: "Legal Advisor", ref: "3/3/1/33/2026", department: "Department of Justice", annexure: "D", salary: "R605 742 per annum", level: "Level 10", centre: "Western Cape: Cape Town", closing: "22 May 2026", circular: 15, category: "Legal", enquiries: "Adv. S Petersen Tel No: (021) 462 8081", requirements: "LLB degree. Minimum 3 years post-admission experience. Knowledge of public law and administrative law essential." },
  { postNo: "15/06", title: "Supply Chain Officer", ref: "3/3/1/34/2026", department: "Department of Public Works", annexure: "A", salary: "R308 154 per annum", level: "Level 07", centre: "Gauteng: Pretoria", closing: "22 May 2026", circular: 15, category: "Supply Chain", enquiries: "Ms R Molefe Tel No: (012) 492 3000", requirements: "Grade 12 + 3-year Diploma/Degree in Supply Chain Management or Logistics. Minimum 2 years relevant experience." },
  { postNo: "14/01", title: "Education Specialist", ref: "3/3/1/20/2026", department: "Department of Education", annexure: "A", salary: "R444 036 per annum", level: "Level 09", centre: "Eastern Cape: East London", closing: "8 May 2026", circular: 14, category: "Education", enquiries: "Mr B Ntuli Tel No: (043) 604 7700", requirements: "Grade 12 + 4-year Education degree. Minimum 3 years teaching or curriculum development experience." },
  { postNo: "14/02", title: "IT Business Analyst", ref: "3/3/1/21/2026", department: "Department of Communications", annexure: "B", salary: "R605 742 per annum", level: "Level 10", centre: "Gauteng: Pretoria", closing: "8 May 2026", circular: 14, category: "IT & Technology", enquiries: "Ms L van der Berg Tel No: (012) 427 8000", requirements: "Grade 12 + 3-year Degree in IT or Business Analysis. Minimum 3 years experience in business analysis or systems analysis." },
];

export const INITIAL_ADS = [
  { id: 1, title: "Advance Your Career", subtitle: "UCT Online Short Courses — accredited, flexible", cta: "Explore courses", color: "#0A2540", position: "sidebar", image: null },
  { id: 2, title: "Download Form Z83", subtitle: "Official application form, always current", cta: "Download free", color: "#1B4332", position: "banner", image: null },
];

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
