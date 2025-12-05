import React, { useState } from 'react';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { AudioProvider } from './providers/AudioProvider';
import { AffirmationProvider } from './providers/AffirmationProvider';
import { HomeScreen } from './components/HomeScreen';
import { AuthScreen } from './components/AuthScreen';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [skippedAuth, setSkippedAuth] = useState(false);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  // Show auth screen if not authenticated and hasn't skipped
  if (!isAuthenticated && !skippedAuth) {
    return <AuthScreen onSkip={() => setSkippedAuth(true)} />;
  }

  // Show main app
  return (
    <AudioProvider>
      <AffirmationProvider>
        <HomeScreen />
      </AffirmationProvider>
    </AudioProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
