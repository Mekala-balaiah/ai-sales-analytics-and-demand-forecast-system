import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { BusinessContext } from './context/BusinessContext';
import { AnalyticsProvider } from './context/AnalyticsContext';

// Pages
import Auth from './pages/Auth';
import BusinessSelect from './pages/BusinessSelect';
import Dashboard from './pages/Dashboard';
import UploadCenter from './pages/UploadCenter';
import Insights from './pages/Insights';
import Forecast from './pages/Forecast';
import AnalyticsPage from './pages/Analytics';
import Profile from './pages/Profile';

// Components
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import AIChatAssistant from './components/AIChatAssistant';

const ProtectedRoute = ({ children }) => {
  const { token } = useContext(AuthContext);
  if (!token) return <Navigate to="/auth" />;
  return children;
};

const BusinessRoute = ({ children }) => {
  const { activeBusiness } = useContext(BusinessContext);
  if (!activeBusiness) return <Navigate to="/select-business" />;
  return children;
};

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="main-content">
        <TopNav toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        
        <Route path="/select-business" element={
          <ProtectedRoute>
            <BusinessSelect />
          </ProtectedRoute>
        } />
        
        <Route path="/*" element={
          <ProtectedRoute>
            <BusinessRoute>
              <AnalyticsProvider>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/upload" element={<UploadCenter />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/insights" element={<Insights />} />
                    <Route path="/forecast" element={<Forecast />} />
                    <Route path="/profile" element={<Profile />} />
                  </Routes>
                  <AIChatAssistant />
                </AppLayout>
              </AnalyticsProvider>
            </BusinessRoute>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
