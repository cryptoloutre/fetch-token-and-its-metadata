import { Address, createSolanaRpc, getAddressEncoder, getProgramDerivedAddress, fetchEncodedAccount } from "@solana/kit";
import * as borsh from 'borsh';

async function getTokenMetadata() {

    const mint = "paste-the-token-address-here" as Address;

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

    let tokenName;
    let tokenSymbol;
    let tokenURI;
    let tokenLogo;

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
