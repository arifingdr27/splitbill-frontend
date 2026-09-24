import { parseMoneyAmount } from './formatCurrency';

export const DEFAULT_RECEIPT = {
  image_url: 'https://via.placeholder.com/300x200?text=Receipt+Image',
  store_information: { store_name: 'Unknown Shop', address: 'N/A' },
  transaction_information: { date: 'N/A' },
  currency: {
    code: 'IDR',
    symbol: 'Rp',
    name: 'Indonesian Rupiah',
    confidence: 'high',
  },
  language: {
    code: 'id',
    name: 'Indonesian',
    confidence: 'high',
  },
  totals: {
    total: 0.0,
    discount: 0.0,
    fees: [],
    tax: { total_tax: 0.0, dpp: 0.0, amount: 0.0, service_charge: 0.0 },
    payment: 0.0,
  },
  service_charge: 0.0,
  items: [],
};

/** API v2 puts service_charge under totals.tax; older shape uses top-level. */
export function getServiceCharge(receipt) {
  const top = receipt?.service_charge;
  if (top !== undefined && top !== null && top !== '') {
    return parseMoneyAmount(top);
  }
  return parseMoneyAmount(receipt?.totals?.tax?.service_charge) || 0;
}

function normalizeFeeEntry(fee) {
  if (!fee || typeof fee !== 'object') return null;
  const amount = parseMoneyAmount(fee.amount);
  const entry = {
    type: fee.type || 'other',
    name: fee.name || fee.type || 'Fee',
    amount: Number.isFinite(amount) ? amount : 0,
  };
  if (fee.rate !== undefined && fee.rate !== null && fee.rate !== '') {
    entry.rate = fee.rate;
  }
  return entry;
}

function buildFeesFromLegacy(receipt) {
  const fees = [];

  const serviceCharge = getServiceCharge(receipt);
  const hasService =
    (receipt?.service_charge !== undefined &&
      receipt?.service_charge !== null &&
      receipt?.service_charge !== '') ||
    (receipt?.totals?.tax?.service_charge !== undefined &&
      receipt?.totals?.tax?.service_charge !== null &&
      receipt?.totals?.tax?.service_charge !== '');
  if (hasService && serviceCharge !== 0) {
    fees.push({
      type: 'service_charge',
      name: 'Service Charge',
      amount: serviceCharge,
    });
  }

  const taxAmount = getTaxAmount(receipt);
  const hasTax =
    receipt?.totals?.tax?.amount !== undefined ||
    receipt?.totals?.tax?.total_tax !== undefined;
  if (hasTax && taxAmount !== 0) {
    fees.push({
      type: 'tax',
      name: receipt?.totals?.tax?.name || 'Tax',
      amount: taxAmount,
    });
  }

  if (
    receipt?.tax_amount !== undefined &&
    receipt?.tax_amount !== null &&
    receipt?.tax_amount !== ''
  ) {
    const additional = parseMoneyAmount(receipt.tax_amount);
    if (additional !== 0) {
      fees.push({
        type: 'tax',
        name: 'Additional Tax',
        amount: additional,
      });
    }
  }

  return fees;
}

/** Normalized fee list: totals.fees[] when present, else legacy fallback. */
export function getFees(receipt) {
  const raw = receipt?.totals?.fees;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map(normalizeFeeEntry).filter(Boolean);
  }
  return buildFeesFromLegacy(receipt);
}

export function sumFees(fees, types) {
  const list = Array.isArray(fees) ? fees : [];
  const filtered =
    Array.isArray(types) && types.length > 0
      ? list.filter((fee) => types.includes(fee.type))
      : list;
  return filtered.reduce(
    (sum, fee) => sum + (Number(fee.amount) || 0),
    0
  );
}

/** Keep legacy tax/service fields in sync after editing fees[]. */
export function syncLegacyTotalsFromFees(receipt) {
  if (!receipt || typeof receipt !== 'object') return receipt;

  const fees = getFees(receipt);
  const serviceCharge = sumFees(fees, ['service_charge']);
  const taxTotal = sumFees(fees, ['tax']);
  const firstTax = fees.find((fee) => fee.type === 'tax');

  return {
    ...receipt,
    service_charge: serviceCharge,
    totals: {
      ...receipt.totals,
      fees,
      tax: {
        ...(receipt.totals?.tax || {}),
        amount: taxTotal,
        total_tax: taxTotal,
        service_charge: serviceCharge,
        ...(firstTax?.name ? { name: firstTax.name } : {}),
      },
    },
  };
}

/** Lift nested service_charge; always ensure totals.fees is an array. */
export function normalizeReceiptResponse(receipt) {
  if (!receipt || typeof receipt !== 'object') return receipt;

  const nested = receipt?.totals?.tax?.service_charge;
  const hasTopLevel =
    receipt.service_charge !== undefined && receipt.service_charge !== null;

  let next = receipt;
  if (
    !hasTopLevel &&
    nested !== undefined &&
    nested !== null &&
    nested !== ''
  ) {
    next = {
      ...receipt,
      service_charge: parseMoneyAmount(nested),
    };
  }

  const fees = getFees(next);
  return {
    ...next,
    totals: {
      ...(next.totals || {}),
      fees,
    },
  };
}

export function cloneReceipt(receipt) {
  return JSON.parse(JSON.stringify(receipt));
}

export function parseFieldValue(value, type = 'text') {
  if (type === 'number' || type === 'float') {
    return parseMoneyAmount(value);
  }
  if (type === 'integer') {
    return parseInt(value, 10) || 0;
  }
  return value;
}

export function setValueAtPath(obj, path, value) {
  const result = cloneReceipt(obj);
  let current = result;
  const parts = path.split('.');
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
  return result;
}

export function getTaxAmount(receipt) {
  return (
    parseMoneyAmount(receipt?.totals?.tax?.amount) ||
    parseMoneyAmount(receipt?.totals?.tax?.total_tax) ||
    0
  );
}

export function applyTaxDppRule(receipt) {
  const fees = getFees(receipt);
  const currentTax =
    sumFees(fees, ['tax']) || getTaxAmount(receipt);
  const dpp = parseMoneyAmount(receipt?.totals?.tax?.dpp);
  const shouldResetTax = (isNaN(dpp) || dpp === 0) && currentTax > 0;

  if (!shouldResetTax) {
    return { receipt, didResetTax: false };
  }

  const nextFees = fees.map((fee) =>
    fee.type === 'tax' ? { ...fee, amount: 0 } : fee
  );

  return {
    receipt: {
      ...receipt,
      totals: {
        ...receipt.totals,
        fees: nextFees,
        tax: {
          ...receipt.totals.tax,
          total_tax: 0,
          amount: 0,
        },
      },
    },
    didResetTax: true,
  };
}

export function getDppForTotalDisplay(receipt) {
  const totalDisplayValue = parseMoneyAmount(receipt?.totals?.total);
  const dppFromTax = parseMoneyAmount(receipt?.totals?.tax?.dpp);

  if (
    isNaN(dppFromTax) ||
    dppFromTax === 0 ||
    dppFromTax === totalDisplayValue
  ) {
    return totalDisplayValue;
  }
  return dppFromTax;
}

export function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}
