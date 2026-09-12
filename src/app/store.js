import { configureStore, combineReducers } from '@reduxjs/toolkit';
import receiptReducer from '../features/receipt/receiptSlice';
import friendsReducer from '../features/friends/friendsSlice';
import splitBillReducer from '../features/splitBill/splitBillSlice';
import authReducer from '../features/auth/authSlice';

const appReducer = combineReducers({
  receipt: receiptReducer,
  friends: friendsReducer,
  splitBill: splitBillReducer,
  auth: authReducer,
});

const rootReducer = (state, action) => {
  if (action.type === 'app/resetStore') {
    state = undefined;
  }
  return appReducer(state, action);
};

export const resetStore = () => ({ type: 'app/resetStore' });

const store = configureStore({
  reducer: rootReducer,
});

export default store;
