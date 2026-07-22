# Token Create Onchain Proof

The token launch UI waits for the Story receipt before registering the remix with the backend.

Frontend registration payload now includes:

- `token_address`: token from the parsed `IPWorld.TokenDeployed` event.
- `tx_hash`: transaction hash returned by `createIpTokenWithSig`.
- `creator_address`: event `tokenCreator`, not a user-editable form value.

The hook uses the embedded EVM wallet address for nonce/signature when available. This keeps Dynamic embedded-wallet users aligned with backend verification, while EOA fallback still works if the wallet flow supplies an EOA signer.

Backend is the source of truth. It re-fetches the receipt, verifies the event came from `IPWORLD_CONTRACT_ADDRESS`, and checks the onchain creator against the authenticated user's primary + embedded wallet set.
