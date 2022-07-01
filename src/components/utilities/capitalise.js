export const capitalise = (text) => {
  const splitText = text.toLowerCase().split(" ");
  const formattedWords = splitText.map((word) => {
    return word.charAt(0).toUpperCase() + word.substring(1);
  });
  const capitalisedAfterSpaces = formattedWords.join(" ");
  // if word contains a -
  const splitAtDash = capitalisedAfterSpaces.split("-");
  const formatAfterDash = splitAtDash.map((word) => {
    return word.charAt(0).toUpperCase() + word.substring(1);
  });
  return formatAfterDash.join("-");
};
