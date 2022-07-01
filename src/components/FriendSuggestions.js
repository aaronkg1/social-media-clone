import React, { useEffect, useState } from "react";
import "../styles/FriendSuggestions.css";
import { auth } from "../firebase/firebase.config";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { AddFriendButton } from "./AddFriendButton";
export const FriendSuggestions = () => {
  const users = useSelector((state) => state.allUsers.value);
  const friends = useSelector((state) => state.friends.value);
  const [filteredUsers, setFilteredUsers] = useState(null);
  const friendRequests = useSelector((state) => state.friendRequests.value);

  useEffect(() => {
    const friendIdArray = [];
    friends.forEach((friend) => {
      friendIdArray.push(friend.id);
    });
    let usersArray = users.filter(
      (user) =>
        !friendIdArray.includes(user.userInfo.id) &&
        user.userInfo.id !== auth.currentUser.uid
    );
    setFilteredUsers(usersArray);
  }, [users, friends]);

  useEffect(() => {}, [friendRequests]);

  if (filteredUsers != null) {
    return (
      <div>
        <h1>Friend Suggestions</h1>
        <ul className="suggestions">
          {filteredUsers.map((user) => {
            const { userInfo } = user;
            return (
              <li key={userInfo.id} className="flex align gap--10">
                <Link to={`/users/${userInfo.id}`} className="profile-link">
                  <img
                    src={userInfo.photoUrl}
                    alt={userInfo.firstName}
                    className="friend-suggestion-picture"
                  />
                </Link>
                <Link to={`/users/${userInfo.id}`} className="profile-link">
                  {userInfo.firstName + " " + userInfo.lastName}
                </Link>
                <AddFriendButton userInfo={userInfo} />
              </li>
            );
          })}
        </ul>
      </div>
    );
  } else return <></>;
};
