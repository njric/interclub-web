import React, { useState } from 'react';
import { Container, CssBaseline, AppBar, Toolbar, Typography, Tabs, Tab, Box, Button } from '@mui/material';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import FightList from './components/FightList';
import FightStatus from './components/FightStatus';
import ImportFights from './components/ImportFights';
import UserInterface from './components/user/UserInterface';
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { FightProvider } from './context/FightContext';
import { AuthProvider, useAuth } from './context/AuthContext';
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Fight Manager Admin</Typography>
          <Button color="inherit" onClick={logout}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="Fight Management" />
          <Tab label="Import & Settings" />
        </Tabs>

        <TabPanel value={currentTab} index={0}>
          <Box sx={{ my: 4 }}>
            <FightStatus />
            <Box sx={{ mt: 4 }}>
              <FightList />
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
