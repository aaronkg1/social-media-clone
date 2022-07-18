import React, { useEffect, useState } from "react";
import { AiOutlineUserAdd } from "react-icons/ai";
import { TiTick } from "react-icons/ti";
import { useSelector } from "react-redux";
import { firestoreDatabase, auth } from "../firebase/firebase.config";
import {
  doc,
  serverTimestamp,
  collection,
  addDoc,
  where,
  getDocs,
  deleteDoc,
  query,
} from "firebase/firestore";

export const AddFriendButton = (props) => {
  const { userInfo } = props;
  const user = useSelector((state) => state.user);
  const [buttonClicked, setButtonClicked] = useState(null);

  useEffect(() => {
    const friendshipRef = collection(firestoreDatabase, "friendships");
    const friendQuery = query(
      friendshipRef,
      where("status", "==", "pending"),
      where("fromUser.id", "==", auth.currentUser.uid),
      where("toUser.id", "==", userInfo.id)
    );
    getDocs(friendQuery).then((snapshot) => {
      const info = snapshot.docs.map((doc) => {
        return { ...doc.data() };
      });
      if (info.length > 0) {
        setButtonClicked(true);
      } else setButtonClicked(false);
    });
  }, [userInfo.id]);

  const addFriend = async (userInfo) => {
    try {
      await addDoc(collection(firestoreDatabase, `friendships`), {
        fromUser: {
          id: `${auth.currentUser.uid}`,
          firstName: user.user.userInfo.firstName,
          lastName: user.user.userInfo.lastName,
          photoUrl: user.user.userInfo.photoUrl,
          displayName: user.user.userInfo.displayName,
          user: doc(
            firestoreDatabase,
            `publicProfiles/${user.user.userInfo.id}`
          ),
        },
        toUser: {
          id: userInfo.id,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          photoUrl: userInfo.photoUrl,
          displayName: userInfo.displayName,
          user: doc(firestoreDatabase, `publicProfiles/${userInfo.id}`),
        },
        usersInRelationship: [userInfo.id, auth.currentUser.uid],
        joinedIDs: [
          userInfo.id + "_" + auth.currentUser.uid,
          auth.currentUser.uid + "_" + userInfo.id,
        ],
        dateSent: serverTimestamp(),
        status: "pending",
      });
    } catch (error) {
      console.log(error);
    }
  };

  const cancelFriendRequest = async (userInfo) => {
    const colRef = collection(firestoreDatabase, "friendships");
    const q = query(
      colRef,
      where("fromUser.id", "==", auth.currentUser.uid),
      where(`toUser.id`, "==", userInfo.id),
      where(`status`, `==`, `pending`)
    );
    getDocs(q).then((res) => {
      res.docs.forEach((snapshot) => {
        deleteDoc(snapshot.ref);
      });
    });
  };

  return buttonClicked === false ? (
    <AiOutlineUserAdd
      onClick={() => {
        addFriend(userInfo);
        setButtonClicked(true);
      }}
    />
  ) : (
    <TiTick
      onClick={() => {
        cancelFriendRequest(userInfo);
        setButtonClicked(false);
      }}
    />
  );
};
