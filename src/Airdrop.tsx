import { useState, useEffect } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { BeakerIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { ClipLoader } from 'react-spinners';

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
      <Toaster position="top-right" toastOptions={{
        className: '!bg-white/10 !text-white !backdrop-blur-xl',
        iconTheme: { primary: '#6366f1', secondary: '#fff' }
      }} />

      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-50"
          >
            <motion.div
              className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl p-8 max-w-md border border-purple-500/30 shadow-2xl"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
            >
              <div className="text-center space-y-6">
                <div className="inline-flex bg-red-500/20 p-4 rounded-2xl animate-pulse">
                  <ExclamationTriangleIcon className="w-12 h-12 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-red-400 bg-clip-text text-transparent">
                  Development Warning
                </h2>
                <p className="text-white/80 leading-relaxed">
                  This tool is strictly for development purposes on the Solana Devnet. 
                  All airdropped SOL tokens have <span className="font-semibold">no real-world value</span>.
                </p>
                <motion.button
                  onClick={() => setShowWarning(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-xl font-medium transition-colors"
                >
                  I Understand
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="w-full max-w-xl bg-white/10 border border-white/20 backdrop-blur-xl rounded-3xl shadow-2xl p-8 space-y-6 relative overflow-hidden"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 -z-1 opacity-20">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <motion.h1 
              className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent"
              animate={{ backgroundPosition: '100% 50%' }}
              transition={{
                repeat: Infinity,
                duration: 5,
                repeatType: 'mirror'
              }}
              style={{
                backgroundSize: '200% auto',
              }}
            >
              LAZOR DROP
            </motion.h1>
            <p className="text-sm text-white/70 mt-1">Devnet Airdrop Tool</p>
          </div>
          <motion.div 
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
          >
            <BeakerIcon className="w-10 h-10 text-purple-300" />
          </motion.div>
        </div>

        <div className="relative group">
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter wallet address"
            className="w-full p-4 rounded-xl bg-white/10 border-2 border-white/20 focus:ring-2 focus:ring-purple-400 placeholder-white/60 transition-all font-mono"
          />
          <div className="absolute inset-0 rounded-xl pointer-events-none border-2 border-transparent group-hover:border-purple-500/20 transition-all" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAirdrop}
            disabled={loading || cooldown > 0}
            className={`p-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all relative
              ${loading || cooldown > 0
                ? 'bg-purple-800/50 text-white/50 cursor-not-allowed'
                : 'bg-gradient-to-br from-purple-500 to-emerald-500 hover:shadow-lg'}`}
          >
            {loading ? (
              <ClipLoader size={24} color="#fff" />
            ) : (
              <>
                <span>{cooldown > 0 ? `Cooldown (${cooldown}s)` : 'Airdrop 1 SOL'}</span>
                {cooldown > 0 && (
                  <div className="absolute inset-0 rounded-xl border-2 border-purple-500/30 animate-pulse" />
                )}
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchBalance}
            disabled={balanceLoading}
            className="p-4 bg-white/10 rounded-xl border-2 border-white/20 hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
          >
            {balanceLoading ? (
              <ClipLoader size={24} color="#fff" />
            ) : (
              <>
                Check Balance
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                </svg>
              </>
            )}
          </motion.button>
        </div>

        {balance !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 border-2 border-white/20 rounded-xl p-4 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-white/80">Current Balance:</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
                  {balance.toFixed(4)} SOL
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M4.12 11.602L12 4.72l7.88 6.883-.974 1.299L12 7.517l-6.906 6.384-.974-1.3zM4.12 16.102L12 9.22l7.88 6.883-.974 1.299L12 12.017l-6.906 6.384-.974-1.3z"/>
                </svg>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div 
          className="pt-4 border-t border-white/10"
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-center text-sm text-white/60 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Transactions processed on Solana Devnet
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
