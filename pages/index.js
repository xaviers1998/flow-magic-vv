import * as fcl from "@onflow/fcl";
import { send as transportGRPC } from "@onflow/transport-grpc";
import { useEffect } from "react";
import { useState } from "react";
import { magic } from "../lib/magic";

const Flow = () => {
    const [email, setEmail] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [publicAddress, setPublicAddress] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [userMetadata, setUserMetadata] = useState({});
    const [message, setMessage] = useState("");

    const login = async () => {
        await magic.auth.loginWithMagicLink({ email });
        setIsLoggedIn(true);
    };

    const logout = async () => {
        await magic.user.logout();
        setIsLoggedIn(false);
    };

    const verify = async () => {
        try {
            fcl.config({
                "grpc.metadata": {
                    api_key: "n2kc3ixb4dgp5c617zim036p4h9mcen8",
                },
                "accessNode.api": "https://flow-testnet.g.alchemy.com",
                "discovery.wallet":
                    "https://fcl-discovery.onflow.org/testnet/authn",
                "sdk.transport": transportGRPC,
            });

            // CONFIGURE WALLET
            // replace with your own wallets configuration
            // Below is the local environment configuration for the dev-wallet
            fcl.config().put(
                "discovery.wallet",
                "http://access-001.devnet9.nodes.onflow.org:8000"
            );
            const AUTHORIZATION_FUNCTION = magic.flow.authorization;

            const getReferenceBlock = async () => {
                const response = await fcl.send([fcl.getBlock()]);
                const data = await fcl.decode(response);
                return data.id;
            };

            console.log("SENDING TRANSACTION");
            setVerifying(true);
            var response = await fcl.send([
                fcl.transaction`
          transaction {
            var acct: AuthAccount
    
            prepare(acct: AuthAccount) {
              self.acct = acct
            }
    
            execute {
              log(self.acct.address)
            }
          }
        `,
                fcl.ref(await getReferenceBlock()),
                fcl.limit(50),
                fcl.proposer(AUTHORIZATION_FUNCTION),
                fcl.authorizations([AUTHORIZATION_FUNCTION]),
                fcl.payer(AUTHORIZATION_FUNCTION),
            ]);
            console.log("TRANSACTION SENT");
            console.log("TRANSACTION RESPONSE", response);

            console.log("WAITING FOR TRANSACTION TO BE SEALED");
            var data = await fcl.tx(response).onceSealed();
            console.log("TRANSACTION SEALED", data);
            setVerifying(false);

            if (data.status === 4 && data.statusCode === 0) {
                setMessage("Congrats!!! I Think It Works");
            } else {
                setMessage(`Oh No: ${data.errorMessage}`);
            }
        } catch (error) {
            console.error("FAILED TRANSACTION", error);
        }
    };

    useEffect(() => {
        magic.user.isLoggedIn().then(async (magicIsLoggedIn) => {
            setIsLoggedIn(magicIsLoggedIn);
            if (magicIsLoggedIn) {
                const { publicAddress } = await magic.user.getMetadata();
                setPublicAddress(publicAddress);
                setUserMetadata(await magic.user.getMetadata());
            }
        });
    }, [isLoggedIn]);

    return (
        <>
            {!isLoggedIn && (
                <>
                    <input
                        type="email"
                        name="email"
                        required="required"
                        placeholder="Enter your email"
                        onChange={(event) => {
                            setEmail(event.target.value);
                        }}
                    />
                    <button onClick={() => login()}>Login</button>
                </>
            )}
            {isLoggedIn && (
                <>
                    <button onClick={() => verify()}>Verify</button>
                    <h2>
                        Address: {publicAddress ? publicAddress : "Loading..."}
                    </h2>
                    <h2>Current user: {userMetadata.email}</h2>
                    <h2>Message:</h2>
                    <p>{verifying ? "Verifying..." : message}</p>
                    <button onClick={() => logout()}>Logout</button>
                </>
            )}
        </>
    );
};

export default Flow;
