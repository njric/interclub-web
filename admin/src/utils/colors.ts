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
export const getClubColor = (club: string): string => {
  // Add club-specific colors if needed
  return '#666666';
};

export const getFightTypeColor = (fightType: string): string => {
  switch (fightType) {
    case 'Boxing':
      return '#1976d2'; // Blue
    case 'Muay Thai':
      return '#d32f2f'; // Red
    case 'Grappling':
      return '#388e3c'; // Green
    case 'MMA':
      return '#7b1fa2'; // Purple
    default:
      return '#1976d2'; // Default blue
  }
};
