import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setActivePerson, assignItemToPerson } from './splitBillSlice';
import {
  normalizeReceiptItems,
  calculateRemainingQuantity,
  calculatePersonSubtotal,
  calculateGrandTotal,
  calculateTotalAssigned,
} from '../../lib/splitMath';

function SplitBillPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { receiptData, originalImageUrl } = useSelector((state) => state.receipt);
  const friends = useSelector((state) => state.friends.friends);
  const { activePersonId, personAssignments } = useSelector(
    (state) => state.splitBill
  );

  const items = normalizeReceiptItems(receiptData);

  const peopleWithAssignments = friends.map((friend) => ({
    ...friend,
    assignedItems: personAssignments[friend.id] || {},
    avatar: friend.avatar || `https://i.pravatar.cc/40?img=${friend.id % 20 + 10}`,
  }));

  const grandTotal = calculateGrandTotal(items).toFixed(2);
  const totalAssignedByEveryone = calculateTotalAssigned(
    personAssignments,
    items
  ).toFixed(2);
  const remainingTotal = (
    parseFloat(grandTotal) - parseFloat(totalAssignedByEveryone)
  ).toFixed(2);

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
      if (remainingTotal !== '0.00') {
        const message =
          'Anda memiliki item yang belum dibagi. Apakah Anda yakin ingin meninggalkan halaman ini?';
        event.returnValue = message;
        return message;
      }
      return undefined;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [remainingTotal]);

  const handleAssignItem = (itemId, change) => {
    if (!activePersonId) {
      alert('Silakan pilih orang yang akan mengassign item terlebih dahulu.');
      return;
    }

    const person = peopleWithAssignments.find((p) => p.id === activePersonId);
    const item = items.find((i) => i.id === itemId);

    if (!person || !item) return;

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

  const handleSplitConfirm = () => {
    if (remainingTotal !== '0.00') {
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
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Items</h2>
            <div className="bg-white rounded-lg shadow-sm">
              {items.length === 0 ? (
                <p className="p-4 text-center text-gray-500">
                  No items found in the receipt.
                </p>
              ) : (
                items.map((item) => {
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
                      <div className="flex-grow">
                        <p className="text-gray-700 font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.originalQuantity} item
                          {item.originalQuantity > 1 ? 's' : ''}, IDR{' '}
                          {item.price || 0}
                        </p>
                        {currentRemainingQuantity < item.originalQuantity && (
                          <p className="text-xs text-blue-500">
                            ({item.originalQuantity - currentRemainingQuantity}{' '}
                            assigned, {currentRemainingQuantity} remaining)
                          </p>
                        )}
                      </div>
                      {activePersonId && (
                        <div className="flex items-center space-x-2">
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
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

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
                          {calculatePersonSubtotal(
                            person.assignedItems,
                            items
                          ).toFixed(2)}
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
            <p className="text-gray-800 text-lg font-semibold">Total:</p>
            <p className="text-gray-800 text-lg font-semibold">
              IDR {grandTotal}
            </p>
          </div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600 text-sm">Assigned:</p>
            <p className="text-gray-600 text-sm">{totalAssignedByEveryone}</p>
          </div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600 text-sm">Remaining:</p>
            <p
              className={`text-sm font-semibold ${remainingTotal === '0.00' ? 'text-green-600' : 'text-red-600'}`}
            >
              {remainingTotal}
            </p>
          </div>
          <div className="flex space-x-3 mt-4">
            <button
              onClick={handleSplitConfirm}
              className="flex-1 px-6 py-3 rounded-lg font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={remainingTotal !== '0.00'}
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
