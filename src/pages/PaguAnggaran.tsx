import React from "react";
import { motion } from "motion/react";
import { WalletCards } from "lucide-react";

export default function PaguAnggaran() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 20 }}
        className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 p-8 md:p-12 rounded-3xl max-w-lg w-full shadow-2xl dark:shadow-none relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/10 dark:bg-green-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            <WalletCards className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
            Menu Dalam Pengembangan
          </h1>
          
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
            Menu <strong className="text-gray-900 dark:text-white font-semibold">Pagu Anggaran</strong> ini akan dikembangkan pada <strong className="text-gray-900 dark:text-white font-semibold">SIKANDA V2</strong>. Silakan nantikan pembaruan kami selanjutnya.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
