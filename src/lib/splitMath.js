import { parseMoneyAmount } from './formatCurrency';
import { getServiceCharge } from './receiptEdit';

const SHARED_NAME_PATTERN =
  /kantong|plastik|bungkus|ongkir|delivery|packing|kemasan|takeaway|take[\s-]?away|tas\b/i;

export function getItemId(item, index) {
  if (item.id) return item.id;
  const name = item.name || 'item';
  return `${name.replace(/\s/g, '_').toLowerCase()}_${index}`;
}

export function guessIsShared(item) {
  if (typeof item?.is_shared === 'boolean') return item.is_shared;
  if (typeof item?.isShared === 'boolean') return item.isShared;
  return SHARED_NAME_PATTERN.test(item?.name || '');
}

export function getItemLineTotal(item) {
  const quantity = parseMoneyAmount(item?.quantity ?? item?.originalQuantity) || 1;
  const price = parseMoneyAmount(item?.price);
  if (item?.total !== undefined && item?.total !== null && item?.total !== '') {
    return parseMoneyAmount(item.total);
  }
  return price * quantity;
}

export function resolveUnitPrice(item) {
  const quantity = parseMoneyAmount(item?.quantity) || 1;
  let price = parseMoneyAmount(item?.price);
  const lineTotal = getItemLineTotal(item);
  const product = price * quantity;

  if (lineTotal > 0 && Math.abs(product - lineTotal) > 0.01) {
    if (Math.abs(price * 1000 * quantity - lineTotal) <= 1) {
      price *= 1000;
    } else if (quantity > 0 && lineTotal > product * 10) {
      price = lineTotal / quantity;
    }
  }

  return price;
}

export function normalizeReceiptItems(receiptData) {
  return (
    receiptData?.items?.map((item, index) => {
      const originalQuantity = parseMoneyAmount(item.quantity) || 1;
      const price = resolveUnitPrice(item);
      const lineTotal = getItemLineTotal({ ...item, price, quantity: originalQuantity });
      return {
        ...item,
        id: getItemId(item, index),
        originalQuantity,
        price,
        isShared: guessIsShared(item),
        lineTotal,
      };
    }) || []
  );
}

export function getAssignableItems(items) {
  return items.filter((item) => !item.isShared);
}

export function getSharedItems(items) {
  return items.filter((item) => item.isShared);
}

export function getSharedItemsTotal(items) {
  return getSharedItems(items).reduce(
    (sum, item) => sum + (item.lineTotal || 0),
    0
  );
}

/** Split amount evenly; remainder cents go to the first people. */
export function splitEvenly(amount, personCount) {
  const totalCents = Math.round((Number(amount) || 0) * 100);
  if (personCount <= 0) return [];

  const base = Math.floor(totalCents / personCount);
  const remainder = totalCents - base * personCount;

  return Array.from({ length: personCount }, (_, index) => {
    const cents = base + (index < remainder ? 1 : 0);
    return cents / 100;
  });
}

export function getSharedCostForPerson(sharedTotal, personCount, personIndex) {
  const parts = splitEvenly(sharedTotal, personCount);
  return parts[personIndex] || 0;
}

export function calculateRemainingQuantity(itemId, items, personAssignments) {
  const item = items.find((i) => i.id === itemId);
  if (!item || item.isShared) return 0;

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
    if (item && !item.isShared) {
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

export function calculateAssignableGrandTotal(items) {
  return calculateGrandTotal(getAssignableItems(items));
}

export function calculateTotalAssigned(personAssignments, items) {
  let totalAssigned = 0;
  for (const personId in personAssignments) {
    for (const itemId in personAssignments[personId]) {
      const assignedQty = personAssignments[personId][itemId];
      const item = items.find((i) => i.id === itemId);
      if (item && !item.isShared) {
        totalAssigned += assignedQty * (item.price || 0);
      }
    }
  }
  return totalAssigned;
}

export function getGlobalFees(receiptData) {
  return {
    discount: parseMoneyAmount(receiptData?.totals?.discount),
    serviceCharge: getServiceCharge(receiptData),
    tax:
      parseMoneyAmount(receiptData?.totals?.tax?.amount) ||
      parseMoneyAmount(receiptData?.totals?.tax?.total_tax) ||
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
  fees,
  sharedCost = 0
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
  const totalOwed = subtotal - discount + serviceCharge + tax + sharedCost;

  return {
    subtotal,
    discount,
    serviceCharge,
    tax,
    taxAndServiceCharge: serviceCharge + tax,
    sharedCost,
    totalOwed,
  };
}
