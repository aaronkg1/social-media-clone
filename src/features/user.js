import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { firestoreDatabase } from "../firebase/firebase.config";
import { doc, getDoc } from "firebase/firestore";

export const fetchUserInfo = createAsyncThunk(
  "user/fetchByID",
  async (userID) => {
    const currentUserInfo = doc(firestoreDatabase, "users", userID);
    return getDoc(currentUserInfo);
  }
);

export const userSlice = createSlice({
  name: "user",
  initialState: { user: null, status: null },
  reducers: {
    signOutReducer: (state, action) => {
      state.status = null;
      state.user = null;
    },
  },
  extraReducers: {
    [fetchUserInfo.pending]: (state, action) => {
      state.status = "loading";
    },
    [fetchUserInfo.fulfilled]: (state, action) => {
      state.status = "success";
      state.user = action.payload.data();
    },
    [fetchUserInfo.rejected]: (state, action) => {
      state.status = "failed";
    },
  },
});

export default userSlice.reducer;
export const { signOutReducer } = userSlice.actions;
