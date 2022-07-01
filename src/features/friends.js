import { createSlice } from "@reduxjs/toolkit";

export const friendsSlice = createSlice({
  name: "friends",
  initialState: { value: [], status: null, updatedFriendsList: null },
  reducers: {
    saveFriendsList: (state, action) => {
      state.value = action.payload;
      state.status = "success";
    },

    removeFriendsList: (state, action) => {
      state.value = [];
      state.status = null;
    },
    saveUpdatedFriendsList: (state, action) => {
      state.updatedFriendsList = action.payload;
    },
  },
});
export const { saveFriendsList, removeFriendsList, saveUpdatedFriendsList } =
  friendsSlice.actions;
export default friendsSlice.reducer;
