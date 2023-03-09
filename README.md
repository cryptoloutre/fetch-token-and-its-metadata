# How to fetch the metadata of a SPL token

This tutorial aims to explain how to fetch the metadata of a token. For this, we will discuss the case where the token uses the [Token Metadata Standard](https://docs.metaplex.com/programs/token-metadata/overview) established by [Metaplex](https://www.metaplex.com/) and the case where it does not. Indeed, according to the date of creation of the token, it can not use this standard but use the [Solana Labs Token List](https://github.com/solana-labs/token-list) instead. For both cases, we will use Typescript.

## Table of contents
- [How to fetch the metadata of a SPL token](#how-to-fetch-the-metadata-of-a-spl-token)
  - [Table of contents](#table-of-contents)
  - [Installation](#installation)
  - [Token using the Token Metadata Standard](#token-using-the-token-metadata-standard)
  - [Token using the Solana Labs Token List](#token-using-the-solana-labs-token-list)
  - [Complete code](#complete-code)

## Installation

To fetch the metadata of a token, we will need some dependencies. To install them, run the following command:

```
npm install @metaplex-foundation/js @solana/web3.js @solana/spl-token-registry
```

## Token using the Token Metadata Standard

According to the [Metaplex's docs](https://docs.metaplex.com/programs/token-metadata/overview#introduction), a token using the Token Metadata Standard is attached to a `Metadata Account` where the metadata (both on-chain and off-chain) are stored (among others token's name, symbol, logo, description). This `Metadata Account` is attached to the token `Mint Account` via a [Program Derived Address (PDA)](https://solanacookbook.com/core-concepts/pdas.html#facts). The seeds of this PDA are: the term 'metadata', the public key of the token metadata program and the public key of the token mint. Don't worry, there's no need to remember it since the Metaplex SDK can calculate it for us.

When a token uses the Token Metadata Standard, we can easily retrieve its metadata using the Metaplex SDK. If we don't know in advance if the token uses the Token Metadata Standard, we only need to make sure in advance that the `Metadata Account` exists, otherwise we will get an error message.

We will show the entire code and then talk through what is going on.

```typescript
import { Metaplex } from "@metaplex-foundation/js";
import { Connection, PublicKey } from "@solana/web3.js";

async function getTokenMetadata() {
    const connection = new Connection("https://api.mainnet-beta.solana.com");
    const metaplex = Metaplex.make(connection);

    const mintAddress = new PublicKey("paste-the-token-address-here");

    let tokenName;
    let tokenSymbol;
    let tokenLogo;

    const metadataAccount = metaplex
        .nfts()
        .pdas()
        .metadata({ mint: mintAddress });

    const metadataAccountInfo = await connection.getAccountInfo(metadataAccount);

    if (metadataAccountInfo) {
          const token = await metaplex.nfts().findByMint({ mintAddress: mintAddress });
          tokenName= token.name;
          tokenSymbol= token.symbol;
          tokenLogo= token.json.image;
    }
}
```
Okay let’s step through it:

```typescript
import { Metaplex } from "@metaplex-foundation/js";
import { Connection, PublicKey } from "@solana/web3.js";
```

We import first what we need.

```typescript
const connection = new Connection("https://api.mainnet-beta.solana.com");
```

Then we define the Solana connection we want to use.

```typescript
const metaplex = Metaplex.make(connection);
```

This is the entry point to the SDK. We are just creating a new instance and passing it the Solana connection to get access to its API.

```typescript

const mintAddress = new PublicKey("paste-the-token-address-here");

let tokenName;
let tokenSymbol;
let tokenLogo;
```
We define the address of the token from which we want to fetch the metadata and create the variables that will store the desired information.

```typescript
const metadataAccount = metaplex
    .nfts()
    .pdas()
    .metadata({ mint: mintAddress });
```
We get the address of the `Metadata Account`.

```typescript
const metadataAccountInfo = await connection.getAccountInfo(metadataAccount);
```
We fetch the account info of the `Metadata Account`.

If `metadataAccountInfo` is equal to `null`, the `Metadata Account` doesn't exist meaning the token doesn't use the Token Metadata Standard and we can't use the Metaplex SDK to fecth its metadata. In this case, you will have to check [Token using the Solana Labs Token List](#Token-using-the-Solana-Labs-Token-List).

If `metadataAccountInfo` is not equal to `null`, the `Metadata Account` exist and we can use the Metaplex SDK to fecth its metadata.

```typescript
if (metadataAccountInfo) {
    const token = await metaplex.nfts().findByMint({ mintAddress: mintAddress });
    tokenName= token.name;
    tokenSymbol= token.symbol;
    tokenLogo= token.json.image;
    }
```
We check if `metadataAccountInfo` is equal to `null`. If it is not, we can use the `findByMint` method. This method returns an [`Nft` object](https://github.com/metaplex-foundation/js#the-nft-model) which contains all the information you need. Here we get the token's name, symbol and logo.


## Token using the Solana Labs Token List

If a token doesn't use the Token Metadata Standard, it uses the [Solana Labs Token List](https://github.com/solana-labs/token-list). This list store token and its metadata. It is noted that this list is obsolete since June 20,2022 in favor of the Token Metadata Standard.

We will show the entire code and then talk through what is going on.

```typescript
import { PublicKey } from "@solana/web3.js";
import { ENV, TokenListProvider } from "@solana/spl-token-registry";

async function getTokenMetadata() {

    const mintAddress = new PublicKey("paste-the-token-address-here");

    let tokenName;
    let tokenSymbol;
    let tokenLogo;

    const provider = await new TokenListProvider().resolve();
    const tokenList = provider.filterByChainId(ENV.MainnetBeta).getList();
    const tokenMap = tokenList.reduce((map, item) => {
        map.set(item.address, item);
            return map;
        }, new Map());

    const token = tokenMap.get(mintAddress.toBase58());
    tokenName= token.name;
    tokenSymbol= token.symbol;
    tokenLogo= token.logoURI;
}
```
Okay let’s step through it:

```typescript
import { PublicKey } from "@solana/web3.js";
import { ENV, TokenListProvider } from "@solana/spl-token-registry";
```

We import first what we need.

```typescript
    const mintAddress = new PublicKey("paste-the-token-address-here");

    let tokenName;
    let tokenSymbol;
    let tokenLogo;
```
We define the address of the token from which we want to fetch the metadata and create the variables that will store the desired information.

```typescript
    const provider = await new TokenListProvider().resolve();
    const tokenList = provider.filterByChainId(ENV.MainnetBeta).getList();
    const tokenMap = tokenList.reduce((map, item) => {
        map.set(item.address, item);
            return map;
        }, new Map());
```
Here we fetch all the tokens and their metadata in the Solana Labs Token List and store them in `tokenList`. With this `tokenList`, we do a mapping between the token mint address (in this list the token mint address is in Base58) and the metadata and store this map in `tokenMap`.

```typescript
    const token = tokenMap.get(mintAddress.toBase58());
    tokenName= token.name;
    tokenSymbol= token.symbol;
    tokenLogo= token.logoURI;
```

We get our token in the `tokenMap`. `token` contains the information you need. Here we get the token's name, symbol and logo.


## Complete code

Once everything is put together, the complete code is as follows:

```typescript
import { Metaplex } from "@metaplex-foundation/js";
import { Connection, PublicKey } from "@solana/web3.js";
import { ENV, TokenListProvider } from "@solana/spl-token-registry";

async function getTokenMetadata() {
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const metaplex = Metaplex.make(connection);

  const mintAddress = new PublicKey("paste-the-token-address-here");

  let tokenName;
  let tokenSymbol;
  let tokenLogo;

  const metadataAccount = metaplex
    .nfts()
    .pdas()
    .metadata({ mint: mintAddress });

    const metadataAccountInfo = await connection.getAccountInfo(metadataAccount);

    if (metadataAccountInfo) {
          const token = await metaplex.nfts().findByMint({ mintAddress: mintAddress });
          tokenName= token.name;
          tokenSymbol= token.symbol;
          tokenLogo= token.json?.image;

    }
    else {
        const provider = await new TokenListProvider().resolve();
        const tokenList = provider.filterByChainId(ENV.MainnetBeta).getList();
        console.log(tokenList)
        const tokenMap = tokenList.reduce((map, item) => {
          map.set(item.address, item);
          return map;
        }, new Map());

        const token = tokenMap.get(mintAddress.toBase58());

        tokenName= token.name;
        tokenSymbol= token.symbol;
        tokenLogo= token.logoURI;
    }
}
```
