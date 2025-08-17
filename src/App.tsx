import { useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { PapersPage } from './pages/PapersPage';
import { LeaderboardsPage } from './pages/LeaderboardsPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { MethodsPage } from './pages/MethodsPage';
import { MathTestPage } from './components/MathTestPage';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    navigate('/papers');
  };

  const handleTabChange = (tab: string) => {
    navigate(`/${tab}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onSearch={handleSearch} 
        activeTab={location.pathname.slice(1) || 'papers'}
        onTabChange={handleTabChange}
      />
      
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<PapersPage searchQuery={searchQuery} onSearch={handleSearch} />} />
          <Route path="/papers" element={<PapersPage searchQuery={searchQuery} onSearch={handleSearch} />} />
          <Route path="/leaderboards" element={<LeaderboardsPage />} />
          <Route path="/datasets" element={<DatasetsPage />} />
          <Route path="/methods" element={<MethodsPage />} />
          <Route path="/math-test" element={<MathTestPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;