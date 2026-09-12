export function getItemId(item, index) {
  if (item.id) return item.id;
  const name = item.name || 'item';
  return `${name.replace(/\s/g, '_').toLowerCase()}_${index}`;
}

export function normalizeReceiptItems(receiptData) {
  return (
    receiptData?.items?.map((item, index) => ({
      ...item,
      id: getItemId(item, index),
      originalQuantity: parseFloat(item.quantity) || 1,
      price: parseFloat(item.price) || 0,
    })) || []
  );
}

export function calculateRemainingQuantity(itemId, items, personAssignments) {
  const item = items.find((i) => i.id === itemId);
  if (!item) return 0;

  let totalAssigned = 0;
  for (const personId in personAssignments) {
    totalAssigned += personAssignments[personId][itemId] || 0;
  }
  return item.originalQuantity - totalAssigned;
}

export function calculatePersonSubtotal(assignedItemsMap, items) {
  let total = 0;
  for (const itemId in assignedItemsMap) {
    const assignedQty = assignedItemsMap[itemId];
    const item = items.find((i) => i.id === itemId);
    if (item) {
      total += assignedQty * (item.price || 0);
    }
  }
  return total;
}

export function calculateGrandTotal(items) {
  return items.reduce(
    (sum, item) => sum + item.originalQuantity * (item.price || 0),
    0
  );
}

export function calculateTotalAssigned(personAssignments, items) {
  let totalAssigned = 0;
  for (const personId in personAssignments) {
    for (const itemId in personAssignments[personId]) {
      const assignedQty = personAssignments[personId][itemId];
      const item = items.find((i) => i.id === itemId);
      if (item) {
        totalAssigned += assignedQty * (item.price || 0);
      }
    }
  }
  return totalAssigned;
}

export function getGlobalFees(receiptData) {
  return {
    discount: parseFloat(receiptData?.totals?.discount) || 0,
    serviceCharge: parseFloat(receiptData?.service_charge) || 0,
    tax:
      parseFloat(receiptData?.totals?.tax?.amount) ||
      parseFloat(receiptData?.totals?.tax?.total_tax) ||
      0,
  };
}

export function calculateProportionalDiscount(
  participantSubtotal,
  totalReceiptSubtotal,
  globalDiscount
) {
  if (totalReceiptSubtotal === 0) return 0;
  return (participantSubtotal / totalReceiptSubtotal) * globalDiscount;
}

export function calculateProportionalServiceCharge(
  participantSubtotal,
  discountForParticipant,
  totalReceiptSubtotal,
  globalDiscount,
  globalServiceCharge
) {
  const subtotalAfterDiscount = participantSubtotal - discountForParticipant;
  const totalAfterDiscount = totalReceiptSubtotal - globalDiscount;
  if (totalAfterDiscount <= 0) return 0;
  return (subtotalAfterDiscount / totalAfterDiscount) * globalServiceCharge;
}

export function calculateProportionalTax(
  participantSubtotal,
  discountForParticipant,
  serviceChargeForParticipant,
  totalReceiptSubtotal,
  globalDiscount,
  globalServiceCharge,
  globalTax
) {
  const subtotalAfterDiscountAndService =
    participantSubtotal - discountForParticipant + serviceChargeForParticipant;
  const totalAfterDiscountAndService =
    totalReceiptSubtotal - globalDiscount + globalServiceCharge;
  if (totalAfterDiscountAndService <= 0) return 0;
  return (subtotalAfterDiscountAndService / totalAfterDiscountAndService) * globalTax;
}

export function calculateParticipantBreakdown(
  assignedItemsList,
  items,
  totalReceiptSubtotal,
  fees
) {
  const assignedMap = Object.fromEntries(
    assignedItemsList.map(({ itemId, quantity }) => [itemId, quantity])
  );
  const subtotal = calculatePersonSubtotal(assignedMap, items);
  const discount = calculateProportionalDiscount(
    subtotal,
    totalReceiptSubtotal,
    fees.discount
  );
  const serviceCharge = calculateProportionalServiceCharge(
    subtotal,
    discount,
    totalReceiptSubtotal,
    fees.discount,
    fees.serviceCharge
  );
  const tax = calculateProportionalTax(
    subtotal,
    discount,
    serviceCharge,
    totalReceiptSubtotal,
    fees.discount,
    fees.serviceCharge,
    fees.tax
  );
  const totalOwed = subtotal - discount + serviceCharge + tax;

  return {
    subtotal,
    discount,
    serviceCharge,
    tax,
    taxAndServiceCharge: serviceCharge + tax,
    totalOwed,
  };
}
