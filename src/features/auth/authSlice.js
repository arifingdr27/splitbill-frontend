import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginWithGoogleIdToken, fetchQuota } from '../../api/authApi';
import { clearToken, getToken } from '../../api/client';

const initialState = {
  token: getToken(),
  user: null,
  quota: null,
  loading: false,
  error: null,
};

export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (idToken, { rejectWithValue }) => {
    try {
      return await loginWithGoogleIdToken(idToken);
    } catch (error) {
      const msg =
        error.response?.data?.status ||
        error.message ||
        'Login Google gagal';
      return rejectWithValue(msg);
    }
  }
);

export const loadQuota = createAsyncThunk(
  'auth/loadQuota',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchQuota();
    } catch (error) {
      if (error.response?.status === 401) {
        clearToken();
      }
      return rejectWithValue(
        error.response?.data?.status || 'Gagal memuat kuota'
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      clearToken();
      state.token = null;
      state.user = null;
      state.quota = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(loadQuota.fulfilled, (state, action) => {
        state.quota = action.payload;
      })
      .addCase(loadQuota.rejected, (state) => {
        state.quota = null;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
