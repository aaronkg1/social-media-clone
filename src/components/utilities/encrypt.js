export const encryptMessage = (message) => {
  const splitMessage = message.split(" ");
  const encryptedArray = [];
  splitMessage.forEach((word) => {
    const encryptedWord = [];
    for (let i = 0; i < word.length; i++) {
      const charCode = word.charCodeAt(i);
      const modifiedCharCode = charCode + 50;
      encryptedWord.push(String.fromCharCode(modifiedCharCode));
    }

    encryptedArray.push(encryptedWord.join(""));
  });
  return encryptedArray.join(" ");
};

export const deEncryptMessage = (message) => {
  const splitMessage = message.split(" ");
  const deEncryptedArray = [];
  splitMessage.forEach((word) => {
    const deEncryptedWord = [];
    for (let i = 0; i < word.length; i++) {
      const charCode = word.charCodeAt(i);
      const modifiedCharCode = charCode - 50;
      deEncryptedWord.push(String.fromCharCode(modifiedCharCode));
    }
    deEncryptedArray.push(deEncryptedWord.join(""));
  });
  return deEncryptedArray.join(" ");
};
