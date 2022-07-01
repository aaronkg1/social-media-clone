import { collection, getDocs, limit, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import { Link } from "react-router-dom";
import { firestoreDatabase } from "../firebase/firebase.config";
import "../styles/Search.css";

export const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null);

  const updateSearchTerm = (e) => {
    const stringToLowerCase = e.target.value.toLowerCase();
    const firstLetter = stringToLowerCase.slice(0, 1).toUpperCase();
    const remainingString = e.target.value.substring(1);
    setSearchTerm(firstLetter + remainingString);
  };

  const fetchResults = async () => {
    const results = [];
    const usersRef = collection(firestoreDatabase, "publicProfiles");
    const searchQuery = query(
      usersRef,
      where("userInfo.displayName", ">=", searchTerm),
      where("userInfo.displayName", "<=", searchTerm + "\uf8ff"),
      limit(5)
    );
    try {
      await getDocs(searchQuery).then((res) => {
        res.docs.forEach((doc) => {
          results.push(doc.data());
        });
      });
      setSearchResults(results);
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    searchTerm.length > 0 ? fetchResults() : setSearchResults(null);
  }, [searchTerm]);
  return (
    <div className="search-bar">
      <AiOutlineSearch className="search-icon" />
      <input
        type="text"
        className="search-input"
        value={searchTerm}
        onChange={updateSearchTerm}
        placeholder="Find people"
      />
      {searchResults !== null ? (
        <ul className="search-dropdown">
          {searchResults.map((result) => {
            return (
              <li
                key={`${result.userInfo.id}+"searchResult"`}
                className="search-item"
              >
                <Link
                  className="search-link-image"
                  to={`/users/${result.userInfo.id}`}
                  onClick={() => {
                    setSearchResults(null);
                    setSearchTerm("");
                  }}
                >
                  <img
                    src={result.userInfo.photoUrl}
                    alt={result.userInfo.displayName}
                    className="avatar small"
                  />
                </Link>
                <Link
                  className="search-link"
                  to={`/users/${result.userInfo.id}`}
                  onClick={() => {
                    setSearchResults(null);
                    setSearchTerm("");
                  }}
                >
                  <p>{result.userInfo.displayName}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};
