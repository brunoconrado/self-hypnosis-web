import React, { useState } from 'react';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { AudioProvider } from './providers/AudioProvider';
import { AffirmationProvider } from './providers/AffirmationProvider';
import { CategorySelectionScreen } from './components/CategorySelectionScreen';
import { SuggestionSelectionScreen } from './components/SuggestionSelectionScreen';
import { PlayerScreen } from './components/PlayerScreen';
import { AuthScreen } from './components/AuthScreen';

// Screen types - 3-step flow
const SCREENS = {
  CATEGORY_SELECTION: 'category_selection',
  SUGGESTION_SELECTION: 'suggestion_selection',
  PLAYER: 'player'
};

function MainApp() {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.CATEGORY_SELECTION);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sessionConfig, setSessionConfig] = useState(null);

  // Step 1 -> Step 2: Categories selected
  const handleCategoriesSelected = (categoryIds) => {
    setSelectedCategories(categoryIds);
    setCurrentScreen(SCREENS.SUGGESTION_SELECTION);
  };

  // Step 2 -> Step 3: Suggestions configured, start session
  const handleStartSession = (config) => {
    setSessionConfig(config);
    setCurrentScreen(SCREENS.PLAYER);
  };

  // Step 2 -> Step 1: Go back to categories
  const handleBackToCategories = () => {
    setCurrentScreen(SCREENS.CATEGORY_SELECTION);
  };

  // Step 3 -> Step 2: Go back to suggestions
  const handleBackToSuggestions = () => {
    setCurrentScreen(SCREENS.SUGGESTION_SELECTION);
  };

  // Step 3 -> Step 1: End session, go to start
  const handleEndSession = () => {
    setSessionConfig(null);
    setSelectedCategories([]);
    setCurrentScreen(SCREENS.CATEGORY_SELECTION);
  };

  // Step 3: Player
  if (currentScreen === SCREENS.PLAYER && sessionConfig) {
    return (
      <PlayerScreen
        sessionConfig={sessionConfig}
        onBack={handleBackToSuggestions}
        onEndSession={handleEndSession}
      />
    );
  }

  // Step 2: Suggestion Selection
  if (currentScreen === SCREENS.SUGGESTION_SELECTION && selectedCategories.length > 0) {
    return (
      <SuggestionSelectionScreen
        categoryIds={selectedCategories}
        onStartSession={handleStartSession}
        onBack={handleBackToCategories}
      />
    );
  }

  // Step 1: Category Selection
  return (
    <CategorySelectionScreen onNext={handleCategoriesSelected} />
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
    <AudioProvider>
      <AffirmationProvider>
        <MainApp />
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
