import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setActivePerson, assignItemToPerson } from './splitBillSlice';
import { setEditedReceiptData } from '../receipt/receiptSlice';
import {
  normalizeReceiptItems,
  calculateRemainingQuantity,
  calculatePersonSubtotal,
  calculateAssignableGrandTotal,
  calculateTotalAssigned,
  getAssignableItems,
  getSharedItems,
  getSharedItemsTotal,
  splitEvenly,
} from '../../lib/splitMath';
import {
  formatCurrency,
  getReceiptCurrency,
} from '../../lib/formatCurrency';
import { cloneReceipt } from '../../lib/receiptEdit';

function PeopleIcon({ className = 'h-4 w-4' }) {
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
        d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m8-4a3 3 0 11-6 0 3 3 0 016 0zM7 10a3 3 0 116 0"
      />
    </svg>
  );
}

function InfoIcon({ className = 'h-4 w-4' }) {
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
        d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
      />
    </svg>
  );
}

function BagIcon({ className = 'h-5 w-5' }) {
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
        d="M16 11V7a4 4 0 10-8 0v4M5 9h14l-1 11H6L5 9z"
      />
    </svg>
  );
}

function SplitBillPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showSharedHelp, setShowSharedHelp] = useState(false);

  const { receiptData, originalImageUrl } = useSelector((state) => state.receipt);
  const friends = useSelector((state) => state.friends.friends);
  const { activePersonId, personAssignments } = useSelector(
    (state) => state.splitBill
  );

  const items = normalizeReceiptItems(receiptData);
  const assignableItems = getAssignableItems(items);
  const sharedItems = getSharedItems(items);
  const sharedTotal = getSharedItemsTotal(items);
  const currency = getReceiptCurrency(receiptData);
  const personCount = friends.length;
  const sharedPerPerson =
    personCount > 0 ? splitEvenly(sharedTotal, personCount)[0] : 0;

  const peopleWithAssignments = friends.map((friend) => ({
    ...friend,
    assignedItems: personAssignments[friend.id] || {},
    avatar: friend.avatar || `https://i.pravatar.cc/40?img=${friend.id % 20 + 10}`,
  }));

  const grandTotal = calculateAssignableGrandTotal(items);
  const totalAssignedByEveryone = calculateTotalAssigned(
    personAssignments,
    items
  );
  const remainingTotal = grandTotal - totalAssignedByEveryone;
  const isFullyAssigned =
    assignableItems.length === 0 || Math.abs(remainingTotal) < 0.005;

  useEffect(() => {
    if (!receiptData || !receiptData.items || receiptData.items.length === 0) {
      navigate('/');
      return;
    }
    if (!friends || friends.length === 0) {
      navigate('/add_friend');
      return;
    }
    if (!activePersonId && friends.length > 0) {
      dispatch(setActivePerson(friends[0].id));
    }
  }, [receiptData, friends, activePersonId, dispatch, navigate]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!isFullyAssigned) {
        const message =
          'Anda memiliki item yang belum dibagi. Apakah Anda yakin ingin meninggalkan halaman ini?';
        event.returnValue = message;
        return message;
      }
      return undefined;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFullyAssigned]);

  const handleAssignItem = (itemId, change) => {
    if (!activePersonId) {
      alert('Silakan pilih orang yang akan mengassign item terlebih dahulu.');
      return;
    }

    const person = peopleWithAssignments.find((p) => p.id === activePersonId);
    const item = items.find((i) => i.id === itemId);

    if (!person || !item || item.isShared) return;

    const currentAssignedQtyForPerson = person.assignedItems[itemId] || 0;
    const newAssignedQtyForPerson = currentAssignedQtyForPerson + change;

    if (newAssignedQtyForPerson < 0) return;

    const currentRemainingQuantityGlobally = calculateRemainingQuantity(
      item.id,
      items,
      personAssignments
    );

    if (
      change > 0 &&
      newAssignedQtyForPerson >
        currentAssignedQtyForPerson + currentRemainingQuantityGlobally
    ) {
      alert(
        `Kuantitas yang tersedia untuk ${item.name} hanya ${currentRemainingQuantityGlobally}.`
      );
      return;
    }
    if (newAssignedQtyForPerson > item.originalQuantity) {
      alert(
        `Kuantitas total untuk ${item.name} hanya ${item.originalQuantity}.`
      );
      return;
    }

    dispatch(
      assignItemToPerson({
        personId: activePersonId,
        itemId,
        quantityChange: change,
      })
    );
  };

  const handleToggleSharedOnSplit = (itemId) => {
    if (!receiptData?.items) return;

    const itemIndex = items.findIndex((item) => item.id === itemId);
    if (itemIndex < 0) return;

    const nextReceipt = cloneReceipt(receiptData);
    const target = nextReceipt.items[itemIndex];
    const nextShared = !Boolean(
      typeof target.is_shared === 'boolean'
        ? target.is_shared
        : typeof target.isShared === 'boolean'
          ? target.isShared
          : items[itemIndex].isShared
    );
    target.is_shared = nextShared;
    delete target.isShared;

    if (nextShared) {
      Object.keys(personAssignments).forEach((personId) => {
        const assignedQty = personAssignments[personId]?.[itemId] || 0;
        if (assignedQty > 0) {
          dispatch(
            assignItemToPerson({
              personId,
              itemId,
              quantityChange: -assignedQty,
            })
          );
        }
      });
    }

    dispatch(setEditedReceiptData(nextReceipt));
  };

  const handleSplitConfirm = () => {
    if (!isFullyAssigned) {
      alert(
        'Belum semua item dibagi habis atau ada kelebihan pembagian. Pastikan total assigned sama dengan grand total.'
      );
      return;
    }
    navigate('/split_complete');
  };

  return (
    <div
      className="flex flex-col items-center justify-center h-screen font-sans"
      style={{ backgroundColor: '#F8F4ED' }}
    >
      <div className="bg-white rounded-lg shadow-md w-full max-w-xs md:max-w-sm flex flex-col h-full max-h-[95vh]">
        <div className="flex justify-between items-center p-4 flex-none">
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={() => navigate(-1)}
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <span className="text-xl font-semibold text-gray-800 mx-auto">
            Split bill
          </span>
          <div className="w-6 h-6"></div>
        </div>

        <div className="flex-grow overflow-y-auto p-4">
          <div className="mb-4 bg-white overflow-hidden flex justify-center items-center">
            {originalImageUrl && (
              <img
                src={originalImageUrl}
                alt="Receipt"
                className="w-full h-auto object-cover rounded-md shadow-sm max-h-48"
              />
            )}
            {!originalImageUrl && (
              <div className="w-full h-32 bg-gray-200 flex items-center justify-center text-gray-500 rounded-md">
                No Receipt Image
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800">Items</h2>
              <button
                type="button"
                onClick={() => setShowSharedHelp((open) => !open)}
                className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium"
                aria-expanded={showSharedHelp}
                aria-controls="shared-help-panel"
              >
                <PeopleIcon className="h-4 w-4" />
                <span>Bagi bareng</span>
                <InfoIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {showSharedHelp && (
              <div
                id="shared-help-panel"
                className="mb-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-3"
              >
                <div className="flex items-center justify-center gap-2 text-orange-700 mb-2">
                  <BagIcon className="h-5 w-5" />
                  <span className="text-base font-semibold">→</span>
                  <PeopleIcon className="h-5 w-5" />
                  <span className="text-base font-semibold">=</span>
                  <span className="text-sm font-semibold">Rp rata</span>
                </div>
                <p className="text-xs text-orange-900 text-center leading-relaxed">
                  Item seperti kantong plastik bisa dibayar bareng.
                  Tekan ikon orang di item, biayanya dibagi rata ke semua.
                </p>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm">
              {assignableItems.length === 0 ? (
                <p className="p-4 text-center text-gray-500">
                  {sharedItems.length > 0
                    ? 'Semua item sudah jadi biaya bersama.'
                    : 'No items found in the receipt.'}
                </p>
              ) : (
                assignableItems.map((item) => {
                  const assignedToActivePerson = activePersonId
                    ? personAssignments[activePersonId]?.[item.id] || 0
                    : 0;
                  const currentRemainingQuantity = calculateRemainingQuantity(
                    item.id,
                    items,
                    personAssignments
                  );

                  return (
                    <div
                      key={item.id}
                      className="flex justify-between items-center px-4 py-3 border-b last:border-b-0"
                    >
                      <div className="flex-grow pr-2">
                        <p className="text-gray-700 font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.originalQuantity} item
                          {item.originalQuantity > 1 ? 's' : ''},{' '}
                          {formatCurrency(item.price || 0, currency)}
                        </p>
                        {currentRemainingQuantity < item.originalQuantity && (
                          <p className="text-xs text-blue-500">
                            ({item.originalQuantity - currentRemainingQuantity}{' '}
                            assigned, {currentRemainingQuantity} remaining)
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleToggleSharedOnSplit(item.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full border border-orange-300 text-orange-600 hover:bg-orange-50"
                          title="Bagi bareng: biaya dibagi rata ke semua orang"
                          aria-label={`Jadikan ${item.name} bagi bareng`}
                        >
                          <PeopleIcon className="h-4 w-4" />
                        </button>
                        {activePersonId && (
                          <>
                            <button
                              onClick={() => handleAssignItem(item.id, -1)}
                              disabled={assignedToActivePerson === 0}
                              className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              -
                            </button>
                            <span className="text-gray-800 font-semibold w-6 text-center">
                              {assignedToActivePerson}
                            </span>
                            <button
                              onClick={() => handleAssignItem(item.id, 1)}
                              disabled={currentRemainingQuantity === 0}
                              className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {sharedItems.length > 0 && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <PeopleIcon className="h-5 w-5 text-orange-600" />
                Biaya bersama
              </h2>
              <p className="text-xs text-gray-500 mb-3">
                Dibagi rata ke semua orang
              </p>
              <div className="bg-white rounded-lg shadow-sm">
                {sharedItems.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 border-b last:border-b-0"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-start gap-2">
                        <BagIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-700 font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(item.lineTotal || 0, currency)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleSharedOnSplit(item.id)}
                        className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                      >
                        Batalkan
                      </button>
                    </div>
                  </div>
                ))}
                <div className="px-4 py-3 bg-orange-50 text-sm text-orange-800">
                  {personCount > 0
                    ? `Dibagi rata ke ${personCount} orang · ${formatCurrency(sharedPerPerson, currency)}/orang`
                    : 'Tambah teman dulu untuk membagi biaya ini.'}
                </div>
              </div>
            </div>
          )}

          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Who&apos;s splitting?
            </h2>
            <div className="bg-white rounded-lg shadow-sm">
              {peopleWithAssignments.length === 0 ? (
                <p className="p-4 text-center text-gray-500">No friends added.</p>
              ) : (
                peopleWithAssignments.map((person) => (
                  <div
                    key={person.id}
                    className={`flex justify-between items-center py-3 px-4 border-b last:border-b-0 cursor-pointer ${activePersonId === person.id ? 'bg-orange-50 ring-2 ring-orange-400' : 'hover:bg-gray-50'}`}
                    onClick={() => dispatch(setActivePerson(person.id))}
                  >
                    <div className="flex items-center">
                      <img
                        src={person.avatar}
                        alt={person.name}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <div>
                        <p className="text-gray-700 font-medium">{person.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(
                            calculatePersonSubtotal(
                              person.assignedItems,
                              items
                            ),
                            currency
                          )}
                        </p>
                        {Object.keys(person.assignedItems).length > 0 && (
                          <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-1">
                            {Object.entries(person.assignedItems).map(
                              ([itemId, assignedQty]) => {
                                const item = items.find((i) => i.id === itemId);
                                return (
                                  <span
                                    key={itemId}
                                    className="bg-gray-100 rounded-full px-2 py-0.5"
                                  >
                                    {item?.name} ({assignedQty})
                                  </span>
                                );
                              }
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-b-lg shadow-sm flex-none">
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-800 text-lg font-semibold">Total item:</p>
            <p className="text-gray-800 text-lg font-semibold">
              {formatCurrency(grandTotal, currency)}
            </p>
          </div>
          {sharedTotal > 0 && (
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-600 text-sm">Biaya bersama:</p>
              <p className="text-gray-600 text-sm">
                {formatCurrency(sharedTotal, currency)}
              </p>
            </div>
          )}
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600 text-sm">Assigned:</p>
            <p className="text-gray-600 text-sm">
              {formatCurrency(totalAssignedByEveryone, currency)}
            </p>
          </div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600 text-sm">Remaining:</p>
            <p
              className={`text-sm font-semibold ${isFullyAssigned ? 'text-green-600' : 'text-red-600'}`}
            >
              {formatCurrency(remainingTotal, currency)}
            </p>
          </div>
          <div className="flex space-x-3 mt-4">
            <button
              onClick={handleSplitConfirm}
              className="flex-1 px-6 py-3 rounded-lg font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isFullyAssigned}
            >
              Split and Charge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SplitBillPage;
