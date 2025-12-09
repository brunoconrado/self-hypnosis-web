import React, { useState } from 'react';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { LanguageProvider } from './providers/LanguageProvider';
import { AudioProvider } from './providers/AudioProvider';
import { AffirmationProvider } from './providers/AffirmationProvider';
import { SessionSetupScreen } from './components/SessionSetupScreen';
import { PlayerScreen } from './components/PlayerScreen';
import { AuthScreen } from './components/AuthScreen';
import { LanguageSelector } from './components/LanguageSelector';

function MainApp() {
  const [sessionConfig, setSessionConfig] = useState(null);

  // Start session -> go to player
  const handleStartSession = (config) => {
    setSessionConfig(config);
  };

  // End session -> go back to setup
  const handleEndSession = () => {
    setSessionConfig(null);
  };

  // Player Screen
  if (sessionConfig) {
    return (
      <PlayerScreen
        sessionConfig={sessionConfig}
        onBack={handleEndSession}
        onEndSession={handleEndSession}
      />
    );
  }

  // Setup Screen
  return (
    <SessionSetupScreen onStartSession={handleStartSession} />
  );
}

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
    <LanguageProvider>
      <AudioProvider>
        <AffirmationProvider>
          <div className="app-container">
            <LanguageSelector />
            <MainApp />
          </div>
        </AffirmationProvider>
      </AudioProvider>
    </LanguageProvider>
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
