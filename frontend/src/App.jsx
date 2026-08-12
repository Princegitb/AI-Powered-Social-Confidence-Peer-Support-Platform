import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import AICompanion from './pages/AICompanion';
import RoleplaySelector from './pages/RoleplaySelector';
import RoleplaySession from './pages/RoleplaySession';

/**
 * SAATHI — AI-powered social confidence and communication practice platform.
 * Root app component with routing.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/companion" element={<AICompanion />} />
          <Route path="/practice" element={<RoleplaySelector />} />
          <Route path="/roleplay/:scenarioId" element={<RoleplaySession />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
