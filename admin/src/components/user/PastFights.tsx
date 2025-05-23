import React from 'react';
import { Typography, Box, Stack, useTheme, useMediaQuery } from '@mui/material';
import { useTranslation } from '../../hooks/useTranslation';
import FightCard from './FightCard';
import type { Fight } from '../../services/api';
import api from '../../services/api';

const PastFights: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [pastFights, setPastFights] = React.useState<Fight[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadPastFights = async () => {
      try {
        const fights = await api.getPastFights();
        setPastFights(fights);
      } catch (error) {
        console.error('Error loading past fights:', error);
        setError(t('pastFights.errorLoading'));
      }
    };

    loadPastFights();

    // Refresh every minute
    const interval = setInterval(loadPastFights, 60000);
    return () => clearInterval(interval);
  }, [t]);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography
        variant={isMobile ? "h6" : "h5"}
        gutterBottom
        sx={{
          borderBottom: '1px solid #eee',
          pb: 1,
          mb: 2
        }}
      >
        {t('pastFights.title')}
      </Typography>

      {error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Stack spacing={2}>
          {pastFights.length > 0 ? (
            pastFights.map(fight => (
              <FightCard key={fight.id} fight={fight} showStatus />
            ))
          ) : (
            <Typography color="text.secondary">{t('pastFights.noPastFights')}</Typography>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default PastFights;
