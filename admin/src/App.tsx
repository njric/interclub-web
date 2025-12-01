import React, { useState, useEffect } from 'react';
import { Container, CssBaseline, AppBar, Toolbar, Typography, Tabs, Tab, Box, Button, IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import FightList from './components/FightList';
import FightStatus from './components/FightStatus';
import ImportFights from './components/ImportFights';
import UserInterface from './components/user/UserInterface';
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { FightProvider } from './context/FightContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useTranslation } from './hooks/useTranslation';
import api from './services/api';
import type { Fight } from './services/api';
import './App.css';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function AdminPanel() {
  const [currentTab, setCurrentTab] = useState(0);
  const { logout } = useAuth();
  const { t } = useTranslation();
  const [fights, setFights] = useState<Fight[]>([]);

  useEffect(() => {
    const loadFights = async () => {
      try {
        const data = await api.getFights();
        setFights(data);
      } catch (error) {
        console.error('Error loading fights:', error);
      }
    };
    loadFights();
  }, []);

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    try {
      const fightId = fights[result.source.index].id;
      const newPosition = result.destination.index + 1;
      const updatedFights = await api.updateFightNumber(fightId, newPosition);
      setFights(updatedFights);
    } catch (error) {
      console.error('Error updating fight order:', error);
    }
  };

  const handleDelete = async (fightId: string) => {
    try {
      await api.updateFight(fightId, { is_completed: true });
      setFights(fights.filter(fight => fight.id !== fightId));
    } catch (error) {
      console.error('Error deleting fight:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleRefreshTimes = async () => {
    try {
      const updatedFights = await api.refreshFightTimes();
      setFights(updatedFights);
    } catch (error) {
      console.error('Error refreshing fight times:', error);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Tooltip title={t('app.refreshTimes') || 'Recalculer les horaires'}>
            <IconButton color="inherit" onClick={handleRefreshTimes}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>{t('app.title')}</Typography>
          <Button color="inherit" onClick={logout}>{t('app.logout')}</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, px: { xs: 1, sm: 2 } }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label={t('navigation.fightManagement')} />
          <Tab label={t('navigation.importSettings')} />
        </Tabs>

        <TabPanel value={currentTab} index={0}>
          <Box sx={{ my: 4 }}>
            <FightStatus />
            <Box sx={{ mt: 4 }}>
              <FightList
                fights={fights}
                onDragEnd={handleDragEnd}
                onDelete={handleDelete}
              />
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <ImportFights />
        </TabPanel>
      </Container>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <FightProvider>
        <BrowserRouter>
          <CssBaseline />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/" element={<UserInterface />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </FightProvider>
    </AuthProvider>
  );
}

export default App;
