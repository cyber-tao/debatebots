import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { 
  HomeIcon, 
  PlayIcon, 
  Cog6ToothIcon, 
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import DebateSession from './pages/DebateSession';
import './index.css';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Debates', href: '/debates', icon: PlayIcon },
  { name: 'Participants', href: '/participants', icon: UserGroupIcon },
  { name: 'API Configs', href: '/api-configs', icon: Cog6ToothIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
];

function AppContent() {
  const location = useLocation();

  return (
    <Layout navigation={navigation} currentPath={location.pathname}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/debates" element={<Dashboard />} />
        <Route path="/debates/:id" element={<DebateSession />} />
        <Route path="/participants" element={<ComingSoon title="Participants Management" />} />
        <Route path="/api-configs" element={<ComingSoon title="API Configuration" />} />
        <Route path="/analytics" element={<ComingSoon title="Analytics Dashboard" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      <p className="text-gray-600 mb-8">This feature is coming soon!</p>
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 max-w-md mx-auto">
        <p className="text-sm text-yellow-800">
          This page is under development. The backend API is ready and functional.
          Check back soon for the complete user interface.
        </p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h2>
      <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
      <a 
        href="/" 
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
      >
        Go Home
      </a>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <AppContent />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10B981',
              },
            },
            error: {
              style: {
                background: '#EF4444',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;