import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Navigate, useMatch } from "react-router-dom";
import { auth, firestoreDatabase } from "../firebase/firebase.config";
import { Post } from "./UserPost";

export const SinglePost = () => {
  const postID = useMatch("posts/:id").params.id;
  const [postInfo, setPostInfo] = useState(null);

  useEffect(() => {
    const getPost = async () => {
      const postRef = doc(firestoreDatabase, `posts/${postID}`);
      await getDoc(postRef).then((res) => {
        setPostInfo({ ...res.data(), postID: postID });
      });
    };
    getPost();
  }, [postID]);

  useEffect(() => {}, [postInfo]);

  if (auth.currentUser.uid !== null) {
    if (postInfo !== null) {
      return (
        <div className="center-page flex column center align">
          <Post post={postInfo} key={postInfo.postID} />
        </div>
      );
    } else {
      <></>;
    }
  } else {
    return <Navigate to="/home" replace />;
  }
};
