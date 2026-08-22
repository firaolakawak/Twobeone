import { useEffect, useState } from 'react';
import { Heart, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
  onComplete: () => void;
  checkingAuth?: boolean;
  authStatus?: 'checking' | 'authenticated' | 'unauthenticated';
}

export function SplashScreen({ onComplete, checkingAuth = true, authStatus = 'checking' }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Loading...');

  useEffect(() => {
    // Update status message based on auth status
    if (authStatus === 'checking') {
      setStatusMessage('Checking authentication...');
    } else if (authStatus === 'authenticated') {
      setStatusMessage('Welcome back!');
    } else if (authStatus === 'unauthenticated') {
      setStatusMessage('Redirecting...');
    }
  }, [authStatus]);

  useEffect(() => {
    // If auth check is complete, wait a bit then fade out
    if (!checkingAuth) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 500); // Wait for fade out animation
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [checkingAuth, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-500 to-sky-500"
        >
          <div className="text-center px-6">
            {/* Animated Heart Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2
              }}
              className="mb-6 flex justify-center"
            >
              <div className="relative">
                <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl" />
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0"
                >
                  <Heart className="w-24 h-24 text-white/50" />
                </motion.div>
              </div>
            </motion.div>

            {/* App Name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <h1 className="text-5xl text-white mb-2">TwoBeOne</h1>
              <p className="text-white/90 text-lg">Growing Together in Faith</p>
            </motion.div>

            {/* Status Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mt-12 space-y-3"
            >
              {authStatus === 'authenticated' ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <CheckCircle2 className="w-8 h-8 text-white mx-auto" />
                </motion.div>
              ) : (
                <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
              )}
              
              <motion.p
                key={statusMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-white/80 text-sm"
              >
                {statusMessage}
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}