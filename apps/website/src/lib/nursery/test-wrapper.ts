export const fujiWrapperAbi = [
  { type: 'function', name: 'administrator', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'fulfill', stateMutability: 'nonpayable', inputs: [{ name: 'id', type: 'uint256' }, { name: 'word', type: 'uint256' }], outputs: [] },
] as const;
