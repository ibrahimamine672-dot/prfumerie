import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LoadingScreen.css';

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setVisible(false), 400);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 120);
    return () => clearInterval(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="loading-screen"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="loading-content">
            <motion.div
              className="loading-logo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <svg className="loading-monogram" width="80" height="80" viewBox="0 0 512 512">
                <rect width="512" height="512" fill="#ffffff" rx="4"/>
                <defs>
                  <linearGradient id="loadGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d4bca0"/>
                    <stop offset="50%" stopColor="#c4a882"/>
                    <stop offset="100%" stopColor="#b49876"/>
                  </linearGradient>
                </defs>
                <path d="M 48 230 L 256 40 L 464 230" stroke="url(#loadGold)" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="48" y1="230" x2="48" y2="244" stroke="url(#loadGold)" strokeWidth="14" strokeLinecap="round"/>
                <line x1="464" y1="230" x2="464" y2="244" stroke="url(#loadGold)" strokeWidth="14" strokeLinecap="round"/>
                <line x1="48" y1="244" x2="72" y2="244" stroke="url(#loadGold)" strokeWidth="14" strokeLinecap="round"/>
                <line x1="440" y1="244" x2="464" y2="244" stroke="url(#loadGold)" strokeWidth="14" strokeLinecap="round"/>
                <line x1="72" y1="244" x2="72" y2="440" stroke="url(#loadGold)" strokeWidth="14" strokeLinecap="round"/>
                <line x1="440" y1="244" x2="440" y2="440" stroke="url(#loadGold)" strokeWidth="14" strokeLinecap="round"/>
                <line x1="72" y1="440" x2="440" y2="440" stroke="url(#loadGold)" strokeWidth="14" strokeLinecap="round"/>
                <path d="M 218 440 L 218 346 Q 256 306 294 346 L 294 440" stroke="url(#loadGold)" strokeWidth="14" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="loading-brand">MAISON DORÉE</div>
              <div className="loading-tagline">PARIS</div>
            </motion.div>

            <motion.div
              className="loading-bar-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="loading-bar">
                <motion.div
                  className="loading-bar-fill"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="loading-percentage">
                {Math.min(Math.round(progress), 100)}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
