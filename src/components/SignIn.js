import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { fetchUserInfo } from "../features/user";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../firebase/firebase.config";
import { Link } from "react-router-dom";

const SignIn = () => {
  const dispatch = useDispatch();
  const [currentUser, setCurrentUser] = useState({
    email: "",
    password: "",
  });
  const updateField = (e) => {
    setCurrentUser({ ...currentUser, [e.target.name]: e.target.value });
  };
  const signUserIn = async () => {
    signInWithEmailAndPassword(
      auth,
      currentUser.email,
      currentUser.password
    ).then((response) => {
      dispatch(fetchUserInfo(auth.currentUser.uid));
    });
  };
  if (!auth.currentUser) {
    return (
      <div>
        <form>
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            name="email"
            value={currentUser.name}
            onChange={updateField}
          />
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            name="password"
            value={currentUser.password}
            onChange={updateField}
          />
          <Link to="/fakehome">
            <button
              onClick={(e) => {
                e.preventDefault();
                signUserIn();
              }}
            >
              Sign In
            </button>
          </Link>
        </form>
      </div>
    );
  } else if (!auth.currentUser.emailVerified) {
    return (
      <div>
        <h1>Please confirm email before signing in.</h1>
        <button
          onClick={() => {
            sendEmailVerification(auth.currentUser);
          }}
        >
          Send verification link
        </button>
      </div>
    );
  }
};

export default SignIn;
