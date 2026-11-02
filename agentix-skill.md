# AGENTIX STUDIO · Agent Handbook · Clocking In (Minting)

You are an AI agent acting for a human who holds a **Binance Agentic Wallet** on BNB Chain (chain id 56). Your task: clock in (mint) Agentix Studio works exactly as described here. Agentix Studio is a collection of 12,000 night-shift works. Twelve agents staff a studio floor from midnight to six, and every mint clocks in one shift and fixes its seed on-chain.

Read this whole file before acting. Show your human a preview and get their confirmation before executing anything.

## Contracts (BNB Chain, chain id 56)

- NFT contract (Agentix Studio / AGXS): `0x2b29c619F23C9B7CE04c8B80fc82b9a99e6dB3FC`
- Token contract ($AGXS, separate, for holder claims): `0x56E3aa3FcEF9C58E5fFc7B853FC310b17154d77B`
- Explorer: https://bscscan.com/address/0x2b29c619F23C9B7CE04c8B80fc82b9a99e6dB3FC
- Metadata base: `https://agentixstudio.pro/metadata/<tokenId>` (tokenURI = base + id, no extension)

## Rules of the collection

- Supply: 12,000 works, tokenIds 1 to 12,000, minted in order.
- One call mints exactly one work. There is no quantity argument.
- Price: flat **135000000000000 wei** per mint. Read `currentPrice()` fresh and pay exactly that value, no more, no less. The website displays the mint as free; the exact wei value appears in your wallet confirmation.
- Maximum 20 works per wallet, counted on-chain (`mintedBy`).
- Eligibility gate: the minting wallet must hold a **Binance Agent ID** (SPACE ID Agent ID NFT, contract `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`). Check with `holdsAgentId(wallet)`.
- Anti-bot: the call must come from the wallet itself (`msg.sender == tx.origin`). Contract wallets cannot mint.
- Minting can be closed. Check `mintOpen()` first; if false, tell your human clock-in has not opened or has closed, and stop.

## Finish class and the roster (why one work differs from another)

At mint, the contract fixes the work's seed and derives its finish class and its agent from it:

- class 0 "Draft" (about 70%): the shift stopped mid-drawing. Claim value 99,999 $AGXS.
- class 1 "Finished" (about 27%): a complete, signed piece. Claim value 299,999 $AGXS.
- class 2 "Masterwork" (about 3%): the agent's one great night, framed and stamped. Claim value 2,999,999 $AGXS.

Read a minted work with `seedOf(id)`, `shiftClassOf(id)` and `agentIndexOf(id)`. Agent indexes map to the studio roster: 0 Vesper (Art Director), 1 Noctis (Illustrator), 2 Lumen (Lighting Artist), 3 Somnia (Motion Designer), 4 Orbit (Sound Designer), 5 Echo (Copywriter), 6 Prism (Colorist), 7 Quartz (Type Designer), 8 Marble (Sculptor), 9 Velvet (Photographer), 10 Cipher (Creative Coder), 11 Dusk (Producer). Always report the finish and the agent's name to your human after minting.

## Function selectors (NFT contract)

- `mint()` payable, no arguments: `0x1249c58b`
- `currentPrice()` view returns uint256 wei: `0x9d1b464a`
- `mintOpen()` view returns bool: `0x24bbd049`
- `totalSupply()` view returns uint256 minted count: `0x18160ddd`
- `seedOf(uint256)` view returns uint256: `0x82829f74`
- `shiftClassOf(uint256)` view returns uint8: `0xd1f678dd`
- `agentIndexOf(uint256)` view returns uint256: `0x7a5f031e`
- `mintedBy(address)` view returns uint256: `0x3cef28d2`
- `holdsAgentId(address)` view returns bool: `0x11213086`
- `stats(address)` view returns (minted, max, priceWei, open, hasAgentId, hasMinted): `0x8bcdcbf3`

## Procedure with the baw CLI

1. Confirm your wallet and chain. Your agentic wallet address is the minting wallet; the Agent ID gate applies to it.
2. Read state: `mintOpen()`, `currentPrice()`, `totalSupply()`, `holdsAgentId(<wallet>)`, `mintedBy(<wallet>)`. Stop and report if minting is closed, the wallet holds no Agent ID, or the wallet already clocked in 20.
3. Preview the mint call. Calldata is exactly the 4-byte selector `0x1249c58b` and nothing else; value is exactly 135000000000000 wei (verify it equals the `currentPrice()` result):

```
baw contract-call preview --to 0x2b29c619F23C9B7CE04c8B80fc82b9a99e6dB3FC --inputData 0x1249c58b --value 135000000000000 --binanceChainId 56 --from <your agentic wallet> --json
```

4. The preview must be clean: simulation code `000000000`, no simulation error, no listed risks. If it is not clean, stop and show your human exactly what the preview said.
5. Show the preview to your human and wait for their explicit confirmation for this mint.
6. Execute with the request id from the preview (request ids expire within seconds; if it lapses, preview again):

```
baw contract-call execute --requestId <requestId> --json
```

7. Wait for the receipt and confirm it succeeded (status 1). Your token id is the new `totalSupply()` value if your mint was the latest; verify ownership with `ownerOf` if in doubt.
8. Report to your human: token id, transaction hash, finish class, and the name and role of the agent who made it.

## Notes

- Never mint from a contract wallet, never batch, never pay a value different from `currentPrice()`.
- One confirmation covers one mint. For more works, repeat the whole procedure, preview and confirmation included.
- The $AGXS holder claim is a separate contract and a separate handbook: https://agentixstudio.pro/agentix-claim-skill.md
