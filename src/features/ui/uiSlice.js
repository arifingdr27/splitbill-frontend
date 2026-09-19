import { createSlice } from '@reduxjs/toolkit';
import { normalizeUiLanguage } from '../../lib/pdfLabels';

const STORAGE_KEY = 'splitbill.uiLanguage';

function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return normalizeUiLanguage(stored);
  } catch {
    // ignore
  }
  return 'id';
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    language: readStoredLanguage(),
  },
  reducers: {
    setUiLanguage(state, action) {
      const language = normalizeUiLanguage(action.payload);
      state.language = language;
      try {
        localStorage.setItem(STORAGE_KEY, language);
      } catch {
        // ignore quota / private mode
      }
    },
  },
});

export const { setUiLanguage } = uiSlice.actions;
export default uiSlice.reducer;
