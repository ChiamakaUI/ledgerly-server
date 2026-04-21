import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import anchor from "@coral-xyz/anchor";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { env } from "./env.js";

const { AnchorProvider, Program } = anchor;

const __dirname = dirname(fileURLToPath(import.meta.url));

let _connection: Connection;
let _platformKeypair: Keypair;
let _program: any;
let _idl: any;

export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(env().SOLANA_RPC_URL, "confirmed");
  }
  return _connection;
}

export function getPlatformKeypair(): Keypair {
  if (!_platformKeypair) {
    const keypairData = JSON.parse(
      readFileSync(env().PLATFORM_KEYPAIR_PATH, "utf-8"),
    );
    _platformKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
  }
  return _platformKeypair;
}

export function getIdl(): any {
  if (!_idl) {
    _idl = JSON.parse(
      readFileSync(
        join(__dirname, "../../src/idl/vidbloq_program.json"),
        "utf-8",
      ),
    );
  }
  return _idl;
}

// pubkey: A4bUtCiAp6fDbKLnM1cutgX7pKVSnaDdCAtpxwzTyeRy

export function getProgramId(): PublicKey {
  return new PublicKey(getIdl().address);
}

export function getProgram(): any {
  if (!_program) {
    const connection = getConnection();
    const platformKeypair = getPlatformKeypair();

    const provider = new AnchorProvider(
      connection,
      {
        publicKey: platformKeypair.publicKey,
        signTransaction: async (tx) => {
          (tx as Transaction).partialSign(platformKeypair);
          return tx;
        },
        signAllTransactions: async (txs) => {
          txs.forEach((tx) => (tx as Transaction).partialSign(platformKeypair));
          return txs;
        },
      },
      { commitment: "confirmed" },
    );

    _program = new Program(getIdl() as any, provider) as any;
  }
  return _program;
}

export function getMintAddress(): PublicKey {
  return new PublicKey(env().USDC_MINT);
}

export function getPlatformFeeWallet(): PublicKey {
  return new PublicKey(env().PLATFORM_FEE_WALLET);
}

// function isValid(s: string): boolean {
//   const arr = [];
//   const openBrackets = ["(", "{", "["];
//   const closedBrackets = [")", "}", "]"];

//   for (const key of s) {
//     if (openBrackets.includes(key)) {
//       console.log(key);
//       arr.push(key);
//     } else if (closedBrackets.includes(key)){
//       const openPair = openBrackets[closedBrackets.indexOf(key)];
//       if (arr[arr.length - 1] === openPair){
//         arr.splice(1,1)
//       } else {
//         arr.push(key)
//         break
//       }
//       console.log("2",key);
//     }
//   }

//   console.log({arr})
//   return true;
// }

// for (let i = 0; i < s.length; i++) {

// }

//   if (s.includes()) {}
// }
