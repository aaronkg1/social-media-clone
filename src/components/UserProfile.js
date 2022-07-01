import React, { useEffect, useRef, useState } from "react";
import { Navigate, useMatch } from "react-router-dom";
import { auth } from "../firebase/firebase.config";
import { updateProfile } from "firebase/auth";
import { useDispatch, useSelector } from "react-redux";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import {
  firestoreDatabase,
  firebaseStorage,
} from "../firebase/firebase.config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { AiFillCamera } from "react-icons/ai";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Post } from "./UserPost";
import { fetchUserInfo } from "../features/user";
import { CreatePost } from "./CreatePost";
import "../styles/UserProfile.css";
import { AddFriendButton } from "./AddFriendButton";

const UserProfile = (props) => {
  const dispatch = useDispatch();
  const userID = useMatch("users/:id").params.id;
  const user = useSelector((state) => state.user);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [userPosts, setUserPosts] = useState(null);
  const [wallPosts, setWallPosts] = useState(null);
  const [allPosts, setAllPosts] = useState(null);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [currentUserID, setCurrentUserID] = useState(null);
  const [componentShouldChange, setComponentShouldChange] = useState(false);
  const fileRef = useRef();

  const updateComponent = () => {
    setComponentShouldChange(!componentShouldChange);
  };

  useEffect(() => {
    setCurrentUserID(userID);
  }, []);

  useEffect(() => {
    const currentUserInfo = doc(firestoreDatabase, "publicProfiles", userID);
    getDoc(currentUserInfo).then((snapshot) => {
      setCurrentUser(snapshot.data());
      setIsLoaded(true);
    });
  }, [userID]);

  useEffect(() => {
    const postsRef = collection(firestoreDatabase, "posts");
    const q = query(
      postsRef,
      where("authorID", "==", userID),
      where("postType", "==", "status")
    );
    const postSnapshot = onSnapshot(q, (snapshots) => {
      const posts = snapshots.docs.map((doc) => {
        return { ...doc.data(), postID: doc.id };
      });
      setUserPosts(
        posts.sort((a, b) => {
          return b.date - a.date;
        })
      );
    });
    return function cleanUp() {
      postSnapshot();
    };
  }, [userID]);

  useEffect(() => {
    const toWallRef = collection(firestoreDatabase, "posts");
    const q = query(
      toWallRef,
      where("postType", "==", "toWall"),
      where("recipient", "==", userID)
    );
    const postSnapshot = onSnapshot(q, (snapshots) => {
      const posts = snapshots.docs.map((doc) => {
        return { ...doc.data(), postID: doc.id };
      });
      setWallPosts(posts);
    });
    return function cleanUp() {
      postSnapshot();
    };
  }, [userID]);

  useEffect(() => {
    const sortPosts = () => {
      let posts = [];
      if (userPosts !== null) {
        posts = [...posts, ...userPosts];
      }
      if (wallPosts !== null) {
        posts = [...posts, ...wallPosts];
      }
      posts.sort((a, b) => {
        return b.date - a.date;
      });
      setAllPosts(posts);
    };
    sortPosts();
  }, [userPosts, wallPosts]);

  useEffect(() => {}, [user]);
  useEffect(() => {}, [userID]);

  useEffect(() => {
    if (currentUser != null) {
      const isUserAFriend = async () => {
        if (currentUser.userInfo.id === auth.currentUser.uid) {
          setIsFriend(true);
        } else {
          const friendRef = collection(firestoreDatabase, "friendships");
          const promises = [];
          const query1 = query(
            friendRef,
            where(
              "joinedIDs",
              "array-contains",
              userID + "_" + auth.currentUser.uid
            ),
            where("status", "==", "accepted")
          );

          await getDocs(query1).then((snapshots) => {
            snapshots.docs.forEach((snapshot) => {
              promises.push(
                new Promise((resolve) => {
                  resolve(snapshot.data());
                })
              );
            });
          });
          Promise.all(promises).then((res) => {
            if (res.length > 0) {
              setIsFriend(true);
            } else {
              setIsFriend(false);
            }
          });
        }
      };
      isUserAFriend();
    }
  }, [currentUser, userID]);

  useEffect(() => {}, [uploadMessage]);

  const handleUpload = async (e) => {
    const acceptedExtensions = ["jpg", "jpeg", "png", "gif"];
    const [file] = e.target.files;
    const fileExtension = file.name.substring(file.name.lastIndexOf(".") + 1);
    if (acceptedExtensions.includes(fileExtension)) {
      setUploadMessage(null);
      const storageRef = ref(
        firebaseStorage,
        `users/${auth.currentUser.uid}/profilePic.jpg`
      );
      const metadata = {
        contentType: "image/jpeg",
      };
      setUploadMessage("Loading");
      await uploadBytes(storageRef, file, metadata).then((snapshot) => {});
      getDownloadURL(storageRef).then(async (url) => {
        const userInfoCopy = { ...user.user.userInfo };

        await updateDoc(doc(firestoreDatabase, "users", auth.currentUser.uid), {
          userInfo: {
            ...userInfoCopy,
            photoUrl: url,
          },
        });
        delete userInfoCopy.email;
        await updateDoc(
          doc(firestoreDatabase, "publicProfiles", auth.currentUser.uid),
          {
            userInfo: {
              ...userInfoCopy,
              photoUrl: url,
            },
          }
        );
        updateProfile(auth.currentUser, {
          photoURL: url,
        })
          .then(() => {
            setUploadMessage(null);
            dispatch(fetchUserInfo(auth.currentUser.uid));
          })
          .catch((error) => {
            console.log(error);
          });
      });
    } else {
      setUploadMessage("File format not accepted");
    }
  };

  if (auth.currentUser === null) {
    return <Navigate to="/home" replace />;
  } else if (isLoaded) {
    if (user.status === "success" && userID === user.user.userInfo.id) {
      return (
        <div>
          <div className="profile-info flex align center">
            <div className="relative">
              <img
                src={currentUser.userInfo.photoUrl}
                alt={currentUser.userInfo.id}
                className="profile-photo"
              ></img>
              <AiFillCamera
                onClick={() => {
                  fileRef.current.click();
                }}
                className="change-picture relative"
              />

              {uploadMessage !== null ? (
                uploadMessage === "Loading" ? (
                  <p>
                    Uploading...{" "}
                    <AiOutlineLoading3Quarters className="loading" />{" "}
                  </p>
                ) : (
                  <p>{uploadMessage}</p>
                )
              ) : null}
            </div>
            <h1 className="user-display-name relative">
              {currentUser.userInfo.firstName +
                " " +
                currentUser.userInfo.lastName}
            </h1>
          </div>
          <input
            type="file"
            hidden
            ref={fileRef}
            multiple={false}
            onChange={handleUpload}
          />

          {isFriend === true ? (
            <div className="flex align center">
              {" "}
              <CreatePost postType="status" updateComponent={updateComponent} />
            </div>
          ) : null}
          {isFriend ? (
            <div className="posts flex column align">
              {allPosts !== null
                ? allPosts.map((post) => {
                    return <Post post={post} key={post.postID} />;
                  })
                : null}
            </div>
          ) : null}
        </div>
      );
    }

    if (currentUser !== null) {
      return (
        <div>
          <div className="profile-info flex align center">
            <div className="relative">
              <img
                src={currentUser.userInfo.photoUrl}
                alt={currentUser.userInfo.id}
                className="profile-photo"
              ></img>
            </div>
            <h1 className="user-display-name">
              {currentUser.userInfo.firstName +
                " " +
                currentUser.userInfo.lastName}
            </h1>
            {isFriend ? null : (
              <AddFriendButton userInfo={currentUser.userInfo} />
            )}
          </div>
          {isFriend === true ? (
            <CreatePost
              postType="toWall"
              recipient={currentUser.userInfo.id}
              recipientName={currentUser.userInfo.firstName}
              updateComponent={updateComponent}
            />
          ) : null}

          {isFriend === true ? (
            <div className="posts flex column align">
              {allPosts !== null
                ? allPosts.map((post) => {
                    return <Post post={post} key={post.postID} />;
                  })
                : null}
              {/* {wallPosts !== null
                ? wallPosts.map((post) => {
                    return <Post post={post} key={post.postID} />;
                  })
                : null} */}
            </div>
          ) : null}
        </div>
      );
    }
  } else return <div>Loading</div>;
};

export default UserProfile;
