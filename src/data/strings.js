/**
 * App Strings (Portuguese - Brazil)
 */

export const strings = {
  // App
  appTitle: 'Hypnos',
  appSubtitle: 'Batimentos Binaurais & Sugestões',

  // Home Screen
  play: 'Reproduzir',
  stop: 'Parar',

  // Binaural Beat Controls
  binauralControls: 'Batimentos Binaurais',
  baseFrequency: 'Frequência Base',
  beatFrequency: 'Frequência do Batimento',
  binauralVolume: 'Volume',
  hz: 'Hz',

  // Voice Controls
  voiceControls: 'Sugestões',
  voiceVolume: 'Volume da Sugestão',
  gapBetweenAudio: 'Intervalo entre Sugestões',
  seconds: 'seg',

  // Affirmation Editor
  editAffirmations: 'Editar Sugestões',
  affirmations: 'Sugestões',
  save: 'Salvar',
  cancel: 'Cancelar',
  enableAll: 'Ativar Todas',
  disableAll: 'Desativar Todas',

  // Recording
  record: 'Gravar',
  recording: 'Gravando...',
  stopRecording: 'Parar Gravação',
  cancelRecording: 'Cancelar Gravação',
  preview: 'Pré-visualizar',
  deleteAudio: 'Excluir Áudio',
  importAudio: 'Importar Áudio',
  audioRecorded: 'Áudio gravado',
  noAudio: 'Sem áudio',

  // Messages
  recordingComplete: 'Gravação concluída!',
  recordingCancelled: 'Gravação cancelada',
  audioDeleted: 'Áudio excluído',
  audioImported: 'Áudio importado com sucesso!',
  importFailed: 'Falha ao importar áudio',
  microphonePermissionDenied: 'Permissão do microfone negada',
  noAudioFilesInPlaylist: 'Selecione pelo menos uma sugestão para começar.',
  noAudioSelected: 'Grave áudios para começar',
  recordAudioHint: 'Toque no ícone de edição para gravar sugestões',
  selectAffirmationsHint: 'Selecione sugestões acima para começar',

  // Categories
  categories: {
    financeiro: 'Financeiro',
    saude: 'Saúde',
    sono: 'Sono',
    autoestima: 'Autoestima',
    produtividade: 'Produtividade'
  },

  // Playlist
  playlist: 'Sua Playlist',
  addAffirmation: 'Adicionar',
  removeFromPlaylist: 'Remover da playlist',
  dragToReorder: 'Arraste para reordenar',
  emptyPlaylist: 'Sua playlist está vazia',
  emptyPlaylistHint: 'Adicione afirmações para começar',
  added: 'Adicionado',
  addToPlaylist: 'Adicionar',
  allCategories: 'Todas',

  // Time formatting
  formatDuration: (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  },

  // Summary formatting
  formatBinauralSummary: (baseFreq, beatFreq, volume) => {
    return `${baseFreq}Hz + ${beatFreq}Hz • ${Math.round(volume * 100)}%`;
  },

  formatVoiceSummary: (volume) => {
    return `Volume: ${Math.round(volume * 100)}%`;
  },

  formatAffirmationSummary: (count, gap) => {
    return `${count} com áudio • ${gap}s intervalo`;
  }
};
