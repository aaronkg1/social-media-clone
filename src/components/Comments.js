import {
  collection,
  deleteDoc,
  doc,
  where,
  query,
  getDocs,
  onSnapshot,
  getDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { TiDelete } from "react-icons/ti";
import { firestoreDatabase, auth } from "../firebase/firebase.config";
import "../styles/Comments.css";
import { capitalise } from "./utilities/capitalise";
import { dateConverter } from "./utilities/dateConverter";

export const Comments = (props) => {
  const { post } = props;

  const [sortedComments, setSortedComments] = useState(null);

  useEffect(() => {
    const commentsRef = collection(firestoreDatabase, "comments");
    const commentsQuery = query(
      commentsRef,
      where("postID", "==", post.postID)
    );

    try {
      const unsub = onSnapshot(commentsQuery, (snapshot) => {
        const postComments = snapshot.docs.map((doc) => {
          const docData = !doc.metadata.hasPendingWrites
            ? {
                ...doc.data(),
                commentID: doc.id,
                date: doc.data().date.toDate(),
              }
            : {
                ...doc.data(),
                commentID: doc.id,
                date: new Date(),
              };
          return docData;
        });
        const sortedPostComments = postComments.sort((a, b) => {
          return b.date - a.date;
        });
        const promiseArray = [];
        sortedPostComments.forEach(async (comment) => {
          promiseArray.push(
            new Promise((resolve, reject) => {
              const userRef = doc(
                firestoreDatabase,
                `publicProfiles/${comment.author.id}`
              );
              getDoc(userRef)
                .then((ref) => {
                  const oldDate = comment.date;
                  comment.author.photoUrl = ref.data().userInfo.photoUrl;
                  comment.date = dateConverter(oldDate);
                  resolve();
                })
                .catch((err) => {
                  reject(err);
                });
            })
          );
        });
        Promise.all(promiseArray).then(() => {
          setSortedComments(sortedPostComments);
        });
      });
      return function cleanUp() {
        unsub();
      };
    } catch (err) {
      console.log(err);
    }
  }, [post.postID]);

  useEffect(() => {}, [sortedComments]);

  const deleteComment = async (comment) => {
    if (comment.author.id === auth.currentUser.uid) {
      const commentRef = doc(firestoreDatabase, "comments", comment.commentID);
      await deleteDoc(commentRef);
      const notificationRef = collection(firestoreDatabase, "notifications");
      const notifQuery = query(
        notificationRef,
        where("from", "==", auth.currentUser.uid),
        where("commentID", "==", comment.commentID)
      );
      await getDocs(notifQuery).then((snapshot) => {
        snapshot.docs.forEach((doc) => {
          deleteDoc(doc.ref);
        });
      });
    } else return;
  };

  return (
    <ul className="flex column gap--10 width--100">
      {sortedComments !== null
        ? sortedComments.map((comment) => {
            return (
              <li key={comment.commentID}>
                <div className="comment-container">
                  <img
                    src={comment.author.photoUrl}
                    alt={comment.author.displayName}
                    className="avatar"
                  />
                  <div className="comment-body">
                    <h4 className="comment-author">
                      {comment.author.displayName}
                    </h4>
                    <p>{comment.body}</p>
                  </div>
                  <div className="comment-controls">
                    {comment.author.id === auth.currentUser.uid ? (
                      <TiDelete
                        onClick={() => {
                          deleteComment(comment);
                        }}
                        className="delete-comment"
                      />
                    ) : null}
                  </div>
                </div>
                <p className="comment-time">{capitalise(comment.date)} ago</p>
              </li>
            );
          })
        : null}
    </ul>
  );
};
