import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../features/user";
import friendsReducer from "../features/friends";
import notificationsReducer from "../features/notifications";
import allUsersReducer from "../features/allUsers";
import friendRequestReducer from "../features/friendRequests";
import thunk from "redux-thunk";
const store = configureStore({
  reducer: {
    user: userReducer,
    friends: friendsReducer,
    notifications: notificationsReducer,
    allUsers: allUsersReducer,
    friendRequests: friendRequestReducer,
  },
  middleware: [thunk],
});

export default store;
