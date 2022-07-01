import { createSlice } from "@reduxjs/toolkit";

export const publicUsersSlice = createSlice({
  name: "allUsers",
  initialState: { value: [] },
  reducers: {
    getAllUsers: (state, action) => {
      state.value = action.payload;
    },
  },
});
export const { getAllUsers } = publicUsersSlice.actions;
export default publicUsersSlice.reducer;
