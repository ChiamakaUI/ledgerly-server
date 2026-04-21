import { PublicKey, SystemProgram } from "@solana/web3.js";
import anchor from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  getProgram,
  getProgramId,
  getPlatformKeypair,
  getConnection,
  getMintAddress,
  getPlatformFeeWallet,
} from "../config/index.js";
import type { SerializedInstruction } from "../types/index.js";

const { BN } = anchor;
// ============================================
// PDA derivation
// ============================================
 
export function deriveStreamPDA(
  streamName: string,
  host: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("stream"), Buffer.from(streamName), host.toBuffer()],
    getProgramId()
  );
}
 
export function deriveDonorPDA(
  stream: PublicKey,
  donor: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("donor"), stream.toBuffer(), donor.toBuffer()],
    getProgramId()
  );
}

// ============================================
// Serialize instruction for client-side signing
// ============================================
 
function serializeInstruction(ix: any): SerializedInstruction {
  return {
    keys: ix.keys.map((k: any) => ({
      pubkey: k.pubkey.toString(),
      isSigner: k.isSigner,
      isWritable: k.isWritable,
    })),
    programId: ix.programId.toString(),
    data: Buffer.from(ix.data).toString("base64"),
  };
}

// ============================================
// Initialize a Conditional stream (escrow)
// ============================================
export async function initializeEscrow(params: {
  streamName: string;
  unlockTime: number;
  minAmount: number;
}): Promise<{
  streamPDA: string;
  streamATA: string;
  signature: string;
}> {
  const program = getProgram();
  const platform = getPlatformKeypair();
  const mint = getMintAddress();
 
  const [streamPDA] = deriveStreamPDA(params.streamName, platform.publicKey);
  const streamATA = await getAssociatedTokenAddress(mint, streamPDA, true);
 
  const signature = await program.methods
    .initialize(
      params.streamName,
      {
        conditional: {
          minAmount: new BN(params.minAmount),
          unlockTime: new BN(params.unlockTime),
        },
      },
      null
    )
    .accounts({
      host: platform.publicKey,
      stream: streamPDA,
      mint: mint,
      streamAta: streamATA,
      systemProgram: SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([platform])
    .rpc();
 
  return {
    streamPDA: streamPDA.toBase58(),
    streamATA: streamATA.toBase58(),
    signature,
  };
}

// ============================================
// Build deposit instruction for caller to sign client-side
// ============================================
 
export async function buildDepositInstruction(params: {
  streamName: string;
  callerWallet: string;
  amount: number;
}): Promise<{
  instruction: SerializedInstruction;
  donorPDA: string;
  streamPDA: string;
  streamATA: string;
}> {
  const program = getProgram();
  const platform = getPlatformKeypair();
  const mint = getMintAddress();
  const callerPubkey = new PublicKey(params.callerWallet);
 
  const [streamPDA] = deriveStreamPDA(params.streamName, platform.publicKey);
  const streamATA = await getAssociatedTokenAddress(mint, streamPDA, true);
  const callerATA = await getAssociatedTokenAddress(mint, callerPubkey);
  const [donorPDA] = deriveDonorPDA(streamPDA, callerPubkey);
 
  const ix = await program.methods
    .deposit(new BN(params.amount))
    .accounts({
      donor: callerPubkey,
      stream: streamPDA,
      donorAccount: donorPDA,
      donorAta: callerATA,
      streamAta: streamATA,
      systemProgram: SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
 
  return {
    instruction: serializeInstruction(ix),
    donorPDA: donorPDA.toBase58(),
    streamPDA: streamPDA.toBase58(),
    streamATA: streamATA.toBase58(),
  };
}

// ============================================
// Distribute funds to a recipient
// ============================================
 
export async function distributeEscrow(params: {
  streamName: string;
  recipientWallet: string;
  amount: number;
}): Promise<{ signature: string }> {
  const program = getProgram();
  const platform = getPlatformKeypair();
  const mint = getMintAddress();
  const recipientPubkey = new PublicKey(params.recipientWallet);
 
  const [streamPDA] = deriveStreamPDA(params.streamName, platform.publicKey);
  const streamATA = await getAssociatedTokenAddress(mint, streamPDA, true);
  const recipientATA = await getAssociatedTokenAddress(mint, recipientPubkey);
 
  const signature = await program.methods
    .distribute(new BN(params.amount))
    .accounts({
      host: platform.publicKey,
      recipient: recipientPubkey,
      mint: mint,
      stream: streamPDA,
      streamAta: streamATA,
      recipientAta: recipientATA,
      systemProgram: SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([platform])
    .rpc();
 
  return { signature };
}

/**
 * Distribute with fee split.
 * Sends host's share to their wallet, fee to platform fee wallet.
 */
export async function distributeWithFee(params: {
  streamName: string;
  hostWallet: string;
  totalAmount: number;
  feeBps: number;
}): Promise<{
  hostSignature: string;
  feeSignature: string | null;
  hostAmount: number;
  feeAmount: number;
}> {
  const feeAmount = Math.floor((params.totalAmount * params.feeBps) / 10000);
  const hostAmount = params.totalAmount - feeAmount;
 
  const { signature: hostSignature } = await distributeEscrow({
    streamName: params.streamName,
    recipientWallet: params.hostWallet,
    amount: hostAmount,
  });
 
  let feeSignature: string | null = null;
  if (feeAmount > 0) {
    const feeResult = await distributeEscrow({
      streamName: params.streamName,
      recipientWallet: getPlatformFeeWallet().toBase58(),
      amount: feeAmount,
    });
    feeSignature = feeResult.signature;
  }
 
  return { hostSignature, feeSignature, hostAmount, feeAmount };
}
 
// ============================================
// Refund — return full amount to caller
// ============================================
 
export async function refundEscrow(params: {
  streamName: string;
  callerWallet: string;
  amount: number;
}): Promise<{ signature: string }> {
  const program = getProgram();
  const platform = getPlatformKeypair();
  const callerPubkey = new PublicKey(params.callerWallet);
 
  const [streamPDA] = deriveStreamPDA(params.streamName, platform.publicKey);
  const streamATA = await getAssociatedTokenAddress(
    getMintAddress(),
    streamPDA,
    true
  );
  const callerATA = await getAssociatedTokenAddress(
    getMintAddress(),
    callerPubkey
  );
  const [donorPDA] = deriveDonorPDA(streamPDA, callerPubkey);
 
  const signature = await program.methods
    .refund(new BN(params.amount))
    .accounts({
      donor: callerPubkey,
      initiator: platform.publicKey,
      stream: streamPDA,
      donorAccount: donorPDA,
      donorAta: callerATA,
      streamAta: streamATA,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([platform])
    .rpc();
 
  return { signature };
}
 
// ============================================
// Verify a deposit transaction on-chain
// ============================================
 
export async function verifyDeposit(params: {
  signature: string;
  streamName: string;
  expectedAmount: number;
}): Promise<{ confirmed: boolean; error?: string }> {
  const connection = getConnection();
  const platform = getPlatformKeypair();
 
  try {
    const tx = await connection.confirmTransaction(
      params.signature,
      "confirmed"
    );
 
    if (tx.value.err) {
      return {
        confirmed: false,
        error: `Transaction failed: ${JSON.stringify(tx.value.err)}`,
      };
    }
 
    const program = getProgram();
    const [streamPDA] = deriveStreamPDA(params.streamName, platform.publicKey);
    const streamState = await program.account.streamState.fetch(streamPDA);
 
    if (streamState.totalDeposited.toNumber() < params.expectedAmount) {
      return {
        confirmed: false,
        error: `Insufficient deposit. Expected ${params.expectedAmount}, found ${streamState.totalDeposited.toNumber()}`,
      };
    }
 
    return { confirmed: true };
  } catch (err: any) {
    return { confirmed: false, error: err.message || String(err) };
  }
}
 