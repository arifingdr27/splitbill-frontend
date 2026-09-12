import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { resetStore } from '../../app/store';
import {
  normalizeReceiptItems,
  calculateGrandTotal,
  getGlobalFees,
  calculateParticipantBreakdown,
} from '../../lib/splitMath';

function SplitCompletePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { receiptData } = useSelector((state) => state.receipt);
  const friends = useSelector((state) => state.friends.friends);
  const { personAssignments } = useSelector((state) => state.splitBill);

  const allOriginalItems = normalizeReceiptItems(receiptData);
  const fees = getGlobalFees(receiptData);
  const totalReceiptSubtotal = calculateGrandTotal(allOriginalItems);

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

  const getBreakdown = (participant) => {
    const breakdown = calculateParticipantBreakdown(
      participant.assignedItems,
      allOriginalItems,
      totalReceiptSubtotal,
      fees
    );
    return {
      ...breakdown,
      totalOwed: breakdown.totalOwed + (participant.additionalFees || 0),
    };
  };

  const grandTotalAssigned = participants.reduce(
    (sum, p) => sum + getBreakdown(p).totalOwed,
    0
  );

  const handleStartNewBill = () => {
    dispatch(resetStore());
    navigate('/');
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

        <div className="mb-6 flex-none">
          <div className="flex items-center text-gray-800 font-semibold mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2 text-gray-600"
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
            <p className="text-lg">Total</p>
          </div>
          <p className="text-sm text-gray-600 ml-8">
            You paid IDR: {grandTotalAssigned.toFixed(0)}
          </p>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
          {participants.length === 0 ? (
            <p className="p-4 text-center text-gray-500">
              No participants found or items assigned.
            </p>
          ) : (
            participants.map((participant) => {
              const breakdown = getBreakdown(participant);
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
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-gray-600"
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
                      <p className="text-md">Total</p>
                      <span className="ml-auto font-bold">
                        IDR {breakdown.totalOwed.toFixed(0)}
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
                                {(
                                  (item.price || 0) * assigned.quantity
                                ).toFixed(0)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    <ul className="list-none p-0 mt-3 border-t border-gray-200 pt-3 text-sm text-gray-600">
                      <li className="flex justify-between mb-1">
                        <span>Subtotal</span>
                        <span>{breakdown.subtotal.toFixed(0)}</span>
                      </li>
                      {fees.discount > 0 && breakdown.discount > 0 && (
                        <li className="flex justify-between mb-1 text-red-500 font-semibold">
                          <span>Discount</span>
                          <span>-{breakdown.discount.toFixed(0)}</span>
                        </li>
                      )}
                      {breakdown.taxAndServiceCharge > 0 && (
                        <li className="flex justify-between mb-1">
                          <span>Tax & Service Charge</span>
                          <span>
                            {breakdown.taxAndServiceCharge.toFixed(0)}
                          </span>
                        </li>
                      )}
                      {participant.additionalFees > 0 && (
                        <li className="flex justify-between mb-1">
                          <span>Other Fees</span>
                          <span>{participant.additionalFees.toFixed(0)}</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-4 flex-none">
          <button
            className="w-full py-3 rounded-lg font-semibold text-white"
            style={{ backgroundColor: '#ED8936' }}
            onClick={handleStartNewBill}
          >
            Start a new bill
          </button>
        </div>
      </div>
    </div>
  );
}

export default SplitCompletePage;
