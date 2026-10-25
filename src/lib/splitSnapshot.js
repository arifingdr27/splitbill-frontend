import {
  normalizeReceiptItems,
  calculateAssignableGrandTotal,
  getGlobalFees,
  calculateParticipantBreakdown,
  getSharedItemsTotal,
  getSharedCostForPerson,
  getPersonPotAmount,
  getPersonPotLines,
} from './splitMath';
import { formatCurrency, getReceiptCurrency } from './formatCurrency';
import { getSplitCompleteLabels } from './pdfLabels';

/**
 * Build a render-ready split-complete snapshot for PDF / share link.
 */
export function buildSplitCompleteSnapshot({
  receiptData,
  friends,
  personAssignments,
  itemPots = {},
  uiLanguage,
}) {
  const t = getSplitCompleteLabels(uiLanguage);
  const allOriginalItems = normalizeReceiptItems(receiptData);
  const fees = getGlobalFees(receiptData);
  const totalReceiptSubtotal = calculateAssignableGrandTotal(allOriginalItems);
  const sharedTotal = getSharedItemsTotal(allOriginalItems);
  const currency = getReceiptCurrency(receiptData);
  const friendIds = friends.map((friend) => friend.id);
  const storeName =
    receiptData?.store_information?.store_name || 'split-bill';

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
    const potAmount = getPersonPotAmount(
      allOriginalItems,
      itemPots,
      participant.id,
      friendIds
    );
    const breakdown = calculateParticipantBreakdown(
      participant.assignedItems,
      allOriginalItems,
      totalReceiptSubtotal,
      fees,
      sharedCost,
      potAmount
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

  const snapshotParticipants = participants.map((participant, personIndex) => {
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
      .filter(Boolean)
      .concat(
        getPersonPotLines(
          allOriginalItems,
          itemPots,
          participant.id,
          friendIds
        ).map((line) => ({
          label: `${line.name} (${t.patunganChip})`,
          amountLabel: formatCurrency(line.amount, currency),
        }))
      );

    const rows = [
      {
        key: 'subtotal',
        label: t.subtotal,
        amountLabel: formatCurrency(breakdown.subtotal, currency),
      },
    ];
    if (fees.discount > 0 && breakdown.discount > 0) {
      rows.push({
        key: 'discount',
        label: t.discount,
        amountLabel: `-${formatCurrency(breakdown.discount, currency)}`,
      });
    }
    (breakdown.fees || []).forEach((fee, feeIndex) => {
      if (!(fee.amount > 0)) return;
      rows.push({
        key: fee.type || `fee-${feeIndex}`,
        label:
          fee.name ||
          t[fee.type === 'service_charge' ? 'serviceCharge' : fee.type] ||
          fee.type,
        amountLabel: formatCurrency(fee.amount, currency),
      });
    });
    if (breakdown.sharedCost > 0) {
      rows.push({
        key: 'sharedCost',
        label: t.sharedCost,
        amountLabel: formatCurrency(breakdown.sharedCost, currency),
      });
    }
    if (participant.additionalFees > 0) {
      rows.push({
        key: 'otherFees',
        label: t.otherFees,
        amountLabel: formatCurrency(participant.additionalFees, currency),
      });
    }

    return {
      name: participant.name,
      avatar: participant.avatar,
      totalLabel: formatCurrency(breakdown.totalOwed, currency),
      items,
      rows,
    };
  });

  return {
    storeName,
    languageCode: uiLanguage,
    currency,
    grandTotalLabel: formatCurrency(grandTotalAssigned, currency),
    participants: snapshotParticipants,
  };
}
