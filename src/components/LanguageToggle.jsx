import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUiLanguage } from '../features/ui/uiSlice';

function LanguageToggle({ className = '' }) {
  const dispatch = useDispatch();
  const language = useSelector((state) => state.ui.language);

  const btn = (code, label) => {
    const active = language === code;
    return (
      <button
        type="button"
        onClick={() => dispatch(setUiLanguage(code))}
        aria-pressed={active}
        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
          active
            ? 'bg-gray-800 text-white'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      className={`inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 ${className}`}
      role="group"
      aria-label="Language"
    >
      {btn('id', 'ID')}
      {btn('en', 'EN')}
    </div>
  );
}

export default LanguageToggle;
