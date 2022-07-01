import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { auth } from "../firebase/firebase.config";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import "../styles/NavBar.css";
import { BsFacebook } from "react-icons/bs";
import {
  AiOutlineSearch,
  AiOutlineUsergroupAdd,
  AiOutlineMessage,
} from "react-icons/ai";
import { FiSettings } from "react-icons/fi";
import { GrNotification } from "react-icons/gr";
import { GoSignOut } from "react-icons/go";
import FriendRequests from "./FriendRequests";
import { fetchUserInfo, signOutReducer } from "../features/user";
import { removeFriendsList } from "../features/friends";
import { getAllUsers } from "../features/allUsers";
import Notifications from "./Notifications";
import { SearchBar } from "./Search";

const Navbar = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const notifications = useSelector((state) => state.notifications.unread);
  const friendRequests = useSelector((state) => state.friendRequests.value);
  const [currentUser, setCurrentUser] = useState(null);
  const [logInData, setLogInData] = useState({
    email: "",
    password: "",
  });
  const [userData, setUserData] = useState(null);
  const [dropdownHidden, setDropdownHidden] = useState(true);
  const [notificationDropdownHidden, setNotificationDropdownHidden] =
    useState(true);

  const updateField = (e) => {
    setLogInData({ ...logInData, [e.target.name]: e.target.value });
  };

  const signUserIn = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, logInData.email, logInData.password).then(
      (response) => {
        setCurrentUser(response.user);
      }
    );
  };

  const signOutUser = () => {
    signOut(auth);
    dispatch(signOutReducer());
    dispatch(removeFriendsList());
    dispatch(getAllUsers([]));
    setUserData(null);
    setCurrentUser(null);
    setLogInData({
      email: "",
      password: "",
    });
  };

  const toggleDropdown = () => {
    setDropdownHidden(!dropdownHidden);
    setNotificationDropdownHidden(true);
  };

  const toggleNotificationDropdown = () => {
    setNotificationDropdownHidden(!notificationDropdownHidden);
    setDropdownHidden(true);
  };

  useEffect(() => {
    if (currentUser) {
      fetchUserInfo(currentUser.uid);
    }
  }, [currentUser]);

  useEffect(() => {}, [user]);

  useEffect(() => {}, [dropdownHidden]);
  useEffect(() => {}, [userData]);

  if (user.status !== "success")
    return (
      <nav className="nav">
        <div className="nav-left">
          <Link to="/home">
            <BsFacebook className="logo" />
          </Link>

          <div className="search-bar">
            <AiOutlineSearch className="search-icon" />
            <input type="text" className="search-input"></input>
          </div>
        </div>
        <ul></ul>
        <form>
          <ul className="flex align gap--10">
            <li className="sign-in-nav">
              <label htmlFor="navEmail">Email: </label>
              <input
                type="email"
                id="navEmail"
                name="email"
                value={logInData.email}
                onChange={(e) => {
                  updateField(e);
                }}
              />
            </li>
            <li className="flex align">
              <label htmlFor="navPassword">Password: </label>
              <input
                type="password"
                id="navPassword"
                name="password"
                value={logInData.password}
                autoComplete="on"
                onChange={(e) => {
                  updateField(e);
                }}
              />
            </li>
            <li>
              <button onClick={signUserIn}>Sign In</button>
            </li>
          </ul>
        </form>
      </nav>
    );
  else
    return (
      <nav className="nav">
        <div className="nav-left">
          <Link to="/home">
            <BsFacebook className="logo" />
          </Link>
          <SearchBar />
        </div>
        <ul className="nav-right flex align">
          <li>
            <Link
              to={`/users/${auth.currentUser.uid}`}
              className="profile-link"
            >
              <div className="current-user-card">
                <img
                  className="avatar small"
                  alt={auth.currentUser.displayName}
                  src={auth.currentUser.photoURL}
                ></img>
                <p>{auth.currentUser.displayName}</p>
              </div>
            </Link>
          </li>
          <li className="notifications-nav">
            <GrNotification
              className="notification-symbol"
              onClick={toggleNotificationDropdown}
            />
            {notificationDropdownHidden && notifications.length !== 0 ? (
              <p className="notifications-indicator">
                <span className="notification-span">
                  {notifications.length}
                </span>
              </p>
            ) : null}
          </li>

          <Notifications
            toggleDropdown={toggleNotificationDropdown}
            dropdownHidden={notificationDropdownHidden ? true : false}
          />
          <li className="messages-nav">
            <Link to="/messages">
              <AiOutlineMessage className="messages-symbol" />
            </Link>
          </li>
          <li className="friend-request-nav">
            <AiOutlineUsergroupAdd
              onClick={toggleDropdown}
              className="friend-request-symbol"
            />
            {dropdownHidden && friendRequests.length !== 0 ? (
              <p className="friend-request-indicator">
                <span>{friendRequests.length}</span>
              </p>
            ) : null}
          </li>
          <FriendRequests
            dropdownHidden={dropdownHidden ? true : false}
            toggleDropdown={toggleDropdown}
          />
          <li className="user-settings-nav">
            <Link to="/accountsettings">
              <FiSettings className="account-settings-symbol" />
            </Link>
          </li>
          <li className="flex align" onClick={signOutUser}>
            <GoSignOut />
          </li>
        </ul>
      </nav>
    );
};

export default Navbar;
