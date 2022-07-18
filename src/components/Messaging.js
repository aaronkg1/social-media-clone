import { set } from "date-fns";
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { auth, firestoreDatabase } from "../firebase/firebase.config";
import "../styles/Messaging.css";
import { deEncryptMessage, encryptMessage } from "./utilities/encrypt";
import { IoMdSend } from "react-icons/io";
import { GoPrimitiveDot } from "react-icons/go";
import { Link } from "react-router-dom";

export const Messaging = () => {
  const friends = useSelector((state) => state.friends.updatedFriendsList);
  const user = useSelector((state) => state.user.user);
  const [message, setMessage] = useState("");
  const [receivedMessages, setReceivedMessages] = useState(null);
  const [sentMessages, setSentMessages] = useState(null);
  const [friendsMessages, setFriendsMessages] = useState(null);
  const [inputDisabled, setInputDisabled] = useState(false);
  const scrollRef = useRef();
  const inputRef = useRef();
  const [selectedFriend, setSelectedFriend] = useState(null);
  const dispatch = useDispatch();
  const [snapShot, setSnapShot] = useState(null);
  const oldMessages = usePrevious(snapShot);
  const oldFriendMessages = usePrevious(friendsMessages);
  const [highlightChat, setHighlightChat] = useState(null);

  function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  }

  useEffect(() => {
    if (friendsMessages !== null && oldFriendMessages !== null) {
      friendsMessages.forEach((chat) => {
        const oldMessages = oldFriendMessages.find((old) => {
          return old.id === chat.id;
        });
        const oldReceivedMessages = oldMessages.messages.filter((message) => {
          return message.type === "received";
        });
        const newReceivedMessages = chat.messages.filter((message) => {
          return message.type === "received";
        });
        if (oldReceivedMessages.length < newReceivedMessages.length) {
          setHighlightChat(chat.id);
        }
      });
    }
  }, [friendsMessages, oldFriendMessages]);

  useEffect(() => {
    setTimeout(() => {
      setHighlightChat(null);
    }, 500);
  }, [highlightChat]);

  useEffect(() => {
    if (oldMessages !== null && snapShot !== null) {
      if (oldMessages.length < snapShot.length) {
        const notificationSound = new Audio("/notification.mp3");
        notificationSound.play();
      }
    }
  }, [snapShot, oldMessages]);

  useEffect(() => {
    const messagesRef = collection(firestoreDatabase, "messages");
    const messagesQuery = query(
      messagesRef,
      where("toUser.id", "==", auth.currentUser.uid)
    );
    const unsub = onSnapshot(messagesQuery, (snapshot) => {
      setSnapShot(snapshot.docs);

      const userChats = {};
      friends.forEach((friend) => {
        userChats[friend.id] = [];
      });
      const incomingMessages = snapshot.docs.map((doc) => {
        const docData = !doc.metadata.hasPendingWrites
          ? {
              ...doc.data(),
              messageID: doc.id,
              type: "received",
              date: doc.data().date.toDate(),
              body: deEncryptMessage(doc.data().body),
            }
          : {
              ...doc.data(),
              messageID: doc.id,
              type: "received",
              date: new Date(),
              body: deEncryptMessage(doc.data().body),
            };
        return docData;
      });
      incomingMessages.forEach((message) => {
        const fromUser = friends.find((friend) => {
          return friend.id === message.fromUser.id;
        });
        userChats[fromUser.id].push(message);
      });
      const chatArray = Object.values(userChats);
      setReceivedMessages(chatArray);
    });
    return function cleanUp() {
      unsub();
    };
  }, [friends]);

  useEffect(() => {
    const messagesRef = collection(firestoreDatabase, "messages");
    const messagesQuery = query(
      messagesRef,
      where("fromUser.id", "==", auth.currentUser.uid)
    );

    const unsub = onSnapshot(messagesQuery, (snapshot) => {
      const userChats = {};
      friends.forEach((friend) => {
        const friendID = friend.id;
        userChats[friendID] = [];
      });
      const sentMessages = snapshot.docs.map((doc) => {
        const docData = !doc.metadata.hasPendingWrites
          ? {
              ...doc.data(),
              messageID: doc.id,
              type: "sent",
              date: doc.data().date.toDate(),
              body: deEncryptMessage(doc.data().body),
            }
          : {
              ...doc.data(),
              messageID: doc.id,
              type: "sent",
              date: new Date(),
              body: deEncryptMessage(doc.data().body),
            };
        return docData;
      });
      sentMessages.forEach((message) => {
        const toUser = friends.find((friend) => {
          return friend.id === message.toUser.id;
        });
        userChats[toUser.id].push(message);
      });
      const objToArray = Object.values(userChats);
      setSentMessages(objToArray);
    });
    return function cleanUp() {
      unsub();
    };
  }, [friends]);

  useEffect(() => {
    if (sentMessages !== null && receivedMessages !== null) {
      const friendsListCopy = JSON.parse(JSON.stringify(friends));
      const sentMessagesCopy = sentMessages.sort((a, b) => {
        return [a] - [b];
      });

      const receivedMessagesCopy = receivedMessages.sort((a, b) => {
        return [a] - [b];
      });

      for (let i = 0; i < sentMessagesCopy.length; i++) {
        const unreadMessages = receivedMessagesCopy[i].filter((message) => {
          return message.status === "unread";
        });

        const dateOrderedMessages = [
          ...sentMessagesCopy[i],
          ...receivedMessagesCopy[i],
        ].sort((a, b) => {
          return a.date - b.date;
        });
        let friendID;
        if (dateOrderedMessages.length > 0) {
          dateOrderedMessages[0].fromUser.id === auth.currentUser.uid
            ? (friendID = dateOrderedMessages[0].toUser.id)
            : (friendID = dateOrderedMessages[0].fromUser.id);
          const friendInArray = friendsListCopy.find((friend) => {
            return friend.id === friendID;
          });
          if (
            selectedFriend !== null &&
            selectedFriend.id === friendInArray.id
          ) {
            markMessagesAsRead(friendInArray);
          }
          friendInArray.messages = dateOrderedMessages;
          friendInArray.unreadMessages = unreadMessages;
          if (friendInArray.messages.length > 0) {
            friendInArray.lastMessageDate = Math.floor(
              new Date(
                friendInArray.messages[friendInArray.messages.length - 1].date
              ).getTime() / 1000
            );
          } else friendInArray.lastMessageDate = 0;
        }
      }
      setFriendsMessages(
        friendsListCopy.sort((a, b) => {
          return b.lastMessageDate - a.lastMessageDate;
        })
      );
    }
  }, [dispatch, receivedMessages, sentMessages, friends]);

  useEffect(() => {}, [selectedFriend]);

  const sendMessage = async (recipient) => {
    if (recipient !== null && !inputDisabled) {
      const encryptedMessage = encryptMessage(message);
      setInputDisabled(true);
      const messageCollection = collection(firestoreDatabase, "messages");
      await addDoc(messageCollection, {
        body: encryptedMessage,
        fromUser: user.userInfo,
        toUser: {
          displayName: recipient.displayName,
          firstName: recipient.firstName,
          lastName: recipient.lastName,
          photoUrl: recipient.photoUrl,
          id: recipient.id,
        },
        date: serverTimestamp(),
        status: "unread",
      });
      setMessage("");
      setTimeout(() => {
        setInputDisabled(false);
      }, 200);
    } else return;
  };

  const markMessagesAsRead = async (friend) => {
    const messagesRef = collection(firestoreDatabase, "messages");
    const messagesQuery = query(
      messagesRef,
      where("fromUser.id", "==", friend.id),
      where("toUser.id", "==", auth.currentUser.uid),
      where("status", "==", "unread")
    );
    await getDocs(messagesQuery).then((snapshot) => {
      snapshot.docs.forEach((doc) => {
        updateDoc(doc.ref, {
          status: "read",
        });
      });
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && selectedFriend !== null) {
      sendMessage(selectedFriend);
    }
  };

  useEffect(() => {
    if (!inputDisabled && selectedFriend !== null) {
      inputRef.current.focus();
    }
  }, [inputDisabled, selectedFriend]);

  const updateMessageField = (e) => {
    setMessage(e.target.value);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behaviour: "smooth" });
    }
  });

  const selectFriend = (friendID) => {
    setSelectedFriend(
      friendsMessages.find((friend) => {
        return friend.id === friendID;
      })
    );
  };

  return friendsMessages !== null ? (
    <div className="messages">
      <ul className="message-friends-list">
        {friendsMessages.map((friend) => {
          return (
            <li
              key={`${friend.id}messageIcon`}
              onClick={() => {
                selectFriend(friend.id);
                markMessagesAsRead(friend);
              }}
              className={
                highlightChat === friend.id
                  ? "message-friend new-message"
                  : selectedFriend !== null && selectedFriend.id === friend.id
                  ? "message-friend active-friend"
                  : "message-friend"
              }
            >
              <img
                src={friend.photoUrl}
                alt={friend.displayName}
                className="avatar"
              />{" "}
              <p>{friend.displayName}</p>
              {friend.unreadMessages && friend.unreadMessages.length > 0 ? (
                <p className="unread-messages flex align center">
                  {friend.unreadMessages.length}{" "}
                  {friend.unreadMessages.length > 1
                    ? "Unread Messages"
                    : "Unread Message"}
                  <GoPrimitiveDot />
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div className="messages-container">
        {selectedFriend !== null &&
        friendsMessages.find((friend) => {
          return friend.id === selectedFriend.id;
        }).messages.length > 0 ? (
          <div className="list-container">
            <Link
              to={`/users/${selectedFriend.id}`}
              className="link flex align center gap--10"
            >
              <img
                src={selectedFriend.photoUrl}
                alt={selectedFriend.displayName}
                className="avatar margin-left"
              ></img>
              <h3 className="chat-title">{selectedFriend.displayName}</h3>
            </Link>
            <ul className="messages-list flex column align">
              {" "}
              {friendsMessages
                .find((friend) => {
                  return friend.id === selectedFriend.id;
                })
                .messages.map((message) => {
                  return (
                    <li
                      key={message.messageID}
                      className={
                        message.type === "sent"
                          ? "sent-message message-bubble flex column"
                          : "received-message message-bubble flex column"
                      }
                    >
                      {message.body}
                    </li>
                  );
                })}{" "}
              <li ref={scrollRef}></li>
            </ul>
          </div>
        ) : null}
        {selectedFriend !== null ? (
          <div className="send-message-box">
            <input
              value={message}
              onChange={updateMessageField}
              onKeyDown={(e) => {
                if (message.length > 0) {
                  handleKeyDown(e);
                }
              }}
              type="text"
              disabled={inputDisabled}
              className="chat-input"
              ref={inputRef}
            />
            <IoMdSend
              onClick={() => {
                if (message.length > 0) {
                  sendMessage(selectedFriend);
                  selectFriend(selectedFriend.id);
                }
              }}
              disabled={inputDisabled}
              className="send-message-icon"
            />
          </div>
        ) : null}
      </div>
    </div>
  ) : null;
};
