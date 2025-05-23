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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import type { Fight, FightCreate } from '../services/api';
import api from '../services/api';
import { useFightContext } from '../context/FightContext';
import { alpha } from '@mui/material/styles';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { getClubColor } from '../utils/colors';

interface EditFightDialogProps {
  open: boolean;
  fight: Fight | null;
  onClose: () => void;
  onSave: (updatedFight: Omit<FightCreate, 'position'>) => void;
}

const EditFightDialog: React.FC<EditFightDialogProps> = ({ open, fight, onClose, onSave }) => {
  const [editedFight, setEditedFight] = useState<Omit<FightCreate, 'position'>>({
    fighter_a: '',
    fighter_a_club: '',
    fighter_b: '',
    fighter_b_club: '',
    weight_class: 0,
    duration: 15,
    fight_type: 'Boxing'
  });

  useEffect(() => {
    if (fight) {
      setEditedFight({
        fighter_a: fight.fighter_a,
        fighter_a_club: fight.fighter_a_club,
        fighter_b: fight.fighter_b,
        fighter_b_club: fight.fighter_b_club,
        weight_class: fight.weight_class,
        duration: fight.duration,
        fight_type: fight.fight_type
      });
    }
  }, [fight]);

  const handleSubmit = () => {
    onSave(editedFight);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Fight</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Fighter A"
            value={editedFight.fighter_a}
            onChange={(e) => setEditedFight({ ...editedFight, fighter_a: e.target.value })}
            fullWidth
          />
          <TextField
            label="Fighter A Club"
            value={editedFight.fighter_a_club}
            onChange={(e) => setEditedFight({ ...editedFight, fighter_a_club: e.target.value })}
            fullWidth
          />
          <TextField
            label="Fighter B"
            value={editedFight.fighter_b}
            onChange={(e) => setEditedFight({ ...editedFight, fighter_b: e.target.value })}
            fullWidth
          />
          <TextField
            label="Fighter B Club"
            value={editedFight.fighter_b_club}
            onChange={(e) => setEditedFight({ ...editedFight, fighter_b_club: e.target.value })}
            fullWidth
          />
          <TextField
            label="Weight Class (kg)"
            type="number"
            value={editedFight.weight_class}
            onChange={(e) => setEditedFight({ ...editedFight, weight_class: parseInt(e.target.value) })}
            fullWidth
          />
          <TextField
            label="Duration (minutes)"
            type="number"
            value={editedFight.duration}
            onChange={(e) => setEditedFight({ ...editedFight, duration: parseInt(e.target.value) })}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel id="fight-type-label">Fight Type</InputLabel>
            <Select
              labelId="fight-type-label"
              value={editedFight.fight_type}
              label="Fight Type"
              onChange={(e) => setEditedFight({ ...editedFight, fight_type: e.target.value })}
            >
              {['Boxing', 'Muay Thai', 'Grappling', 'MMA'].map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface CancelFightDialogProps {
  open: boolean;
  fight: Fight | null;
  onClose: () => void;
  onConfirm: () => void;
}

const CancelFightDialog: React.FC<CancelFightDialogProps> = ({ open, fight, onClose, onConfirm }) => {
  if (!fight) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Cancel Fight</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to cancel the fight between {fight.fighter_a} ({fight.fighter_a_club}) and {fight.fighter_b} ({fight.fighter_b_club})?
          This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>No, Keep Fight</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Yes, Cancel Fight
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface EditFightNumberDialogProps {
  open: boolean;
  fight: Fight | null;
  totalFights: number;
  onClose: () => void;
  onSave: (fightId: string, newNumber: number) => void;
}

const EditFightNumberDialog: React.FC<EditFightNumberDialogProps> = ({
  open,
  fight,
  totalFights,
  onClose,
  onSave
}) => {
  const [newNumber, setNewNumber] = useState<number>(fight?.fight_number || 1);

  useEffect(() => {
    if (fight) {
      setNewNumber(fight.fight_number);
    }
  }, [fight]);

  const handleSubmit = () => {
    if (fight) {
      onSave(fight.id, newNumber);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Change Fight Number</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <DialogContentText>
            Current fight number: {fight?.fight_number}
          </DialogContentText>
          <TextField
            label="New Fight Number"
            type="number"
            value={newNumber}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (value >= 1 && value <= totalFights) {
                setNewNumber(value);
              }
            }}
            inputProps={{
              min: 1,
              max: totalFights,
            }}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={fight?.fight_number === newNumber}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface FightListProps {
  fights: Fight[];
  onDragEnd: (result: any) => void;
  onDelete: (fightId: string) => void;
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

const getReorderButtonTooltip = (fight: Fight, fights: Fight[]): string => {
  if (fight.is_completed) {
    return "Cannot reorder completed fights";
  }

  if (fight.actual_start) {
    return "Cannot reorder ongoing fight";
  }

  const readyFight = getReadyFight(fights);
  if (readyFight && fight.id === readyFight.id) {
    return "Cannot reorder the next ready fight";
  }

  const nextAvailableFight = getNextAvailableFight(fights);
  if (!nextAvailableFight) {
    return "No fights available for reordering";
  }

  if (fight.fight_number < nextAvailableFight.fight_number) {
    return "Cannot reorder fights before the next available fight";
  }

  return "Change fight number";
};

const FightList: React.FC<FightListProps> = ({ fights = [], onDragEnd, onDelete }) => {
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

  const loadFights = async (force = false) => {
    // Skip refresh if an update is in progress
    if (isUpdating && !force) return;

    try {
      const data = await api.getFights();

      // Only update state if the fights have actually changed
      const hasChanges = !fightsState.length || data.some((newFight, index) => {
        const oldFight = fightsState[index];
        return !oldFight ||
          oldFight.fight_number !== newFight.fight_number ||
          oldFight.actual_start !== newFight.actual_start ||
          oldFight.actual_end !== newFight.actual_end ||
          oldFight.is_completed !== newFight.is_completed;
      });

      if (hasChanges) {
        setFightsState(data.sort((a, b) => a.fight_number - b.fight_number));
      }
    } catch (error) {
      console.error('Error loading fights:', error);
      setError('Error loading fights. Please refresh the page.');
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

  const handleStart = async (fightId: string) => {
    try {
      await api.startFight(fightId);
      await loadFights();
      await refreshFightStatus(); // Refresh fight status after starting a fight
    } catch (error) {
      console.error('Error starting fight:', error);
      setError('Error starting fight. Please try again.');
    }
  };

  const handleEnd = async (fightId: string) => {
    try {
      await api.endFight(fightId);
      await loadFights();
      await refreshFightStatus(); // Refresh fight status after ending a fight
    } catch (error) {
      console.error('Error ending fight:', error);
      setError('Error ending fight. Please try again.');
    }
  };

  const handleCancelClick = (fight: Fight) => {
    setCancelFight(fight);
  };

  const handleCancelConfirm = async () => {
    if (!cancelFight) return;

    try {
      await api.cancelFight(cancelFight.id);
      await loadFights();
      await refreshFightStatus();
      setCancelFight(null);
    } catch (error: any) {
      console.error('Error canceling fight:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Error canceling fight. Please try again.';
      setError(`Failed to cancel fight: ${errorMessage}`);
    }
  };

  const handleEditFight = async (updatedFight: Omit<FightCreate, 'position'>) => {
    if (!editFight) return;

    try {
      await api.updateFight(editFight.id, updatedFight);
      await loadFights(true);
      setEditFight(null);
      setError(null);
    } catch (error: any) {
      console.error('Error updating fight:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Error updating fight. Please try again.';
      setError(errorMessage);
    }
  };

  const handleUpdateFightNumber = async (fightId: string, newNumber: number) => {
    try {
      await api.updateFightNumber(fightId, newNumber);
      await loadFights(true);
      setEditFightNumber(null);
      setError(null);
    } catch (error: any) {
      console.error('Error updating fight number:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Error updating fight number. Please try again.';
      setError(errorMessage);
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return '-';
    return new Date(time).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStartTime = (fight: Fight): string => {
    if (fight.actual_start) {
      return formatTime(fight.actual_start);
    }
    return formatTime(fight.expected_start);
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Fight Management
      </Typography>
      {isUpdating && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Updating fight order...
        </Alert>
      )}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fight #</TableCell>
              <TableCell>Fighter A</TableCell>
              <TableCell>Fighter B</TableCell>
              <TableCell>Weight</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Expected Start</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(fightsState || []).map((fight) => (
              <TableRow key={fight.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{fight.fight_number}</span>
                    <IconButton
                      size="small"
                      onClick={() => setEditFightNumber(fight)}
                      title={getReorderButtonTooltip(fight, fightsState)}
                      disabled={!canReorderFight(fight, fightsState)}
                    >
                      <SwapVertIcon fontSize="small" />
                    </IconButton>
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
                <TableCell>{fight.weight_class}kg</TableCell>
                <TableCell>
                  <Chip
                    label={fight.fight_type}
                    size="small"
                    color="primary"
                  />
                </TableCell>
                <TableCell>{formatTime(fight.expected_start)}</TableCell>
                <TableCell>{fight.duration} min</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    {!fight.actual_start && !fight.is_completed && (
                      <>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handleStart(fight.id)}
                        >
                          Start
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleCancelClick(fight)}
                        >
                          Cancel
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => setEditFight(fight)}
                          title="Edit fight details"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                    {fight.actual_start && !fight.actual_end && (
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        onClick={() => handleEnd(fight.id)}
                      >
                        End
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <EditFightDialog
        open={!!editFight}
        fight={editFight}
        onClose={() => setEditFight(null)}
        onSave={handleEditFight}
      />

      <EditFightNumberDialog
        open={!!editFightNumber}
        fight={editFightNumber}
        totalFights={fightsState.length}
        onClose={() => setEditFightNumber(null)}
        onSave={handleUpdateFightNumber}
      />

      <CancelFightDialog
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
