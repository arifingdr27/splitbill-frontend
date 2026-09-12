export const DEFAULT_RECEIPT = {
  image_url: 'https://via.placeholder.com/300x200?text=Receipt+Image',
  store_information: { store_name: 'Unknown Shop', address: 'N/A' },
  transaction_information: { date: 'N/A' },
  totals: {
    total: 0.0,
    discount: 0.0,
    tax: { total_tax: 0.0, dpp: 0.0, amount: 0.0 },
    payment: 0.0,
  },
  service_charge: 0.0,
  items: [],
};

export function cloneReceipt(receipt) {
  return JSON.parse(JSON.stringify(receipt));
}

export function parseFieldValue(value, type = 'text') {
  if (type === 'number' || type === 'float') {
    return parseFloat(value) || 0;
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
    parseFloat(receipt?.totals?.tax?.amount) ||
    parseFloat(receipt?.totals?.tax?.total_tax) ||
    0
  );
}

export function applyTaxDppRule(receipt) {
  const currentTax = getTaxAmount(receipt);
  const dpp = parseFloat(receipt?.totals?.tax?.dpp);
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
  const totalDisplayValue = parseFloat(receipt?.totals?.total) || 0;
  const dppFromTax = parseFloat(receipt?.totals?.tax?.dpp);

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
