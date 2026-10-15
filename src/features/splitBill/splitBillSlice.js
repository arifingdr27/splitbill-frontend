import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activePersonId: null,
  personAssignments: {},
  itemPots: {},
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
    setItemPot(state, action) {
      const { itemId, personIds } = action.payload;
      const uniqueIds = [];
      (personIds || []).forEach((personId) => {
        if (!uniqueIds.includes(personId)) uniqueIds.push(personId);
      });
      if (uniqueIds.length < 2) return;

      if (!state.itemPots) state.itemPots = {};
      state.itemPots[itemId] = uniqueIds;
      Object.keys(state.personAssignments).forEach((personId) => {
        if (!state.personAssignments[personId]?.[itemId]) return;
        delete state.personAssignments[personId][itemId];
        if (Object.keys(state.personAssignments[personId]).length === 0) {
          delete state.personAssignments[personId];
        }
      });
    },
    clearItemPot(state, action) {
      if (!state.itemPots) return;
      delete state.itemPots[action.payload];
    },
    resetSplitBillState() {
      return initialState;
    },
  },
});

export const {
  setActivePerson,
  assignItemToPerson,
  setItemPot,
  clearItemPot,
  resetSplitBillState,
} = splitBillSlice.actions;

export default splitBillSlice.reducer;
