import { blue, green, purple, orange, pink, teal, deepOrange, indigo, cyan, lime, amber, brown, blueGrey } from '@mui/material/colors';

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
