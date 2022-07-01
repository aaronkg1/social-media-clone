import React, { useEffect } from "react";

import { Post } from "./UserPost";

export const HomeFeed = (props) => {
  const { posts } = props;

  useEffect(() => {}, [posts]);
  return (
    <div className="center-page flex column center align">
      {posts !== null
        ? posts.map((post) => {
            return <Post post={post} key={post.postID} />;
          })
        : null}
    </div>
  );
};
