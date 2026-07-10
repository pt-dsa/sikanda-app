import React from "react";
import { motion } from "motion/react";

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[400px] mx-auto py-20 space-y-6 h-[50vh]">
      <p className="text-gray-700 dark:text-gray-300 font-bold text-center text-lg animate-pulse">
        Mohon tunggu.. SIKANDA sedang bersiap..
      </p>
      <div className="w-full h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden shadow-inner border border-gray-300/30 dark:border-gray-600/30">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity }}
        />
      </div>
    </div>
  );
}
