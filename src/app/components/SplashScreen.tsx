import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { BrandLoader } from './BrandLoader';

interface SplashScreenProps {
  onComplete: () => void;
  checkingAuth?: boolean;
  authStatus?: 'checking' | 'authenticated' | 'unauthenticated';
}

export function SplashScreen({ onComplete, checkingAuth = true, authStatus = 'checking' }: SplashScreenProps) {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(true);
  const statusMessage = authStatus === 'checking'
    ? t.splash.checkingAuthentication
    : authStatus === 'authenticated' ? t.splash.welcomeBack : t.splash.redirecting;

  useEffect(() => {
    if (checkingAuth) return;
    setIsVisible(false);
    const timer = window.setTimeout(onComplete, reducedMotion ? 0 : 250);
    return () => window.clearTimeout(timer);
  }, [checkingAuth, onComplete, reducedMotion]);

  return <AnimatePresence>
    {isVisible && <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
    >
      <div className="text-center px-6 space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">TwoBeOne</h1>
        <p className="tbo-body text-muted-foreground">{t.splash.tagline}</p>
        <BrandLoader label={statusMessage} size={96} className="pt-6" />
      </div>
    </motion.div>}
  </AnimatePresence>;
}
