import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { resetStore } from '../../app/store';
import {
  normalizeReceiptItems,
  calculateAssignableGrandTotal,
  getGlobalFees,
  calculateParticipantBreakdown,
  getSharedItemsTotal,
  getSharedCostForPerson,
} from '../../lib/splitMath';
import {
  formatCurrency,
  getReceiptCurrency,
} from '../../lib/formatCurrency';
import { getReceiptLanguageCode } from '../../lib/receiptLanguage';
import { downloadSplitCompletePdf } from '../../lib/exportSplitPdf';

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

function SplitCompletePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportError, setExportError] = useState('');

  const { receiptData } = useSelector((state) => state.receipt);
  const friends = useSelector((state) => state.friends.friends);
  const { personAssignments } = useSelector((state) => state.splitBill);

  const allOriginalItems = normalizeReceiptItems(receiptData);
  const fees = getGlobalFees(receiptData);
  const totalReceiptSubtotal = calculateAssignableGrandTotal(allOriginalItems);
  const sharedTotal = getSharedItemsTotal(allOriginalItems);
  const currency = getReceiptCurrency(receiptData);
  const languageCode = getReceiptLanguageCode(receiptData);

  const participants = friends.map((friend) => ({
    id: friend.id,
    name: friend.name,
    avatar: `https://i.pravatar.cc/40?img=${friend.id % 20 + 10}`,
    assignedItems: Object.entries(personAssignments[friend.id] || {}).map(
      ([itemId, quantity]) => ({
        itemId,
        quantity,
      })
    ),
    additionalFees: 0.0,
  }));

  const getItemDetails = (itemId) =>
    allOriginalItems.find((item) => item.id === itemId);

  const getBreakdown = (participant, personIndex) => {
    const sharedCost = getSharedCostForPerson(
      sharedTotal,
      participants.length,
      personIndex
    );
    const breakdown = calculateParticipantBreakdown(
      participant.assignedItems,
      allOriginalItems,
      totalReceiptSubtotal,
      fees,
      sharedCost
    );
    return {
      ...breakdown,
      totalOwed: breakdown.totalOwed + (participant.additionalFees || 0),
    };
  };

  const grandTotalAssigned = participants.reduce(
    (sum, p, index) => sum + getBreakdown(p, index).totalOwed,
    0
  );

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
    setExportError('');
    try {
      const storeName =
        receiptData?.store_information?.store_name || 'split-bill';
      await downloadSplitCompletePdf({
        storeName,
        languageCode,
        grandTotalLabel: formatCurrency(grandTotalAssigned, currency),
        participants: participants.map((participant, personIndex) => {
          const breakdown = getBreakdown(participant, personIndex);
          const items = participant.assignedItems
            .map((assigned) => {
              const item = getItemDetails(assigned.itemId);
              if (!item || assigned.quantity === 0) return null;
              return {
                label: `${item.name} x${assigned.quantity}`,
                amountLabel: formatCurrency(
                  (item.price || 0) * assigned.quantity,
                  currency
                ),
              };
            })
            .filter(Boolean);

          const rows = [
            {
              key: 'subtotal',
              amountLabel: formatCurrency(breakdown.subtotal, currency),
            },
          ];
          if (fees.discount > 0 && breakdown.discount > 0) {
            rows.push({
              key: 'discount',
              amountLabel: `-${formatCurrency(breakdown.discount, currency)}`,
            });
          }
          if (breakdown.taxAndServiceCharge > 0) {
            rows.push({
              key: 'taxAndService',
              amountLabel: formatCurrency(
                breakdown.taxAndServiceCharge,
                currency
              ),
            });
          }
          if (breakdown.sharedCost > 0) {
            rows.push({
              key: 'sharedCost',
              amountLabel: formatCurrency(breakdown.sharedCost, currency),
            });
          }
          if (participant.additionalFees > 0) {
            rows.push({
              key: 'otherFees',
              amountLabel: formatCurrency(
                participant.additionalFees,
                currency
              ),
            });
          }

          return {
            name: participant.name,
            totalLabel: formatCurrency(breakdown.totalOwed, currency),
            items,
            rows,
          };
        }),
      });
    } catch (error) {
      console.error('Failed to export PDF', error);
      setExportError('Gagal export PDF. Coba lagi.');
    } finally {
      setExportingPdf(false);
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
            Split Complete
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
              <p className="text-lg">Total</p>
            </div>
            <p className="text-sm text-gray-600 ml-8">
              You paid: {formatCurrency(grandTotalAssigned, currency)}
            </p>
          </div>

          {participants.length === 0 ? (
            <p className="p-4 text-center text-gray-500">
              No participants found or items assigned.
            </p>
          ) : (
            participants.map((participant, personIndex) => {
              const breakdown = getBreakdown(participant, personIndex);
              return (
                <div key={participant.id} className="mb-6">
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
                      <p className="text-md">Total</p>
                      <span className="ml-auto font-bold">
                        {formatCurrency(breakdown.totalOwed, currency)}
                      </span>
                    </div>

                    {participant.assignedItems.length > 0 && (
                      <ul className="list-none p-0 mt-3 border-t border-gray-200 pt-3">
                        {participant.assignedItems.map((assigned, index) => {
                          const item = getItemDetails(assigned.itemId);
                          if (!item || assigned.quantity === 0) return null;
                          return (
                            <li
                              key={index}
                              className="flex justify-between text-gray-700 text-sm mb-1"
                            >
                              <span>
                                {item.name} x{assigned.quantity}
                              </span>
                              <span>
                                {formatCurrency(
                                  (item.price || 0) * assigned.quantity,
                                  currency
                                )}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    <ul className="list-none p-0 mt-3 border-t border-gray-200 pt-3 text-sm text-gray-600">
                      <li className="flex justify-between mb-1">
                        <span>Subtotal</span>
                        <span>
                          {formatCurrency(breakdown.subtotal, currency)}
                        </span>
                      </li>
                      {fees.discount > 0 && breakdown.discount > 0 && (
                        <li className="flex justify-between mb-1 text-red-500 font-semibold">
                          <span>Discount</span>
                          <span>
                            -{formatCurrency(breakdown.discount, currency)}
                          </span>
                        </li>
                      )}
                      {breakdown.taxAndServiceCharge > 0 && (
                        <li className="flex justify-between mb-1">
                          <span>Tax & Service Charge</span>
                          <span>
                            {formatCurrency(
                              breakdown.taxAndServiceCharge,
                              currency
                            )}
                          </span>
                        </li>
                      )}
                      {breakdown.sharedCost > 0 && (
                        <li className="flex justify-between mb-1">
                          <span>Biaya bersama</span>
                          <span>
                            {formatCurrency(breakdown.sharedCost, currency)}
                          </span>
                        </li>
                      )}
                      {participant.additionalFees > 0 && (
                        <li className="flex justify-between mb-1">
                          <span>Other Fees</span>
                          <span>
                            {formatCurrency(
                              participant.additionalFees,
                              currency
                            )}
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-4 flex-none space-y-2">
          {exportError ? (
            <p className="text-sm text-red-500 text-center">{exportError}</p>
          ) : null}
          <button
            type="button"
            className="w-full py-3 rounded-lg font-semibold text-orange-600 border border-orange-400 hover:bg-orange-50 disabled:opacity-50"
            onClick={handleExportPdf}
            disabled={participants.length === 0 || exportingPdf}
          >
            {exportingPdf ? 'Menyiapkan PDF...' : 'Export PDF'}
          </button>
          <button
            type="button"
            className="w-full py-3 rounded-lg font-semibold text-white"
            style={{ backgroundColor: '#ED8936' }}
            onClick={handleStartNewBill}
          >
            Start a new bill
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
              Selesai membagi tagihan?
            </h3>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              Export PDF dulu ya, biar catatan pembagiannya tidak hilang.
              Kalau lanjut, data ini akan terhapus.
            </p>
            <div className="flex flex-col gap-2 mb-3">
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={participants.length === 0 || exportingPdf}
                className="w-full py-2.5 rounded-lg border border-orange-400 text-orange-600 font-semibold hover:bg-orange-50 disabled:opacity-50"
              >
                {exportingPdf ? 'Menyiapkan PDF...' : 'Export PDF sekarang'}
              </button>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelFinish}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Belum
              </button>
              <button
                type="button"
                onClick={handleConfirmFinish}
                className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              >
                Ya, buat baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SplitCompletePage;
