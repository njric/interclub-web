import { blue, green, purple, orange, pink, teal, deepOrange, indigo, cyan, lime, amber, brown, blueGrey } from '@mui/material/colors';

// Create a wider range of distinct colors
const colorPalette = [
  blue[500],
  green[500],
  purple[500],
  orange[500],
  pink[500],
  teal[500],
  deepOrange[500],
  indigo[500],
  cyan[500],
  lime[600], // Using 600 for better contrast
  amber[600],
  brown[500],
  blueGrey[500],
  blue[700],
  green[700],
  purple[700],
  orange[700],
  pink[700],
  teal[700],
  deepOrange[700],
];

// Map to store club-color assignments
const clubColorMap = new Map<string, string>();
let nextColorIndex = 0;

// Function to get a consistent and unique color for a club name
export const getClubColor = (clubName: string): string => {
  // If club already has a color, return it
  if (clubColorMap.has(clubName)) {
    return clubColorMap.get(clubName)!;
  }

  // Assign next available color
  const color = colorPalette[nextColorIndex % colorPalette.length];
  clubColorMap.set(clubName, color);
  nextColorIndex++;

  return color;
};
