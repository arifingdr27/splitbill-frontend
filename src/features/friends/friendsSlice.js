import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  friends: [],
};

const friendsSlice = createSlice({
  name: 'friends',
  initialState,
  reducers: {
    addFriend(state, action) {
      state.friends.push(action.payload);
    },
    updateFriendName(state, action) {
      const { id, name } = action.payload;
      const friend = state.friends.find((f) => f.id === id);
      if (friend) {
        friend.name = name;
      }
    },
    removeFriend(state, action) {
      state.friends = state.friends.filter((friend) => friend.id !== action.payload);
    },
    setFriends(state, action) {
      state.friends = action.payload;
    },
  },
});

export const { addFriend, updateFriendName, removeFriend, setFriends } =
  friendsSlice.actions;

export default friendsSlice.reducer;
