import React, { useEffect, useRef } from "react";
import { firestoreDatabase, auth } from "../firebase/firebase.config";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useDispatch, useSelector } from "react-redux";
import { saveFriendRequests } from "../features/friendRequests";
import { saveFriendsList } from "../features/friends";

const FriendRequests = (props) => {
  const { dropdownHidden, toggleDropdown } = props;
  const friendRequests = useSelector((state) => state.friendRequests.value);
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const dropdownRef = useRef();

  useEffect(() => {
    const closeDropDownMenu = (e) => {
      if (
        dropdownRef.current &&
        !dropdownHidden &&
        !dropdownRef.current.contains(e.target)
      ) {
        toggleDropdown();
      }
    };
    document.addEventListener("mousedown", closeDropDownMenu);
    return function cleanUp() {
      document.removeEventListener("mousedown", closeDropDownMenu);
    };
  }, [dropdownHidden, toggleDropdown]);

  useEffect(() => {
    // get Friends List
    if (user.status === "success") {
      const colRef = collection(firestoreDatabase, "friendships");
      const query1 = query(
        colRef,
        where("usersInRelationship", "array-contains", auth.currentUser.uid),
        where("status", "==", "accepted")
      );
      const unsub = onSnapshot(query1, (snapshot) => {
        const friendsArray = [];
        snapshot.docs.forEach((doc) => {
          doc.data().fromUser.id !== auth.currentUser.uid
            ? friendsArray.push({ ...doc.data().fromUser, messages: [] })
            : friendsArray.push({ ...doc.data().toUser, messages: [] });
        });
        dispatch(saveFriendsList([...friendsArray]));
      });
      return function cleanUp() {
        unsub();
      };
    }
  }, [dispatch, user.status]);

  // Get Friend Requests
  useEffect(() => {
    if (user.status === "success") {
      const requestCollect = collection(firestoreDatabase, "friendships");
      const q = query(
        requestCollect,
        where("toUser.id", "==", auth.currentUser.uid),
        where("status", "==", "pending")
      );

      const unsub = onSnapshot(q, (querySnapshot) => {
        const requestsArray = querySnapshot.docs.map((doc) => {
          return { ...doc.data(), requestID: doc.id };
        });
        const promiseArray = requestsArray.map((request) => {
          return new Promise((resolve) => {
            getDoc(request.fromUser.user).then((res) => {
              const updatedRequest = {
                ...request,
                ...res.data().userInfo,
              };
              resolve(updatedRequest);
            });
          });
        });
        Promise.all(promiseArray).then((res) => {
          dispatch(saveFriendRequests([...res]));
        });
      });
      return function cleanUp() {
        unsub();
      };
    }
  }, [dispatch, user.status]);

  const rejectRequest = async (request) => {
    const docRef = doc(
      firestoreDatabase,
      "friendships",
      `${request.requestID}`
    );
    await deleteDoc(docRef);
  };

  const acceptRequest = async (request) => {
    // add to friends collection of current user
    const docRef = doc(
      firestoreDatabase,
      "friendships",
      `${request.requestID}`
    );
    await updateDoc(docRef, {
      status: "accepted",
      friendsSince: serverTimestamp(),
    });
  };

  useEffect(() => {}, [friendRequests]);

  if (friendRequests != null) {
    return (
      <div
        className={
          dropdownHidden
            ? "friend-request-dropdown hidden"
            : "friend-request-dropdown"
        }
        ref={dropdownRef}
      >
        {friendRequests.length === 0 ? (
          <ul className="friend-request-list">
            <li className="friend-request">
              <div className="request-from">
                <p>No new friend requests</p>
              </div>
            </li>
          </ul>
        ) : (
          <ul className="friend-request-list">
            {friendRequests.map((request) => {
              return (
                <li key={request.requestID} className="friend-request">
                  <div className="request-from">
                    <img
                      src={request.photoUrl}
                      alt={request.displayName}
                      className="avatar"
                    />
                    <p>{request.displayName}</p>
                  </div>
                  <div className="friend-request-buttons">
                    <button
                      onClick={() => {
                        acceptRequest(request);
                      }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => {
                        rejectRequest(request);
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }
};

export default FriendRequests;
