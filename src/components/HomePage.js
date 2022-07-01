import React, { useEffect, useState } from "react";
import { firestoreDatabase, auth } from "../firebase/firebase.config";
import {
  getDocs,
  collection,
  where,
  orderBy,
  limit,
  query,
  onSnapshot,
} from "firebase/firestore";
import { FriendSuggestions } from "./FriendSuggestions";

import Friends from "./Friends";
import { useSelector } from "react-redux";
import { CreatePost } from "./CreatePost";
import "../styles/Home.css";
import { HomeFeed } from "./HomeFeed";
import { Link } from "react-router-dom";

const HomePage = () => {
  const [posts, setPosts] = useState(null);
  const friends = useSelector((state) => state.friends.value);
  const users = useSelector((state) => state.allUsers.value);
  const user = useSelector((state) => state.user);
  const [componentChanged, setComponentChanged] = useState(false);
  const [friendsPosts, setFriendsPosts] = useState(null);
  const [userPosts, setUserPosts] = useState(null);

  useEffect(() => {
    if (auth !== null) {
    }
  }, [componentChanged]);

  const updateComponent = () => {
    setComponentChanged(!componentChanged);
  };

  useEffect(() => {
    if (user.status === "success") {
      const postsRef = collection(firestoreDatabase, "posts");
      const allFriendPosts = [];
      friends.forEach(async (friend) => {
        const friendPostQuery = query(
          postsRef,
          where("authorID", "==", friend.id),
          where("postType", "==", "status"),
          orderBy("date", "desc"),
          limit(2)
        );
        allFriendPosts.push(
          new Promise(async (resolve) => {
            await getDocs(friendPostQuery).then((snapshot) => {
              const friendPosts = snapshot.docs.map((doc) => {
                return { ...doc.data(), postID: doc.id };
              });
              resolve(...friendPosts);
            });
          })
        );
      });
      Promise.all(allFriendPosts).then((res) => {
        setFriendsPosts(res);
      });
    }
  }, [friends, user.status]);

  useEffect(() => {
    if (user.status === "success") {
      const postsRef = collection(firestoreDatabase, "posts");
      const userPostQuery = query(
        postsRef,
        where("authorID", "==", auth.currentUser.uid),
        where("postType", "==", "status"),
        orderBy("date", "desc"),
        limit(3)
      );
      const unsub = onSnapshot(userPostQuery, (snapshot) => {
        setUserPosts(
          snapshot.docs.map((doc) => {
            return { ...doc.data(), postID: doc.id };
          })
        );
      });

      return function cleanUp() {
        unsub();
      };
    }
  }, [user.status]);

  useEffect(() => {
    if (userPosts !== null && friendsPosts !== null) {
      const allPosts = [...userPosts, ...friendsPosts];
      const filteredPosts = allPosts.filter((post) => {
        return post !== undefined;
      });
      setPosts(
        filteredPosts.sort((a, b) => {
          return b.date - a.date;
        })
      );
    }
  }, [userPosts, friendsPosts]);

  useEffect(() => {}, [posts]);

  if (user.status != null && users.length > 0) {
    if (users.length > 0) {
      return (
        <div>
          <div className="flex column align center">
            <CreatePost postType="status" updateComponent={updateComponent} />
          </div>
          <FriendSuggestions />
          <Friends />
          <HomeFeed posts={posts} />
        </div>
      );
    } else return <div>Loading</div>;
  } else if (auth.currentUser === null) {
    return (
      <div>
        <h1 className="welcome-title">Welcome to my social media clone</h1>
        <p className="welcome-message">
          This app was created using the Create React App and Firebase.{" "}
          <Link to="/signup">Sign up here</Link> to start using the App.
        </p>
      </div>
    );
  }
};

export default HomePage;
