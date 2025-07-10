export const typedData = {
  types: {
    User: [
      { name: "wallet", type: "address" },
      { name: "nonce", type: "string" },
    ],
    Mail: [
      { name: "from", type: "User" },
      { name: "contents", type: "string" },
    ],
  },
  primaryType: "Mail",
  domain: {
    name: "EvoVerses",
    version: "1",
    chainId: 43114,
  },
  contents: "I agree to the privacy policy and terms of service of EvoVerses. I am authorizing the link of this new wallet to my EvoVerses account",
} as const;
