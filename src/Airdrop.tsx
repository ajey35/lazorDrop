import { useState, useEffect } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreeDots } from 'react-loader-spinner';
import { BeakerIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const connection = new Connection('https://rpc.lazorkit.xyz', {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
});

export default function AirdropDapp() {
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(true);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleAirdrop = async () => {
    if (!walletAddress) return toast.error('Please enter a wallet address');
    if (cooldown > 0) return;
    setLoading(true);

    try {
      const publicKey = new PublicKey(walletAddress);
      const signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);

      let retries = 0;
      let confirmed = false;
      while (retries < 15 && !confirmed) {
        const { value } = await connection.getSignatureStatus(signature, { searchTransactionHistory: true });
        if (value?.confirmationStatus === 'confirmed' || value?.confirmationStatus === 'finalized') {
          confirmed = true;
          break;
        }
        retries++;
        await new Promise((r) => setTimeout(r, 2000));
      }

      if (!confirmed) throw new Error('Confirmation timeout');
      toast.success('✅ Airdropped 1 SOL successfully!');
      setCooldown(30);
      fetchBalance();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      toast.error(`Airdrop failed: ${e.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    if (!walletAddress) return toast.error('Please enter a wallet address');
    setBalanceLoading(true);
    try {
      const lamports = await connection.getBalance(new PublicKey(walletAddress));
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch {
      toast.error('Failed to fetch balance');
    } finally {
      setBalanceLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-6 flex flex-col items-center justify-center text-white font-sans">
      <Toaster position="top-right" />

      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl p-8 max-w-md border border-purple-500/30"
            >
              <div className="text-center space-y-6">
                <div className="inline-flex bg-red-500/20 p-4 rounded-2xl">
                  <ExclamationTriangleIcon className="w-12 h-12 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-red-400 bg-clip-text text-transparent">
                  Development Warning
                </h2>
                <p className="text-white/80 leading-relaxed">
                  This tool is strictly for development purposes on the Solana Devnet. 
                  All airdropped SOL tokens have <span className="font-semibold">no real-world value</span>.
                </p>
                <button
                  onClick={() => setShowWarning(false)}
                  className="w-full py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-xl font-medium transition-colors"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="w-full max-w-xl bg-white/10 border border-white/20 backdrop-blur-xl rounded-3xl shadow-xl p-8 space-y-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
              LAZOR DROP
            </h1>
            <p className="text-sm text-white/70">Devnet Airdrop Tool</p>
          </div>
          <BeakerIcon className="w-10 h-10 text-purple-300" />
        </div>

        <div className="relative group">
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter wallet address"
            className="w-full p-4 rounded-xl bg-white/10 border-2 border-white/20 focus:ring-2 focus:ring-purple-400 placeholder-white/60 transition-all"
          />
          <div className="absolute inset-0 rounded-xl pointer-events-none border-2 border-transparent group-hover:border-purple-500/20 transition-all" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAirdrop}
            disabled={loading || cooldown > 0}
            className={`p-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all
              ${loading || cooldown > 0
                ? 'bg-purple-800/50 text-white/50 cursor-not-allowed'
                : 'bg-gradient-to-br from-purple-500 to-emerald-500 hover:shadow-lg'}`}
          >
            {loading ? (
              <ThreeDots height="24" width="24" color="#fff" />
            ) : (
              <>
                <span>{cooldown > 0 ? `Cooldown (${cooldown}s)` : 'Airdrop 1 SOL'}</span>
                {!loading && <div className="w-2 h-2 bg-white/20 rounded-full animate-pulse" />}
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchBalance}
            disabled={balanceLoading}
            className="p-4 bg-white/10 rounded-xl border-2 border-white/20 hover:bg-white/20 transition-colors flex items-center justify-center"
          >
            {balanceLoading ? (
              <ThreeDots height="24" width="24" color="#fff" />
            ) : (
              'Check Balance'
            )}
          </motion.button>
        </div>

        {balance !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/10 border-2 border-white/20 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-white/80">Current Balance:</span>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
                {balance.toFixed(4)} SOL
              </span>
            </div>
          </motion.div>
        )}

        <div className="pt-4 border-t border-white/10">
          <p className="text-center text-sm text-white/60">
            Transactions processed on Solana Devnet
          </p>
        </div>
      </motion.div>
    </div>
  );
}