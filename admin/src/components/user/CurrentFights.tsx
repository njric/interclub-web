import React, { useCallback, useMemo } from 'react';
import { Typography, Box, Stack, useTheme, useMediaQuery, CircularProgress, Alert } from '@mui/material';
import { useFightContext } from '../../context/FightContext';
import { useTranslation } from '../../hooks/useTranslation';
import FightCard from './FightCard';
import type { Fight } from '../../services/api';
import api from '../../services/api';

const CurrentFights: React.FC = () => {
  const { ongoingFight, readyFight } = useFightContext();
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [nextFights, setNextFights] = React.useState<Fight[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);

  // Use useRef to store the timer interval
  const intervalRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const loadNextFights = async () => {
      if (!isMounted) return;

      try {
        setIsLoading(true);
        setError(null);
        const fights = await api.getNextFights(100);

        if (isMounted) {
          setNextFights(fights);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('Error loading next fights:', error);
        if (isMounted) {
          setError('Erreur lors du chargement des prochains combats. Veuillez réessayer plus tard.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Initial load
    loadNextFights();

    // Set up interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (isMounted) {
        loadNextFights();
      }
    }, 60000);

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // No dependencies to prevent recreation

  const handleManualRefresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fights = await api.getNextFights(100);
      setNextFights(fights);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Manual refresh - Error loading next fights:', error);
      setError('Erreur lors du chargement des prochains combats. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const SectionTitle: React.FC<{ title: string; highlight?: boolean }> = React.memo(({ title, highlight }) => (
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
  ));

  const nextFightsContent = useMemo(() => {
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    if (nextFights.length === 0) {
      return (
        <Typography color="text.secondary">
          {t('currentFights.noUpcoming')}
        </Typography>
      );
    }

    return (
      <Stack spacing={2}>
        {nextFights.map((fight) => (
          <FightCard key={`next-${fight.id}`} fight={fight} showStatus />
        ))}
      </Stack>
    );
  }, [isLoading, error, nextFights, t]);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      {/* Ongoing Fight Section */}
      <Box mb={4}>
        <SectionTitle title={t('currentFights.ongoingFight')} highlight={true} />
        {ongoingFight ? (
          <FightCard key={`ongoing-${ongoingFight.id}`} fight={ongoingFight} showStatus />
        ) : (
          <Typography color="text.secondary">{t('currentFights.noOngoing')}</Typography>
        )}
      </Box>

      {/* Ready Fight Section */}
      <Box mb={4}>
        <SectionTitle title={t('currentFights.readyFight')} />
        {readyFight ? (
          <FightCard key={`ready-${readyFight.id}`} fight={readyFight} showStatus />
        ) : (
          <Typography color="text.secondary">{t('currentFights.noReady')}</Typography>
        )}
      </Box>

      {/* Next Fights Section */}
      <Box mb={4}>
        <SectionTitle title={t('currentFights.nextFights')} />
        {nextFightsContent}
      </Box>
    </Box>
  );
};

export default CurrentFights;
