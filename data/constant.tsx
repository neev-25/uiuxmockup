import { useMemo } from "react";
import { themeToCssVars } from "./Themes";

export const suggestions = [
  {
    icon: "✈️",
    name: "Travel Planner App",
    description:
      "Trip planning dashboard with maps, itineraries, and booking cards. Clean modern layout with soft colors.",
  },
  {
    icon: "🤖",
    name: "AI Learning Platform",
    description:
      "Gamified learning experience with progress steps and streaks. Friendly, engaging, and colorful UI.",
  },
  {
    icon: "💰",
    name: "Finance Tracker",
    description:
      "Expense tracking dashboard with charts and budget goals. Minimal UI with dark mode support.",
  },
  {
    icon: "🛒",
    name: "E-Commerce Store",
    description:
      "Product browsing and checkout experience. Premium UI with strong call-to-action design.",
  },
  {
    icon: "📋",
    name: "Smart To-Do Planner",
    description:
      "Task management with calendar and priority views. Simple productivity-focused interface.",
  },
  {
    icon: "🍔",
    name: "Food Delivery App",
    description:
      "Restaurant listings and fast ordering flow. Bright visuals with large food images.",
  },
  {
    icon: "🧸",
    name: "Kids Learning App",
    description:
      "Interactive learning app for kids with rewards. Colorful UI and playful illustrations.",
  },
];



export const HTMLWrapper=(theme:any,htmlCode:string)=>{
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>

  <style>
    ${themeToCssVars(theme)}
  </style>
</head>

<body class="bg-[var(--background)] text-[var(--foreground)] w-full">
  ${htmlCode ?? ""}
</body>
</html>
`
}