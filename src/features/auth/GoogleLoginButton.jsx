import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginWithGoogle } from './authSlice';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const MAX_TRIES = 50;
const RETRY_MS = 100;

function GoogleLoginButton({ onSuccess }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const btnRef = useRef(null);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !btnRef.current) return;

    let cancelled = false;
    let tries = 0;
    let timerId;

    const render = () => {
      if (cancelled || !btnRef.current) return;

      if (!window.google?.accounts?.id) {
        if (tries++ < MAX_TRIES) {
          timerId = setTimeout(render, RETRY_MS);
        }
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          if (!response.credential) return;
          try {
            await dispatch(loginWithGoogle(response.credential)).unwrap();
            onSuccessRef.current?.();
          } catch {
            // error di authSlice
          }
        },
      });

      btnRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
      });
    };

    render();

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [dispatch]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <p className="text-sm text-red-600 text-center">
        VITE_GOOGLE_CLIENT_ID belum di-set.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={btnRef} />
      {loading && <p className="text-sm text-gray-500">Masuk...</p>}
    </div>
  );
}

export default GoogleLoginButton;
