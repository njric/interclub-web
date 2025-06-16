import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Stack,
  Alert,
  Snackbar,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapVert as SwapVertIcon
} from '@mui/icons-material';
import type { Fight, FightCreate } from '../services/api';
import api from '../services/api';
import { useFightContext } from '../context/FightContext';
import { useTranslation } from '../hooks/useTranslation';
import { alpha } from '@mui/material/styles';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { getClubColor } from '../utils/colors';
import { default as DialogEditFight } from './EditFightDialog';
import { default as DialogEditFightNumber } from './EditFightNumberDialog';
import { formatTime } from '../utils/time';
import { canEditFight } from '../utils/fightStatus';
import { getErrorMessage, logError, type ApiError } from '../utils/error';
import { default as DialogCancelFight } from './CancelFightDialog';

interface FightListProps {
  fights: Fight[];
  onDragEnd?: (result: any) => Promise<void>;
  onDelete?: (id: string) => void;
  onUpdate?: () => void;
}

const getReadyFight = (fights: Fight[]): Fight | null => {
  const ongoingFight = fights.find(f => f.actual_start && !f.actual_end);

  if (ongoingFight) {
    return fights.find(f =>
      !f.is_completed &&
      !f.actual_start &&
      f.expected_start > ongoingFight.expected_start
    ) || null;
  }

  return fights.find(f => !f.is_completed && !f.actual_start) || null;
};

const getNextAvailableFight = (fights: Fight[]): Fight | null => {
  const readyFight = getReadyFight(fights);
  if (!readyFight) return null;

  return fights.find(f =>
    !f.is_completed &&
    !f.actual_start &&
    f.expected_start > readyFight.expected_start
  ) || null;
};

const canReorderFight = (fight: Fight, fights: Fight[]): boolean => {
  const nextAvailableFight = getNextAvailableFight(fights);
  if (!nextAvailableFight) return false;

  return fight.fight_number >= nextAvailableFight.fight_number;
};

const getReorderButtonTooltip = (fight: Fight, fights: Fight[], t: (key: string) => string): string => {
  if (fight.is_completed) {
    return t('fightList.tooltips.cannotReorderCompleted');
  }
  if (fight.actual_start && !fight.actual_end) {
    return t('fightList.tooltips.cannotReorderOngoing');
  }
  const readyFight = getReadyFight(fights);
  if (readyFight && readyFight.id === fight.id) {
    return t('fightList.tooltips.cannotReorderNextReady');
  }

  const nextAvailable = getNextAvailableFight(fights);
  if (!nextAvailable) {
    return t('fightList.tooltips.noFightsForReordering');
  }

  if (fight.fight_number < nextAvailable.fight_number) {
    return t('fightList.tooltips.cannotReorderBeforeNext');
  }

  return t('fightList.actions.changeFightNumber');
};

