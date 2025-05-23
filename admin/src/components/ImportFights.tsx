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
import { useTranslation } from '../hooks/useTranslation';
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
  const { t } = useTranslation();
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
          {t('import.setStartTime.title')}
        </Typography>
        <Box sx={{ mb: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TimePicker
                label={t('import.setStartTime.field')}
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
                {t('import.setStartTime.button')}
              </Button>
            </Stack>
          </LocalizationProvider>
          {isLoading ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('import.setStartTime.loading')}
            </Typography>
          ) : startTime && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('import.setStartTime.current', {
                time: startTime.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })
              })}
            </Typography>
          )}
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, m: 2 }}>
        <Typography variant="h5" gutterBottom>
          {t('import.addFight.title')}
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            onClick={() => setAddFightOpen(true)}
          >
            {t('import.addFight.button')}
          </Button>
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, m: 2 }}>
        <Typography variant="h5" gutterBottom>
          {t('import.importFights.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('import.importFights.description')}
        </Typography>
        <Box component="pre" sx={{
          backgroundColor: 'grey.100',
          p: 2,
          borderRadius: 1,
          fontSize: '0.875rem',
          mb: 2
        }}>
          {t('import.importFights.example')}
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('import.importFights.notes')}
        </Typography>
        <Box component="ul" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
          <li>{t('import.importFights.noteWeight')}</li>
          <li>{t('import.importFights.noteDuration')}</li>
          <li>{t('import.importFights.noteFightType')}</li>
        </Box>
        <Box mt={2}>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="csv-upload"
          />
          <label htmlFor="csv-upload">
            <Button variant="outlined" component="span">
              {t('import.importFights.uploadButton')}
            </Button>
          </label>
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, m: 2 }}>
        <Typography variant="h5" gutterBottom color="error">
          {t('import.dangerZone.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('import.dangerZone.description')}
        </Typography>
        <Box mt={2}>
          <Button
            variant="outlined"
            color="error"
            onClick={handleClearAll}
          >
            {t('import.dangerZone.clearButton')}
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
