import { Container, CssBaseline, AppBar, Toolbar, Typography, Tabs, Tab, Box } from '@mui/material';
import { useState } from 'react';
import FightList from './components/FightList';
import FightStatus from './components/FightStatus';
import ImportFights from './components/ImportFights';

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

function App() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <>
      <CssBaseline />
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
          <FightStatus />
          <FightList />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <ImportFights />
        </TabPanel>
      </Container>
    </>
  );
}

export default App;
