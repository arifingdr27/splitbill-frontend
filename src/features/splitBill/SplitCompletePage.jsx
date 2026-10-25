import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { resetStore } from '../../app/store';
import { downloadSplitCompletePdf } from '../../lib/exportSplitPdf';
import { getSplitCompleteLabels } from '../../lib/pdfLabels';
import { buildSplitCompleteSnapshot } from '../../lib/splitSnapshot';
import { createShare } from '../../api/shareApi';
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

function LinkIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function PdfIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  );
}

async function shareOrCopyUrl(url, title) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, url });
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled';
    }
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return 'copied';
  }
  window.prompt('Copy link:', url);
  return 'prompted';
}

function SplitCompletePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportFailed, setExportFailed] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(null);
  const [shareFailed, setShareFailed] = useState(false);

  const { receiptData } = useSelector((state) => state.receipt);
  const friends = useSelector((state) => state.friends.friends);
  const { personAssignments, itemPots = {} } = useSelector(
    (state) => state.splitBill
  );
  const uiLanguage = useSelector((state) => state.ui.language);
  const token = useSelector((state) => state.auth.token);

  const t = getSplitCompleteLabels(uiLanguage);
  const snapshot = buildSplitCompleteSnapshot({
    receiptData,
    friends,
    personAssignments,
    itemPots,
    uiLanguage,
  });
  const participants = snapshot.participants || [];

  const handleStartNewBill = () => {
    setShowFinishConfirm(true);
  };

  const handleConfirmFinish = () => {
    setShowFinishConfirm(false);
    dispatch(resetStore());
    navigate('/');
  };

  const handleCancelFinish = () => {
    setShowFinishConfirm(false);
  };

  const handleExportPdf = async () => {
    if (participants.length === 0 || exportingPdf) return;
    setExportingPdf(true);
    setExportFailed(false);
    try {
      await downloadSplitCompletePdf({
        storeName: snapshot.storeName,
        languageCode: snapshot.languageCode,
        grandTotalLabel: snapshot.grandTotalLabel,
        participants: participants.map((p) => ({
          name: p.name,
          totalLabel: p.totalLabel,
          items: p.items,
          rows: p.rows,
        })),
      });
    } catch (error) {
      console.error('Failed to export PDF', error);
      setExportFailed(true);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleShareLink = async () => {
    if (participants.length === 0 || sharing || !token) return;
    setSharing(true);
    setShareFailed(false);
    setShareFeedback(null);
    try {
      const result = await createShare(snapshot);
      if (!result?.id) throw new Error('missing share id');
      const url = `${window.location.origin}/s/${result.id}`;
      const outcome = await shareOrCopyUrl(url, snapshot.storeName || t.title);
      if (outcome === 'copied' || outcome === 'prompted') {
        setShareFeedback(t.linkCopied);
      } else if (outcome === 'shared') {
        setShareFeedback(t.linkShared);
      }
    } catch (error) {
      console.error('Failed to share link', error);
      setShareFailed(true);
    } finally {
      setSharing(false);
    }
  };

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
          </div>

          {participants.length === 0 ? (
            <p className="p-4 text-center text-gray-500">{t.noParticipants}</p>
          ) : (
            participants.map((participant, personIndex) => (
              <div key={`${participant.name}-${personIndex}`} className="mb-6">
                <div className="flex items-center mb-3">
                  <img
                    src={participant.avatar}
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
                      {participant.items.map((item, index) => (
                        <li
                          key={`${item.label}-${index}`}
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
          {exportFailed ? (
            <p className="text-sm text-red-500 text-center">{t.exportError}</p>
          ) : null}
          {shareFailed ? (
            <p className="text-sm text-red-500 text-center">{t.shareError}</p>
          ) : null}
          {shareFeedback ? (
            <p className="text-sm text-green-600 text-center">{shareFeedback}</p>
          ) : null}
          <div className="flex gap-2">
            <LoginRequiredButton
              locked={!token}
              wrapperClassName="flex-1 min-w-0"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold text-orange-600 border border-orange-400 hover:bg-orange-50 disabled:opacity-50"
              onClick={handleShareLink}
              disabled={participants.length === 0 || sharing}
            >
              <LinkIcon />
              {sharing ? t.preparingShare : t.shareLink}
            </LoginRequiredButton>
            <button
              type="button"
              className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold text-orange-600 border border-orange-400 hover:bg-orange-50 disabled:opacity-50"
              onClick={handleExportPdf}
              disabled={participants.length === 0 || exportingPdf}
            >
              <PdfIcon />
              {exportingPdf ? t.preparingPdf : t.exportPdf}
            </button>
          </div>
          <button
            type="button"
            className="w-full py-3 rounded-lg font-semibold text-white"
            style={{ backgroundColor: '#ED8936' }}
            onClick={handleStartNewBill}
          >
            {t.startNewBill}
          </button>
        </div>
      </div>

      {showFinishConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 px-4">
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="finish-confirm-title"
          >
            <h3
              id="finish-confirm-title"
              className="text-lg font-semibold text-gray-900 mb-2"
            >
              {t.finishConfirmTitle}
            </h3>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              {t.finishConfirmBody}
            </p>
            <div className="flex gap-2 mb-3">
              <LoginRequiredButton
                locked={!token}
                wrapperClassName="flex-1 min-w-0"
                onClick={handleShareLink}
                disabled={participants.length === 0 || sharing}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-orange-400 text-orange-600 text-sm font-semibold hover:bg-orange-50 disabled:opacity-50"
              >
                <LinkIcon />
                {sharing ? t.preparingShare : t.shareLinkNow}
              </LoginRequiredButton>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={participants.length === 0 || exportingPdf}
                className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-orange-400 text-orange-600 text-sm font-semibold hover:bg-orange-50 disabled:opacity-50"
              >
                <PdfIcon />
                {exportingPdf ? t.preparingPdf : t.exportPdfNow}
              </button>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelFinish}
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

export default SplitCompletePage;
