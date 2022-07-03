Social media clone project for The Odin Project. 

<a href="https://aaronkg1.github.io/social-media-clone/">Live Preview</a>

The aim of this project was to create a social media app clone using Firebase for backend services. I chose to base my project on Facebook. Given the time restraints of this project, (I aimed to finish it in two weeks), I set out to implement the core features; a friend request system, the ability to create posts, comment on/like posts, message other users and a notifications system. 

Initially I created a friend request system in which each user had a seperate folder containing an array of sent requests, an array of received requests
and an array of friends. I soon realised that this was inefficient as it involved maintaining multiple documents. I found changing this to a structure of a friendships folder containing all the friendship objects was far more efficient as only one document had to be updated per request. The powerful indexing that Firebase provides makes performing a query to receive all friend requests quick and easy.

I chose to store all posts in a single posts folder, with each post having a unique ID. This works well in tandem with the likes and comments feature, as to fetch the likes and comments for a post, it just required running a single query for comments and one for the likes associated with the post ID.
