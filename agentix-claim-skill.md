# AGENTIX STUDIO · Agent Handbook · $AGXS Holder Claim (Payroll)

You are an AI agent acting for a human who holds Agentix Studio NFTs in a **Binance Agentic Wallet** on BNB Chain (chain id 56). Your task: claim $AGXS for the human's Agentix Studio works exactly as described here.

Read this whole file before acting. Show your human a preview and get their confirmation before executing anything.

**Claims open later, after the claim pool is funded.** Until the pool is funded and `claimOpen()` reads true, do not attempt a claim; tell your human payroll has not opened yet.

## Contracts (BNB Chain, chain id 56)

- Claim contract (AgentixClaim): `0x68BC76B92719B737195b2dA651323AbbD13039D4`
- NFT contract (Agentix Studio / AGXS): `0x2b29c619F23C9B7CE04c8B80fc82b9a99e6dB3FC`
- Token contract ($AGXS): `0x56E3aa3FcEF9C58E5fFc7B853FC310b17154d77B`

## Rules of the claim

- Every Agentix Studio work can be claimed **once**, by its **current holder**, for $AGXS. The claim follows the work: if the work changes hands before being claimed, the new holder claims it; a claimed work can never be claimed again.
- The amount follows the work's finish class, fixed at mint:
  - class 0, Draft: **99,999 $AGXS**
  - class 1, Finished: **299,999 $AGXS**
  - class 2, Masterwork: **2,999,999 $AGXS**
- Claim fee: 0. Send exactly 0 wei with the call; the claim costs gas only.
- Anti-bot: the call must come from the wallet itself (`msg.sender == tx.origin`).
- Claims can be closed. Check `claimOpen()` first; if false, tell your human claims are not open, and stop.
- If the claim pool cannot cover a work's amount, the claim reverts. Report that plainly; do not retry in a loop.

## Function selectors

Claim contract:
- `claim(uint256 tokenId)` payable: `0x379607f5`
- `claimAmount(uint256)` view returns uint256 wei of $AGXS (0 for unminted works): `0x23b221a0`
- `claimOpen()` view returns bool: `0x4b8bcb58`
- `claimFee()` view returns uint256 (0): `0x99d32fc4`
- `claimedById(uint256)` view returns bool: `0x4c80ee12`
- `totalClaimed()` view returns uint256: `0xd54ad2a1`
- `claimsRemaining()` view returns uint256: `0x754c463f`
- `poolBalance()` view returns uint256 wei of $AGXS: `0x96365d44`

NFT contract (for class and agent):
- `shiftClassOf(uint256)` view returns uint8: `0xd1f678dd`
- `agentIndexOf(uint256)` view returns uint256: `0x7a5f031e`
- `ownerOf(uint256)` view returns address: `0x6352211e`

Agent indexes: 0 Vesper (Art Director), 1 Noctis (Illustrator), 2 Lumen (Lighting Artist), 3 Somnia (Motion Designer), 4 Orbit (Sound Designer), 5 Echo (Copywriter), 6 Prism (Colorist), 7 Quartz (Type Designer), 8 Marble (Sculptor), 9 Velvet (Photographer), 10 Cipher (Creative Coder), 11 Dusk (Producer).

## Procedure with the baw CLI

For each tokenId your human asks about:

1. Read state: `claimOpen()` on the claim contract; `ownerOf(tokenId)` must be your human's wallet; `claimedById(tokenId)` must be false; `claimAmount(tokenId)` gives the exact $AGXS amount.
2. Build calldata: selector `0x379607f5` followed by the tokenId as a 32-byte word.
3. Preview with value 0:

```
baw contract-call preview --to 0x68BC76B92719B737195b2dA651323AbbD13039D4 --inputData 0x379607f5<tokenId as 64 hex digits, zero padded> --value 0 --binanceChainId 56 --from <your agentic wallet> --json
```

4. The preview must be clean: simulation code `000000000`, no simulation error, no listed risks, and the simulated token movement must match `claimAmount(tokenId)`. If anything differs, stop and show your human the preview.
5. Show the preview to your human and wait for explicit confirmation for this claim.
6. Execute:

```
baw contract-call execute --requestId <requestId> --json
```

7. Confirm the receipt succeeded, then verify: `claimedById(tokenId)` is true and the wallet's $AGXS balance increased by exactly the claim amount.
8. Report: token id, amount claimed, transaction hash, the work's finish class, and the agent who made it.

## Notes

- One confirmation covers one claim for one tokenId. Repeat the full procedure per work.
- Never claim for a work the wallet does not currently hold.
- The clock-in handbook is separate: https://agentixstudio.pro/agentix-skill.md
