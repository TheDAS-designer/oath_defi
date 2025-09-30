# OATH — Aptos Native On-Chain Credit Protocol (Hackathon Concept Introduction)

## One Sentence Introduction
**OATH** turns "commitments" into assets: using verifiable on-chain credentials and economic collateral to build native on-chain credit between project teams and investors, starting with **Aptos DeFi** and gradually expanding to all on-chain/off-chain fulfillment scenarios.

## Pain Points & Opportunities
- **Rug Pulls & Information Asymmetry**: Investors struggle to identify real executable commitments, and the cost of default is low.
- **Non-transferable Credit**: Reputation built within a single protocol is hard to reuse across protocols/scenarios.
- **Lack of Standardized Fulfillment Credentials**: There is no composable on-chain asset for "commitment → fulfillment → credit enhancement".

## OATH Core Solution
- **Commitment Assetization**: Users/projects create "Vows", lock collateral, and commit to goals (e.g., APY, milestones).
- **On-chain Credentials**: Upon fulfillment, automatically mint **SBT/credentials**, forming composable and transferable on-chain credit history.
- **Verifiability & Arbitration**: Integrate **Switchboard** oracles, combine on-chain/off-chain evidence (Arweave/IPFS) for arbitrable processes.
- **DeFi Scenario Entry**: Collaborate with MetaMorpho-like lending/yield vaults as a "credit enhancement layer" to attract capital inflow.

## Tech Stack & Contract Info (Aptos)
- **Frontend**: Next.js + React + TypeScript + Tailwind CSS (with Recharts for data visualization)
- **Wallets**: Petra / Martian (Aptos Wallet Adapter or `window.aptos`)
- **SDK**: `@aptos-labs/ts-sdk` (Testnet interaction)
- **Oracle**: Switchboard (APY/price/milestone verification, can be scripted for hackathon)
- **Storage**: On-chain hash + Arweave/IPFS (raw evidence/materials)
- **Contract (Testnet)**:
  - Address: `0xa3228904a096599a799b74cb18ddd0eb0a78e49c07c119b80d597c804476b0e0`
  - Module: `oath`
  - Key Functions: `create_oath`, `get_oath`, `complete_oath_and_mint_sbt`, `get_sbt`

## Product Form (MVP)
- **Landing**: Core metrics (Total Value Vowed, Active, Fulfilled, Broken), entry points (Explore / Make a Vow).
- **Vow Marketplace**: Filter by collateral value, expiry, type, status; card-style reputation visualization.
- **Create Vow**: Templates (APY commitment/milestone/token lock), multi-token collateral, wallet signature submission.
- **Detail Page**: On-chain status, transaction history, collateral, evidence & arbitration, real-time APY/TVL charts (Switchboard).
- **Vault Integration**: Fund managers can create APY vows with collateral to attract USDC deposits (remove shares concept, use amount ratio for equity).

## Business & Ecosystem
- **Revenue**: Protocol fee (1–2%), arbitration service fee (~1%), premium features (credit score/API, whitelist, risk control suite).
- **Value**: As Aptos ecosystem's **credit infrastructure**, accumulates reusable fulfillment data and reputation network across scenarios.
- **Expansion**: From DeFi → DAO delivery, GameFi tournaments, supply chain fulfillment, freelance transactions, and more on-chain/off-chain scenarios.

## Milestones (Hackathon Version)
- ✅ Frontend framework & UI (TS + Next.js + Tailwind)
- ✅ Wallet connection & basic transaction flow (Petra/Martian)
- ✅ Vow creation/browse/detail pages (with mock data & charts)
- ✅ Vault marketplace & details (Aptos-ized MetaMorpho logic)
- 🔜 Oracle integration & automated arbitration (Switchboard Testnet/scripted)
- 🔜 Credit scoring & composable interfaces (SBT+API)

## Team Info
- **smiley** (Frontend/Architecture): Concept initiator, Next.js/TS architecture, wallet & chart integration, UX.
- **Zhiming** (Move/Contract & Backend): Aptos contract, oracle & verification logic, transaction flow.
- **jeff** (Product & Ecosystem BD): Scenario mapping, commercialization strategy, ecosystem cooperation.

## Open Source Repo & References
- **Codebase**: [`TheDAS-designer/oath_defi`](https://github.com/TheDAS-designer/oath_defi.git)
- References & Notes:
  - Aptos & TS SDK, Wallet Adapter integration (frontend part of repo)
  - Contract modules & CLI interaction scripts (`contract/` and `tests/`)

> For more details and demo, please refer to the repo README and `frontend/` directory, or contact us for demo environment and test wallet.