import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createInitialAffirmations } from '../data/affirmations';
import api from '../services/api';
import { useAuth } from './AuthProvider';

const AffirmationContext = createContext(null);

export function AffirmationProvider({ children }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [playlist, setPlaylist] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sessionItems, setSessionItems] = useState([]); // Prepared session items
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gapBetweenSec, setGapBetweenSec] = useState(2);
  const [isRunning, setIsRunning] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [voiceVolume, setVoiceVolumeState] = useState(0.8);
  const [isLoading, setIsLoading] = useState(true);

  const audioRef = useRef(null);
  const gapTimerRef = useRef(null);
  const mountedRef = useRef(true);

  // Audio cache - stores preloaded Audio elements by URL
  const audioCacheRef = useRef(new Map());

  // Transform API data to local format
  const transformAffirmations = (affirmationsData) => {
    return affirmationsData.map(a => ({
      id: a.id,
      text: a.text,
      categoryId: a.category_id,
      enabled: a.enabled,
      order: a.order,
      audioUrl: a.audio_url ? api.getAudioUrl(a.audio_url) : null,
      audioDurationMs: a.audio_duration_ms,
      isCustom: a.is_custom,
    }));
  };

  // Preload a single audio file into cache (if not already cached)
  const preloadAudioUrl = useCallback((url) => {
    if (!url) return;

    const cache = audioCacheRef.current;
    if (cache.has(url)) return; // Already cached

    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;
    audio.load();
    cache.set(url, audio);
  }, []);

  // Preload audio for multiple items (only if not cached)
  const preloadAudioForItems = useCallback((items) => {
    items.forEach(item => {
      if (item.audioUrl) {
        preloadAudioUrl(item.audioUrl);
      }
    });
  }, [preloadAudioUrl]);

  // Load affirmations based on auth state
  useEffect(() => {
    mountedRef.current = true;

    async function loadData() {
      console.log('[AffirmationProvider] loadData called, authLoading:', authLoading, 'isAuthenticated:', isAuthenticated);

      if (authLoading) {
        console.log('[AffirmationProvider] Still loading auth, skipping');
        return;
      }

      setIsLoading(true);

      try {
        let affirmationsData;

        // Always fetch categories (needed for both auth and guest)
        const cats = await api.getCategories();
        if (mountedRef.current) {
          setCategories(cats);
        }

        if (isAuthenticated) {
          // Authenticated - get user's affirmations
          console.log('[AffirmationProvider] Fetching authenticated affirmations...');
          affirmationsData = await api.getAffirmations();
          console.log('[AffirmationProvider] Got authenticated data:', affirmationsData?.length, 'items');
        } else {
          // Guest - get default affirmations from API
          console.log('[AffirmationProvider] Fetching default affirmations...');
          affirmationsData = await api.getDefaultAffirmations();
          console.log('[AffirmationProvider] Got default data:', affirmationsData?.length, 'items');
        }

        if (mountedRef.current) {
          if (affirmationsData && affirmationsData.length > 0) {
            const transformed = transformAffirmations(affirmationsData);
            const withAudio = transformed.filter(item => item.audioUrl);
            console.log('[AffirmationProvider] Transformed:', transformed.length, 'items,', withAudio.length, 'with audio');
            setPlaylist(transformed);

            // Preload audio only for ENABLED items with audio
            const enabledWithAudio = transformed.filter(item => item.enabled && item.audioUrl);
            preloadAudioForItems(enabledWithAudio);
          } else {
            console.log('[AffirmationProvider] No data from API, using local affirmations');
            setPlaylist(createInitialAffirmations());
          }
        }
      } catch (err) {
        console.error('[AffirmationProvider] Failed to load affirmations:', err);
        if (mountedRef.current) {
          setPlaylist(createInitialAffirmations());
        }
      }

      if (mountedRef.current) {
        setIsLoading(false);
      }
    }

    loadData();

    return () => {
      mountedRef.current = false;
    };
  }, [isAuthenticated, authLoading, preloadAudioForItems]);

  // Set voice volume - update all cached audio elements
  const setVoiceVolume = useCallback((vol) => {
    setVoiceVolumeState(vol);

    // Update current playing audio
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }

    // Update all cached audio elements
    audioCacheRef.current.forEach(audio => {
      audio.volume = vol;
    });
  }, []);

  // Get enabled items
  const enabledItems = useMemo(() =>
    playlist.filter(item => item.enabled),
    [playlist]
  );

  // Get items with server audio available
  const itemsWithServerAudio = useMemo(() =>
    playlist.filter(item => item.audioUrl),
    [playlist]
  );

  // Get enabled items with audio (sorted by order)
  const enabledItemsWithAudio = useMemo(() =>
    enabledItems
      .filter(item => item.audioUrl)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [enabledItems]
  );

  // Get all enabled items sorted by order (for playback including those without audio)
  const enabledItemsSorted = useMemo(() =>
    [...enabledItems].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [enabledItems]
  );

  // Count of items with server audio
  const serverAudioCount = itemsWithServerAudio.length;

  // Current affirmation text - use sessionItems if available, otherwise enabledItemsSorted
  const activeItems = sessionItems.length > 0 ? sessionItems : enabledItemsSorted;

  const currentAffirmation = activeItems.length > 0
    ? activeItems[currentIndex % activeItems.length]?.text || ''
    : '';

  // Current item
  const currentItem = activeItems.length > 0
    ? activeItems[currentIndex % activeItems.length]
    : null;

  // Shuffle array utility
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Prepare session with selected categories and optional shuffle
  const prepareSession = useCallback((categoryIds, shuffle = false) => {
    // Filter playlist by selected categories and only items with audio
    let items = playlist.filter(item =>
      categoryIds.includes(item.categoryId) && item.audioUrl
    );

    // Sort by order
    items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Shuffle if requested
    if (shuffle) {
      items = shuffleArray(items);
    }

    // Preload audio for session items
    preloadAudioForItems(items);

    setSessionItems(items);
    setCurrentIndex(0);

    console.log('[AffirmationProvider] Session prepared:', items.length, 'items, shuffle:', shuffle);
  }, [playlist, preloadAudioForItems]);

  // Store refs for use in callbacks
  const stateRef = useRef({
    enabledItemsWithAudio,
    enabledItemsSorted,
    sessionItems,
    activeItems,
    isRunning,
    gapBetweenSec,
    voiceVolume
  });

  useEffect(() => {
    stateRef.current = {
      enabledItemsWithAudio,
      enabledItemsSorted,
      sessionItems,
      activeItems,
      isRunning,
      gapBetweenSec,
      voiceVolume
    };
  }, [enabledItemsWithAudio, enabledItemsSorted, sessionItems, activeItems, isRunning, gapBetweenSec, voiceVolume]);

  // Play audio from cache or URL
  const playAudio = useCallback((url) => {
    if (!url) return;

    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Get from cache or create new
    let audio = audioCacheRef.current.get(url);

    if (!audio) {
      // Not in cache, create new (shouldn't happen normally)
      audio = new Audio(url);
      audioCacheRef.current.set(url, audio);
    }

    // Reset to beginning
    audio.currentTime = 0;
    audio.volume = stateRef.current.voiceVolume;
    audioRef.current = audio;

    // Setup event handlers
    const handlePlay = () => {
      if (mountedRef.current) {
        setIsPlayingAudio(true);
      }
    };

    const handleEnded = () => {
      if (mountedRef.current) {
        setIsPlayingAudio(false);

        const { isRunning, gapBetweenSec } = stateRef.current;
        if (isRunning) {
          gapTimerRef.current = setTimeout(() => {
            if (mountedRef.current) {
              nextAffirmation();
            }
          }, gapBetweenSec * 1000);
        }
      }
    };

    const handleError = (e) => {
      console.error('Audio playback error:', e);
      if (mountedRef.current) {
        setIsPlayingAudio(false);
      }
    };

    // Remove old handlers and add new ones
    audio.onplay = handlePlay;
    audio.onended = handleEnded;
    audio.onerror = handleError;

    audio.play().catch(console.error);
  }, []);

  // Go to next affirmation
  const nextAffirmation = useCallback(() => {
    const { activeItems, isRunning, gapBetweenSec } = stateRef.current;
    if (activeItems.length === 0) return;

    setCurrentIndex(prevIndex => {
      const nextIndex = (prevIndex + 1) % activeItems.length;
      const nextItem = activeItems[nextIndex];

      // Play next audio if available
      if (nextItem?.audioUrl) {
        playAudio(nextItem.audioUrl);
      } else if (isRunning) {
        // No audio - just show text for a moment then move to next
        // Schedule next affirmation after showing text for 3 seconds + gap
        gapTimerRef.current = setTimeout(() => {
          if (mountedRef.current) {
            nextAffirmation();
          }
        }, 3000 + (gapBetweenSec * 1000));
      }

      return nextIndex;
    });
  }, [playAudio]);

  // Start playback
  const start = useCallback(() => {
    // Use sessionItems if available, otherwise enabledItemsSorted
    const itemsToPlay = sessionItems.length > 0 ? sessionItems : enabledItemsSorted;

    if (itemsToPlay.length === 0) return false;

    setIsRunning(true);
    setCurrentIndex(0);

    const firstItem = itemsToPlay[0];

    // Play first audio if available
    if (firstItem?.audioUrl) {
      playAudio(firstItem.audioUrl);
    } else {
      // No audio - schedule next after showing text
      gapTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          nextAffirmation();
        }
      }, 3000 + (gapBetweenSec * 1000));
    }

    return true;
  }, [sessionItems, enabledItemsSorted, gapBetweenSec, playAudio, nextAffirmation]);

  // Stop playback
  const stopPlayback = useCallback(() => {
    setIsRunning(false);

    if (gapTimerRef.current) {
      clearTimeout(gapTimerRef.current);
      gapTimerRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setIsPlayingAudio(false);
  }, []);

  // Toggle item enabled state
  const toggleItemEnabled = useCallback(async (itemId) => {
    const item = playlist.find(i => i.id === itemId);
    if (!item) return;

    const newEnabled = !item.enabled;

    // If enabling an item with audio, preload it (if not already cached)
    if (newEnabled && item.audioUrl) {
      preloadAudioUrl(item.audioUrl);
    }

    // Update local state immediately
    setPlaylist(prev => prev.map(i =>
      i.id === itemId ? { ...i, enabled: newEnabled } : i
    ));

    // Sync with API if authenticated
    if (isAuthenticated) {
      try {
        await api.updateAffirmation(itemId, { enabled: newEnabled });
      } catch (err) {
        console.error('Failed to sync affirmation:', err);
      }
    }
  }, [playlist, isAuthenticated, preloadAudioUrl]);

  // Add item to playlist (enable it)
  const addToPlaylist = useCallback(async (itemId) => {
    const item = playlist.find(i => i.id === itemId);
    if (!item || item.enabled) return;

    // Preload audio if available
    if (item.audioUrl) {
      preloadAudioUrl(item.audioUrl);
    }

    // Update local state immediately
    setPlaylist(prev => prev.map(i =>
      i.id === itemId ? { ...i, enabled: true } : i
    ));

    // Sync with API if authenticated
    if (isAuthenticated) {
      try {
        await api.updateAffirmation(itemId, { enabled: true });
      } catch (err) {
        console.error('Failed to add to playlist:', err);
      }
    }
  }, [playlist, isAuthenticated, preloadAudioUrl]);

  // Remove item from playlist (disable it)
  const removeFromPlaylist = useCallback(async (itemId) => {
    const item = playlist.find(i => i.id === itemId);
    if (!item || !item.enabled) return;

    // Update local state immediately
    setPlaylist(prev => prev.map(i =>
      i.id === itemId ? { ...i, enabled: false } : i
    ));

    // Sync with API if authenticated
    if (isAuthenticated) {
      try {
        await api.updateAffirmation(itemId, { enabled: false });
      } catch (err) {
        console.error('Failed to remove from playlist:', err);
      }
    }
  }, [playlist, isAuthenticated]);

  // Reorder items in playlist
  const reorderPlaylist = useCallback(async (sourceIndex, destinationIndex) => {
    if (sourceIndex === destinationIndex) return;

    // Get enabled items with audio (the ones being displayed)
    const currentEnabledItems = playlist.filter(item => item.enabled && item.audioUrl);

    // Reorder the array
    const reordered = [...currentEnabledItems];
    const [movedItem] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, movedItem);

    // Create new order map
    const newOrderMap = new Map();
    reordered.forEach((item, index) => {
      newOrderMap.set(item.id, index);
    });

    // Update all items with new order values
    setPlaylist(prev => prev.map(item => {
      if (newOrderMap.has(item.id)) {
        return { ...item, order: newOrderMap.get(item.id) };
      }
      return item;
    }));

    // Sync with API if authenticated
    if (isAuthenticated) {
      try {
        const updates = reordered.map((item, index) => ({
          id: item.id,
          order: index
        }));
        await api.batchUpdateAffirmations(updates);
      } catch (err) {
        console.error('Failed to sync reorder:', err);
      }
    }
  }, [playlist, isAuthenticated]);

  // Refresh affirmations from API
  const refreshAffirmations = useCallback(async () => {
    try {
      const affirmationsData = isAuthenticated
        ? await api.getAffirmations()
        : await api.getDefaultAffirmations();

      if (affirmationsData.length > 0) {
        const transformed = transformAffirmations(affirmationsData);
        setPlaylist(transformed);

        // Preload only enabled items with audio
        const enabledWithAudio = transformed.filter(item => item.enabled && item.audioUrl);
        preloadAudioForItems(enabledWithAudio);
      }
    } catch (err) {
      console.error('Failed to refresh affirmations:', err);
    }
  }, [isAuthenticated, preloadAudioForItems]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gapTimerRef.current) {
        clearTimeout(gapTimerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      // Clear audio cache
      audioCacheRef.current.clear();
    };
  }, []);

  const value = {
    playlist,
    categories,
    sessionItems,
    currentIndex,
    gapBetweenSec,
    isRunning,
    isPlayingAudio,
    isLoading,
    voiceVolume,
    enabledItems,
    enabledItemsSorted,
    enabledItemsWithAudio,
    itemsWithServerAudio,
    serverAudioCount,
    currentAffirmation,
    currentItem,
    setGapBetweenSec,
    setVoiceVolume,
    prepareSession,
    start,
    stop: stopPlayback,
    toggleItemEnabled,
    addToPlaylist,
    removeFromPlaylist,
    reorderPlaylist,
    refreshAffirmations,
  };

  return (
    <AffirmationContext.Provider value={value}>
      {children}
    </AffirmationContext.Provider>
  );
}

export function useAffirmation() {
  const context = useContext(AffirmationContext);
  if (!context) {
    throw new Error('useAffirmation must be used within an AffirmationProvider');
  }
  return context;
}
