import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { resetStore } from '../../app/store';
import { getShare } from '../../api/shareApi';
import { getSplitCompleteLabels } from '../../lib/pdfLabels';
import LoginRequiredButton from '../../components/LoginRequiredButton';

function WalletIcon({ className = 'h-6 w-6' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}

function SharedSplitPage() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const uiLanguage = useSelector((state) => state.ui.language);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  const languageCode = snapshot?.languageCode || uiLanguage;
  const t = getSplitCompleteLabels(languageCode);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getShare(shareId);
        if (cancelled) return;
        if (!data?.payload) {
          setError('not_found');
          return;
        }
        setSnapshot(data.payload);
      } catch {
        if (!cancelled) setError('not_found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (shareId) load();
    return () => {
      cancelled = true;
    };
  }, [shareId]);

  const handleStartNewBill = () => {
    if (!token) return;
    setShowFinishConfirm(true);
  };

  const handleConfirmFinish = () => {
    setShowFinishConfirm(false);
    dispatch(resetStore());
    navigate('/');
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-screen font-sans"
        style={{ backgroundColor: '#F8F4ED' }}
      >
        <p className="text-gray-600 text-sm">{t.loadingShare}</p>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div
        className="flex flex-col items-center justify-center h-screen font-sans px-4"
        style={{ backgroundColor: '#F8F4ED' }}
      >
        <p className="text-gray-800 font-semibold mb-2">{t.shareNotFound}</p>
        <p className="text-sm text-gray-600 mb-4 text-center">
          {t.shareNotFoundBody}
        </p>
        <button
          type="button"
          className="px-4 py-2 rounded-lg font-semibold text-white"
          style={{ backgroundColor: '#ED8936' }}
          onClick={() => navigate('/')}
        >
          {t.goHome}
        </button>
      </div>
    );
  }

  const participants = snapshot.participants || [];

  return (
    <div
      className="flex flex-col items-center justify-center h-screen font-sans"
      style={{ backgroundColor: '#F8F4ED' }}
    >
      <div className="bg-white rounded-lg shadow-md w-full max-w-xs md:max-w-sm p-4 flex flex-col h-full max-h-[95vh]">
        <div className="flex justify-between items-center pb-4 flex-none">
          <span className="text-xl font-semibold text-gray-800 mx-auto">
            {t.title}
          </span>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700"
            onClick={() => navigate('/')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 min-h-0">
          <div className="mb-6">
            <div className="flex items-center text-gray-800 font-semibold mb-2">
              <WalletIcon className="h-6 w-6 mr-2 text-gray-600" />
              <p className="text-lg">{t.total}</p>
            </div>
            <p className="text-sm text-gray-600 ml-8">
              {t.youPaid}: {snapshot.grandTotalLabel}
            </p>
            {snapshot.storeName ? (
              <p className="text-xs text-gray-500 ml-8 mt-1">
                {snapshot.storeName}
              </p>
            ) : null}
          </div>

          {participants.length === 0 ? (
            <p className="p-4 text-center text-gray-500">{t.noParticipants}</p>
          ) : (
            participants.map((participant, index) => (
              <div key={`${participant.name}-${index}`} className="mb-6">
                <div className="flex items-center mb-3">
                  <img
                    src={
                      participant.avatar ||
                      `https://i.pravatar.cc/40?img=${(index % 20) + 10}`
                    }
                    alt={participant.name}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <h2 className="text-lg font-semibold text-gray-800">
                    {participant.name}
                  </h2>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                  <div className="flex items-center text-gray-800 font-semibold mb-2">
                    <WalletIcon className="h-5 w-5 mr-2 text-gray-600" />
                    <p className="text-md">{t.total}</p>
                    <span className="ml-auto font-bold">
                      {participant.totalLabel}
                    </span>
                  </div>

                  {(participant.items || []).length > 0 && (
                    <ul className="list-none p-0 mt-3 border-t border-gray-200 pt-3">
                      {participant.items.map((item, itemIndex) => (
                        <li
                          key={`${item.label}-${itemIndex}`}
                          className="flex justify-between text-gray-700 text-sm mb-1"
                        >
                          <span>{item.label}</span>
                          <span>{item.amountLabel}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {(participant.rows || []).length > 0 && (
                    <ul className="list-none p-0 mt-3 border-t border-gray-200 pt-3 text-sm text-gray-600">
                      {participant.rows.map((row, rowIndex) => (
                        <li
                          key={`${row.key}-${rowIndex}`}
                          className={`flex justify-between mb-1 ${
                            row.key === 'discount'
                              ? 'text-red-500 font-semibold'
                              : ''
                          }`}
                        >
                          <span>{row.label}</span>
                          <span>{row.amountLabel}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-4 flex-none space-y-2">
          <LoginRequiredButton
            locked={!token}
            className="w-full py-3 rounded-lg font-semibold text-white"
            style={{ backgroundColor: '#ED8936' }}
            onClick={handleStartNewBill}
          >
            {t.startNewBill}
          </LoginRequiredButton>
        </div>
      </div>

      {showFinishConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 px-4">
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shared-finish-title"
          >
            <h3
              id="shared-finish-title"
              className="text-lg font-semibold text-gray-900 mb-2"
            >
              {t.finishConfirmTitle}
            </h3>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              {t.sharedFinishConfirmBody}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowFinishConfirm(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                {t.notYet}
              </button>
              <button
                type="button"
                onClick={handleConfirmFinish}
                className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              >
                {t.confirmNewBill}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SharedSplitPage;
