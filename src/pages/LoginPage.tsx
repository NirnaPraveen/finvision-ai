import React from 'react';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, browserPopupRedirectResolver } from 'firebase/auth';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { BarChart3, ShieldCheck, Zap, Users } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const { user, loading } = useAuth();

  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      await signInWithPopup(auth, provider, browserPopupRedirectResolver);
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.code === 'auth/popup-blocked') {
        toast.error("Popup blocked! Please allow popups for this site to sign in.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Silent or small toast
        toast.info("Login cancelled.");
      } else if (error.code === 'auth/popup-closed-by-user') {
        toast.info("Login window closed.");
      } else {
        toast.error("Authentication failed. Please try again or refresh the page.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-black overflow-hidden">
      {/* Left Side - Branding & Features */}
      <div className="flex-1 bg-slate-900 dark:bg-black p-10 lg:p-20 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/20 blur-[150px] rounded-full -mr-64 -mt-64 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full -ml-64 -mb-64 animate-pulse [animation-delay:2s]" />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-16">
            <div className="w-12 h-12 premium-gradient rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-500/40">
              <BarChart3 className="text-white w-7 h-7" />
            </div>
            <span className="text-3xl font-display font-bold text-white tracking-tight">FinVision</span>
          </div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="text-5xl lg:text-7xl font-display font-bold text-white leading-[1.1] mb-8 tracking-tight"
          >
            Intelligent Finance <br />
            <span className="text-brand-400">for the Modern World.</span>
          </motion.h1>
          
          <p className="text-slate-400 text-xl max-w-lg mb-16 leading-relaxed font-medium">
            Master your spending, track shared expenses, and optimize subscriptions with AI-powered insights.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {[
              { icon: Zap, title: "AI Insights", desc: "Smart categorization & spending alerts." },
              { icon: Users, title: "Shared Splits", desc: "Collaborative expense management." },
              { icon: ShieldCheck, title: "Secure", desc: "Enterprise-grade data protection." },
              { icon: BarChart3, title: "Insights", desc: "Deep dive into your financial health." },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i + 0.5, duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                className="flex gap-5 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-white/10 transition-colors duration-300">
                  <feature.icon className="w-6 h-6 text-brand-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base tracking-tight">{feature.title}</h3>
                  <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-16 pt-10 border-t border-white/10">
          <p className="text-slate-500 text-sm font-medium tracking-wide uppercase">© 2026 FinVision AI. Designed for Excellence.</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-10 bg-slate-50 dark:bg-black relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-50/50 dark:from-brand-900/10 via-transparent to-transparent opacity-50" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="w-full max-w-md relative z-10"
        >
          <div className="glass-card p-10 lg:p-14 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border-white/60 dark:border-white/10">
            <h2 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 dark:text-gray-400 mb-10 font-medium">Sign in to manage your financial future.</p>

            <button 
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-4 bg-white dark:bg-white/5 border border-white/60 dark:border-white/10 py-4 px-6 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-300 font-bold text-slate-700 dark:text-gray-200 shadow-sm active:scale-95 group"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Continue with Google
            </button>

            <div className="mt-10 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100/50 dark:border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-bold">
                <span className="bg-white/40 dark:bg-black/40 backdrop-blur-sm px-4 text-slate-400 dark:text-gray-500">Coming Soon</span>
              </div>
            </div>

            <div className="mt-10 space-y-5 opacity-40 pointer-events-none">
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-500 dark:text-gray-600 uppercase tracking-widest ml-1">Email Address</label>
                <input type="email" disabled className="w-full px-5 py-4 rounded-2xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-sm" placeholder="name@company.com" />
              </div>
              <button disabled className="w-full bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-gray-600 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs">Sign In</button>
            </div>

            <p className="mt-10 text-center text-xs text-slate-400 dark:text-gray-500 font-medium leading-relaxed">
              By continuing, you agree to our <span className="text-brand-600 dark:text-brand-400 font-bold cursor-pointer hover:underline">Terms of Service</span> and <span className="text-brand-600 dark:text-brand-400 font-bold cursor-pointer hover:underline">Privacy Policy</span>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