const FightList: React.FC<FightListProps> = ({ fights = [], onDragEnd, onDelete, onUpdate }) => {
  const { t } = useTranslation();
  const [fightsState, setFightsState] = useState<Fight[]>(fights);
  const [error, setError] = useState<string | null>(null);
  const [editFight, setEditFight] = useState<Fight | null>(null);
  const [editFightNumber, setEditFightNumber] = useState<Fight | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [movedFightId, setMovedFightId] = useState<string | null>(null);
  const [cancelFight, setCancelFight] = useState<Fight | null>(null);
  const { refreshFightStatus } = useFightContext();

  // Configuration options
  const REFRESH_INTERVAL = 30000; // 30 seconds, can be configured via environment variable
  const AUTO_REFRESH_ENABLED = true; // Can be configured via environment variable

  // Update fightsState when fights prop changes
  useEffect(() => {
    setFightsState(fights);
  }, [fights]);

  const handleError = (error: unknown, defaultMessage: string) => {
    const apiError: ApiError = {
      message: error instanceof Error ? error.message : undefined,
      response: (error as any)?.response
    };
    const errorMessage = getErrorMessage(apiError, t(defaultMessage));
    setError(errorMessage);
    logError('FightList', apiError);
  };

  const loadFights = async (force = false) => {
    try {
      const response = await api.getFights();
      setFightsState(response);
      setIsUpdating(false);
    } catch (error) {
      handleError(error, 'Error loading fights. Please try again.');
    }
  };

  useEffect(() => {
    // Initial load
    loadFights(true);

    // Set up auto-refresh if enabled
    let interval: number | null = null;
    if (AUTO_REFRESH_ENABLED) {
      interval = window.setInterval(() => loadFights(), REFRESH_INTERVAL);
    }

    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, []);

  const handleStartFight = async (fight: Fight) => {
    try {
      await api.startFight(fight.id);
      await loadFights(true);
      await refreshFightStatus(); // Refresh fight status after starting a fight
      onUpdate?.();
      setError(null);
    } catch (error) {
      handleError(error, 'fightList.errors.starting');
    }
  };

  const handleEndFight = async (fight: Fight) => {
    try {
      await api.endFight(fight.id);
      await loadFights(true);
      await refreshFightStatus(); // Refresh fight status after ending a fight
      onUpdate?.();
      setError(null);
    } catch (error) {
      handleError(error, 'fightList.errors.ending');
    }
  };

  const handleCancelClick = (fight: Fight) => {
    setCancelFight(fight);
  };

  const handleCancelConfirm = async () => {
    if (!cancelFight) return;

    try {
      await api.cancelFight(cancelFight.id);
      await loadFights(true);
      await refreshFightStatus();
      setCancelFight(null);
      setError(null);
      onUpdate?.();
    } catch (error) {
      handleError(error, 'Error cancelling fight. Please try again.');
    }
  };

  const handleEditFight = async (updatedFight: Omit<FightCreate, 'position'>) => {
    if (!editFight) return;

    try {
      await api.updateFight(editFight.id, updatedFight);
      await loadFights(true);
      setEditFight(null);
      setError(null);
      onUpdate?.();
    } catch (error) {
      handleError(error, 'fightList.errors.updating');
    }
  };

  const handleUpdateFightNumber = async (fightId: string, newNumber: number) => {
    try {
      await api.updateFightNumber(fightId, newNumber);
      await loadFights(true);
      setEditFightNumber(null);
      setError(null);
      onUpdate?.();
    } catch (error) {
      handleError(error, 'fightList.errors.updatingNumber');
    }
  };

  const handleDeleteFight = async (fightId: string) => {
    try {
      await api.deleteFight(fightId);
      await loadFights(true);
      setError(null);
      onDelete?.(fightId);
      onUpdate?.();
    } catch (error) {
      handleError(error, 'fightList.errors.deleting');
    }
  };

  const getStartTime = (fight: Fight): string => {
    if (fight.actual_start) {
      return formatTime(fight.actual_start);
    }
    return formatTime(fight.expected_start);
  };

  const getDuration = (fight: Fight): string => {
    if (fight.actual_start && fight.actual_end) {
      const start = new Date(fight.actual_start);
      const end = new Date(fight.actual_end);
      const duration = Math.floor((end.getTime() - start.getTime()) / 60000);
      // Only show duration if it's greater than 0, otherwise show nothing
      return duration > 0 ? `${duration} ${t('common.min')}` : '';
    }
    return `${fight.duration} ${t('common.min')}`;
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        {t('fightList.title')}
      </Typography>
      {isUpdating && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('fightList.updatingOrder')}
        </Alert>
      )}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('fightList.tableHeaders.fightNumber')}</TableCell>
              <TableCell>{t('fightList.tableHeaders.fighterA')}</TableCell>
              <TableCell>{t('fightList.tableHeaders.fighterB')}</TableCell>
              <TableCell>{t('fightList.tableHeaders.weight')}</TableCell>
              <TableCell>{t('fightList.tableHeaders.type')}</TableCell>
              <TableCell>{t('fightList.tableHeaders.expectedStart')}</TableCell>
              <TableCell>{t('fightList.tableHeaders.duration')}</TableCell>
              <TableCell>{t('fightList.tableHeaders.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(fightsState || [])
              .sort((a, b) => a.fight_number - b.fight_number)
              .map((fight) => (
              <TableRow key={fight.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{fight.fight_number}</span>
                    {canEditFight(fight, fightsState) && (
                      <IconButton
                        size="small"
                        onClick={() => setEditFightNumber(fight)}
                        title={getReorderButtonTooltip(fight, fightsState, t)}
                        disabled={!canReorderFight(fight, fightsState)}
                      >
                        <SwapVertIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack>
                    <span>{fight.fighter_a}</span>
                    <span style={{ color: getClubColor(fight.fighter_a_club) }}>
                      {fight.fighter_a_club}
                    </span>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack>
                    <span>{fight.fighter_b}</span>
                    <span style={{ color: getClubColor(fight.fighter_b_club) }}>
                      {fight.fighter_b_club}
                    </span>
                  </Stack>
                </TableCell>
                <TableCell>{fight.weight_class}{t('common.kg')}</TableCell>
                <TableCell>
                  <Chip
                    label={fight.fight_type}
                    size="small"
                    color="primary"
                  />
                </TableCell>
                <TableCell>{getStartTime(fight)}</TableCell>
                <TableCell>{getDuration(fight)}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    {!fight.actual_start && !fight.is_completed && (
                      <Tooltip title={t('fightList.actions.startFight')}>
                        <IconButton
                          size="small"
                          onClick={() => handleStartFight(fight)}
                        >
                          <PlayArrowIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {fight.actual_start && !fight.actual_end && (
                      <Tooltip title={t('fightList.actions.endFight')}>
                        <IconButton
                          size="small"
                          onClick={() => handleEndFight(fight)}
                        >
                          <StopIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canEditFight(fight, fightsState) && (
                      <>
                        <Tooltip title={t('fightList.actions.editFight')}>
                          <IconButton
                            size="small"
                            onClick={() => setEditFight(fight)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('fightList.actions.deleteFight')}>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteFight(fight.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {editFight && (
        <DialogEditFight
          fight={editFight}
          onClose={() => setEditFight(null)}
          onSave={handleEditFight}
          open={!!editFight}
        />
      )}

      {editFightNumber && (
        <DialogEditFightNumber
          fight={editFightNumber}
          onClose={() => setEditFightNumber(null)}
          onSave={handleUpdateFightNumber}
          open={!!editFightNumber}
          totalFights={fightsState.length}
        />
      )}

      <DialogCancelFight
        open={!!cancelFight}
        fight={cancelFight}
        onClose={() => setCancelFight(null)}
        onConfirm={handleCancelConfirm}
      />

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default FightList;
