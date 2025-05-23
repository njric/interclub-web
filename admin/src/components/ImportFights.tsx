import React, { useState } from 'react';
import {
  Button,
  Paper,
  Typography,
  Box,
  Alert,
  Stack,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../services/api';
import type { FightCreate } from '../services/api';

interface AddFightDialogProps {
  open: boolean;
  onClose: () => void;
  totalFights: number;
}

const AddFightDialog: React.FC<AddFightDialogProps> = ({ open, onClose, totalFights }) => {
  const [newFight, setNewFight] = useState<FightCreate>({
    fighter_a: '',
    fighter_a_club: '',
    fighter_b: '',
    fighter_b_club: '',
    weight_class: 0,
    duration: 15,
    position: totalFights + 1,
    fight_type: 'Boxing'
  });

  const handleSubmit = async () => {
    try {
      await api.addFight(newFight);
      onClose();
      window.location.reload(); // Refresh to show new fight
    } catch (error: any) {
      console.error('Error adding fight:', error);
      alert('Error adding fight: ' + error.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setNewFight(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Fight</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            name="fighter_a"
            label="Fighter A"
            value={newFight.fighter_a}
            onChange={handleChange}
            required
            fullWidth
          />
          <TextField
            name="fighter_a_club"
            label="Fighter A Club"
            value={newFight.fighter_a_club}
            onChange={handleChange}
            required
            fullWidth
          />
          <TextField
            name="fighter_b"
            label="Fighter B"
            value={newFight.fighter_b}
            onChange={handleChange}
            required
            fullWidth
          />
          <TextField
            name="fighter_b_club"
            label="Fighter B Club"
            value={newFight.fighter_b_club}
            onChange={handleChange}
            required
            fullWidth
          />
          <TextField
            name="weight_class"
            label="Weight Class (kg)"
            type="number"
            value={newFight.weight_class}
            onChange={handleChange}
            required
            fullWidth
          />
          <TextField
            name="duration"
            label="Duration (minutes)"
            type="number"
            value={newFight.duration}
            onChange={handleChange}
            required
            fullWidth
          />
          <FormControl fullWidth required>
            <InputLabel id="fight-type-label">Fight Type</InputLabel>
            <Select
              labelId="fight-type-label"
              name="fight_type"
              value={newFight.fight_type}
              label="Fight Type"
              onChange={handleChange}
            >
              {['Boxing', 'Muay Thai', 'Grappling', 'MMA'].map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Position"
            type="number"
            value={newFight.position}
            onChange={(e) => setNewFight({ ...newFight, position: parseInt(e.target.value) })}
            inputProps={{ min: 1, max: totalFights + 1 }}
            fullWidth
            helperText={`Enter a number between 1 and ${totalFights + 1}`}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Add Fight
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ImportFights: React.FC = () => {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [addFightOpen, setAddFightOpen] = useState(false);
  const [totalFights, setTotalFights] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current start time and fights
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const fights = await api.getFights();
        setTotalFights(fights.length);

        // Find the first non-started fight and set its expected start time
        const firstUnstartedFight = fights
          .sort((a, b) => a.fight_number - b.fight_number)
          .find(fight => !fight.actual_start);

        if (firstUnstartedFight?.expected_start) {
          // Parse the expected_start datetime string
          const startTime = new Date(firstUnstartedFight.expected_start);
          setStartTime(startTime);
        }
      } catch (error) {
        console.error('Error fetching fights:', error);
        setMessage({
          type: 'error',
          text: 'Error loading current start time'
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSetStartTime = async () => {
    if (!startTime) {
      setMessage({
        type: 'error',
        text: 'Please select a start time',
      });
      return;
    }

    try {
      // Format time as HH:mm:ss
      const hours = startTime.getHours().toString().padStart(2, '0');
      const minutes = startTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}:00`;

      console.log('Sending time to backend:', timeString);

      const response = await api.setStartTime(timeString);
      console.log('Backend response:', response);

      setMessage({
        type: 'success',
        text: 'Start time set successfully. Refreshing page to show updated times...',
      });

      // Give the user a chance to see the success message before reload
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('Error setting start time:', error);
      setMessage({
        type: 'error',
        text: `Error setting start time: ${error.response?.data?.detail || error.message}`,
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await api.importFights(file);
      setMessage({
        type: 'success',
        text: `Successfully imported ${result.imported} fights`,
      });
    } catch (error: any) {
      console.error('Import error:', error);
      const errorDetail = error.response?.data?.detail;
      const errorStatus = error.response?.status;
      const errorMessage = error.message;
      setMessage({
        type: 'error',
        text: `Error importing fights (${errorStatus}): ${errorDetail || errorMessage || 'Unknown error'}. Please check your CSV format and try again.`,
      });
    }

    // Reset the file input
    event.target.value = '';
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all fights? This cannot be undone.')) {
      try {
        await api.clearAllFights();
        setMessage({
          type: 'success',
          text: 'All fights cleared successfully',
        });
      } catch (error: any) {
        console.error('Clear error:', error);
        const errorDetail = error.response?.data?.detail;
        const errorStatus = error.response?.status;
        const errorMessage = error.message;
        setMessage({
          type: 'error',
          text: `Error clearing fights (${errorStatus}): ${errorDetail || errorMessage || 'Unknown error'}`,
        });
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Import & Database Management
      </Typography>

      <Paper elevation={3} sx={{ p: 3, m: 2 }}>
        <Typography variant="h5" gutterBottom>
          Set Start Time
        </Typography>
        <Box sx={{ mb: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TimePicker
                label="First Fight Start Time"
                value={startTime}
                onChange={(newValue) => setStartTime(newValue)}
                ampm={false}
                views={['hours', 'minutes']}
                format="HH:mm"
              />
              <Button
                variant="contained"
                onClick={handleSetStartTime}
                disabled={!startTime || isLoading}
              >
                Set Start Time
              </Button>
            </Stack>
          </LocalizationProvider>
          {isLoading ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Loading current start time...
            </Typography>
          ) : startTime && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Current start time: {startTime.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}
            </Typography>
          )}
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, m: 2 }}>
        <Typography variant="h5" gutterBottom>
          Add Fight
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            onClick={() => setAddFightOpen(true)}
          >
            Add New Fight
          </Button>
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, m: 2 }}>
        <Typography variant="h5" gutterBottom>
          Import Fights
        </Typography>
        <Box my={2}>
          <Typography variant="body1" gutterBottom>
            Upload a CSV file with the following columns:
          </Typography>
          <Typography variant="body2" component="pre" sx={{ backgroundColor: '#f5f5f5', p: 1 }}>
            fighter_a,fighter_a_club,fighter_b,fighter_b_club,weight_class,duration,fight_type
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Example:
          </Typography>
          <Typography variant="body2" component="pre" sx={{ backgroundColor: '#f5f5f5', p: 1 }}>
            Buakaw,Por Pramuk,Masato,K-1,76,15,Muay Thai
            Saenchai,13 Coins,Pakorn,Por Pramuk,65,15,Boxing
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Notes:
          </Typography>
          <ul>
            <Typography variant="body2" component="li">
              weight_class: Integer representing the weight category in kg (e.g., 76 for 76kg)
            </Typography>
            <Typography variant="body2" component="li">
              duration: Fight duration in minutes
            </Typography>
            <Typography variant="body2" component="li">
              fight_type: Type of fight (Boxing, Muay Thai, Grappling, MMA)
            </Typography>
          </ul>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" component="label">
            Upload CSV
            <input type="file" hidden accept=".csv" onChange={handleFileUpload} />
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, m: 2 }}>
        <Typography variant="h5" gutterBottom color="error">
          Danger Zone
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          These actions cannot be undone. Please be certain.
        </Typography>
        <Box mt={2}>
          <Button
            variant="outlined"
            color="error"
            onClick={handleClearAll}
          >
            Clear All Fights
          </Button>
        </Box>
      </Paper>

      <AddFightDialog
        open={addFightOpen}
        onClose={() => setAddFightOpen(false)}
        totalFights={totalFights}
      />

      {message && (
        <Alert severity={message.type} sx={{ mt: 2 }}>
          {message.text}
        </Alert>
      )}
    </Box>
  );
};

export default ImportFights;
