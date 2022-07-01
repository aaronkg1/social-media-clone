import { updateProfile } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import {
  auth,
  firebaseStorage,
  firestoreDatabase,
} from "../firebase/firebase.config";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { fetchUserInfo, signOutReducer } from "../features/user";
import { removeFriendsList } from "../features/friends";
import {
  getUnreadNotifications,
  getReadNotifications,
} from "../features/notifications";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import "../styles/AccountSettings.css";

export const AccountSettings = () => {
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();

  const [uploadMessage, setUploadMessage] = useState(null);
  const fileRef = useRef();

  const handleUpload = async (e) => {
    const acceptedExtensions = ["jpg", "jpeg", "png", "gif"];
    const [file] = e.target.files;
    const fileExtension = file.name.substring(file.name.lastIndexOf(".") + 1);
    if (acceptedExtensions.includes(fileExtension)) {
      setUploadMessage(null);
      const storageRef = ref(
        firebaseStorage,
        `users/${auth.currentUser.uid}/profilePic.jpg`
      );
      const metadata = {
        contentType: "image/jpeg",
      };
      setUploadMessage("Loading");
      await uploadBytes(storageRef, file, metadata).then((snapshot) => {});
      getDownloadURL(storageRef).then(async (url) => {
        const userInfoCopy = { ...user.userInfo };

        await updateDoc(doc(firestoreDatabase, "users", auth.currentUser.uid), {
          userInfo: {
            ...userInfoCopy,
            photoUrl: url,
          },
        });
        delete userInfoCopy.email;
        await updateDoc(
          doc(firestoreDatabase, "publicProfiles", auth.currentUser.uid),
          {
            userInfo: {
              ...userInfoCopy,
              photoUrl: url,
            },
          }
        );
        updateProfile(auth.currentUser, {
          photoURL: url,
        })
          .then(() => {
            setUploadMessage(null);
            dispatch(fetchUserInfo(auth.currentUser.uid));
          })
          .catch((error) => {
            console.log(error);
          });
      });
    } else {
      setUploadMessage("File format not accepted");
    }
  };

  const deleteUserData = async () => {
    try {
      const notificationsRef = collection(firestoreDatabase, "notifications");
      const notificationsQuery = query(
        notificationsRef,
        where("from", "==", auth.currentUser.uid)
      );
      await getDocs(notificationsQuery).then((snapshot) => {
        snapshot.docs.forEach((doc) => {
          deleteDoc(doc.ref);
        });
      });

      const userPostRef = collection(firestoreDatabase, "posts");
      const postQuery = query(
        userPostRef,
        where("authorInfo.id", "==", auth.currentUser.uid)
      );
      const recipientQuery = query(
        userPostRef,
        where("recipient", "==", auth.currentUser.uid)
      );

      await getDocs(postQuery).then((snapshot) => {
        snapshot.docs.forEach((doc) => {
          deleteDoc(doc.ref);
        });
      });
      await getDocs(recipientQuery).then((snapshot) => {
        snapshot.docs.forEach((doc) => {
          deleteDoc(doc.ref);
        });
      });
      const userCommentsRef = collection(firestoreDatabase, "comments");
      const commentsQuery = query(
        userCommentsRef,
        where("author.id", "==", auth.currentUser.uid)
      );
      await getDocs(commentsQuery).then((snapshot) => {
        snapshot.docs.forEach((doc) => {
          deleteDoc(doc.ref);
        });
      });
      const friendShipRef = collection(firestoreDatabase, "friendships");
      const friendShipQuery = query(
        friendShipRef,
        where("usersInRelationship", "array-contains", auth.currentUser.uid)
      );
      await getDocs(friendShipQuery).then((snapshot) => {
        snapshot.docs.forEach((doc) => {
          deleteDoc(doc.ref);
        });
      });

      const usersRef = doc(firestoreDatabase, `users/${auth.currentUser.uid}`);
      await deleteDoc(usersRef);

      const likesRef = collection(firestoreDatabase, "likes");
      const likesQuery = query(
        likesRef,
        where("user", "==", auth.currentUser.uid)
      );
      await getDocs(likesQuery).then((snapshot) => {
        snapshot.docs.forEach((doc) => {
          deleteDoc(doc.ref);
        });
      });

      const messagesRef = collection(firestoreDatabase, "messages");
      const messagesQuery = query(
        messagesRef,
        where("fromUser", "==", auth.currentUser.uid)
      );
      await getDocs(messagesQuery).then((snapshot) => {
        snapshot.docs.forEach((doc) => {
          deleteDoc(doc.ref);
        });
      });
      const receivedMessagesQuery = query(
        messagesRef,
        where("toUser", "==", auth.currentUser.uid)
      );
      await getDocs(receivedMessagesQuery).then((snapshot) => {
        snapshot.docs.forEach((doc) => {
          deleteDoc(doc.ref);
        });
      });
      const publicProfileRef = doc(
        firestoreDatabase,
        "publicProfiles",
        auth.currentUser.uid
      );

      await deleteDoc(publicProfileRef).then(() => {
        console.log("All User Data Deleted");
      });
    } catch (err) {
      console.log(err);
    }
  };

  const deleteUserAuth = async () => {
    try {
      auth.currentUser.delete();
    } catch (err) {
      console.log(err);
    }
  };

  return auth.currentUser !== null ? (
    <div className="settings-container">
      <div className="change-profile-pic">
        <h3>Change Profile Picture</h3>
        <div className="flex align center">
          <img
            src={user.userInfo.photoUrl}
            alt={user.userInfo.id}
            className="avatar large"
            onClick={() => {
              fileRef.current.click();
            }}
          />
          {uploadMessage === "loading" ? (
            <AiOutlineLoading3Quarters className="loading" />
          ) : null}
        </div>
        <input
          type="file"
          hidden
          ref={fileRef}
          multiple={false}
          onChange={handleUpload}
        />
      </div>
      <div className="flex align column">
        <h1>Click the button below to delete account and wipe all user data</h1>
        <p>THIS CANNOT BE UNDONE</p>
        <button
          onClick={async () => {
            await deleteUserData();
            await deleteUserAuth();
            dispatch(getUnreadNotifications([]));
            dispatch(getReadNotifications([]));
            dispatch(removeFriendsList());
            dispatch(signOutReducer());
          }}
        >
          DELETE ACCOUNT
        </button>
      </div>
    </div>
  ) : (
    <Navigate to="/signup" replace />
  );
};
