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

/** Lift nested service_charge so edit UI and split math share one field. */
export function normalizeReceiptResponse(receipt) {
  if (!receipt || typeof receipt !== 'object') return receipt;

  const nested = receipt?.totals?.tax?.service_charge;
  const hasTopLevel =
    receipt.service_charge !== undefined && receipt.service_charge !== null;

  if (hasTopLevel || nested === undefined || nested === null || nested === '') {
    return receipt;
  }

  return {
    ...receipt,
    service_charge: parseMoneyAmount(nested),
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
  const currentTax = getTaxAmount(receipt);
  const dpp = parseMoneyAmount(receipt?.totals?.tax?.dpp);
  const shouldResetTax = (isNaN(dpp) || dpp === 0) && currentTax > 0;

  if (!shouldResetTax) {
    return { receipt, didResetTax: false };
  }

  return {
    receipt: {
      ...receipt,
      totals: {
        ...receipt.totals,
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
