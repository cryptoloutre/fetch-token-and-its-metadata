## Installation

To fetch the metadata of a token, we will need some dependencies. To install them, run the following command:

```
npm install @solana/kit borsh
```

## Token using the Token Metadata Standard

According to the [Metaplex's docs](https://docs.metaplex.com/programs/token-metadata/overview#introduction), a token using the Token Metadata Standard is attached to a `Metadata Account` where the metadata (both on-chain and off-chain) are stored (among others token's name, symbol, logo, description). This `Metadata Account` is attached to the token `Mint Account` via a [Program Derived Address (PDA)](https://solanacookbook.com/core-concepts/pdas.html#facts). The seeds of this PDA are: the term 'metadata', the public key of the token metadata program and the public key of the token mint. 

We will show the entire code and then talk through what is going on.

```typescript
import { Address, createSolanaRpc, getAddressEncoder, getProgramDerivedAddress, fetchEncodedAccount } from "@solana/kit";
import * as borsh from 'borsh';

async function getTokenMetadata() {

    const mint = "paste-the-token-address-here" as Address;

    let tokenName;
    let tokenSymbol;
    let tokenURI;
    let tokenLogo;

    const rpc = createSolanaRpc("https://api.mainnet-beta.solana.com");
    const addressEncoder = getAddressEncoder();
    const TOKEN_METADATA_PROGRAM = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s' as Address;

    const schema = {
        'struct': {
            'name': 'string',
            'symbol': 'string',
            'uri': 'string'
        }
    }

    const seed1 = Buffer.from("metadata");
    const seed2 = addressEncoder.encode(TOKEN_METADATA_PROGRAM);
    const seed3 = addressEncoder.encode(mint);
    const seeds = [seed1, seed2, seed3];

    const [pda, bump] = await getProgramDerivedAddress({
        programAddress: TOKEN_METADATA_PROGRAM,
        seeds
    });

    const account = await fetchEncodedAccount(rpc, pda);

    if (account.exists) {
        // name starts at byte 65 and has a max length of 32 bytes. Given that 4 bytes are used to store the length of the string, name ends at byte 100
        // symbol starts at byte 101 and has a max length of 10 bytes. Given that 4 bytes are used to store the length of the string, symbol ends at byte 114
        // uri starts at byte 114 and has a max length of 200 bytes. Given that 4 bytes are used to store the length of the string, uri ends at byte 318
        const decoded = borsh.deserialize(schema, account.data.slice(65, 319));
        tokenName = decoded.name;
        tokenSymbol = decoded.symbol;
        tokenURI = decoded.uri;

        try {
            const response = await fetch(tokenURI);
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
}
```
Okay let’s step through it:

```typescript
import { Address, createSolanaRpc, getAddressEncoder, getProgramDerivedAddress, fetchEncodedAccount } from "@solana/kit";
import * as borsh from 'borsh';
```

We import first what we need.

```typescript

    const mint = "paste-the-token-address-here" as Address;

    let tokenName;
    let tokenSymbol;
    let tokenURI;
    let tokenLogo;
```
We define the address of the token from which we want to fetch the metadata and create the variables that will store the desired information.

```typescript
    const rpc = createSolanaRpc("https://api.mainnet-beta.solana.com");
```

We create a new Solana RPC instance.

```typescript
    const addressEncoder = getAddressEncoder();
```

We create an encoder that we can use to encode a base58-encoded address to a byte array.

```typescript
    const TOKEN_METADATA_PROGRAM = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s' as Address;

    const schema = {
        'struct': {
            'name': 'string',
            'symbol': 'string',
            'uri': 'string'
        }
    }
```
We define the address of the `Token Metadata Program` and the struct of the portion of metadata stored in the `Metadata Account` that we will get.

```typescript
    const seed1 = Buffer.from("metadata");
    const seed2 = addressEncoder.encode(TOKEN_METADATA_PROGRAM);
    const seed3 = addressEncoder.encode(mint);
    const seeds = [seed1, seed2, seed3];

    const [pda, bump] = await getProgramDerivedAddress({
        programAddress: TOKEN_METADATA_PROGRAM,
        seeds
    });

    const account = await fetchEncodedAccount(rpc, pda);
```
We define the seeds used in the PDA derivation of the `Metadata Account`. Then, we get the PDA address thanks to the `getProgramDerivedAddress()` function. Finally, we fetch the `Metadata Account` info with the `fetchEncodedAccount()` function.

```typescript
 if (account.exists) {
        // name starts at byte 65 and has a max length of 32 bytes. Given that 4 bytes are used to store the length of the string, name ends at byte 100
        // symbol starts at byte 101 and has a max length of 10 bytes. Given that 4 bytes are used to store the length of the string, symbol ends at byte 114
        // uri starts at byte 114 and has a max length of 200 bytes. Given that 4 bytes are used to store the length of the string, uri ends at byte 318
        const decoded = borsh.deserialize(schema, account.data.slice(65, 319));
        tokenName = decoded.name;
        tokenSymbol = decoded.symbol;
        tokenURI = decoded.uri;
```
If the account exists, we decode the account's info to get the name, the symbol and the uri.

```typescript

        try {
            const response = await fetch(tokenURI);
            const result = await response.json();
            tokenLogo = result.image
        }

        catch {
            console.log("Can't fetch the URI")
        }

```
We fetch the URI to get the off-chain metadata and then the logo of our token.

```typescript
    const metadata = {
        name: tokenName,
        symbol: tokenSymbol,
        logo: tokenLogo
    }

    console.log(metadata)
```

We store the metadata in an object and log it.
