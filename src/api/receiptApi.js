import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://splitbill.inviteweeding.my.id';

export async function uploadReceiptImage(imageBlob) {
  const formData = new FormData();
  formData.append('image', imageBlob, 'receipt.png');

  const response = await axios.post(API_BASE_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export function getUploadErrorMessage(error) {
  if (error.response) {
    return `Error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`;
  }
  if (error.request) {
    return 'Tidak ada respons dari server. Periksa koneksi internet Anda.';
  }
  return error.message
    ? `Terjadi kesalahan: ${error.message}`
    : 'Gagal mengunggah resi. Silakan coba lagi.';
}
