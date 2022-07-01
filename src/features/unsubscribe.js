import { createSlice } from "@reduxjs/toolkit";

export const unsubscribeSlice = createSlice({
  name: "unsubscribe",
  initialState: {
    value: {
      readNotificationsSub: null,
      unreadNotificationsSub: null,
      friendRequestsSub: null,
    },
  },
  reducers: {
    saveReadNotificationSub: (state, action) => {
      state.value.readNotificationsSub = action.payload;
    },
    saveUnreadNotificationsSub: (state, action) => {
      state.value.unreadNotificationsSub = action.payload;
    },
    saveFriendRequestsSub: (state, action) => {
      state.value.friendRequestsSub = action.payload;
    },
  },
});
export const {
  saveReadNotificationSub,
  saveUnreadNotificationsSub,
  saveFriendRequestsSub,
} = unsubscribeSlice.actions;
export default unsubscribeSlice.reducer;
