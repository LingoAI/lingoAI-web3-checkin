# Holon · A world within you

A personal AI landing page and on-chain check-in DApp using a contract deployed on **opBNB Mainnet**, an EVM-compatible network in the **BNB Chain ecosystem**.

**Website:** [Holon Check-in](https://checkin.lingoai.io/)

## Technology Stack

- **Blockchain**: opBNB Mainnet (BNB Chain ecosystem), with BNB for gas.
- **Smart Contracts**: Existing deployed check-in contract, accessed through a minimal `checkIn()` ABI. Solidity source and compiler settings are not included in this repository.
- **Frontend**: React 19 + TypeScript + viem.
- **Development**: Node.js `>=22.12.0`, npm, Vite, Vitest, and React Testing Library.

## Supported Networks

- **opBNB Mainnet** — Chain ID: **204** (`0xcc`). This is the only network enabled in the application.
- **Primary RPC**: `https://opbnb-mainnet-rpc.bnbchain.org`
- **Fallback RPC**: `https://opbnb.publicnode.com`
- **Block explorer**: [opBNBScan](https://opbnb.bscscan.com)

Network parameters, the contract address, and ABI are defined in [src/web3/config.ts](src/web3/config.ts). Wallet network switching is implemented in [src/web3/provider.ts](src/web3/provider.ts), and contract calls in [src/web3/transactions.ts](src/web3/transactions.ts).

## Contract Addresses

| Network           | Core Check-in Contract                                                                                                     | Token Contract            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| **opBNB Mainnet** | [0x28f429e960b1ab313db8db36499c4cc24f8a16c1](https://opbnb.bscscan.com/address/0x28f429e960b1ab313db8db36499c4cc24f8a16c1) | Not used by this frontend |

The app calls `checkIn()` with no arguments and no attached BNB value or token approvals. Users need BNB on opBNB for network fees. Check-in eligibility and frequency are determined by the contract.

## Current Features

- **On-chain check-ins** through the deployed opBNB Mainnet contract.
- **Wallet discovery and network switching** for injected wallets and wallet App DApp browsers.
- **Pre-submission validation** of the RPC network, contract code, simulation result, account, and wallet network.
- **Receipt-based confirmation** with verification of the sender, contract, calldata, and value.
- **Pending transaction recovery** after refresh, with duplicate-submission prevention and handling for rejected, reverted, or replaced transactions.

## Roadmap

Growing into your personal AI twin. From the first connection to a world that grows with you.

| Timeline       | Milestone             | Status        | Focus                                                                                                                                           |
| -------------- | --------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Sep – Oct 2026 | **Foundation**        | Current focus | Bring the community together. Refine on-chain check-ins, welcome early testers, and shape Holon around real needs.                              |
| Nov – Dec 2026 | **Personal Ontology** | Planned       | Connect your concepts, experiences, and relationships. Explore a private alpha with personal data imports and answers grounded in your sources. |
| Q1 2027        | **Living Memory**     | Planned       | Carry meaningful context from one conversation to the next, with memories you can review, correct, and choose to forget.                        |
| Q2 2027        | **Personal AI Twin**  | Planned       | Open the public beta with richer knowledge connections, multilingual conversations, and control over your personal data.                        |
| H2 2027        | **Connected Holon**   | Exploring     | Bring your AI twin into more of your world through connected tools, developer APIs, and an expanding ecosystem.                                 |

## Getting Started

Requires **Node.js 22.12 or later**.

```sh
npm ci
npm run dev
```

The development server runs at [localhost:4173](http://127.0.0.1:4173/). On mobile, use an opBNB-compatible wallet's DApp browser to check in.

```sh
npm test
npm run build
```

The production build is written to `dist/`.
