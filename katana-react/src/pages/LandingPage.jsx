import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a1f2e] to-[#0f1419] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-[#EEFF00]/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-[#EEFF00]/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl"
        >
          {/* Logo/Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-8 inline-block"
          >
            <div className="w-24 h-24 bg-[#EEFF00] rounded-2xl flex items-center justify-center text-[#0f1419] text-5xl font-bold shadow-2xl shadow-[#EEFF00]/50">
              G
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-6xl md:text-8xl font-bold mb-6 text-[#EEFF00] tracking-tight"
            style={{ textShadow: '0 0 40px rgba(238, 255, 0, 0.3)' }}
          >
            KWOTE
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Secure, transparent, and decentralized voting powered by blockchain technology
            and AI-driven biometric verification
          </motion.p>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto"
          >
            <div className="glass p-6 rounded-xl">
              <div className="text-4xl mb-3">🔐</div>
              <h3 className="text-[#EEFF00] font-semibold mb-2">Secure</h3>
              <p className="text-gray-400 text-sm">Blockchain-based immutable voting records</p>
            </div>
            <div className="glass p-6 rounded-xl">
              <div className="text-4xl mb-3">🧠</div>
              <h3 className="text-[#EEFF00] font-semibold mb-2">AI-Powered</h3>
              <p className="text-gray-400 text-sm">Biometric face recognition verification</p>
            </div>
            <div className="glass p-6 rounded-xl">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-[#EEFF00] font-semibold mb-2">Transparent</h3>
              <p className="text-gray-400 text-sm">Real-time results and audit trails</p>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              to="/login"
              className="group relative px-8 py-4 bg-[#EEFF00] text-[#0f1419] rounded-xl font-bold text-lg
                       hover:bg-[#f5ff33] transition-all duration-300 shadow-lg shadow-[#EEFF00]/30
                       hover:shadow-xl hover:shadow-[#EEFF00]/50 hover:scale-105"
            >
              <span className="relative z-10">Enter Voting Portal</span>
              <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Link>

            <Link
              to="/elections"
              className="px-8 py-4 glass text-[#EEFF00] rounded-xl font-bold text-lg
                       hover:bg-[#EEFF00]/10 transition-all duration-300 border border-[#EEFF00]/30
                       hover:border-[#EEFF00]/60 hover:scale-105"
            >
              View Elections
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-16 flex flex-wrap justify-center gap-8 text-center"
          >
            <div>
              <div className="text-3xl font-bold text-[#EEFF00]">100%</div>
              <div className="text-gray-400 text-sm">Secure</div>
            </div>
            <div className="w-px bg-gray-700"></div>
            <div>
              <div className="text-3xl font-bold text-[#EEFF00]">24/7</div>
              <div className="text-gray-400 text-sm">Available</div>
            </div>
            <div className="w-px bg-gray-700"></div>
            <div>
              <div className="text-3xl font-bold text-[#EEFF00]">∞</div>
              <div className="text-gray-400 text-sm">Transparent</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-[#EEFF00]/30 rounded-full flex justify-center">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1.5 h-1.5 bg-[#EEFF00] rounded-full mt-2"
            ></motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
