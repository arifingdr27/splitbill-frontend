import axios from 'axios';
import { OCR_URL, authHeaders, clearToken } from './client';
import { normalizeReceiptResponse } from '../lib/receiptEdit';

export async function uploadReceiptImage(imageBlob) {
  const formData = new FormData();
  formData.append('image', imageBlob, 'receipt.png');

  const response = await axios.post(OCR_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...authHeaders(),
    },
  });

  return normalizeReceiptResponse(response.data);
}

export function getUploadErrorMessage(error) {
  const status = error.response?.status;
  const body = error.response?.data;

  if (status === 401) {
    clearToken();
    return 'Sesi login berakhir. Silakan login Google lagi.';
  }
  if (status === 402) {
    return (
      body?.data ||
      'Kuota OCR habis. Free limit bulanan sudah terpakai.'
    );
  }
  if (status === 429) {
    return 'Terlalu banyak permintaan. Coba lagi sebentar.';
  }
  if (error.response) {
    const msg = body?.status || body?.message || error.response.statusText;
    return `Error: ${status} - ${msg}`;
  }
  if (error.request) {
    return 'Tidak ada respons dari server. Periksa koneksi internet Anda.';
  }
  return error.message
    ? `Terjadi kesalahan: ${error.message}`
    : 'Gagal mengunggah resi. Silakan coba lagi.';
}
