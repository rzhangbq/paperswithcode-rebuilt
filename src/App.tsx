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
      
      {/* Warning Banner */}
      <div className="bg-yellow-100 border-b border-yellow-300 px-4 py-3">
        <div className="flex items-center justify-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-800 font-medium">
              This application is rebuilt from the discontinued Papers with Code website. All data remains un-updated since the website shut down.
            </p>
          </div>
        </div>
      </div>
      
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