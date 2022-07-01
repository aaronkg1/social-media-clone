import React, { useEffect, useRef, useState } from "react";
import { firestoreDatabase } from "../firebase/firebase.config";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { GoPrimitiveDot } from "react-icons/go";
import {
  getUnreadNotifications,
  getReadNotifications,
} from "../features/notifications";
import { auth } from "../firebase/firebase.config";

const Notifications = (props) => {
  const dispatch = useDispatch();
  const { toggleDropdown, dropdownHidden } = props;
  const dropdownRef = useRef();
  const unreadNotifications = useSelector(
    (state) => state.notifications.unread
  );
  const user = useSelector((state) => state.user);
  const readNotifications = useSelector((state) => state.notifications.read);
  const friends = useSelector((state) => state.friends.value);
  const friendsStatus = useSelector((state) => state.friends.status);
  const [detailedNotifications, setDetailedNotifications] = useState(null);
  const [updatedReadNotifications, setUpdatedReadNotifications] =
    useState(null);

  useEffect(() => {
    if (user.status === "success") {
      const notifCollection = collection(firestoreDatabase, `notifications`);
      const notifQuery = query(
        notifCollection,
        where("status", "==", "unread"),
        where("to", "==", auth.currentUser.uid),
        orderBy("date", "desc")
      );
      const unsub = onSnapshot(notifQuery, (querySnapshot) => {
        const notificationsArray = querySnapshot.docs.map((doc) => {
          return {
            ...doc.data(),
            notificationID: doc.id,
          };
        });
        dispatch(getUnreadNotifications(notificationsArray));
      });
      return function cleanUp() {
        unsub();
      };
    }
  }, [dispatch, user.status]);

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
    if (user.status === "success") {
      const notifCollection = collection(firestoreDatabase, `notifications`);
      const notifQuery = query(
        notifCollection,
        where("status", "==", "read"),
        where("to", "==", auth.currentUser.uid),
        orderBy("date", "desc"),
        limit(5)
      );
      const unsub = onSnapshot(notifQuery, (querySnapshot) => {
        const notificationsArray = querySnapshot.docs.map((doc) => {
          return { ...doc.data(), notificationID: doc.id };
        });
        dispatch(getReadNotifications(notificationsArray));
      });

      return function cleanUp() {
        unsub();
      };
    }
  }, [dispatch, user.status]);

  useEffect(() => {
    if (friendsStatus === "success") {
      const updatedNotifications = [];
      unreadNotifications.forEach((notification) => {
        const friend = friends.find((friend) => {
          return friend.id === notification.from;
        });
        if (notification.type === "comment") {
          updatedNotifications.push({
            ...notification,
            fromUser: friend,
            notificationMessage: `${friend.displayName} commented on your post`,
          });
        } else if (notification.type === "like") {
          updatedNotifications.push({
            ...notification,
            fromUser: friend,
            notificationMessage: `${friend.displayName} liked your post`,
          });
        } else if (notification.type === "post") {
          updatedNotifications.push({
            ...notification,
            fromUser: friend,
            notificationMessage: `${friend.displayName} posted on your wall`,
          });
        }
      });
      setDetailedNotifications(updatedNotifications);
    }
  }, [friendsStatus, friends, unreadNotifications]);

  useEffect(() => {
    if (friendsStatus === "success") {
      const updatedNotifications = [];
      readNotifications.forEach((notification) => {
        const friend = friends.find((friend) => {
          return friend.id === notification.from;
        });
        if (notification.type === "comment") {
          updatedNotifications.push({
            ...notification,
            fromUser: friend,
            notificationMessage: `${friend.displayName} commented on your post`,
          });
        }
        if (notification.type === "like") {
          updatedNotifications.push({
            ...notification,
            fromUser: friend,
            notificationMessage: `${friend.displayName} liked your post`,
          });
        }
        if (notification.type === "post") {
          updatedNotifications.push({
            ...notification,
            fromUser: friend,
            notificationMessage: `${friend.displayName} posted on your wall`,
          });
        }
      });
      setUpdatedReadNotifications(updatedNotifications);
    }
  }, [friendsStatus, friends, readNotifications]);

  useEffect(() => {}, [unreadNotifications, readNotifications]);

  const changeNotificationStatus = async (notification) => {
    const notificationRef = doc(
      firestoreDatabase,
      `notifications/${notification.notificationID}`
    );
    await updateDoc(notificationRef, {
      status: "read",
    });
  };

  return (
    <ul
      className={
        dropdownHidden
          ? "notifications-dropdown hidden"
          : "notifications-dropdown"
      }
      ref={dropdownRef}
    >
      {detailedNotifications !== null
        ? detailedNotifications.map((notification) => {
            return (
              <li
                key={notification.notificationID}
                className="notification"
                onClick={() => {
                  changeNotificationStatus(notification);
                  toggleDropdown();
                }}
              >
                {" "}
                <GoPrimitiveDot className="unread-notification-symbol" />
                <img
                  src={notification.fromUser.photoUrl}
                  alt={notification.fromUser.displayName}
                  className="notification-avatar"
                />
                <Link
                  to={`posts/${notification.postID}`}
                  className="link-to-post"
                >
                  {notification.notificationMessage}{" "}
                </Link>
              </li>
            );
          })
        : null}
      {updatedReadNotifications !== null
        ? updatedReadNotifications.map((notification) => {
            return (
              <li
                key={notification.notificationID}
                className="notification read"
                onClick={() => {
                  changeNotificationStatus(notification);
                  toggleDropdown();
                }}
              >
                <GoPrimitiveDot className="read-notification-symbol" />
                <img
                  src={notification.fromUser.photoUrl}
                  alt={notification.fromUser.displayName}
                  className="notification-avatar"
                />
                <Link
                  to={`posts/${notification.postID}`}
                  className="link-to-post"
                >
                  {notification.notificationMessage}{" "}
                </Link>
              </li>
            );
          })
        : null}
    </ul>
  );
};

export default Notifications;
