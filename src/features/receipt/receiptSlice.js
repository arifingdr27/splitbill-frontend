import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { uploadReceiptImage, getUploadErrorMessage } from '../../api/receiptApi';

const initialState = {
  receiptData: null,
  loading: false,
  error: null,
  originalImageUrl: null,
};

export const uploadReceipt = createAsyncThunk(
  'receipt/uploadReceipt',
  async (imageBlob, { rejectWithValue }) => {
    try {
      return await uploadReceiptImage(imageBlob);
    } catch (error) {
      return rejectWithValue(getUploadErrorMessage(error));
    }
  }
);

const receiptSlice = createSlice({
  name: 'receipt',
  initialState,
  reducers: {
    clearReceiptData(state) {
      state.receiptData = null;
      state.error = null;
      state.originalImageUrl = null;
    },
    setOriginalImageUrl(state, action) {
      state.originalImageUrl = action.payload;
    },
    setEditedReceiptData(state, action) {
      state.receiptData = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadReceipt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadReceipt.fulfilled, (state, action) => {
        state.loading = false;
        state.receiptData = action.payload;
        state.error = null;
      })
      .addCase(uploadReceipt.rejected, (state, action) => {
        state.loading = false;
        state.receiptData = null;
        state.error = action.payload || 'Gagal mengunggah resi. Silakan coba lagi.';
      });
  },
});

export const {
  clearReceiptData,
  setOriginalImageUrl,
  setEditedReceiptData,
} = receiptSlice.actions;

export default receiptSlice.reducer;
