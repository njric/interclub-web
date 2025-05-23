import React from 'react';
import { Typography, Box, Stack, useTheme, useMediaQuery, CircularProgress } from '@mui/material';
import { useFightContext } from '../../context/FightContext';
import FightCard from './FightCard';
import type { Fight } from '../../services/api';
import api from '../../services/api';

const CurrentFights: React.FC = () => {
  const { ongoingFight, readyFight } = useFightContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [nextFights, setNextFights] = React.useState<Fight[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadNextFights = async () => {
      try {
        setIsLoading(true);
        const fights = await api.getNextFights(100); // Get all upcoming fights
        // Filter out both the ready fight and ongoing fight
        const filteredFights = fights.filter(fight =>
          (!readyFight || fight.id !== readyFight.id) &&
          (!ongoingFight || fight.id !== ongoingFight.id)
        );
        setNextFights(filteredFights);
        setError(null);
      } catch (error) {
        console.error('Error loading next fights:', error);
        setError('Error loading next fights. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadNextFights();

    // Refresh every 30 seconds
    const interval = setInterval(loadNextFights, 30000);
    return () => clearInterval(interval);
  }, [readyFight, ongoingFight]);

  const SectionTitle: React.FC<{ title: string; highlight?: boolean }> = ({ title, highlight }) => (
    <Typography
      variant={isMobile ? "h6" : "h5"}
      gutterBottom
      sx={{
        borderBottom: highlight ? '2px solid #ff9a9e' : '1px solid #eee',
        pb: 1,
        mb: 2
      }}
    >
      {title}
    </Typography>
  );

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      {/* Ongoing Fight Section */}
      <Box mb={4}>
        <SectionTitle title="Ongoing Fight" highlight={true} />
        {ongoingFight ? (
          <FightCard fight={ongoingFight} showStatus />
        ) : (
          <Typography color="text.secondary">No fight in progress</Typography>
        )}
      </Box>

      {/* Ready Fight Section */}
      <Box mb={4}>
        <SectionTitle title="Ready Fight" />
        {readyFight ? (
          <FightCard fight={readyFight} showStatus />
        ) : (
          <Typography color="text.secondary">No fight ready</Typography>
        )}
      </Box>

      {/* Next Fights Section */}
      <Box mb={4}>
        <SectionTitle title="Next Fights" />
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Stack spacing={2}>
            {nextFights.length > 0 ? (
              nextFights.map(fight => (
                <FightCard key={fight.id} fight={fight} showStatus />
              ))
            ) : (
              <Typography color="text.secondary">No upcoming fights</Typography>
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default CurrentFights;
