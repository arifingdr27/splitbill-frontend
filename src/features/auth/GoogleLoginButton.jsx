import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginWithGoogle } from './authSlice';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function GoogleLoginButton({ onSuccess }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const btnRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google || !btnRef.current) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        if (!response.credential) return;
        try {
          await dispatch(loginWithGoogle(response.credential)).unwrap();
          onSuccess?.();
        } catch {
          // error di authSlice
        }
      },
    });

    window.google.accounts.id.renderButton(btnRef.current, {
      theme: 'outline',
      size: 'large',
      width: 320,
      text: 'continue_with',
    });
  }, [dispatch, onSuccess]);

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
