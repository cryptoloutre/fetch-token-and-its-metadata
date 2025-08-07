import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplTokenMetadata, fetchDigitalAsset } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';

async function getTokenMetadata() {

    const mint = publicKey("paste-the-token-address-here");

    const umi = createUmi("https://api.mainnet-beta.solana.com").use(mplTokenMetadata());

    let tokenName;
    let tokenSymbol;
    let tokenLogo;

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
