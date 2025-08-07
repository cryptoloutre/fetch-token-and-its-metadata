## Installation

To fetch the metadata of a token, we will need some dependencies. To install them, run the following command:

```
npm install @metaplex-foundation/umi @metaplex-foundation/mpl-token-metadata @metaplex-foundation/umi-bundle-defaults
```

## Token using the Token Metadata Standard

According to the [Metaplex's docs](https://docs.metaplex.com/programs/token-metadata/overview#introduction), a token using the Token Metadata Standard is attached to a `Metadata Account` where the metadata (both on-chain and off-chain) are stored (among others token's name, symbol, logo, description). This `Metadata Account` is attached to the token `Mint Account` via a [Program Derived Address (PDA)](https://solanacookbook.com/core-concepts/pdas.html#facts). The seeds of this PDA are: the term 'metadata', the public key of the token metadata program and the public key of the token mint. Don't worry, there's no need to remember it since the Metaplex SDK can calculate it for us.

When a token uses the Token Metadata Standard, we can easily retrieve its metadata using the Metaplex SDK. If we don't know in advance if the token uses the Token Metadata Standard, we only need to make sure in advance that the `Metadata Account` exists, otherwise we will get an error message.

We will show the entire code and then talk through what is going on.

```typescript
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplTokenMetadata, fetchDigitalAsset } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';

async function getTokenMetadata() {

    const mint = publicKey("paste-the-token-address-here");

    let tokenName;
    let tokenSymbol;
    let tokenLogo;

    const umi = createUmi("https://api.mainnet-beta.solana.com").use(mplTokenMetadata());

    const asset = await fetchDigitalAsset(umi, mint);

    tokenName = asset.metadata.name;
    tokenSymbol = asset.metadata.symbol;

    const uri = asset.metadata.uri;

    try {
        const response = await fetch(uri);
        const result = await response.json();
        tokenLogo = result.image
    }

    catch {
        console.log("Can't fetch the URI")
    }

    const metadata = {
        name: tokenName,
        symbol: tokenSymbol,
        logo: tokenLogo
    }

    console.log(metadata)
}
```
Okay let’s step through it:

```typescript
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplTokenMetadata, fetchDigitalAsset } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';
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
const umi = createUmi("https://api.mainnet-beta.solana.com").use(mplTokenMetadata());
```

We create a new UMI instance.

```typescript
const asset = await fetchDigitalAsset(umi, mint);
```

We fetch our asset with the mint.

```typescript
    tokenName = asset.metadata.name;
    tokenSymbol = asset.metadata.symbol;
```
We get the name and the symbol of our asset in its metadata.

```typescript
const uri = asset.metadata.uri;

    try {
        const response = await fetch(uri);
        const result = await response.json();
        tokenLogo = result.image
    }

    catch {
        console.log("Can't fetch the URI")
    }
```
We get the URI of the asset where lives the off-chain metadata. We fetch them and get the logo of our token.

```typescript
    const metadata = {
        name: tokenName,
        symbol: tokenSymbol,
        logo: tokenLogo
    }

    console.log(metadata)
```

We store the metadata in an object and log it.
