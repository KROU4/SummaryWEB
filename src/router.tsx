import { HashRouter, Route, Routes } from 'react-router-dom';
import { AuthGate } from './components/AuthGate';
import { useAuth } from './hooks/useAuth';
import { Home } from './pages/Home';
import { SummaryPage } from './pages/SummaryPage';

export function AppRouter() {
  const { authenticated, error, login, logout } = useAuth();

  if (!authenticated) {
    return <AuthGate error={error} onLogin={login} />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home onLogout={logout} />} />
        <Route path="/summary/:id" element={<SummaryPage />} />
      </Routes>
    </HashRouter>
  );
}
