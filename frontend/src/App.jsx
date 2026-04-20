import { Routes, Route, NavLink } from 'react-router-dom';
import { useCats } from './context/CatContext';
import CatSelector from './components/CatSelector';
import Dashboard from './components/Dashboard';
import LogForm from './components/LogForm';
import History from './components/History';
import CatManager from './components/CatManager';
import Onboarding from './components/Onboarding';
import { CatFaceIcon, PawIcon } from './components/Icons';

export default function App() {
  const { cats, loading, error } = useCats();

  if (loading) {
    return (
      <div className="loading-screen">
        <CatFaceIcon size={64} color="var(--primary)" />
        <div className="loading-text">Loading WhiskerWatch...</div>
        <div className="loading-paws">
          <PawIcon size={20} color="var(--primary-light)" className="paw" />
          <PawIcon size={20} color="var(--primary-light)" className="paw" />
          <PawIcon size={20} color="var(--primary-light)" className="paw" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-screen">
        <CatFaceIcon size={64} color="var(--danger)" />
        <div className="loading-text" style={{ color: 'var(--danger)' }}>Failed to connect</div>
        <p style={{ color: 'var(--text-light)', maxWidth: 400, textAlign: 'center' }}>{error}</p>
      </div>
    );
  }

  if (cats.length === 0) {
    return <Onboarding />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1><CatFaceIcon size={24} color="var(--primary)" /> WhiskerWatch</h1>
        </div>
        <nav className="nav-links">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/log">Log</NavLink>
          <NavLink to="/history">History</NavLink>
          <NavLink to="/cats">My Cats</NavLink>
        </nav>
        <div className="header-right">
          <CatSelector />
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/log" element={<LogForm />} />
          <Route path="/history" element={<History />} />
          <Route path="/cats" element={<CatManager />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <PawIcon size={14} color="var(--text-light)" />
        <span>Made with love for cats everywhere</span>
        <PawIcon size={14} color="var(--text-light)" />
      </footer>
    </div>
  );
}
