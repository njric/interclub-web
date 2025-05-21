import React, { useState } from 'react';
import { Button, Paper, Typography, Box, Alert, Stack, Divider } from '@mui/material';
import api from '../services/api';

const ImportFights: React.FC = () => {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

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
          Import Fights
        </Typography>
        <Box my={2}>
          <Typography variant="body1" gutterBottom>
            Upload a CSV file with the following columns:
          </Typography>
          <Typography variant="body2" component="pre" sx={{ backgroundColor: '#f5f5f5', p: 1 }}>
            fighter_a,fighter_a_club,fighter_b,fighter_b_club,weight_class,duration
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Example:
          </Typography>
          <Typography variant="body2" component="pre" sx={{ backgroundColor: '#f5f5f5', p: 1 }}>
            Buakaw,Por Pramuk,Masato,K-1,76,15
            Saenchai,13 Coins,Pakorn,Por Pramuk,65,15
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

      {message && (
        <Alert severity={message.type} sx={{ mt: 2 }}>
          {message.text}
        </Alert>
      )}
    </Box>
  );
};

export default ImportFights;
