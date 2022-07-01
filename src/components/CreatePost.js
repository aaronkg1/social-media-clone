import { addDoc, serverTimestamp, collection } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { IoMdSend } from "react-icons/io";
import { AiFillCamera, AiOutlineLoading3Quarters } from "react-icons/ai";
import { TiDelete } from "react-icons/ti";
import uniqid from "uniqid";
import {
  firebaseStorage,
  auth,
  firestoreDatabase,
} from "../firebase/firebase.config";
import "../styles/CreatePost.css";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

export const CreatePost = (props) => {
  const { postType, recipient, recipientName, updateComponent } = props;
  const user = useSelector((state) => state.user);
  const userStatus = useSelector((state) => state.user.status);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [postContent, setPostContent] = useState({
    body: "",
    photoUrl: null,
    authorID: "",
    date: "",
  });
  const [attachedPic, setAttachedPic] = useState(null);
  const postPicRef = useRef();

  const handleChange = (e) => {
    setPostContent({ ...postContent, [e.target.name]: e.target.value });
  };

  const handleUpload = async (e) => {
    const acceptedExtensions = ["jpg", "jpeg", "png", "gif"];
    const [file] = e.target.files;
    const fileExtension = file.name.substring(file.name.lastIndexOf(".") + 1);
    if (acceptedExtensions.includes(fileExtension)) {
      setUploadStatus("Uploading");
      const storageRef = ref(
        firebaseStorage,
        `users/${auth.currentUser.uid}/posts/${uniqid()}`
      );
      const metadata = {
        contentType: "image/jpeg",
      };
      await uploadBytes(storageRef, file, metadata).then((snapshot) => {});
      getDownloadURL(storageRef).then((url) => {
        setPostContent({ ...postContent, photoUrl: url });
        setUploadStatus(null);
        setAttachedPic(url);
        postPicRef.current.value = "";
      });
    }
  };

  const removePic = async () => {
    try {
      const imageRef = ref(firebaseStorage, attachedPic);
      await deleteObject(imageRef).then((res) => {
        postPicRef.current.value = null;
        setAttachedPic(null);
        setPostContent({ ...postContent, photoUrl: null });
      });
    } catch (err) {
      console.log(err);
    }
  };
  const sendPost = async () => {
    const { userInfo } = user.user;
    if (uploadStatus === null) {
      if (
        postType === "status" &&
        (postContent.body !== "" || postContent.photoUrl !== null)
      ) {
        try {
          const postRef = await addDoc(collection(firestoreDatabase, "posts"), {
            ...postContent,
            date: serverTimestamp(),
            authorID: auth.currentUser.uid,
            authorInfo: userInfo,
            postType: "status",
          });
          setPostContent({
            body: "",
            photoUrl: null,
            authorID: "",
            date: "",
          });
          setAttachedPic(null);
        } catch (err) {
          console.log(err);
        }
      } else if (
        postType === "toWall" &&
        (postContent.body !== "" || postContent.photoUrl !== null)
      ) {
        try {
          const postRef = await addDoc(collection(firestoreDatabase, "posts"), {
            ...postContent,
            date: serverTimestamp(),
            authorID: auth.currentUser.uid,
            authorInfo: userInfo,
            postType: "toWall",
            recipient: recipient,
          });
          if (auth.currentUser.uid !== recipient) {
            const notifRef = collection(firestoreDatabase, `notifications`);
            await addDoc(notifRef, {
              date: serverTimestamp(),
              postID: postRef.id,
              status: "unread",
              type: "post",
              from: auth.currentUser.uid,
              to: recipient,
            });
          }
          setPostContent({
            body: "",
            photoUrl: null,
            authorID: "",
            date: "",
          });

          setAttachedPic(null);
          updateComponent();
        } catch (err) {
          console.log(err);
        }
      }
    }
  };

  useEffect(() => {}, [userStatus, user]);

  let placeholder;

  if (postType === "toWall") {
    placeholder = `Post on ${recipientName}'s wall`;
  } else if (postType === "status") {
    placeholder = `What's on your mind? ${auth.currentUser.displayName}`;
  }

  return userStatus === "success" ? (
    <div className="flex column align center">
      <div className="create-post">
        <img
          src={auth.currentUser.photoURL}
          alt={auth.currentUser.displayName}
          className="avatar"
        />
        <div className="input-container">
          <input
            name="body"
            type="text"
            placeholder={placeholder}
            onChange={handleChange}
            value={postContent.body}
            className="post-input"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendPost();
              }
            }}
          ></input>
          <IoMdSend onClick={sendPost} className="send-post" />
        </div>
        <AiFillCamera
          onClick={() => {
            postPicRef.current.click();
          }}
          className="attach-pic"
        />
        <input
          type="file"
          hidden
          ref={postPicRef}
          multiple={false}
          onChange={handleUpload}
        />
      </div>
      {uploadStatus === "Uploading" ? (
        <AiOutlineLoading3Quarters className="loading" />
      ) : null}
      {attachedPic !== null ? (
        <div className="post-attachments">
          <img
            src={attachedPic}
            alt="Post attachment"
            className="post-thumbnail"
          />
          <TiDelete onClick={removePic} className="remove-pic" />
        </div>
      ) : null}
    </div>
  ) : null;
};
