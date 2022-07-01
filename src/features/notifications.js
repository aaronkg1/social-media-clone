import { createSlice } from "@reduxjs/toolkit";

export const notificationsSlice = createSlice({
  name: "notifications",
  initialState: { unread: [], read: [] },
  reducers: {
    getUnreadNotifications: (state, action) => {
      state.unread = action.payload;
    },
    getReadNotifications: (state, action) => {
      state.read = action.payload;
    },
  },
});
export const { getUnreadNotifications, getReadNotifications } =
  notificationsSlice.actions;
export default notificationsSlice.reducer;
