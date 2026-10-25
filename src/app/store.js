import { configureStore, combineReducers } from '@reduxjs/toolkit';
import receiptReducer from '../features/receipt/receiptSlice';
import friendsReducer from '../features/friends/friendsSlice';
import splitBillReducer from '../features/splitBill/splitBillSlice';
import authReducer from '../features/auth/authSlice';
import uiReducer from '../features/ui/uiSlice';

const appReducer = combineReducers({
  receipt: receiptReducer,
  friends: friendsReducer,
  splitBill: splitBillReducer,
  auth: authReducer,
  ui: uiReducer,
});

const rootReducer = (state, action) => {
  if (action.type === 'app/resetStore') {
    // Keep language + auth across "start new bill"
    state = {
      ...(state?.ui ? { ui: state.ui } : {}),
      ...(state?.auth ? { auth: state.auth } : {}),
    };
  }
  return appReducer(state, action);
};

export const resetStore = () => ({ type: 'app/resetStore' });

const store = configureStore({
  reducer: rootReducer,
});

export default store;
