import React, { useState } from 'react';
import { Container, CssBaseline, AppBar, Toolbar, Typography, Tabs, Tab, Box } from '@mui/material';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import FightList from './components/FightList';
import FightStatus from './components/FightStatus';
import ImportFights from './components/ImportFights';
import UserInterface from './components/user/UserInterface';
import { FightProvider } from './context/FightContext';
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Fight Manager Admin</Typography>
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
    <FightProvider>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/" element={<UserInterface />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </FightProvider>
  );
}

export default App;
