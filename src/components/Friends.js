import { getDoc } from "firebase/firestore";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { saveUpdatedFriendsList } from "../features/friends";
import "../styles/Friends.css";
const Friends = () => {
  const friendsList = useSelector((state) => state.friends.value);
  const updatedFriendsList = useSelector(
    (state) => state.friends.updatedFriendsList
  );

  const dispatch = useDispatch();

  useEffect(() => {
    const friendsListCopy = [...friendsList];
    const promiseArray = [];
    friendsListCopy.forEach((friend) => {
      promiseArray.push(
        new Promise((resolve) => {
          getDoc(friend.user).then((res) => {
            resolve({ ...friend, ...res.data().userInfo });
          });
        })
      );
    });
    Promise.all(promiseArray).then((res) => {
      dispatch(saveUpdatedFriendsList(res));
    });
  }, [friendsList, dispatch]);

  if (updatedFriendsList != null) {
    return (
      <div>
        <h3>Friends</h3>
        <ul className="friends">
          {updatedFriendsList.map((friend) => {
            return (
              <li key={friend.id}>
                <Link to={`/users/${friend.id}`} className="profile-link">
                  <h4>{friend.displayName}</h4>
                  <img className="avatar" src={friend.photoUrl} alt=""></img>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  } else return <div>No Friends</div>;
};

export default Friends;
