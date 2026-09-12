import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activePersonId: null,
  personAssignments: {},
};

const splitBillSlice = createSlice({
  name: 'splitBill',
  initialState,
  reducers: {
    setActivePerson(state, action) {
      state.activePersonId = action.payload;
    },
    assignItemToPerson(state, action) {
      const { personId, itemId, quantityChange } = action.payload;

      if (!state.personAssignments[personId]) {
        state.personAssignments[personId] = {};
      }

      const currentAssignedQty = state.personAssignments[personId][itemId] || 0;
      const newAssignedQty = currentAssignedQty + quantityChange;

      if (newAssignedQty <= 0) {
        delete state.personAssignments[personId][itemId];
      } else {
        state.personAssignments[personId][itemId] = newAssignedQty;
      }

      if (Object.keys(state.personAssignments[personId]).length === 0) {
        delete state.personAssignments[personId];
      }
    },
    resetSplitBillState() {
      return initialState;
    },
  },
});

export const { setActivePerson, assignItemToPerson, resetSplitBillState } =
  splitBillSlice.actions;

export default splitBillSlice.reducer;
