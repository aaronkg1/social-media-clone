import { createSlice } from "@reduxjs/toolkit";

export const friendRequestsSlice = createSlice({
  name: "friendRequests",
  initialState: { value: [] },
  reducers: {
    saveFriendRequests: (state, action) => {
      state.value = action.payload;
    },
  },
});
export const { saveFriendRequests } = friendRequestsSlice.actions;
export default friendRequestsSlice.reducer;
