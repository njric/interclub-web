import { red } from '@mui/material/colors';

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

  // Use golden ratio angle (137.5°) for better color distribution
  // This ensures visually distinct colors even for similar hash values
  const hash = hashString(club);
  const goldenRatioAngle = 137.508; // Golden angle in degrees
  const hue = (hash * goldenRatioAngle) % 360;

  // Use fixed saturation and lightness for good contrast on white background
  // 65% saturation and 45% lightness gives vibrant, readable colors
  return `hsl(${hue}, 65%, 45%)`;
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
