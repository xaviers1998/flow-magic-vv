import { Magic } from "magic-sdk";
import { FlowExtension } from "@magic-ext/flow";

// Create client-side Magic instance
const createMagic = (key) => {
    return (
        typeof window != "undefined" &&
        new Magic(key, {
            extensions: [
                new FlowExtension({
                    rpcUrl: "https://flow-testnet.g.alchemy.com",
                    network: "testnet",
                }),
            ],
        })
    );
};

export const magic = createMagic(process.env.NEXT_PUBLIC_MAGIC_PUBLISH_KEY);
