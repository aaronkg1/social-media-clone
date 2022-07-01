import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  HashRouter,
  BrowserRouter,
} from "react-router-dom";
import SignUp from "./SignUp";
import SignIn from "./SignIn";
import HomePage from "./HomePage";
import Navbar from "./NavBar";
import { auth, firestoreDatabase } from "../firebase/firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { useDispatch, useSelector } from "react-redux";

import { getAllUsers } from "../features/allUsers";
import { fetchUserInfo, signOutReducer } from "../features/user";
import UserProfile from "./UserProfile";

import { SinglePost } from "./SinglePost";
import { AccountSettings } from "./AccountSettings";
import { Messaging } from "./Messaging";

const RouteSwitch = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const friends = useSelector((state) => state.friends);
  const [authState, setAuthState] = useState(false);

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (loggedIn) => {
      if (loggedIn !== null) {
        dispatch(fetchUserInfo(auth.currentUser.uid));
        setAuthState(true);
      } else if (loggedIn === null) {
        dispatch(signOutReducer());
        setAuthState(false);
      }
    });
    return function cleanUp() {
      unSub();
    };
  }, [dispatch]);

  useEffect(() => {
    // get 10 public profiles, necessary for initial friend suggestions
    if (authState) {
      const getPublicProfiles = async () => {
        try {
          if (authState === true && auth.currentUser !== null) {
            let usersArray = [];
            const userCollection = collection(
              firestoreDatabase,
              "publicProfiles"
            );
            const profileQuery = query(userCollection, limit(10));
            const usersSnapshot = await getDocs(profileQuery);
            usersSnapshot.forEach((user) => {
              usersArray.push(user.data());
            });
            dispatch(getAllUsers([...usersArray]));
          }
        } catch (err) {}
      };

      getPublicProfiles();
    }
  }, [authState, dispatch, user.status]);

  useEffect(() => {}, [authState]);

  useEffect(() => {}, [friends]);

  return (
    <BrowserRouter basename={`/${process.env.PUBLIC_URL}`}>
      <Navbar />
      <Routes>
        <Route
          path="/signup"
          element={!authState ? <SignUp /> : <Navigate to="/home" replace />}
        />
        <Route
          path="/signin"
          element={!authState ? <SignIn /> : <Navigate to="/home" replace />}
        />
        <Route path="/home" element={<HomePage />} />
        <Route
          path="/users/:id"
          element={
            authState ? (
              <UserProfile key={window.location.pathname} />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
        <Route
          path="/posts/:id"
          element={
            authState ? <SinglePost /> : <Navigate to="/signin" replace />
          }
        />
        <Route path="/messages" element={<Messaging />} />
        <Route path="/accountsettings" element={<AccountSettings />} />
        <Route path="" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default RouteSwitch;
