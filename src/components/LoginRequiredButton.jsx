import React, { useEffect, useId, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { getUiLabels } from '../lib/pdfLabels';

function LoginRequiredButton({
  locked,
  message,
  className = '',
  disabled = false,
  onClick,
  children,
  type = 'button',
  ...rest
}) {
  const [showTip, setShowTip] = useState(false);
  const tipId = useId();
  const hideTimer = useRef(null);
  const uiLanguage = useSelector((state) => state.ui?.language);
  const tipMessage = message || getUiLabels(uiLanguage).loginRequired;

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const clearHideTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const revealTip = () => {
    clearHideTimer();
    setShowTip(true);
  };

  const scheduleHideTip = () => {
    clearHideTimer();
    hideTimer.current = setTimeout(() => setShowTip(false), 150);
  };

  const handleWrapperClick = (event) => {
    if (!locked) return;
    event.preventDefault();
    revealTip();
    hideTimer.current = setTimeout(() => setShowTip(false), 2000);
  };

  const isDisabled = locked || disabled;

  return (
    <span
      className="relative block w-full"
      onMouseEnter={() => locked && revealTip()}
      onMouseLeave={() => locked && scheduleHideTip()}
      onFocus={() => locked && revealTip()}
      onBlur={() => locked && scheduleHideTip()}
      onClick={handleWrapperClick}
    >
      <button
        type={type}
        className={`${className} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${locked ? 'pointer-events-none' : ''}`}
        disabled={isDisabled}
        onClick={locked ? undefined : onClick}
        aria-describedby={locked && showTip ? tipId : undefined}
        {...rest}
      >
        {children}
      </button>

      {locked && showTip && (
        <span
          id={tipId}
          role="tooltip"
          className="pointer-events-none absolute left-1/2 bottom-full z-20 mb-2 w-max max-w-[min(100%,18rem)] -translate-x-1/2 rounded-md bg-gray-900 px-3 py-2 text-center text-xs font-medium text-white shadow-lg"
        >
          {tipMessage}
          <span
            className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900"
            aria-hidden="true"
          />
        </span>
      )}
    </span>
  );
}

export default LoginRequiredButton;
