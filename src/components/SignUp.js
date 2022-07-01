import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import {
  firestoreDatabase,
  auth,
  firebaseStorage,
} from "../firebase/firebase.config";
import { setDoc, doc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { useDispatch } from "react-redux";
import { fetchUserInfo } from "../features/user";
import { capitalise } from "./utilities/capitalise";

const SignUp = () => {
  const dispatch = useDispatch();
  const [userDetails, setUserDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const submitUserDetails = () => {
    const firstName = capitalise(userDetails.firstName);
    const lastName = capitalise(userDetails.lastName);
    createUserWithEmailAndPassword(
      auth,
      userDetails.email,
      userDetails.password
    )
      .then(async (userCredential) => {
        const user = userCredential.user;
        const defaultProfilePic = ref(
          firebaseStorage,
          "gs://social-media-clone-e353c.appspot.com/default-profile-icon.png"
        );
        const profilePic = await getDownloadURL(defaultProfilePic);
        updateProfile(user, {
          photoURL: profilePic,
          displayName: firstName,
        });
      })
      .catch((error) => {
        console.log(error.code + " : " + error.message);
      })
      .then(async () => {
        window.localStorage.setItem("emailForSignIn", userDetails.email);
        const defaultProfilePic = ref(
          firebaseStorage,
          "gs://social-media-clone-e353c.appspot.com/default-profile-icon.png"
        );
        const profilePic = await getDownloadURL(defaultProfilePic);
        await setDoc(doc(firestoreDatabase, `users`, auth.currentUser.uid), {
          userInfo: {
            firstName: firstName,
            lastName: lastName,
            displayName: firstName + " " + lastName,
            email: userDetails.email,
            id: auth.currentUser.uid,
            photoUrl: profilePic,
          },
        });
        await setDoc(
          doc(firestoreDatabase, "publicProfiles", auth.currentUser.uid),
          {
            userInfo: {
              firstName: firstName,
              lastName: lastName,
              id: auth.currentUser.uid,
              photoUrl: profilePic,
              displayName: firstName + " " + lastName,
            },
          }
        );
        dispatch(fetchUserInfo(auth.currentUser.uid));
      });
  };
  const updateField = (e) => {
    setUserDetails({ ...userDetails, [e.target.name]: e.target.value });
  };
  return (
    <div>
      <form>
        <label htmlFor="firstName">First Name: </label>
        <input
          id="firstName"
          value={userDetails.firstName}
          name="firstName"
          onChange={updateField}
        />
        <label htmlFor="lastName">Last Name: </label>
        <input
          id="lastName"
          value={userDetails.lastName}
          name="lastName"
          onChange={updateField}
        />
        <label htmlFor="email">Email: </label>
        <input
          type="email"
          id="email"
          name="email"
          value={userDetails.email}
          onChange={updateField}
        />
        <label htmlFor="password">Password: </label>
        <input
          type="password"
          id="password"
          name="password"
          value={userDetails.password}
          onChange={updateField}
          autoComplete="off"
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            submitUserDetails();
          }}
        >
          Sign Up
        </button>
      </form>
      <div>
        <Link to="/signin">
          {" "}
          <p>Already have an account?</p>{" "}
        </Link>
      </div>
    </div>
  );
};

export default SignUp;
