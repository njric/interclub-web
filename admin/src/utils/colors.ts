import { blue, green, purple, orange, pink, teal, deepOrange, indigo, cyan, lime, amber, brown, blueGrey, red } from '@mui/material/colors';

// Simple hash function to generate a consistent number from a string
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Function to get a consistent and unique color for a club name
export const getClubColor = (club: string): string => {
  // Special case: MB FIGHT is always red (case insensitive)
  if (club.toLowerCase() === 'mb fight') {
    return red[700];
  }

  // Color palette for clubs (using Material-UI colors at shade 700 for good contrast)
  const clubColors = [
    blue[700],
    green[700],
    purple[700],
    orange[700],
    pink[700],
    teal[700],
    deepOrange[700],
    indigo[700],
    cyan[700],
    lime[800],      // Darker shade for better readability
    amber[800],     // Darker shade for better readability
    brown[700],
    blueGrey[700],
  ];

  // Generate a consistent color index based on club name
  const colorIndex = hashString(club) % clubColors.length;
  return clubColors[colorIndex];
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
