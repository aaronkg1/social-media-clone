import {
  deleteDoc,
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  auth,
  firebaseStorage,
  firestoreDatabase,
} from "../firebase/firebase.config";
import { TiDelete } from "react-icons/ti";
import { dateConverter } from "./utilities/dateConverter";
import { IoMdArrowDropright } from "react-icons/io";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { FaRegCommentAlt } from "react-icons/fa";
import { IoMdSend } from "react-icons/io";
import "../styles/Post.css";
import { format } from "date-fns";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Comments } from "./Comments";
import { deleteObject, ref } from "firebase/storage";
export const Post = (props) => {
  const user = useSelector((state) => state.user);
  const { post } = props;
  const [postAuthor, setPostAuthor] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState({});
  const [postDate, setPostDate] = useState(null);
  const [likes, setLikes] = useState(null);
  const [comments, setComments] = useState(null);
  const [postLiked, setPostLiked] = useState(false);
  const [commentsVisibile, setCommentsVisible] = useState(false);
  const [activeComment, setActiveComment] = useState({
    author: user.user.userInfo,
    body: "",
  });

  const getPostDate = () => {
    if (post.date !== null) {
      setPostDate(format(new Date(post.date.toDate()), "dd MMMMMM yyyy"));
    }
  };

  useEffect(() => {
    const commentsRef = collection(firestoreDatabase, "comments");
    const commentsQuery = query(
      commentsRef,
      where("postID", "==", post.postID)
    );
    try {
      getDocs(commentsQuery).then((snapshot) => {
        const postComments = snapshot.docs.map((doc) => {
          return {
            ...doc.data(),
            commentID: doc.id,
            date: dateConverter(doc.data().date.toDate()),
          };
        });
        setComments(postComments);
      });
    } catch (err) {
      console.log(err);
    }
  }, [post.postID]);

  const getAuthorInfo = () => {
    const currentUserInfo = doc(
      firestoreDatabase,
      "publicProfiles",
      post.authorID
    );
    getDoc(currentUserInfo).then((res) => {
      setPostAuthor(res.data());
      setIsLoaded(true);
    });
  };

  const getRecipient = (id) => {
    const recipientRef = doc(firestoreDatabase, "publicProfiles", id);
    getDoc(recipientRef).then((res) => {
      setRecipientInfo({ ...res.data().userInfo });
    });
  };

  const getLikes = async () => {
    try {
      const postLikes = [];
      const likesRef = collection(firestoreDatabase, "likes");
      const likesQuery = query(likesRef, where("postID", "==", post.postID));
      await getDocs(likesQuery).then((res) => {
        res.docs.forEach((doc) => {
          postLikes.push({ ...doc.data(), likeID: doc.id });
        });
      });
      const likesCopy = postLikes.find((like) => {
        // checks likes to see if current user has liked post
        return like.user === auth.currentUser.uid;
      });
      !!likesCopy ? setPostLiked(true) : setPostLiked(false);
      setLikes(postLikes);
    } catch (err) {
      console.log(err);
    }
  };

  const deletePost = async () => {
    if (
      postAuthor.userInfo.id === auth.currentUser.uid ||
      post.recipient === auth.currentUser.uid
    ) {
      try {
        if (post.photoUrl !== null) {
          const photoRef = ref(firebaseStorage, post.photoUrl);
          await deleteObject(photoRef);
        }
      } catch (err) {
        console.log(err);
      }
      const postRef = doc(firestoreDatabase, "posts", post.postID);
      await deleteDoc(postRef);

      const likesRef = collection(firestoreDatabase, "likes");
      const likesQuery = query(likesRef, where("postID", "==", post.postID));
      const likeDocs = await getDocs(likesQuery);
      likeDocs.docs.forEach((doc) => {
        deleteDoc(doc.ref);
      });
      const notifRef = collection(firestoreDatabase, "notifications");
      const notifQuery = query(notifRef, where("postID", "==", post.postID));
      const notifDocs = await getDocs(notifQuery);
      notifDocs.docs.forEach((doc) => {
        deleteDoc(doc.ref);
      });
    } else return;
  };

  const likePost = async () => {
    if (!postLiked) {
      try {
        await addDoc(collection(firestoreDatabase, "likes"), {
          date: serverTimestamp(),
          user: auth.currentUser.uid,
          postID: post.postID,
        });
        setPostLiked(true);
        if (auth.currentUser.uid !== post.authorInfo.id) {
          const notifRef = collection(firestoreDatabase, `notifications`);
          await addDoc(notifRef, {
            date: serverTimestamp(),
            postID: post.postID,
            status: "unread",
            type: "like",
            from: auth.currentUser.uid,
            to: post.authorInfo.id,
          });
        }
      } catch (err) {
        console.log(err);
      }
    } else {
      const likesCopy = likes.find((like) => {
        return like.user === auth.currentUser.uid;
      });
      try {
        const likeRef = doc(firestoreDatabase, "likes", likesCopy.likeID);
        await deleteDoc(likeRef);
        setPostLiked(false);
      } catch (err) {
        console.log(err);
      }
      try {
        const notificationRef = collection(firestoreDatabase, "notifications");
        const notifQuery = query(
          notificationRef,
          where("postID", "==", post.postID),
          where("type", "==", "like"),
          where("from", "==", auth.currentUser.uid)
        );
        await getDocs(notifQuery).then((snapshot) => {
          snapshot.docs.forEach((doc) => {
            deleteDoc(doc.ref);
          });
        });
      } catch (err) {
        console.log(err);
      }
    }
  };

  const handleChange = (e) => {
    setActiveComment({
      ...activeComment,
      [e.target.name]: e.target.value,
    });
  };

  const toggleComments = () => {
    setCommentsVisible(!commentsVisibile);
  };

  const postComment = async () => {
    try {
      const commentsRef = await addDoc(
        collection(firestoreDatabase, "comments"),
        {
          ...activeComment,
          date: serverTimestamp(),
          postID: post.postID,
        }
      );
      if (auth.currentUser.uid !== post.authorInfo.id) {
        const notifRef = collection(firestoreDatabase, `notifications`);
        await addDoc(notifRef, {
          date: serverTimestamp(),
          postID: post.postID,
          status: "unread",
          type: "comment",
          from: auth.currentUser.uid,
          to: post.authorInfo.id,
          commentID: commentsRef.id,
        });
      }

      setActiveComment({
        author: user.user.userInfo,
        body: " ",
      });
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getLikes();
  }, [postLiked]);

  useEffect(() => {}, [postDate]);
  useEffect(() => {
    getPostDate();
    getAuthorInfo();
    getLikes();
    if (post.postType === "toWall") {
      getRecipient(post.recipient);
    }
  }, []);

  useEffect(() => {}, [recipientInfo]);

  return auth.currentUser !== null ? (
    isLoaded ? (
      <div className="post">
        <div className="flex align gap--10">
          <Link
            to={`/users/${postAuthor.userInfo.id}`}
            className="profile-link"
          >
            <img
              className="avatar"
              src={postAuthor.userInfo.photoUrl}
              alt={post.authorInfo.displayName}
            ></img>
          </Link>
          <div className="flex column gap--5">
            {post.postType === "status" ? (
              <h3>
                {
                  <Link
                    to={`/users/${postAuthor.userInfo.id}`}
                    className="profile-link"
                  >
                    {postAuthor.userInfo.displayName}
                  </Link>
                }
                {postAuthor.userInfo.id === auth.currentUser.uid ? (
                  <TiDelete onClick={deletePost} className="delete-post" />
                ) : null}{" "}
              </h3>
            ) : (
              <h3>
                {
                  <Link
                    to={`/users/${postAuthor.userInfo.id}`}
                    className="profile-link"
                  >
                    {postAuthor.userInfo.displayName}
                  </Link>
                }
                <IoMdArrowDropright />
                <Link
                  to={`/users/${recipientInfo.id}`}
                  className="profile-link"
                >
                  {recipientInfo.firstName + " " + recipientInfo.lastName}
                </Link>
                {postAuthor.userInfo.id === auth.currentUser.uid ||
                recipientInfo.id === auth.currentUser.uid ? (
                  <TiDelete onClick={deletePost} className="delete-post" />
                ) : null}
              </h3>
            )}
            <div className="post-date">{postDate}</div>
          </div>
        </div>
        <p className="post-body">{post.body}</p>

        {post.photoUrl ? (
          <div className="post-media-container">
            <img
              src={post.photoUrl}
              alt={post.postID}
              className="post-media"
            ></img>
          </div>
        ) : null}
        <div className="post-interactions flex align">
          {likes !== null ? (
            <p className="flex align gap--5">
              <AiFillLike className="like-icon" />
              {likes.length}
            </p>
          ) : null}
          {comments !== null ? (
            <p
              className="comments-length"
              onClick={toggleComments}
            >{`${comments.length} comments`}</p>
          ) : null}
        </div>
        <div className="post-buttons">
          <div
            className="button-container flex align center gap--5"
            onClick={likePost}
          >
            {postLiked ? (
              <AiOutlineLike className="active-like" />
            ) : (
              <AiOutlineLike />
            )}
            Like
          </div>
          <div className="button-container" onClick={toggleComments}>
            <FaRegCommentAlt /> Comment
          </div>
        </div>
        {commentsVisibile ? (
          <div className="flex column align gap--10 width-100">
            <div className="comment-input">
              <input
                type="text"
                name="body"
                onChange={handleChange}
                value={activeComment.body}
                placeholder={`Commenting as ${user.user.userInfo.displayName}`}
              />
              <IoMdSend onClick={postComment} className="post-comment-icon" />
            </div>

            {comments !== null ? <Comments post={post} /> : null}
          </div>
        ) : null}
      </div>
    ) : null
  ) : null;
};
