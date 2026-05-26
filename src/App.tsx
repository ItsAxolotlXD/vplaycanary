/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, ChangeEvent, FormEvent, MouseEvent, ReactNode, Fragment, Dispatch, SetStateAction } from "react";
import { Search, User, Copy, Tv, Calendar, Home, Play, Pause, Radio, Info, Sun, Moon, Maximize, Settings, Volume2, VolumeX, CheckCircle2, Check, Shield, LogOut, LogIn, Heart, X, Lock, Terminal, Zap, Clock, History, MousePointer2, Sliders, ChevronLeft, ChevronRight, Mic, Layers, Filter, Sparkles, Camera, Palette, Layout, MessageSquare, Eye, EyeOff, ExternalLink, Monitor, Columns, Maximize2, Circle, AlertCircle, RotateCcw, Droplet, Trophy, Film, Music, Globe, Users, Activity, ShieldCheck, LayoutGrid, LayoutDashboard, ArrowRight, ArrowLeft, TrendingUp, Star, Crown, Menu, Pin, Wrench, Settings2, FileCode, Minus, Square, Minimize2, FlaskConical as Flask, MapPin, Cloud, Plus, Folder, File, HardDrive, SkipBack, SkipForward, RefreshCw, RefreshCcw, Wifi, Battery, ChevronUp, ChevronDown, Image as ImageIcon, ShieldAlert, Trash2, Video, Download, Pizza, Gavel, MoreVertical, GripVertical, Upload, Compass, Share2, Scissors, Clipboard, Type, List, MoreHorizontal, Bell, Timer, PlayCircle, MousePointer, Type as TextIcon, CheckSquare, ToggleLeft, PanelTop, Mouse, ListTodo, Hash, Gamepad, Newspaper, ChevronsUpDown, CloudLightning, Grid, ShoppingBag, Bitcoin, StickyNote, Mail } from "lucide-react";
import Hls from "hls.js";
import { motion, AnimatePresence, MotionConfig, Reorder } from "motion/react";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail, User as FirebaseUser, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp, updateDoc, arrayUnion, getDocFromServer, addDoc } from "firebase/firestore";

import { channels, Channel } from "./channels";
import { VconnectContent } from "./components/VconnectContent";

// Test connection as per critical directive
// Test connection removed

interface CustomTab {
  id: string;
  name: string;
  icon: string;
  content: string;
  type: "html" | "visual";
  visualItems?: {
    id: string;
    type: "button" | "text" | "heading" | "image";
    label?: string;
    value?: string;
    style?: any;
    action?: string;
  }[];
}

const SettingsIcon = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <Settings size={size} className={`${className} flex-shrink-0`} />
);

const vplayLogo = "https://static.wikia.nocookie.net/ftv/images/0/0f/Nx626.png/revision/latest/scale-to-width-down/1000?cb=20260505125314&path-prefix=vi";

const vpilotIcon = "https://static.wikia.nocookie.net/ftv/images/3/30/Icon_AI_TOols.png/revision/latest?cb=20260507071656&path-prefix=vi";

const PIZZA_EXPERIMENTS = {
  app: [
    { id: 'sidebar_resizable', name: 'Resizable sidebar', status: 'Active', desc: 'Cho phép điều chỉnh độ rộng của sidebar bằng cách kéo thả.' },
    { id: 'multiview_experimental', name: 'Multiview (Picture-in-Picture)', status: 'Beta', desc: 'Xem nhiều kênh truyền hình cùng một lúc.' },
    { id: 'disable_animation', name: 'Reduce Animation', status: 'Stable', desc: 'Giảm hiệu ứng chuyển động, tiết kiệm tài nguyên.' },
    { id: 'settings_vertical', name: 'List Settings', status: 'Beta', desc: 'Chuyển layout cài đặt về dạng danh sách (yêu cầu XAML View).' },
    { id: 'xaml_home', name: 'XAML Home Page', status: 'Internal', desc: 'Sử dụng trang chủ thế hệ mới dựa trên XAML system.' },
    { id: 'xaml_experience', name: 'Vplay Symphony UI', status: 'Active', desc: 'Trải nghiệm giao diện hoàn toàn mới được tái thiết kế.' },
    { id: 'cobalt_scrollbar', name: 'Cobalt UI 3 Scrollbar', status: 'Experimental', desc: 'Replaces the default browser scrollbar to the new scrollbar of Cobalt UI version 3' },
    { id: 'vids_feature', name: 'Vids Feature', status: 'Experimental', desc: 'Kích hoạt tính năng Vids đăng tải post, blog, polls, ảnh/video dưới 1GB.' }
  ],
  widgets: [
    { id: 'settings_on_widgets', name: 'Settings on Widgets', status: 'Experimental', desc: 'Moves the app settings in the Widgets Dashboard.' },
    { id: 'blur_my_feed', name: 'Backdrop blur for Widgets', status: 'Active', desc: 'Blur the background behind the widgets board' },
    { id: 'widgets_feed_treatments', name: 'Widgets Feed Treatments', status: 'Beta', desc: 'Mỗi lần làm mới trang web sẽ tự động kích hoạt một kiểu giao diện Widgets Feed khác nhau.' }
  ]
};

const SEARCH_TREATMENTS = [
  "Search Vplay",
  "Search channels",
  "Find channels",
  "Search",
  "Find",
  "Find and search",
  "Find and operate"
];
const splashLogo = "https://static.wikia.nocookie.net/ftv/images/0/0f/Nx626.png/revision/latest/scale-to-width-down/1000?cb=20260505125314&path-prefix=vi";
const startIcon = "https://static.wikia.nocookie.net/ftv/images/a/a6/Imagedskvjndkv.png/revision/latest?cb=20260430103502&path-prefix=vi";

const splashBg = "https://static.wikia.nocookie.net/ftv/images/f/f4/Nx262.png/revision/latest/scale-to-width-down/1000?cb=20260505131224&path-prefix=vi";

const STANDARD_LOADING_GIF = "https://upload.wikimedia.org/wikipedia/commons/3/3f/Windows-loading-cargando.gif";
const REVAMPED_LOADING_GIF = "https://cdn.pixabay.com/animation/2023/10/08/03/19/03-19-26-213_512.gif";

const LoadingAnimation = ({ isDark, featureFlags, className = "w-10 h-10" }: { isDark?: boolean, featureFlags?: any, className?: string }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="relative w-12 h-12"
      >
        <svg className="w-full h-full" viewBox="0 0 50 50">
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="90, 150"
            className="text-blue-600"
          />
        </svg>
      </motion.div>
    </div>
  );
};

const SplashView = ({ text, subtext, featureFlags }: { key?: string, text: string, subtext?: string, featureFlags?: any }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100001] bg-black/60 backdrop-blur-sm flex items-center justify-center font-forced-montserrat font-light leading-relaxed select-none overflow-hidden"
  >
    <div className="w-full bg-[#1e0a5c] text-white py-14 px-8 md:px-24 border-t border-b border-white/10 shadow-2xl">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-8 text-left font-forced-montserrat font-light leading-relaxed">
        <div className="space-y-3 w-full">
          <h2 className="text-3xl md:text-4xl text-white font-forced-montserrat font-light leading-tight tracking-wide">
            {text || "Just a moment"}
          </h2>
          {subtext && (
            <p className="text-sm md:text-base text-white/95 font-forced-montserrat font-light leading-relaxed w-full font-forced-montserrat font-light">
              {subtext}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-4 pt-4">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/3/3f/Windows-loading-cargando.gif" 
            alt="loading" 
            className="w-7 h-7 object-contain shrink-0" 
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  </motion.div>
);

const SplashScreen = ({ isDark, onEnter, isSessionChange = false, isUpdating = false, featureFlags }: { key?: string, isDark: boolean, onEnter: () => void, isSessionChange?: boolean, isUpdating?: boolean, featureFlags?: any }) => {
  const isWelcome = !isUpdating && !isSessionChange;
  const [showBypass, setShowBypass] = useState(isWelcome);
  const [progress, setProgress] = useState(0);
  const [showPassPrompt, setShowPassPrompt] = useState(false);
  const [passInput, setPassInput] = useState("");
  const [passError, setPassError] = useState(false);
  
  useEffect(() => {
    let duration = 5000; 
    if (isSessionChange) duration = 5000;
    if (isUpdating) duration = 30000; 
    
    const interval = 100;
    const step = (100 / (duration / interval));
    
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const next = prev + step;
        return next >= 100 ? 100 : next;
      });
    }, interval);

    const timer = setTimeout(() => {
      onEnter();
    }, duration);
    
    let bypassTimer: NodeJS.Timeout | null = null;
    if (!isWelcome) {
      bypassTimer = setTimeout(() => {
        setShowBypass(true);
      }, 5000);
    }
    
    return () => {
      clearInterval(progressTimer);
      clearTimeout(timer);
      if (bypassTimer) clearTimeout(bypassTimer);
    };
  }, [onEnter, isSessionChange, isUpdating, isWelcome]);

  const handleBypass = (e: React.FormEvent) => {
    e.preventDefault();
    if (passInput === "sus") {
      onEnter();
    } else {
      setPassError(true);
      setTimeout(() => setPassError(false), 2000);
    }
  };

  const filesToLoad = [
    "system/loader.bin",
    "system/kernel.sys",
    "system/config.cfg",
    "system/gui.dll",
    "system/vplay_core.wasm",
    "system/vplay_api.dll",
    "services/media_service.sys",
    "services/audio_driver.dll",
    "services/video_decoder.sys",
    "resources/theme_renderer.dll",
    "resources/fonts/Inter-Light.ttf",
    "resources/fonts/JetBrainsMono-Regular.ttf",
    "resources/icons/lucide.pack",
    "resources/images/backgrounds.cfg",
    "widgets/widgets_feed.json",
    "widgets/weather_widget.js",
    "widgets/clock_widget.js",
    "widgets/news_board.js",
    "widgets/vstore_list.db",
    "data/index_db.bin",
    "data/user_profile.dat",
    "data/playback_history.json",
    "data/settings_v2.dat",
    "security/security_provider.dll",
    "security/firewall.cfg",
    "security/auth_state.bin",
    "shell/explorer.exe",
    "shell/desktop.dll",
    "shell/taskbar.dll",
    "shell/context_menu.sys",
    "shell/copilot_engine.wasm",
    "ready"
  ];

  const currentFileIndex = Math.min(Math.floor((progress / 100) * (filesToLoad.length - 1)), filesToLoad.length - 2);
  const currentFilename = filesToLoad[currentFileIndex];
  const totalFiles = filesToLoad.length - 1;
  const filesLoadedCount = Math.min(Math.floor((progress / 100) * totalFiles), totalFiles);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[100001] bg-black/60 backdrop-blur-sm flex items-center justify-center font-forced-montserrat font-light leading-relaxed select-none overflow-hidden"
    >
      <div className="w-full bg-[#1e0a5c] text-white py-14 px-8 md:px-24 border-t border-b border-white/10 shadow-2xl">
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-8 text-left font-forced-montserrat font-light leading-relaxed">
          <div className="space-y-3 w-full animate-fade-in">
            <h2 className="text-3xl md:text-4xl text-white font-forced-montserrat font-light leading-tight tracking-wide">
              Just a moment
            </h2>
            <p className="text-sm md:text-base text-white/95 font-forced-montserrat font-light leading-relaxed w-full">
              Loading {currentFilename}...
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/3/3f/Windows-loading-cargando.gif" 
                alt="loading" 
                className="w-7 h-7 object-contain shrink-0" 
                referrerPolicy="no-referrer"
              />
              <span className="text-xl font-forced-montserrat font-light text-white/90">
                {filesLoadedCount} files loaded ({Math.floor(progress)}%)
              </span>
            </div>

            {showBypass && !showPassPrompt && (
              <div className="pt-4 flex flex-wrap items-center justify-start gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (isUpdating) {
                      setShowPassPrompt(true);
                    } else {
                      onEnter();
                    }
                  }}
                  className="border border-white text-white font-forced-montserrat font-light text-sm px-6 py-2.5 transition-all select-none bg-transparent hover:bg-white/10 rounded-none active:scale-[0.98] cursor-pointer"
                >
                  Bypass Splash
                </button>
              </div>
            )}

            {showPassPrompt && (
              <form
                onSubmit={handleBypass}
                className="flex flex-col items-start gap-4 bg-black/40 backdrop-blur-2xl p-6 border border-white/10 shadow-2xl max-w-md w-full font-forced-montserrat font-light mt-4"
              >
                <span className="text-sm text-white/90 font-forced-montserrat font-light">Enter bypass password:</span>
                <input
                  type="password"
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-white/10 border border-white/20 text-white px-4 py-2 font-forced-montserrat font-light focus:outline-none focus:border-white/40 animate-fade-in"
                />
                {passError && <span className="text-red-400 text-xs font-forced-montserrat font-light">Incorrect password!</span>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="border border-white text-white font-forced-montserrat font-light text-sm px-6 py-2 transition-all bg-transparent hover:bg-white/10 cursor-pointer"
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPassPrompt(false)}
                    className="border border-white/40 text-white/80 font-forced-montserrat font-light text-sm px-6 py-2 transition-all bg-transparent hover:bg-white/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};


const Sparkles2 = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <circle cx="19" cy="5" r="2" fill="currentColor" stroke="none" />
  </svg>
);

const backgroundTracks = [
  // Vplay Themes (Original first)
  { id: "2nhuDkZqwCI", title: "Vplay Theme Original", artist: "Vplay", category: "vplay" },
  { id: "IoO3zIt3JGE", title: "Vplay Theme 01", artist: "Vplay", category: "vplay" },
  { id: "N0-N9Ao3KUw", title: "Vplay Theme 02", artist: "Vplay", category: "vplay" },
  { id: "QNnlBSinvbc", title: "Vplay Theme 03", artist: "Vplay", category: "vplay" },
  { id: "Zep7Z8s5FaU", title: "Vplay Theme 04", artist: "Vplay", category: "vplay" },
  // Joakim Karud's songs
  { id: "h9DEMJE7PUA", title: "Great Days", artist: "Joakim Karud", category: "joakim" },
  { id: "Zk32VJHqbHI", title: "Good Ol' Days", artist: "Joakim Karud", category: "joakim" },
  { id: "adinH9Z7xAg", title: "Luvly", artist: "Joakim Karud", category: "joakim" },
  { id: "Z5ONOp8XIpg", title: "No Worries", artist: "Joakim Karud", category: "joakim" },
  { id: "51ZudS1bKSM", title: "Waves", artist: "Joakim Karud", category: "joakim" },
  { id: "YsEnhy3Nvdg", title: "Fireplace", artist: "Joakim Karud", category: "joakim" },
  { id: "vJfIk2BngCQ", title: "Almost Original", artist: "Joakim Karud", category: "joakim" },
  { id: "d2LMU5OpPpc", title: "Rainy Days", artist: "Joakim Karud", category: "joakim" },
  { id: "Ew7k_8GmcRw", title: "Play", artist: "Joakim Karud", category: "joakim" },
  // Other artists
  { id: "Dk9bee0okz4", title: "Leech Decay", artist: "Paulo Bottoms", category: "others" },
  { id: "epC4g9Qo1jQ", title: "Lottery", artist: "Anno Domini Beats", category: "others" },
  { id: "vdRy4sSofys", title: "Echos in the Wind", artist: "Aaron Cherof", category: "others" },
  { id: "kJfPLmW23_I", title: "Landscaping", artist: "Windows 96", category: "others" },
  { id: "qLYmtdi-GzA", title: "Kaibu", artist: "Killercats", category: "others" },
  { id: "BTthtlT80Rc", title: "Pigstep", artist: "Lena Raine", category: "others" },
];

const baseTabs = [
  { name: "Home", icon: Home, id: "Trang chủ" },
  { name: "Widgets", icon: LayoutDashboard, id: "Widgets" },
  { name: "Vstore", icon: ShoppingBag, id: "Vstore", isExtra: true },
  { name: "Live", icon: Tv, id: "Phát sóng" },
  { name: "Vconnect", icon: Play, id: "Vconnect" },
  { name: "Labs", icon: Pizza, id: "Pizza" },
  { name: "Do For Me", icon: Sparkles, id: "Do For Me" },
];

// Channel type is imported from channels.ts

function LiquidModal({ isOpen, onClose, children, isDark, title, description, liquidGlass, featureFlags, footer }: { 
  isOpen: boolean, 
  onClose: () => void, 
  children?: ReactNode, 
  isDark: boolean,
  title?: string,
  description?: string,
  liquidGlass: "glassy" | "tinted",
  featureFlags?: any,
  footer?: ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className={`relative w-full max-w-[480px] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] flex flex-col ${
              isDark ? "bg-[#1c1c1c] text-white border border-white/5" : "bg-white text-slate-900"
            } rounded-[12px]`}
          >
            {isLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <LoadingAnimation featureFlags={featureFlags} isDark={isDark} className="w-8 h-8" />
              </div>
            ) : (
              <>
                <div className="p-10 space-y-4">
                  {title && <h2 className="text-2xl font-bold tracking-tight">{title}</h2>}
                  {description && (
                    <p className={`text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {description}
                    </p>
                  )}
                  {children && <div className="pt-2">{children}</div>}
                </div>
                
                <div className={`p-6 px-10 flex flex-col sm:flex-row justify-end gap-3 border-t ${isDark ? "border-white/5 bg-white/5" : "border-gray-100 bg-gray-50/50"}`}>
                  {footer ? footer : (
                    <>
                      <button 
                        onClick={onClose}
                        className={`flex-1 sm:flex-none px-12 py-2.5 bg-[#005fb8] hover:bg-[#00519d] text-white rounded-[4px] font-medium text-sm transition-all active:scale-[0.98]`}
                      >
                        OK
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Tooltip({ text, show, targetRect, isDesktop = false, position = 'top' }: { text: string, show: boolean, targetRect: DOMRect | null, isDesktop?: boolean, position?: 'top' | 'bottom' }) {
  return (
    <AnimatePresence>
      {show && targetRect && (
        <motion.div
          initial={{ opacity: 0, y: position === 'top' ? 10 : -10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === 'top' ? 10 : -10, scale: 0.8 }}
          style={{ 
            position: 'fixed', 
            top: position === 'top' ? targetRect.top - 10 : targetRect.bottom + 10, 
            left: targetRect.left + (targetRect.width / 2),
            translateX: '-50%',
            translateY: position === 'top' ? '-100%' : '0%'
          }}
          className={`px-3 py-1.5 backdrop-blur-xl text-[10px] font-normal rounded-[4px] whitespace-nowrap pointer-events-none z-[10001] shadow-[0_10px_30px_rgba(0,0,0,0.2)] border ${
            isDesktop 
              ? "bg-[#1f1f1f]/90 text-white border-white/10" 
              : "bg-white/80 text-slate-900 border-white/40"
          }`}
        >
          {text}
          <div className={`absolute left-1/2 -translate-x-1/2 border-[5px] border-transparent ${
            position === 'top' 
              ? (isDesktop ? "top-full border-t-[#1f1f1f]/90" : "top-full border-t-white/80")
              : (isDesktop ? "bottom-full border-b-[#1f1f1f]/90" : "bottom-full border-b-white/80")
          }`} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ChannelLogo({ src, alt, className, isDark, liquidGlass }: { src: string, alt: string, className?: string, isDark: boolean, liquidGlass?: "glassy" | "tinted" }) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-slate-800/50 rounded-[24px] border border-slate-700/50 p-1 text-center`}>
        <Tv className={`h-6 w-6 mb-1 ${liquidGlass === "tinted" ? "text-black" : "text-slate-500"}`} />
        <span className={`text-[10px] font-bold leading-tight line-clamp-2 uppercase ${liquidGlass === "tinted" ? "text-black/60" : "opacity-60"}`}>{alt}</span>
      </div>
    );
  }

  const scaleMap: { [key: string]: string } = {
    "Lâm Đồng 1 (LTV1)": "md:scale-[1.4]",
    "Đà Nẵng 1 (DNRT1)": "scale-[1.5] md:scale-[1.7]",
    "Đà Nẵng 2 (DNRT2)": "scale-[1.4] md:scale-[1.7]",
    "Thái Nguyên (TN)": "md:scale-[1.5]",
    "Điện Biên (ĐTV)": "md:scale-[0.8]",
    "Hưng Yên (HYTV)": "md:scale-[1.7]",
    "Đồng Tháp 1 (THĐT1)": "scale-[2.0] md:scale-[1.4]",
    "Huế (HueTV)": "md:scale-[1.4]",
    "Tây Ninh (TN)": "md:scale-[1.4]",
    "H1": "scale-[1.6] md:scale-[2.0]",
    "H2": "scale-[1.6] md:scale-[2.0]",
    "Đắk Lắk (DRT)": "scale-[1.2] md:scale-[1.4]",
    "ĐNNRTV1": "scale-[1.1] md:scale-[1.1]",
    "ĐNNRTV2": "scale-[1.1] md:scale-[1.1]",
    "Nghệ An (NTV)": "md:scale-[1.4]",
    "Quảng Ngãi 1 (QNgTV1)": "md:scale-[1.5]",
    "Quảng Ngãi 2 (QNgTV2)": "md:scale-[1.5]",
    "HTV Thể Thao": "scale-[1.5] md:scale-[1.5]",
    "VTV1": "scale-[1.14] md:scale-[0.92]",
    "VTV7": "scale-[1.24] md:scale-[1.01]",
    "VTV10": "scale-[1.11] md:scale-[1.0]"
  };

  const scaleClass = scaleMap[alt] || (alt.startsWith("VTV") ? "md:scale-[0.9]" : "");

  return (
    <img 
      src={src} 
      alt={alt} 
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      className={`${className} object-contain transition-all duration-300 ${
        liquidGlass === "tinted" 
          ? "opacity-100" 
          : !isDark ? "drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)]" : ""
      } ${scaleClass}`} 
    />
  );
}

function ChannelCard({ ch, onClick, isDark, isActive, favorites, toggleFavorite, togglePin, isPinned, liquidGlass, className, isMetro, featureFlags }: {
  ch: Channel,
  onClick: () => void,
  isDark: boolean,
  isActive?: boolean,
  favorites: string[],
  toggleFavorite: (ch: Channel) => void,
  togglePin?: (ch: Channel) => void,
  isPinned?: boolean,
  liquidGlass: "glassy" | "tinted",
  className?: string,
  key?: string | number,
  isMetro?: boolean,
  featureFlags?: any
}) {
  const isMaintenance = ch.status === "maintenance";
  const isScambidi = false;

  return (
    <div className={`relative group ${className || ""}`}>
      <motion.button
        whileHover={{ scale: isScambidi ? 1.15 : 1.05, boxShadow: isActive ? (isMetro ? "0 0 0 4px rgba(255,255,255,0.4)" : "0 10px 40px rgba(168,85,247,0.2)") : "0 10px 30px rgba(0,0,0,0.05)" }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        onClick={onClick}
        className={`w-full ${isMetro ? 'aspect-square p-2' : 'aspect-video p-5 md:p-6'} flex items-center justify-center transition-all duration-500 border relative overflow-hidden ${
          isScambidi 
            ? "rounded-none border-2 border-slate-400 bg-gradient-to-b from-slate-100 to-slate-400 shadow-[inset_0_1px_0_white,0_2px_4px_rgba(0,0,0,0.3)] hover:from-slate-200 hover:to-slate-300"
            : isMetro ? 'bg-[#0078d4] text-white border-white/20' : 
            liquidGlass 
              ? `rounded-[8px] ${
                  liquidGlass === "tinted" 
                    ? "bg-white/80 backdrop-blur-md border-white/20 shadow-lg" 
                    : "bg-white/5 backdrop-blur-2xl border-white/10"
                }` 
              : "rounded-[8px] backdrop-blur-none border-slate-200"
        } ${
          isActive
            ? (isMetro ? 'ring-4 ring-white border-white' : (isScambidi ? 'border-amber-500 ring-2 ring-amber-400 shadow-xl scale-105 z-10' : `ring-2 ring-purple-500 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.15)]`))
            : ""
        } ${
          !liquidGlass && !isMetro && !isScambidi && (isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-100")
        }`}
      >
        {isMaintenance && (
          <div className="absolute top-2 left-2 bg-amber-500 text-white text-[8px] font-black px-2 py-0.5 rounded-[4px] z-20 shadow-lg">
            BẢO TRÌ
          </div>
        )}
        <div className={`w-full h-full transition-transform duration-500 ${isScambidi ? "scale-125 group-hover:scale-150" : ""}`}>
           <ChannelLogo src={ch.logo} alt={ch.name} className={`w-full h-full ${isMaintenance ? "grayscale opacity-20" : ""}`} isDark={isDark} liquidGlass={liquidGlass} />
        </div>
        {isScambidi && (
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        )}
      </motion.button>
      <button 
        onClick={(e) => { e.stopPropagation(); toggleFavorite(ch); }}
        className={`absolute top-3 right-3 p-2 rounded-[4px] backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10 ${
          favorites.includes(ch.name) ? "text-red-500 bg-red-50/20" : "text-white bg-black/20"
        }`}
      >
        <Heart className={`h-4 w-4 ${favorites.includes(ch.name) ? "fill-red-500" : ""}`} />
      </button>

      {togglePin && (
        <button 
          onClick={(e) => { e.stopPropagation(); togglePin(ch); }}
          className={`absolute top-3 right-12 p-2 rounded-[4px] backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10 ${
            isPinned ? "text-blue-500 bg-blue-50/20" : "text-white bg-black/20"
          }`}
        >
          <Pin className={`h-4 w-4 ${isPinned ? "fill-blue-500" : ""}`} />
        </button>
      )}
    </div>
  );
}


const slides = [
  { 
    url: "https://static.wikia.nocookie.net/ftv/images/f/f4/Nx262.png/revision/latest/scale-to-width-down/1000?cb=20260505131224&path-prefix=vi", 
    title: "Vplay OS Canary", 
    desc: "Trải nghiệm truyền hình tương lai với giao diện mượt mà và kho nội dung khổng lồ.",
    tag: "Vplay Canary"
  },
  { 
    url: "https://media.discordapp.net/attachments/1491785835912237209/1492904393862025467/spc_20260412_220807.png?ex=69f17650&is=69f024d0&hm=ea45aa8e541ca18266a4b0557a2bd5e5bcb040060d1ef4949a4ca4c09a0a7d8b&=&format=webp&quality=lossless&width=605&height=340", 
    title: "Giao diện Liquid Glass", 
    desc: "Trải nghiệm xem truyền hình tương lai với hiệu ứng kính mờ và chuyển động mượt mà đầy mê hoặc.",
    tag: "Thiết kế"
  }
];

function HomeContent({ isDark, onSwitchToDev, featureFlags, liquidGlass, channels }: { isDark: boolean, onSwitchToDev: () => void, featureFlags?: any, liquidGlass: "glassy" | "tinted", channels: Channel[] }) {
  return (
    <div className={`flex-1 flex flex-col items-center justify-center p-8 select-none relative ${featureFlags?.xaml_experience ? "bg-transparent" : (isDark ? "bg-[#0b0b0b]" : "bg-slate-50")}`}>
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${(liquidGlass === "glassy" && !featureFlags?.xaml_experience) ? "opacity-100" : "opacity-0"}`} style={{ background: 'linear-gradient(135deg, #2d0b3b 0%, #1a0525 100%)', zIndex: 0 }} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center space-y-12"
      >
        <div className="relative group">
          <div className="absolute -inset-8 bg-purple-500/20 blur-[80px] rounded-full opacity-60" />
          <LoadingAnimation featureFlags={featureFlags} isDark={isDark} className="w-16 h-16 relative z-10" />
        </div>

        {featureFlags?.xaml_experience && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl p-8 rounded-[40px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Switch to the new UI</h3>
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Experience the brand-new rebuilt Vplay app based on XAML system</p>
              </div>
              <button 
                onClick={() => {
                   // This could toggle more things or just be a visual indicator
                }}
                className="vplay-retro-btn vplay-retro-btn-primary"
              >
                Upgrade Now
              </button>
            </div>
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={onSwitchToDev}
          className={`px-8 py-3 rounded-2xl flex items-center gap-3 border group transition-all relative overflow-hidden ${
            isDark ? "bg-white/5 border-white/10 text-white/60 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Terminal size={18} className="group-hover:rotate-12 transition-transform duration-500" />
          <span className="font-bold text-sm tracking-widest uppercase italic">Developer Mode</span>
        </motion.button>
      </motion.div>
    </div>
  );
}

function DesignHubContent({ isDark, onCreateComponent }: { isDark: boolean, onCreateComponent: () => void }) {
  const [toggle, setToggle] = useState(false);
  const [checkbox, setCheckbox] = useState(false);
  const [text, setText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState("");

  const galleryIcons = [
    { name: "Search", icon: Search }, { name: "User", icon: User }, { name: "Copy", icon: Copy }, 
    { name: "Tv", icon: Tv }, { name: "Calendar", icon: Calendar }, { name: "Home", icon: Home }, 
    { name: "Play", icon: Play }, { name: "Pause", icon: Pause }, { name: "Radio", icon: Radio }, 
    { name: "Info", icon: Info }, { name: "Sun", icon: Sun }, { name: "Moon", icon: Moon }, 
    { name: "Settings", icon: Settings }, { name: "CheckCircle2", icon: CheckCircle2 }, 
    { name: "Check", icon: Check }, { name: "Shield", icon: Shield }, { name: "Heart", icon: Heart }, 
    { name: "X", icon: X }, { name: "Lock", icon: Lock }, { name: "Terminal", icon: Terminal }, 
    { name: "Zap", icon: Zap }, { name: "Clock", icon: Clock }, { name: "Compass", icon: Compass }, 
    { name: "ImageIcon", icon: ImageIcon }, { name: "Sparkles", icon: Sparkles }, 
    { name: "ShieldCheck", icon: ShieldCheck }, { name: "LayoutGrid", icon: LayoutGrid }, 
    { name: "LayoutDashboard", icon: LayoutDashboard }, { name: "Download", icon: Download }, 
    { name: "Pizza", icon: Pizza }, { name: "Gavel", icon: Gavel }, { name: "Upload", icon: Upload }
  ];

  const filteredIcons = galleryIcons.filter(i => i.name.toLowerCase().includes(iconSearch.toLowerCase()));

  const Section = ({ title, children }: { title: string, children: ReactNode }) => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h3 className="text-sm font-black uppercase tracking-[0.3em] opacity-40">{title}</h3>
        <div className="h-px flex-1 bg-current opacity-10" />
      </div>
      <div className="flex flex-wrap gap-8 items-start">
        {children}
      </div>
    </div>
  );

  return (
    <div className={`flex-1 overflow-y-auto p-8 md:p-12 space-y-16 custom-scrollbar ${isDark ? "bg-[#0b0b0b] text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="max-w-6xl mx-auto space-y-20">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-blue-500/10 text-blue-500 border border-blue-500/10 text-[10px] font-black uppercase tracking-widest">
            <LayoutDashboard size={12} />
            Component System
          </div>
          <h2 className="text-6xl font-black tracking-tighter uppercase italic leading-none">Design Hub</h2>
          <p className="text-xl opacity-40 max-w-2xl font-medium leading-relaxed">Toàn bộ các UI elements của hệ thống Vplay Canary OS được chuẩn hóa một cách tỉ mỉ và đồng nhất.</p>
          <div className="pt-4">
            <button 
              onClick={onCreateComponent}
              className="px-8 py-4 bg-[#005fb8] hover:bg-[#00519d] text-white rounded-[4px] font-black uppercase tracking-widest text-sm shadow-2xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
              Create my own component
            </button>
          </div>
        </header>

        <Section title="Buttons">
          <div className="space-y-4">
            <p className="text-[10px] font-bold opacity-30 uppercase">Primary</p>
            <button className="px-8 py-3 bg-[#005fb8] hover:bg-[#00519d] text-white rounded-[4px] font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95">Primary Button</button>
          </div>
          <div className="space-y-4">
            <p className="text-[10px] font-bold opacity-30 uppercase">Secondary</p>
            <button className={`px-8 py-3 rounded-[4px] border font-bold transition-all active:scale-95 ${isDark ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-slate-200 hover:bg-slate-50 hover:shadow-lg"}`}>Secondary Button</button>
          </div>
          <div className="space-y-4">
            <p className="text-[10px] font-bold opacity-30 uppercase">Glassy</p>
            <button className="px-8 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-[4px] font-bold transition-all hover:bg-white/20">Glass Button</button>
          </div>
          <div className="space-y-4">
            <p className="text-[10px] font-bold opacity-30 uppercase">Destructive</p>
            <button className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-[4px] font-bold transition-all shadow-lg shadow-red-500/20">Delete Action</button>
          </div>
        </Section>

        <Section title="Selection & Toggles">
          <div className="space-y-4 flex flex-col items-center">
            <p className="text-[10px] font-bold opacity-30 uppercase">Toggle Switch</p>
            <button 
              onClick={() => setToggle(!toggle)}
              className={`w-14 h-8 rounded-full p-1 transition-all duration-500 ${toggle ? "bg-blue-600" : "bg-slate-500/40"}`}
            >
              <motion.div 
                animate={{ x: toggle ? 24 : 0 }}
                className="w-6 h-6 bg-white rounded-full shadow-lg"
              />
            </button>
          </div>
          <div className="space-y-4 flex flex-col items-center">
            <p className="text-[10px] font-bold opacity-30 uppercase">Checkbox</p>
            <button 
              onClick={() => setCheckbox(!checkbox)}
              className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${checkbox ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/20" : "border-slate-400/30"}`}
            >
              {checkbox && <Check size={20} className="text-white" strokeWidth={3} />}
            </button>
          </div>
        </Section>

        <Section title="Inputs">
          <div className="space-y-4 w-full max-w-md">
            <p className="text-[10px] font-bold opacity-30 uppercase">Text Field</p>
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <input 
                type="text" 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type something..."
                className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition-all relative z-10 ${isDark ? "bg-white/5 border-white/5 focus:border-blue-500 focus:bg-white/10" : "bg-white border-slate-100 focus:border-blue-500 shadow-sm focus:shadow-2xl"}`}
              />
            </div>
          </div>
          <div className="space-y-4 w-full max-w-md">
            <p className="text-[10px] font-bold opacity-30 uppercase">Search Field</p>
            <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border-2 ${isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-100"}`}>
              <Search size={20} className="opacity-40" />
              <input 
                type="text" 
                placeholder="Search..."
                className="bg-transparent border-none outline-none flex-1 font-medium"
              />
            </div>
          </div>
        </Section>

        <Section title="Status & Progress">
          <div className="flex gap-4">
             <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 text-[10px] font-black uppercase tracking-widest">Active</div>
             <div className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/10 text-[10px] font-black uppercase tracking-widest">Pending</div>
             <div className="px-4 py-1.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/10 text-[10px] font-black uppercase tracking-widest">Critical</div>
          </div>
        </Section>

        <Section title="Dialogs & Overlays">
           <div className="space-y-4">
            <p className="text-[10px] font-bold opacity-30 uppercase">Modal Trigger</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-purple-500/20"
            >
              Open Test Dialog
            </button>
            <AnimatePresence>
              {isModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" key="design-modal-overlay">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsModalOpen(false)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                  />
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className={`relative w-full max-w-md p-8 rounded-[48px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] border ${isDark ? "bg-[#161618] border-white/10" : "bg-white border-slate-200"}`}
                  >
                    <div className="flex items-center justify-between mb-8">
                       <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                          <LayoutDashboard size={24} className="text-blue-500" />
                       </div>
                       <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                          <X size={20} />
                       </button>
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 italic">Test Modal Interface</h3>
                    <p className="opacity-50 text-sm leading-relaxed mb-8">Đây là interface mẫu cho hệ thống dialog và window của Canary OS. Mọi chuyển động đều được tinh chỉnh để tạo cảm giác mượt mà và cao cấp.</p>
                    <div className="flex gap-4">
                       <button 
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all active:scale-95"
                      >
                        Chấp nhận
                      </button>
                      <button 
                        onClick={() => setIsModalOpen(false)}
                        className={`flex-1 py-4 rounded-2xl font-bold transition-all active:scale-95 ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-slate-100 hover:bg-slate-200"}`}
                      >
                        Hủy bỏ
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </Section>

        <Section title="Iconography">
          <div className="w-full space-y-6">
            <div className={`p-4 rounded-[24px] border flex items-center gap-4 ${isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-100"}`}>
               <Search size={18} className="opacity-40" />
               <input 
                 value={iconSearch}
                 onChange={(e) => setIconSearch(e.target.value)}
                 placeholder="Search standard iconography..."
                 className="bg-transparent border-none outline-none text-sm font-semibold w-full"
               />
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-6 h-96 overflow-y-auto custom-scrollbar pr-4">
              {filteredIcons.map((item, i) => (
                <div key={`icon-grid-${item.name}-${i}`} className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all ${isDark ? "bg-white/[0.02] border-white/5 hover:bg-white/10" : "bg-white border-slate-100 hover:shadow-xl"}`}>
                  <item.icon size={28} className="opacity-70" />
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 text-center truncate w-full">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Scrollbars">
           <div className={`w-full h-40 rounded-2xl border p-4 overflow-y-auto custom-scrollbar ${isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-100"}`}>
              <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={`scrollbar-sample-${i}`} className={`h-12 w-full rounded-xl ${isDark ? "bg-white/5" : "bg-slate-50"}`} />
                  ))}
              </div>
           </div>
        </Section>
      </div>
    </div>
  );
}

function CustomTabContent({ isDark, tab, onDelete }: { isDark: boolean, tab: CustomTab, onDelete: () => void }) {
  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${isDark ? "bg-[#0b0b0b] text-white" : "bg-slate-50 text-slate-900"}`}>
       <div className="p-8 border-b border-current opacity-10 flex items-center justify-between">
          <div>
             <h1 className="text-4xl font-black italic uppercase tracking-tighter">{tab.name}</h1>
             <p className="opacity-40 text-[10px] font-black uppercase tracking-widest mt-1">Component System / Custom Tab</p>
          </div>
          <button 
            onClick={onDelete}
            className="px-6 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
          >
             <Trash2 size={14} />
             Delete Tab
          </button>
       </div>
       <div className="flex-1 overflow-auto custom-scrollbar">
          {tab.type === 'html' ? (
            <div className="p-8 prose prose-slate dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: tab.content }} />
          ) : (
            <div className="p-12 space-y-8 max-w-4xl mx-auto">
               {tab.visualItems?.map(item => (
                  <div key={item.id} className="flex flex-col gap-2">
                     {item.type === 'heading' && <h1 className="text-4xl font-bold">{item.value}</h1>}
                     {item.type === 'text' && <p className="text-lg opacity-60 leading-relaxed">{item.value}</p>}
                     {item.type === 'button' && (
                       <button className="px-8 py-3 bg-[#005fb8] text-white rounded-[4px] font-bold w-fit shadow-xl shadow-blue-500/20">
                          {item.label}
                       </button>
                     )}
                     {item.type === 'image' && (
                       <img src={item.value} className="rounded-[8px] shadow-2xl w-full border border-white/10" referrerPolicy="no-referrer" />
                     )}
                  </div>
               ))}
            </div>
          )}
       </div>
    </div>
  );
}

function CustomTabModal({ isOpen, onClose, onSave, isDark, initialData }: { isOpen: boolean, onClose: () => void, onSave: (tab: CustomTab) => void, isDark: boolean, initialData?: CustomTab | null }) {
  const [name, setName] = useState(initialData?.name || "");
  const [type, setType] = useState<"html" | "visual">(initialData?.type || "html");
  const [content, setContent] = useState(initialData?.content || "");
  const [visualItems, setVisualItems] = useState(initialData?.visualItems || [
    { id: '1', type: 'heading', value: 'My New Component' },
    { id: '2', type: 'text', value: 'This is a custom tab created using the Visual Editor.' },
    { id: '3', type: 'button', label: 'Click Me' }
  ]);

  const handleSave = () => {
    if (!name) return;
    onSave({
      id: initialData?.id || `custom-${Date.now()}`,
      name,
      type,
      content,
      visualItems: type === 'visual' ? visualItems : undefined,
      icon: "Layout"
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100002] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`relative w-full max-w-5xl h-[80vh] flex flex-col rounded-[48px] overflow-hidden border ${isDark ? "bg-[#161618] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"}`}
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
               <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic">Create Custom Component</h2>
                  <p className="opacity-40 text-[10px] font-black uppercase tracking-widest mt-1">Design your own experience</p>
               </div>
               <button onClick={onClose} className="p-3 rounded-2xl hover:bg-white/5 transition-colors">
                  <X size={20} />
               </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
               {/* Left Controls */}
               <div className="w-80 border-r border-white/5 p-8 space-y-8 overflow-y-auto custom-scrollbar">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Component Name</label>
                     <input 
                       value={name}
                       onChange={(e) => setName(e.target.value)}
                       placeholder="e.g. My Dashboard"
                       className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition-all ${isDark ? "bg-white/5 border-white/5 focus:border-blue-500" : "bg-slate-50 border-slate-100 focus:border-blue-500"}`}
                     />
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Editor Type</label>
                     <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setType("visual")}
                          className={`py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${type === "visual" ? "bg-blue-600 text-white" : "bg-white/5 border border-white/10"}`}
                        >
                           Visual
                        </button>
                        <button 
                          onClick={() => setType("html")}
                          className={`py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${type === "html" ? "bg-blue-600 text-white" : "bg-white/5 border border-white/10"}`}
                        >
                           HTML
                        </button>
                     </div>
                  </div>

                  {type === "visual" && (
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Quick Elements</label>
                       <div className="grid grid-cols-2 gap-2">
                          {[
                            { icon: Type, label: 'Heading', type: 'heading' },
                            { icon: TextIcon, label: 'Text', type: 'text' },
                            { icon: MousePointer2, label: 'Button', type: 'button' },
                            { icon: ImageIcon, label: 'Image', type: 'image' }
                          ].map(el => (
                            <button 
                              key={el.type}
                              onClick={() => {
                                setVisualItems([...visualItems, { 
                                  id: Math.random().toString(), 
                                  type: el.type as any, 
                                  label: el.label, 
                                  value: el.type === 'heading' ? 'New Heading' : 'Sample content' 
                                }]);
                              }}
                              className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 flex flex-col items-center gap-2 transition-all"
                            >
                               <el.icon size={16} className="opacity-40" />
                               <span className="text-[9px] font-bold uppercase tracking-widest">{el.label}</span>
                            </button>
                          ))}
                       </div>
                    </div>
                  )}
               </div>

               {/* Right Preview/Editor */}
               <div className="flex-1 bg-black/20 p-8 overflow-hidden flex flex-col">
                  {type === "html" ? (
                    <div className="flex-1 flex flex-col gap-4">
                       <label className="text-[10px] font-black uppercase tracking-widest opacity-40">HTML Source Code</label>
                       <textarea 
                         value={content}
                         onChange={(e) => setContent(e.target.value)}
                         placeholder="<div class='p-8'><h1>Hello World</h1></div>"
                         className="flex-1 w-full bg-slate-900 border border-white/5 rounded-3xl p-8 font-mono text-xs text-blue-400 outline-none focus:border-blue-500/50 transition-all custom-scrollbar"
                       />
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                       <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Live Preview & Visual Editing</label>
                       <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[40px] overflow-y-auto p-12 space-y-8 custom-scrollbar">
                          {visualItems.map((item, idx) => (
                            <div key={`visual-edit-item-${item.id}-${idx}`} className="relative group/item">
                               <div className="absolute -left-12 top-0 bottom-0 flex flex-col gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                  <button onClick={() => setVisualItems(visualItems.filter(v => v.id !== item.id))} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><X size={12} /></button>
                               </div>
                               {item.type === 'heading' && (
                                 <input 
                                   value={item.value} 
                                   onChange={e => {
                                      const newItems = [...visualItems];
                                      newItems[idx].value = e.target.value;
                                      setVisualItems(newItems);
                                   }}
                                   className="text-5xl font-black tracking-tighter uppercase italic bg-transparent border-none outline-none w-full text-white"
                                 />
                               )}
                               {item.type === 'text' && (
                                 <textarea 
                                   value={item.value} 
                                   onChange={e => {
                                      const newItems = [...visualItems];
                                      newItems[idx].value = e.target.value;
                                      setVisualItems(newItems);
                                   }}
                                   className="text-xl opacity-40 font-medium leading-relaxed bg-transparent border-none outline-none w-full resize-none min-h-[4em]"
                                 />
                               )}
                               {item.type === 'button' && (
                                 <div className="flex items-center gap-4">
                                   <button className="px-10 py-4 bg-blue-600 text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-500/20">
                                      {item.label}
                                   </button>
                                   <input 
                                     value={item.label}
                                     onChange={e => {
                                        const newItems = [...visualItems];
                                        newItems[idx].label = e.target.value;
                                        setVisualItems(newItems);
                                     }}
                                     className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest outline-none"
                                   />
                                 </div>
                               )}
                               {item.type === 'image' && (
                                 <div className="space-y-4">
                                   <div className="relative aspect-video rounded-[32px] overflow-hidden border border-white/10">
                                      <img src={item.value || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop"} className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                         <p className="text-[10px] font-black uppercase tracking-widest">Preview Mode</p>
                                      </div>
                                   </div>
                                   <input 
                                     placeholder="Image URL..."
                                     value={item.value}
                                     onChange={e => {
                                        const newItems = [...visualItems];
                                        newItems[idx].value = e.target.value;
                                        setVisualItems(newItems);
                                     }}
                                     className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-mono outline-none"
                                   />
                                 </div>
                               )}
                            </div>
                          ))}
                          <div className="h-20" />
                       </div>
                    </div>
                  )}
               </div>
            </div>

            <div className={`p-8 border-t border-white/5 flex items-center justify-end gap-4 shrink-0 ${isDark ? "bg-[#1a1a1a]" : "bg-gray-50"}`}>
               <button onClick={onClose} className="px-10 py-4 rounded-[4px] font-black uppercase tracking-widest text-xs opacity-40 hover:opacity-100 transition-all">Cancel</button>
               <button 
                 onClick={handleSave}
                 className="px-12 py-4 bg-[#005fb8] text-white rounded-[4px] font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-2xl"
               >
                 Create Component
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function MyFeedContent({ isDark, onAction, onNavigate, liquidGlass, featureFlags, activeSearchPlaceholder, setShowWidgets, setActiveBoardTab }: { isDark: boolean, onAction: (a: string, data?: any) => void, onNavigate: (t: string) => void, liquidGlass: "glassy" | "tinted", featureFlags?: any, activeSearchPlaceholder: string, setShowWidgets: (s: boolean) => void, setActiveBoardTab?: (val: any) => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const greetings = () => {
    const hour = time.getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  return (
    <div className={`flex-1 overflow-y-auto custom-scrollbar relative ${isDark ? "bg-[#0b0b0b] text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="max-w-4xl mx-auto px-6 py-20 flex flex-col items-center">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4"
        >
          <div className="flex flex-col items-center gap-1">
             <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 italic">Vplay Intelligence</span>
             <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-2 italic">
               {greetings()}
             </h1>
          </div>
          
          <div className="flex items-center justify-center gap-4 text-[11px] font-black uppercase tracking-widest opacity-40">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-blue-500" />
              <span>{time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="w-1 h-1 bg-current rounded-full" />
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-purple-500" />
              <span>{time.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-xl mb-20"
        >
          <SearchBar 
            isDark={isDark}
            query={searchQuery}
            setQuery={setSearchQuery}
            onClose={() => {}}
            liquidGlass={liquidGlass}
            featureFlags={featureFlags}
            placeholder={activeSearchPlaceholder}
            onNavigate={onNavigate}
            variant="minimal"
          />
          <div className="flex flex-wrap justify-center gap-2 mt-8">
             {["Bóng đá", "Thời tiết", "VTV6", "Tin tức", "Chứng khoán", "Film"].map(tag => (
               <button 
                key={tag}
                onClick={() => {
                  setSearchQuery(tag);
                  onAction("app_search", tag);
                }}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${isDark ? "border-white/10 hover:bg-white/5 bg-white/2" : "border-black/5 hover:bg-black/5 bg-black/2"} opacity-40 hover:opacity-100 hover:scale-105 active:scale-95`}
               >
                 {tag}
               </button>
             ))}
          </div>
        </motion.div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className={`p-8 rounded-[32px] border flex flex-col gap-6 transition-all hover:translate-y-[-4px] hover:shadow-2xl ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-sm"}`}>
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                       <Zap size={20} className="text-blue-500" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 italic">Tiện ích nhanh</span>
                 </div>
              </div>
              <p className="text-2xl font-black tracking-tighter italic">Cá nhân hóa bảng tin của bạn với các widgets thông minh.</p>
              <button 
                onClick={() => { setShowWidgets(true); if (setActiveBoardTab) setActiveBoardTab('widgets'); }}
                className="mt-4 py-3 px-6 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all self-start shadow-xl active:scale-95"
              >
                Mở bảng tiện ích
              </button>
           </div>

           <div className={`p-8 rounded-[32px] border flex flex-col gap-6 transition-all hover:translate-y-[-4px] hover:shadow-2xl ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-sm"}`}>
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                       <Sparkles size={20} className="text-purple-500" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 italic">Do For Me AI</span>
                 </div>
              </div>
                      <p className="text-2xl font-black tracking-tighter italic">Hãy để trợ lý ảo Do For Me giúp bạn tìm kiếm nội dung yêu thích.</p>
              <button 
                onClick={() => onNavigate("Do For Me")}
                className="mt-4 py-3 px-6 rounded-2xl bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all self-start shadow-xl active:scale-95"
              >
                Trò chuyện ngay
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

function WidgetWrapper({ w, isDark, location, time, onResize, onRemove, onMove, onLock, addNotification, notifications, history, onAction, onNavigate, setShowVTV6Popup, channels, widgetsFeedTreatment, featureFlags }: any) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const getBgClass = () => {
    const glass = "border-black/5 shadow-2xl shadow-slate-100/30";
    const solidWhite = `bg-white text-slate-900 ${glass}`;
    return solidWhite; // Individual widgets are now always bright white "as before"
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  useEffect(() => {
    const handleGlobalClick = () => setShowContextMenu(false);
    if (showContextMenu) window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [showContextMenu]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const [countdown, setCountdown] = useState(1245);
  useEffect(() => {
    const timer = setInterval(() => setCountdown(prev => prev > 0 ? prev - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, []);

  const getSizeClass = () => {
    switch (w.size) {
      case '2x2': return 'col-span-4 row-span-2 h-[200px]';
      case '4x4': return 'col-span-8 row-span-4 h-[416px]';
      case '6x6': return 'col-span-12 row-span-6 h-[632px]';
      case '1x2': return 'col-span-4 row-span-1 h-[90px]';
      default: return 'col-span-4 row-span-2 h-[200px]';
    }
  };

  return (
    <>
      <div
        id={`widget-card-${w.id}`}
        onContextMenu={handleContextMenu}
        className={`group relative ${widgetsFeedTreatment === 5 ? 'rounded-[40px]' : 'rounded-[24px]'} border p-6 flex flex-col justify-between overflow-hidden transition-all bg-white text-slate-900 ${getSizeClass()} ${w.locked ? 'ring-2 ring-blue-500/50' : ''}`}
      >
        {!w.locked && (
          <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 p-1.5 bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl pointer-events-auto">
            <div className="flex gap-0.5 mr-2">
              <button onClick={() => onMove('left')} className="p-1 hover:bg-black/5 rounded-md transition-colors"><ChevronLeft size={12} /></button>
              <div className="flex flex-col gap-0.5">
                 <button onClick={() => onMove('up')} className="p-1 hover:bg-black/5 rounded-md transition-colors"><ChevronUp size={12} /></button>
                 <button onClick={() => onMove('down')} className="p-1 hover:bg-black/5 rounded-md transition-colors"><ChevronDown size={12} /></button>
              </div>
              <button onClick={() => onMove('right')} className="p-1 hover:bg-black/5 rounded-md transition-colors"><ChevronRight size={12} /></button>
            </div>
            <div className="w-px h-4 bg-black/10 mx-1" />
            <button onClick={onResize} className="p-2 hover:bg-black/5 rounded-xl transition-colors"><Maximize2 size={12} /></button>
            <button onClick={onRemove} className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors"><X size={12} /></button>
          </div>
        )}

        {w.locked && (
          <div className="absolute top-4 right-4 z-20 p-1.5 bg-blue-500/10 backdrop-blur-xl rounded-full text-blue-500">
             <Lock size={12} />
          </div>
        )}

        <div className="flex-1 flex flex-col h-full pointer-events-none select-none">
          {w.type === "weather" && (
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-[18px] bg-blue-50`}>
                  <Cloud size={20} className="text-blue-500" />
                </div>
                <div className="flex flex-col">
                  <span className={`text-[12px] font-semibold text-slate-500`}>Weather</span>
                  <span className="text-sm font-semibold tracking-tight text-slate-900">{location}</span>
                </div>
              </div>
              <div className="flex items-end justify-between">
                  <div className="flex flex-col">
                    <span className={`text-5xl font-semibold tracking-tighter leading-none text-slate-900`}>29°C</span>
                    <span className={`text-[12px] font-medium mt-1 text-slate-500`}>Clear Sky • 32° / 24°</span>
                  </div>
                  <CloudLightning size={48} className="text-slate-200 -mb-2" />
              </div>
            </div>
          )}

          {w.type === "clock_date" && (
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 rounded-[18px]">
                  <Clock size={20} className="text-blue-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-semibold text-slate-400">System</span>
                  <span className="text-sm font-semibold text-slate-800 tracking-tight">{time.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
              </div>
              <div className="flex flex-col text-center translate-y-1">
                  <span className="text-5xl font-semibold text-slate-900 tracking-tight tabular-nums leading-none">
                    {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                  <span className="text-[11px] font-semibold text-blue-500 tracking-[0.25em] mt-3 opacity-30">CORE KERNEL ACTIVATED</span>
              </div>
            </div>
          )}

          {w.type === "vtv6_countdown" && (
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/10 rounded-[18px]">
                  <Tv size={20} className="text-red-500" />
                </div>
                <div className="flex flex-col text-slate-900">
                  <span className="text-[12px] font-semibold opacity-60">Upcoming</span>
                  <span className="text-sm font-semibold tracking-tight">VTV6 Live Event</span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                  <span className="text-4xl font-semibold font-mono tracking-tight tabular-nums text-red-600 leading-none">{formatTime(countdown)}</span>
                  <div className="flex gap-2 mt-4">
                     <span className="px-3 py-1 bg-red-100 rounded-full text-[10px] font-semibold text-red-600 uppercase tracking-wider">LIVE_SCORE</span>
                     <span className="px-3 py-1 bg-green-100 rounded-full text-[10px] font-semibold text-green-700 uppercase tracking-wider italic">VPLAY_READY</span>
                  </div>
              </div>
            </div>
          )}

          {w.type === "stocks" && (
            <div className="flex flex-col h-full justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 rounded-[18px]">
                  <TrendingUp size={20} className="text-emerald-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-semibold text-slate-400">Reference</span>
                  <span className="text-sm font-semibold text-slate-800 tracking-tight">Local Market</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-center">
                    <p className="text-[10px] font-semibold text-slate-400 mb-1">VN-INDEX</p>
                    <p className="text-xl font-semibold text-emerald-500 tracking-tight leading-none">+12.4</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-center">
                    <p className="text-[10px] font-semibold text-slate-400 mb-1">VPLAY_INC</p>
                    <p className="text-xl font-semibold text-emerald-500 tracking-tight leading-none">+1.1m</p>
                  </div>
              </div>
            </div>
          )}

          {w.type === "channel" && (
            <div className="flex flex-col h-full justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center p-2 border border-black/5">
                     <Tv className="text-blue-500" size={20} />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Live Channel</span>
                     <span className="text-sm font-semibold text-slate-800 tracking-tight">{w.channelId}</span>
                  </div>
               </div>
               <div className="flex items-center justify-center py-4">
                  <Play size={40} className="text-blue-500 animate-pulse" fill="currentColor" />
               </div>
               <button 
                 onClick={() => onNavigate("Phát sóng")}
                 className="w-full py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-semibold uppercase tracking-widest hover:bg-blue-100 transition-colors"
               >
                 Go to Channel
               </button>
            </div>
          )}

          {w.type === "music_player" && (
            <div className="flex flex-col h-full justify-between text-slate-800">
               <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-black/5">
                        <Music size={20} className="text-blue-500" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-semibold opacity-40 uppercase tracking-widest">Vplay Music</span>
                        <span className="text-sm font-semibold truncate">Starboy - The Weeknd</span>
                     </div>
                  </div>
                  <Sparkles size={16} className="text-blue-400" />
               </div>
               <div className="flex items-center gap-4 px-2">
                  <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                     <motion.div animate={{ width: '40%' }} className="h-full bg-blue-500" />
                  </div>
                  <span className="text-[9px] font-mono opacity-40">01:42 / 03:50</span>
               </div>
               <div className="flex items-center justify-center gap-8">
                  <SkipBack size={20} className="opacity-40 hover:opacity-100 cursor-pointer" />
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/40 hover:scale-110 transition-transform cursor-pointer">
                     <Play size={20} fill="currentColor" className="text-white" />
                  </div>
                  <SkipForward size={20} className="opacity-40 hover:opacity-100 cursor-pointer" />
               </div>
            </div>
          )}

          {w.type === "sys_mon" && (
            <div className="flex flex-col h-full justify-between text-slate-800">
               <div className="flex items-center gap-3">
                  <Activity size={20} className="text-green-600" />
                  <span className="text-sm font-semibold tracking-tight">System Monitor</span>
               </div>
               <div className="space-y-4">
                  {[
                    { label: 'CPU', val: '12%', color: 'bg-blue-500' },
                    { label: 'RAM', val: '4.2GB', color: 'bg-purple-500' },
                    { label: 'GPU', val: '0%', color: 'bg-green-500' }
                  ].map(stat => (
                    <div key={stat.label} className="space-y-1.5">
                       <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider">
                          <span className="opacity-40">{stat.label}</span>
                          <span className="font-semibold">{stat.val}</span>
                       </div>
                       <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div animate={{ width: stat.val }} className={`h-full ${stat.color}`} />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {w.type === "notes" && (
             <div className="flex flex-col h-full justify-between text-slate-800">
                <div className="flex items-center gap-3 pb-4 border-b border-amber-200/50">
                   <div className="p-2 bg-amber-400/20 rounded-lg">
                      <StickyNote size={16} className="text-amber-600" />
                   </div>
                   <span className="text-sm font-semibold tracking-tight">Vplay Notes</span>
                </div>
                <div className="flex-1 py-4 text-xs font-medium leading-relaxed opacity-60 italic">
                   "Remember to check the new Vplay Canary SMR26 update for hardware acceleration..."
                </div>
                <div className="text-[9px] font-semibold text-amber-600 uppercase tracking-widest text-right">Updated 2m ago</div>
             </div>
          )}

          {w.type === "crypto" && (
            <div className="flex flex-col h-full justify-between text-slate-800">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white">
                        <Bitcoin size={24} />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-semibold opacity-40 uppercase tracking-widest">Bitcoin</span>
                        <span className="text-sm font-semibold">$64,281</span>
                     </div>
                  </div>
                  <div className="px-2 py-1 bg-green-100 text-green-600 rounded-lg text-[10px] font-semibold">+2.4%</div>
               </div>
               <div className="flex-1 flex items-end gap-1 px-2 h-16">
                  {[40, 60, 45, 80, 55, 90, 75].map((h, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      className="flex-1 bg-green-500/20 rounded-t-sm"
                    />
                  ))}
               </div>
            </div>
          )}

          {w.type === "world_clock" && (
             <div className="flex flex-col h-full justify-between text-slate-800">
                <div className="flex items-center gap-3">
                   <Globe size={20} className="text-blue-500" />
                   <span className="text-sm font-semibold tracking-tight">World Clock</span>
                </div>
                <div className="space-y-4">
                   {[
                     { city: 'London', time: '09:42', zone: 'GMT+1' },
                     { city: 'Tokyo', time: '17:42', zone: 'GMT+9' }
                   ].map(c => (
                     <div key={c.city} className="flex items-center justify-between">
                        <div className="flex flex-col">
                           <span className="text-[11px] font-semibold tracking-tight">{c.city}</span>
                           <span className="text-[9px] opacity-40 uppercase font-semibold tracking-widest">{c.zone}</span>
                        </div>
                        <span className="text-lg font-semibold tabular-nums">{c.time}</span>
                     </div>
                   ))}
                </div>
             </div>
          )}

          {w.type === "calendar_alt" && (
             <div className="flex flex-col h-full justify-between text-slate-800">
                <div className="flex items-center gap-3">
                   <Calendar size={20} className="text-red-500" />
                   <span className="text-sm font-semibold tracking-tight">Events</span>
                </div>
                <div className="space-y-3">
                   {[
                     { name: 'Vplay Canary SMR26 Launch', time: 'Tomorrow, 10:00' },
                     { name: 'Developer Sync', time: 'Wed, 14:30' }
                   ].map(ev => (
                     <div key={ev.name} className="p-3 bg-slate-50 rounded-2xl border border-black/5">
                        <p className="text-[11px] font-semibold leading-tight">{ev.name}</p>
                        <p className="text-[9px] opacity-40 font-semibold uppercase tracking-widest mt-1">{ev.time}</p>
                     </div>
                   ))}
                </div>
             </div>
          )}

          {w.type.startsWith("game_") && (
             <div className="flex flex-col h-full justify-between text-slate-800">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Gamepad size={20} className="text-blue-500" />
                      <span className="text-[11px] font-semibold uppercase tracking-widest opacity-60">Vplay Gaming</span>
                   </div>
                   <Trophy size={16} className="text-amber-500" />
                </div>
                <div className="flex flex-col items-center text-center py-4">
                   <h4 className="text-xl font-semibold italic uppercase tracking-tight mb-2 text-slate-900">{w.type.replace('game_', '').split('_').join(' ')}</h4>
                   <p className="text-[10px] font-semibold opacity-60 uppercase tracking-widest">New High Score: 1,240</p>
                </div>
                <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-2xl text-[10px] font-semibold uppercase tracking-[0.2em] transition-all text-white shadow-lg shadow-blue-500/20">Play Now</button>
             </div>
          )}

          {w.type === "ai_for_me" && (
             <div className="flex flex-col h-full justify-between text-slate-800">
                <div className="flex items-center gap-3">
                   <Sparkles size={20} className="text-amber-500" />
                   <span className="text-sm font-semibold tracking-tight">AI Assistant Pro</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-black/5">
                   <p className="text-xs italic opacity-60">"Analyzing your usage patterns... You should watch VTV3 Live for the upcoming sports event at 20:00."</p>
                </div>
                <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-widest opacity-40">
                   <span>Powered by Gemini 1.5</span>
                   <div className="flex gap-1">
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-pulse" />
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]" />
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]" />
                   </div>
                </div>
             </div>
          )}

          {w.type === "thirdparty" && (
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-slate-100 rounded-[18px]">
                  <Globe size={20} className="text-blue-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-semibold text-slate-400">App</span>
                  <span className="text-sm font-semibold text-slate-800 tracking-tight">{w.appName}</span>
                </div>
              </div>
              <div className="flex-1 rounded-[20px] bg-slate-50 border border-slate-100 flex items-center justify-center p-4">
                 <div className="text-center">
                   <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Web Content</p>
                   <p className="text-sm font-medium text-slate-900">Embedded App Preview</p>
                 </div>
              </div>
            </div>
          )}

          {w.type === "notify" && (
            <div className="flex flex-col h-full overflow-hidden">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-orange-500/10 rounded-[18px]">
                    <Bell size={20} className="text-orange-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-semibold text-slate-400">Latest</span>
                    <span className="text-sm font-semibold text-slate-800 tracking-tight">Vplay System</span>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 pointer-events-auto">
                  {notifications && notifications.length > 0 ? (
                    notifications.slice(0, 5).map((n: any) => (
                      <div key={n.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-colors">
                        <p className="text-xs font-semibold text-slate-700 leading-tight line-clamp-1">{n.title}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center">
                       <span className="text-[11px] text-slate-300 italic">No notifications</span>
                    </div>
                  )}
               </div>
            </div>
          )}

          {w.type === "vconnect_spark" && (
            <div className="flex flex-col h-full overflow-hidden justify-between w-full">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/10 rounded-[18px]">
                    <Play size={20} className="text-purple-600 fill-current" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-semibold text-slate-400">Siêu tốc</span>
                    <span className="text-sm font-semibold text-slate-800 tracking-tight">Social Vconnect</span>
                  </div>
               </div>
               
               <div className="flex-1 flex flex-col justify-center gap-2 my-2 pointer-events-auto">
                 <button 
                   onClick={() => {
                     localStorage.setItem("vconnect_quick_trigger", "story");
                     onNavigate("Vconnect");
                   }}
                   className="w-full flex items-center justify-between p-2.5 bg-purple-50 hover:bg-purple-100/80 rounded-xl text-left border border-purple-100 transition-all active:scale-[0.98]"
                 >
                   <div className="flex items-center gap-2">
                     <Camera size={14} className="text-purple-600" />
                     <span className="text-xs font-black text-purple-950">Đăng story mới...</span>
                   </div>
                   <ArrowRight size={12} className="text-purple-400" />
                 </button>

                 <button 
                   onClick={() => {
                     localStorage.setItem("vconnect_quick_trigger", "feed");
                     onNavigate("Vconnect");
                   }}
                   className="w-full flex items-center justify-between p-2.5 bg-indigo-50 hover:bg-indigo-100/80 rounded-xl text-left border border-indigo-100 transition-all active:scale-[0.98]"
                 >
                   <div className="flex items-center gap-2">
                     <MessageSquare size={14} className="text-indigo-600" />
                     <span className="text-xs font-black text-indigo-950">Đăng bài viết mới...</span>
                   </div>
                   <ArrowRight size={12} className="text-indigo-400" />
                 </button>

                 <button 
                   onClick={() => {
                     localStorage.setItem("vconnect_quick_trigger", "vchat");
                     onNavigate("Vconnect");
                   }}
                   className="w-full flex items-center justify-between p-2.5 bg-pink-50 hover:bg-pink-100/80 rounded-xl text-left border border-pink-100 transition-all active:scale-[0.98]"
                 >
                   <div className="flex items-center gap-2">
                     <Mail size={14} className="text-pink-600" />
                     <span className="text-xs font-black text-pink-950">Mờ nhắn tin vChat...</span>
                   </div>
                   <ArrowRight size={12} className="text-pink-400" />
                 </button>
               </div>
            </div>
          )}

          {!["weather", "clock_date", "vtv6_countdown", "stocks", "ports", "entertainment", "notify", "history", "record", "channel", "music_player", "sys_mon", "notes", "crypto", "world_clock", "calendar_alt", "thirdparty", "vconnect_spark"].includes(w.type) && (
            <div className="flex flex-col h-full items-center justify-center text-center">
               <div className="p-4 bg-blue-500/5 rounded-[28px] mb-3">
                   <Flask size={32} className="text-blue-500/20" />
               </div>
               <p className="text-sm font-semibold text-slate-800 tracking-tight">Widget Experimental</p>
               <p className="text-[11px] font-medium text-slate-400 mt-1">Sắp có mặt trên Vplay OS</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showContextMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            style={{ position: 'fixed', top: contextMenuPos.y, left: contextMenuPos.x, zIndex: 10010 }}
            className="w-48 bg-white/80 backdrop-blur-2xl border border-black/5 rounded-2xl shadow-2xl overflow-hidden p-1.5"
          >
             <div className="space-y-0.5">
               <button onClick={() => onMove('up')} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 transition-colors text-sm font-medium"><ChevronUp size={14} className="opacity-40" /> Move up</button>
               <button onClick={() => onMove('down')} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 transition-colors text-sm font-medium"><ChevronDown size={14} className="opacity-40" /> Move down</button>
               <button onClick={() => onMove('left')} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 transition-colors text-sm font-medium"><ChevronLeft size={14} className="opacity-40" /> Move left</button>
               <button onClick={() => onMove('right')} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 transition-colors text-sm font-medium"><ChevronRight size={14} className="opacity-40" /> Move right</button>
               <div className="h-px bg-black/5 my-1 mx-2" />
               <button onClick={onResize} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 transition-colors text-sm font-medium"><Maximize2 size={14} className="opacity-40" /> Resize</button>
               <button onClick={onLock} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 transition-colors text-sm font-medium ${w.locked ? 'text-blue-600' : ''}`}><Lock size={14} className="opacity-40" /> {w.locked ? 'Unlock' : 'Lock'}</button>
               <button onClick={onRemove} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors text-sm font-medium"><Trash2 size={14} className="opacity-40" /> Remove</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);

  const calculateWinner = (squares: any[]) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
    }
    return null;
  };

  const handleClick = (i: number) => {
    if (calculateWinner(board) || board[i]) return;
    const newBoard = board.slice();
    newBoard[i] = 'X';
    setBoard(newBoard);
    setIsXNext(false);
  };

  useEffect(() => {
    if (!isXNext && !calculateWinner(board)) {
      const emptyIndices = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
      if (emptyIndices.length > 0) {
        setTimeout(() => {
          const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)] as number;
          const newBoard = board.slice();
          newBoard[randomIndex] = 'O';
          setBoard(newBoard);
          setIsXNext(true);
        }, 500);
      }
    }
  }, [isXNext]);

  const winner = calculateWinner(board);

  return (
    <div className="flex flex-col h-full">
       <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Tic Tac Toe</span>
          {winner && <span className="text-[10px] font-bold text-blue-500 uppercase">{winner === 'X' ? 'Bạn thắng!' : 'Bot thắng!'}</span>}
       </div>
       <div className="grid grid-cols-3 gap-2 flex-1">
          {board.map((v, i) => (
            <button key={i} onClick={() => handleClick(i)} className="rounded-xl bg-current opacity-10 flex items-center justify-center text-xl font-black">
              {v}
            </button>
          ))}
       </div>
       <button onClick={() => { setBoard(Array(9).fill(null)); setIsXNext(true); }} className="mt-2 text-[9px] font-black uppercase opacity-30 hover:opacity-100">Reset Game</button>
    </div>
  );
}

function BrowserContent({ initialUrl = "https://www.google.com/search?igu=1" }: { initialUrl?: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleGo = (e: FormEvent) => {
    e.preventDefault();
    let target = inputUrl.trim();
    if (!target) return;
    
    // If it's a search term (no dot or starts with search), use google
    if (!target.includes(".") && !target.startsWith("http")) {
      target = `https://www.google.com/search?q=${encodeURIComponent(target)}&igu=1`;
    } else if (!target.startsWith("http")) {
      target = "https://" + target;
    }
    
    setUrl(target);
    setInputUrl(target);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa]">
      <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-black/5 shadow-sm z-10">
        <div className="flex items-center gap-1.5">
          <button onClick={() => window.history.back()} className="p-1.5 hover:bg-black/5 rounded-lg transition-colors text-slate-600"><ChevronLeft size={18} /></button>
          <button onClick={() => window.history.forward()} className="p-1.5 hover:bg-black/5 rounded-lg transition-colors text-slate-600"><ChevronRight size={18} /></button>
          <button onClick={() => setUrl(prev => prev + "")} className="p-1.5 hover:bg-black/5 rounded-lg transition-colors text-slate-600"><RotateCcw size={18} /></button>
        </div>
        <form onSubmit={handleGo} className="flex-1 flex items-center bg-slate-100 rounded-xl px-4 py-2 border border-transparent focus-within:border-blue-500/30 focus-within:bg-white focus-within:shadow-md transition-all">
          <Globe size={14} className="text-slate-400 mr-3" />
          <input 
            className="flex-1 bg-transparent outline-none text-xs text-slate-700 font-bold placeholder:text-slate-400"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Nhập URL hoặc tìm kiếm..."
          />
        </form>
        <button className="p-2 hover:bg-yellow-500/10 rounded-lg transition-colors"><Star size={18} className="text-amber-400" /></button>
        <button className="p-2 hover:bg-black/5 rounded-lg transition-colors text-slate-600"><Menu size={18} /></button>
      </div>
      <div className="flex-1 bg-white relative overflow-hidden">
        <iframe 
          ref={iframeRef}
          src={url} 
          className="w-full h-full border-none" 
          title="V-Browser"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation allow-downloads"
        />
        <div className="absolute bottom-4 right-4 animate-pulse">
           <div className="px-3 py-1 bg-blue-500/10 backdrop-blur-md border border-blue-500/20 rounded-full flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Vplay Proxy Shield Active</span>
           </div>
        </div>
      </div>
    </div>
  );
}

function PlayForMeContent({ isDark, liquidGlass, featureFlags }: { isDark: boolean, liquidGlass: "glassy" | "tinted", featureFlags?: any }) {
  const [mediaUrl, setMediaUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setMediaUrl(selectedFile.name);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mediaUrl.startsWith("http")) {
      setPreviewUrl(mediaUrl);
      setFile(null);
    }
  };

  const isVideo = (url: string | null) => {
    if (!url) return false;
    const ext = url.split('.').pop()?.toLowerCase() || "";
    return ["mp4", "webm", "mov"].includes(ext) || url.startsWith("data:video");
  };

  return (
    <div className={`p-6 flex flex-col gap-6 h-full relative ${featureFlags?.xaml_experience ? "bg-transparent" : (isDark ? "bg-[#0b0b0b] text-white" : "bg-slate-50 text-slate-900")}`}>
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${(liquidGlass === "glassy" && !featureFlags?.xaml_experience) ? "opacity-100" : "opacity-0"}`} style={{ background: 'linear-gradient(135deg, #2d0b3b 0%, #1a0525 100%)', zIndex: 0 }} />
      <div className="relative z-10 w-full h-full flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-500/20 rounded-2xl">
          <Play className="text-blue-500" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Play For Me</h2>
          <p className="text-xs opacity-60">Play your media files or URLs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form onSubmit={handleUrlSubmit} className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Import from URL</label>
          <div className="relative group">
            <input 
              type="text" 
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Paste media link here..."
              className={`w-full px-4 py-3 rounded-2xl border bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${isDark ? "border-white/10" : "border-black/5"}`}
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors">
              <Globe size={16} />
            </button>
          </div>
        </form>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Load Local File</label>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={`w-full py-3 px-4 rounded-2xl border border-dashed flex items-center justify-center gap-3 transition-all ${isDark ? "border-white/20 hover:bg-white/5" : "border-black/10 hover:bg-black/5"}`}
          >
            <Upload size={18} className="text-blue-500" />
            <span className="text-sm font-medium">Browse Files</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="audio/*,video/*"
          />
        </div>
      </div>

      <div className={`flex-1 rounded-[2rem] border overflow-hidden flex items-center justify-center relative bg-black/5 ${isDark ? "border-white/10" : "border-black/5"}`}>
        {previewUrl ? (
          isVideo(previewUrl) || file?.type.startsWith("video") ? (
            <video 
              src={previewUrl} 
              controls 
              className="w-full h-full object-contain"
              autoPlay
            />
          ) : (
            <div className="flex flex-col items-center gap-6">
              <div className="w-32 h-32 rounded-full bg-blue-500/10 flex items-center justify-center animate-pulse">
                <Music size={48} className="text-blue-500" />
              </div>
              <audio src={previewUrl} controls className="w-64" autoPlay />
              <div className="text-center">
                <p className="text-sm font-bold">{file?.name || "Remote Audio Stream"}</p>
                <p className="text-[10px] opacity-40 uppercase tracking-widest">{file?.type || "Audio/Stream"}</p>
              </div>
            </div>
          )
        ) : (
          <div className="text-center opacity-40 space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-500/10 flex items-center justify-center mx-auto">
              <Play size={24} />
            </div>
            <p className="text-sm">Chưa có gì để phát</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 text-[10px] opacity-40 justify-center">
        <span>Support: MP3, MP4, WAV, WEBM, OGG, MOV, M4A</span>
      </div>
      </div>
    </div>
  );
}

function ConvertForMeContent({ isDark }: { isDark: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [targetExt, setTargetExt] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conversions = [
    { from: ["png", "jpg", "jpeg"], to: ["ico", "png", "webp"], label: "Image tools" },
    { from: ["svg"], to: ["png", "webp"], label: "Vector tools" },
    { from: ["mp4", "mov"], to: ["mp3"], label: "Video extraction" },
    { from: ["mp3"], to: ["ogg", "wav"], label: "Audio tools" },
    { from: ["webp"], to: ["png", "jpg"], label: "Format swap" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setConvertedUrl(null);
      
      const sourceExt = selectedFile.name.split('.').pop()?.toLowerCase() || "";
      const match = conversions.find(c => c.from.includes(sourceExt));
      if (match) {
        setTargetExt(match.to[0]);
      }
    }
  };

  const handleConvert = async () => {
    if (!file || !targetExt) return;
    setIsConverting(true);
    
    // Simulate complex conversions but handle simple ones
    setTimeout(() => {
      // In a real app we'd use Canvas for images/SVGs or ffmpeg.wasm for media
      // For this demo, we'll simulate the download
      setConvertedUrl(URL.createObjectURL(file)); 
      setIsConverting(false);
    }, 2000);
  };

  return (
    <div className={`p-6 flex flex-col gap-6 h-full ${isDark ? "text-white" : "text-slate-900"}`}>
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-500/20 rounded-2xl">
          <RefreshCcw className="text-blue-500" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Convert For Me</h2>
          <p className="text-xs opacity-60">Fast & smart file conversion</p>
        </div>
      </div>

      <div 
        className={`flex-1 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center p-12 transition-all ${
          file ? "border-blue-500/50 bg-blue-500/5" : (isDark ? "border-white/10" : "border-black/5")
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const droppedFile = e.dataTransfer.files[0];
          if (droppedFile) setFile(droppedFile);
        }}
      >
        {file ? (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center mx-auto shadow-xl">
              <File className="text-white" size={32} />
            </div>
            <div>
              <p className="font-bold">{file.name}</p>
              <p className="text-[10px] opacity-40 uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button 
              onClick={() => setFile(null)}
              className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-slate-500/10 flex items-center justify-center mx-auto">
              <Upload size={32} className="opacity-40" />
            </div>
            <div className="space-y-1">
              <p className="font-bold">Drop your file here</p>
              <p className="text-xs opacity-40">or click to browse from device</p>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg active:scale-95"
            >
              Select File
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Target Format</label>
          <div className="flex flex-wrap gap-2">
            {file && conversions.find(c => c.from.includes(file.name.split('.').pop()?.toLowerCase() || ""))?.to.map(ext => (
              <button
                key={ext}
                onClick={() => setTargetExt(ext)}
                className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase transition-all ${
                  targetExt === ext ? "bg-blue-600 border-blue-500 text-white shadow-lg" : (isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/5")
                }`}
              >
                {ext}
              </button>
            ))}
            {!file && <p className="text-xs opacity-30 italic">Upload a file to see options</p>}
          </div>
        </div>

        <div className="flex items-end">
          <button
            disabled={!file || !targetExt || isConverting}
            onClick={handleConvert}
            className={`w-full py-4 rounded-3xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 ${
              isConverting ? "bg-slate-500 text-white cursor-wait" : "bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/20 active:scale-95"
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            {isConverting ? (
              <>
                <RefreshCcw className="animate-spin" size={18} />
                <span>Converting...</span>
              </>
            ) : convertedUrl ? (
              <>
                <Download size={18} />
                <span>Download Result</span>
              </>
            ) : (
              <>
                <Zap size={18} />
                <span>Start Conversion</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SpeakForMeContent({ isDark, onBack, onSave }: { isDark: boolean, onBack?: () => void, onSave?: (name: string, text: string) => void }) {
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [voiceName, setVoiceName] = useState("Phantom's voice");
  const [selectedLang, setSelectedLang] = useState("English (United States)");
  const [view, setView] = useState<"create" | "history">("create");
  const [isListening, setIsListening] = useState(false);
  const [history, setHistory] = useState<{ id: string, name: string, text: string, date: string }[]>(() => {
    const saved = localStorage.getItem("vplay_speakforme_history");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("vplay_speakforme_history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const welcome = "Welcome to Speak For Me! Start typing something so I can speak";
    const utterance = new SpeechSynthesisUtterance(welcome);
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        const preferred = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
        setSelectedVoice(preferred.name);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [selectedVoice]);
  
  const handleSpeak = (customText?: string) => {
    const t = customText || text;
    if (!t.trim()) {
      const utterance = new SpeechSynthesisUtterance("Hello! This is how I sound");
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(t);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang.includes("Vietnamese") ? "vi-VN" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setText(prev => prev + (prev ? " " : "") + transcript);
    };

    recognition.start();
  };

  const handleSaveToHistory = () => {
    if (!text.trim()) return;
    const newEntry = {
      id: Math.random().toString(36).substr(2, 9),
      name: voiceName || "Untitled voice",
      text: text,
      date: new Date().toLocaleString()
    };
    setHistory([newEntry, ...history]);
    onSave?.(newEntry.name, text);
    setText("");
    setVoiceName("Phantom's voice");
  };

  const handleExportSound = () => {
    if (!text.trim()) return;
    
    // Simulate MP3 download logic
    const blob = new Blob([text], { type: 'audio/mpeg' }); // Mock blob
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${voiceName || "vplay_sound"}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    handleSaveToHistory();
  };

  return (
    <div className="flex flex-col h-full bg-[#eff3f9] text-[#1a1a1a] font-sans">
      <div className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-4">
                <h1 className="text-4xl font-bold tracking-tight">Speak For Me</h1>
             </div>
             {view === "history" && (
                <button 
                  onClick={() => setView("create")}
                  className="text-blue-600 font-medium hover:underline flex items-center gap-2"
                >
                  <ArrowLeft size={16} /> Back to creator
                </button>
             )}
          </div>

          {view === "create" ? (
            <div className="grid grid-cols-[1fr_300px] gap-8">
              {/* Main Area */}
              <div className="space-y-8">
                  <div className="space-y-4 max-w-sm">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">File Name</label>
                      <input 
                        type="text"
                        value={voiceName}
                        onChange={(e) => setVoiceName(e.target.value)}
                        className="w-full bg-white border border-slate-200 p-2 text-sm text-slate-700 outline-none focus:border-blue-500 shadow-sm rounded-lg"
                        placeholder="Name your file..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Voice & Language</label>
                      <div className="relative group">
                        <select 
                          value={selectedLang}
                          onChange={(e) => setSelectedLang(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-2 pr-10 text-sm text-slate-700 outline-none appearance-none cursor-pointer shadow-sm rounded-lg"
                        >
                           <option>English (United States)</option>
                           <option>Vietnamese (Vietnam)</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <ChevronDown size={14} className="text-slate-400" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Change Voice</label>
                      <div className="relative group">
                        <select 
                          value={selectedVoice}
                          onChange={(e) => setSelectedVoice(e.target.value)}
                          className="w-full bg-white border border-slate-200 p-2 pr-10 text-sm text-slate-700 outline-none appearance-none cursor-pointer shadow-sm rounded-lg"
                        >
                          {voices.map(voice => (
                            <option key={voice.name} value={voice.name}>
                              {voice.name} ({voice.lang})
                            </option>
                          ))}
                          {voices.length === 0 && <option>System Default</option>}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <ChevronDown size={14} className="text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                <div className="mt-8 relative group">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type something so I can speak..."
                    className="w-full h-48 p-6 pb-16 rounded-[2rem] border-b-2 border-blue-500 bg-white text-lg font-medium outline-none shadow-sm placeholder:text-slate-400 resize-none"
                  />
                  <div className="absolute right-6 bottom-6 flex items-center gap-3">
                     <button 
                        onClick={startListening}
                        className={`p-4 rounded-full transition-all flex items-center justify-center ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-blue-600 text-white hover:scale-110"}`}
                        title="Start dictation"
                     >
                        <Mic size={20} />
                     </button>
                  </div>
                </div>
              </div>

              {/* Right Preview Area */}
              <div className="flex flex-col items-center pt-24">
                <div className="relative w-64 h-64 mb-8 flex items-center justify-center">
                   <div className="absolute inset-0 rounded-full bg-white shadow-inner opacity-20" />
                   <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/80 to-slate-200/50 shadow-lg flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,white,transparent)] opacity-60" />
                      <motion.div 
                        animate={{ scale: isListening ? [1, 1.2, 1] : [1, 1.05, 1], rotate: isListening ? [0, 180, 360] : [0, 5, -5, 0] }}
                        transition={{ duration: isListening ? 1 : 4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-48 h-24 bg-white/30 blur-xl rounded-full"
                      />
                      <div className="absolute w-[150%] h-12 bg-white/20 blur-md rotate-[-20deg] top-1/2 -translate-y-1/2" />
                   </div>
                </div>
                
                <p className="text-slate-600 text-sm font-medium mb-4">{isListening ? "I'm listening..." : "Ready to speak"}</p>
                
                <button
                  onClick={() => handleSpeak()}
                  className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm active:scale-95"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <Play size={14} fill="currentColor" />
                  </div>
                  Preview
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
                  No history found. Try creating a sound first!
                </div>
              ) : (
                history.map(item => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-500/30 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-slate-800">{item.name}</h3>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">{item.date}</span>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-1">{item.text}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => handleSpeak(item.text)}
                        className="p-3 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
                      >
                        <Play size={18} fill="currentColor" />
                      </button>
                      <button 
                        onClick={() => setHistory(history.filter(h => h.id !== item.id))}
                        className="p-3 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="h-20 border-t border-slate-200 bg-white flex items-center justify-end px-12 gap-4">
        <button 
          onClick={() => setView(view === "create" ? "history" : "create")}
          className="px-8 py-2 rounded-md bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          {view === "create" ? "History" : "Back"}
        </button>
        {view === "create" && (
          <>
            <button 
              disabled={!text.trim()}
              onClick={handleSaveToHistory}
              className={`px-8 py-2 rounded-md transition-all shadow-sm ${
                text.trim() 
                  ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" 
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              Save sound
            </button>
            <button 
              disabled={!text.trim()}
              onClick={handleExportSound}
              className={`px-8 py-2 rounded-md transition-all shadow-sm ${
                text.trim() 
                  ? "bg-[#0067c0] text-white hover:bg-[#005aab]" 
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              Export sound (.mp3)
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CopyForMeContent({ onBack }: { onBack?: () => void }) {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState("Vietnamese (Vietnam)");
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const welcome = "Welcome to Copy For Me. Start speaking something long to copy them immediately";
    const utterance = new SpeechSynthesisUtterance(welcome);
    window.speechSynthesis.speak(utterance);
  }, []);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang.includes("Vietnamese") ? "vi-VN" : "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => {
      console.error("Speech error", e);
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setText(prev => prev + (prev ? " " : "") + finalTranscript);
      }
    };

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-900 font-sans">
      <div className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Copy For Me</h1>
              <p className="text-slate-500 mt-2">Nói để chuyển đổi thành văn bản và sao chép ngay lập tức.</p>
            </div>
            <select 
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium outline-none shadow-sm"
            >
              <option>Vietnamese (Vietnam)</option>
              <option>English (United States)</option>
            </select>
          </div>

          <div className="relative">
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nhấn nút micro và bắt đầu nói..."
              className="w-full h-80 p-8 rounded-[2.5rem] bg-white border-2 border-slate-100 focus:border-blue-500 outline-none text-xl font-medium shadow-xl shadow-slate-200/50 resize-none transition-all"
            />
            
            <div className="absolute right-8 bottom-8 flex items-center gap-4">
              {text && (
                <button 
                  onClick={() => setText("")}
                  className="text-slate-400 hover:text-red-500 transition-colors font-bold uppercase tracking-widest text-[10px]"
                >
                  Xóa hết
                </button>
              )}
              <button 
                onClick={startListening}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl relative group ${
                  isListening 
                    ? "bg-red-500 text-white animate-pulse scale-110" 
                    : "bg-blue-600 text-white hover:scale-105 active:scale-95"
                }`}
              >
                <Mic size={32} />
                {isListening && (
                  <div className="absolute -inset-4 bg-red-500/20 rounded-full animate-ping pointer-events-none" />
                )}
              </button>
            </div>
          </div>

          <div className="mt-12 flex justify-center">
            <button 
              disabled={!text}
              onClick={handleCopy}
              className={`px-12 py-5 rounded-full font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-xl ${
                text 
                  ? "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-2xl active:scale-95" 
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {isCopied ? <Check size={20} /> : <Copy size={20} />}
              {isCopied ? "Đã sao chép!" : "Sao chép ngay"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutDoStuffContent() {
  const text = "Các tính năng thuộc hệ thống Do For Me thực chất là các tính năng thử nghiệm test tiền đề cho các tính năng trọng điểm của Vplay Dev như ghi màn hình hoặc đọc liệu. Bạn hãy thử và đóng góp ý kiến nhé!";

  useEffect(() => {
    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      // Try to find a Vietnamese voice
      const viVoice = voices.find(v => v.lang.includes("vi-VN") || v.name.toLowerCase().includes("vietnamese"));
      if (viVoice) utterance.voice = viVoice;
      utterance.rate = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      speak();
    } else {
      window.speechSynthesis.onvoiceschanged = speak;
    }
    
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-white font-sans p-12 overflow-y-auto">
      <div className="max-w-2xl mx-auto flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-purple-100 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-purple-500/10">
          <Zap size={48} className="text-purple-600 animate-pulse" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-6">Do For Me là gì?</h1>
        <div className="p-10 rounded-[3rem] bg-slate-50 border-2 border-white shadow-xl shadow-slate-200/50 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-2 h-full bg-purple-500" />
           <p className="text-xl font-medium leading-relaxed text-slate-600 italic">
             "{text}"
           </p>
        </div>
        <div className="mt-12 flex flex-col items-center gap-4">
           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
             <div className="w-2 h-2 rounded-full bg-purple-500" />
             AI Narrator Reading
           </div>
           <p className="text-xs text-slate-400 max-w-sm">
             Tính năng này đang sử dụng AI Narrator để trình bày thông tin quan trọng tới bạn.
           </p>
        </div>
      </div>
    </div>
  );
}

function GeminiWindowContent() {
  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <div className="flex-1 relative">
        <iframe 
          src="https://gemini.google.com" 
          className="w-full h-full border-none"
          title="Google Gemini"
          allow="microphone; camera; geolocation"
        />
        <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-12 text-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
           <Sparkles size={48} className="text-purple-500 mb-6" />
           <h2 className="text-2xl font-bold mb-4 text-slate-900">Gemini AI is loading...</h2>
           <p className="text-slate-500 max-w-sm mb-8">Nếu trang không tự động tải, vui lòng nhấn nút bên dưới để mở trong tab mới.</p>
           <button 
             onClick={() => window.open("https://gemini.google.com", "_blank")}
             className="pointer-events-auto px-8 py-3 bg-purple-600 text-white rounded-full font-bold hover:bg-purple-700 transition-all shadow-lg"
           >
             Open Gemini in New Tab
           </button>
        </div>
      </div>
    </div>
  );
}

function RecordForMeContent({ featureFlags }: { featureFlags: any }) {
  const [isRecording, setIsRecording] = useState(false);
  const [history, setHistory] = useState<{ id: string, name: string, date: string, type: string, url: string }[]>(() => {
    const saved = localStorage.getItem("vplay_recorder_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [source, setSource] = useState<"screen" | "tv">("screen");
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [view, setView] = useState<"record" | "history">("record");

  const [selectedChannel, setSelectedChannel] = useState<any>(channels[0]);

  useEffect(() => {
    localStorage.setItem("vplay_recorder_history", JSON.stringify(history));
  }, [history]);

  const startStream = async () => {
    try {
      let s: MediaStream;
      if (source === "screen") {
        s = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: true
        } as any);
      } else {
        const videoElement = document.querySelector('video');
        if (!videoElement) {
          alert("No active video player found to record.");
          return;
        }
        // captureStream is not on all browsers but standard in Chrome/Edge
        s = (videoElement as any).captureStream ? (videoElement as any).captureStream() : (videoElement as any).mozCaptureStream ? (videoElement as any).mozCaptureStream() : null;
        if (!s) {
          alert("Your browser does not support recording from a video element.");
          return;
        }
      }
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      console.error("Error accessing display media", err);
    }
  };

  const startRecording = () => {
    if (!stream) {
      alert("Please enable capture first.");
      return;
    }
    
    // Check supported mime types
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
      ? 'video/webm;codecs=vp9' 
      : 'video/webm';

    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;
    const localChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) localChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(localChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedChunks(localChunks);
      
      const newEntry = {
        id: Math.random().toString(36).substr(2, 9),
        name: `Record ${history.length + 1}`,
        date: new Date().toLocaleString(),
        type: 'video/webm',
        url: url
      };
      setHistory(prev => [newEntry, ...prev]);
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const downloadRecording = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-900 font-sans">
      <div className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight">Record For Me</h1>
            <div className="flex gap-2">
              <button 
                onClick={() => setView("record")}
                className={`px-4 py-2 rounded-xl text-sm font-bold ${view === "record" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}
              >
                Record
              </button>
              <button 
                onClick={() => setView("history")}
                className={`px-4 py-2 rounded-xl text-sm font-bold ${view === "history" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}
              >
                History ({history.length})
              </button>
            </div>
          </div>

          {view === "record" ? (
            <div className="space-y-8">
              <div className="flex justify-center gap-4 mb-4">
                <button 
                  onClick={() => { setSource("screen"); if(stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); } }}
                  className={featureFlags.xaml_experience 
                    ? `vplay-retro-btn ${source === "screen" ? "vplay-retro-btn-primary" : "vplay-retro-btn-secondary"}`
                    : `px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${source === "screen" ? "bg-blue-600 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-100"}`}
                >
                  Whole Screen
                </button>
                <button 
                  onClick={() => { setSource("tv"); if(stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); } }}
                  className={featureFlags.xaml_experience 
                    ? `vplay-retro-btn ${source === "tv" ? "vplay-retro-btn-primary" : "vplay-retro-btn-secondary"}`
                    : `px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${source === "tv" ? "bg-blue-600 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-100"}`}
                >
                  TV Player Only
                </button>
              </div>

              {source === "tv" && (
                <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Channel to Record</p>
                  <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
                    {channels.slice(0, 10).map(ch => (
                      <button
                        key={ch.name}
                        onClick={() => setSelectedChannel(ch)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${selectedChannel?.name === ch.name ? "bg-blue-600 text-white shadow-lg" : "bg-white text-slate-500 border border-slate-100 hover:border-blue-200"}`}
                      >
                        {ch.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="aspect-video w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative border-4 border-white">
                <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
                {!stream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm pointer-events-none">
                     <Video size={48} className="text-white/20 mb-4" />
                     <p className="text-white font-bold text-lg">Ready to capture {source === 'tv' ? 'TV Channel' : 'Screen'}</p>
                     <p className="text-white/60 text-sm">Click "Enable Capture" to see preview</p>
                  </div>
                )}
                {isRecording && (
                  <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full animate-pulse z-10">
                    <div className="w-2 h-2 bg-white rounded-full" />
                    Recording...
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-4">
                {!stream ? (
                  <button 
                    onClick={startStream}
                    className="px-10 py-5 bg-blue-600 text-white rounded-full font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/20 active:scale-95"
                  >
                    Enable Capture
                  </button>
                ) : (
                  <>
                    {!isRecording ? (
                      <button 
                        onClick={startRecording}
                        className="px-10 py-5 bg-red-600 text-white rounded-full font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-2xl shadow-red-500/20 flex items-center gap-3 active:scale-95"
                      >
                        <Circle size={18} fill="white" />
                        Start Recording
                      </button>
                    ) : (
                      <button 
                        onClick={stopRecording}
                        className="px-10 py-5 bg-slate-900 text-white rounded-full font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl flex items-center gap-3 active:scale-95"
                      >
                        <Square size={18} fill="white" />
                        Stop Recording
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        stream.getTracks().forEach(track => track.stop());
                        setStream(null);
                      }}
                      className="px-8 py-5 bg-white border border-slate-200 text-slate-500 rounded-full font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-8">
              {history.length === 0 ? (
                <div className="col-span-2 p-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-300">
                  <Video size={64} className="mx-auto mb-6 opacity-10" />
                  <p className="font-bold uppercase tracking-widest text-xs">Your recordings will appear here</p>
                </div>
              ) : (
                history.map(item => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 group hover:border-blue-500/20 transition-all"
                  >
                    <div className="aspect-video w-full bg-slate-900 rounded-2xl mb-6 overflow-hidden relative">
                      <video src={item.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <Play size={40} className="text-white" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-lg mb-1">{item.name}</h3>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{item.date}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => downloadRecording(item.url, item.name)}
                          className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors shadow-sm"
                          title="Save to device"
                        >
                          <ChevronDown size={20} />
                        </button>
                        <button 
                          onClick={() => {
                            setHistory(history.filter(h => h.id !== item.id));
                            URL.revokeObjectURL(item.url);
                          }}
                          className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors shadow-sm"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FileExplorerContent({ isDark }: { isDark: boolean }) {
  const [currentPath, setCurrentPath] = useState("Vplay C:\\");
  
  const folders = [
    { name: "Documents", icon: Folder, color: "text-blue-500" },
    { name: "Downloads", icon: Folder, color: "text-green-500" },
    { name: "Pictures", icon: Folder, color: "text-orange-500" },
    { name: "Videos", icon: Folder, color: "text-purple-500" },
    { name: "Music", icon: Folder, color: "text-rose-500" },
    { name: "Desktop", icon: Monitor, color: "text-slate-500" },
  ];

  const devices = [
    { name: "Vplay (C:)", icon: HardDrive, usage: "45.2 GB used of 128 GB" },
    { name: "Cloud Drive", icon: Cloud, usage: "12.4 MB used of 15 GB" },
  ];

  return (
    <div className="flex h-full bg-white dark:bg-[#1a1a1a] text-black dark:text-white">
      {/* Sidebar */}
      <div className="w-48 border-r border-black/5 dark:border-white/5 p-4 flex flex-col gap-6">
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Quick Access</p>
          <div className="space-y-1">
            {folders.slice(0, 4).map(f => (
              <button key={f.name} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left">
                <f.icon size={16} className={f.color} />
                <span className="text-xs font-bold">{f.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-30">This PC</p>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left bg-blue-500/10 text-blue-500">
               <HardDrive size={16} />
               <span className="text-xs font-bold">Vplay (C:)</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left">
               <Cloud size={16} className="text-blue-400" />
               <span className="text-xs font-bold">Cloud Storage</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navigation Bar */}
        <div className="h-14 border-b border-black/5 dark:border-white/5 px-4 flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg opacity-40"><ChevronLeft size={16} /></button>
            <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg opacity-40"><ChevronRight size={16} /></button>
            <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg opacity-40"><ChevronLeft size={16} className="rotate-90" /></button>
          </div>
          <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-full px-4 py-2 border border-black/5 dark:border-white/5 flex items-center gap-3">
            <HardDrive size={14} className="opacity-40" />
            <span className="text-xs opacity-60 font-medium">{currentPath}</span>
          </div>
          <div className="w-48 bg-black/5 dark:bg-white/5 rounded-full px-4 py-2 border border-black/5 dark:border-white/5 flex items-center gap-2 relative group overflow-hidden">
            <Search size={14} className="opacity-40" />
            <input placeholder="Search files..." className="bg-transparent border-none outline-none text-xs w-full" />
            <div className={`absolute bottom-0 left-0 h-[2.5px] w-full transition-all duration-300 ${isDark ? "bg-white/10" : "bg-black/10"} group-focus-within:bg-blue-500`} />
          </div>
        </div>

        {/* View Area */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-8">
            <section className="space-y-4">
               <p className="text-[10px] font-black uppercase tracking-widest opacity-20">Folders</p>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {folders.map(f => (
                   <button key={f.name} className="flex flex-col items-center gap-3 p-6 rounded-3xl border border-black/5 dark:border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group">
                     <f.icon size={48} className={`${f.color} drop-shadow-lg group-hover:scale-110 transition-transform`} />
                     <span className="text-xs font-black uppercase tracking-tight">{f.name}</span>
                   </button>
                 ))}
               </div>
            </section>

            <section className="space-y-4">
               <p className="text-[10px] font-black uppercase tracking-widest opacity-20">Devices and drives</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {devices.map(d => (
                   <button key={d.name} className="flex items-center gap-4 p-5 rounded-3xl border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left">
                     <d.icon size={32} className="text-blue-500" />
                     <div className="flex-1 space-y-1.5">
                       <p className="text-xs font-black uppercase tracking-tight">{d.name}</p>
                       <div className="h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500 w-[35%]" />
                       </div>
                       <p className="text-[9px] font-bold opacity-30">{d.usage}</p>
                     </div>
                   </button>
                 ))}
               </div>
            </section>
          </div>
        </div>

        {/* Status Bar */}
        <div className="h-8 border-t border-black/5 dark:border-white/5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest opacity-30">
            <span>8 items</span>
            <div className="w-0.5 h-3 bg-black/10 dark:bg-white/10" />
            <span>1 item selected</span>
            <div className="w-0.5 h-3 bg-black/10 dark:bg-white/10" />
            <span>45.2 GB free</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded"><LayoutGrid size={12} /></button>
            <button className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded opacity-40"><Menu size={12} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DebugContent({ isDark, featureFlags, setFeatureFlags, setUser, setIsAdmin, setIsDev, setIsDark, setLiquidGlass, setIsSidebarRight, setUseSidebar, onAlert, isFloating, setIsFloating }: { 
  isDark: boolean, 
  featureFlags: any, 
  setFeatureFlags: (f: any, id?: string, name?: string, val?: boolean) => void,
  setUser: (u: any) => void,
  setIsAdmin: (a: boolean) => void,
  setIsDev: (d: boolean) => void,
  setIsDark: (d: boolean) => void,
  setLiquidGlass: (l: "glassy" | "tinted") => void,
  setIsSidebarRight: (r: boolean) => void,
  setUseSidebar: (s: boolean) => void,
  onAlert: (title: string, msg: string) => void,
  isFloating?: boolean,
  setIsFloating?: (f: boolean) => void
}) {
  const [history, setHistory] = useState<any[]>(["Vplay Canary Operator Console [Version Codename (C) Nx626]", "Type /help for all available commands."]);
  const [input, setInput] = useState("");
  const [currentView, setCurrentView] = useState<"terminal" | "code" | "flags">("terminal");
  const scrollRef = useRef<HTMLDivElement>(null);

  const availableFlags = [
    { id: 'sidebar_resizable', name: 'Resizable sidebar', desc: 'Cho phép điều chỉnh độ rộng của sidebar bằng cách kéo thả' },
    { id: 'multiview_experimental', name: 'Multiview', desc: 'Xem nhiều kênh truyền hình cùng một lúc' },
    { id: 'disable_animation', name: 'Reduce Animation', desc: 'Giảm hiệu ứng chuyển động trên trang web. Thích hợp cho các thiết bị yếu' },
    { id: 'settings_vertical', name: 'List settings', desc: 'Chuyển layout settings về dạng danh sách thay vì dạng ô (Yêu cầu XAML View)' },
    { id: 'xaml_home', name: 'XAML Home Page', desc: 'Use the new XAML version of the Home page' },
    { id: 'speaking_feature', name: 'Speak for me', desc: 'Speak for me!' },
    { id: 'revamp_process_animation', name: 'Revamped Process', desc: 'Use the updated version of the processing loading circle' },
    { id: 'search_merge', name: 'Merge Search', desc: 'Merge the search button with the navigation bar' },
    { id: 'ai_tools_preview', name: 'Do For Me (preview)', desc: 'The Microslop Do For Me Experience (TM)' },
    { id: 'ai_tools', name: 'Do For Me', desc: 'Enable native Gemini-powered AI Tooling and applications' },
    { id: 'ai_sidebar', name: 'AI Sidebar', desc: 'Open Do For Me as sidebar' },
    { id: 'scrollable_bar', name: 'Scrollable Bar', desc: 'Makes the Navigation Bar scrollable' },
    { id: 'copilot_action_v2', name: 'Advanced Do For Me Actions', desc: 'Use advanced Do For Me actions menu' },
    { id: 'sort_az', name: 'Sorting: A-Z', desc: 'Sort channels alphabetically from A to Z' },
    { id: 'sort_za', name: 'Sorting: Z-A', desc: 'Sort channels alphabetically from Z to A' },
    { id: 'sort_newest', name: 'Sorting: Newest to oldest', desc: 'Sort channels from newest to oldest added' },
    { id: 'sort_oldest', name: 'Sorting: Oldest to newest', desc: 'Sort channels from oldest to newest added' },
    { id: 'xaml_experience', name: 'Switch to the new UI', desc: 'Use the brand-new rebuilt Vplay app based on XAML system' }
  ];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  const handleCommand = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const fullCmd = input.trim();
    const args = fullCmd.split(" ");
    const cmd = args[0].toLowerCase();
    const newHistory = [...history, { type: 'input', text: fullCmd }];
    
    if (cmd === "/bypass") {
      setUser({ uid: "bypass-user", email: "bypass@vplay.canary", displayName: "Bypass Operator" });
      setIsAdmin(true);
      setIsDev(true);
      newHistory.push({ type: 'text', text: "AUTH BYPASS SUCCESSFUL: Operator privileges granted." });
    } else if (cmd === "/version") {
      newHistory.push({ type: 'text', text: "Vplay Canary SMR26" }, { type: 'text', text: "Build: Codename (C) Nx626 (Experimental)" }, { type: 'text', text: "Environment: Cloud Sandbox" });
    } else if (cmd === "/interface") {
      const mode = args[1]?.toLowerCase();
      if (mode === "desktop") {
        setUseSidebar(true);
        newHistory.push({ type: 'text', text: "Interface changed to Desktop." });
      } else if (mode === "mobile") {
        setUseSidebar(false);
        newHistory.push({ type: 'text', text: "Interface changed to Mobile." });
      } else {
        newHistory.push({ type: 'text', text: "Usage: /interface (desktop/mobile)" });
      }
    } else if (cmd === "/liquid" && args[1]?.toLowerCase() === "glass") {
      const mode = args[2]?.toLowerCase();
      if (mode === "glassy" || mode === "tinted") {
        setLiquidGlass(mode);
        newHistory.push({ type: 'text', text: `Liquid glass mode set to: ${mode}` });
      } else {
        newHistory.push({ type: 'text', text: "Usage: /liquid glass (glassy/tinted)" });
      }
    } else if (cmd === "/sidebar" && args[1]?.toLowerCase() === "pos") {
      const pos = args[2]?.toLowerCase();
      if (pos === "left") {
        setIsSidebarRight(false);
        newHistory.push({ type: 'text', text: "Sidebar position: LEFT" });
      } else if (pos === "right") {
        setIsSidebarRight(true);
        newHistory.push({ type: 'text', text: "Sidebar position: RIGHT" });
      } else {
        newHistory.push({ type: 'text', text: "Usage: /sidebar pos left|right" });
      }
    } else if (cmd === "/ui" && args[1]?.toLowerCase() === "mode") {
      const mode = args[2]?.toLowerCase();
      if (mode === "light") {
        setIsDark(false);
        newHistory.push({ type: 'text', text: "UI mode: Light" });
      } else if (mode === "dark") {
        setIsDark(true);
        newHistory.push({ type: 'text', text: "UI mode: Dark" });
      } else {
        newHistory.push({ type: 'text', text: "Usage: /ui mode (light/dark)" });
      }
    } else if (cmd === "/experimental") {
      const action = args[1]?.toLowerCase();
      const target = args[2]?.toLowerCase();
      
      if (action === "/enable" || action === "/disable") {
        const newState = action === "/enable";
        if (target === "/all") {
          const updatedFlags = { ...featureFlags };
          availableFlags.forEach(f => { updatedFlags[f.id] = newState; });
          setFeatureFlags(updatedFlags);
          localStorage.setItem("vplay_feature_flags", JSON.stringify(updatedFlags));
          newHistory.push({ type: 'text', text: `ALL experimental features have been ${newState ? "ENABLED" : "DISABLED"}.` });
        } else if (target?.startsWith("/id:")) {
          const flagId = target.replace("/id:", "");
          if (availableFlags.find(f => f.id === flagId)) {
            const newFlags = { ...featureFlags, [flagId]: newState };
            setFeatureFlags(newFlags);
            localStorage.setItem("vplay_feature_flags", JSON.stringify(newFlags));
            newHistory.push({ type: 'text', text: `Experimental feature [${flagId}] marked as ${newState ? "ENABLED" : "DISABLED"}.` });
          } else {
            newHistory.push({ type: 'error', text: `Error: Invalid flag ID [${flagId}].` });
          }
        } else {
          newHistory.push({ type: 'text', text: "Usage: /experimental /enable|/disable /id:<id> or /all" });
        }
      } else {
        newHistory.push({ type: 'text', text: "Usage: /experimental /enable|/disable /id:<id> or /all" });
      }
    } else if (fullCmd.toLowerCase() === "/show experiments") {
      newHistory.push({ type: 'text', text: "AVAILABLE EXPERIMENTAL FEATURES:" });
      availableFlags.forEach(f => {
        newHistory.push({ 
          type: 'experiment', 
          name: f.name, 
          id: f.id, 
          desc: f.desc, 
          status: featureFlags[f.id] 
        });
      });
    } else if (cmd === "/allow" && args[1]?.toLowerCase() === "direct" && args[2]?.toLowerCase() === "enables") {
      sessionStorage.setItem("allow_direct_enables", "true");
      newHistory.push({ type: 'text', text: "Direct toggling allowed. You can now toggle experiments directly in Settings." });
    } else if (cmd === "/code") {
      setCurrentView("code");
      newHistory.push({ type: 'text', text: "Switching to Source Explorer..." });
    } else if (cmd === "/help") {
      const helpCommands = [
        { cmd: "/bypass", desc: "Bypass authentication" },
        { cmd: "/version", desc: "Show application version" },
        { cmd: "/interface (desktop/mobile)", desc: "Set interface mode" },
        { cmd: "/liquid glass (glassy/tinted)", desc: "Set liquid glass effect" },
        { cmd: "/sidebar pos left|right", desc: "Set sidebar position" },
        { cmd: "/ui mode (light/dark)", desc: "Set UI color theme" },
        { cmd: "/experimental /enable|/disable /id:<id>|/all", desc: "Control experimental flags" },
        { cmd: "/show experiments", desc: "List all experiments with details" },
        { cmd: "/experiments gui", desc: "Visual experiment management" },
        { cmd: "/code", desc: "Read-only source explorer" },
        { cmd: "/clear", desc: "Clear console" }
      ];
      newHistory.push({ type: 'text', text: "Available commands:" });
      helpCommands.forEach(h => {
        newHistory.push({ type: 'help', command: h.cmd, desc: h.desc });
      });
    } else if (cmd === "/clear") {
      setHistory([]);
    } else {
      newHistory.push({ type: 'error', text: `Unknown command: ${cmd}` });
    }

    setHistory(newHistory);
    setInput("");
  };

  if (currentView === "code") {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <FileCode size={24} /> SOURCE EXPLORER
          </h2>
          <button onClick={() => setCurrentView("terminal")} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 font-bold uppercase text-[10px] tracking-widest transition-all">Quay lại</button>
        </div>
        <div className={`p-6 rounded-[32px] border font-mono text-xs overflow-auto ${isDark ? "bg-black/80 border-white/5 text-green-400" : "bg-slate-900 border-slate-700 text-green-400"} h-[600px]`}>
          <pre>{`// Vplay Canary Source Preview (Read-only)
// App.tsx entry point logic

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { initializeApp } from "firebase/app";

/** 
 * Build Codename (C) Nx626 
 * SMR26 Canary Branch
 */
  const STANDARD_LOADING_GIF = "https://upload.wikimedia.org/wikipedia/commons/3/3f/Windows-loading-cargando.gif";
  const REVAMPED_LOADING_GIF = "https://cdn.pixabay.com/animation/2023/10/08/03/19/03-19-26-213_512.gif";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">System Internals</span>
      </div>
      
      <div className="space-y-4">
        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-3">
          <p className="text-[11px] font-medium opacity-60 leading-relaxed">
            This module is used to visualize the current state of application logic during high-intensity computation cycles.
          </p>
        </div>
      </div>
    </div>
  );
}
`}</pre>
        </div>
      </div>
    );
  }

  if (currentView === "flags") {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <Sparkles size={24} /> EXPERIMENTAL
          </h2>
          <button onClick={() => setCurrentView("terminal")} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 font-bold uppercase text-[10px] tracking-widest transition-all">Quay lại</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableFlags.map((flag) => (
            <div key={flag.id} className={isDark ? "p-6 rounded-[32px] border bg-[#1a1c23] border-white/5 flex flex-col justify-between gap-4 transition-all hover:scale-[1.02]" : "p-6 rounded-[32px] border bg-white border-slate-200 flex flex-col justify-between gap-4 transition-all hover:scale-[1.02]"}>
              <div className="space-y-1">
                <span className="font-bold text-xs uppercase tracking-wider">{flag.name}</span>
                <p className="text-[10px] opacity-40 font-mono">{flag.id}</p>
              </div>
              <button 
                onClick={() => {
                  const newState = !featureFlags[flag.id];
                  const newFlags = { ...featureFlags, [flag.id]: newState };
                  setFeatureFlags(newFlags, flag.id, flag.name, newState);
                  
                  setTimeout(() => window.location.reload(), 100);
                }}
                className={`relative flex-shrink-0 transition-all duration-300 ${
                  featureFlags.minecraft_mode 
                    ? `minecraft-toggle ${featureFlags[flag.id] ? 'active' : ''}` 
                    : `w-12 h-6 rounded-full ${featureFlags[flag.id] ? "bg-purple-500" : "bg-slate-600"}`
                }`}
              >
                <div className={featureFlags.minecraft_mode ? "minecraft-toggle-thumb scale-90" : `absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${featureFlags[flag.id] ? "left-7" : "left-1"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-8 h-full flex flex-col space-y-6 ${isFloating ? "p-4 space-y-4" : ""}`}>
      <div className="flex items-center justify-between">
        <h2 className={`${isFloating ? "text-lg" : "text-2xl"} font-black flex items-center gap-3`}>
          <Terminal size={isFloating ? 18 : 24} /> OPERATOR CONSOLE
        </h2>
        {!isFloating && setIsFloating && (
          <button 
            onClick={() => setIsFloating(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 font-bold uppercase text-[10px] tracking-widest transition-all"
          >
            <ExternalLink size={14} /> Open As Window
          </button>
        )}
      </div>
      
      <div 
        ref={scrollRef}
        className={`flex-1 p-6 font-mono text-sm overflow-auto rounded-[32px] border ${isDark ? "bg-black/90 border-white/10 text-slate-300" : "bg-slate-900 border-slate-700 text-slate-300"} ${isFloating ? "p-4 rounded-2xl text-xs" : ""}`}
      >
        <div className="space-y-1">
          {history.map((line, i) => {
             if (typeof line === 'string') return <div key={i}>{line}</div>;
             if (line.type === 'input') return <div key={i} className="text-purple-400 font-bold">{`> ${line.text}`}</div>;
             if (line.type === 'help') return (
               <div key={i} className="flex gap-2">
                 <span className="text-yellow-400 min-w-[200px]">{line.command}</span>
                 <span className="text-white">{`- ${line.desc}`}</span>
               </div>
             );
             if (line.type === 'experiment') return (
               <div key={i} className="grid grid-cols-[150px_150px_1fr_80px] gap-4 py-1 border-b border-white/5 last:border-0">
                 <span className="text-[#cddc39] font-bold">{line.name}</span>
                 <span className="text-[#4fc3f7]">{line.id}</span>
                 <span className="text-white truncate">{line.desc}</span>
                 <span className={line.status ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                   {line.status ? "ON" : "OFF"}
                 </span>
               </div>
             );
             if (line.type === 'error') return <div key={i} className="text-red-400">{line.text}</div>;
             return <div key={i} className="text-slate-300">{line.text}</div>;
          })}
          <form onSubmit={handleCommand} className="flex gap-2 items-center">
            <span className="text-green-500 font-bold">{"data/canary/operator>"}</span>
            <input 
              autoFocus
              className="flex-1 bg-transparent border-none outline-none text-white selection:bg-purple-500/50"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
          </form>
        </div>
      </div>
    </div>
  );
}

function IndividualPlayer({ channel, isMuted, volume, isDark }: { channel: Channel, isMuted: boolean, volume: number, isDark: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(channel.stream);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.stream;
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [channel]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  return (
    <video 
      ref={videoRef} 
      className="w-full h-full object-cover" 
      autoPlay 
      playsInline
      muted={isMuted}
    />
  );
}

function TVContent({ 
  active, setActive, isDark, favorites, toggleFavorite, togglePin, isPinned, user, onLogin, isDev, liquidGlass, 
  sortOrder, setSortOrder, showSplash, featureFlags, searchQuery, 
  minimalMode = false, activeTab, setShowCanaryWarning, activeSearchPlaceholder = "Search Vplay",
  channels
}: { 
  active: Channel, 
  setActive: (ch: Channel) => void, 
  isDark: boolean,
  favorites: string[],
  toggleFavorite: (ch: Channel) => void,
  togglePin?: (ch: Channel) => void,
  isPinned?: (channelName: string) => boolean,
  user: any,
  onLogin: () => void,
  isDev?: boolean,
  liquidGlass: "glassy" | "tinted",
  sortOrder: "default" | "az" | "za",
  setSortOrder: (val: "default" | "az" | "za") => void,
  showSplash?: boolean,
  featureFlags: { [key: string]: boolean },
  searchQuery: string,
  minimalMode?: boolean,
  activeTab?: string,
  setShowCanaryWarning?: (val: boolean) => void,
  activeSearchPlaceholder?: string,
  channels: Channel[]
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false); // Default to sound ON
  const [volume, setVolume] = useState(1);
  const [levels, setLevels] = useState<Hls.Level[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [filterType, setFilterType] = useState<string>("Tất cả");
  const [streamError, setStreamError] = useState<string | null>(null);

  // categories definition removed to avoid duplication

  const [showSortMenu, setShowSortMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Multiview state
  const [isMultiview, setIsMultiview] = useState(false);
  const [multiviewCount, setMultiviewCount] = useState(4); // Default 4 channels
  const [multiviewChannels, setMultiviewChannels] = useState<(Channel | null)[]>([]);
  const [multiviewVolumes, setMultiviewVolumes] = useState<{ [key: number]: number }>({});
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  useEffect(() => {
    if (multiviewChannels.length === 0) {
      setMultiviewChannels([active, ...Array(multiviewCount - 1).fill(null)]);
    } else {
      const newChannels = [...multiviewChannels];
      if (newChannels.length < multiviewCount) {
        setMultiviewChannels([...newChannels, ...Array(multiviewCount - newChannels.length).fill(null)]);
      } else if (newChannels.length > multiviewCount) {
        setMultiviewChannels(newChannels.slice(0, multiviewCount));
      }
    }
  }, [multiviewCount]);

  useEffect(() => {
    if (isMultiview && multiviewChannels[0]?.name !== active.name) {
      setMultiviewChannels(prev => {
        const next = [...prev];
        next[0] = active;
        return next;
      });
    }
  }, [active, isMultiview]);

  const toggleMultiview = () => {
    if (!isMultiview) {
      setMultiviewChannels([active, ...Array(multiviewCount - 1).fill(null)]);
    }
    setIsMultiview(!isMultiview);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const isMaintenance = active.status === "maintenance";

  const filteredChannels = channels
    .filter(ch => {
      const matchesSearch = ch.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "Tất cả" 
        || (filterType === "Hoạt động" && ch.status !== "maintenance")
        || (filterType === "Bảo trì" && ch.status === "maintenance")
        || ch.category === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      // Experimental overrides
      if (featureFlags.sort_az) return a.name.localeCompare(b.name);
      if (featureFlags.sort_za) return b.name.localeCompare(a.name);
      if (featureFlags.sort_newest) {
        const idxA = channels.indexOf(a);
        const idxB = channels.indexOf(b);
        return idxB - idxA;
      }
      if (featureFlags.sort_oldest) {
        const idxA = channels.indexOf(a);
        const idxB = channels.indexOf(b);
        return idxA - idxB;
      }

      if (sortOrder === "default") return 0;
      if (sortOrder === "az") return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });

  const CATEGORY_ORDER = ["VTV", "HTV", "VTVcab", "Địa phương", "Thiết yếu", "Phát thanh"];
  const filteredCategories = CATEGORY_ORDER.filter(cat => 
    filteredChannels.some(ch => ch.category === cat)
  );

  useEffect(() => {
    if (!user && !isDev) return;
    if (showSplash) return; // Wait until sound is unblocked by user interaction
    
    // Always try to reset mute when splash is gone
    setIsMuted(false);

    if (active.status === "maintenance") {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      setIsPlaying(true);
      setStreamError(null);
      // Native autoPlay attribute mixed with muted=true in JSX handles playback perfectly
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // Track watched channel
    if (user) {
      const userRef = doc(db, "users", user.uid);
      updateDoc(userRef, {
        watchedChannels: arrayUnion(active.name)
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, 'users/' + user.uid));
    }

    video.volume = volume;
    setStreamError(null);
    let isEffectMounted = true;

    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60
      });
      hlsRef.current = hls;
      hls.attachMedia(video);
      
      // Remove proxy for live streams because native HLS correctly resolves relative URLs and CDNs handle CORS.
      // The proxy was originally created for testing but breaks chunk requests.
      hls.loadSource(active.stream);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!isEffectMounted) return;
        setStreamError(null);
        setIsPlaying(true);
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            if (e.name === 'AbortError') return;
            console.warn("Autoplay prevented, trying muted", e);
            video.muted = true;
            setIsMuted(true);
            video.play().catch(() => {});
          });
        }
        setLevels(hls!.levels);
        setCurrentLevel(hls!.currentLevel);
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        if (!isEffectMounted) return;
        setCurrentLevel(data.level);
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!isEffectMounted) return;
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setStreamError("Lỗi mạng: Không thể tải luồng phát. Vui lòng kiểm tra kết nối hoặc CORS.");
              hls!.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setStreamError("Lỗi media: Dữ liệu video không hợp lệ.");
              hls!.recoverMediaError();
              break;
            default:
              setStreamError("Lỗi không xác định khi tải kênh.");
              hls!.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      const proxyUrl = `/proxy?url=${encodeURIComponent(active.stream)}`;
      video.src = proxyUrl;
      const onLoadedMetadata = () => {
        if (!isEffectMounted) return;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            video.muted = true;
            setIsMuted(true);
            video.play().catch(() => {});
          });
        }
      };
      const onError = () => {
        if (!isEffectMounted) return;
        setStreamError("Trình duyệt báo lỗi khi phát luồng này.");
      };
      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('error', onError);
    }

    return () => {
      isEffectMounted = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
    };
  }, [active, user]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val > 0 && isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      } else if (val === 0 && !isMuted) {
        videoRef.current.muted = true;
        setIsMuted(true);
      }
    }
  };

  const setQuality = (level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      setShowQualityMenu(false);
    }
  };

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      const video = videoRef.current;
      if (!video) return;

      try {
        // @ts-ignore - captureStream is semi-standard
        const stream = video.captureStream ? video.captureStream() : (video as any).mozCaptureStream ? (video as any).mozCaptureStream() : null;
        
        if (!stream) {
          alert("Trình duyệt không hỗ trợ ghi hình video.");
          return;
        }

        const mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          
          const date = new Date();
          const timestamp = date.getFullYear() + 
                          ('0' + (date.getMonth() + 1)).slice(-2) + 
                          ('0' + date.getDate()).slice(-2) + "_" + 
                          ('0' + date.getHours()).slice(-2) + 
                          ('0' + date.getMinutes()).slice(-2);
          
          const filename = `${active.name}_${timestamp}_vplayrec.mp4`;
          
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        };

        recorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Recording error:", err);
        alert("Lỗi khi ghi hình. Có thể do giới hạn bảo mật (CORS) của luồng phát này.");
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    }
  };

  // categories definition removed to avoid duplication

  const [showChannelSelector, setShowChannelSelector] = useState<{ idx: number } | null>(null);
  const [channelSearch, setChannelSearch] = useState("");

  const filteredMultiviewChannels = channels.filter(c => 
    c.name.toLowerCase().includes(channelSearch.toLowerCase()) ||
    c.category.toLowerCase().includes(channelSearch.toLowerCase())
  );

  return (
    <div className={`flex-1 p-4 md:p-6 overflow-y-auto relative ${featureFlags.xaml_experience ? "bg-transparent" : (isDark ? "bg-[#0b0b0b] text-white" : "bg-slate-50 text-slate-900")}`}>
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${(liquidGlass === "glassy" && !featureFlags.xaml_experience) ? "opacity-100" : "opacity-0"}`} style={{ background: 'linear-gradient(135deg, #2d0b3b 0%, #1a0525 100%)', zIndex: 0 }} />
      <div className="relative z-10 w-full h-full flex flex-col">
      {/* Liquid Modal for Channel Selection */}
      <LiquidModal
        isOpen={!!showChannelSelector}
        onClose={() => { setShowChannelSelector(null); setChannelSearch(""); }}
        isDark={isDark}
        title="Chọn kênh Multiview"
        description="Tìm kiếm và chọn kênh truyền hình bạn muốn thêm vào lưới Multiview"
        liquidGlass={liquidGlass}
        featureFlags={featureFlags}
      >
        <div className="space-y-6">
          <div className={`relative group flex items-center gap-3 px-4 py-4 rounded-full overflow-hidden transition-all ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
            <Search size={18} className="text-slate-500 group-focus-within:text-purple-500 transition-colors" />
            <input 
              type="text"
              placeholder={activeSearchPlaceholder}
              value={channelSearch}
              onChange={(e) => setChannelSearch(e.target.value)}
              className={`bg-transparent border-none outline-none text-sm font-bold w-full placeholder-slate-500 ${isDark ? "text-white" : "text-slate-900"}`}
            />
            <div className={`absolute bottom-0 left-0 h-[2.5px] w-full transition-all duration-300 ${isDark ? "bg-white/10" : "bg-slate-200"} group-focus-within:bg-purple-500 group-focus-within:shadow-[0_0_10px_rgba(168,85,247,0.5)]`} />
          </div>

          <div className="max-h-[350px] overflow-y-auto px-1 space-y-2 custom-scrollbar pr-2">
            {filteredMultiviewChannels.length > 0 ? (
              filteredMultiviewChannels.map(c => (
                <button
                  key={c.name}
                  onClick={() => {
                    if (showChannelSelector) {
                      setMultiviewChannels(prev => {
                        const next = [...prev];
                        next[showChannelSelector.idx] = c;
                        return next;
                      });
                      setShowChannelSelector(null);
                      setChannelSearch("");
                    }
                  }}
                  className={`w-full flex items-center gap-4 p-3 rounded-[20px] transition-all group ${isDark ? "hover:bg-white/5 text-white" : "hover:bg-slate-100 text-slate-900"}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center p-2 border ${isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}`}>
                    <img src={c.logo} alt={c.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-sm leading-tight uppercase tracking-tight">{c.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{c.category}</p>
                  </div>
                  <div className="p-2 rounded-full bg-purple-500/10 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <LogIn size={16} />
                  </div>
                </button>
              ))
            ) : (
              <div className="py-20 text-center space-y-4">
                <div className="inline-flex p-4 rounded-full bg-slate-500/10 text-slate-500">
                  <Search size={32} />
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Không tìm thấy kênh nào</p>
              </div>
            )}
          </div>
        </div>
      </LiquidModal>

      {/* ADVERTISEMENT BANNER REMOVED */}
      
      {/* VIDEO PLAYER */}
      <div className={`bg-black mb-6 flex items-center justify-center border shadow-2xl relative overflow-hidden group ${
        isMultiview ? "aspect-auto min-h-[400px]" : "aspect-video"
      } ${
        liquidGlass ? "rounded-2xl" : "rounded-lg"
      } ${isDark ? "border-slate-800" : "border-slate-300"}`}>
        <video 
          ref={videoRef} 
          className="w-full h-full object-contain z-10" 
          autoPlay 
          playsInline 
          muted={isMuted}
          loop={active.name === "VTV6"}
        />
        {!user && !isDev ? (
          <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/40 p-6 text-center ${
            liquidGlass ? "backdrop-blur-xl" : "backdrop-blur-none"
          }`}>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`p-10 border shadow-2xl flex flex-col items-center space-y-6 bg-white/80 border-black/5 ${
                liquidGlass ? "rounded-[40px]" : "rounded-2xl"
              }`}
            >
              <div className="p-4 rounded-full bg-purple-50">
                <Lock className="h-10 w-10 text-purple-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900">Đăng nhập để xem</h3>
                <p className="text-slate-500 text-sm max-w-[280px]">Vui lòng đăng nhập tài khoản VPlay để có thể xem kênh trực tuyến này.</p>
              </div>
              <button 
                onClick={onLogin}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-3xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-600/20"
              >
                Đăng nhập ngay
              </button>
            </motion.div>
          </div>
        ) : isMultiview ? (
          <div className={`w-full h-full grid gap-2 p-2 ${
            multiviewCount <= 2 ? "grid-cols-2" : 
            multiviewCount <= 4 ? "grid-cols-2" : 
            "grid-cols-3"
          }`}>
            {multiviewChannels.map((ch, idx) => (
              <div key={idx} className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden border border-white/5 group/slot">
                {ch ? (
                  <IndividualPlayer 
                    channel={ch} 
                    isMuted={multiviewVolumes[idx] === 0 || multiviewVolumes[idx] === undefined} 
                    volume={multiviewVolumes[idx] ?? 0}
                    isDark={isDark}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-500">
                    <div className="p-4 rounded-full bg-white/5 border border-white/5">
                      <Tv size={32} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Trống</span>
                  </div>
                )}
                
                {/* Individual Control Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/slot:opacity-100 transition-opacity flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    {ch && <img src={ch.logo} className="w-4 h-4 object-contain" />}
                    <span className="text-[10px] font-black text-white truncate">{ch?.name || "Chọn kênh"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Volume2 size={12} className="text-white opacity-60" />
                    <input 
                      type="range" min="0" max="1" step="0.1" 
                      value={multiviewVolumes[idx] ?? 0}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setMultiviewVolumes(prev => ({ ...prev, [idx]: v }));
                      }}
                      className="w-12 h-1 bg-white/20 rounded-full appearance-none accent-purple-500"
                    />
                    <button 
                      onClick={() => setMultiviewChannels(prev => {
                        const next = [...prev];
                        next[idx] = null;
                        return next;
                      })}
                      className="p-1 rounded bg-red-500/20 text-red-500 hover:bg-red-500/40"
                    >
                      <X size={10} />
                    </button>
                  </div>
                </div>

                {/* Slot Action Button (if empty) */}
                {!ch && (
                   <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setShowChannelSelector({ idx })}
                        className="px-6 py-2.5 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-110 active:scale-95 transition-all"
                      >
                        Chọn kênh
                      </button>
                   </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <>
            {active.status === "maintenance" ? (
              <div className="absolute inset-0 w-full h-full bg-[#0a0a0a] flex flex-col items-center justify-center p-8 overflow-hidden">
                {/* Background Testcard Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none select-none overflow-hidden">
                  <div className="w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #1a1a1a 0, #1a1a1a 1px, transparent 0, transparent 50%)', backgroundSize: '100px 100px' }} />
                  <div className="absolute top-1/2 left-0 w-full h-[1px] bg-red-500/30" />
                  <div className="absolute top-0 left-1/2 w-[1px] h-full bg-red-500/30" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/20 rounded-full" />
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative z-10 text-center space-y-8"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-5 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                      <Zap className="h-12 w-12 text-amber-500 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-4xl font-black text-white tracking-tighter uppercase">Kênh đang bảo trì</h3>
                      <p className="text-white/40 font-mono text-sm uppercase tracking-widest">System Status: Maintenance Mode</p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 backdrop-blur-md p-6 max-w-md rounded-2xl space-y-4">
                    <p className="text-white/70 text-sm leading-relaxed">
                      Kênh truyền hình này hiện đang trong quá trình nâng cấp hệ thống định kỳ. Vui lòng quay lại sau ít phút hoặc xem các kênh khác.
                    </p>
                    <div className="flex items-center justify-center gap-6 pt-2 border-t border-white/5 text-[10px] font-mono text-white/30 uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>Signal: Stable</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span>Update: 85%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <button 
                      onClick={() => window.location.reload()}
                      className="px-8 py-3 bg-white hover:bg-white/90 text-black rounded-xl text-sm font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                      <RotateCcw size={16} />
                      Tải lại trang
                    </button>
                    <div className="px-6 py-3 border border-white/20 text-white/60 rounded-xl text-xs font-mono">
                      CODE: MAINTENANCE_503
                    </div>
                  </div>
                </motion.div>

                {/* Corner Accents */}
                <div className="absolute top-8 left-8 font-mono text-[10px] text-white/20 select-none">
                  VPLAY // SYSTEM_CORE_v2.4
                </div>
                <div className="absolute bottom-8 right-8 font-mono text-[10px] text-white/20 select-none">
                  {new Date().toISOString()}
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                className="w-full h-full"
                autoPlay
                muted={isMuted}
                onClick={togglePlay}
              />
            )}
            
            {streamError && active.status !== "maintenance" && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl p-6 text-center">
                <div className="bg-red-500/20 p-4 rounded-full mb-4 ring-2 ring-red-500/50">
                  <X className="h-10 w-10 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Lỗi bảo mật (CORS)</h3>
                <p className="text-white/60 text-sm max-w-xs mb-6">
                  {streamError}
                  <br />
                  <span className="text-[10px] mt-2 block text-amber-400 opacity-60">Gợi ý: Luồng phát này chặn xem trực tiếp trên Website. Hãy cài extension "CORS Unblock" hoặc mở link trực tiếp bên dưới.</span>
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button 
                    onClick={() => window.open(active.stream, '_blank')}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2"
                  >
                    <ExternalLink size={16} />
                    Xem link gốc
                  </button>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all border border-white/10"
                  >
                    Tải lại trang
                  </button>
                </div>
              </div>
            )}
            {/* Tap to Unmute Overlay */}
            {isMuted && isPlaying && !isMaintenance && (
              <button 
                onClick={toggleMute}
                className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-black/80 transition-all animate-bounce"
              >
                <VolumeX className="h-4 w-4" />
                CHẠM ĐỂ BẬT TIẾNG
              </button>
            )}
            {!isMaintenance && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col justify-between">
                <div className="p-8 md:p-10 pointer-events-auto">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-2xl flex items-center justify-center">
                         <img src={active.logo} alt={active.name} className="h-10 w-10 object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-2xl font-black tracking-tighter text-white uppercase">{active.name}</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/10">{active.category}</span>
                          <div className="flex items-center gap-1 text-[10px] text-white/50 font-bold uppercase tracking-widest">
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                             LIVE 4K
                          </div>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="p-8 md:p-10 pointer-events-auto">
                   <div className={`p-4 rounded-[32px] border border-white/10 flex items-center justify-between gap-6 backdrop-blur-3xl shadow-2xl ${liquidGlass === "tinted" ? "bg-white/80" : "bg-black/30"}`}>
                      <div className="flex items-center gap-3">
                         <button onClick={togglePlay} className={`p-4 rounded-2xl transition-all hover:scale-105 active:scale-95 ${liquidGlass === "tinted" ? "bg-black text-white" : "bg-white text-black"}`}>
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                         </button>
                         <div className="hidden sm:flex items-center gap-4 pl-4 border-l border-white/10">
                            <Volume2 size={20} className={liquidGlass === "tinted" ? "text-black" : "text-white"} />
                            <input 
                              type="range" min="0" max="1" step="0.1" 
                              value={volume} onChange={handleVolumeChange}
                              className="w-24 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-purple-500"
                            />
                         </div>
                      </div>

                      <div className="flex items-center gap-4">
                          {featureFlags.multiview_experimental && (
                            <div className="relative">
                              <button 
                                onClick={() => setShowLayoutMenu(!showLayoutMenu)}
                                className={`p-4 rounded-2xl border transition-all ${
                                  isMultiview
                                    ? "bg-purple-600 border-purple-500 text-white shadow-lg"
                                    : liquidGlass === "tinted" ? "bg-black/5 border-black/10 text-black" : "bg-white/5 border-white/10 text-white"
                                }`}
                                title="Multiview"
                              >
                                <LayoutGrid size={20} />
                              </button>
                              <AnimatePresence>
                                {showLayoutMenu && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className={`absolute bottom-full mb-4 right-0 min-w-[220px] border shadow-2xl z-50 p-6 space-y-6 ${
                                      isDark ? "bg-slate-900 border-white/10" : "bg-white border-slate-200"
                                    } ${liquidGlass ? "rounded-[32px] backdrop-blur-3xl" : "rounded-2xl"}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-white/40" : "text-slate-500"}`}>Enable Multiview</span>
                                      <button 
                                        onClick={toggleMultiview}
                                        className={`relative flex-shrink-0 transition-all duration-300 ${
                                          featureFlags.minecraft_mode 
                                            ? `minecraft-toggle ${isMultiview ? 'active' : ''}` 
                                            : `w-12 h-6 rounded-full ${isMultiview ? "bg-purple-600" : "bg-slate-700"}`
                                        }`}
                                      >
                                        <motion.div 
                                          animate={{ x: featureFlags.minecraft_mode ? (isMultiview ? 24 : 0) : (isMultiview ? 26 : 4) }}
                                          className={featureFlags.minecraft_mode ? "minecraft-toggle-thumb scale-90" : "absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"}
                                        />
                                      </button>
                                    </div>
                                    <div className="space-y-3">
                                      <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-white/40" : "text-slate-500"}`}>Grid Layout</span>
                                      <div className="grid grid-cols-4 gap-2">
                                        {[2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                          <button 
                                            key={n}
                                            onClick={() => {
                                              setMultiviewCount(n);
                                              if (!isMultiview) setIsMultiview(true);
                                            }}
                                            className={`p-2 rounded-xl text-xs font-black transition-all ${multiviewCount === n ? "bg-purple-600 text-white shadow-lg" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
                                          >
                                            {n}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                          <button 
                            onClick={() => toggleFavorite(active)}
                            className={`p-4 rounded-2xl border transition-all ${
                              favorites.includes(active.name)
                                ? "bg-red-500/10 border-red-500 text-red-500"
                                : liquidGlass === "tinted" ? "bg-black/5 border-black/10 text-black" : "bg-white/5 border-white/10 text-white"
                            }`}
                          >
                            <Heart size={20} fill={favorites.includes(active.name) ? "currentColor" : "none"} />
                          </button>
                         <button onClick={toggleFullscreen} className={`p-4 rounded-2xl border transition-all ${liquidGlass === "tinted" ? "bg-black/5 border-black/10 text-black" : "bg-white/5 border-white/10 text-white"}`}>
                            <Maximize size={20} />
                         </button>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CHANNEL INFO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <h2 className={`text-4xl font-black tracking-tighter uppercase ${isDark ? "text-white" : "text-slate-950"}`}>
              {active.name}
            </h2>
            {isMaintenance ? (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] px-3 py-1 rounded-full font-black tracking-widest flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                ĐANG BẢO TRÌ
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] px-3 py-1 rounded-full font-black tracking-widest flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></div>
                ĐANG TRỰC TIẾP
              </div>
            )}
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest ml-1">Đang phát sóng: {active.category}</p>
        </div>
        
        <div className="flex items-center gap-3">
           {featureFlags.multiview_experimental && (
             <button 
               onClick={toggleMultiview}
               className={`flex items-center gap-2 px-6 py-3 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest ${
                 isMultiview
                   ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20"
                   : isDark ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
               }`}
             >
               <LayoutGrid size={14} />
               {isMultiview ? "Thoát Multiview" : "Multiview"}
             </button>
           )}
           <button 
             onClick={() => toggleFavorite(active)}
             className={`flex items-center gap-2 px-6 py-3 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest ${
               favorites.includes(active.name)
                 ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20"
                 : isDark ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
             }`}
           >
             <Heart size={14} fill={favorites.includes(active.name) ? "currentColor" : "none"} />
             {favorites.includes(active.name) ? "Đã thích" : "Yêu thích"}
           </button>
        </div>
      </div>

      {!minimalMode && (
        <>
          {/* FILTERS */}
          <div className="mt-8">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide flex-1">
                {["Tất cả", "VTV", "HTV", "VTVcab", "Thiết yếu", "Địa phương", "Phát thanh", "Hoạt động", "Bảo trì"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-5 py-2.5 md:px-4 md:py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      filterType === type
                        ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                        : isDark
                        ? "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                        : "bg-white/10 border-white/20 text-slate-600 hover:bg-white/20"
                    } ${liquidGlass ? "backdrop-blur-md" : ""}`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                {/* Desktop Sort Button */}
                <button
                  onClick={() => {
                    if (sortOrder === "default") setSortOrder("az");
                    else if (sortOrder === "az") setSortOrder("za");
                    else setSortOrder("default");
                  }}
                  className={`hidden md:flex p-3.5 md:p-3 rounded-xl border transition-all items-center gap-2 ${
                    isDark 
                      ? "bg-slate-800/50 border-slate-700/50 text-white" 
                      : "bg-white/50 border-white/60 text-slate-900"
                  } ${liquidGlass ? "backdrop-blur-md" : ""}`}
                  title={sortOrder === "default" ? "Mặc định" : sortOrder === "az" ? "Sắp xếp A-Z" : "Sắp xếp Z-A"}
                >
                  <Filter className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {sortOrder === "default" ? "Mặc định" : sortOrder === "az" ? "A-Z" : "Z-A"}
                  </span>
                </button>

                {/* Mobile Sort Dropdown */}
                <div className="relative md:hidden flex-1">
                  <button
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className={`w-full p-3.5 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                      isDark 
                        ? "bg-white/5 border-white/5 text-white" 
                        : "bg-white/10 border-white/20 text-slate-900"
                    } ${liquidGlass ? "backdrop-blur-md" : ""}`}
                  >
                    <Sliders className="h-5 w-5" />
                    <span className="text-sm font-bold uppercase tracking-wider">Sort</span>
                    <span className="ml-auto text-[10px] opacity-50">
                      {sortOrder === "default" ? "Mặc định" : sortOrder === "az" ? "A-Z" : "Z-A"}
                    </span>
                  </button>
                  
                  <AnimatePresence>
                    {showSortMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className={`absolute top-full left-0 right-0 mt-2 z-50 p-2 border shadow-2xl ${
                          isDark ? "bg-slate-900/95 border-white/10" : "bg-white/95 border-black/5"
                        } ${liquidGlass ? "rounded-2xl backdrop-blur-3xl" : "rounded-xl"}`}
                      >
                        {[
                          { id: "default", label: "Mặc định" },
                          { id: "az", label: "Sắp xếp A-Z" },
                          { id: "za", label: "Sắp xếp Z-A" }
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setSortOrder(opt.id as any);
                              setShowSortMenu(false);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                              sortOrder === opt.id 
                                ? "bg-purple-600 text-white" 
                                : isDark ? "text-white hover:bg-white/5" : "text-slate-900 hover:bg-black/5"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* CHANNEL LIST */}
            <div className="space-y-16">
              {filteredCategories.map(cat => (
                <div key={cat} className="space-y-8">
                  <div className="flex items-center gap-4 px-2">
                    <div className="h-8 w-1.5 bg-purple-500 rounded-full" />
                    <div>
                      <h3 className={`text-2xl md:text-3xl font-black tracking-tighter uppercase ${isDark ? "text-white" : "text-slate-900"}`}>{cat}</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
                    {cat === "Phát thanh" ? (
                      <div className={`col-span-full p-12 rounded-[40px] border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all ${
                        isDark ? "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10" : "border-black/5 bg-black/5 text-slate-500 hover:bg-black/[0.02]"
                      }`}>
                        <div className="p-4 rounded-3xl bg-purple-500/10 text-purple-500">
                          <Sparkles size={32} className="animate-pulse" />
                        </div>
                        <div className="text-center">
                          <p className="font-black text-xl tracking-tighter uppercase mb-1">Coming Soon!</p>
                          <p className="text-xs font-medium opacity-60">Tính năng đang được phát triển để mang lại trải nghiệm âm thanh tốt nhất.</p>
                        </div>
                      </div>
                    ) : (
                      filteredChannels.filter(c => c.category === cat).map((ch) => (
                        <ChannelCard 
                          key={`${ch.name}-${ch.stream}`} 
                          ch={ch} 
                          onClick={() => {
                            if (activeTab === "Phát sóng") {
                              setShowCanaryWarning(true);
                            } else {
                              setActive(ch);
                            }
                          }} 
                          isDark={isDark} 
                          isActive={active.name === ch.name} 
                          favorites={favorites} 
                          toggleFavorite={toggleFavorite} 
                          togglePin={togglePin}
                          isPinned={isPinned?.(ch.name)}
                          liquidGlass={liquidGlass}
                          isMetro={featureFlags.win8_metro}
                          featureFlags={featureFlags}
                        />
                      ))
                    )}
                  </div>
                </div>
              ))}
              {filteredChannels.length === 0 && (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/50 mb-4">
                    <img 
                      src="https://static.wikia.nocookie.net/ftv/images/6/63/Search_uci.png/revision/latest?cb=20260411084053&path-prefix=vi" 
                      alt="Search" 
                      className="h-10 w-10 object-contain" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                  <h3 className="text-xl font-bold text-slate-400">Không tìm thấy kênh nào</h3>
                  <p className="text-slate-500">Thử tìm kiếm với từ khóa khác</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}

function SearchPopup({ 
  isDark: _isDark, 
  searchQuery, 
  setActiveChannel, 
  onClose, 
  favorites, 
  liquidGlass,
  setActiveTab,
  setIsDark,
  setLiquidGlass,
  onLogin,
  onLogout,
  setSortOrder,
  togglePin,
  isPinned,
  position = "bottom",
  channels
}: {
  isDark: boolean,
  searchQuery: string,
  setActiveChannel: (ch: Channel) => void,
  onClose: () => void,
  favorites: string[],
  liquidGlass: "glassy" | "tinted",
  setActiveTab: (tab: string) => void,
  setIsDark: (val: boolean) => void,
  setLiquidGlass: (val: "glassy" | "tinted") => void,
  onLogin: () => void,
  onLogout: () => void,
  setSortOrder: (val: "az" | "za") => void,
  togglePin?: (ch: Channel) => void,
  isPinned?: (channelName: string) => boolean,
  position?: "top" | "bottom",
  channels: Channel[]
}) {
  const isDark = false; // Always light mode per request
  if (searchQuery.trim() === "") return null;

  const filteredChannels = channels.filter(ch => 
    ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ch.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const systemItems = [
    { name: "Trang chủ", type: "tab", icon: Home, action: () => setActiveTab("Trang chủ") },
    { name: "Truyền hình", type: "tab", icon: Tv, action: () => setActiveTab("Truyền hình") },
    { name: "Phát thanh", type: "tab", icon: Radio, action: () => setActiveTab("Phát thanh") },
    { name: "Hồ sơ", type: "tab", icon: User, action: () => setActiveTab("Hồ sơ") },
    { name: "Chế độ tối", type: "setting", icon: Moon, action: () => setIsDark(!isDark) },
    { name: "Hiệu ứng kính", type: "setting", icon: Layers, action: () => setLiquidGlass(liquidGlass === "glassy" ? "tinted" : "glassy") },
    { name: "Đăng nhập", type: "button", icon: LogIn, action: onLogin },
    { name: "Đăng xuất", type: "button", icon: LogOut, action: onLogout },
    { name: "Sắp xếp A-Z", type: "toggle", icon: Filter, action: () => setSortOrder("az") },
    { name: "Sắp xếp Z-A", type: "toggle", icon: Filter, action: () => setSortOrder("za") },
  ];

  const filteredSystem = systemItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteChannels = channels.filter(ch => favorites.includes(ch.name));

  return (
    <motion.div
      initial={{ opacity: 0, y: position === "top" ? -20 : 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: position === "top" ? -20 : 40, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 400 }}
      className={`absolute ${position === "top" ? "top-full mt-3" : "bottom-full mb-6"} w-[90vw] md:w-full max-w-[440px] border shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden ${
        liquidGlass ? "rounded-[24px] backdrop-blur-3xl" : "rounded-xl"
      } bg-white border-slate-200 text-black shadow-2xl z-[100]`}
    >
      <div className="p-4 space-y-1 max-h-[60vh] overflow-y-auto">
        {searchQuery.trim() === "" ? (
          <div className="space-y-4">
            {favoriteChannels.length > 0 && (
              <div className="space-y-2">
                <div className="px-4 py-2 flex items-center gap-2">
                  <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                  <p className={`text-[10px] font-bold uppercase tracking-widest text-black/60`}>Kênh yêu thích</p>
                </div>
                {favoriteChannels.map((ch, idx) => (
                  <button
                    key={`fav-ch-${ch.name}-${idx}`}
                    onClick={() => { setActiveChannel(ch); onClose(); }}
                    className={`w-full flex items-center gap-4 p-3 rounded-[24px] transition-all hover:scale-[1.02] active:scale-[0.98] group hover:bg-black/5`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border bg-slate-100 border-slate-200`}>
                      <img src={ch.logo} alt={ch.name} className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-bold text-sm text-black`}>{ch.name}</p>
                    </div>
                    {togglePin && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); togglePin(ch); }}
                        className={`p-2 rounded-full hover:bg-black/10 transition-all ${isPinned?.(ch.name) ? "text-blue-500" : "text-black/30"}`}
                      >
                        <Pin size={16} className={isPinned?.(ch.name) ? "fill-blue-500" : ""} />
                      </button>
                    )}
                    <ChevronRight className="w-4 h-4 text-black/30" />
                  </button>
                ))}
              </div>
            )}
            <div className="py-8 text-center space-y-3 text-black">
              <img 
                src="https://static.wikia.nocookie.net/ftv/images/6/63/Search_uci.png/revision/latest?cb=20260411084053&path-prefix=vi" 
                alt="Search" 
                className="w-12 h-12 mx-auto object-contain" 
                referrerPolicy="no-referrer" 
              />
              <p className="text-sm font-bold">Tìm kiếm kênh chương trình</p>
            </div>
          </div>
        ) : (filteredChannels.length > 0 || filteredSystem.length > 0) ? (
          <>
            {filteredSystem.length > 0 && (
              <div className="space-y-1 mb-4">
                <div className="px-4 py-2">
                  <p className={`text-[10px] font-bold uppercase tracking-widest text-black/60`}>Hệ thống & Cài đặt</p>
                </div>
                {filteredSystem.map((item, idx) => (
                  <button
                    key={`system-${item.name}-${idx}`}
                    onClick={() => { item.action(); onClose(); }}
                    className={`w-full flex items-center gap-4 p-3 rounded-[24px] transition-all hover:scale-[1.02] active:scale-[0.98] group hover:bg-black/5`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform group-hover:rotate-3 bg-slate-100 border-slate-200 text-purple-600`}>
                      <item.icon className="w-6 h-6 fill-current" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-bold text-sm text-black`}>{item.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-black/60">{item.type === "tab" ? "Chuyển Tab" : "Cài đặt"}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-black/30" />
                  </button>
                ))}
              </div>
            )}

            {filteredChannels.length > 0 && (
              <div className="space-y-1">
                <div className="px-4 py-2">
                  <p className={`text-[10px] font-bold uppercase tracking-widest text-black/60`}>Kênh truyền hình</p>
                </div>
                {filteredChannels.map((ch, idx) => (
                  <button
                    key={`search-ch-${ch.name}-${idx}`}
                    onClick={() => { setActiveChannel(ch); onClose(); }}
                    className={`w-full flex items-center gap-4 p-3 rounded-[24px] transition-all hover:scale-[1.02] active:scale-[0.98] group hover:bg-black/5`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform group-hover:rotate-3 bg-slate-100 border-slate-200`}>
                      <img src={ch.logo} alt={ch.name} className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-bold text-sm text-black`}>{ch.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-black/60">{ch.category}</p>
                    </div>
                    {togglePin && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); togglePin(ch); }}
                        className={`p-2 rounded-full hover:bg-black/10 transition-all ${isPinned?.(ch.name) ? "text-blue-500" : "text-black/30"}`}
                      >
                        <Pin size={16} className={isPinned?.(ch.name) ? "fill-blue-500" : ""} />
                      </button>
                    )}
                    <ChevronRight className="w-4 h-4 text-black/30" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center opacity-40 space-y-3 text-black">
            <img 
              src="https://static.wikia.nocookie.net/ftv/images/6/63/Search_uci.png/revision/latest?cb=20260411084053&path-prefix=vi" 
              alt="Search" 
              className="w-12 h-12 mx-auto object-contain" 
              referrerPolicy="no-referrer" 
            />
            <p className="text-sm font-medium">Không tìm thấy kết quả nào cho "{searchQuery}"</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function VidsContent({ isDark, user, liquidGlass, onLogin, featureFlags, lite = false, addNotification }: { 
  isDark: boolean, 
  user: FirebaseUser | null, 
  liquidGlass: "glassy" | "tinted", 
  onLogin: () => void, 
  featureFlags?: any,
  lite?: boolean,
  addNotification?: (title: string, msg: string, type?: "info" | "success" | "warning" | "error") => void
}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "media" | "post_blog" | "poll">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Creation Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<"post" | "blog" | "poll">("post");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [blogCategory, setBlogCategory] = useState("Technology");
  const [blogCoverUrl, setBlogCoverUrl] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  
  // Media uploads
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | "">("");

  // Blog Reader Modal
  const [readingBlog, setReadingBlog] = useState<any | null>(null);

  const defaultLiteItems = [
    {
      id: "mock-1",
      type: "blog",
      title: "Chào mừng bạn đến với Vids Lite!",
      content: "Đây là chế độ Vids Lite ngoại tuyến & riêng tư tuyệt đối dành cho người dùng chưa đăng nhập. Bạn có thể tự do đăng các bài viết, bài blog cá nhân, tạo các cuộc khảo sát ý kiến hoặc thậm chí tải lên ảnh và video nặng dưới 1GB.\n\nMọi dữ liệu được lưu cục bộ ngay trên trình duyệt của bạn (Local Storage) và không thể chia sẻ ra ngoài, đảm bảo tính bảo mật và riêng tư tối đa. Khi đã sẵn sàng đăng nhập, bạn có thể chuyển qua tab Vids tiêu chuẩn để tương tác công khai với cộng đồng vPlay trên toàn cầu!",
      category: "Cộng Đồng vPlay",
      coverUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
      createdAt: new Date().toISOString(),
      likes: 12,
      userEmail: "guest@vplay.local",
      likesVoted: false
    },
    {
      id: "mock-2",
      type: "poll",
      title: "Bạn có thích phong cách thiết kế giao diện vPlay Cobalt UI 3 mới không?",
      pollOptions: ["Cực kỳ yêu thích", "Rất tốt & Hiện đại", "Cần bổ sung thêm widgets", "Chưa quen mắt lắm"],
      pollVotes: [42, 28, 11, 4],
      votedOption: null,
      createdAt: new Date().toISOString(),
      userEmail: "system_poll@vplay.local"
    },
    {
      id: "mock-3",
      type: "post",
      content: "Hôm nay mình vừa tối ưu hóa trình đa nhiệm Windows 11 Mode trên vPlay, cảm giác thực sự mượt mà! Thêm cả hiệu ứng mờ nhòe acrylic cực kỳ nịnh mắt luôn.",
      mediaUrl: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=800&q=80",
      mediaType: "image",
      createdAt: new Date().toISOString(),
      likes: 5,
      userEmail: "developer@vplay.local",
      likesVoted: false
    }
  ];

  const fetchData = async () => {
    setLoading(true);
    if (lite) {
      const saved = localStorage.getItem("vplay_vids_lite_items");
      if (saved) {
        setItems(JSON.parse(saved));
      } else {
        setItems(defaultLiteItems);
        localStorage.setItem("vplay_vids_lite_items", JSON.stringify(defaultLiteItems));
      }
      setLoading(false);
    } else {
      try {
        const vidQ = collection(db, "vplay_community_vids");
        const querySnapshot = await getDocs(vidQ);
        const fbItems: any[] = [];
        querySnapshot.forEach((doc) => {
          fbItems.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort items by date descending
        fbItems.sort((a, b) => {
          const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || '').getTime();
          const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || '').getTime();
          return tB - tA;
        });

        // Fallback placeholder items for online mode if database is empty
        if (fbItems.length === 0) {
          setItems([
            {
              id: "online-default-1",
              type: "blog",
              title: "Khởi tạo Không gian Vids Community vPlay",
              content: "Chúc mừng! Bạn đã đăng nhập và truy cập thành công vào Vids Community công khai.\n\nĐây là nơi toàn bộ cộng đồng vPlay có thể đăng tải những khoảnh khắc tuyệt vời nhất của họ. Hãy tạo ngay bài viết, blog hay một cuộc thăm dò ý kiến và bắt đầu chia sẻ ý tưởng của bạn ngay hôm nay!",
              category: "Tin Tức",
              coverUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
              createdAt: new Date().toISOString(),
              likes: 15,
              userEmail: "admin@vplay.com"
            }
          ]);
        } else {
          setItems(fbItems);
        }
      } catch (err) {
        console.error("Firestore error loading vids:", err);
        const saved = localStorage.getItem("vplay_vids_lite_items") || "[]";
        setItems(JSON.parse(saved).length > 0 ? JSON.parse(saved) : defaultLiteItems);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [lite, user]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024 * 1024) { // 1GB limit check
      if (addNotification) {
        addNotification("Cảnh báo dung lượng", "Kích thước tệp tin vượt quá 1GB giới hạn tối đa!", "warning");
      } else {
        alert("Tệp của bạn vượt quá giới hạn 1GB! Vui lòng chọn tệp tin nhẹ hơn.");
      }
      return;
    }

    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setMediaUrl(localUrl);
    
    const type = file.type.startsWith("video/") ? "video" : "image";
    setMediaType(type);
  };

  const addPollOptionField = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const removePollOptionField = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, idx) => idx !== index));
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setBlogCategory("Technology");
    setBlogCoverUrl("");
    setPollOptions(["", ""]);
    setSelectedFile(null);
    setMediaUrl("");
    setMediaType("");
  };

  const handlePublish = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() && createType !== "poll" && createType !== "blog") {
      if (addNotification) addNotification("Tạo bài", "Vui lòng nhập nội dung bài đăng!", "warning");
      return;
    }
    if (createType === "blog" && (!title.trim() || !content.trim())) {
      if (addNotification) addNotification("Tạo bài", "Vui lòng nhập đầy đủ tiêu đề và nội dung blog!", "warning");
      return;
    }
    if (createType === "poll" && (!title.trim() || pollOptions.some(opt => !opt.trim()))) {
      if (addNotification) addNotification("Tạo bài", "Vui lòng điền tiêu đề cuộc bình chọn và tất cả các tùy chọn!", "warning");
      return;
    }

    const newItem: any = {
      id: "vid-" + Date.now(),
      type: createType,
      createdAt: new Date().toISOString(),
      userEmail: user?.email || "guest@vplay.local",
      likes: 0,
    };

    if (createType === "post") {
      newItem.content = content;
      if (mediaUrl) {
        newItem.mediaUrl = mediaUrl;
        newItem.mediaType = mediaType;
        newItem.fileName = selectedFile?.name || "Local Attachment";
      }
    } else if (createType === "blog") {
      newItem.title = title;
      newItem.content = content;
      newItem.category = blogCategory;
      newItem.coverUrl = blogCoverUrl || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80";
    } else if (createType === "poll") {
      newItem.title = title;
      newItem.pollOptions = pollOptions.filter(o => o.trim() !== "");
      newItem.pollVotes = new Array(newItem.pollOptions.filter(o => o.trim() !== "").length).fill(0);
      newItem.votedOption = null;
    }

    if (lite) {
      const saved = localStorage.getItem("vplay_vids_lite_items");
      const currentLiteItems = saved ? JSON.parse(saved) : defaultLiteItems;
      const updatedList = [newItem, ...currentLiteItems];
      localStorage.setItem("vplay_vids_lite_items", JSON.stringify(updatedList));
      setItems(updatedList);
      
      if (addNotification) {
        addNotification("Đăng tải Vids Lite", "Đã lưu cục bộ tin riêng tư thành công của bạn!", "success");
      }
    } else {
      if (!user) {
        onLogin();
        return;
      }
      try {
        await addDoc(collection(db, "vplay_community_vids"), {
          ...newItem,
          createdAt: serverTimestamp()
        });
        if (addNotification) {
          addNotification("Vids Community", "Bài đăng của bạn đã được cập nhật thành công lên bảng tin công đồng!", "success");
        }
        fetchData();
      } catch (err) {
        console.error("Firestore save error:", err);
        setItems(p => [newItem, ...p]);
        if (addNotification) {
          addNotification("Vids", "Không thể ghi lên máy chủ, bài đăng tạm hiển thị trên thiết bị của bạn.", "warning");
        }
      }
    }

    resetForm();
    setShowCreateModal(false);
  };

  const handleVote = async (itemId: string, optIdx: number) => {
    const updated = items.map(item => {
      if (item.id === itemId) {
        if (item.votedOption !== undefined && item.votedOption !== null) {
          return item;
        }
        const votes = [...(item.pollVotes || [])];
        votes[optIdx] = (votes[optIdx] || 0) + 1;
        return {
          ...item,
          pollVotes: votes,
          votedOption: optIdx
        };
      }
      return item;
    });

    setItems(updated);

    if (lite) {
      localStorage.setItem("vplay_vids_lite_items", JSON.stringify(updated));
    } else {
      try {
        const item = items.find(i => i.id === itemId);
        if (item && item.votedOption === undefined) {
          const docRef = doc(db, "vplay_community_vids", itemId);
          await updateDoc(docRef, {
            pollVotes: updated.find(i => i.id === itemId).pollVotes
          });
        }
      } catch (err) {
        console.error("Failed to commit vote to cloud:", err);
      }
    }

    if (addNotification) {
      addNotification("Bình chọn", "Nhận ý kiến bình chọn của bạn thành công!", "success");
    }
  };

  const handleLike = async (itemId: string) => {
    const updated = items.map(item => {
      if (item.id === itemId) {
        const alreadyLiked = item.likesVoted;
        return {
          ...item,
          likes: (item.likes || 0) + (alreadyLiked ? -1 : 1),
          likesVoted: !alreadyLiked
        };
      }
      return item;
    });
    setItems(updated);

    if (lite) {
      localStorage.setItem("vplay_vids_lite_items", JSON.stringify(updated));
    } else {
      try {
        const target = updated.find(i => i.id === itemId);
        const docRef = doc(db, "vplay_community_vids", itemId);
        await updateDoc(docRef, {
          likes: target.likes
        });
      } catch (err) {
        console.error("Cloud reaction update error:", err);
      }
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery.trim() === "" || 
      (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.content && item.content.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filter === "all") return true;
    if (filter === "media") return item.mediaUrl !== undefined;
    if (filter === "post_blog") return item.type === "post" || item.type === "blog";
    if (filter === "poll") return item.type === "poll";
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#101012] font-sans">
      {/* Vids Header */}
      <div className="px-8 py-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/40 backdrop-blur-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold tracking-tight text-white">
              {lite ? "Vids Lite" : "Vids Community"}
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${lite ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse"}`}>
              {lite ? "Offline & Private" : "Live Community"}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {lite 
              ? "Bảng tin cá nhân tiện dụng của riêng bạn. Thiết lập bài viết, blog hay file đa phương tiện dưới 1GB hoàn toàn bí mật."
              : "Khám phá các vids ngắn, câu hỏi bốc thăm bỏ phiếu, sản phẩm thiết kế và blog dài của cộng đồng vPlay toàn cầu."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (!lite && !user) {
                onLogin();
              } else {
                setShowCreateModal(true);
              }
            }}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-2xl transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            <Plus size={16} />
            Đăng bài mới
          </button>
        </div>
      </div>

      {/* Tools row (Filters & Search) */}
      <div className="px-8 py-4 border-b border-white/5 bg-[#121214]/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "Tất cả" },
            { id: "media", label: "Đa phương tiện" },
            { id: "post_blog", label: "Bài viết & Blog" },
            { id: "poll", label: "Bình chọn" }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id as any)}
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${filter === btn.id ? "bg-purple-500 text-white" : "bg-white/5 hover:bg-white/10 text-slate-300"}`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/20 border border-white/5 rounded-xl w-full sm:w-64">
          <Search size={14} className="text-slate-500" />
          <input 
            type="text"
            placeholder="Tìm kiếm bài viết..."
            className="bg-transparent border-none outline-none text-xs text-white placeholder-slate-500 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-slate-500 hover:text-white">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Main Stream list scroll area */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
            <span className="text-xs text-slate-400 font-bold">Đang tải bảng tin Vids...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-24 text-center text-slate-500 flex flex-col items-center justify-center gap-4 max-w-md mx-auto">
            <Filter size={48} className="opacity-25 text-purple-400" />
            <div>
              <span className="text-sm font-bold text-slate-300 block">Hiện tại hòm thư rỗng!</span>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Không tìm thấy bài đăng nào phù hợp với bộ lọc hoặc tìm kiếm hiện tại của bạn. Hãy tạo mới một tin tức để làm sống động bảng tin nhé.
              </p>
            </div>
            <button 
              onClick={() => {
                if (!lite && !user) onLogin();
                else setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/10"
            >
              Bắt đầu tạo bài đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 max-w-3xl mx-auto gap-6 pb-24">
            {filteredItems.map((item) => {
              const actsVoted = item.votedOption !== undefined && item.votedOption !== null;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-white/5 bg-[#161619] p-6 shadow-xl space-y-4 hover:border-white/10 transition-all flex flex-col hover:shadow-2xl hover:shadow-purple-900/5 relative group"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-black text-xs uppercase">
                        {item.userEmail ? item.userEmail.charAt(0) : "G"}
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-white block col-span-1 leading-tight mb-0.5">
                          {item.userEmail || "guest@vplay.local"}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] text-slate-400 font-semibold font-mono">
                            {new Date(item.createdAt?.seconds ? item.createdAt.seconds * 1000 : item.createdAt || '').toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        item.type === "blog" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                        item.type === "poll" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      }`}>
                        {item.type}
                      </span>
                    </div>
                  </div>

                  {item.type === "blog" ? (
                    <div className="space-y-3 cursor-pointer" onClick={() => setReadingBlog(item)}>
                      {item.coverUrl && (
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden mt-1 border border-white/5 bg-black/45">
                          <img 
                            src={item.coverUrl} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 flex flex-col justify-end">
                            <span className="text-[9px] uppercase font-black text-purple-400 tracking-widest">{item.category || "General"}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-lg text-white group-hover:text-purple-300 transition-colors leading-tight">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                          {item.content}
                        </p>
                      </div>

                      <div className="pt-2 text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-all flex items-center gap-1.5">
                        Đọc toàn bộ blog
                        <ArrowRight size={12} />
                      </div>
                    </div>
                  ) : item.type === "poll" ? (
                    <div className="space-y-4">
                      <h4 className="font-mono font-semibold text-sm text-white leading-relaxed">
                        📊 {item.title}
                      </h4>

                      <div className="space-y-2.5">
                        {item.pollOptions?.map((option: string, idx: number) => {
                          const votesList = item.pollVotes || [];
                          const totalVotes = votesList.reduce((a: number, b: number) => a + b, 0);
                          const currentOptionVotes = votesList[idx] || 0;
                          
                          const percentage = totalVotes > 0 
                            ? Math.round((currentOptionVotes / totalVotes) * 100) 
                            : 0;

                          const isThisOptionVoted = item.votedOption === idx;

                          return (
                            <button
                              key={option + idx}
                              disabled={actsVoted}
                              type="button"
                              onClick={() => handleVote(item.id, idx)}
                              className={`w-full text-left relative overflow-hidden p-3.5 rounded-2xl transition-all border ${
                                isThisOptionVoted 
                                  ? "bg-purple-500/25 border-purple-500/40 text-purple-300 ring-1 ring-purple-500/25" 
                                  : actsVoted 
                                    ? "bg-white/5 border-white/5 text-slate-400" 
                                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10 text-white"
                              }`}
                            >
                              {actsVoted && (
                                <div 
                                  className="absolute left-0 top-0 bottom-0 bg-purple-500/10 transition-all duration-1000"
                                  style={{ width: `${percentage}%` }}
                                />
                              )}
                              
                              <div className="relative flex items-center justify-between font-medium text-xs">
                                <span className="flex items-center gap-2 truncate">
                                  {isThisOptionVoted && <Check size={14} className="text-purple-400" />}
                                  {option}
                                </span>
                                {actsVoted && (
                                  <span className="font-mono font-bold text-[10px] bg-black/40 px-2 py-0.5 rounded border border-white/5 text-purple-400">
                                    {percentage}% ({currentOptionVotes} vote)
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {actsVoted && (
                        <p className="text-[10px] text-slate-500 font-medium">
                          Tổng số phiếu bầu: {item.pollVotes?.reduce((a: number, b: number) => a + b, 0) || 0} lượt. Cảm ơn bạn đã tham gia bình chọn!
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-white leading-relaxed whitespace-pre-line font-medium">
                        {item.content}
                      </p>

                      {item.mediaUrl && (
                        <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/45 mt-2 max-h-96">
                          {item.mediaType === "video" ? (
                            <video 
                              src={item.mediaUrl} 
                              controls 
                              playsInline
                              preload="metadata"
                              className="w-full h-full object-contain mx-auto max-h-96"
                            />
                          ) : (
                            <img 
                              src={item.mediaUrl} 
                              alt="Media attachment" 
                              className="w-[100%] max-h-96 object-contain pointer-events-auto block mx-auto"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-3 mt-1 border-t border-white/5 text-xs text-slate-400">
                    <button 
                      onClick={() => handleLike(item.id)}
                      className={`flex items-center gap-1.5 transition-colors p-1.5 rounded-lg ${item.likesVoted ? "text-pink-400 bg-pink-500/10" : "hover:text-pink-400 hover:bg-white/5"}`}
                    >
                      <Heart size={14} fill={item.likesVoted ? "currentColor" : "none"} />
                      <span className="font-mono text-xs font-bold">{item.likes || 0}</span>
                    </button>

                    <button 
                      onClick={() => {
                        if (navigator.clipboard) {
                          const shareText = item.type === "blog" ? `[vPlay Blog] ${item.title}` : item.content || "vPlay Vids";
                          navigator.clipboard.writeText(`${shareText}\nĐược viết bởi ${item.userEmail}`);
                          if (addNotification) addNotification("Hệ thống", "Đã sao chép liên kết chia sẻ của bài viết bài bản!", "success");
                        }
                      }}
                      className="flex items-center gap-1.5 hover:text-purple-400 transition-colors p-1.5 rounded-lg hover:bg-white/5 ml-auto"
                    >
                      <Share2 size={14} />
                      <span className="text-[10px] font-bold">Chia sẻ</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {readingBlog && (
          <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 overflow-hidden">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setReadingBlog(null)} />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-2xl bg-[#141416] border border-white/10 rounded-3xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl"
            >
              {readingBlog.coverUrl && (
                <div className="relative h-48 w-full shrink-0 border-b border-white/5">
                  <img src={readingBlog.coverUrl} className="w-full h-full object-cover" alt="Blog header" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 to-transparent flex flex-col justify-end p-6">
                    <span className="text-[9px] uppercase font-black text-purple-400 tracking-widest">{readingBlog.category || "General"}</span>
                  </div>
                </div>
              )}

              <div className="p-6 pb-2 shrink-0 border-b border-white/5 bg-black/20 flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold tracking-tight text-white leading-tight">
                    {readingBlog.title}
                  </h3>
                  <p className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                    Đăng bởi {readingBlog.userEmail || "Guest"}
                  </p>
                </div>
                <button 
                  onClick={() => setReadingBlog(null)}
                  className="p-1 px-3 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                >
                  Đóng
                </button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4 text-slate-350 text-xs font-medium leading-relaxed">
                <div className="whitespace-pre-wrap">
                  {readingBlog.content}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LiquidModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        isDark={isDark}
        title={lite ? "Đăng Vids Lite (Riêng tư)" : "Tạo bài viết Vids mới"}
        description={lite ? "Bài viết, hình ảnh, video này của bạn sẽ chỉ lưu trữ an toàn trong trình duyệt này." : "Đưa sản phẩm của bạn xuất bản công khai lên máy chủ bảng toàn cầu."}
        liquidGlass={liquidGlass}
        featureFlags={featureFlags}
      >
        <form onSubmit={handlePublish} className="space-y-5 p-1 text-left text-xs text-white">
          <div className="flex gap-2.5 p-1 bg-black/35 rounded-2xl border border-white/5">
            {[
              { id: "post", label: "Bài viết thường" },
              { id: "blog", label: "Bài viết Blog" },
              { id: "poll", label: "Bình chọn ý kiến" }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCreateType(tab.id as any)}
                className={`flex-1 py-1.5 text-center text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${createType === tab.id ? "bg-purple-600 text-white" : "text-slate-405 hover:text-white"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {createType === "blog" ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Tiêu đề Blog</label>
                <input 
                  type="text"
                  required
                  placeholder="Tiêu đề bài viết..."
                  className="w-full h-11 px-4 rounded-xl bg-black/35 border border-white/5 text-white placeholder-slate-500 outline-none focus:border-purple-500 font-bold"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Chủ đề</label>
                  <select 
                    className="w-full h-11 px-3 rounded-xl bg-black/35 border border-white/5 text-white outline-none focus:border-purple-500 font-bold"
                    value={blogCategory}
                    onChange={(e) => setBlogCategory(e.target.value)}
                  >
                    <option value="Technology">Công nghệ</option>
                    <option value="Entertainment">Giải trí</option>
                    <option value="Cộng Đồng">Cộng đồng</option>
                    <option value="Design">Thiết kế</option>
                    <option value="News">Tin tức mới</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Ảnh nền (Cover URL)</label>
                  <input 
                    type="url"
                    placeholder="https://example.com/cover.jpg"
                    className="w-full h-11 px-4 rounded-xl bg-black/35 border border-white/5 text-white placeholder-slate-500 outline-none focus:border-purple-500"
                    value={blogCoverUrl}
                    onChange={(e) => setBlogCoverUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Nội dung Blog</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Hãy viết nội dung tại đây..."
                  className="w-full p-4 rounded-xl bg-black/35 border border-white/5 text-white placeholder-slate-500 outline-none focus:border-purple-500 resize-none font-medium leading-relaxed"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            </div>
          ) : createType === "poll" ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Câu hỏi bình chọn</label>
                <input 
                  type="text"
                  required
                  placeholder="Ví dụ: Bạn thích tính năng nào của vPlay nhất?"
                  className="w-full h-11 px-4 rounded-xl bg-black/35 border border-white/5 text-white placeholder-slate-500 outline-none focus:border-purple-500 font-bold"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Các tùy lựa chọn</label>
                  {pollOptions.length < 4 && (
                    <button 
                      type="button" 
                      onClick={addPollOptionField}
                      className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      + Thêm lựa chọn
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {pollOptions.map((option, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-600 font-mono">#{idx + 1}</span>
                      <input 
                        type="text"
                        required
                        placeholder={`Lựa chọn #${idx + 1}...`}
                        className="w-full h-[40px] px-3 rounded-xl bg-black/35 border border-white/5 text-white outline-none focus:border-purple-500"
                        value={option}
                        onChange={(e) => {
                          const updated = [...pollOptions];
                          updated[idx] = e.target.value;
                          setPollOptions(updated);
                        }}
                      />
                      {pollOptions.length > 2 && (
                        <button 
                          type="button"
                          onClick={() => removePollOptionField(idx)}
                          className="p-2 hover:bg-white/5 hover:text-red-400 rounded-lg transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Nội dung chia sẻ</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Chia sẻ bài viết hoặc trạng thái mới của bạn..."
                  className="w-full p-4 rounded-xl bg-black/35 border border-white/5 text-white placeholder-slate-500 outline-none focus:border-purple-500 resize-none leading-relaxed font-semibold animate-none"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Ảnh / Video (Tải tệp dưới 1GB)</label>
                <div className="border-2 border-dashed border-white/5 rounded-2xl p-6 text-center hover:border-purple-500/30 transition-colors relative cursor-pointer group">
                  <input 
                    type="file" 
                    accept="image/*,video/*" 
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-white/5 text-purple-400 rounded-full group-hover:scale-105 transition-transform">
                      <Upload size={20} />
                    </div>
                    <p className="text-[11px] font-bold">Kéo thả hoặc Click để tải ảnh, video nhẹ dưới 1GB</p>
                    {selectedFile && (
                      <div className="mt-1 px-3 py-1 bg-purple-500/10 text-purple-300 rounded-lg text-[10px] font-mono max-w-xs truncate font-semibold border border-purple-500/15">
                        {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
            <button 
              type="button" 
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              className="px-5 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white font-bold transition-all"
            >
              Hủy
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold transition-all shadow-md active:scale-95"
            >
              {lite ? "Lưu cục bộ" : "Đăng công khai"}
            </button>
          </div>
        </form>
      </LiquidModal>
    </div>
  );
}

function AIToolsContent({ isDark, liquidGlass, featureFlags }: { isDark: boolean, liquidGlass: "glassy" | "tinted", featureFlags: any }) {
  const [activeAIApp, setActiveAIApp] = useState<string | null>(null);
  const [chatQuery, setChatQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);

  if (featureFlags?.ai_tools) {
    if (activeAIApp === "AI Chat") {
      return (
        <div className={`flex-1 flex flex-col h-full overflow-hidden relative ${isDark ? "bg-[#0a0a0b]" : "bg-white"}`}>
          <div className={`p-6 border-b flex items-center justify-between z-10 ${isDark ? "border-white/10" : "border-black/5"}`}>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveAIApp(null)} 
                className={`p-2 rounded-xl transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
              >
                <ArrowLeft className={isDark ? "text-white" : "text-slate-900"} />
              </button>
              <div className="flex items-center gap-3">
                <img src={vpilotIcon} className="w-6 h-6" alt="Do For Me" />
                <h2 className={`text-xl font-medium tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>Do For Me Chat</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-[10px] font-normal border border-purple-500/20">Native App</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <Sparkles size={48} className="text-purple-500 mb-4 animate-pulse" />
                <h3 className={`text-xl font-medium ${isDark ? "text-white" : "text-slate-900"}`}>How can I help you today?</h3>
                <p className={`text-xs max-w-xs ${isDark ? "text-white/60" : "text-slate-500"}`}>Chat with Do For Me about anything on Vplay or beyond.</p>
              </div>
            ) : (
              chatHistory.map((chat, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-4 rounded-2xl ${
                    chat.role === 'user' 
                      ? 'bg-purple-600 text-white rounded-tr-none' 
                      : `${isDark ? "bg-white/5 text-white/90 border-white/10" : "bg-black/5 text-slate-900 border-black/5"} border rounded-tl-none`
                  }`}>
                    <p className="text-sm font-normal leading-relaxed">{chat.text}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className={`p-6 backdrop-blur-3xl border-t ${isDark ? "bg-black/40 border-white/10" : "bg-white border-black/5"}`}>
            <div className="max-w-4xl mx-auto relative group flex items-center gap-3 transition-colors">
              <input 
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && chatQuery.trim()) {
                    setChatHistory([...chatHistory, { role: 'user', text: chatQuery }]);
                    const q = chatQuery;
                    setChatQuery("");
                    setTimeout(() => {
                      setChatHistory(prev => [...prev, { role: 'ai', text: `Chào mừng bạn đến với Vplay AI! Tôi đã nhận được câu hỏi: "${q}". Đây là một demo UI cho native AI Experience.` }]);
                    }, 1000);
                  }
                }}
                placeholder="Ask Do For Me anything..."
                className={`flex-1 bg-transparent border-none outline-none py-4 text-sm font-normal ${isDark ? "text-white placeholder-white/20" : "text-slate-900 placeholder-slate-400"}`}
              />
              <button 
                onClick={() => {
                  if (chatQuery.trim()) {
                    setChatHistory([...chatHistory, { role: 'user', text: chatQuery }]);
                    const q = chatQuery;
                    setChatQuery("");
                    setTimeout(() => {
                      setChatHistory(prev => [...prev, { role: 'ai', text: `Chào mừng bạn đến với Vplay AI! Tôi đã nhận được câu hỏi: "${q}". Đây là một demo UI cho native AI Experience.` }]);
                    }, 1000);
                  }
                }}
                className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all shadow-lg active:scale-95"
              >
                <ArrowRight size={20} />
              </button>
              <div className={`absolute bottom-0 left-0 h-[2px] w-full transition-all duration-300 ${isDark ? "bg-white/10" : "bg-black/5"} group-focus-within:bg-purple-500`} />
            </div>
            <p className={`text-center mt-4 text-[8px] font-normal leading-none ${isDark ? "text-white/20" : "text-slate-300"}`}>Powered by Gemini & Vplay Intelligence</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex-1 flex flex-col h-full overflow-hidden relative ${isDark ? "bg-[#0a0a0b]" : "bg-white"}`}>
        <div className={`absolute inset-0 pointer-events-none ${isDark ? "bg-gradient-to-br from-blue-500/10 via-transparent to-blue-500/10" : "bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5"}`} />
        
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center z-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-24 h-24 mb-8 p-6 rounded-3xl border shadow-2xl relative group ${isDark ? "bg-blue-500/5 border-blue-500/10" : "bg-white border-black/5"}`}
          >
            <div className="absolute -inset-4 bg-blue-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles className="w-full h-full text-blue-500 relative z-10" />
          </motion.div>
          
          <h2 className={`text-4xl font-medium mb-4 tracking-tighter leading-none ${isDark ? "text-white" : "text-slate-900"}`}>Do For Me</h2>
          <p className={`max-w-xl text-sm font-normal mb-10 leading-relaxed ${isDark ? "text-white/60" : "text-slate-500"}`}>
            Native AI experience powered by Gemini. Experience faster, more secure, and integrated intelligence across Vplay.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl px-4">
            {[
              { name: "Gemini Chat", desc: "Trò chuyện trực tiếp với Gemini 1.5 Pro", icon: <MessageSquare />, color: "from-blue-500 to-purple-500" },
              { name: "AI TV Search", desc: "Tìm kiếm kênh thông minh bằng ngôn ngữ tự nhiên", icon: <Search />, color: "from-purple-500 to-pink-500" },
              { name: "Content Pilot", desc: "Tóm tắt và gợi ý nội dung truyền hình", icon: <Sparkles />, color: "from-orange-500 to-red-500" },
              { name: "Vision Insight", desc: "Phân tích nội dung đang phát sóng", icon: <Eye />, color: "from-emerald-500 to-teal-500" }
            ].map((tool, idx) => (
              <motion.button
                key={tool.name}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setActiveAIApp(tool.name)}
                className={`p-6 rounded-3xl border transition-all text-left group relative overflow-hidden ${isDark ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-black/5 border-black/5 hover:bg-black/10"}`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity`} />
                <div className={`p-3 w-fit rounded-2xl mb-4 group-hover:scale-110 transition-transform ${isDark ? "bg-white/5" : "bg-white shadow-sm"}`}>
                  {React.cloneElement(tool.icon as any, { size: 24, className: isDark ? "text-white" : "text-slate-900" })}
                </div>
                <h3 className={`text-lg font-medium mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>{tool.name}</h3>
                <p className={`text-xs font-normal ${isDark ? "text-white/40" : "text-slate-400"}`}>{tool.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>
        
        <div className={`p-10 border-t backdrop-blur-3xl z-20 ${isDark ? "bg-black/40 border-white/5" : "bg-white border-black/5"}`}>
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <div className="flex-1 relative group flex items-center gap-3 transition-colors">
              <Sparkles size={20} className="text-purple-500" />
              <input 
                placeholder="Ask AI anything about Vplay..."
                onFocus={() => setActiveAIApp("AI Chat")}
                className={`flex-1 py-4 text-sm font-normal bg-transparent border-none outline-none ${isDark ? "text-white placeholder-white/20" : "text-slate-900 placeholder-slate-400"}`}
              />
              <button className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-500 transition-colors">
                <ArrowRight size={20} />
              </button>
              <div className={`absolute bottom-0 left-0 h-[2px] w-full transition-all duration-300 ${isDark ? "bg-white/10" : "bg-black/5"} group-focus-within:bg-purple-500`} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-black overflow-hidden relative">
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-0">
        <div className="w-20 h-20 mb-6 relative">
          <img 
            src={vpilotIcon}
            alt="Do For Me Icon"
            className="w-full h-full object-contain animate-pulse"
          />
        </div>
        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Microslop Do For Me</h2>
        <p className="text-gray-400 max-w-md text-sm font-medium mb-8 leading-relaxed">
          Microsoft chặn việc nhúng trực tiếp V-pilot vào các ứng dụng bên thứ ba vì lý do bảo mật. 
          Vui lòng nhấn nút bên dưới để bắt đầu trải nghiệm.
        </p>
        <button 
          onClick={() => window.open("https://copilot.microsoft.com", "_blank")}
          className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-2xl hover:scale-105 active:scale-95 ${
            isDark ? "bg-white text-black" : "bg-blue-600 text-white"
          }`}
        >
          Mở V-pilot (Tab mới)
        </button>
        <p className="mt-6 text-[10px] text-gray-600 uppercase font-bold tracking-[0.2em]">The Microslop Experience (TM)</p>
      </div>

      <iframe 
        src="https://copilot.microsoft.com/?isMobile=1" 
        className="w-full h-full border-none relative z-10 opacity-100"
        title="V-pilot in Vplay (preview)"
        allow="microphone; camera; clipboard-read; clipboard-write; geolocation"
      />
    </div>
  );
}

function ExperimentalContent({ 
  featureFlags, 
  setFeatureFlags, 
  isDark, 
  hideHeader = false,
  isWidgetsUpdated,
  setIsInstallingUpdate,
  addNotification
}: any) {
  const [flagSearch, setFlagSearch] = useState("");

  const experiences = PIZZA_EXPERIMENTS;

  return (
    <div className={`flex flex-col w-full ${isDark ? "text-white" : "text-slate-900"}`}>
       {!hideHeader && (
         <div className="p-8 border-b border-black/5 bg-slate-50/50 mb-6 rounded-[32px]">
            <h2 className="text-xl font-bold tracking-tight mb-1">Pizza Experiments</h2>
            <p className="text-xs font-medium text-slate-500 opacity-60">Thử nghiệm các tính năng mới nhất tại Vplay.</p>
         </div>
       )}
       
       <div className="mb-6 relative group">
         <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
         <input 
           type="text"
           placeholder="Search experiments..."
           className={`w-full pl-12 pr-6 py-3 border border-black/5 rounded-2xl text-sm font-medium outline-none transition-all ${isDark ? "bg-white/5 text-white" : "bg-white text-slate-900"}`}
           value={flagSearch}
           onChange={(e) => setFlagSearch(e.target.value)}
         />
       </div>

       <div className="space-y-8">
          {(['app', 'widgets'] as const).map(category => (
            <div key={category} className="space-y-4">
              <h3 className="px-4 text-[10px] font-black uppercase tracking-widest opacity-35 text-left">
                {category === 'app' ? "App experiment" : "Widgets feed experiment"}
              </h3>
              <div className="space-y-1">
                {PIZZA_EXPERIMENTS[category]
                  .filter(exp => exp.name.toLowerCase().includes(flagSearch.toLowerCase()))
                  .map(exp => (
                    <div key={exp.id} className={`flex items-center justify-between p-4 rounded-2xl transition-all ${isDark ? "hover:bg-white/5" : "hover:bg-slate-50"}`}>
                       <div className="flex flex-col text-left">
                          <span className="text-sm font-bold">{exp.name}</span>
                          <span className="text-[11px] opacity-50">{exp.desc}</span>
                       </div>
                       <div 
                          onClick={() => {
                            const isUpdated = isWidgetsUpdated !== undefined 
                              ? isWidgetsUpdated 
                              : (localStorage.getItem("vplay_widgets_updated_canary") === "true");
                            
                            if (exp.id === 'blur_my_feed' && !isUpdated && !featureFlags[exp.id]) {
                              if (typeof addNotification === 'function') {
                                addNotification("Update required", "Kích hoạt hiệu ứng mờ yêu cầu cập nhật Widgets Feed trước!", "warning");
                              }
                              if (typeof setIsInstallingUpdate === 'function') {
                                setIsInstallingUpdate(true);
                              }
                              return;
                            }
                            const nextVal = !featureFlags[exp.id];
                            const nextFlags = { ...featureFlags, [exp.id]: nextVal };
                            setFeatureFlags(nextFlags, exp.id, exp.name, nextVal);
                          }}
                          className={`w-11 h-6 rounded-full transition-colors relative p-1 cursor-pointer shrink-0 ${featureFlags[exp.id] ? "bg-blue-600" : "bg-slate-300"}`}
                       >
                          <motion.div 
                            className="w-4 h-4 bg-white rounded-full shadow-sm"
                            animate={{ x: featureFlags[exp.id] ? 20 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                       </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
       </div>
    </div>
  );
}

function CaptureForMeContent() {
  const [source, setSource] = useState<"screen" | "tv">("screen");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startStream = async () => {
    try {
      let s: MediaStream;
      if (source === "screen") {
        s = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false
        } as any);
      } else {
        const videoElement = document.querySelector('video');
        if (!videoElement) {
          alert("No active video player found to capture.");
          return;
        }
        // @ts-ignore
        s = videoElement.captureStream ? videoElement.captureStream() : (videoElement as any).mozCaptureStream ? (videoElement as any).mozCaptureStream() : null;
        if (!s) {
          alert("Your browser does not support capturing from a video element.");
          return;
        }
      }
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      console.error("Error accessing display media", err);
    }
  };

  const takeScreenshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      setCapturedImage(dataUrl);
    }
  };

  const downloadScreenshot = () => {
    if (!capturedImage) return;
    const a = document.createElement('a');
    a.href = capturedImage;
    a.download = `Capture_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-900 font-sans">
      <div className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight">Capture For Me</h1>
          </div>

          <div className="space-y-8">
            <div className="flex justify-center gap-4 mb-4">
              <button 
                onClick={() => { setSource("screen"); if(stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); } }}
                className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${source === "screen" ? "bg-blue-600 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-100"}`}
              >
                Whole Screen
              </button>
              <button 
                onClick={() => { setSource("tv"); if(stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); } }}
                className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${source === "tv" ? "bg-blue-600 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-100"}`}
              >
                TV Player Only
              </button>
            </div>

            <div className="aspect-video w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative border-4 border-white">
              <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
              {!stream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm pointer-events-none">
                   <Camera size={48} className="text-white/20 mb-4" />
                   <p className="text-white font-bold text-lg">Ready to capture {source === 'tv' ? 'TV Channel' : 'Screen'}</p>
                   <p className="text-white/60 text-sm">Click "Enable Capture" to see preview</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4">
              {!stream ? (
                <button 
                  onClick={startStream}
                  className="px-10 py-5 bg-blue-600 text-white rounded-full font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/20 active:scale-95"
                >
                  Enable Capture
                </button>
              ) : (
                <button 
                  onClick={takeScreenshot}
                  className="px-10 py-5 bg-purple-600 text-white rounded-full font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-2xl shadow-purple-500/20 flex items-center gap-3 active:scale-95"
                >
                  <Camera size={18} fill="white" />
                  Capture Screenshot
                </button>
              )}
            </div>

            {capturedImage && (
              <div className="mt-8 p-6 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-4">
                <h3 className="font-bold text-lg">Last Capture</h3>
                <div className="relative group">
                  <img src={capturedImage} className="w-full rounded-xl border border-slate-100" />
                </div>
                <button 
                  onClick={downloadScreenshot}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download PNG
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminContent({ isDark, liquidGlass }: { isDark: boolean, liquidGlass: "glassy" | "tinted" }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const usersData = snapshot.docs.map(doc => doc.data());
        setUsers(usersData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Lỗi: {error}</div>;

  const filteredUsers = users.filter(u => u.email !== "sonhuyc2kl@gmail.com");

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h2 className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}>Quản trị</h2>
      <div className={`rounded-xl border overflow-x-auto ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-white"}`}>
        <table className="w-full text-left min-w-[600px]">
          <thead className={`border-b ${isDark ? "border-slate-800 bg-slate-800/50 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
            <tr>
              <th className="p-4 font-medium">Người dùng</th>
              <th className="p-4 font-medium">Ngày tạo</th>
              <th className="p-4 font-medium">Đã xem</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? "divide-slate-800 text-slate-300" : "divide-slate-200 text-slate-700"}`}>
            {filteredUsers.map(u => (
              <tr key={u.uid}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {u.photoURL ? <img src={u.photoURL} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center"><User className="w-4 h-4 text-slate-600" /></div>}
                    <div className="flex flex-col">
                      <span className="font-medium">{u.displayName || "Chưa có tên"}</span>
                      <span className="text-xs opacity-50">{u.email}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4">{u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : ""}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {u.watchedChannels && u.watchedChannels.length > 0 ? (
                      u.watchedChannels.map((chName: string) => (
                        <span key={chName} className={`px-2 py-0.5 rounded-full text-[10px] ${isDark ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-700"}`}>
                          {chName}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs opacity-30 font-medium">Chưa xem kênh nào</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-slate-500">Chưa có người dùng nào khác.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function UpdateLogsContent({ isDark, onBack, featureFlags }: { isDark: boolean, onBack: () => void, featureFlags?: any }) {
  const [isLoading, setIsLoading] = useState(true);
  const [logSearchQuery, setLogSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
        <LoadingAnimation featureFlags={featureFlags} isDark={isDark} className="w-12 h-12" />
        <span className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${isDark ? "text-white/40" : "text-slate-400"}`}>
          Đang tải dữ liệu...
        </span>
      </div>
    );
  }

  const logs = [
    {
      id: 'canary-codename-c-nx626-04',
      version: 'Vplay Canary - Build Codename (C) Nx626.04',
      tag: '🚀',
      type: 'Bản cập nhật SMR26 Update 4',
      sections: [
        {
          title: '✨ OOBE EXPERIENCE',
          items: [
            'Thêm giai đoạn "Almost there" sau khi thiết lập xong',
            'Tối ưu hóa thời gian chờ loading OOBE',
            'Fix các lỗi UI nhỏ trong màn hình thiết lập'
          ],
          color: 'text-blue-400'
        },
        {
          title: '🛠️ SYSTEM STABILITY',
          items: [
            'Cập nhật mã phiên bản hệ thống lên Codename (C) Nx626.04',
            'Cải thiện hiệu năng render các thành phần XAML'
          ],
          color: 'text-green-400'
        }
      ]
    },
    {
      id: 'canary-codename-c-nx626-03',
      version: 'Vplay Canary - Build Codename (C) Nx626.03',
      tag: '🔥',
      type: 'Bản cập nhật Trải nghiệm người dùng',
      sections: [
        {
          title: '✨ SPLASH SCREEN REDESIGN',
          items: [
            'Splash screen sử dụng nền tím nghệ thuật mới',
            'Thêm thanh phần trăm tiến độ tải hệ thống',
            'Bypass Splash: Nút bỏ qua splash screen tích hợp bảo mật (Pass: sus)',
            'Giao diện Update khẩn cấp 1 phút với nút Bypass sau 10s'
          ],
          color: 'text-purple-400'
        },
        {
          title: '💻 VPLAY OS OPTIMIZATION',
          items: [
            'Fix lỗi màn hình trắng tinh khi mở các ứng dụng cửa sổ',
            'Đồng bộ hóa hình nền Desktop với chủ đề Splash Screen',
            'Loại bỏ nền xanh cũ của Start Icon, tối ưu độ trong suốt',
            'Tối ưu hóa các tiến trình chuyển đổi giao diện Windows Mode'
          ],
          color: 'text-blue-400'
        }
      ]
    },
    {
      id: 'canary-codename-c-nx626-01',
      version: 'Vplay Canary - Build Codename (C) Nx626.01',
      tag: '🚀',
      type: 'Phiên bản VplayOS đầu tiên',
      sections: [
        {
          title: '🆕 GIAO DIỆN VPLAYOS',
          items: [
            'Ra mắt tính năng VplayOS (Windows Mode) cho Canary build',
            'Hệ thống cập nhật Canary Resource (Vplay Canary Update)',
            'Tích hợp Taskbar, Start Menu và hệ thống quản lý Window'
          ],
          color: 'text-green-500'
        }
      ]
    },
    {
      id: 'canary-codename-c-nx626',
      version: 'Vplay Canary - Build Codename (C) Nx626',
      tag: '🐦',
      type: 'Phiên bản thử nghiệm sớm',
      content: 'Bản build chỉ mới được để cập thông qua Github'
    },
    {
      id: 'dev-26470',
      version: 'Vplay Canary - Build SMR26',
      tag: '🐦',
      type: 'Phiên bản Canary',
      sections: [
        {
          title: '🎨 USER INTERFACE - SYSTEM FAILURE',
          items: [
            'Cập nhật version thành SMR26 Canary / Status thành CAN / DEV thành CAN',
            'Kích hoạt UI Lỗi / Experimental UI Chaos',
            'Tính năng Cộng đồng Vids (beta): Cho phép upload video từ user'
          ],
          color: 'text-red-500'
        },
        {
          title: '🚩 FEATURES FLAG',
          items: [
            'Thêm flag "Vids" (vids_for_uploads): Kích hoạt tính năng upload video cho mọi người'
          ],
          color: 'text-amber-500'
        }
      ]
    }
  ];

  const filteredLogs = logs.filter(log => 
    log.version.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
    log.type.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
    (log as any).sections?.some((s: any) => s.items.some((i: any) => i.toLowerCase().includes(logSearchQuery.toLowerCase()))) ||
    ((log as any).content && (log as any).content.toLowerCase().includes(logSearchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-12 max-w-4xl mx-auto w-full pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className={`p-2 rounded-xl transition-all ${isDark ? "bg-white/5 hover:bg-white/10 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-900"}`}
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className={`text-3xl font-semibold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>Update Logs</h2>
        </div>

          <div className={`relative group min-w-[240px] rounded-full overflow-hidden ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-white/20" : "text-slate-400"} group-focus-within:text-purple-500 transition-colors`} size={14} />
            <input 
              value={logSearchQuery}
              onChange={e => setLogSearchQuery(e.target.value)}
              placeholder="Tìm kiếm phiên bản..."
              className={`w-full pl-9 pr-4 py-2.5 text-xs bg-transparent focus:outline-none transition-all ${
                isDark ? "text-white placeholder-white/20" : "text-slate-900 placeholder-slate-400"
              }`}
            />
            <div className={`absolute bottom-0 left-0 h-[2.5px] w-full transition-all duration-300 ${isDark ? "bg-white/10" : "bg-slate-200"} group-focus-within:bg-purple-500 group-focus-within:shadow-[0_0_8px_rgba(168,85,247,0.4)]`} />
          </div>
      </div>

      <div className="space-y-16">
        {filteredLogs.length > 0 ? filteredLogs.map((log) => (
          <section key={log.id} className="space-y-6">
            <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-2xl ${log.id.includes('dev') ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'} flex items-center justify-center`}>
                 <span className="text-xl">{log.tag}</span>
               </div>
               <div>
                 <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{log.version}</h3>
                 <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">{log.type}</p>
               </div>
            </div>
            
            {(log as any).sections ? (
              <div className={`p-6 md:p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"} space-y-8`}>
                {(log as any).sections.map((section: any, idx: number) => (
                  <div key={idx} className="space-y-4">
                    <h4 className={`text-xs font-black ${section.color} uppercase tracking-[0.2em]`}>{section.title}</h4>
                    <ul className={`text-sm space-y-3 ${isDark ? "text-slate-300" : "text-slate-600"} font-medium`}>
                      {section.items.map((item, iIdx) => (
                        <li key={iIdx} className="flex gap-2">
                          <span className={`mt-1.5 h-1 w-1 rounded-full bg-current shrink-0 ${section.color}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-6 md:p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"} font-medium`}>
                  {(log as any).content}
                </p>
              </div>
            )}
          </section>
        )) : (
          <div className="p-12 text-center text-slate-500 text-[10px] font-semibold uppercase tracking-[0.3em]">
            Không tìm thấy phiên bản phù hợp
          </div>
        )}

        {/* Phân chia kênh BETA */}
        {logSearchQuery === "" && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-1">
               <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${isDark ? "text-white/40" : "text-slate-400"}`}>PHÂN CHIA KÊNH BETA MỚI</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-6 rounded-3xl border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-100 shadow-sm"} space-y-3`}>
                <div className="flex items-center gap-2 text-green-500">
                  <div className="w-2 h-2 rounded-full bg-current" />
                  <span className="text-xs font-bold uppercase tracking-widest">Vplay Dev</span>
                </div>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"} leading-relaxed font-medium`}>
                  Thử nghiệm, vẫn khá lỗi nhưng giảm đáng kể và tính năng hoàn thiện hơn so với Canary. Được cập nhật thường xuyên, các tính năng Canary đã ổn định và sẵn sàng sẽ được đưa vào dưới Feature Flag. Số build thấp hơn Canary
                </p>
              </div>
              <div className={`p-6 rounded-3xl border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-100 shadow-sm"} space-y-3`}>
                <div className="flex items-center gap-2 text-yellow-500">
                  <div className="w-2 h-2 rounded-full bg-current" />
                  <span className="text-xs font-bold uppercase tracking-widest">Vplay Canary</span>
                </div>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"} leading-relaxed font-medium`}>
                  Thử nghiệm, nhiều lỗi và các thứ lặt vặt, tính năng test sơ sài, có thể hỏng hoặc crash. Không được cập nhật thường xuyên, chỉ sử dụng cho mục đích test. Số build cao hơn Dev
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function MusicSettingsContent({
  isDark,
  backgroundMusicOption,
  setBackgroundMusicOption,
}: {
  isDark: boolean;
  backgroundMusicOption: string;
  setBackgroundMusicOption: (val: string) => void;
}) {
   return (
     <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-10 max-w-5xl mx-auto w-full pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/5 p-8 rounded-[40px] border border-white/10"
        >
           <div className="flex items-center gap-6">
              <div className="p-4 rounded-3xl bg-purple-500/10 text-purple-500 shadow-xl shadow-purple-500/10">
                <Music size={32} />
              </div>
              <div>
                <h2 className={`text-4xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>Âm nhạc</h2>
                <p className={`text-sm mt-1 font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Enable or disable the system background track</p>
              </div>
           </div>
           <button 
             onClick={() => setBackgroundMusicOption(backgroundMusicOption === 'off' ? 'on' : 'off')}
             className={`px-12 py-4 rounded-2xl font-black transition-all text-sm uppercase tracking-[0.2em] shadow-xl ${backgroundMusicOption === 'off' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
           >
             {backgroundMusicOption === 'off' ? 'Bật âm nhạc' : 'Tắt âm nhạc'}
           </button>
        </motion.div>

        <div className={`p-8 rounded-[40px] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} flex flex-col gap-4`}>
          <h3 className="font-bold uppercase text-[10px] tracking-widest opacity-40">Now Playing</h3>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-2xl">
              <Play className="text-purple-500" size={20} fill="currentColor" />
            </div>
            <div>
              <p className="font-black text-lg">System Background Music</p>
              <p className="text-xs opacity-50 uppercase font-bold tracking-wider">Vplay Media Player</p>
            </div>
          </div>
        </div>
    </div>
   );
}

const BroadcastExperimentalView = ({ onContinue, onSwitchToRelease }: { onContinue: () => void, onSwitchToRelease: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120000] bg-[#004275] text-white flex flex-col font-sans overflow-hidden"
    >
      <div className="h-16 w-full flex items-center justify-between px-6 md:px-8 bg-black/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
            <Sparkles size={14} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Vplay Canary Status</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl space-y-8 md:space-y-12"
        >
          <div className="space-y-4 md:space-y-6">
            <h1 className="text-4xl md:text-7xl font-light tracking-tight leading-tight">Vplay Canary chỉ để phục vụ thử nghiệm!</h1>
            <p className="text-base md:text-2xl text-white/70 font-light max-w-3xl mx-auto leading-relaxed">
              Vplay Canary chỉ để phục vụ thử nghiệm giao diện. Để xem được các kênh truyền hình, vui lòng chuyển đổi sang các phiên bản ổn định hơn của Vplay như Dev hoặc khuyến nghị hơn là phiên bản Release chính thức
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 pt-4 md:pt-8 w-full max-w-lg mx-auto">
            <button 
              onClick={onSwitchToRelease}
              className="w-full sm:flex-1 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 transition-all font-normal rounded-[4px] text-sm"
            >
              Chuyển sang Vplay Release
            </button>
            <button 
              onClick={onContinue}
              className="w-full sm:flex-1 px-8 py-4 bg-white text-[#004275] hover:bg-white/90 transition-all font-bold rounded-[4px] text-sm shadow-2xl active:scale-95"
            >
              Tiếp tục thử nghiệm
            </button>
          </div>
          
          <div className="pt-4 md:pt-8">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Cảm ơn bạn đã đồng hành cùng Vplay Canary</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const OOBEView = ({ isDark, onContinue, featureFlags, setFeatureFlags, forcedInfo }: { 
  key?: string,
  isDark: boolean, 
  onContinue: () => void, 
  featureFlags: any, 
  setFeatureFlags: (f: any) => void,
  forcedInfo?: any
}) => {
  const [phase, setPhase] = useState<"initial_loading" | "experiments" | "final_loading_1" | "final_loading_2" | "forced_info" | "almost_there">(forcedInfo ? "forced_info" : "experiments");

  return (
    <div className="fixed inset-0 z-[100005] bg-black/70 backdrop-blur-md flex items-center justify-center select-none overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      <button 
        onClick={onContinue}
        className="absolute top-6 right-6 p-2 text-white/55 hover:text-white transition-colors z-[100010]"
      >
        <X size={24} />
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ type: "spring", damping: 25, stiffness: 180 }}
        className="w-full bg-[#1e0a5c] text-white py-10 md:py-14 px-6 md:px-24 border-t border-b border-white/10 shadow-2xl relative max-h-[95vh] overflow-y-auto custom-scrollbar"
      >
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 md:gap-8 text-left font-light leading-relaxed">
          <AnimatePresence mode="wait">
             {phase === "forced_info" ? (
                <motion.div
                  key="forced_info"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="space-y-6"
                >
                  <div className="max-w-2xl space-y-4">
                     <h2 className="text-4xl md:text-5xl font-light tracking-wide leading-tight text-white mb-2">
                        {forcedInfo?.title || "Cấu hình OOBE"}
                     </h2>
                     <p className="text-white/80 text-base md:text-lg font-light leading-relaxed">
                        {forcedInfo?.subtitle || "Chào mừng bạn đến với chương trình thử nghiệm của Vplay Canary."}
                     </p>
                     <p className="text-white/60 text-sm font-light leading-relaxed">
                        Chương trình bao gồm các thiết lập cho tính năng mới của Vplay, cho phép bạn tùy chỉnh các cờ thử nghiệm và tối ưu hóa dashboard widgets ngay từ lần khởi động đầu tiên.
                     </p>
                  </div>
                  <div className="pt-4 flex gap-4">
                     <button
                       onClick={() => setPhase("experiments")}
                       className="px-8 py-3.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold transition-all disabled:opacity-50 active:scale-95 text-sm"
                     >
                       Thiết lập tính năng
                     </button>
                     <button
                       onClick={onContinue}
                       className="px-8 py-3.5 border border-white/20 text-white/80 hover:bg-white/5 hover:text-white rounded-xl font-medium transition-all active:scale-95 text-sm"
                     >
                       Bỏ qua
                     </button>
                  </div>
                </motion.div>
             ) : phase === "experiments" ? (
                <motion.div
                  key="experiments"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="space-y-6 w-full"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
                           <Flask size={18} />
                        </div>
                        <span className="text-sm font-light text-white/90">Kích hoạt tính năng thử nghiệm</span>
                     </div>
                     <span className="text-xs font-mono opacity-60 tracking-wider">Chọn các tính năng để tiếp tục</span>
                  </div>

                  <div className="max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                        {(['app', 'widgets'] as const).map(category => (
                          <Fragment key={category}>
                            <div className="col-span-full pt-4 pb-1">
                              <h3 className="text-xs uppercase tracking-widest text-white/55 border-b border-white/5 pb-2">
                                {category === 'app' ? "Hệ thống / App Features" : "Widgets Board / Dashboard Features"}
                              </h3>
                            </div>
                            {PIZZA_EXPERIMENTS[category].map(exp => (
                              <button 
                                  key={exp.id}
                                  onClick={() => {
                                    const newFlags = { ...featureFlags, [exp.id]: !featureFlags[exp.id] };
                                    setFeatureFlags(newFlags);
                                    localStorage.setItem("vplay_feature_flags", JSON.stringify(newFlags));
                                  }}
                                  className={`p-5 rounded-xl border transition-all text-left flex flex-col gap-2 group ${
                                      featureFlags[exp.id] 
                                        ? "bg-white text-slate-900 border-white shadow-lg shadow-white/10" 
                                        : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                                  }`}
                              >
                                  <div className="flex items-center justify-between pointer-events-none">
                                      <span className={`text-[9px] font-bold uppercase tracking-widest ${featureFlags[exp.id] ? "text-slate-800" : "text-white/40"}`}>Experimental</span>
                                      <div className={`w-8 h-4 rounded-full relative transition-colors ${featureFlags[exp.id] ? "bg-slate-200" : "bg-white/10"}`}>
                                        <motion.div 
                                            animate={{ x: featureFlags[exp.id] ? 16 : 3 }}
                                            className={`absolute top-0.5 w-3 h-3 rounded-full ${featureFlags[exp.id] ? "bg-slate-900" : "bg-white"} shadow`}
                                        />
                                      </div>
                                  </div>
                                  <h4 className="text-sm font-semibold tracking-tight leading-snug">{exp.name}</h4>
                                  <p className={`text-[11px] leading-relaxed line-clamp-2 ${featureFlags[exp.id] ? "text-slate-700 font-normal" : "text-white/50 font-light"}`}>{exp.desc}</p>
                              </button>
                            ))}
                          </Fragment>
                        ))}
                     </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                     <span className="text-[11px] text-white/50 font-light">Cấu hình có thể thay đổi sau này trong Cài đặt.</span>
                     <div className="flex gap-4">
                        <button 
                           onClick={() => {
                             localStorage.setItem("vplay_seen_oobe", "true");
                             window.location.reload();
                           }}
                           className="text-white/60 hover:text-white transition-colors text-xs font-light px-4 py-2 hover:underline"
                        >
                           Skip Setup
                        </button>
                        <button 
                           onClick={() => {
                             localStorage.setItem("vplay_seen_oobe", "true");
                             window.location.reload();
                           }}
                           className="px-8 py-2.5 bg-white text-slate-900 font-bold hover:bg-slate-100 transition-all rounded-xl text-xs active:scale-95"
                        >
                           Hoàn tất
                        </button>
                     </div>
                  </div>
                </motion.div>
             ) : phase === "final_loading_1" || phase === "final_loading_2" || phase === "almost_there" ? (
                <motion.div 
                  key="loading_final"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center space-y-6 py-6"
                >
                   <div className="relative">
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/3/3f/Windows-loading-cargando.gif" 
                        alt="Loading" 
                        className="w-10 h-10 filter brightness-200 opacity-60"
                        referrerPolicy="no-referrer"
                      />
                   </div>
                   <p className="text-2xl font-light tracking-tight text-white/80 animate-pulse">
                      {phase === "final_loading_1" ? "Just a moment..." : "Getting your experience ready..."}
                   </p>
                </motion.div>
             ) : (
                <div className="hidden" />
             )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

function VVerContent({ isDark, onUpdateLogsClick, liquidGlass }: { isDark: boolean, onUpdateLogsClick: () => void, liquidGlass: any }) {
  return (
    <div className={`p-8 rounded-[40px] border flex flex-col transition-all w-full ${isDark ? "border-white/5 bg-white/5" : "border-black/5 bg-white shadow-xl shadow-slate-200/50"} ${liquidGlass ? "backdrop-blur-xl" : ""}`}>
      <div className="flex flex-col items-center justify-center text-center gap-4 mb-8">
        <div className="flex items-center justify-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
            <Info size={20} />
          </div>
          <h3 className={`font-semibold text-2xl tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>V-ver</h3>
        </div>
        <img 
          src={vplayLogo} 
          alt="Vplay Logo" 
          className="h-32 w-auto object-contain drop-shadow-2xl"
          referrerPolicy="no-referrer"
        />
        <div className="flex flex-col items-center gap-2">
          <p className="text-4xl font-semibold tracking-tighter bg-gradient-to-r from-purple-500 via-pink-400 to-amber-400 bg-clip-text text-transparent uppercase">
            Summer 2026 Update
          </p>
          <div className="h-1.5 w-32 bg-gradient-to-r from-purple-500 via-pink-500 to-transparent rounded-full" />
        </div>
      </div>
      
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-6 rounded-[32px] border flex flex-col items-center gap-2 ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200 shadow-sm"}`}>
            <span className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${isDark ? "text-white" : "text-slate-900"}`}>Version</span>
            <span className={`text-xl font-mono font-black ${isDark ? "text-green-400" : "text-green-600"}`}>SMR26 Canary</span>
          </div>
          <div className={`p-6 rounded-[32px] border flex flex-col items-center gap-2 ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200 shadow-sm"}`}>
            <span className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${isDark ? "text-white" : "text-slate-900"}`}>Build</span>
            <span className={`text-xl font-mono font-black ${isDark ? "text-yellow-400" : "text-yellow-600"}`}>SMR26-CAN</span>
          </div>
          <div className={`p-6 rounded-[32px] border flex flex-col items-center gap-2 ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200 shadow-sm"}`}>
            <span className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${isDark ? "text-white" : "text-slate-900"}`}>Status</span>
            <span className={`text-xl font-mono font-black ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>CAN</span>
          </div>
        </div>

        <button 
          onClick={onUpdateLogsClick}
          className="w-full py-4 rounded-3xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-600/20 active:scale-95"
        >
          <Clock size={18} />
          UPDATE LOGS
        </button>
      </div>
    </div>
  );
}

function ManageAccountContent({ 
  isDark, 
  user, 
  userData, 
  setUserData, 
  onLogin, 
  onAlert, 
  liquidGlass 
}: { 
  isDark: boolean, 
  user: FirebaseUser | null, 
  userData: any, 
  setUserData: any, 
  onLogin: () => void, 
  onAlert: (t: string, m: string) => void, 
  liquidGlass: any 
}) {
  const [name, setName] = useState(userData?.displayName || user?.displayName || "");
  const [avatar, setAvatar] = useState(userData?.photoURL || user?.photoURL || "");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(userData?.displayName || user?.displayName || "");
    setAvatar(userData?.photoURL || user?.photoURL || "");
  }, [user, userData]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          setAvatar(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const isDataUrl = avatar.startsWith('data:');
      const profileUpdates: any = { displayName: name };
      if (!isDataUrl) {
        profileUpdates.photoURL = avatar;
      }
      await updateProfile(user, profileUpdates);
      
      await setDoc(doc(db, "users", user.uid), {
        displayName: name,
        photoURL: avatar
      }, { merge: true });
      
      setUserData({ ...userData, displayName: name, photoURL: avatar });
      onAlert("Thành công", "Đã cập nhật hồ sơ của bạn!");
    } catch (e: any) {
      console.error(e);
      onAlert("Lỗi", "Không thể cập nhật hồ sơ: " + e.message);
    }
    setSaving(false);
  };

  return (
    <div className={`p-6 rounded-3xl border flex flex-col ${isDark ? "border-white/5 bg-white/5" : "border-black/5 bg-white"} ${liquidGlass ? "backdrop-blur-xl" : ""}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-purple-500/20 text-purple-500">
          <User size={20} />
        </div>
        <h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>Manage account</h3>
      </div>

      {!user ? (
        <div className="flex flex-col items-center justify-center text-center gap-4 py-8">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"}`}>
            <User className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500 font-medium">Đăng nhập để đồng bộ dữ liệu</p>
          <button 
            onClick={onLogin}
            className="w-full max-w-xs py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl transition-all shadow-lg text-sm"
          >
            Đăng nhập ngay
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div className="relative group cursor-pointer self-center" onClick={() => fileInputRef.current?.click()}>
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-purple-500/30 shadow-2xl" />
              ) : (
                <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"}`}>
                  <User className="w-12 h-12 text-slate-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <Camera className="text-white w-6 h-6" />
                <span className="text-[8px] text-white font-bold uppercase mt-1">Change</span>
              </div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-30 ml-1">Tên hiển thị</label>
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Tên của bạn..."
                  className={`w-full px-5 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all rounded-2xl ${
                    isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`} 
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl disabled:opacity-50 transition-all text-sm shadow-xl shadow-purple-600/20"
                >
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                <button 
                  onClick={() => signOut(auth)}
                  className={`p-3 rounded-2xl border transition-all ${isDark ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-red-50 border-red-200 text-red-600"}`}
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackContent({ isDark, liquidGlass }: { isDark: boolean, liquidGlass: any }) {
  return (
    <div className={`p-6 rounded-3xl border flex flex-col justify-between ${isDark ? "border-white/5 bg-white/5" : "border-black/5 bg-white"} ${liquidGlass ? "backdrop-blur-xl" : ""}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-500/20 text-slate-400">
              <Info size={20} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>Give Feedback</h3>
              <p className="text-[10px] opacity-50 font-mono">vDev.26415</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="px-2 py-0.5 rounded bg-yellow-400 text-[10px] font-black text-black">PREVIEW</div>
            <p className="text-[8px] opacity-40 font-bold uppercase tracking-tighter">OTA System</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className={`text-xs font-bold uppercase tracking-widest opacity-40 ${isDark ? "text-white" : "text-slate-900"}`}>Ủng hộ chúng tôi</p>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map(num => (
              <a 
                key={num}
                href={`https://www.youtube.com/@ota${num === 1 ? 'one' : num === 2 ? 'two' : num === 3 ? 'three' : 'four'}fr253`} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex items-center gap-2 p-2 rounded-xl border text-[10px] font-bold transition-all ${
                  isDark ? "bg-white/5 border-white/5 hover:bg-white/10 text-slate-300" : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white">
                  <Play size={8} fill="currentColor" />
                </div>
                Youtube #{num}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 space-y-4">
        <div className={`p-3 rounded-xl border ${isDark ? "bg-red-500/5 border-red-500/10" : "bg-red-50 border-red-100"}`}>
          <p className="text-[10px] font-bold text-red-500 mb-1 uppercase tracking-wider">Firebase Debug</p>
          <p className="text-[9px] opacity-70 mb-2">Nếu đăng nhập không hoạt động, hãy đảm bảo bạn đã bật "Email/Password" và "Google" trong Firebase Console.</p>
          <a 
            href={`https://console.firebase.google.com/project/${auth.app.options.projectId}/authentication/providers`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-bold text-purple-500 hover:underline flex items-center gap-1"
          >
            Mở Firebase Console <ExternalLink size={8} />
          </a>
        </div>
      </div>
    </div>
  );
}

function SettingsContent({ 
  isDark, 
  setIsDark, 
  vconnectIsDark = true,
  setVconnectIsDark,
  isDev, 
  setIsDev, 
  featureFlags,
  setFeatureFlags,
  liquidGlass, 
  setLiquidGlass,
  useSidebar,
  setUseSidebar,
  isSidebarRight,
  setIsSidebarRight,
  isPinningEnabled,
  setIsPinningEnabled,
  user,
  userData,
  setUserData,
  onAlert,
  onLogin,
  onUpdateLogsClick,
  favorites,
  backgroundMusicOption,
  setBackgroundMusicOption,
  customMusicId,
  setCustomMusicId,
  searchBoxPosition,
  setSearchBoxPosition,
  sidebarStyle,
  setSidebarStyle,
  setActiveTab,
  wallpaperType,
  setWallpaperType,
  solidColor,
  setSolidColor,
  gradientColors,
  setGradientColors,
  desktopWallpaper,
  setDesktopWallpaper,
  forcedFont,
  setForcedFont,
  onEraseClick
}: { 
  isDark: boolean, 
  setIsDark: (val: boolean) => void, 
  vconnectIsDark?: boolean,
  setVconnectIsDark?: (val: boolean) => void,
  isDev: boolean, 
  setIsDev: (val: boolean) => void,
  featureFlags: { [key: string]: any },
  setFeatureFlags: (val: { [key: string]: any } | ((prev: { [key: string]: any }) => { [key: string]: any })) => void,
  liquidGlass: "glassy" | "tinted",
  setLiquidGlass: (val: "glassy" | "tinted") => void,
  useSidebar: boolean,
  setUseSidebar: (val: boolean) => void,
  isSidebarRight: boolean,
  setIsSidebarRight: (val: boolean) => void,
  isPinningEnabled: boolean,
  setIsPinningEnabled: (val: boolean) => void,
  user: FirebaseUser | null,
  userData: any,
  setUserData: any,
  onAlert: (title: string, msg: string) => void,
  onLogin: () => void,
  onUpdateLogsClick: () => void,
  favorites: string[],
  backgroundMusicOption: string,
  setBackgroundMusicOption: (val: string) => void,
  customMusicId: string,
  setCustomMusicId: (val: string) => void,
  searchBoxPosition: string,
  setSearchBoxPosition: (val: string) => void,
  sidebarStyle: "float" | "attach",
  setSidebarStyle: (val: "float" | "attach") => void,
  setActiveTab: (val: string) => void,
  wallpaperType: "preset" | "solid" | "gradient",
  setWallpaperType: (val: "preset" | "solid" | "gradient") => void,
  solidColor: string,
  setSolidColor: (val: string) => void,
  gradientColors: [string, string],
  setGradientColors: (val: [string, string]) => void,
  desktopWallpaper: string,
  setDesktopWallpaper: (val: string) => void,
  forcedFont: string,
  setForcedFont: (val: string) => void,
  onEraseClick?: () => void
}) {
  const [saving, setSaving] = useState(false);
  const [flagSearch, setFlagSearch] = useState("");

  const [vProfileName, setVProfileName] = useState(() => localStorage.getItem("vplay_vconnect_p_name") || "Khách Danh Tính");
  const [vProfileBio, setVProfileBio] = useState(() => localStorage.getItem("vplay_vconnect_p_bio") || "Bận chơi game rồi | vPlay-er chính hiệu!");
  const [vProfileLocation, setVProfileLocation] = useState(() => localStorage.getItem("vplay_vconnect_p_location") || "vPlay OS, Việt Nam");
  const [vProfileAvatar, setVProfileAvatar] = useState(() => localStorage.getItem("vplay_vconnect_p_avatar") || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80");
  const [vProfileCover, setVProfileCover] = useState(() => localStorage.getItem("vplay_vconnect_p_cover") || "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&h=300&w=600&q=80");

  const toggleFlag = (id: string) => {
    setFeatureFlags(prev => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("vplay_feature_flags", JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pb-32 space-y-8">
      <div className="flex flex-col lg:flex-row gap-8 items-stretch lg:items-start opacity-30 grayscale pointer-events-none">
        <p className="p-12 text-center w-full font-bold italic opacity-40">Một số mục cài đặt đã được chuyển vào Menu người dùng trên Top Bar.</p>
      </div>

      {/* Developer Mode */}
      <div className={`p-8 rounded-[40px] border flex flex-col transition-all w-full ${isDark ? "border-white/5 bg-white/5" : "border-black/5 bg-white shadow-xl shadow-slate-200/50"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isDev ? "bg-rose-500/10 text-rose-500" : "bg-slate-500/10 text-slate-500"}`}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className={`font-semibold text-xl tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>Developer Mode</h3>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-0.5">Kích hoạt chế độ nhà phát triển và hiển thị menu 'Dev'</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => {
              const nextVal = !isDev;
              setIsDev(nextVal);
              localStorage.setItem("vplay_dev_mode", nextVal.toString());
              if (onAlert) {
                onAlert(
                  "Developer Mode", 
                  nextVal ? "Chế độ nhà phát triển đã được KÍCH HOẠT. Hãy kiểm tra thanh bên Board tiện ích." : "Chế độ nhà phát triển đã bị vô hiệu hóa."
                );
              }
            }}
            className={`w-12 h-6 rounded-full relative p-1 transition-colors ${isDev ? "bg-rose-600" : "bg-slate-400"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-all shadow-sm ${isDev ? "translate-x-6" : "translate-x-0"}`} />
          </button>
        </div>
      </div>

      {/* Change Background Wallpaper */}
      <div className={`p-8 rounded-[40px] border flex flex-col transition-all w-full ${isDark ? "border-white/5 bg-white/5" : "border-black/5 bg-white shadow-xl shadow-slate-200/50"} ${liquidGlass ? "backdrop-blur-xl" : ""}`}>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
            <ImageIcon size={24} />
          </div>
          <div>
            <h3 className={`font-semibold text-xl tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>Change background wallpaper</h3>
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-0.5">Personalize your desktop space</p>
          </div>
        </div>

        <div className="space-y-10">
          {/* Wallpapers Type Selector */}
          <div className="flex gap-2 p-1 bg-black/5 rounded-2xl w-fit">
            {[
              { id: 'preset', name: 'Preset Wallpapers' },
              { id: 'solid', name: 'Solid Color' },
              { id: 'gradient', name: 'Gradient Color' }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => {
                  setWallpaperType(type.id as any);
                  localStorage.setItem("vplay_wallpaper_type", type.id);
                }}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${wallpaperType === type.id ? "bg-white text-black shadow-lg" : "text-slate-500 hover:text-slate-700"}`}
              >
                {type.name}
              </button>
            ))}
          </div>

          {wallpaperType === 'preset' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { 
                  id: 'flow_light', 
                  name: 'Flow (Light)', 
                  url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=2000&auto=format&fit=crop',
                  desc: 'The official Light wallpaper for Vplay Canary'
                },
                { 
                  id: 'flow_dark', 
                  name: 'Material Blue', 
                  url: 'https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=2000&auto=format&fit=crop',
                  desc: 'A moody, high-contrast dark aesthetic'
                },
                { 
                  id: 'canary_lake', 
                  name: 'Canary Mountain', 
                  url: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=2000&auto=format&fit=crop',
                  desc: 'A serene view of the Vplay Canary landscape'
                },
              ].map(preset => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setDesktopWallpaper(preset.url);
                    localStorage.setItem("vplay_desktop_wallpaper", preset.url);
                  }}
                  className={`group relative flex flex-col p-2 rounded-[32px] border transition-all hover:scale-[1.02] active:scale-95 ${desktopWallpaper === preset.url ? "border-blue-500 bg-blue-500/5 ring-4 ring-blue-500/10" : "border-white/5 bg-white/5 hover:bg-white/10"}`}
                >
                  <div className="aspect-video w-full rounded-3xl overflow-hidden relative mb-4">
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    {desktopWallpaper === preset.url && (
                      <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center backdrop-blur-sm">
                        <CheckCircle2 className="text-white drop-shadow-lg" size={40} />
                      </div>
                    )}
                  </div>
                  <div className="px-4 pb-4">
                    <p className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{preset.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{preset.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {wallpaperType === 'solid' && (
            <div className="flex flex-col md:flex-row items-center gap-12 bg-white/5 p-8 rounded-[40px] border border-white/5">
              <div className="w-full md:w-1/2 aspect-video rounded-[32px] shadow-2xl transition-colors duration-500" style={{ backgroundColor: solidColor }} />
              <div className="w-full md:w-1/2 space-y-6">
                <div className="space-y-4">
                  <p className="text-xs font-black uppercase tracking-widest opacity-40">Select custom solid color</p>
                  <div className="flex items-center gap-4">
                    <input 
                      type="color" 
                      value={solidColor}
                      onChange={(e) => {
                        setSolidColor(e.target.value);
                        localStorage.setItem("vplay_wallpaper_solid_color", e.target.value);
                      }}
                      className="w-16 h-16 rounded-2xl border-4 border-white/20 bg-transparent cursor-pointer overflow-hidden p-0"
                    />
                    <div className="flex-1">
                      <p className={`font-mono font-bold text-xl ${isDark ? "text-white" : "text-slate-900"}`}>{solidColor.toUpperCase()}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Click to pick a color or enter HEX</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {['#0b0b0b', '#1a1a1a', '#2d3436', '#0984e3', '#6c5ce7', '#d63031', '#e17055', '#fdcb6e', '#f8fafc'].map(c => (
                    <button 
                      key={c}
                      onClick={() => {
                        setSolidColor(c);
                        localStorage.setItem("vplay_wallpaper_solid_color", c);
                      }}
                      className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 active:scale-90 ${solidColor === c ? "border-blue-500 scale-125" : "border-white/20"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {wallpaperType === 'gradient' && (
            <div className="flex flex-col md:flex-row items-center gap-12 bg-white/5 p-8 rounded-[40px] border border-white/5">
              <div className="w-full md:w-1/2 aspect-video rounded-[32px] shadow-2xl transition-all duration-500" style={{ background: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)` }} />
              <div className="w-full md:w-1/2 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Color Start</p>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={gradientColors[0]}
                        onChange={(e) => {
                          const newColors: [string, string] = [e.target.value, gradientColors[1]];
                          setGradientColors(newColors);
                          localStorage.setItem("vplay_wallpaper_gradient_colors", JSON.stringify(newColors));
                        }}
                        className="w-12 h-12 rounded-xl border-2 border-white/20 bg-transparent cursor-pointer"
                      />
                      <span className="font-mono text-xs font-bold">{gradientColors[0].toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Color End</p>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={gradientColors[1]}
                        onChange={(e) => {
                          const newColors: [string, string] = [gradientColors[0], e.target.value];
                          setGradientColors(newColors);
                          localStorage.setItem("vplay_wallpaper_gradient_colors", JSON.stringify(newColors));
                        }}
                        className="w-12 h-12 rounded-xl border-2 border-white/20 bg-transparent cursor-pointer"
                      />
                      <span className="font-mono text-xs font-bold">{gradientColors[1].toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Preset Gradients</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'Cosmic', colors: ['#2d0b3b', '#1a0525'] },
                      { name: 'Ocean', colors: ['#00d2ff', '#3a7bd5'] },
                      { name: 'Sunset', colors: ['#f83600', '#f9d423'] },
                      { name: 'Aurora', colors: ['#00b09b', '#96c93d'] },
                      { name: 'Rose', colors: ['#ff9a9e', '#fecfef'] },
                      { name: 'Cyber', colors: ['#8e2de2', '#4a00e0'] }
                    ].map(g => (
                      <button
                        key={g.name}
                        onClick={() => {
                          const newColors: [string, string] = [g.colors[0], g.colors[1]];
                          setGradientColors(newColors);
                          localStorage.setItem("vplay_wallpaper_gradient_colors", JSON.stringify(newColors));
                        }}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left"
                      >
                        <div className="w-8 h-8 rounded-full shadow-lg" style={{ background: `linear-gradient(135deg, ${g.colors[0]} 0%, ${g.colors[1]} 100%)` }} />
                        <span className="text-[11px] font-bold">{g.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Appearance & Experience - Full Width */}
      <div className={`p-8 rounded-[40px] border flex flex-col transition-all w-full ${isDark ? "border-white/5 bg-white/5" : "border-black/5 bg-white shadow-xl shadow-slate-200/50"} ${liquidGlass ? "backdrop-blur-xl" : ""}`}>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
            <Palette size={24} />
          </div>
          <div>
            <h3 className={`font-semibold text-xl tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>Giao diện & Trải nghiệm</h3>
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-0.5">Customize your view</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className={featureFlags.xaml_view_test && featureFlags.settings_vertical ? "flex flex-col gap-6" : "grid grid-cols-1 gap-8"}>
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Sun size={14} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Chủ đề hệ thống</span>
              </div>
              <div className={featureFlags.xaml_view_test && featureFlags.settings_vertical ? "flex flex-col gap-3" : "grid grid-cols-2 gap-3"}>
                <button 
                  onClick={() => setIsDark(false)}
                  className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 ${featureFlags.xaml_view_test && featureFlags.settings_vertical ? "flex-row items-center justify-between" : ""} ${!isDark ? "bg-blue-600 border-blue-500 text-white shadow-lg" : isDark ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                >
                  <div className="flex items-center gap-3">
                    <Sun size={20} className={!isDark ? "text-white" : "text-slate-400"} />
                    <span className="text-xs font-bold text-left">Sáng</span>
                  </div>
                  {featureFlags.xaml_view_test && featureFlags.settings_vertical && !isDark && <CheckCircle2 size={16} />}
                </button>
                <button 
                  onClick={() => setIsDark(true)}
                  className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 ${featureFlags.xaml_view_test && featureFlags.settings_vertical ? "flex-row items-center justify-between" : ""} ${isDark ? "bg-blue-600 border-blue-500 text-white shadow-lg" : isDark ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                >
                  <div className="flex items-center gap-3">
                    <Moon size={20} className={isDark ? "text-white" : "text-slate-400"} />
                    <span className="text-xs font-bold text-left">Tối</span>
                  </div>
                  {featureFlags.xaml_view_test && featureFlags.settings_vertical && isDark && <CheckCircle2 size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Monitor size={14} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Kiểu giao diện</span>
              </div>
              <div className={featureFlags.xaml_view_test && featureFlags.settings_vertical ? "flex flex-col gap-3" : "grid grid-cols-2 gap-3"}>
                <button 
                  onClick={() => setUseSidebar(true)}
                  className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 ${featureFlags.xaml_view_test && featureFlags.settings_vertical ? "flex-row items-center justify-between" : ""} ${useSidebar ? "bg-blue-600 border-blue-500 text-white shadow-lg" : isDark ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                >
                  <div className="flex items-center gap-3">
                    <Monitor size={20} className={useSidebar ? "text-white" : "text-slate-400"} />
                    <span className="text-xs font-bold text-left">Desktop</span>
                  </div>
                  {featureFlags.xaml_view_test && featureFlags.settings_vertical && useSidebar && <CheckCircle2 size={16} />}
                </button>
                <button 
                  onClick={() => setUseSidebar(false)}
                  className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 ${featureFlags.xaml_view_test && featureFlags.settings_vertical ? "flex-row items-center justify-between" : ""} ${!useSidebar ? "bg-blue-600 border-blue-500 text-white shadow-lg" : isDark ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                >
                  <div className="flex items-center gap-3">
                    <MousePointer2 size={20} className={!useSidebar ? "text-white" : "text-slate-400"} />
                    <span className="text-xs font-bold text-left">Touch</span>
                  </div>
                  {featureFlags.xaml_view_test && featureFlags.settings_vertical && !useSidebar && <CheckCircle2 size={16} />}
                </button>
              </div>
            </div>

            <div className={`space-y-3 ${useSidebar ? "opacity-30 grayscale cursor-not-allowed" : ""}`}>
              <div className="flex items-center gap-2 px-1">
                <Droplet size={14} className="text-cyan-500" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Liquid Glass Effect</span>
              </div>
              <div className={featureFlags.xaml_view_test && featureFlags.settings_vertical ? "flex flex-col gap-3" : "grid grid-cols-2 gap-3"}>
                <button 
                  onClick={() => !useSidebar && setLiquidGlass("glassy")}
                  className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 ${featureFlags.xaml_view_test && featureFlags.settings_vertical ? "flex-row items-center justify-between" : ""} ${liquidGlass === "glassy" ? "bg-purple-600 border-purple-500 text-white shadow-lg" : isDark ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                >
                  <div className="flex items-center gap-3">
                    <Droplet size={20} className={liquidGlass === "glassy" ? "text-white" : "text-slate-400"} />
                    <span className="text-xs font-bold text-left">Glassy</span>
                  </div>
                  {featureFlags.xaml_view_test && featureFlags.settings_vertical && liquidGlass === "glassy" && <CheckCircle2 size={16} />}
                </button>
                <button 
                  onClick={() => !useSidebar && setLiquidGlass("tinted")}
                  className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 ${featureFlags.xaml_view_test && featureFlags.settings_vertical ? "flex-row items-center justify-between" : ""} ${liquidGlass === "tinted" ? "bg-purple-600 border-purple-500 text-white shadow-lg" : isDark ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-lg bg-teal-500/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-teal-500" />
                    </div>
                    <span className="text-xs font-bold text-left">Tinted</span>
                  </div>
                  {featureFlags.xaml_view_test && featureFlags.settings_vertical && liquidGlass === "tinted" && <CheckCircle2 size={16} />}
                </button>
              </div>
            </div>

            <div className={`space-y-4 ${useSidebar ? "opacity-30 grayscale cursor-not-allowed" : ""}`}>
              <div className="flex items-center gap-2 px-1">
                <Music size={14} className="text-purple-500" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Background Music Console</span>
              </div>
              <button 
                onClick={() => !useSidebar && setActiveTab("Phát nhạc")}
                className={`w-full p-6 h-32 rounded-[32px] border transition-all flex flex-col items-center justify-center gap-4 ${isDark ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-slate-50 border-slate-200 shadow-sm hover:bg-slate-100/50"}`}
              >
                  <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
                    <Music size={24} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">Mở bảng điều khiển âm nhạc</span>
              </button>
            </div>

            {useSidebar && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Layout size={14} className="text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">LTR Sidebar</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setIsSidebarRight(false)}
                  className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 ${!isSidebarRight ? "bg-blue-600 border-blue-500 text-white shadow-lg" : isDark ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                    >
                      <Layout size={20} className={!isSidebarRight ? "text-white" : "text-slate-400"} />
                      <span className="text-xs font-bold text-left">Trái</span>
                    </button>
                    <button 
                      onClick={() => setIsSidebarRight(true)}
                  className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 ${isSidebarRight ? "bg-blue-600 border-blue-500 text-white shadow-lg" : isDark ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                    >
                      <Layout size={20} className={isSidebarRight ? "text-white shadow-[-4px_0_0_currentColor]" : "text-slate-400"} />
                      <span className="text-xs font-bold text-left">Phải</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Search size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Search box position</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setSearchBoxPosition("sidebar")}
                      className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 ${searchBoxPosition === "sidebar" ? "bg-blue-600 border-blue-500 text-white shadow-lg" : isDark ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                    >
                      <Layout size={20} className={searchBoxPosition === "sidebar" ? "text-white" : "text-slate-400"} />
                      <span className="text-xs font-bold text-left">Sidebar</span>
                    </button>
                    <button 
                      onClick={() => setSearchBoxPosition("top")}
                      className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 ${searchBoxPosition === "top" ? "bg-purple-600 border-purple-500 text-white shadow-lg" : isDark ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                    >
                      <div className="w-5 h-5 flex flex-col gap-1">
                        <div className={`h-1 w-full rounded-full ${searchBoxPosition === "top" ? "bg-white" : "bg-slate-400"}`} />
                        <div className={`flex-1 w-full rounded border ${searchBoxPosition === "top" ? "border-white/40" : "border-slate-400/40"}`} />
                      </div>
                      <span className="text-xs font-bold text-left">Top</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Pin size={14} className="text-pink-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Channel Pinning</span>
                  </div>
                  <button 
                    onClick={() => setIsPinningEnabled(!isPinningEnabled)}
                    className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between ${isPinningEnabled ? "bg-purple-600 border-purple-500 text-white shadow-lg" : isDark ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Pin size={20} className={isPinningEnabled ? "text-white" : "text-slate-400"} />
                      <span className="text-xs font-bold">Hiện lối tắt kênh yêu thích trên sidebar</span>
                    </div>
                    <div className={featureFlags.minecraft_mode ? `minecraft-toggle ${isPinningEnabled ? 'active' : ''}` : `w-10 h-5 rounded-full relative transition-colors ${isPinningEnabled ? "bg-white/20" : "bg-slate-700"}`}>
                       <motion.div 
                        animate={{ x: featureFlags.minecraft_mode ? (isPinningEnabled ? 20 : 0) : (isPinningEnabled ? 22 : 4) }}
                        className={featureFlags.minecraft_mode ? "minecraft-toggle-thumb scale-75" : `absolute top-1 w-3 h-3 rounded-full ${isPinningEnabled ? "bg-white" : "bg-slate-400"}`}
                       />
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Flag Section - Spanning both columns */}
      {/* FEATURE FLAGS MOVED TO EXPERIMENTAL TAB */}

      {/* Developer Options Section */}
      {isDev && (
        <div className={`p-8 rounded-[40px] border flex flex-col transition-all w-full mt-8 ${isDark ? "border-white/5 bg-white/5" : "border-black/5 bg-white shadow-xl shadow-slate-200/50"} ${liquidGlass ? "backdrop-blur-xl" : ""}`}>
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-red-500/10 text-red-500">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className={`font-semibold text-xl tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>Developer Options</h3>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"} font-medium`}>Special tools for Vplay Canary Operators</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => {
                const newFlags = { ...featureFlags, xaml_oobe_force: !featureFlags.xaml_oobe_force };
                setFeatureFlags(newFlags);
                localStorage.setItem("vplay_feature_flags", JSON.stringify(newFlags));
              }}
              className={`p-6 rounded-[32px] border flex items-center justify-between gap-4 transition-all ${isDark ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`}
            >
               <div className="text-left space-y-1">
                  <span className="font-bold text-sm tracking-tight">Force Launch OOBE</span>
                  <p className="text-[10px] opacity-40 font-medium">Bật OOBE mỗi khi khởi động (Test purpose)</p>
               </div>
               <div className={`w-12 h-6 rounded-full relative transition-all ${featureFlags.xaml_oobe_force ? "bg-red-500" : "bg-slate-700"}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${featureFlags.xaml_oobe_force ? "left-7" : "left-1"}`} />
               </div>
            </button>

            <button 
              onClick={() => {
                onAlert("Resetting", "All settings and local data will be wiped.");
                const wasDev = localStorage.getItem("vplay_dev_mode") === "true";
                localStorage.clear();
                if (wasDev) localStorage.setItem("vplay_dev_mode", "true");
                window.location.reload();
              }}
              className={`p-6 rounded-[32px] border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 text-red-500 flex items-center justify-between gap-4 transition-all`}
            >
               <div className="text-left space-y-1">
                  <span className="font-bold text-sm tracking-tight text-red-500">Factory Reset</span>
                  <p className="text-[10px] opacity-60 font-medium">Xóa toàn bộ dữ liệu ứng dụng</p>
               </div>
               <Trash2 size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Erase Data Section */}
      <div className={`p-8 rounded-[40px] border flex flex-col transition-all w-full mt-8 border-blue-500/10 ${isDark ? "bg-blue-500/5" : "bg-blue-500/2 shadow-xl shadow-blue-100/30"}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
            <RefreshCw size={24} className="animate-spin-slow" />
          </div>
          <div>
            <h3 className={`font-bold text-xl tracking-tight text-blue-500`}>Respring Vplay Canary</h3>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"} font-medium`}>Khởi động lại môi trường và khôi phục cài đặt gốc hệ thống Vplay Canary.</p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button 
            onClick={() => {
              if (onEraseClick) onEraseClick();
            }}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl active:scale-95 flex items-center gap-2"
          >
            <RefreshCw size={14} />
            Respring now
          </button>
        </div>
      </div>

      {/* Vconnect settings */}
      <div className={`p-8 rounded-[40px] border flex flex-col transition-all w-full ${isDark ? "border-white/5 bg-white/5" : "border-black/5 bg-white shadow-xl shadow-slate-200/50"} ${liquidGlass ? "backdrop-blur-xl" : ""}`}>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
            <ShoppingBag size={24} />
          </div>
          <div>
            <h3 className={`font-semibold text-xl tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>Cài đặt Vconnect & Hồ sơ</h3>
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-0.5">Tùy chỉnh giao diện độc lập và quản lý hồ sơ mạng xã hội</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Vconnect Theme Switcher */}
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-2 px-1">
              <Sun size={14} className="text-purple-500 animate-spin-slow" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Chủ đề giao diện (Chỉ áp dụng cho Vconnect)</span>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button 
                type="button"
                onClick={() => {
                  if (setVconnectIsDark) {
                    setVconnectIsDark(false);
                    localStorage.setItem("vplay_vconnect_is_dark", "false");
                    onAlert?.("Vconnect", "Đã chuyển chủ đề Vconnect sang giao diện Sáng!");
                  }
                }}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-center gap-3 cursor-pointer ${!vconnectIsDark ? "bg-purple-600 border-purple-500 text-white shadow-lg" : isDark ? "bg-white/5 border-white/10 text-slate-400 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}
              >
                <Sun size={18} />
                <span className="text-xs font-bold">Chế độ Sáng (Vconnect)</span>
              </button>
              <button 
                type="button"
                onClick={() => {
                  if (setVconnectIsDark) {
                    setVconnectIsDark(true);
                    localStorage.setItem("vplay_vconnect_is_dark", "true");
                    onAlert?.("Vconnect", "Đã chuyển chủ đề Vconnect sang giao diện Tối!");
                  }
                }}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-center gap-3 cursor-pointer ${vconnectIsDark ? "bg-purple-600 border-purple-500 text-white shadow-lg" : isDark ? "bg-white/5 border-white/10 text-slate-400 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}
              >
                <Moon size={18} />
                <span className="text-xs font-bold">Chế độ Tối (Vconnect)</span>
              </button>
            </div>
          </div>

          {/* Moved Profile settings card form into Vconnect Settings */}
          <div className="border border-white/5 bg-black/20 p-6 rounded-[32px] space-y-4 max-w-2xl text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 block">Chỉnh sửa Hồ sơ Mạng Xã Hội Vconnect</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Tên hiển thị</label>
                <input 
                  type="text" 
                  value={vProfileName} 
                  onChange={(e) => {
                    setVProfileName(e.target.value);
                    localStorage.setItem("vplay_vconnect_p_name", e.target.value);
                  }}
                  className="w-full text-xs p-3 rounded-2xl bg-black/50 border border-white/5 text-white focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Địa điểm</label>
                <input 
                  type="text" 
                  value={vProfileLocation} 
                  onChange={(e) => {
                    setVProfileLocation(e.target.value);
                    localStorage.setItem("vplay_vconnect_p_location", e.target.value);
                  }}
                  className="w-full text-xs p-3 rounded-2xl bg-black/50 border border-white/5 text-white focus:border-purple-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Tiểu sử ngắn</label>
              <input 
                type="text" 
                value={vProfileBio} 
                onChange={(e) => {
                  setVProfileBio(e.target.value);
                  localStorage.setItem("vplay_vconnect_p_bio", e.target.value);
                }}
                className="w-full text-xs p-3 rounded-2xl bg-black/50 border border-white/5 text-white focus:border-purple-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Ảnh đại diện (URL)</label>
                <input 
                  type="text" 
                  value={vProfileAvatar} 
                  onChange={(e) => {
                    setVProfileAvatar(e.target.value);
                    localStorage.setItem("vplay_vconnect_p_avatar", e.target.value);
                  }}
                  className="w-full text-xs p-3 rounded-2xl bg-black/50 border border-white/5 text-white focus:border-purple-500 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-400 mb-1">Ảnh bìa (URL)</label>
                <input 
                  type="text" 
                  value={vProfileCover} 
                  onChange={(e) => {
                    setVProfileCover(e.target.value);
                    localStorage.setItem("vplay_vconnect_p_cover", e.target.value);
                  }}
                  className="w-full text-xs p-3 rounded-2xl bg-black/50 border border-white/5 text-[#cccccc] focus:border-purple-500 outline-none font-mono"
                />
              </div>
            </div>

            {/* Quick Preset Avatars list */}
            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-500 mb-1.5">Ảnh Đại Diện Mẫu</span>
              <div className="flex gap-2.5">
                {[
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
                  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80"
                ].map((presetUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setVProfileAvatar(presetUrl);
                      localStorage.setItem("vplay_vconnect_p_avatar", presetUrl);
                    }}
                    className="w-8 h-8 rounded-full overflow-hidden border border-white/20 hover:scale-110 active:scale-95 transition-transform"
                  >
                    <img src={presetUrl} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  onAlert?.("Vconnect", "Cập nhật thông tin tài khoản Vconnect thành công!");
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Lưu thay đổi hồ sơ
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}


function AuthModal({ isOpen, onClose, isDark, liquidGlass, setIsDev, setUserData, featureFlags }: { isOpen: boolean, onClose: () => void, isDark: boolean, liquidGlass: "glassy" | "tinted", setIsDev: (v: boolean) => void, setUserData: (d: any) => void, featureFlags?: any }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if ((username === "special_guest" && password === "specialguest123") || (username === "vplaybeta" && password === "vplaybeta")) {
      setLoading(true);
      // Simulate login for special guest
      setTimeout(() => {
        setIsDev(true);
        setUserData({
          uid: "vplaybeta_uid",
          email: "vplaybeta@vplay.vn",
          displayName: "Vplay Beta Guest",
          role: "user"
        });
        onClose();
        setLoading(false);
      }, 1000);
      return;
    }

    if (!isForgotPassword && !isLogin && password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (!isForgotPassword && username.length < 3) {
      setError("Tên đăng nhập phải có ít nhất 3 ký tự.");
      return;
    }

    setLoading(true);
    try {
      const email = username.includes('@') ? username : `${username}@vplay.vn`;
      
      if (isForgotPassword) {
        await sendPasswordResetEmail(auth, email);
        setSuccess("Yêu cầu đặt lại mật khẩu đã được gửi đến email của bạn.");
      } else if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
      } else {
        if (password.length < 6) {
          setError("Mật khẩu phải có ít nhất 6 ký tự.");
          setLoading(false);
          return;
        }
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: username.split('@')[0] });
        onClose();
      }
    } catch (err: any) {
      const code = err.code;
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError("Tên đăng nhập hoặc mật khẩu không chính xác.");
      } else if (code === 'auth/email-already-in-use') {
        setError("Tên đăng nhập hoặc email này đã được sử dụng.");
      } else if (code === 'auth/invalid-email') {
        setError("Định dạng email không hợp lệ.");
      } else if (code === 'auth/weak-password') {
        setError("Mật khẩu quá yếu, vui lòng chọn mật khẩu phức tạp hơn.");
      } else if (code === 'auth/operation-not-allowed') {
        setError("Đăng nhập chưa được kích hoạt trong hệ thống.");
      } else if (code === 'auth/too-many-requests') {
        setError("Tài khoản bị tạm khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau.");
      } else {
        console.error("Auth System Error:", err);
        setError("Đã có lỗi xảy ra: " + (err.message || "Vui lòng thử lại sau."));
      }
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (isForgotPassword) return "Quên mật khẩu";
    return isLogin ? "Đăng nhập" : "Đăng ký";
  };

  const getDescription = () => {
    if (isForgotPassword) return "Nhập email hoặc tên đăng nhập để nhận liên kết đặt lại mật khẩu.";
    return "Tận hưởng và trải nghiệm đầy đủ các tính năng của Vplay ngay hôm nay!";
  };

  const inputClasses = `w-full px-5 py-3 rounded-3xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
    isDark 
      ? "bg-white/5 border-white/10 text-white placeholder-white/30" 
      : "bg-black/5 border-black/5 text-slate-900 placeholder-slate-400"
  }`;

  const labelClasses = `text-[10px] font-bold uppercase tracking-wider opacity-50 ml-4 ${
    isDark ? "text-white" : "text-slate-900"
  }`;

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        console.error("Google Auth Error:", err);
      }
      
      if (err.code === 'auth/popup-blocked') {
        setError("Cửa sổ đăng nhập bị chặn. Vui lòng cho phép hiện popup.");
      } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, ignore
      } else {
        setError("Lỗi đăng nhập Google: " + (err.message || "Vui lòng thử lại sau."));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[999999] flex items-center justify-center select-none overflow-hidden"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <div className="w-full bg-[#1e0a5c] text-white py-14 px-8 md:px-24 border-t border-b border-white/10 shadow-2xl relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-white/55 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-12 text-left font-light leading-relaxed">
             {/* Left Column: Title and Desc */}
             <div className="md:w-1/2 space-y-4 flex flex-col justify-center">
                <h2 className="text-4xl font-light text-white tracking-wide">
                   {getTitle()}
                </h2>
                <p className="text-base text-white/80 font-light leading-relaxed max-w-lg">
                   {getDescription()}
                </p>

                {/* Beta Info */}
                <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-left space-y-2 mt-4 max-w-lg">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <Sparkles size={14} />
                    Thông tin phiên bản Beta
                  </div>
                  <p className="text-xs leading-relaxed text-white/70">
                    Vplay Beta không hỗ trợ hệ thống đăng nhập, chỉ có ở phiên bản chính thức. Bạn sẽ được phát cho một tài khoản xem truyền hình miễn phí:
                  </p>
                  <div className="p-3 rounded-lg font-mono text-xs bg-black/40 text-amber-400 space-y-1 border border-white/5">
                    <div>Tên đăng nhập: <span className="font-bold">vplaybeta</span></div>
                    <div>Mật khẩu: <span className="font-bold">vplaybeta</span></div>
                  </div>
                </div>
             </div>

             {/* Right Column: Auth Form */}
             <div className="md:w-1/2 flex flex-col justify-center">
                <form onSubmit={handleSubmit} className="space-y-4 max-w-md w-full">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-medium text-center"
                    >
                      {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs font-medium text-center"
                    >
                      {success}
                    </motion.div>
                  )}
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1 text-white">Tên đăng nhập / Email</label>
                    <input 
                      required 
                      value={username} 
                      onChange={e => setUsername(e.target.value)} 
                      className="w-full px-5 py-3 rounded-xl border bg-white/5 border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-light" 
                      placeholder="Nhập tên đăng nhập hoặc email..."
                    />
                  </div>
                  
                  {!isForgotPassword && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1 text-white">Mật khẩu</label>
                      <div className="relative">
                        <input 
                          required 
                          type={showPassword ? "text" : "password"} 
                          value={password} 
                          onChange={e => setPassword(e.target.value)} 
                          className="w-full px-5 py-3 rounded-xl border bg-white/5 border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-light" 
                          placeholder="Nhập mật khẩu..." 
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {!isForgotPassword && !isLogin && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1 text-white">Xác nhận mật khẩu</label>
                      <input 
                        required 
                        type={showPassword ? "text" : "password"} 
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)} 
                        className="w-full px-5 py-3 rounded-xl border bg-white/5 border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-light" 
                        placeholder="Nhập lại mật khẩu..." 
                      />
                    </div>
                  )}

                  {isLogin && !isForgotPassword && (
                    <div className="text-right">
                      <button 
                        type="button" 
                        onClick={() => setIsForgotPassword(true)}
                        className="text-xs font-medium text-white/60 hover:text-white transition-colors hover:underline"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                  )}

                  <div className="pt-2 flex flex-col gap-4">
                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="w-full py-3.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold transition-all disabled:opacity-50 active:scale-95 text-sm"
                    >
                      {loading ? "..." : (isForgotPassword ? "Xác nhận" : (isLogin ? "Đăng nhập" : "Đăng ký"))}
                    </button>

                    <div className="flex justify-between items-center text-xs px-1">
                      {isForgotPassword ? (
                        <button type="button" onClick={() => setIsForgotPassword(false)} className="text-white/60 hover:text-white transition-colors hover:underline">
                          Quay lại đăng nhập
                        </button>
                      ) : (
                        <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-white/60 hover:text-white transition-colors hover:underline">
                          {isLogin ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
             </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function AppWindowContainer({ 
  win, 
  onClose, 
  onMinimize, 
  onMaximize,
  onFocus, 
  isActive, 
  children, 
  isDark,
  featureFlags
}: { 
  win: AppWindow, 
  onClose: () => void, 
  onMinimize: () => void, 
  onMaximize: () => void,
  onFocus: () => void, 
  isActive: boolean,
  children: ReactNode,
  isDark: boolean,
  featureFlags: any,
  key?: string | number
}) {
  const isMaximized = win.isMaximized;
  const [size, setSize] = useState({ width: win.width || 800, height: win.height || 550 });
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: any) => {
      if (resizeRef.current) {
        const rect = resizeRef.current.parentElement?.getBoundingClientRect();
        if (rect) {
          const newWidth = Math.max(400, e.clientX - rect.left);
          const newHeight = Math.max(300, e.clientY - rect.top);
          setSize({ width: newWidth, height: newHeight });
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const windowVariants = {
    normal: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", damping: 25, stiffness: 300 }
    },
    minimized: {
      scale: 0.8,
      opacity: 0,
      y: 200,
      transition: { duration: 0.2 }
    }
  };

  const controlsColorClass = !isDark ? "text-slate-800 hover:text-black" : "text-white/60 hover:text-white";

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={win.isMinimized ? "minimized" : "normal"}
      variants={windowVariants}
      exit={{ scale: 0.8, opacity: 0 }}
      drag={!isMaximized && !isResizing}
      dragMomentum={false}
      onMouseDown={onFocus}
      style={{ 
        zIndex: win.zIndex,
        width: isMaximized ? "100%" : size.width,
        height: isMaximized ? "100%" : size.height,
        left: isMaximized ? 0 : win.x,
        top: isMaximized ? 0 : win.y
      }}
      className={`fixed flex flex-col shadow-2xl border overflow-hidden transition-colors duration-300 ${
        isDark ? "bg-[#1c1c1c] border-white/10" : "bg-white border-slate-200"
      } ${isMaximized ? "inset-0 rounded-none z-[60]" : "rounded-2xl"}`}
    >
      {/* Resize handles */}
      {!isMaximized && (
        <>
          <div 
            onMouseDown={(e) => { e.stopPropagation(); setIsResizing(true); }}
            className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-[100] group"
          >
            <div className={`absolute bottom-2 right-2 w-2 h-2 rounded-full border border-blue-500/50 opacity-0 group-hover:opacity-100 transition-opacity`} />
          </div>
        </>
      )}
      
      {/* Title Bar */}
      <div className={`h-11 px-4 flex items-center justify-between select-none cursor-default shrink-0 ${
        isActive ? (isDark ? "bg-white/5" : "bg-slate-50") : ""
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 flex items-center justify-center">
            {win.type === "tv" ? (
               <Tv size={16} className="text-purple-500" />
            ) : win.type === "settings" ? (
               <Settings size={16} className="text-blue-500" />
            ) : win.type === "browser" ? (
               <Globe size={16} className="text-blue-500" />
            ) : (
               <FileCode size={16} className="text-slate-400" />
            )}
          </div>
          <span className={`text-[11px] font-black uppercase tracking-widest truncate max-w-[200px] ${!isDark ? "text-slate-900" : "text-white"}`}>{win.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onMinimize} className={`p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all ${controlsColorClass}`} title="Minimize">
            <Minimize2 size={16} />
          </button>
          <button onClick={onMaximize} className={`p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all ${controlsColorClass}`} title={isMaximized ? "Restore" : "Maximize"}>
            <Square size={14} className={isMaximized ? "scale-75" : ""} />
          </button>
          <button onClick={onClose} className="p-2 hover:bg-red-500 text-white rounded-lg transition-all group ml-1" title="Close">
            <X size={16} className={`group-hover:scale-110 transition-transform ${!isDark ? "text-black group-hover:text-white" : "text-white"}`} />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 min-h-0 bg-black overflow-hidden relative">
        {children}
      </div>
    </motion.div>
  );
}

function WidgetsDashboard({ 
  showWidgets, 
  setShowWidgets, 
  pinnedWidgets,
  setPinnedWidgets,
  isWidgetsFullScreen, 
  setIsWidgetsFullScreen, 
  isMobile, 
  weatherCity, 
  weatherData, 
  searchQuery,
  setSearchQuery,
  setIsSearchOpen,
  isDark: _isDark,
  user,
  history,
  notifications,
  addNotification,
  onAction,
  onAIToolsAction,
  onNavigate,
  onAlert,
  channels,
  featureFlags,
  setFeatureFlags,
  onFeedbackClick,
  vpoints,
  setVpoints,
  purchasedWidgets,
  setPurchasedWidgets,
  isVstorePinned,
  setIsVstorePinned,
  hasReceivedBonus,
  setHasReceivedBonus,
  activeBoardTab,
  setActiveBoardTab,
  activeDoForMeSubView,
  setActiveDoForMeSubView,
  pinnedDoForMeFeatures,
  togglePinFeature,
  liquidGlass,
  widgetsTheme,
  setWidgetsTheme,
  setLiquidGlass,
  setIsDark,
  isDev,
  setIsDev,
  useSidebar,
  setUseSidebar,
  isSidebarRight,
  setIsSidebarRight,
  isPinningEnabled,
  setIsPinningEnabled,
  userData,
  setUserData,
  onLogin,
  favorites,
  backgroundMusicOption,
  setBackgroundMusicOption,
  customMusicId,
  setCustomMusicId,
  searchBoxPosition,
  setSearchBoxPosition,
  sidebarStyle,
  setSidebarStyle,
  setActiveTab,
  wallpaperType,
  setWallpaperType,
  solidColor,
  setSolidColor,
  gradientColors,
  setGradientColors,
  desktopWallpaper,
  setDesktopWallpaper,
  forcedFont,
  setForcedFont,
  onEraseClick,
  isUnlimitedVpoints,
  setIsUnlimitedVpoints,
  handleDevOptionClick,
  setHistory,
  historyStats,
  setHistoryStats,
  setNotifications,
  clearNotifications
}: any) {
  const isDark = widgetsTheme === "dark"; 
  const [widgetsFeedTreatment, setWidgetsFeedTreatment] = useState<number>(() => {
    const savedFlags = localStorage.getItem("vplay_feature_flags");
    let isExperimentActive = false;
    try {
      if (savedFlags) {
        isExperimentActive = !!JSON.parse(savedFlags)?.widgets_feed_treatments;
      }
    } catch (e) {}

    if (isExperimentActive) {
      const randomTreatment = Math.floor(Math.random() * 5) + 1;
      return randomTreatment;
    }

    const saved = localStorage.getItem("vplay_widgets_feed_treatment");
    return saved ? parseInt(saved, 10) : 1;
  }); 
  const [operateTabSection, setOperateTabSection] = useState<'tools' | 'dev'>('tools');
  const [gallerySearch, setGallerySearch] = useState("");
  const [showWidgetGallery, setShowWidgetGallery] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showBonusPopup, setShowBonusPopup] = useState(false);
  const [boardSearch, setBoardSearch] = useState("");
  const [selectedSettingCategory, setSelectedSettingCategory] = useState<string | null>(null);
  const [settingSearchQuery, setSettingSearchQuery] = useState("");
  const [widgetSettings, setWidgetSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("vplay_widget_settings");
      if (saved) {
        return {
          openFeedOnHover: false,
          showFeedBadges: true,
          showFeed: true,
          allowWebSearches: true,
          collapsePinButton: false,
          showCalendarInWidgets: false,
          showClockInWidgets: false,
          hideFeedSidebar: false,
          ...JSON.parse(saved)
        };
      }
    } catch (e) {}
    return {
      openFeedOnHover: false,
      showFeedBadges: true,
      showFeed: true,
      allowWebSearches: true,
      collapsePinButton: false,
      showCalendarInWidgets: false,
      showClockInWidgets: false,
      hideFeedSidebar: false,
    };
  });

  const prevWidgetSettingsRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem("vplay_widget_settings", JSON.stringify(widgetSettings));
    if (prevWidgetSettingsRef.current && widgetSettings) {
      Object.keys(widgetSettings).forEach(key => {
        const prevValue = prevWidgetSettingsRef.current[key];
        const currValue = (widgetSettings as any)[key];
        if (prevValue !== currValue && prevValue !== undefined) {
          const newEvent = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'setting',
            content: `Thay đổi cài đặt tiện ích: ${key} (${prevValue} → ${currValue})`,
            time: Date.now()
          };
          setHistory((prev: any[]) => {
            const updated = [newEvent, ...prev].slice(0, 100);
            localStorage.setItem("vplay_history", JSON.stringify(updated));
            return updated;
          });
        }
      });
    }
    prevWidgetSettingsRef.current = widgetSettings ? { ...widgetSettings } : null;
  }, [widgetSettings, setHistory]);

  const [time, setTime] = useState(new Date());
  const [isTabTransitioning, setIsTabTransitioning] = useState(false);
  const [isWidgetsUpdated, setIsWidgetsUpdated] = useState(() => {
    return localStorage.getItem("vplay_widgets_updated_canary") === "true";
  });
  const [isUpdateSkipped, setIsUpdateSkipped] = useState(false);
  const [isInstallingUpdate, setIsInstallingUpdate] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installMessage, setInstallMessage] = useState("Initializing installation...");
  const [isRefreshingWidgets, setIsRefreshingWidgets] = useState(false);

  useEffect(() => {
    if (!isInstallingUpdate) return;
    
    setInstallProgress(0);
    setInstallMessage("Downloading package updates (5%)...");
    
    const interval = setInterval(() => {
      setInstallProgress((prev) => {
        const next = prev + 1;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        
        if (next === 10) setInstallMessage("Extracting system files (15%)...");
        else if (next === 25) setInstallMessage("Verifying checksum integrity (32%)...");
        else if (next === 40) setInstallMessage("Updating Widgets engine database (54%)...");
        else if (next === 60) setInstallMessage("Rebuilding widgets feed & assets (72%)...");
        else if (next === 80) setInstallMessage("Applying security patches (88%)...");
        else if (next === 95) setInstallMessage("Completing update installation (98%)...");
        
        return next;
      });
    }, 300);
    
    return () => clearInterval(interval);
  }, [isInstallingUpdate]);

  useEffect(() => {
    if (installProgress === 100) {
      setInstallMessage("Successfully installed! Refreshing widgets board... (100%)");
      const timeout = setTimeout(() => {
        setIsRefreshingWidgets(true);
        localStorage.setItem("vplay_widgets_updated_canary", "true");
        setIsWidgetsUpdated(true);
        setIsInstallingUpdate(false);
        setActiveBoardTab('widgets');
        
        const finishTimeout = setTimeout(() => {
          setIsRefreshingWidgets(false);
        }, 1500);
        return () => clearTimeout(finishTimeout);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [installProgress, setActiveBoardTab]);

  const [selectedGalleryWidget, setSelectedGalleryWidget] = useState<any>({
    type: 'weather', name: 'Weather', icon: Cloud, desc: 'Theo dõi thời tiết tại địa phương của bạn với độ chính xác cao.'
  });

  useEffect(() => {
    if (activeBoardTab === 'vstore' && !hasReceivedBonus) {
       setVpoints((v: number) => v + 50);
       setHasReceivedBonus(true);
       localStorage.setItem("vplay_vpoints_bonus", "true");
       addNotification("VStore", "Chào mừng bạn mới! +50 Vpoints đã được cộng vào tài khoản.", "success");
    }
  }, [activeBoardTab, hasReceivedBonus, setVpoints, setHasReceivedBonus]);

  useEffect(() => {
    setIsTabTransitioning(false);
  }, [activeBoardTab]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getBoardGreeting = () => {
    const hour = time.getHours();
    if (hour >= 5 && hour <= 9) return "Chào buổi sáng";
    if (hour >= 10 && hour <= 12) return "Chào buổi trưa";
    if (hour >= 13 && hour <= 17) return "Chào buổi chiều";
    if (hour >= 18 && hour <= 23) return "Chào buổi tối";
    return "Chào buổi đêm";
  };

  const addWidget = (itemOrType: any, sizeParam?: string) => {
    // Legacy support for (type, size) calls
    const item = typeof itemOrType === 'string' ? { type: itemOrType, name: itemOrType, size: sizeParam } : itemOrType;
    
    if (pinnedWidgets.some((w: any) => w.type === item.type && (item.channelId ? w.channelId === item.channelId : true))) return;
    const newWidget = { 
      id: Date.now().toString(), 
      type: item.type, 
      size: item.size || '2x2',
      channelId: item.channelId,
      appName: item.appName,
      locked: false
    };
    setPinnedWidgets([...pinnedWidgets, newWidget]);
    setShowWidgetGallery(false);
    addNotification("Widgets", `Đã thêm tiện ích ${item.name || item.type} vào bảng`);
  };

  const [vstoreSearch, setVstoreSearch] = useState("");
  const [operatorCommand, setOperatorCommand] = useState("");
  const [operatorLogs, setOperatorLogs] = useState<string[]>(["Vplay OS [Version 1.0.1]", "Kernel: Cobalt-S 2026.05", "Type /help for command list"]);

  const handleOperatorCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorCommand.trim()) return;
    
    const cmd = operatorCommand.trim();
    setOperatorLogs(prev => [...prev, `> ${cmd}`]);
    
    const parts = cmd.toLowerCase().split(' ');
    const base = parts[0];

    if (base === '/help') {
       setOperatorLogs(prev => [...prev, "Available commands:", "/developer <enable/disable> - Toggle Dev Mode", "/reset store - Reset vpoints & purchases", "/reset widgets - Reset pinned widgets", "/add points <num> - Add Vpoints (max 999999)", "/cls - Clear logs"]);
    } else if (base === '/developer') {
       const arg = parts[1];
       if (arg === 'enable') {
          setIsDev(true);
          localStorage.setItem("vplay_dev_mode", "true");
          setOperatorLogs(prev => [...prev, "Developer mode ENABLED. Tab 'Dev' is now available on board widgets."]);
          addNotification("Developer", "Dev Mode enabled via Terminal command.", "success");
       } else if (arg === 'disable') {
          setIsDev(false);
          localStorage.setItem("vplay_dev_mode", "false");
          setOperatorLogs(prev => [...prev, "Developer mode DISABLED."]);
          addNotification("Developer", "Dev Mode disabled via Terminal command.", "info");
       } else {
          setOperatorLogs(prev => [...prev, "Usage: /developer <enable/disable>"]);
       }
    } else if (base === '/cls') {
       setOperatorLogs(["Vplay Operator Console Cleared"]);
    } else if (base === '/reset' && parts[1] === 'store') {
       setVpoints(100);
       setPurchasedWidgets([]);
       localStorage.removeItem("vplay_vpoints");
       localStorage.removeItem("vplay_purchased_widgets");
       setOperatorLogs(prev => [...prev, "Store reset successfully. 100 VP granted."]);
       addNotification("Operator", "Store data has been reset.", 'warning');
    } else if (base === '/reset' && parts[1] === 'widgets') {
       setPinnedWidgets([
         { id: '1', type: 'weather', size: '2x2' },
         { id: '2', type: 'clock_date', size: '2x2' }
       ]);
       setOperatorLogs(prev => [...prev, "Widget configuration reset to default."]);
       addNotification("Operator", "Widgets reset to default.", 'warning');
    } else if (base === '/add' && parts[1] === 'points') {
       const val = parseInt(parts[2]);
       if (!isNaN(val)) {
          setVpoints((prev: number) => Math.min(999999, prev + val));
          setOperatorLogs(prev => [...prev, `Successfully added ${val} vpoints.`]);
          addNotification("Operator", `Added ${val} Vpoints via console.`, 'success');
       } else {
          setOperatorLogs(prev => [...prev, "Error: Invalid number."]);
       }
    } else {
       setOperatorLogs(prev => [...prev, `Command '${base}' not found. Type /help for assistance.`]);
    }
    
    setOperatorCommand("");
  };

  const shouldHideSidebar = widgetSettings?.hideFeedSidebar || widgetsFeedTreatment === 2;

  const isFullPageTab = ['vstore', 'settings', 'doforme', 'update_widgets_feed', 'erase_data', 'dev', 'vids', 'vids_lite'].includes(activeBoardTab);

  const isCollapsedSidebar = widgetsFeedTreatment === 4;

  const isUpdated = isWidgetsUpdated;

  let sidebarClassName = "";
  if (isFullPageTab) {
    if (widgetsFeedTreatment === 3) {
      sidebarClassName = `${isCollapsedSidebar ? "w-11" : "w-24"} h-[calc(100%-32px)] my-4 ml-4 mr-2 rounded-[28px] border flex flex-col items-center py-6 gap-5 shadow-xl ${isUpdated ? "bg-white/5 border-white/10 select-none backdrop-blur-2xl backdrop-saturate-150" : "bg-black/45 border-white/10"} text-white`;
    } else if (isCollapsedSidebar) {
      sidebarClassName = `w-11 h-full flex flex-col items-center py-6 gap-4 ${isUpdated ? "bg-transparent border-none text-white select-none" : "border-r bg-black/20 border-white/5 text-white"}`;
    } else {
      sidebarClassName = `w-24 h-full flex flex-col items-center py-6 gap-5 ${isUpdated ? "bg-transparent border-none text-white select-none" : "border-r bg-black/20 border-white/5 text-white"}`;
    }
  } else {
    if (widgetsFeedTreatment === 3) {
      sidebarClassName = `${isCollapsedSidebar ? "w-11" : "w-24"} h-[calc(100%-32px)] my-4 ml-4 mr-2 rounded-[28px] border flex flex-col items-center py-6 gap-5 shadow-xl ${isUpdated ? "bg-white/5 border-white/10 select-none backdrop-blur-2xl backdrop-saturate-150" : (isDark ? "bg-black/45 border-white/10" : "bg-white/80 border-black/10")} ${isDark || isUpdated ? "text-white" : "text-slate-900 shadow-slate-200"}`;
    } else if (isCollapsedSidebar) { // Collapse
      sidebarClassName = `w-11 h-full flex flex-col items-center py-6 gap-4 ${isUpdated ? "bg-transparent border-none text-white font-sans select-none" : (isDark ? "border-r backdrop-blur-xl bg-black/20 border-white/5 text-white" : "border-r backdrop-blur-xl bg-black/5 border-black/5 text-slate-800")}`;
    } else { // Default Treatment 1 or 5
      sidebarClassName = `w-24 h-full flex flex-col items-center py-6 gap-5 ${isUpdated ? "bg-transparent border-none text-white font-sans select-none" : (isDark ? "border-r backdrop-blur-xl bg-black/20 border-white/5 text-white" : "border-r backdrop-blur-xl bg-black/5 border-black/5 text-slate-800")}`;
    }
  }

  return (
    <AnimatePresence>
      {showWidgets && (
        <motion.div
  id="vplay-widgets-dashboard"
  initial={{ opacity: 0, x: -100 }}
  animate={{ 
    opacity: 1, 
    x: 0,
    width: isWidgetsFullScreen ? "100%" : (isMobile ? "100%" : "840px"),
    height: isWidgetsFullScreen ? "100%" : (isMobile ? "100%" : "calc(100% - 32px)"),
    top: isWidgetsFullScreen ? 0 : 16,
    left: isWidgetsFullScreen ? 0 : 16,
    borderRadius: isWidgetsFullScreen ? 0 : (widgetsFeedTreatment === 5 ? 16 : (isUpdated ? 12 : 6)),
    boxShadow: isUpdated ? "0 32px 64px -12px rgba(0, 0, 0, 0.6)" : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    backdropFilter: isUpdated ? "blur(50px) saturate(240%)" : "none"
  }}
  exit={{ opacity: 0, x: -100 }}
  transition={{ duration: 0.1 }}
  className={`fixed z-[10002] flex shadow-2xl border overflow-hidden text-white transition-all duration-300 ${
    isUpdated 
      ? "bg-black/35 border-white/15 select-none font-sans" 
      : `bg-[#1c1c1c] ${isFullPageTab ? "border-white/5" : "border-white/10"}`
  }`}
  onClick={(e) => e.stopPropagation()}
>
  {featureFlags?.blur_my_feed && (
    <style>{`
      /* Only target descendants that are NOT inside widgets or full page tabs */
      #vplay-widgets-dashboard *:not([id^="widget-card-"]):not([id^="widget-card-"] *):not(.full-page-tab):not(.full-page-tab *) {
        color: rgba(255, 255, 255, 0.95);
      }
      
      #vplay-widgets-dashboard h1:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard h2:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard h3:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard h4:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard h5:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard h6:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard p:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard span:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard label:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard button:not([id^="widget-card-"] *):not(.full-page-tab *) {
        color: rgba(255, 255, 255, 0.95) !important;
      }
      
      #vplay-widgets-dashboard .text-slate-300:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .text-slate-400:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .text-slate-500:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .text-slate-600:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .text-slate-700:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .text-slate-800:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .text-slate-900:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .text-slate-950:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .text-gray-400:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .text-gray-500:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .text-gray-600:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .text-gray-700:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .text-neutral-500:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .text-neutral-600:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .text-neutral-700:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .text-neutral-800:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .text-neutral-900:not([id^="widget-card-"] *):not(.full-page-tab *) {
        color: rgba(255, 255, 255, 0.65) !important;
      }
      
      /* Target buttons in sidebar specifically to keep icon colors white/readable */
      #vplay-widgets-dashboard button:not([id^="widget-card-"] *) {
        color: inherit;
      }
      
      /* Make backgrounds of inner elements glassy as well so they blend nicely with white text */
      #vplay-widgets-dashboard .bg-slate-50:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .bg-slate-100:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .bg-slate-200/50:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .bg-slate-100/50:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .bg-slate-200:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .bg-white:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .bg-blue-50:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .bg-red-50:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .bg-green-50:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .bg-amber-50:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .bg-emerald-500\\/10:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard .bg-blue-500\\/10:not([id^="widget-card-"] *):not(.full-page-tab *) {
        background-color: rgba(255, 255, 255, 0.08) !important;
        backdrop-filter: blur(8px);
      }
      
      /* Make sure borders are subtle white instead of dark */
      #vplay-widgets-dashboard .border:not([id^="widget-card-"] *):not(.full-page-tab *),
      #vplay-widgets-dashboard [class*="border-"]:not([id^="widget-card-"] *):not(.full-page-tab *) {
        border-color: rgba(255, 255, 255, 0.1) !important;
      }
    `}</style>
  )}
  {!isWidgetsUpdated && (
    <style>{`
      #vplay-widgets-dashboard, 
      #vplay-widgets-dashboard *, 
      [id^="vplay-widgets-dashboard"], 
      .backdrop-blur-xl, 
      .backdrop-blur-2xl, 
      .backdrop-blur-3xl, 
      .backdrop-blur-md, 
      .backdrop-blur-sm, 
      .backdrop-blur {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
    `}</style>
  )}
  {!isWidgetsUpdated && !isUpdateSkipped ? (
     <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white select-none z-[10005] overflow-hidden">
        <div className="w-full bg-[#1e0a5c] text-white py-14 px-8 md:px-24 border-t border-b border-white/10 shadow-2xl">
           <div className="w-full max-w-6xl mx-auto flex flex-col gap-8 text-left font-light leading-relaxed">
              {!isInstallingUpdate ? (
                 <>
                    <div className="space-y-3 w-full">
                       <h2 className="text-3xl md:text-4xl text-white font-light leading-tight tracking-wide">
                          Widgets Feed needs an update
                       </h2>
                       <p className="text-sm md:text-base text-white/95 font-light leading-relaxed w-full max-w-2xl">
                          We are experimenting new frosted glass effect design on Widget Feeds and it requires a server-side update to work. You can skip the update but the nice frosted glass effect will not work
                       </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-start gap-4">
                       <button
                          onClick={() => setIsInstallingUpdate(true)}
                          className="border border-white text-white font-light text-sm px-6 py-2.5 transition-all select-none bg-transparent hover:bg-white/10 rounded-none active:scale-[0.98] cursor-pointer"
                       >
                          Install now
                       </button>
                       <button
                          onClick={() => setIsUpdateSkipped(true)}
                          className="border border-white/40 text-white/80 font-light text-sm px-6 py-2.5 transition-all select-none bg-transparent hover:bg-white/5 hover:text-white rounded-none active:scale-[0.98] cursor-pointer"
                       >
                          Skip update
                       </button>
                    </div>
                 </>
              ) : (
                 <div className="space-y-3 w-full">
                    <h2 className="text-3xl md:text-4xl text-white font-light leading-tight tracking-wide">
                       Installing newest updates...
                    </h2>
                    <p className="text-sm md:text-base text-white/95 font-light leading-relaxed w-full">
                       We are updating Widgets Feed for you. This might take a few moments...<br />
                       {installMessage}
                    </p>
                    
                    <div className="flex items-center gap-4 pt-4">
                       <div 
                          className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin shrink-0"
                          style={{ borderWidth: '3px', display: 'none' }}
                        />
                        <img 
                           src="https://upload.wikimedia.org/wikipedia/commons/3/3f/Windows-loading-cargando.gif" 
                           alt="loading" 
                           className="w-7 h-7 object-contain shrink-0" 
                           referrerPolicy="no-referrer"
                        />
                        <div style={{ display: 'none' }}
                       />
                       <span className="text-xl font-light text-white/90">
                          {installProgress}% complete
                       </span>
                    </div>
                 </div>
              )}
           </div>
        </div>
     </div>
  ) : isRefreshingWidgets ? (
     <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-[#1c1c1c] text-white z-[10006]">
        <RefreshCw size={40} className="text-blue-500 animate-spin mb-4" />
        <h3 className="text-lg font-bold tracking-tight text-white mb-1">Refreshing widgets board...</h3>
        <span className="text-[10px] text-slate-500 font-mono">Starting Canary Build 2026.05...</span>
     </div>
  ) : (
     <>
  {/* Windows 11 Style Sidebar with treatments */}
  {!shouldHideSidebar && (
    <div className={sidebarClassName}>
      {[
        { id: 'widgets', label: 'My widgets', icon: LayoutDashboard, color: 'text-[#00d2ff]', lightColor: 'text-blue-600' },
        { id: 'vstore', label: 'Vstore Widgets', icon: ShoppingBag, color: 'text-amber-500', lightColor: 'text-amber-600' },
        ...(widgetSettings.showFeed ? [{ id: 'feed', label: 'My feed', icon: Newspaper, color: 'text-blue-400', lightColor: 'text-blue-600' }] : []),
        { id: 'doforme', label: 'Operate', icon: Sparkles, color: 'text-purple-400', lightColor: 'text-purple-600' },
        ...(isDev ? [{ id: 'dev', label: 'Dev', icon: Terminal, color: 'text-rose-400', lightColor: 'text-rose-600' }] : [])
      ].map(tab => {
        const isActive = activeBoardTab === tab.id;
        const Icon = tab.icon;
        
        let customActiveStyle = "";
        if (isActive) {
          customActiveStyle = "bg-[#2d2d2d] text-[#00d2ff]";
        } else {
          customActiveStyle = "opacity-40 hover:opacity-100 text-current";
        }

        let btnClassName = "";
        if (isCollapsedSidebar) {
          const roundedClass = isActive ? "rounded-lg" : (widgetsFeedTreatment === 5 ? "rounded-full" : "rounded-xl");
          btnClassName = `p-2 ${roundedClass} transition-all relative ${customActiveStyle}`;
        } else {
          const roundedClass = isActive ? "rounded-lg" : (widgetsFeedTreatment === 5 ? "rounded-[24px]" : "rounded-2xl");
          btnClassName = `w-[84px] h-[68px] flex flex-col items-center justify-center gap-1 p-1 ${roundedClass} transition-all relative ${customActiveStyle}`;
        }

        return (
          <button
            key={tab.id}
            onClick={() => setActiveBoardTab(tab.id as any)}
            className={btnClassName}
            title={tab.label}
          >
            {isActive && (
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-[3px] h-[24px] rounded-full bg-[#00d2ff]" />
            )}
            <Icon size={isCollapsedSidebar ? 18 : 22} className={isActive ? "text-[#00d2ff]" : ""} />
            {!isCollapsedSidebar && !isActive && (
              <span className="text-[10px] font-semibold tracking-tight select-none truncate w-full px-0.5">
                {tab.label}
              </span>
            )}
          </button>
        );
      })}

      <button 
        onClick={() => setActiveBoardTab('settings')}
        className={
          isCollapsedSidebar
            ? `mt-auto p-2 transition-all relative ${activeBoardTab === 'settings' ? "bg-[#2d2d2d] text-[#00d2ff] rounded-lg" : (widgetsFeedTreatment === 5 ? "rounded-full opacity-40 hover:opacity-100" : "rounded-xl opacity-40 hover:opacity-100")}`
            : `mt-auto w-[84px] h-[68px] flex flex-col items-center justify-center gap-1 p-1 transition-all relative ${activeBoardTab === 'settings' ? "bg-[#2d2d2d] text-[#00d2ff] rounded-lg" : (widgetsFeedTreatment === 5 ? "rounded-[24px] opacity-40 hover:opacity-100" : "rounded-2xl opacity-40 hover:opacity-100")}`
        }
        title="Settings"
      >
        {activeBoardTab === 'settings' && (
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-[3px] h-[24px] rounded-full bg-[#00d2ff]" />
        )}
        <Settings size={isCollapsedSidebar ? 18 : 22} className={activeBoardTab === 'settings' ? "text-[#00d2ff]" : ""} />
        {!isCollapsedSidebar && activeBoardTab !== 'settings' && (
          <span className="text-[10px] font-semibold tracking-tight select-none">Settings</span>
        )}
      </button>
    </div>
  )}

  <div className={`flex-1 flex flex-col min-w-0 transition-colors duration-300 ${
    isUpdated 
      ? (isFullPageTab ? "p-0 bg-transparent text-white full-page-tab h-full overflow-hidden" : "p-8 bg-transparent text-white h-full overflow-y-auto custom-scrollbar")
      : (isFullPageTab ? "p-0 bg-[#1c1c1c] text-white full-page-tab h-full overflow-hidden" : "p-8 bg-[#1c1c1c] text-white rounded-r-2xl h-full overflow-y-auto custom-scrollbar")
  }`}>
     {!isFullPageTab && (
       <div className="flex items-center justify-between mb-8">
          <div>
            {/* Dynamic Date on Top (just like the image) */}
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block select-none">
              {time.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-current leading-none">{getBoardGreeting()}</h2>
            
            {/* Tab Title (just like the image) */}
            <div className="flex items-center gap-2 mt-4">
              <span className="text-lg font-semibold tracking-tight text-white leading-none">
                {activeBoardTab === 'widgets' ? 'My widgets' : 'My feed'}
              </span>
              {activeBoardTab === 'widgets' && (
                <button 
                  onClick={() => { setShowWidgetGallery(true); setActiveBoardTab('widgets'); }}
                  className="p-1 rounded-full hover:bg-white/10 text-white/80 transition-colors flex items-center justify-center active:scale-90"
                  title="Add widget"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
            {(widgetSettings.showClockInWidgets || widgetSettings.showCalendarInWidgets) && (
              <div className="flex flex-wrap items-center gap-3 mt-4">
                {widgetSettings.showClockInWidgets && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-white/5 text-xs font-semibold font-mono tracking-wider transition-all select-none bg-white/5 text-blue-400">
                    <Clock size={14} className="text-blue-500 animate-pulse" />
                    <span>{time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>
                  </div>
                )}
                {widgetSettings.showCalendarInWidgets && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-white/5 text-xs font-semibold transition-all select-none bg-white/5 text-purple-400">
                    <Calendar size={14} className="text-purple-500" />
                    <span>{time.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            )}
            {shouldHideSidebar && (
              <div className="flex items-center gap-4 mt-6 overflow-x-auto pb-2 scrollbar-none">
                 {[
                  { id: 'widgets', icon: LayoutDashboard, label: 'My widgets' },
                  { id: 'vstore', icon: ShoppingBag, label: 'Vstore Widgets' },
                  { id: 'feed', icon: Newspaper, label: 'My feed' },
                  ...(isDev ? [{ id: 'dev', icon: Terminal, label: 'Dev' }] : []),
                  { id: 'doforme', icon: Sparkles, label: 'AI' }
                ].filter(t => t.id !== 'feed' || widgetSettings.showFeed).map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveBoardTab(tab.id as any)}
                    className={`flex items-center gap-1.5 p-1.5 px-3 rounded-full transition-all ${activeBoardTab === tab.id ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "opacity-45 hover:opacity-100 hover:bg-white/5"}`}
                  >
                    <tab.icon size={15} />
                    <span className="text-xs font-semibold tracking-tight">{tab.label}</span>
                  </button>
                ))}
                <div className="w-px h-4 bg-current opacity-20" />
                <button 
                  onClick={() => setActiveBoardTab('settings')}
                  className={`flex items-center gap-1.5 p-1.5 px-3 rounded-full transition-all ${activeBoardTab === 'settings' ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "opacity-45 hover:opacity-100 hover:bg-white/5"}`}
                >
                  <Settings size={15} />
                  <span className="text-xs font-semibold tracking-tight">Settings</span>
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
             {!widgetSettings.collapsePinButton ? (
               <button 
                 onClick={() => { setShowWidgetGallery(true); setActiveBoardTab('widgets'); }}
                 className="flex items-center gap-2 px-6 py-2.5 bg-[#00d2ff] hover:bg-[#00d2ff]/90 text-black rounded-lg transition-all shadow-lg active:scale-95"
               >
                 <Plus size={20} className="stroke-[3] text-black" />
                 <span className="text-sm font-normal tracking-tight">Add widgets</span>
               </button>
             ) : (
               <button 
                 onClick={() => { setShowWidgetGallery(true); setActiveBoardTab('widgets'); }}
                 className="p-2.5 rounded-lg bg-[#00d2ff]/10 hover:bg-[#00d2ff]/20 text-[#00d2ff] transition-all active:scale-95 flex items-center justify-center"
                 title="Add widgets"
               >
                 <Plus size={22} className="stroke-[3]" />
               </button>
             )}
             <button 
               onClick={() => setIsWidgetsFullScreen(!isWidgetsFullScreen)}
               className={`p-2.5 rounded-xl transition-all ${isDark ? "hover:bg-white/5 text-white/70" : "hover:bg-black/5 text-slate-600"}`}
             >
               {isWidgetsFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
             </button>
             <button 
               onClick={() => setShowWidgets(false)}
               className={`p-2.5 rounded-xl transition-all ${isDark ? "hover:bg-red-500/20 hover:text-red-500" : "hover:bg-red-500/20 hover:text-red-500"}`}
             >
               <X size={20} />
             </button>
          </div>
       </div>
     )}


     <div className={`flex-1 min-h-0 relative ${isFullPageTab ? "flex flex-col overflow-hidden" : "overflow-y-auto pr-2 space-y-8 custom-scrollbar relative"}`}>
        <AnimatePresence mode="wait">
          {isTabTransitioning && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-transparent"
              >
              <div className="flex flex-col items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="relative w-12 h-12"
                >
                  <svg className="w-full h-full" viewBox="0 0 50 50">
                    <circle
                      cx="25"
                      cy="25"
                      r="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="90, 150"
                      className="text-blue-600"
                    />
                  </svg>
                </motion.div>
              </div>
            </motion.div>
          )}

          {!isTabTransitioning && activeBoardTab === 'widgets' && (
             <motion.div 
               key="widgets"
               initial={false}
               animate={{ opacity: 1 }}
               transition={{ duration: 0 }}
               className="space-y-6 pt-4"
             >
                <div className="grid grid-cols-12 gap-6 auto-rows-max">
                  {pinnedWidgets.length === 0 ? (
                    <div className="col-span-12 flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                        <LayoutDashboard size={48} className="text-blue-500 opacity-20" />
                      </div>
                      <h3 className="text-2xl font-semibold tracking-tight text-slate-200">Whoops! Chưa có tiện ích nào ở đây :(</h3>
                      <p className="text-slate-400 mt-2 max-w-sm font-medium">Bấm chọn "Add widgets" để bắt đầu thêm các tiện ích vào bảng tiện ích</p>
                      <button 
                        onClick={() => {
                          setShowWidgetGallery(true);
                          localStorage.setItem("vplay_widgets_ever_opened", "true");
                        }}
                        className="mt-8 px-8 py-3 bg-[#00d2ff] hover:bg-[#00d2ff]/90 text-black rounded-lg font-normal tracking-tight shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <Plus size={18} className="stroke-[3] text-black" />
                        Add widgets
                      </button>
                    </div>
                  ) : (
                    pinnedWidgets.map((widget: any) => (
                      <WidgetWrapper
                        key={widget.id}
                        w={widget}
                        isDark={isDark}
                        location={weatherCity}
                        time={time}
                        onRemove={() => setPinnedWidgets((prev: any[]) => prev.filter(w => w.id !== widget.id))}
                        onLock={() => {
                          setPinnedWidgets((prev: any[]) => prev.map(w => {
                            if (w.id === widget.id) return { ...w, locked: !w.locked };
                            return w;
                          }));
                        }}
                        onMove={(dir: 'up' | 'down' | 'left' | 'right') => {
                          if (widget.locked) return;
                          setPinnedWidgets((prev: any[]) => {
                            const newArray = [...prev];
                            const idx = newArray.findIndex(w => w.id === widget.id);
                            if (idx === -1) return prev;
                            
                            let targetIdx = idx;
                            if (dir === 'left' || dir === 'up') targetIdx = Math.max(0, idx - 1);
                            if (dir === 'right' || dir === 'down') targetIdx = Math.min(newArray.length - 1, idx + 1);
                            
                            if (targetIdx !== idx) {
                              const [moved] = newArray.splice(idx, 1);
                              newArray.splice(targetIdx, 0, moved);
                            }
                            return newArray;
                          });
                        }}
                        onResize={() => {
                          if (widget.locked) return;
                          setPinnedWidgets((prev: any[]) => prev.map(w => {
                            if (w.id === widget.id) {
                              const sizes = ['2x2', '4x4', '6x6'];
                              const currentIdx = sizes.indexOf(w.size || '2x2');
                              const nextSize = sizes[(currentIdx + 1) % sizes.length];
                              return { ...w, size: nextSize };
                            }
                            return w;
                          }));
                        }}
                        addNotification={addNotification}
                        notifications={notifications}
                        history={history}
                        onAction={onAction}
                        onNavigate={onNavigate}
                        channels={channels}
                        widgetsFeedTreatment={widgetsFeedTreatment}
                        featureFlags={featureFlags}
                      />
                    ))
                  )}
                </div>
             </motion.div>
          )}

          {!isTabTransitioning && activeBoardTab === 'feed' && (
             <motion.div 
               key="feed"
               initial={false}
               animate={{ opacity: 1 }}
               transition={{ duration: 0 }}
               className="flex flex-col gap-6"
             >
                {[
                  { title: "Vplay Canary SMR26 - Hệ thống ổn định hơn 30%", time: "10m", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80", cat: "Technology" },
                  { title: "Ra mắt Console 'Operate for me' mới trong Build 2026.05", time: "1h", img: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=400&q=80", cat: "Updates" },
                  { title: "Sửa lỗi Hardware Acceleration cho các thiết bị yếu", time: "2h", img: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80", cat: "Entertainment" }
                ].map((item, i) => (
                   <div key={`board-news-${i}`} className="cursor-pointer group flex gap-5 p-4 rounded-2xl transition-all hover:bg-white/5">
                      <div className="w-28 h-28 rounded-2xl overflow-hidden shrink-0 shadow-2xl ring-1 ring-white/5">
                         <img src={item.img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                      </div>
                      <div className="flex flex-col justify-between py-1">
                         <div>
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-400 mb-2 block">{item.cat}</span>
                            <p className="text-base font-semibold tracking-tight leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors">{item.title}</p>
                         </div>
                         <div className="flex items-center gap-2">
                            <Clock size={10} className="opacity-40" />
                            <span className="text-[11px] opacity-40 font-semibold uppercase tracking-widest">{item.time} ago</span>
                         </div>
                      </div>
                   </div>
                ))}
                <button className="w-full py-4 rounded-2xl border border-dashed border-current opacity-10 hover:opacity-100 transition-opacity text-[11px] font-semibold uppercase tracking-[0.4em] mt-6">Explore more content</button>
             </motion.div>
          )}

          {!isTabTransitioning && activeBoardTab === 'doforme' && (
             <motion.div 
               key="doforme"
               initial={false}
               animate={{ opacity: 1 }}
               transition={{ duration: 0 }}
               className={`flex-1 flex flex-col min-h-0 text-white rounded-none overflow-hidden ${isUpdated ? "bg-transparent border-none" : "bg-[#1c1c1c] border border-white/5 shadow-2xl"} full-page-tab`}
             >
               <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-950/25">
                        <Terminal size={20} />
                     </div>
                     <div>
                       <h3 className="text-xl font-bold tracking-tight text-white">Operate for me</h3>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Automation & System Console</p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <button className="p-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all text-slate-300 hover:text-white" title="Settings"><Settings size={18} /></button>
                     <button className="p-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all text-slate-300 hover:text-white" title="Refresh"><RefreshCw size={18} /></button>
                  </div>
               </div>

               <div className="flex-1 flex flex-col min-h-0">
                  {activeDoForMeSubView ? (
                    <div className="flex-1 overflow-auto custom-scrollbar p-6 bg-black/10 animate-in fade-in zoom-in-95 duration-200">
                       <div className="max-w-4xl mx-auto">
                          {activeDoForMeSubView === 'speak_for_me' && <SpeakForMeContent isDark={isDark} />}
                          {activeDoForMeSubView === 'copy_for_me' && <CopyForMeContent />}
                          {activeDoForMeSubView === 'capture_for_me' && <CaptureForMeContent />}
                          {activeDoForMeSubView === 'screen_recorder' && <RecordForMeContent featureFlags={featureFlags} />}
                          {activeDoForMeSubView === 'play_for_me' && <PlayForMeContent isDark={isDark} liquidGlass={liquidGlass} featureFlags={featureFlags} />}
                          {activeDoForMeSubView === 'about_do_stuff' && <AboutDoStuffContent />}
                          {activeDoForMeSubView === 'gemini' && <GeminiWindowContent />}
                       </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col md:flex-row min-h-0 divide-x divide-white/5">
                      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                        {isDev && (
                          <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl self-start border border-white/5 mb-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setOperateTabSection('tools')}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                operateTabSection === 'tools'
                                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/10"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              Automation Tools
                            </button>
                            <button
                              type="button"
                              onClick={() => setOperateTabSection('dev')}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                operateTabSection === 'dev'
                                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/10"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              Dev Console
                            </button>
                          </div>
                        )}

                        {isDev && operateTabSection === 'dev' ? (
                          <div className="space-y-6">
                            <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex flex-col gap-1">
                               <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono">Dev Options Console</h4>
                               <p className="text-[10px] text-slate-400 font-medium">Canary Build Platform Settings - Click any card option to trigger developer configurations.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {[
                                { id: 'trigger_oobe', label: 'Trigger OOBE', desc: 'Khởi chạy lại màn hình cấu hình OOBE thiết lập đầu.' },
                                { id: 'unlimited_vpoints', label: 'Unlimited Vpoints', desc: 'Bật Vpoints vô hạn (hiển thị biểu tượng vô cực ∞).' },
                                { id: 'custom_vpoints', label: 'Custom Vpoints', desc: 'Điều chỉnh số lượng Vpoints tùy ý không giới hạn.' },
                                { id: 'purchase_all_store_widgets', label: 'Purchase all store widgets', desc: 'Có đầy đủ mọi tiện ích Vstore không cần trả phí.' },
                                { id: 'pin_all_widgets_to_feed', label: 'Pin all widgets to feed', desc: 'Ghim sạch mọi widgets có sẵn vào trang Feed hiện tại.' },
                                { id: 'unpin_all_widgets_from_feed', label: 'Unpin all widgets from feed', desc: 'Gỡ ghim toàn bộ tất cả widgets khỏi trang Feed.' },
                                { id: 'reset_vstore', label: 'Reset Vstore', desc: 'Đặt lại Vstore về mặc định (Lịch sử thanh toán & 100 VP).' },
                                { id: 'reset_widgets_feed', label: 'Reset Widgets Feed', desc: 'Trở lại danh sách ghim Feed setup mặc định nhà máy.' },
                                { id: 'respring_data', label: 'Respring Data', desc: 'Dẫn tới màn hình chờ please wait vĩnh viễn (bypass qua mã 3667).' },
                                { id: 'erase_data', label: 'Respring Canary', desc: 'Mở tiến trình respring khôi phục dữ liệu hệ thống (Respring/Backup UI).' }
                              ].map(opt => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => handleDevOptionClick(opt.id, opt.label)}
                                  className="p-5 rounded-[24px] border text-left flex flex-col justify-between h-40 transition-all bg-white/5 border-white/5 hover:bg-white/10 hover:border-rose-500/30 hover:-translate-y-0.5 active:scale-95 group shadow-lg cursor-pointer"
                                >
                                  <div className="space-y-1.5 animate-fade-in">
                                    <span className="font-bold text-sm tracking-tight text-white group-hover:text-rose-400 transition-colors">{opt.label}</span>
                                    <p className="text-xs text-slate-400 leading-relaxed font-semibold">{opt.desc}</p>
                                  </div>
                                  <div className="text-[10px] font-black tracking-widest uppercase text-rose-500/70 group-hover:opacity-100 flex items-center gap-1.5 self-end transition-colors group-hover:text-rose-400">
                                    <span>Activate</span>
                                    <ArrowRight size={12} />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {[
                                 { id: "speak_for_me", name: "Speak for me", icon: Mic, action: "speak_for_me", desc: "Giọng nói AI thông minh.", color: "bg-blue-500" },
                                 { id: "copy_for_me", name: "Copy for me", icon: Clipboard, action: "copy_for_me", desc: "Trích xuất dữ liệu tự động.", color: "bg-emerald-500" },
                                 { id: "capture_for_me", name: "Capture for me", icon: Camera, action: "capture_for_me", desc: "Phân tích ảnh màn hình.", color: "bg-orange-500" },
                                 { id: "screen_recorder", name: "Record for me", icon: Video, action: "screen_recorder", desc: "Quay video chất lượng cao.", color: "bg-red-500" },
                                 { id: "narrator", name: "Narrate for me", icon: MessageSquare, action: "narrator", desc: "Đọc to nội dung màn hình.", color: "bg-indigo-500" }
                              ].map((tool, i) => {
                                 const isPinned = pinnedDoForMeFeatures.includes(tool.id);
                                 return (
                                   <div key={i} className="relative group">
                                     <button 
                                        onClick={() => onAIToolsAction(tool.action)}
                                        className="w-full p-5 rounded-[24px] bg-white/5 border border-white/5 shadow-sm hover:shadow-md hover:bg-white/10 hover:-translate-y-0.5 transition-all flex flex-col text-left gap-3 group overflow-hidden cursor-pointer"
                                     >
                                        <div className={`w-10 h-10 rounded-xl ${tool.color} flex items-center justify-center text-white scale-100 group-hover:scale-110 transition-transform shadow-lg`}>
                                           <tool.icon size={20} />
                                        </div>
                                        <div>
                                           <h4 className="text-xs font-bold tracking-tight text-white group-hover:text-purple-400 transition-colors">{tool.name}</h4>
                                           <p className="text-[10px] text-slate-400 font-medium mt-1 leading-tight">{tool.desc}</p>
                                        </div>
                                     </button>
                                     <button 
                                       onClick={(e) => { e.stopPropagation(); togglePinFeature(tool.id); }}
                                       className={`absolute top-4 right-4 p-2 rounded-full transition-all z-10 ${isPinned ? "bg-amber-500/20 text-amber-400 opacity-100" : "bg-white/5 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-200"}`}
                                     >
                                       <Pin size={12} fill={isPinned ? "currentColor" : "none"} />
                                     </button>
                                   </div>
                                 );
                              })}
                            </div>

                            <div className="mt-4 p-6 rounded-[32px] bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-xl shadow-purple-950/20 pb-8">
                               <div className="flex items-center gap-3 mb-4">
                                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                     <Sparkles size={20} />
                                  </div>
                                  <div>
                                     <h4 className="font-bold tracking-tight">AI Intelligent Agent</h4>
                                     <p className="text-[10px] opacity-70 font-medium">Sẵn sàng hỗ trợ mọi tác vụ của bạn.</p>
                                  </div>
                               </div>
                               <button 
                                 type="button"
                                 onClick={() => onAIToolsAction('gemini')}
                                 className="w-full py-3 bg-white text-purple-700 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all cursor-pointer"
                               >
                                 Launch Gemini Pro
                               </button>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="w-full md:w-[320px] bg-black/15 flex flex-col min-h-0">
                         <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <Terminal size={14} className="text-purple-400" />
                               <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">Operator Console v1.0.1</span>
                            </div>
                            <div className="flex gap-1.5">
                               <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                               <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
                               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20" />
                            </div>
                          </div>
                          <div className="flex-1 p-6 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col gap-1.5 scroll-smooth">
                             {operatorLogs.map((log, i) => (
                                <div key={`log-${i}`} className={`text-[11px] font-mono ${log.startsWith('>') ? 'text-purple-400' : log.includes('Error') ? 'text-red-400' : 'text-slate-400'}`}>
                                   {log}
                                </div>
                             ))}
                             <div id="operator-scroll-anchor" />
                          </div>
                          <form onSubmit={handleOperatorCommand} className="p-4 bg-black/30 border-t border-white/5 flex items-center gap-3">
                             <ChevronRight size={14} className="text-slate-400 shrink-0" />
                             <input 
                               autoFocus
                               type="text" 
                               placeholder="Enter command..." 
                               className="bg-transparent border-none outline-none text-[11px] text-white w-full font-mono placeholder:opacity-40"
                               value={operatorCommand}
                               onChange={(e) => setOperatorCommand(e.target.value)}
                             />
                          </form>
                       </div>
                     </div>
                   )}
                </div>
              </motion.div>
           )}

           {false && (
              <motion.div 
                key="pizza"
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0 }}
                className="w-full p-8 rounded-none border border-white/5 shadow-xl text-left bg-[#1c1c1c] text-white overflow-hidden"
              >
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-600 flex items-center justify-center">
                      <Pizza size={24} />
                    </div>
                    <div>
                      <h3 className={`font-bold text-xl ${isDark ? "text-white" : "text-slate-900"}`}>Pizza Experiments</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Beta features & Experimental labs</p>
                    </div>
                  </div>

                  <div className={`p-6 rounded-3xl border mb-6 ${isDark ? "bg-red-500/5 border-red-500/10" : "bg-red-50 border-red-200"} flex flex-col sm:flex-row items-center justify-between gap-4`}>
                    <div className="flex items-center gap-3">
                       <div className="p-2 w-10 h-10 rounded-xl bg-red-400/10 text-red-400 flex items-center justify-center">
                          <RefreshCw size={18} />
                       </div>
                       <div>
                          <h4 className="font-bold text-sm text-left text-white leading-none">Canary Reset Option</h4>
                          <p className="text-[10px] text-red-400/80 font-semibold mt-1">Simulate or reset widgets feed update onboarding</p>
                       </div>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.removeItem("vplay_widgets_updated_canary");
                        setIsWidgetsUpdated(false);
                        addNotification?.("Canary Lab", "Reset widgets update state! Re-open widgets board to see the update screen.", "success");
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 duration-100 shrink-0"
                    >
                      Reset Board Update
                    </button>
                  </div>
                  
                  <ExperimentalContent 
                    isDark={isDark} 
                    featureFlags={featureFlags} 
                    hideHeader={true}
                    setFeatureFlags={(f: any, id: string, name: string, val: boolean) => {
                      setFeatureFlags(f);
                      localStorage.setItem("vplay_feature_flags", JSON.stringify(f));
                      if (name) {
                        addNotification?.("Thử nghiệm", `${val ? 'Bật' : 'Tắt'} flag: ${name}`, 'success');
                      }
                    }} 
                  />
                  
                  <div className="mt-8 pt-8 border-t border-black/5 space-y-4">
                     <div className={`p-8 rounded-[32px] border ${isDark ? "bg-amber-500/5 border-amber-500/10" : "bg-amber-50 border-amber-200 shadow-xl shadow-amber-100/10"}`}>
                       <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                             <LayoutGrid size={20} />
                          </div>
                          <div>
                             <h4 className={`font-bold text-sm text-left ${isDark ? "text-white" : "text-slate-900"}`}>Widgets Feed Treatments</h4>
                             <p className="text-[10px] text-amber-600/70 font-bold uppercase mt-0.5">Custom layout rendering variants</p>
                          </div>
                       </div>

                       <div className="relative group">
                         <select 
                           value={widgetsFeedTreatment}
                           onChange={(e) => {
                             const val = parseInt(e.target.value);
                             setWidgetsFeedTreatment(val);
                             localStorage.setItem("vplay_widgets_feed_treatment", val.toString());
                           }}
                           className={`w-full p-4 pr-10 rounded-2xl border appearance-none transition-all cursor-pointer font-bold text-sm ${
                             isDark ? "bg-black/40 border-amber-500/25 text-white focus:ring-amber-500" : "bg-white border-amber-200 text-slate-800 focus:ring-amber-500"
                           }`}
                         >
                           <option value={1}>Treatment 1: Navigation sidebar (Default)</option>
                           <option value={2}>Treatment 2: Top navigation (Giống với option hide widgets sidebar)</option>
                           <option value={3}>Treatment 3: Float sidebar (Layout giống hình 1)</option>
                           <option value={4}>Treatment 4: More collapse (Hẹp hơn giống hình 2)</option>
                           <option value={5}>Treatment 5: Extremely rounded (Bo cong giống hình 3)</option>
                         </select>
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                           <ChevronDown size={16} />
                         </div>
                       </div>
                     </div>
                  </div>
              </motion.div>
           )}

                      {!isTabTransitioning && activeBoardTab === 'settings' && (() => {
            const isDark = true;
            const filteredCategories = [
              { id: 'system_settings', name: 'System and Developer Settings', desc: 'Cài đặt hệ thống nâng cao và cấu hình chế độ nhà phát triển', icon: Settings },
              { id: 'account', name: 'Tài khoản', desc: 'Quản lý hồ sơ và tài khoản Vplay', icon: User },
              { id: 'appearance', name: 'Chủ đề và Giao diện', desc: 'Tùy biến giao diện và trải nghiệm người dùng theo ý thích', icon: Palette },
              { id: 'topbar', name: 'Topbar (Desktop mode only)', desc: 'Tùy chỉnh các tính năng và hành vi của thanh điều hướng trên', icon: PanelTop },
              { id: 'sidebar', name: 'Sidebar (Desktop mode only)', desc: 'Tùy chỉnh các tính năng và hành vi của thanh điều hướng bên', icon: Columns },
              { id: 'floatbar', name: 'Floatbar (Touch mode only)', desc: 'Tùy chỉnh các tính năng và hành vi của thanh điều hướng dưới', icon: LayoutGrid },
              { id: 'widgets_board', name: 'Widgets board', desc: 'Tùy chỉnh các tính năng và hành vi của bảng tiện ích', icon: Pizza },
              { id: 'experiments', name: 'Experimental Features', desc: 'Trải nghiệm sớm các tính năng mới sắp ra mắt của Vplay', icon: Flask }
            ].filter(cat => 
              cat.name.toLowerCase().includes(settingSearchQuery.toLowerCase()) || 
              cat.desc.toLowerCase().includes(settingSearchQuery.toLowerCase())
            );

            const renderSelectedCategoryContent = () => {
              const matchesSearch = (text: string) => {
                if (!settingSearchQuery) return true;
                return text.toLowerCase().includes(settingSearchQuery.toLowerCase());
              };

              return (
                <div className="space-y-12 pb-24 text-white text-left">
                  {/* General info cards: only show if query is blank or matches */}
                  {matchesSearch("about vplay feedback") && (
                    <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                       {/* About Card */}
                       <div className={`p-8 rounded-[40px] border flex-1 relative overflow-hidden transition-all ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                          <h4 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>About Vplay by VNRT</h4>
                          <div className="space-y-1 text-left">
                             <div className="flex items-center gap-12">
                                <span className="text-sm font-medium opacity-60">Branch:</span>
                                <span className="text-sm font-bold text-orange-600">Canary</span>
                             </div>
                             <div className="flex items-center gap-12">
                                <span className="text-sm font-medium opacity-60">Build:</span>
                                <span className="text-sm font-bold">Nx626</span>
                             </div>
                             <div className="flex items-center gap-8">
                                <span className="text-sm font-medium opacity-60">Compiled:</span>
                                <span className="text-sm font-bold">2026</span>
                             </div>
                          </div>
                       </div>

                       {/* Feedback Card */}
                       <div 
                          onClick={() => {
                             onFeedbackClick?.();
                             setShowWidgets(false);
                          }}
                          className={`p-8 rounded-[40px] border flex-1 flex items-center gap-6 relative overflow-hidden transition-all cursor-pointer ${isDark ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-white border-black/5 hover:bg-slate-50 shadow-xl shadow-slate-100"}`}
                       >
                          <div className="p-3 rounded-2xl bg-current opacity-10" />
                          <div className="flex-1 text-left">
                             <div className="flex items-center gap-3 mb-1">
                                <ExternalLink size={20} className={isDark ? "text-white" : "text-slate-900"} />
                                <h4 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Give Feedback!</h4>
                             </div>
                             <p className="text-xs opacity-50 leading-relaxed font-medium">Hãy giúp chúng tôi cải thiện Vplay. Chúng tôi luôn lắng nghe ý kiến của bạn</p>
                          </div>
                       </div>

                       {/* Logo Section */}
                       <div className="hidden lg:flex items-center justify-center px-8">
                          <img src={vplayLogo} alt="Vplay" className="h-24 object-contain filter drop-shadow-2xl" />
                       </div>
                    </div>
                  )}

                  {/* SECTION 1: USER ACCOUNT */}
                  {(matchesSearch("hồ sơ tài khoản đăng nhập guest khách cloud sync") || matchesSearch("account user profile")) && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 px-2">
                        <User className="text-blue-500" size={20} />
                        <h4 className="text-sm font-bold uppercase tracking-wider opacity-60">Hồ sơ & Tài khoản</h4>
                      </div>
                      <div className={`p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                        <div className="flex flex-col items-center justify-center text-center gap-4 py-4">
                          <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 relative overflow-hidden group ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"}`}>
                            {user?.photoURL ? (
                              <img src={user.photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User className="w-12 h-12 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xl font-bold">{user?.displayName || user?.email?.split('@')[0] || "Khách (Guest)"}</h4>
                            <p className="text-sm opacity-55 mt-1">{user?.email || "Chưa hoàn tất thiết lập hồ sơ đăng nhập"}</p>
                          </div>
                          
                          {!user ? (
                            <button 
                              type="button"
                              onClick={onLogin}
                              className="mt-4 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold tracking-tight shadow-xl shadow-blue-500/20 active:scale-95 transition-all w-full max-w-xs"
                            >
                              Đăng nhập đồng bộ dữ liệu
                            </button>
                          ) : (
                            <div className="space-y-2 w-full max-w-sm">
                              <div className={`p-3 rounded-xl text-xs font-mono border ${isDark ? "bg-black/40 border-white/5 text-amber-400" : "bg-orange-50/50 border-orange-100 text-orange-600"} text-center`}>
                                Hệ thống tài khoản Cloud sync đang hoạt động ổn định
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION 2: DEVELOPER SWITCH */}
                  {(matchesSearch("developer mode nhà phát triển menu dev keypass") || matchesSearch("developer mode")) && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 px-2">
                        <ShieldAlert className="text-rose-500" size={20} />
                        <h4 className="text-sm font-bold uppercase tracking-wider opacity-60">System & Developers</h4>
                      </div>
                      
                      {/* Developer Mode switch */}
                      <div className={`p-8 rounded-[40px] border flex flex-col transition-all w-full ${isDark ? "border-white/5 bg-white/5" : "border-black/5 bg-white shadow-xl shadow-slate-200/50"}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${isDev ? "bg-rose-500/10 text-rose-500" : "bg-slate-500/10 text-slate-500"}`}>
                              <ShieldAlert size={24} />
                            </div>
                            <div className="text-left">
                              <h3 className={`font-semibold text-xl tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>Developer Mode</h3>
                              <p className="text-xs text-slate-400 font-medium tracking-wide leading-relaxed mt-0.5 font-sans">Kích hoạt chế độ nhà phát triển và hiển thị menu 'Dev'</p>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              const nextVal = !isDev;
                              setIsDev(nextVal);
                              localStorage.setItem("vplay_dev_mode", nextVal.toString());
                              if (onAlert) {
                                onAlert(
                                  "Developer Mode", 
                                  nextVal ? "Chế độ nhà phát triển đã được KÍCH HOẠT. Hãy kiểm tra thanh bên Board tiện ích." : "Chế độ nhà phát triển đã bị vô hiệu hóa."
                                );
                              }
                            }}
                            className={`w-12 h-6 rounded-full relative p-1 transition-colors shrink-0 ${isDev ? "bg-rose-600" : "bg-slate-400"}`}
                          >
                            <span className="sr-only">Toggle Dev Mode</span>
                            <div className={`w-4 h-4 rounded-full bg-white transition-all shadow-sm ${isDev ? "translate-x-6" : "translate-x-0"}`} />
                          </button>
                        </div>
                      </div>

                      {/* Force Launch and Factory Reset (only if Dev is on) */}
                      {isDev && (
                        <div className={`p-8 rounded-[32px] border transition-all ${isDark ? "border-white/5 bg-white/5" : "border-black/5 bg-white shadow-xl shadow-slate-200/50"}`}>
                          <div className="flex items-center gap-4 mb-6 text-left">
                            <div className="p-3 rounded-2xl bg-red-500/10 text-red-500">
                              <ShieldAlert size={24} />
                            </div>
                            <div>
                              <h3 className={`font-semibold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>Developer & System Settings</h3>
                              <p className="text-xs text-slate-500">Special tools to debug or factory reset Vplay</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button 
                              type="button"
                              onClick={() => {
                                const newFlags = { ...featureFlags, xaml_oobe_force: !featureFlags.xaml_oobe_force };
                                setFeatureFlags(newFlags);
                                localStorage.setItem("vplay_feature_flags", JSON.stringify(newFlags));
                              }}
                              className={`p-4 rounded-[24px] border flex items-center justify-between gap-4 transition-all ${isDark ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`}
                            >
                               <div className="text-left font-sans">
                                  <span className="font-bold text-xs">Force Launch OOBE</span>
                                  <p className="text-[10px] opacity-40">Bật OOBE khi khởi động</p>
                               </div>
                               <div className={`w-10 h-5 rounded-full relative transition-all ${featureFlags.xaml_oobe_force ? "bg-red-500" : "bg-slate-700"}`}>
                                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${featureFlags.xaml_oobe_force ? "left-5.5" : "left-0.5"}`} />
                               </div>
                            </button>

                            <button 
                              type="button"
                              onClick={() => {
                                onAlert("Resetting", "All settings and local data will be wiped.");
                                const wasDev = localStorage.getItem("vplay_dev_mode") === "true";
                                localStorage.clear();
                                if (wasDev) localStorage.setItem("vplay_dev_mode", "true");
                                window.location.reload();
                              }}
                              className={`p-4 rounded-[24px] border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 text-red-500 flex items-center justify-between gap-4 transition-all`}
                            >
                               <div className="text-left">
                                  <span className="font-bold text-xs text-red-500">Factory Reset</span>
                                  <p className="text-[10px] opacity-60">Xóa sạch toàn bộ dữ liệu</p>
                                </div>
                               <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SECTION 3: THEME & PERSONALIZATION */}
                  {(matchesSearch("giao diện sáng tối liquid glass theme") || matchesSearch("giao diện & chủ đề")) && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 px-2">
                        <Palette className="text-purple-500" size={20} />
                        <h4 className="text-sm font-bold uppercase tracking-wider opacity-60">Giao diện & Cá nhân hóa</h4>
                      </div>

                      {/* Theme selection */}
                      <div className={`p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                        <div className="text-left mb-6">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Chủ đề hệ thống</span>
                          <p className="text-xs text-slate-400 font-medium font-sans">Thay đổi tông màu của trình phát nhạc và giao diện tổng thể</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            type="button"
                            onClick={() => setIsDark(false)}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${!isDark ? "bg-blue-600 border-blue-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}
                          >
                            <div className="flex items-center gap-3">
                              <Sun size={18} className="text-amber-500" />
                              <span className="text-xs font-bold">Chế độ Sáng (Light)</span>
                            </div>
                            {!isDark && <CheckCircle2 size={16} className="text-white" />}
                          </button>
                          <button 
                            type="button"
                            onClick={() => setIsDark(true)}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${isDark ? "bg-blue-600 border-blue-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}
                          >
                            <div className="flex items-center gap-3">
                              <Moon size={18} className="text-blue-500" />
                              <span className="text-xs font-bold">Chế độ Tối (Dark)</span>
                            </div>
                            {isDark && <CheckCircle2 size={16} className="text-white" />}
                          </button>
                        </div>
                      </div>

                      {/* Liquid Glass select */}
                      <div className={`p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                        <div className="text-left mb-6">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1 font-sans">Liquid Glass Effect</span>
                          <p className="text-xs text-slate-400 font-medium">Sử dụng bộ lọc mờ kính thủy tinh động ảo diệu cho Floatbar</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            type="button"
                            onClick={() => setLiquidGlass("glassy")}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${liquidGlass === "glassy" ? "bg-purple-600 border-purple-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}
                          >
                            <div className="flex items-center gap-3">
                              <Droplet size={18} className="text-purple-400" />
                              <span className="text-xs font-bold">Glassy (Kính mờ)</span>
                            </div>
                            {liquidGlass === "glassy" && <CheckCircle2 size={16} className="text-white" />}
                          </button>
                          <button 
                            type="button"
                            onClick={() => setLiquidGlass("tinted")}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${liquidGlass === "tinted" ? "bg-purple-600 border-purple-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-lg bg-teal-500/20 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-teal-500" />
                              </div>
                              <span className="text-xs font-bold">Tinted (Điểm màu)</span>
                            </div>
                            {liquidGlass === "tinted" && <CheckCircle2 size={16} className="text-white" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION 4: DESKTOP WALLPAPER */}
                  {(matchesSearch("hình nền background desktop wallpaper flow light dark canary solid color gradient cosmic sunset") || matchesSearch("desktop wallpaper")) && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 px-2">
                        <ImageIcon className="text-amber-500" size={20} />
                        <h4 className="text-sm font-bold uppercase tracking-wider opacity-60">Hình nền không gian làm việc (Wallpaper)</h4>
                      </div>

                      <div className={`p-8 rounded-[40px] border flex flex-col transition-all w-full ${isDark ? "border-white/5 bg-white/5" : "border-black/5 bg-white shadow-xl shadow-slate-200/50"}`}>
                        <div className="flex gap-2 p-1 bg-black/5 rounded-2xl w-fit mb-8">
                          {[
                            { id: 'preset', name: 'Preset Wallpapers' },
                            { id: 'solid', name: 'Solid Color' },
                            { id: 'gradient', name: 'Gradient Color' }
                          ].map(type => (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => {
                                setWallpaperType(type.id as any);
                                localStorage.setItem("vplay_wallpaper_type", type.id);
                              }}
                              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${wallpaperType === type.id ? "bg-white text-black shadow-lg" : "text-slate-400 hover:text-white"}`}
                            >
                              {type.name}
                            </button>
                          ))}
                        </div>

                        {wallpaperType === 'preset' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                              { id: 'flow_light', name: 'Flow Light', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=2000&auto=format&fit=crop' },
                              { id: 'flow_dark', name: 'Material Blue', url: 'https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=2000&auto=format&fit=crop' },
                              { id: 'canary_lake', name: 'Canary Lake', url: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=2000&auto=format&fit=crop' }
                            ].map(p => (
                              <button 
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setDesktopWallpaper(p.url);
                                  localStorage.setItem("vplay_desktop_wallpaper", p.url);
                                }}
                                className={`group relative p-2 rounded-2xl border overflow-hidden transition-all hover:scale-[1.02] text-left ${desktopWallpaper === p.url ? "border-blue-500 bg-blue-500/5 ring-4 ring-blue-500/10" : "border-white/5 bg-white/5 hover:bg-white/10"}`}
                              >
                                <div className="aspect-video w-full rounded-xl overflow-hidden mb-2 relative">
                                  <img src={p.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  {desktopWallpaper === p.url && (
                                    <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center backdrop-blur-sm">
                                      <CheckCircle2 className="text-white" size={32} />
                                    </div>
                                  )}
                                </div>
                                <span className="text-[11px] font-bold block text-center truncate">{p.name}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {wallpaperType === 'solid' && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl">
                              <input 
                                type="color" 
                                value={solidColor}
                                onChange={(e) => {
                                  setSolidColor(e.target.value);
                                  localStorage.setItem("vplay_wallpaper_solid_color", e.target.value);
                                }}
                                className="w-12 h-12 rounded-xl border-2 border-white/10 bg-transparent cursor-pointer"
                              />
                              <div className="text-left">
                                <p className="font-mono text-sm font-bold uppercase">{solidColor}</p>
                                <p className="text-[10px] opacity-40">Pick a custom solid color</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 flex-row">
                              {['#0b0b0b', '#1a1a1a', '#2d3436', '#0984e3', '#6c5ce7', '#d63031', '#e17055', '#f8fafc'].map(c => (
                                <button 
                                  key={c}
                                  type="button"
                                  onClick={() => {
                                    setSolidColor(c);
                                    localStorage.setItem("vplay_wallpaper_solid_color", c);
                                  }}
                                  className="w-8 h-8 rounded-full border border-white/20 transition-all hover:scale-110"
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {wallpaperType === 'gradient' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-3 bg-black/20 p-3 rounded-2xl text-left">
                                <input 
                                  type="color" 
                                  value={gradientColors[0]}
                                  onChange={(e) => {
                                    const next: [string, string] = [e.target.value, gradientColors[1]];
                                    setGradientColors(next);
                                    localStorage.setItem("vplay_wallpaper_gradient_colors", JSON.stringify(next));
                                  }}
                                  className="w-10 h-10 rounded-xl"
                                />
                                <span className="font-mono text-xs font-bold uppercase">{gradientColors[0]}</span>
                              </div>
                              <div className="flex items-center gap-3 bg-black/20 p-3 rounded-2xl text-left">
                                <input 
                                  type="color" 
                                  value={gradientColors[1]}
                                  onChange={(e) => {
                                    const next: [string, string] = [gradientColors[0], e.target.value];
                                    setGradientColors(next);
                                    localStorage.setItem("vplay_wallpaper_gradient_colors", JSON.stringify(next));
                                  }}
                                  className="w-10 h-10 rounded-xl"
                                />
                                <span className="font-mono text-xs font-bold uppercase">{gradientColors[1]}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { n: 'Cosmic', c: ['#2d0b3b', '#1a0525'] },
                                { n: 'Ocean', c: ['#00d2ff', '#3a7bd5'] },
                                { n: 'Sunset', c: ['#f83600', '#f9d423'] }
                              ].map(g => (
                                <button
                                  key={g.n}
                                  type="button"
                                  onClick={() => {
                                    const next: [string, string] = [g.c[0], g.c[1]];
                                    setGradientColors(next);
                                    localStorage.setItem("vplay_wallpaper_gradient_colors", JSON.stringify(next));
                                  }}
                                  className="flex items-center gap-2 p-2 rounded-xl bg-black/25 hover:bg-black/40 transition-all text-left"
                                >
                                  <div className="w-6 h-6 rounded-full shadow-lg shrink-0" style={{ background: `linear-gradient(135deg, ${g.c[0]} 0%, ${g.c[1]} 100%)` }} />
                                  <span className="text-[10px] font-bold uppercase truncate">{g.n}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SECTION 5: TOPBAR & SEARCH BOX */}
                  {(matchesSearch("vị trí topbar sidebar search box position thanh điều hướng trên") || matchesSearch("topbar search")) && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 px-2">
                        <PanelTop className="text-cyan-500" size={20} />
                        <h4 className="text-sm font-bold uppercase tracking-wider opacity-60">Topbar (Desktop mode only)</h4>
                      </div>
                      <div className={`p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                        <div className="text-left mb-6 font-sans">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Search box position</span>
                          <p className="text-xs text-slate-400 font-medium">Chọn nơi hiển thị thanh tìm kiếm kênh trên giao diện Desktop</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pb-2">
                          <button 
                            type="button"
                            onClick={() => setSearchBoxPosition("sidebar")}
                            className={`p-4 rounded-xl border transition-all flex flex-col gap-2 text-left ${searchBoxPosition === "sidebar" ? "bg-blue-600 border-blue-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}
                          >
                            <LayoutDashboard size={20} className={searchBoxPosition === "sidebar" ? "text-white" : "text-slate-400"} />
                            <span className="text-xs font-bold">Show inside sidebar</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => setSearchBoxPosition("top")}
                            className={`p-4 rounded-xl border transition-all flex flex-col gap-2 text-left ${searchBoxPosition === "top" ? "bg-purple-600 border-purple-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}
                          >
                            <div className="h-4 w-12 rounded border border-current opacity-60 flex items-center justify-center text-[8px] uppercase font-black">TOP</div>
                            <span className="text-xs font-bold">Show inside Top bar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION 6: SIDEBAR CONFIGURATION */}
                  {(matchesSearch("sidebar trái phải pinned channel shortcuts sidebar positioning pin") || matchesSearch("sidebar pinning")) && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 px-2">
                        <Columns className="text-purple-500" size={20} />
                        <h4 className="text-sm font-bold uppercase tracking-wider opacity-60">Sidebar (Desktop mode only)</h4>
                      </div>

                      {/* Side positioning */}
                      <div className={`p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-3 text-left font-sans">Sidebar Positioning (LTR/RTL)</span>
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            type="button"
                            onClick={() => setIsSidebarRight(false)}
                            className={`p-4 rounded-xl border transition-all flex items-center justify-center gap-3 ${!isSidebarRight ? "bg-blue-600 border-blue-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}
                          >
                            <span className="text-xs font-bold">Trái (Left-side)</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => setIsSidebarRight(true)}
                            className={`p-4 rounded-xl border transition-all flex items-center justify-center gap-3 ${isSidebarRight ? "bg-blue-600 border-blue-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}
                          >
                            <span className="text-xs font-bold">Phải (Right-side)</span>
                          </button>
                        </div>
                      </div>

                      {/* Pin shortcut */}
                      <div className={`p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-3 text-left font-sans">Channel Pinning on Sidebar</span>
                        <button 
                          type="button"
                          onClick={() => setIsPinningEnabled(!isPinningEnabled)}
                          className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between ${isPinningEnabled ? "bg-purple-600 border-purple-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}
                        >
                          <div className="flex items-center gap-3">
                            <Pin size={18} className={isPinningEnabled ? "text-white" : "text-slate-400"} />
                            <span className="text-xs font-bold text-left">Hiện lối tắt kênh yêu thích trên sidebar</span>
                          </div>
                          <div className={`w-10 h-5 rounded-full relative transition-[background-color] ${isPinningEnabled ? "bg-white/20" : "bg-slate-700"}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isPinningEnabled ? "left-5.5" : "left-0.5"}`} />
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SECTION 7: NAVIGATION SHORTCUTS & INTERACTION */}
                  {(matchesSearch("touch floatbar navigation music control bảng phát nhạc") || matchesSearch("navigation shortcuts")) && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 px-2">
                        <LayoutGrid className="text-pink-500" size={20} />
                        <h4 className="text-sm font-bold uppercase tracking-wider opacity-60">Floatbar (Touch mode only)</h4>
                      </div>

                      <div className={`p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                        <div className="text-left font-sans">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Layout Platform Integration</span>
                          <p className="text-xs text-slate-400 font-medium mb-3">Chọn giữa các mô hình bố cục đáp ứng cho các kích thước màn hình</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <button 
                            type="button"
                            onClick={() => setUseSidebar(true)}
                            className={`p-4 rounded-xl border transition-all flex flex-col gap-2 text-left ${useSidebar ? "bg-blue-600 border-blue-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}
                          >
                            <Monitor size={20} />
                            <span className="text-xs font-bold">Desktop style (Sidebar)</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => setUseSidebar(false)}
                            className={`p-4 rounded-xl border transition-all flex flex-col gap-2 text-left ${!useSidebar ? "bg-blue-600 border-blue-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}
                          >
                            <MousePointer2 size={20} />
                            <span className="text-xs font-bold">Touch style (Floatbar)</span>
                          </button>
                        </div>
                        
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-3 text-left font-sans">Quick Navigation Shortcut</span>
                        <button 
                          type="button"
                          onClick={() => {
                            setActiveTab("Phát nhạc");
                            setShowWidgets(false);
                          }}
                          className={`w-full p-6 rounded-2xl border transition-all flex flex-col items-center justify-center gap-3 ${isDark ? "bg-white/5 border-white/10 hover:bg-white/20" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`}
                        >
                          <Music className="text-purple-500 animate-bounce" size={24} />
                          <span className="text-xs font-bold uppercase tracking-widest">Mở bảng điều khiển phát nhạc</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SECTION 8: WIDGET BOARD OPTIONS */}
                  {(matchesSearch("widgets theme board feed treatment hover badges calendar clock pin button đồng hồ") || matchesSearch("widgets board preferences")) && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 px-2">
                        <Pizza className="text-amber-500" size={20} />
                        <h4 className="text-sm font-bold uppercase tracking-wider opacity-60">Bảng điều khiển tiện ích (Widgets board)</h4>
                      </div>

                      {/* Feed theme */}
                      <div className={`p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/10" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                        <span className="text-[10px] font-semibold uppercase tracking-widest opacity-40 block mb-4 text-left font-sans">Widgets Feed Theme</span>
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            type="button"
                            onClick={() => {
                              setWidgetsTheme('light');
                              localStorage.setItem("vplay_widgets_theme", "light");
                            }}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${widgetsTheme === 'light' ? "border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/10" : "border-white/10"}`}
                          >
                            <div className="flex items-center gap-3">
                              <Sun size={18} className="text-orange-500" />
                              <span className="text-xs font-semibold">Light mode widgets</span>
                            </div>
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              setWidgetsTheme('dark');
                              localStorage.setItem("vplay_widgets_theme", "dark");
                            }}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${widgetsTheme === 'dark' ? "border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/10" : "border-white/10"}`}
                          >
                            <div className="flex items-center gap-3">
                              <Moon size={18} className="text-blue-500" />
                              <span className="text-xs font-semibold">Dark mode widgets</span>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Treatments selector */}
                      <div className={`p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                        <div className="text-left mb-4 font-sans">
                          <span className="text-[10px] font-semibold uppercase tracking-widest opacity-40 block mb-1">Widgets Feed Treatments</span>
                          <p className="text-xs text-slate-400 font-medium">Bố cục và độ cong đường bo viền của các widgets tương tác</p>
                        </div>
                        <div className="relative group text-left">
                          <select 
                            value={widgetsFeedTreatment}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setWidgetsFeedTreatment(val);
                              localStorage.setItem("vplay_widgets_feed_treatment", val.toString());
                            }}
                            className={`w-full p-4 pr-10 rounded-2xl border appearance-none transition-all cursor-pointer font-semibold text-sm ${
                              isDark ? "bg-black/45 border-white/10 text-white focus:ring-blue-500" : "bg-white border-black/10 text-slate-800 focus:ring-blue-500 shadow-sm"
                            }`}
                          >
                            <option value={1}>Treatment 1: Navigation sidebar (Default)</option>
                            <option value={2}>Treatment 2: Top navigation</option>
                            <option value={3}>Treatment 3: Float sidebar (Layout giống hình 1)</option>
                            <option value={4}>Treatment 4: More collapse (Hẹp hơn giống hình 2)</option>
                            <option value={5}>Treatment 5: Extremely rounded (Bo cong giống hình 3)</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                            <ChevronDown size={16} />
                          </div>
                        </div>
                      </div>

                      {/* Interactions lists */}
                      <div className={`p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                        <span className="text-[10px] font-semibold uppercase tracking-widest opacity-40 block mb-4 text-left font-sans">Dashboard Interactions</span>
                        <div className="space-y-4">
                          {[
                            {
                              label: "Open feed on hover",
                              desc: "Tự động mở khi hover chuột qua nút",
                              val: widgetSettings.openFeedOnHover,
                              action: () => setWidgetSettings({ ...widgetSettings, openFeedOnHover: !widgetSettings.openFeedOnHover })
                            },
                            {
                              label: "Show feed badges",
                              desc: "Hiển thị bong bóng chấm thông báo đỏ chưa đọc",
                              val: widgetSettings.showFeedBadges,
                              action: () => setWidgetSettings({ ...widgetSettings, showFeedBadges: !widgetSettings.showFeedBadges })
                            },
                            {
                              label: "Hide feed sidebar",
                              desc: "Ẩn các tabs danh mục dẹt cạnh lời chào trên board",
                              val: widgetSettings.hideFeedSidebar,
                              action: () => setWidgetSettings({ ...widgetSettings, hideFeedSidebar: !widgetSettings.hideFeedSidebar })
                            },
                            {
                              label: "Hiển thị lịch",
                              desc: "Hiện đồng bộ ngày tháng dương lịch dưới thanh tiêu đề chào",
                              val: widgetSettings.showCalendarInWidgets,
                              action: () => setWidgetSettings({ ...widgetSettings, showCalendarInWidgets: !widgetSettings.showCalendarInWidgets })
                            },
                            {
                              label: "Thu gọn nút 'Add widgets'",
                              desc: "Tự động đổi nút thêm to thành biểu tượng '+' nhỏ thời trang",
                              val: widgetSettings.collapsePinButton,
                              action: () => setWidgetSettings({ ...widgetSettings, collapsePinButton: !widgetSettings.collapsePinButton })
                            },
                            {
                              label: "Hiển thị đồng hồ",
                              desc: "Hiển thị đồng hồ số tích tắc tự động chạy thời gian thực",
                              val: widgetSettings.showClockInWidgets,
                              action: () => setWidgetSettings({ ...widgetSettings, showClockInWidgets: !widgetSettings.showClockInWidgets })
                            }
                          ].map(item => (
                            <div key={item.label} className="flex items-center justify-between border-b border-white/5 last:border-0 pb-3 last:pb-0">
                               <div className="text-left">
                                  <span className="text-xs font-semibold block">{item.label}</span>
                                  <span className="text-[10px] opacity-50 block font-sans">{item.desc}</span>
                               </div>
                               <div 
                                 onClick={item.action}
                                 className={`w-10 h-5 rounded-full relative cursor-pointer p-0.5 transition-all shrink-0 ${item.val ? "bg-blue-600" : "bg-slate-700"}`}
                               >
                                 <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${item.val ? "left-5.5" : "left-0.5"}`} />
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION 9: LABS & EXPERIMENTS */}
                  {(matchesSearch("experimental features app game experiments labs pixel") || matchesSearch("experiments")) && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 px-2">
                        <Flask className="text-teal-500" size={20} />
                        <h4 className="text-sm font-bold uppercase tracking-wider opacity-60">Tính năng thử nghiệm & Labs</h4>
                      </div>

                      {/* App labs */}
                      <div className="space-y-4 text-left">
                        <h3 className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest px-2 font-sans">App experiments</h3>
                        <div className={`p-6 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"} space-y-4`}>
                          {PIZZA_EXPERIMENTS.app.map(exp => (
                            <div key={exp.id} className="flex items-center justify-between border-b border-white/5 last:border-0 last:pb-0 pb-4">
                               <div className="flex-1 pr-6 text-left">
                                  <span className="text-sm font-semibold block">{exp.name}</span>
                                  <span className="text-[11px] opacity-50 block mt-0.5 font-sans">{exp.desc}</span>
                               </div>
                               <div 
                                  onClick={() => setFeatureFlags({ ...featureFlags, [exp.id]: !featureFlags[exp.id] })}
                                  className={`w-10 h-5 rounded-full relative cursor-pointer p-0.5 shrink-0 transition-colors ${featureFlags[exp.id] ? "bg-blue-600" : "bg-slate-700"}`}
                                >
                                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${featureFlags[exp.id] ? "left-5.5" : "left-0.5"}`} />
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Widgets board labs */}
                      <div className="space-y-4 text-left">
                        <h3 className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest px-2 font-sans">Widgets feed experiments</h3>
                        <div className={`p-6 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"} space-y-4`}>
                          {PIZZA_EXPERIMENTS.widgets.map(exp => (
                            <div key={exp.id} className="flex items-center justify-between border-b border-white/5 last:border-0 last:pb-0 pb-4">
                               <div className="flex-1 pr-6 text-left">
                                  <span className="text-sm font-semibold block">{exp.name}</span>
                                  <span className="text-[11px] opacity-50 block mt-0.5 font-sans">{exp.desc}</span>
                               </div>
                               <div 
                                  onClick={() => setFeatureFlags({ ...featureFlags, [exp.id]: !featureFlags[exp.id] })}
                                  className={`w-10 h-5 rounded-full relative cursor-pointer p-0.5 shrink-0 transition-colors ${featureFlags[exp.id] ? "bg-blue-600" : "bg-slate-700"}`}
                               >
                                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${featureFlags[exp.id] ? "left-5.5" : "left-0.5"}`} />
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION 10: ERASE DATA & factory reset */}
                  {(matchesSearch("respring erase data clear reset nhà máy") || matchesSearch("factory reset")) && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 px-2">
                        <RefreshCw className="text-blue-500" size={20} />
                        <h4 className="text-sm font-bold uppercase tracking-wider opacity-60">Respring & Khôi phục cài đặt</h4>
                      </div>

                      <div className={`p-8 rounded-[40px] border flex flex-col transition-all w-full border-blue-500/10 ${isDark ? "bg-blue-500/5" : "bg-blue-500/2 shadow-xl shadow-blue-100/30"}`}>
                        <div className="flex items-center gap-4 mb-6 text-left">
                          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                            <RefreshCw size={24} />
                          </div>
                          <div>
                            <h3 className={`font-bold text-xl tracking-tight text-blue-500`}>Respring Vplay Canary</h3>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium mt-0.5 font-sans">Khởi động lại môi trường và khôi phục cài đặt gốc hệ thống Vplay Canary về mặc định.</p>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button 
                            type="button"
                            onClick={onEraseClick}
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl active:scale-95 flex items-center gap-2"
                          >
                            <RefreshCw size={14} />
                            Respring now
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {settingSearchQuery && 
                   !matchesSearch("about vplay feedback") && 
                   !matchesSearch("hồ sơ tài khoản đăng nhập guest khách cloud sync account user profile") && 
                   !matchesSearch("developer mode nhà phát triển menu dev keypass") && 
                   !matchesSearch("giao diện sáng tối liquid glass theme") && 
                   !matchesSearch("hình nền background desktop wallpaper flow light dark canary solid color gradient cosmic sunset") && 
                   !matchesSearch("vị trí topbar sidebar search box position thanh điều hướng trên") && 
                   !matchesSearch("sidebar trái phải pinned channel shortcuts sidebar positioning pin") && 
                   !matchesSearch("touch floatbar navigation music control bảng phát nhạc") && 
                   !matchesSearch("widgets theme board feed treatment hover badges calendar clock pin button đồng hồ") && 
                   !matchesSearch("experimental features app game experiments labs pixel") && 
                   !matchesSearch("erase data clear reset nhà máy") && (
                     <div className="text-center py-24 text-slate-500 font-bold font-sans">
                       Không tìm thấy cấu hình cài đặt phù hợp với từ khóa tìm kiếm.
                     </div>
                  )}

                </div>
              );
            };

            const renderSelectedCategoryContentOld = () => {
              switch (selectedSettingCategory) {
                case 'account':
                  return (
                    <div className="space-y-6">
                      {/* User Profile */}
                      <div className={`p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                        <div className="flex flex-col items-center justify-center text-center gap-4 py-4">
                          <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 relative overflow-hidden group ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"}`}>
                            {user?.photoURL ? (
                              <img src={user.photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User className="w-12 h-12 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xl font-bold">{user?.displayName || user?.email?.split('@')[0] || "Khách (Guest)"}</h4>
                            <p className="text-sm opacity-55 mt-1">{user?.email || "Chưa hoàn tất thiết lập hồ sơ đăng nhập"}</p>
                          </div>
                          
                          {!user ? (
                            <button 
                              onClick={onLogin}
                              className="mt-4 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold tracking-tight shadow-xl shadow-blue-500/20 active:scale-95 transition-all w-full max-w-xs"
                            >
                              Đăng nhập đồng bộ dữ liệu
                            </button>
                          ) : (
                            <div className="space-y-2 w-full max-w-sm">
                              <div className={`p-3 rounded-xl text-xs font-mono border ${isDark ? "bg-black/40 border-white/5 text-amber-400" : "bg-orange-50/50 border-orange-100 text-orange-600"} text-center`}>
                                Hệ thống tài khoản Cloud sync đang hoạt động ổn định
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Developer Section under account */}
                      {isDev && (
                        <div className={`p-8 rounded-[32px] border transition-all ${isDark ? "border-white/5 bg-white/5" : "border-black/5 bg-white shadow-xl shadow-slate-200/50"}`}>
                          <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-2xl bg-red-500/10 text-red-500">
                              <ShieldAlert size={24} />
                            </div>
                            <div>
                              <h3 className={`font-semibold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>Developer & System Settings</h3>
                              <p className="text-xs text-slate-500">Special tools to debug or factory reset Vplay</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button 
                              onClick={() => {
                                const newFlags = { ...featureFlags, xaml_oobe_force: !featureFlags.xaml_oobe_force };
                                setFeatureFlags(newFlags);
                                localStorage.setItem("vplay_feature_flags", JSON.stringify(newFlags));
                              }}
                              className={`p-4 rounded-[24px] border flex items-center justify-between gap-4 transition-all ${isDark ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`}
                            >
                               <div className="text-left">
                                  <span className="font-bold text-xs">Force Launch OOBE</span>
                                  <p className="text-[10px] opacity-40">Bật OOBE khi khởi động</p>
                               </div>
                               <div className={`w-10 h-5 rounded-full relative transition-all ${featureFlags.xaml_oobe_force ? "bg-red-500" : "bg-slate-700"}`}>
                                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${featureFlags.xaml_oobe_force ? "left-5.5" : "left-0.5"}`} />
                               </div>
                            </button>

                            <button 
                              onClick={() => {
                                onAlert("Resetting", "All settings and local data will be wiped.");
                                const wasDev = localStorage.getItem("vplay_dev_mode") === "true";
                                localStorage.clear();
                                if (wasDev) localStorage.setItem("vplay_dev_mode", "true");
                                window.location.reload();
                              }}
                              className={`p-4 rounded-[24px] border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 text-red-500 flex items-center justify-between gap-4 transition-all`}
                            >
                               <div className="text-left">
                                  <span className="font-bold text-xs text-red-500">Factory Reset</span>
                                  <p className="text-[10px] opacity-60">Xóa sạch toàn bộ dữ liệu</p>
                                </div>
                               <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                case 'appearance':
                  return (
                    <div className="space-y-6 pb-16">
                      {/* Theme Selection */}
                      <div className={`p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-3">Chủ đề hệ thống (System Theme)</span>
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => setIsDark(false)}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${!isDark ? "bg-blue-600 border-blue-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}
                          >
                            <div className="flex items-center gap-3">
                              <Sun size={20} className={!isDark ? "text-white" : "text-slate-400"} />
                              <span className="text-xs font-bold">Giao diện Sáng (Light)</span>
                            </div>
                            {!isDark && <CheckCircle2 size={16} />}
                          </button>
                          <button 
                            onClick={() => setIsDark(true)}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${isDark ? "bg-blue-600 border-blue-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}
                          >
                            <div className="flex items-center gap-3">
                              <Moon size={20} className={isDark ? "text-white" : "text-slate-400"} />
                              <span className="text-xs font-bold">Giao diện Tối (Dark)</span>
                            </div>
                            {isDark && <CheckCircle2 size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Liquid Glass and Fonts */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={`p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-3">Liquid Glass Effect</span>
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => setLiquidGlass("glassy")}
                              className={`p-3 rounded-xl border text-xs font-bold transition-all ${liquidGlass === "glassy" ? "bg-purple-600 border-purple-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}
                            >
                              Glassy
                            </button>
                            <button 
                              onClick={() => setLiquidGlass("tinted")}
                              className={`p-3 rounded-xl border text-xs font-bold transition-all ${liquidGlass === "tinted" ? "bg-purple-600 border-purple-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}
                            >
                              Tinted
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* Background Wallpaper */}
                      <div className={`p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-4">Background Desktop Wallpaper</span>
                        <div className="flex gap-2 p-1 bg-black/5 rounded-2xl w-fit mb-6">
                          {[
                            { id: 'preset', name: 'Presets' },
                            { id: 'solid', name: 'Solid' },
                            { id: 'gradient', name: 'Gradients' }
                          ].map(type => (
                            <button
                              key={type.id}
                              onClick={() => {
                                setWallpaperType(type.id as any);
                                localStorage.setItem("vplay_wallpaper_type", type.id);
                              }}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${wallpaperType === type.id ? "bg-white text-black shadow-md" : "text-slate-500 hover:text-slate-700"}`}
                            >
                              {type.name}
                            </button>
                          ))}
                        </div>

                        {wallpaperType === 'preset' && (
                          <div className="grid grid-cols-3 gap-4 font-sans max-sm:grid-cols-1">
                            {[
                              { id: 'flow_light', name: 'Flow Light', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=2000&auto=format&fit=crop' },
                              { id: 'flow_dark', name: 'Material Blue', url: 'https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=2000&auto=format&fit=crop' },
                              { id: 'canary_lake', name: 'Canary Lake', url: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=2000&auto=format&fit=crop' }
                            ].map(p => (
                              <button 
                                key={p.id}
                                onClick={() => {
                                  setDesktopWallpaper(p.url);
                                  localStorage.setItem("vplay_desktop_wallpaper", p.url);
                                }}
                                className={`relative p-1 rounded-2xl border overflow-hidden transition-all hover:scale-[1.02] ${desktopWallpaper === p.url ? "border-blue-500 ring-2 ring-blue-500/10" : "border-transparent"}`}
                              >
                                <div className="aspect-video w-full rounded-xl overflow-hidden mb-1.5 animate-pulse-slow">
                                  <img src={p.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                                <span className="text-[10px] font-bold block text-center truncate">{p.name}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {wallpaperType === 'solid' && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-black/5 p-4 rounded-2xl">
                              <input 
                                type="color" 
                                value={solidColor}
                                onChange={(e) => {
                                  setSolidColor(e.target.value);
                                  localStorage.setItem("vplay_wallpaper_solid_color", e.target.value);
                                }}
                                className="w-12 h-12 rounded-xl border bg-transparent cursor-pointer"
                              />
                              <div>
                                <p className="font-mono text-sm font-bold uppercase">{solidColor}</p>
                                <p className="text-[10px] opacity-40">Pick a custom solid color</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {['#0b0b0b', '#1a1a1a', '#2d3436', '#0984e3', '#6c5ce7', '#d63031', '#e17055', '#f8fafc'].map(c => (
                                <button 
                                  key={c}
                                  onClick={() => {
                                    setSolidColor(c);
                                    localStorage.setItem("vplay_wallpaper_solid_color", c);
                                  }}
                                  className="w-8 h-8 rounded-full border transition-all hover:scale-110"
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {wallpaperType === 'gradient' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-3 bg-black/5 p-3 rounded-2xl">
                                <input 
                                  type="color" 
                                  value={gradientColors[0]}
                                  onChange={(e) => {
                                    const next: [string, string] = [e.target.value, gradientColors[1]];
                                    setGradientColors(next);
                                    localStorage.setItem("vplay_wallpaper_gradient_colors", JSON.stringify(next));
                                  }}
                                  className="w-10 h-10 rounded-xl"
                                />
                                <span className="font-mono text-xs font-bold uppercase">{gradientColors[0]}</span>
                              </div>
                              <div className="flex items-center gap-3 bg-black/5 p-3 rounded-2xl">
                                <input 
                                  type="color" 
                                  value={gradientColors[1]}
                                  onChange={(e) => {
                                    const next: [string, string] = [gradientColors[0], e.target.value];
                                    setGradientColors(next);
                                    localStorage.setItem("vplay_wallpaper_gradient_colors", JSON.stringify(next));
                                  }}
                                  className="w-10 h-10 rounded-xl"
                                />
                                <span className="font-mono text-xs font-bold uppercase">{gradientColors[1]}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { n: 'Cosmic', c: ['#2d0b3b', '#1a0525'] },
                                { n: 'Ocean', c: ['#00d2ff', '#3a7bd5'] },
                                { n: 'Sunset', c: ['#f83600', '#f9d423'] }
                              ].map(g => (
                                <button
                                  key={g.n}
                                  onClick={() => {
                                    const next: [string, string] = [g.c[0], g.c[1]];
                                    setGradientColors(next);
                                    localStorage.setItem("vplay_wallpaper_gradient_colors", JSON.stringify(next));
                                  }}
                                  className="flex items-center gap-2 p-2 rounded-xl bg-black/5 hover:bg-black/10 transition-all text-left"
                                >
                                  <div className="w-6 h-6 rounded-full shadow-lg shrink-0" style={{ background: `linear-gradient(135deg, ${g.c[0]} 0%, ${g.c[1]} 100%)` }} />
                                  <span className="text-[10px] font-bold uppercase truncate">{g.n}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                case 'topbar':
                  return (
                    <div className="space-y-6">
                      <div className={`p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-3">Search box position</span>
                        <div className="grid grid-cols-2 gap-3 pb-4">
                          <button 
                            onClick={() => setSearchBoxPosition("sidebar")}
                            className={`p-4 rounded-xl border transition-all flex flex-col gap-2 text-left ${searchBoxPosition === "sidebar" ? "bg-blue-600 border-blue-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}
                          >
                            <LayoutDashboard size={20} className={searchBoxPosition === "sidebar" ? "text-white" : "text-slate-400"} />
                            <span className="text-xs font-bold">Show inside sidebar</span>
                          </button>
                          <button 
                            onClick={() => setSearchBoxPosition("top")}
                            className={`p-4 rounded-xl border transition-all flex flex-col gap-2 text-left ${searchBoxPosition === "top" ? "bg-purple-600 border-purple-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}
                          >
                            <div className="h-4 w-12 rounded border border-current opacity-60 flex items-center justify-center text-[8px] uppercase font-black">TOP</div>
                            <span className="text-xs font-bold">Show inside Top bar</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium opacity-65">This layout preference aligns the quick television command center search box position.</p>
                      </div>
                    </div>
                  );
                case 'sidebar':
                  return (
                    <div className="space-y-6">
                      <div className={`p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-3">Sidebar Positioning (LTR/RTL)</span>
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => setIsSidebarRight(false)}
                            className={`p-4 rounded-xl border transition-all flex items-center gap-3 ${!isSidebarRight ? "bg-blue-600 border-blue-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}
                          >
                            <span className="text-xs font-bold">Trái (Left-side)</span>
                          </button>
                          <button 
                            onClick={() => setIsSidebarRight(true)}
                            className={`p-4 rounded-xl border transition-all flex items-center gap-3 ${isSidebarRight ? "bg-blue-600 border-blue-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}
                          >
                            <span className="text-xs font-bold">Phải (Right-side)</span>
                          </button>
                        </div>
                      </div>

                      <div className={`p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-3">Channel Pinning on Sidebar</span>
                        <button 
                          onClick={() => setIsPinningEnabled(!isPinningEnabled)}
                          className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between ${isPinningEnabled ? "bg-purple-600 border-purple-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}
                        >
                          <div className="flex items-center gap-3">
                            <Pin size={18} className={isPinningEnabled ? "text-white" : "text-slate-400"} />
                            <span className="text-xs font-bold text-left">Hiện lối tắt kênh yêu thích trên sidebar</span>
                          </div>
                          <div className={`w-10 h-5 rounded-full relative transition-colors ${isPinningEnabled ? "bg-white/20" : "bg-slate-700"}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isPinningEnabled ? "left-5.5" : "left-0.5"}`} />
                          </div>
                        </button>
                      </div>
                    </div>
                  );
                case 'floatbar':
                  return (
                    <div className="space-y-6">
                      <div className={`p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-3">Layout Platform Integration</span>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <button 
                            onClick={() => setUseSidebar(true)}
                            className={`p-4 rounded-xl border transition-all flex flex-col gap-2 text-left ${useSidebar ? "bg-blue-600 border-blue-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}
                          >
                            <Monitor size={20} />
                            <span className="text-xs font-bold">Desktop style (Sidebar)</span>
                          </button>
                          <button 
                            onClick={() => setUseSidebar(false)}
                            className={`p-4 rounded-xl border transition-all flex flex-col gap-2 text-left ${!useSidebar ? "bg-blue-600 border-blue-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400"}`}
                          >
                            <MousePointer2 size={20} />
                            <span className="text-xs font-bold">Touch style (Floatbar)</span>
                          </button>
                        </div>
                        
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-3">Quick Navigation Shortcut</span>
                        <button 
                          onClick={() => {
                            setActiveTab("Phát nhạc");
                            setShowWidgets(false);
                          }}
                          className={`w-full p-6 rounded-2xl border transition-all flex flex-col items-center justify-center gap-3 ${isDark ? "bg-white/5 border-white/10 hover:bg-white/20" : "bg-slate-50 border-slate-200 hover:bg-slate-100"}`}
                        >
                          <Music className="text-purple-500 animate-bounce" size={24} />
                          <span className="text-xs font-bold uppercase tracking-widest">Mở bảng điều khiển phát nhạc</span>
                        </button>
                      </div>
                    </div>
                  );
                case 'widgets_board':
                  return (
                    <div className="space-y-6 pb-12">
                      {/* Feed Theme Card */}
                      <div className={`p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/10" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                        <span className="text-[10px] font-semibold uppercase tracking-widest opacity-40 block mb-4">Widgets Feed Theme</span>
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => {
                              setWidgetsTheme('light');
                              localStorage.setItem("vplay_widgets_theme", "light");
                            }}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${widgetsTheme === 'light' ? "border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/10" : "border-black/5"}`}
                          >
                            <div className="flex items-center gap-3">
                              <Sun size={18} className="text-orange-500" />
                              <span className="text-xs font-semibold">Light mode widgets</span>
                            </div>
                          </button>
                          <button 
                            onClick={() => {
                              setWidgetsTheme('dark');
                              localStorage.setItem("vplay_widgets_theme", "dark");
                            }}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${widgetsTheme === 'dark' ? "border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/10" : "border-black/5"}`}
                          >
                            <div className="flex items-center gap-3">
                              <Moon size={18} className="text-blue-500" />
                              <span className="text-xs font-semibold">Dark mode widgets</span>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Widgets Feed Treatments */}
                      <div className={`p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                        <span className="text-[10px] font-semibold uppercase tracking-widest opacity-40 block mb-3">Widgets Feed Treatments</span>
                        <div className="relative group">
                          <select 
                            value={widgetsFeedTreatment}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setWidgetsFeedTreatment(val);
                              localStorage.setItem("vplay_widgets_feed_treatment", val.toString());
                            }}
                            className={`w-full p-4 pr-10 rounded-2xl border appearance-none transition-all cursor-pointer font-semibold text-sm ${
                              isDark ? "bg-black/45 border-white/10 text-white focus:ring-blue-500" : "bg-white border-black/10 text-slate-800 focus:ring-blue-500 shadow-sm"
                            }`}
                          >
                            <option value={1}>Treatment 1: Navigation sidebar (Default)</option>
                            <option value={2}>Treatment 2: Top navigation (Giống với option hide widgets sidebar)</option>
                            <option value={3}>Treatment 3: Float sidebar (Layout giống hình 1)</option>
                            <option value={4}>Treatment 4: More collapse (Hẹp hơn giống hình 2)</option>
                            <option value={5}>Treatment 5: Extremely rounded (Bo cong giống hình 3)</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                            <ChevronDown size={16} />
                          </div>
                        </div>
                      </div>

                      {/* Preferences */}
                      <div className={`p-8 rounded-[32px] border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                        <span className="text-[10px] font-semibold uppercase tracking-widest opacity-40 block mb-4">Dashboard Interactions</span>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-black/5 pb-3">
                             <div>
                                <span className="text-xs font-semibold block text-left">Open feed on hover</span>
                                <span className="text-[10px] opacity-50 block text-left">Mở feed tự động khi hover chuột</span>
                             </div>
                             <div 
                               onClick={() => setWidgetSettings({ ...widgetSettings, openFeedOnHover: !widgetSettings.openFeedOnHover })}
                               className={`w-10 h-5 rounded-full relative cursor-pointer p-0.5 transition-all ${widgetSettings.openFeedOnHover ? "bg-blue-600" : "bg-slate-300"}`}
                             >
                               <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${widgetSettings.openFeedOnHover ? "left-5.5" : "left-0.5"}`} />
                             </div>
                          </div>
                          <div className="flex items-center justify-between border-b border-black/5 pb-3">
                             <div>
                                <span className="text-xs font-semibold block text-left">Show feed badges</span>
                                <span className="text-[10px] opacity-50 block text-left">Hiển thị chấm thông báo chưa đọc</span>
                             </div>
                             <div 
                               onClick={() => setWidgetSettings({ ...widgetSettings, showFeedBadges: !widgetSettings.showFeedBadges })}
                               className={`w-10 h-5 rounded-full relative cursor-pointer p-0.5 transition-all ${widgetSettings.showFeedBadges ? "bg-blue-600" : "bg-slate-300"}`}
                             >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${widgetSettings.showFeedBadges ? "left-5.5" : "left-0.5"}`} />
                             </div>
                          </div>
                          <div className="flex items-center justify-between border-b border-black/5 pb-3">
                             <div>
                                <span className="text-xs font-semibold block text-left">Hide feed sidebar</span>
                                <span className="text-[10px] opacity-50 block text-left">Ẩn thanh bên và thay bằng các nút chọn dẹt dưới lời chào</span>
                             </div>
                             <div 
                               onClick={() => setWidgetSettings({ ...widgetSettings, hideFeedSidebar: !widgetSettings.hideFeedSidebar })}
                               className={`w-10 h-5 rounded-full relative cursor-pointer p-0.5 transition-all ${widgetSettings.hideFeedSidebar ? "bg-blue-600" : "bg-slate-300"}`}
                             >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${widgetSettings.hideFeedSidebar ? "left-5.5" : "left-0.5"}`} />
                             </div>
                          </div>
                          <div className="flex items-center justify-between border-b border-black/5 pb-3">
                             <div>
                                <span className="text-xs font-semibold block text-left font-sans">Hiển thị lịch</span>
                                <span className="text-[10px] opacity-50 block text-left">Hiển thị ngày tháng năm chi tiết dưới lời chào bảng tiện ích</span>
                             </div>
                             <div 
                               onClick={() => setWidgetSettings({ ...widgetSettings, showCalendarInWidgets: !widgetSettings.showCalendarInWidgets })}
                               className={`w-10 h-5 rounded-full relative cursor-pointer p-0.5 transition-all ${widgetSettings.showCalendarInWidgets ? "bg-blue-600" : "bg-slate-300"}`}
                             >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${widgetSettings.showCalendarInWidgets ? "left-5.5" : "left-0.5"}`} />
                             </div>
                          </div>
                          <div className="flex items-center justify-between border-b border-black/5 pb-3">
                             <div>
                                <span className="text-xs font-semibold block text-left font-sans">Thu gọn nút "Add widgets"</span>
                                <span className="text-[10px] opacity-50 block text-left">Thu gọn nút Add widgets thành icon dấu '+' cạnh nút full screen</span>
                             </div>
                             <div 
                               onClick={() => setWidgetSettings({ ...widgetSettings, collapsePinButton: !widgetSettings.collapsePinButton })}
                               className={`w-10 h-5 rounded-full relative cursor-pointer p-0.5 transition-all ${widgetSettings.collapsePinButton ? "bg-blue-600" : "bg-slate-300"}`}
                             >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${widgetSettings.collapsePinButton ? "left-5.5" : "left-0.5"}`} />
                             </div>
                          </div>
                          <div className="flex items-center justify-between">
                             <div>
                                <span className="text-xs font-semibold block text-left font-sans">Hiển thị đồng hồ</span>
                                <span className="text-[10px] opacity-50 block text-left">Hiển thị thời gian giờ phút giây hệ thống dưới lời chào</span>
                             </div>
                             <div 
                               onClick={() => setWidgetSettings({ ...widgetSettings, showClockInWidgets: !widgetSettings.showClockInWidgets })}
                               className={`w-10 h-5 rounded-full relative cursor-pointer p-0.5 transition-all ${widgetSettings.showClockInWidgets ? "bg-blue-600" : "bg-slate-300"}`}
                             >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${widgetSettings.showClockInWidgets ? "left-5.5" : "left-0.5"}`} />
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                case 'experiments':
                  return (
                    <div className="space-y-6 pb-16 font-forced-montserrat">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-600 flex items-center justify-center">
                          <Pizza size={24} />
                        </div>
                        <div>
                          <h3 className={`font-bold text-xl ${isDark ? "text-white" : "text-slate-900"}`}>Pizza Experiments</h3>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Beta features & Experimental labs</p>
                        </div>
                      </div>

                      <div className={`p-6 rounded-3xl border mb-6 ${isDark ? "bg-red-500/5 border-red-500/10" : "bg-red-50 border-red-200"} flex flex-col sm:flex-row items-center justify-between gap-4`}>
                        <div className="flex items-center gap-3">
                           <div className="p-2 w-10 h-10 rounded-xl bg-red-400/10 text-red-400 flex items-center justify-center">
                              <RefreshCw size={18} />
                           </div>
                           <div>
                              <h4 className="font-bold text-sm text-left text-white leading-none">Canary Reset Option</h4>
                              <p className="text-[10px] text-red-400/80 font-semibold mt-1">Simulate or reset widgets feed update onboarding</p>
                           </div>
                        </div>
                        <button
                          onClick={() => {
                            localStorage.removeItem("vplay_widgets_updated_canary");
                            setIsWidgetsUpdated(false);
                            addNotification?.("Canary Lab", "Reset widgets update state! Re-open widgets board to see the update screen.", "success");
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 duration-100 shrink-0 cursor-pointer animate-fade-in"
                        >
                          Reset Board Update
                        </button>
                      </div>
                      
                      <ExperimentalContent 
                        isDark={isDark} 
                        featureFlags={featureFlags} 
                        hideHeader={true}
                        setFeatureFlags={(f: any, id: string, name: string, val: boolean) => {
                          setFeatureFlags(f);
                          localStorage.setItem("vplay_feature_flags", JSON.stringify(f));
                          if (name) {
                            addNotification?.("Thử nghiệm", `${val ? 'Bật' : 'Tắt'} flag: ${name}`, 'success');
                          }
                        }} 
                      />
                      
                      <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                         <div className={`p-8 rounded-[32px] border ${isDark ? "bg-amber-500/5 border-amber-500/10" : "bg-amber-50 border-amber-200 shadow-xl shadow-amber-100/10"}`}>
                           <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                                 <LayoutGrid size={20} />
                              </div>
                              <div>
                                 <h4 className={`font-bold text-sm text-left ${isDark ? "text-white" : "text-slate-900"}`}>Widgets Feed Treatments</h4>
                                 <p className="text-[10px] text-amber-600/70 font-bold uppercase mt-0.5">Custom layout rendering variants</p>
                              </div>
                           </div>

                           <div className="relative group text-white">
                             <select 
                               value={widgetsFeedTreatment}
                               onChange={(e) => {
                                 const val = parseInt(e.target.value);
                                 setWidgetsFeedTreatment(val);
                                 localStorage.setItem("vplay_widgets_feed_treatment", val.toString());
                               }}
                               className={`w-full p-4 pr-10 rounded-2xl border appearance-none transition-all cursor-pointer font-bold text-sm ${
                                 isDark ? "bg-black/40 border-amber-500/25 text-white focus:ring-amber-500" : "bg-white border-amber-200 text-slate-800 focus:ring-amber-500"
                               }`}
                             >
                               <option value={1} className="text-black">Treatment 1: Navigation sidebar (Default)</option>
                               <option value={2} className="text-black">Treatment 2: Top navigation (Giống với option hide widgets sidebar)</option>
                               <option value={3} className="text-black">Treatment 3: Float sidebar (Layout giống hình 1)</option>
                               <option value={4} className="text-black">Treatment 4: More collapse (Hẹp hơn giống hình 2)</option>
                               <option value={5} className="text-black">Treatment 5: Extremely rounded (Bo cong giống hình 3)</option>
                             </select>
                             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                               <ChevronDown size={16} />
                             </div>
                           </div>
                         </div>
                      </div>
                    </div>
                  );
                case 'system_settings':
                  return (
                    <div className="pb-16 max-w-4xl mx-auto">
                      <SettingsContent 
                        isDark={isDark} 
                        setIsDark={setIsDark} 
                        isDev={isDev} 
                        setIsDev={setIsDev} 
                        featureFlags={featureFlags}
                        setFeatureFlags={setFeatureFlags}
                        liquidGlass={liquidGlass} 
                        setLiquidGlass={setLiquidGlass}
                        useSidebar={useSidebar}
                        setUseSidebar={setUseSidebar}
                        isSidebarRight={isSidebarRight}
                        setIsSidebarRight={setIsSidebarRight}
                        isPinningEnabled={isPinningEnabled}
                        setIsPinningEnabled={setIsPinningEnabled}
                        user={user}
                        userData={userData}
                        setUserData={setUserData}
                        onAlert={onAlert}
                        onLogin={onLogin}
                        onUpdateLogsClick={() => {}}
                        favorites={favorites}
                        backgroundMusicOption={backgroundMusicOption}
                        setBackgroundMusicOption={setBackgroundMusicOption}
                        customMusicId={customMusicId}
                        setCustomMusicId={setCustomMusicId}
                        searchBoxPosition={searchBoxPosition}
                        setSearchBoxPosition={setSearchBoxPosition}
                        sidebarStyle={sidebarStyle}
                        setSidebarStyle={setSidebarStyle}
                        setActiveTab={setActiveTab}
                        wallpaperType={wallpaperType}
                        setWallpaperType={setWallpaperType}
                        solidColor={solidColor}
                        setSolidColor={setSolidColor}
                        gradientColors={gradientColors}
                        setGradientColors={setGradientColors}
                        desktopWallpaper={desktopWallpaper}
                        setDesktopWallpaper={setDesktopWallpaper}
                        forcedFont={forcedFont}
                        setForcedFont={setForcedFont}
                        onEraseClick={onEraseClick}
                      />
                    </div>
                  );
                default:
                  return null;
              }
            };

            return (
              <motion.div 
                key="settings"
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0 }}
                className={`flex-1 flex flex-col min-h-0 text-white rounded-none overflow-hidden ${isUpdated ? "bg-transparent border-none" : "bg-[#1c1c1c] border border-white/5 shadow-2xl"} full-page-tab`}
              >
                {/* Header */}
                <div className="h-20 px-8 flex items-center justify-between border-b border-black/5">
                  <div className="flex items-center gap-3">
                    {selectedSettingCategory && (
                      <button 
                        onClick={() => setSelectedSettingCategory(null)}
                        className={`p-2.5 rounded-xl transition-all ${isDark ? "hover:bg-white/5 text-white" : "hover:bg-slate-100 text-slate-900"}`}
                        title="Quay lại"
                      >
                        <ChevronLeft size={20} />
                      </button>
                    )}
                    <h3 className={`text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                      {selectedSettingCategory === 'account' ? 'Tài khoản' :
                       selectedSettingCategory === 'appearance' ? 'Chủ đề và Giao diện' :
                       selectedSettingCategory === 'topbar' ? 'Topbar' :
                       selectedSettingCategory === 'sidebar' ? 'Sidebar' :
                       selectedSettingCategory === 'floatbar' ? 'Floatbar' :
                       selectedSettingCategory === 'widgets_board' ? 'Widgets Board' :
                       selectedSettingCategory === 'system_settings' ? 'System and Developer Settings' :
                       selectedSettingCategory === 'experiments' ? 'Labs & Experiments' :
                       'Settings'}
                    </h3>
                  </div>
                  
                  {!selectedSettingCategory && (
                    <div className="flex-1 max-w-lg mx-8">
                       <div className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border transition-all ${isDark ? "bg-black/20 border-white/10 focus-within:bg-black/40 focus-within:border-blue-500/50" : "bg-white border-black/10 shadow-sm focus-within:border-blue-500/50"}`}>
                          <Search size={18} className="opacity-40" />
                          <input 
                            type="text" 
                            placeholder="Search settings..." 
                            className="bg-transparent border-none outline-none text-xs w-full font-medium text-current"
                            value={settingSearchQuery}
                            onChange={(e) => setSettingSearchQuery(e.target.value)}
                          />
                          {settingSearchQuery && (
                            <button onClick={() => setSettingSearchQuery("")} className="text-xs opacity-50 hover:opacity-100">Xóa</button>
                          )}
                       </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsWidgetsFullScreen(!isWidgetsFullScreen)}
                      className={`p-2.5 rounded-xl transition-all ${isDark ? "hover:bg-white/5 text-white/40" : "hover:bg-black/5 text-slate-400"}`}
                    >
                      <Maximize size={20} />
                    </button>
                    <button 
                      onClick={() => setShowWidgets(false)}
                      className={`p-2.5 rounded-xl transition-all ${isDark ? "hover:bg-red-500/20 hover:text-red-500 text-white/40" : "hover:bg-red-500/20 hover:text-red-500 text-slate-400"}`}
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                  {true ? (
                    renderSelectedCategoryContent()
                  ) : (
                    <>
                       {/* General info cards */}
                       <div className="flex flex-col lg:flex-row gap-6 mb-8 items-stretch">
                          {/* About Card */}
                          <div className={`p-8 rounded-[40px] border flex-1 relative overflow-hidden transition-all ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                             <h4 className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>About Vplay by VNRT</h4>
                             <div className="space-y-1 text-left">
                                <div className="flex items-center gap-12">
                                   <span className="text-sm font-medium opacity-60">Branch:</span>
                                   <span className="text-sm font-bold text-orange-600">Canary</span>
                                </div>
                                <div className="flex items-center gap-12">
                                   <span className="text-sm font-medium opacity-60">Build:</span>
                                   <span className="text-sm font-bold">Nx626</span>
                                </div>
                                <div className="flex items-center gap-8">
                                   <span className="text-sm font-medium opacity-60">Compiled:</span>
                                   <span className="text-sm font-bold">2026</span>
                                </div>
                             </div>
                          </div>

                          {/* Feedback Card */}
                          <div 
                             onClick={() => {
                                onFeedbackClick?.();
                                setShowWidgets(false);
                             }}
                             className={`p-8 rounded-[40px] border flex-1 flex items-center gap-6 relative overflow-hidden transition-all cursor-pointer ${isDark ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-white border-black/5 hover:bg-slate-50 shadow-xl shadow-slate-100"}`}
                          >
                             <div className="p-3 rounded-2xl bg-current opacity-10" />
                             <div className="flex-1 text-left">
                                <div className="flex items-center gap-3 mb-1">
                                   <ExternalLink size={20} className={isDark ? "text-white" : "text-slate-900"} />
                                   <h4 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Give Feedback!</h4>
                                </div>
                                <p className="text-xs opacity-50 leading-relaxed font-medium">Hãy giúp chúng tôi cải thiện Vplay. Chúng tôi luôn lắng nghe ý kiến của bạn</p>
                             </div>
                          </div>

                          {/* Logo Section */}
                          <div className="hidden lg:flex items-center justify-center px-8">
                             <img src={vplayLogo} alt="Vplay" className="h-24 object-contain filter drop-shadow-2xl" />
                          </div>
                       </div>
                       
                       {/* Categories Options */}
                       <div className="space-y-3">
                          {filteredCategories.map((item) => (
                            <button 
                              key={item.id}
                              onClick={() => setSelectedSettingCategory(item.id)}
                              className={`w-full p-6 rounded-[24px] border flex items-center justify-between transition-all group ${isDark ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-white border-black/5 hover:bg-slate-50 shadow-sm"}`}
                            >
                               <div className="flex items-center gap-6">
                                  <div className={`p-4 rounded-2xl ${isDark ? "bg-white/5 text-white" : "bg-slate-100 text-slate-900"}`}>
                                     <item.icon size={24} />
                                  </div>
                                  <div className="text-left">
                                     <h5 className={`font-bold text-base ${isDark ? "text-white" : "text-slate-900"}`}>{item.name}</h5>
                                     <p className="text-xs opacity-40 font-medium">{item.desc}</p>
                                  </div>
                               </div>
                               <ChevronRight className="opacity-20 group-hover:opacity-100 transition-opacity" size={20} />
                            </button>
                          ))}
                          
                          {filteredCategories.length === 0 && (
                            <div className="text-center py-8 text-slate-500 font-bold">Không tìm thấy cài đặt phù hợp.</div>
                          )}

                          {/* Keep original widgets theme shortcut card below if search query is empty */}
                          {!settingSearchQuery && false && (
                            <>
                              <div className={`w-full p-8 rounded-[32px] border mt-12 transition-all ${isDark ? "bg-white/5 border-white/10" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                                <div className="flex items-center gap-4 mb-8 text-left">
                                   <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                                     <Palette size={24} />
                                   </div>
                                   <div>
                                     <h4 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Widgets feed theme</h4>
                                     <p className="text-sm opacity-50 font-medium">Tùy chỉnh riêng cho widgets, không ảnh hưởng tới ứng dụng</p>
                                   </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                   <button 
                                     onClick={() => {
                                       setWidgetsTheme('light');
                                       localStorage.setItem("vplay_widgets_theme", "light");
                                     }}
                                     className={`p-6 rounded-[24px] border-2 flex flex-col items-center gap-3 transition-all ${widgetsTheme === 'light' ? "border-blue-500 bg-blue-500/5 ring-4 ring-blue-500/10" : "border-black/5 hover:border-black/20"}`}
                                   >
                                      <div className="w-full aspect-video rounded-xl bg-slate-100 border border-black/5 flex items-center justify-center">
                                         <Sun size={32} className="text-orange-500" />
                                      </div>
                                      <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Light mode (Default)</span>
                                   </button>
                                   <button 
                                     onClick={() => {
                                       setWidgetsTheme('dark');
                                       localStorage.setItem("vplay_widgets_theme", "dark");
                                     }}
                                     className={`p-6 rounded-[24px] border-2 flex flex-col items-center gap-3 transition-all ${widgetsTheme === 'dark' ? "border-blue-500 bg-blue-500/5 ring-4 ring-blue-500/10" : "border-black/5 hover:border-black/20"}`}
                                   >
                                      <div className="w-full aspect-video rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center">
                                         <Moon size={32} className="text-blue-400" />
                                      </div>
                                      <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Dark mode</span>
                                   </button>
                                </div>
                              </div>

                              <div className="mt-12 mb-4 px-2 text-left">
                                <h2 className="text-xl font-bold tracking-tight">Widget Board Preferences</h2>
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Dash optimization</p>
                              </div>

                              <div className={`p-8 rounded-[32px] border transition-all space-y-6 ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl shadow-slate-100"}`}>
                                <div className="flex items-center justify-between">
                                   <div className="flex flex-col text-left">
                                     <span className="text-sm font-bold">Open feed on hover</span>
                                     <span className="text-[11px] opacity-50 font-medium">Tự động mở feed khi di chuột qua biểu tượng</span>
                                   </div>
                                   <div 
                                     onClick={() => setWidgetSettings({ ...widgetSettings, openFeedOnHover: !widgetSettings.openFeedOnHover })}
                                     className={`w-10 h-5 rounded-full relative cursor-pointer p-0.5 transition-colors ${widgetSettings.openFeedOnHover ? "bg-blue-600" : "bg-slate-300"}`}
                                   >
                                     <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${widgetSettings.openFeedOnHover ? "left-5.5" : "left-0.5"}`} />
                                   </div>
                                </div>
                                <div className="flex items-center justify-between">
                                   <div className="flex flex-col text-left">
                                      <span className="text-sm font-bold">Show feed badges</span>
                                       <span className="text-[11px] opacity-50 font-medium">Hiển thị số lượng mục chưa đọc trên widget feed</span>
                                    </div>
                                    <div 
                                      onClick={() => setWidgetSettings({ ...widgetSettings, showFeedBadges: !widgetSettings.showFeedBadges })}
                                      className={`w-10 h-5 rounded-full relative cursor-pointer p-0.5 transition-colors ${widgetSettings.showFeedBadges ? "bg-blue-600" : "bg-slate-300"}`}
                                    >
                                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${widgetSettings.showFeedBadges ? "left-5.5" : "left-0.5"}`} />
                                    </div>
                                 </div>
                              </div>
                            </>
                          )}
                       </div>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })()}

           {!isTabTransitioning && activeBoardTab === 'dev' && isDev && (
              <motion.div 
                key="dev"
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0 }}
                className={`flex-1 flex flex-col min-h-0 text-white rounded-none overflow-hidden ${isUpdated ? "bg-transparent border-none" : "bg-[#0c0c0e] border border-white/5 shadow-2xl"}`}
              >
               <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-black/30">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-rose-500 uppercase font-mono">Dev Options Console</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Canary Build Platform Settings</p>
                  </div>
               </div>

               <div className={`flex-1 p-8 overflow-y-auto custom-scrollbar ${isUpdated ? "bg-transparent" : "bg-[#0c0c0e]"}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    {[
                      { id: 'trigger_oobe', label: 'Trigger OOBE', desc: 'Khởi chạy lại màn hình cấu hình OOBE thiết lập đầu.' },
                      { id: 'unlimited_vpoints', label: 'Unlimited Vpoints', desc: 'Bật Vpoints vô hạn (hiển thị biểu tượng vô cực ∞).' },
                      { id: 'custom_vpoints', label: 'Custom Vpoints', desc: 'Điều chỉnh số lượng Vpoints tùy ý không giới hạn.' },
                      { id: 'purchase_all_store_widgets', label: 'Purchase all store widgets', desc: 'Có đầy đủ mọi tiện ích Vstore không cần trả phí.' },
                      { id: 'pin_all_widgets_to_feed', label: 'Pin all widgets to feed', desc: 'Ghim sạch mọi widgets có sẵn vào trang Feed hiện tại.' },
                      { id: 'unpin_all_widgets_from_feed', label: 'Unpin all widgets from feed', desc: 'Gỡ ghim toàn bộ tất cả widgets khỏi trang Feed.' },
                      { id: 'reset_vstore', label: 'Reset Vstore', desc: 'Đặt lại Vstore về mặc định (Lịch sử thanh toán & 100 VP).' },
                      { id: 'reset_widgets_feed', label: 'Reset Widgets Feed', desc: 'Trở lại danh sách ghim Feed setup mặc định nhà máy.' },
                      { id: 'respring_data', label: 'Respring Data', desc: 'Dẫn tới màn hình chờ please wait vĩnh viễn (bypass qua mã 3667).' },
                      { id: 'erase_data', label: 'Respring Canary', desc: 'Mở tiến trình respring khôi phục dữ liệu hệ thống (Respring/Backup UI).' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleDevOptionClick(opt.id, opt.label)}
                        className="p-6 rounded-[24px] border text-left flex flex-col justify-between h-40 transition-all bg-[#141416] border-white/5 hover:bg-[#1c1c1e] hover:border-rose-500/30 hover:-translate-y-0.5 active:scale-95 group shadow-lg"
                      >
                        <div className="space-y-1.5">
                          <span className="font-bold text-sm tracking-tight text-white group-hover:text-rose-400 transition-colors">{opt.label}</span>
                          <p className="text-xs text-slate-400 leading-relaxed font-medium">{opt.desc}</p>
                        </div>
                        <div className="text-[10px] font-black tracking-widest uppercase text-rose-500/70 group-hover:opacity-100 flex items-center gap-1.5 self-end transition-colors group-hover:text-rose-400">
                          <span>Activate</span>
                          <ArrowRight size={12} />
                        </div>
                      </button>
                    ))}
                  </div>
               </div>
              </motion.div>
           )}

           {!isTabTransitioning && activeBoardTab === 'vstore' && (
              <motion.div 
                key="vstore"
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0 }}
                className={`flex-1 flex flex-col min-h-0 text-white rounded-none overflow-hidden ${isUpdated ? "bg-transparent border-none" : "bg-[#1c1c1c]"}`}
              >
               <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-black/10">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-white">Vstore Widgets</h3>
                    <p className="text-xs text-slate-400 font-medium font-sans">Khám phá và ghim tiện ích vào Board</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-black/20 border-white/10 text-white">
                       <Search size={14} className="text-slate-400" />
                       <input 
                         type="text" 
                         placeholder="Search Vstore" 
                         className="bg-transparent border-none outline-none text-[11px] w-32 font-bold text-white placeholder-slate-500"
                         value={vstoreSearch}
                         onChange={(e) => setVstoreSearch(e.target.value)}
                       />
                    </div>
                    <button 
                       onClick={() => {
                         if (!isVstorePinned) {
                           setIsVstorePinned(true);
                           addNotification("Vstore", "Đã ghim Vstore vào thanh bên hệ thống!");
                         }
                       }}
                       disabled={isVstorePinned}
                       className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-gradient-to-r from-amber-400 to-orange-600 text-white shadow-xl shadow-orange-500/20 active:scale-95"
                     >
                        {isVstorePinned ? "Pinned" : "Go to Vstore"}
                     </button>
                   </div>
                </div>

                <div className={`flex-1 p-8 overflow-y-auto custom-scrollbar ${isUpdated ? "bg-transparent" : "bg-[#1c1c1c]"}`}>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                     {[
                       { id: 'music_player', name: 'Music Pro', icon: Music, price: 50, desc: 'Trình phát nhạc Material Design.', cat: 'Utility' },
                       { id: 'weather_extended', name: 'Weather Pro', icon: Cloud, price: 75, desc: 'Dự báo thời tiết chuyên sâu.', cat: 'Utility' },
                       { id: 'stocks_pro', name: 'Stocks Pro', icon: TrendingUp, price: 120, desc: 'Theo dõi chứng khoán thời gian thực.', cat: 'Finance' },
                       { id: 'calendar', name: 'Calendar', icon: Calendar, price: 40, desc: 'Lịch biểu tối giản.', cat: 'Productivity' },
                       { id: 'todo_list', name: 'To-Do List', icon: List, price: 30, desc: 'Quản lý công việc hiệu quả.', cat: 'Productivity' },
                       { id: 'ai_for_me', name: 'Do For Me Pro', icon: Sparkles, price: 150, desc: 'Gói AI nâng cao Gemini API.', cat: 'AI' },
                       { id: 'v_assistant', name: 'V-Assistant Premium', icon: User, price: 300, desc: 'Trợ lý ảo cao cấp.', cat: 'AI' },
                       { id: 'theme_pack_retro', name: 'Retro Theme Pack', icon: Palette, price: 120, desc: 'Giao diện hoài niệm VTV.', cat: 'Design' },
                      { id: 'system_monitor', name: 'System Monitor', icon: Activity, price: 60, desc: 'Theo dõi tài nguyên phần cứng.', cat: 'Utility' },
                      { id: 'crypto_tracker', name: 'Crypto Live', icon: Bitcoin, price: 90, desc: 'Giá tiền ảo cập nhật mỗi giây.', cat: 'Finance' },
                      { id: 'calculator_pro', name: 'Calc Pro', icon: Hash, price: 20, desc: 'Máy tính đa năng.', cat: 'Utility' },
                      { id: 'image_gen', name: 'Magic Image', icon: ImageIcon, price: 250, desc: 'Tạo ảnh từ văn bản với AI.', cat: 'AI' },
                      { id: 'email_client', name: 'V-Mail', icon: Mail, price: 100, desc: 'Đọc email ngay trên Board.', cat: 'Productivity' },
                      { id: 'news_reader', name: 'News Hub', icon: Newspaper, price: 45, desc: 'Tin tức tổng hợp từ nhiều nguồn.', cat: 'Social' },
                      { id: 'browser_lite', name: 'Web Mini', icon: Globe, price: 180, desc: 'Trình duyệt web siêu nhẹ.', cat: 'Core' }
                    ].filter(item => item.name.toLowerCase().includes(vstoreSearch.toLowerCase())).map(item => {
                      const isPurchased = purchasedWidgets.includes(item.id);
                      return (
                        <div key={item.id} className="p-6 rounded-[32px] border transition-all flex flex-col h-full bg-[#242424] border-white/5 hover:bg-[#2c2c2c] hover:shadow-xl hover:-translate-y-1 text-white">
                           <div className="flex items-start justify-between mb-4">
                              <div className="p-4 bg-black/25 rounded-2xl">
                                 <item.icon size={24} className="text-blue-400" />
                              </div>
                              <div className="flex flex-col items-end">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.cat}</span>
                                 <span className="px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-lg shadow-sm">{item.price} VP</span>
                              </div>
                           </div>
                           <h4 className="font-bold text-lg mb-1 text-white">{item.name}</h4>
                           <p className="text-xs text-slate-400 mb-6 leading-relaxed flex-1">{item.desc}</p>
                           <button 
                              className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isPurchased ? "bg-white/5 text-slate-500 cursor-default" : "bg-white text-black hover:bg-slate-100"}`}
                              onClick={() => {
                                 if (!isPurchased) {
                                    if (isUnlimitedVpoints || vpoints >= item.price) {
                                       if (!isUnlimitedVpoints) {
                                          setVpoints((v: number) => v - item.price);
                                       }
                                       setPurchasedWidgets((prev: string[]) => [...prev, item.id]);
                                       addNotification("Store", `Đã mua thành công ${item.name}!`, "success");
                                    } else {
                                       addNotification("Store", "Chưa đủ Vpoints!", "warning");
                                    }
                                 }
                              }}
                           >
                              {isPurchased ? "Owned" : "Purchase"}
                           </button>
                        </div>
                      )
                    })}
                  </div>
               </div>
              </motion.div>
           )}

        </AnimatePresence>
     </div>
  </div>

  <AnimatePresence>
    {showWidgetGallery && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10003] flex items-center justify-center p-4 md:p-8 overflow-hidden pointer-events-none"
      >
        <div 
          className="absolute inset-0 bg-transparent pointer-events-auto"
          onClick={() => setShowWidgetGallery(false)}
        />
        <motion.div 
          drag
          dragMomentum={false}
          initial={{ scale: 0.9, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 40 }}
          className={`relative w-full max-w-4xl h-[70vh] flex flex-col ${isDark ? "bg-[#1c1c1c] text-white" : "bg-[#f8fafc] text-slate-900"} rounded-3xl overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/10 pointer-events-auto`}
        >
          {/* Window Title Bar */}
          <div className="h-12 px-6 flex items-center justify-between border-b border-black/5 bg-white/10 backdrop-blur-3xl cursor-move select-none">
            <div className="flex items-center gap-3">
               <div className="flex gap-1.5 px-2">
                 <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                 <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                 <div className="w-3 h-3 rounded-full bg-[#28c840]" />
               </div>
               <div className="h-4 w-px bg-current opacity-10 mx-2" />
               <div className="flex items-center gap-2 opacity-60">
                 <Layout size={14} />
                 <span className="text-[11px] font-bold uppercase tracking-wider">Widget Gallery</span>
               </div>
            </div>
            <button 
              onClick={() => setShowWidgetGallery(false)} 
              className="p-1 rounded-lg hover:bg-black/5 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Sub Header / Search */}
          <div className="h-20 px-8 flex items-center justify-between bg-white/5 border-b border-black/5">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                 <Layout size={20} />
               </div>
               <div>
                 <h2 className="text-lg font-bold tracking-tight leading-none">Add Widgets</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Personalize your Board</p>
               </div>
            </div>
            <div className="relative group flex items-center gap-3 px-4 py-2 bg-black/5 border border-black/5 rounded-xl focus-within:ring-4 ring-blue-500/10 transition-all">
              <Search size={14} className="text-slate-400 group-focus-within:text-blue-500" />
              <input 
                type="text" 
                placeholder="Search widgets" 
                className="bg-transparent border-none outline-none text-sm font-bold w-48 placeholder:text-slate-400"
                value={gallerySearch}
                onChange={(e) => setGallerySearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 flex min-h-0">
            {/* Sidebar Categories */}
            <div className="w-[280px] h-full border-r border-black/5 overflow-y-auto custom-scrollbar p-8 bg-white/30">
               <div className="space-y-10">
                  <section>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-2">Essentials</p>
                    <div className="space-y-1.5">
                      {[
                        { type: 'weather', name: 'Thời tiết', icon: Cloud, desc: 'Dự báo thời tiết 24h & 7 ngày tới.' },
                        { type: 'clock_date', name: 'Ngày & Giờ', icon: Clock, desc: 'Đồng hồ hệ thống đa phong cách.' },
                        { type: 'vtv6_countdown', name: 'VTV6 Live', icon: Tv, desc: 'Lịch thi đấu Euro/U23 trên VTV6.' },
                        { type: 'stocks', name: 'Thị trường', icon: TrendingUp, desc: 'Cập nhật chỉ số VN-Index, NASDAQ.' },
                        { type: 'notify', name: 'Trung tâm tin', icon: Bell, desc: 'Thông báo & News flash.' },
                        { type: 'vconnect_spark', name: 'Siêu tốc Vconnect', icon: Play, desc: 'Đăng nhanh Story, viết bài đăng Feed & nhắn tin Direct!' }
                      ].filter(w => w.name.toLowerCase().includes(gallerySearch.toLowerCase())).map((item) => (
                        <button 
                          key={item.type}
                          onClick={() => setSelectedGalleryWidget(item)}
                          className={`w-full flex items-center gap-4 p-4 rounded-[20px] transition-all group ${selectedGalleryWidget.type === item.type ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" : "hover:bg-white text-slate-600 active:scale-95"}`}
                        >
                           <div className={`p-2 rounded-xl transition-colors ${selectedGalleryWidget.type === item.type ? "bg-white/20" : "bg-slate-100 group-hover:bg-blue-50"}`}>
                             <item.icon size={18} className={selectedGalleryWidget.type === item.type ? "text-white" : "text-blue-500"} />
                           </div>
                           <span className="text-sm font-bold truncate">{item.name}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {purchasedWidgets.length > 0 && (
                    <section>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-2">Your Collection</p>
                      <div className="space-y-1.5">
                        {[
                          { id: 'music_player', name: 'Music Pro', icon: Music, desc: 'Trình phát nhạc cao cấp cho Vplay.' },
                          { id: 'weather_extended', name: 'Weather Pro', icon: Cloud, desc: 'Dự báo chuyên sâu 30 ngày.' },
                          { id: 'stocks_pro', name: 'Stocks Pro', icon: TrendingUp, desc: 'Phân tích kỹ thuật chứng khoán.' },
                          { id: 'calendar', name: 'Calendar Mint', icon: Calendar, desc: 'Lịch biểu tối giản.' },
                          { id: 'todo_list', name: 'To-Do List', icon: List, desc: 'Quản lý task thông minh.' },
                          { id: 'ai_for_me', name: 'AI Companion', icon: Sparkles, desc: 'Trợ lý AI cá nhân hóa.' },
                          { id: 'system_monitor', name: 'System Pro', icon: Activity, desc: 'Monitor CPU/RAM/Network.' },
                          { id: 'crypto_tracker', name: 'Crypto Live', icon: Bitcoin, desc: 'Giá tiền ảo Real-time.' },
                          { id: 'calculator_pro', name: 'Calc Pro', icon: Hash, desc: 'Máy tính học thuật.' },
                          { id: 'theme_pack_retro', name: 'Retro UI', icon: Palette, desc: 'Theme hoài niệm TV.' }
                        ].filter(item => purchasedWidgets.includes(item.id)).map((item) => (
                          <button 
                            key={item.id}
                            onClick={() => setSelectedGalleryWidget({ ...item, type: item.id })}
                            className={`w-full flex items-center gap-4 p-4 rounded-[20px] transition-all group ${selectedGalleryWidget.id === item.id || selectedGalleryWidget.type === item.id ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" : "hover:bg-white text-slate-600 active:scale-95"}`}
                          >
                             <div className={`p-2 rounded-xl transition-colors ${selectedGalleryWidget.id === item.id || selectedGalleryWidget.type === item.id ? "bg-white/20" : "bg-slate-100 group-hover:bg-blue-50"}`}>
                               <item.icon size={18} className={selectedGalleryWidget.id === item.id || selectedGalleryWidget.type === item.id ? "text-white" : "text-blue-500"} />
                             </div>
                             <span className="text-sm font-bold truncate">{item.name}</span>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  <section>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-2">Entertainment</p>
                    <div className="grid grid-cols-1 gap-1.5 focus:ring-0">
                       {channels.filter((c: any) => c.name.toLowerCase().includes(gallerySearch.toLowerCase())).slice(0, 6).map((ch: any) => (
                         <button 
                            key={ch.id}
                            onClick={() => setSelectedGalleryWidget({ type: 'channel', name: ch.name, channelId: ch.name, icon: Tv, desc: `Mini-player trực tiếp kênh ${ch.name}` })}
                            className={`flex items-center gap-4 p-4 rounded-[20px] transition-all group ${selectedGalleryWidget.channelId === ch.name ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" : "hover:bg-white text-slate-600 active:scale-95"}`}
                         >
                            <img src={ch.logo} className="w-6 h-6 object-contain rounded-lg" alt="" />
                            <span className="text-sm font-bold truncate">{ch.name}</span>
                         </button>
                       ))}
                    </div>
                  </section>
               </div>
            </div>

            {/* Preview & Action Area */}
            <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-white/50 relative">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_70%)] pointer-events-none" />
               
               <div className="max-w-2xl mx-auto py-16 px-12 flex flex-col items-center">
                  <motion.div 
                    key={selectedGalleryWidget.type || selectedGalleryWidget.id}
                    initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    className="mb-12"
                  >
                    <div className={`w-32 h-32 rounded-[40px] flex items-center justify-center p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-4 border-white ${
                      selectedGalleryWidget.type === 'weather' ? 'bg-[#0095ff]' : 
                      selectedGalleryWidget.type === 'vtv6_countdown' ? 'bg-[#ff3d3d]' : 
                      'bg-white'
                    }`}>
                       {selectedGalleryWidget.icon ? (
                         <selectedGalleryWidget.icon size={56} className={selectedGalleryWidget.type === 'weather' || selectedGalleryWidget.type === 'vtv6_countdown' ? 'text-white' : 'text-blue-500'} />
                       ) : (
                         <Layout size={56} className="text-blue-500" />
                       )}
                    </div>
                  </motion.div>

                  <div className="text-center space-y-4 mb-16">
                    <h3 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">{selectedGalleryWidget.name}</h3>
                    <p className="text-base text-slate-500 max-w-md font-medium leading-relaxed">{selectedGalleryWidget.desc}</p>
                  </div>
                  
                  <div className="w-full space-y-6">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] text-center">Select your preferred size</p>
                    <div className="grid grid-cols-2 gap-6">
                       {[
                         { size: '2x2', label: 'Classic (2x2)', icon: Grid },
                         { size: '4x4', label: 'Large (4x4)', icon: Maximize2 }
                       ].map((sizeOpt) => (
                         <button 
                           key={sizeOpt.size}
                           onClick={() => addWidget(selectedGalleryWidget, sizeOpt.size)}
                           className="group p-8 bg-white border border-black/5 rounded-[32px] hover:border-blue-500/50 transition-all flex flex-col items-center gap-5 shadow-sm hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] active:scale-[0.98]"
                         >
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                              <sizeOpt.icon size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <div className="text-center">
                              <span className="block text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{sizeOpt.label}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-60">Add to board</span>
                            </div>
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="mt-16 w-full pt-8 border-t border-black/5">
                     <div className="flex items-center justify-between p-6 bg-blue-600 rounded-[30px] text-white shadow-2xl shadow-blue-500/30 overflow-hidden relative group">
                        <div className="relative z-10">
                           <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Vplay Pro Store</p>
                           <p className="text-lg font-bold">Discover Premium Widgets</p>
                        </div>
                        <button 
                          onClick={() => { setShowWidgetGallery(false); setActiveBoardTab('vstore'); }}
                          className="relative z-10 px-6 py-3 bg-white text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                           Go to Store
                        </button>
                        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
  </>)}
</motion.div>
      )}
    </AnimatePresence>
  );
}

function WindowsDesktop({ 
  channels, 
  onOpenApp, 
  isDark, 
  setIsDark, 
  activeBoardTab,
  setActiveBoardTab,
  windows, 
  activeWindowId, 
  setWindows, 
  setActiveWindowId,
  focusWindow,
  minimizeWindow,
  wallpaper,
  setWallpaper,
  wallpaperType,
  solidColor,
  gradientColors,
  pinnedNames,
  setPinnedNames,
  featureFlags,
  setFeatureFlags,
  taskbarPos,
  setTaskbarPos,
  taskbarAlign,
  setTaskbarAlign,
  onExitSession,
  systemVolume,
  setSystemVolume,
  musicProgress,
  setMusicProgress,
  weatherCity,
  weatherData,
  userName,
  onLock,
  searchBoxPosition,
  activeSearchPlaceholder,
  showWidgets,
  setShowWidgets,
  isWidgetsFullScreen,
  setIsWidgetsFullScreen,
  isMobile
}: any) {
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [showDesktopSearch, setShowDesktopSearch] = useState(false);
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, ch: Channel | null } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleExitSession = () => {
    setShowExitConfirm(true);
    setShowQuickAccess(false);
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    onExitSession();
  };

  const changeWallpaper = () => {
    const url = prompt("Nhập URL hình nền mới:", wallpaper);
    if (url) setWallpaper(url);
    setContextMenu(null);
  };

  const pinnedChannels = channels.filter((ch: Channel) => pinnedNames.includes(ch.name));
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [hoveredTabRect, setHoveredTabRect] = useState<DOMRect | null>(null);

  return (
    <>
      {/* Context Menu Placeholder */}
      <div 
        className="fixed inset-0 z-0" 
        onClick={() => {
          setShowStartMenu(false);
          setShowDesktopSearch(false);
          setShowQuickAccess(false);
          setShowWidgets(false);
          setShowCalendar(false);
          setContextMenu(null);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY, ch: null });
        }}
      />
      {/* Dynamic Wallpaper */}
      <div 
        className="fixed inset-0 w-full h-full -z-10 transition-all duration-1000 shadow-inner"
        style={{ 
          backgroundColor: wallpaperType === 'solid' ? solidColor : undefined,
          backgroundImage: wallpaperType === 'gradient' 
            ? `linear-gradient(to bottom right, ${gradientColors[0]}, ${gradientColors[1]})` 
            : (wallpaperType === 'preset' ? `url(${wallpaper})` : undefined),
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }}
      />

      {/* Watermark only on Desktop */}
      <div className="absolute bottom-24 right-6 z-[1] text-right pointer-events-none select-none">
        <div className="text-[12px] font-normal text-white/40 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">Vplay Canary - Build Codename (C) Nx626</div>
        <div className="text-[10px] leading-tight mt-1.5 font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
          Working in progress - For testing purposes only so there will be lots of bugs<br />
          Some features may or may not made their way to Dev and final releases
        </div>
      </div>
      
      {/* Search and Start icon URL fixes in desktop icons if any */}
      
      <div className="flex-1 p-6 flex flex-col gap-4 content-start relative z-10">
        <div className="flex flex-col flex-wrap gap-4 h-[calc(100vh-140px)] content-start">
          <motion.button 
            drag dragMomentum={false}
            onDoubleClick={(e: any) => { e.stopPropagation(); window.open("https://vplay-beta-fa8k.vercel.app", "_blank"); }}
            onClick={(e: any) => e.stopPropagation()}
            className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-white/10 group transition-all w-24 cursor-grab active:cursor-grabbing"
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center border border-white/20 shadow-lg group-hover:scale-110 transition-transform overflow-hidden`}>
              <img 
                src="https://static.wikia.nocookie.net/ftv/images/a/a6/Imagedskvjndkv.png/revision/latest?cb=20260430103502&path-prefix=vi" 
                className="w-full h-full object-cover" 
                alt="Vplay" 
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-[11px] font-bold text-white text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Vplay Web</span>
          </motion.button>

          <motion.button 
            drag dragMomentum={false}
            onDoubleClick={(e: any) => { e.stopPropagation(); onOpenApp("browser"); }}
            onClick={(e: any) => e.stopPropagation()}
            className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-white/10 group transition-all w-24 cursor-grab active:cursor-grabbing"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center border border-white/20 shadow-lg group-hover:scale-110 transition-transform">
              <Globe className="text-white" size={28} />
            </div>
            <span className="text-[11px] font-bold text-white text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">V-Browser</span>
          </motion.button>

          <motion.button 
            drag dragMomentum={false}
            onDoubleClick={(e: any) => { e.stopPropagation(); onOpenApp("logs"); }}
            onClick={(e: any) => e.stopPropagation()}
            className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-white/10 group transition-all w-24 cursor-grab active:cursor-grabbing"
          >
            <div className="w-14 h-14 bg-slate-700 rounded-xl flex items-center justify-center border border-white/20 shadow-lg group-hover:scale-110 transition-transform">
              <FileCode className="text-white" size={28} />
            </div>
            <span className="text-[11px] font-bold text-white text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Update Logs</span>
          </motion.button>
          <motion.button 
            drag dragMomentum={false}
            onDoubleClick={(e: any) => { e.stopPropagation(); onOpenApp("explorer"); }}
            onClick={(e: any) => e.stopPropagation()}
            className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-white/10 group transition-all w-24 cursor-grab active:cursor-grabbing"
          >
            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center border border-white/20 shadow-lg group-hover:scale-110 transition-transform">
              <Folder className="text-white" size={28} />
            </div>
            <span className="text-[11px] font-bold text-white text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">File Explorer</span>
          </motion.button>
        </div>
      </div>

      {/* Quick Access Menu */}
      <AnimatePresence>
        {showQuickAccess && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed ${taskbarPos === 'bottom' ? 'bottom-16' : 'top-16'} right-4 w-80 z-[10000] rounded-3xl shadow-2xl border backdrop-blur-3xl p-6 flex flex-col gap-6 ${
              isDark ? "bg-[#1a1a1a]/95 border-white/10 text-white" : "bg-white/95 border-black/10 text-black shadow-2xl"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">System Volume</span>
                  <span className="text-[10px] font-bold opacity-40">{systemVolume}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <Volume2 size={16} className="opacity-40" />
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={systemVolume} 
                    onChange={(e) => setSystemVolume(parseInt(e.target.value))}
                    className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>

              {/* Advanced Media Control Area */}
              <div className={`p-4 rounded-2xl border ${isDark ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"} space-y-4`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Music className="text-white" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black uppercase tracking-tight truncate">Đang phát</p>
                    <p className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-black"}`}>Vplay OS Symphony - Canary Edition</p>
                    <p className="text-[10px] font-medium opacity-40 uppercase tracking-widest">Hệ thống Vplay</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold opacity-40">{Math.floor(musicProgress / 60)}:{String(musicProgress % 60).padStart(2, '0')}</span>
                    <span className="text-[9px] font-bold opacity-40">6:00</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="360" 
                    value={musicProgress} 
                    onChange={(e) => setMusicProgress(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                  />
                </div>

                <div className="flex items-center justify-center gap-6">
                  <button className="p-2 opacity-40 hover:opacity-100 transition-opacity"><SkipBack size={18} /></button>
                  <button className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all">
                    <Play size={20} className="ml-1" />
                  </button>
                  <button className="p-2 opacity-40 hover:opacity-100 transition-opacity"><SkipForward size={18} /></button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest opacity-60">System settings</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsDark(false)}
                    className={`p-2 rounded-xl border transition-all ${!isDark ? "bg-blue-600 border-blue-500 text-white" : (isDark ? "bg-white/5 border-white/5 text-white/40" : "bg-black/5 border-black/5 text-black/40")}`}
                  >
                    <Sun size={16} />
                  </button>
                  <button 
                    onClick={() => setIsDark(true)}
                    className={`p-2 rounded-xl border transition-all ${isDark ? "bg-blue-600 border-blue-500 text-white" : (isDark ? "bg-white/5 border-white/5 text-white/40" : "bg-black/5 border-black/5 text-black/40")}`}
                  >
                    <Moon size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      onLock();
                      setShowQuickAccess(false);
                    }}
                    className={`p-2 rounded-xl border transition-all ${isDark ? "bg-white/5 border-white/5 text-white/40 hover:bg-white/20 hover:text-white" : "bg-black/5 border-black/5 text-black/40 hover:bg-black/20 hover:text-black"}`}
                  >
                    <Lock size={16} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Taskbar Position</span>
                <div className="grid grid-cols-4 gap-2">
                  {(['top', 'bottom', 'left', 'right'] as const).map(pos => (
                    <button 
                      key={pos}
                      onClick={() => setTaskbarPos(pos)}
                      className={`py-2 rounded-lg border text-[9px] font-black uppercase transition-all ${taskbarPos === pos ? "bg-blue-600 border-blue-500 text-white shadow-lg" : "bg-white/5 border-white/5 opacity-40 hover:opacity-100"}`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Alignment</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['corner', 'center'] as const).map(align => (
                    <button 
                      key={align}
                      onClick={() => setTaskbarAlign(align)}
                      className={`py-2 rounded-lg border text-[9px] font-black uppercase transition-all ${taskbarAlign === align ? "bg-blue-600 border-blue-500 text-white shadow-lg" : "bg-white/5 border-white/5 opacity-40 hover:opacity-100"}`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={`h-px ${isDark ? "bg-white/10" : "bg-black/10"}`} />
            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-20 text-center">Vplay OS Preview v1.0.1</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[11000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-sm rounded-[32px] p-8 space-y-6 shadow-2xl border ${isDark ? "bg-[#1a1a1a] border-white/10" : "bg-white border-black/10"}`}
            >
              <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
                <LogOut size={32} />
              </div>
              <div className="text-center space-y-2">
                <h2 className={`text-xl font-black uppercase tracking-tight ${isDark ? "text-white" : "text-black"}`}>Exit Session?</h2>
                <p className={`text-sm font-medium ${isDark ? "text-white/40" : "text-black/40"}`}>You will be returned to the normal interface. All experimental features will be stopped.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowExitConfirm(false)}
                  className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest ${isDark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-black/5 text-black/60 hover:bg-black/10"}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmExit}
                  className="py-4 rounded-2xl bg-red-500 text-white font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-red-600 transition-colors"
                >
                  Exit Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start Menu */}
      <AnimatePresence>
        {showStartMenu && (
          <motion.div
            initial={{ y: 200, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 200, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed ${taskbarPos === 'bottom' ? 'bottom-16' : 'top-16'} ${taskbarAlign === 'center' ? 'left-1/2 -translateX-1/2' : 'left-4'} w-[400px] h-[550px] z-[5000] rounded-[32px] flex flex-col shadow-2xl border overflow-hidden backdrop-blur-3xl ${
              isDark ? "bg-[#1f1f1f]/95 border-white/10" : "bg-white/95 border-black/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 flex-1 flex flex-col overflow-hidden space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ${isDark ? "text-white" : "text-black"}`}>All Applications</h3>
                  <div className="flex items-center gap-2">
                     <button 
                       onClick={() => {
                         if (featureFlags?.settings_on_widgets) {
                           setShowWidgets(true);
                           setActiveBoardTab('settings');
                         } else {
                           onOpenApp("settings");
                         }
                         setShowStartMenu(false);
                       }}
                       className={`p-2 rounded-xl transition-all ${isDark ? "hover:bg-white/10 text-white" : "hover:bg-black/5 text-black"}`}
                     >
                        <Settings size={18} />
                     </button>
                     <button onClick={() => window.location.reload()} className={`p-2 rounded-xl transition-all ${isDark ? "hover:bg-white/10 text-white" : "hover:bg-black/10 text-black"}`}><RotateCcw size={18} /></button>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                  <div className="grid grid-cols-4 gap-4 pb-4">
                    <button
                      onClick={() => {
                        onOpenApp("vplay_web");
                        setShowStartMenu(false);
                      }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center p-2 border transition-colors border-white/10 overflow-hidden shadow-lg">
                        <img src={vplayLogo} alt="Vplay" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onOpenApp("explorer");
                        setShowStartMenu(false);
                      }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center p-2 border transition-all shadow-md group-hover:scale-110 ${isDark ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"}`}>
                        <Folder className="text-blue-500" size={24} />
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        if (featureFlags?.settings_on_widgets) {
                          setShowWidgets(true);
                          setActiveBoardTab('settings');
                        } else {
                          onOpenApp("settings");
                        }
                        setShowStartMenu(false);
                      }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center p-2 border transition-all shadow-md group-hover:scale-110 ${isDark ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"}`}>
                        <Settings className="text-slate-500" size={24} />
                      </div>
                    </button>

                    {channels.map(ch => (
                      <button
                        key={ch.name}
                        onClick={() => {
                          onOpenApp("tv", { channel: ch });
                          setShowStartMenu(false);
                        }}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all group ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center p-2 border transition-all shadow-md group-hover:scale-110 ${isDark ? "bg-white/5 border-white/5 group-hover:bg-white/10" : "bg-black/5 border-black/5 group-hover:bg-black/10"}`}>
                          <img src={ch.logo} className="w-full h-full object-contain" alt={ch.name} referrerPolicy="no-referrer" />
                        </div>
                      </button>
                    ))}
                  </div>
               </div>
               {/* Fixed Exit Session Button at bottom of Start Menu */}
               <div className="pt-4 border-t border-white/5">
                 <button 
                   onClick={() => {
                     setShowExitConfirm(true);
                     setShowStartMenu(false);
                   }}
                   className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${isDark ? "bg-red-500/10 hover:bg-red-500/20 text-red-500" : "bg-red-50 hover:bg-red-100 text-red-600"}`}
                 >
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-100 border-red-200"}`}>
                     <LogOut size={20} />
                   </div>
                   <div className="flex-1">
                     <p className="text-xs font-black uppercase tracking-tight">Exit Session</p>
                     <p className="text-[10px] font-bold opacity-60">Quay lại giao diện App</p>
                   </div>
                 </button>

                 <button 
                   onClick={() => {
                     onLock();
                     setShowStartMenu(false);
                   }}
                   className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left mt-2 ${isDark ? "bg-white/5 hover:bg-white/10 text-white" : "bg-black/5 hover:bg-black/10 text-black"}`}
                 >
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDark ? "bg-white/10 border-white/10" : "bg-black/10 border-black/10"}`}>
                     <Lock size={20} />
                   </div>
                   <div className="flex-1">
                     <p className="text-xs font-black uppercase tracking-tight">Sign Out</p>
                     <p className="text-[10px] font-bold opacity-60">Đăng xuất khỏi hệ thống</p>
                   </div>
                 </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Search Overlay (Small UI) */}
      <AnimatePresence>
        {showDesktopSearch && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className={`fixed ${taskbarPos === 'bottom' ? 'bottom-16' : 'top-16'} left-1/2 -translateX-1/2 w-[450px] z-[5000] rounded-[32px] flex flex-col shadow-2xl border overflow-hidden backdrop-blur-3xl ${
              isDark ? "bg-[#1f1f1f]/95 border-white/10" : "bg-white/95 border-black/10"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-6 relative group`}>
              <div className="relative">
                <Search className={`absolute left-5 top-1/2 -translate-y-1/2 opacity-40 ${isDark ? "text-white" : "text-black"}`} size={20} />
                <input 
                  autoFocus
                  placeholder={activeSearchPlaceholder}
                  className={`w-full bg-transparent border-none rounded-full py-4 pl-14 pr-6 outline-none transition-all font-medium text-sm ${isDark ? "text-white" : "text-black"}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className={`absolute bottom-0 left-0 h-[2.5px] w-full transition-all duration-300 ${isDark ? "bg-white/10" : "bg-black/5"} group-focus-within:bg-purple-500 group-focus-within:shadow-[0_0_15px_rgba(168,85,247,0.6)]`} />
            </div>
            {searchQuery.length > 0 && (() => {
              const filteredChannels = channels.filter(ch => 
                ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ch.category?.toLowerCase().includes(searchQuery.toLowerCase())
              );
              return (
                <div className="max-h-[300px] overflow-y-auto p-4 space-y-2 custom-scrollbar border-t border-black/5">
                   {filteredChannels.length > 0 ? filteredChannels.slice(0, 6).map(ch => (
                      <button
                        key={ch.name}
                        onClick={() => {
                          onOpenApp("tv", { channel: ch });
                          setShowDesktopSearch(false);
                          setSearchQuery("");
                        }}
                        className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all text-left ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}
                      >
                        <img src={ch.logo} alt={ch.name} className="w-10 h-10 object-contain rounded-lg p-1 bg-white/5" referrerPolicy="no-referrer" />
                        <div className="flex-1">
                          <p className={`text-xs font-black uppercase tracking-tight ${isDark ? "text-white" : "text-black"}`}>{ch.name}</p>
                          <p className={`text-[10px] font-bold opacity-40 ${isDark ? "text-white" : "text-black"}`}>{ch.category}</p>
                        </div>
                      </button>
                    )) : (
                      <p className="text-center py-6 opacity-30 font-black text-[10px] uppercase tracking-[0.2em]">No matches found</p>
                    )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className={`fixed z-[5005] w-56 p-1.5 rounded-2xl border backdrop-blur-3xl shadow-2xl ${isDark ? "bg-[#1a1a1a]/90 border-white/10" : "bg-white/90 border-black/10"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => { window.location.reload(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${isDark ? "hover:bg-white/10 text-white" : "hover:bg-black/5 text-black"}`}
            >
              <RefreshCw size={14} className="text-blue-500" />
              <span>Làm mới hệ thống</span>
            </button>
            <div className={`h-px my-1 ${isDark ? "bg-white/5" : "bg-black/5"}`} />
            <button 
              onClick={() => {
                if (featureFlags?.settings_on_widgets) {
                  setShowWidgets(true);
                  setActiveBoardTab('settings');
                } else {
                  onOpenApp("settings");
                }
                setContextMenu(null);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${isDark ? "hover:bg-white/10 text-white" : "hover:bg-black/5 text-black"}`}
            >
              <Settings size={14} className="text-purple-500" />
              <span>Cài đặt hệ thống</span>
            </button>
            <button 
              onClick={() => { setIsDark(!isDark); setContextMenu(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${isDark ? "hover:bg-white/10 text-white" : "hover:bg-black/5 text-black"}`}
            >
              {isDark ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} className="text-blue-500" />}
              <span>Chuyển chế độ {isDark ? "Sáng" : "Tối"}</span>
            </button>
            <div className={`h-px my-1 ${isDark ? "bg-white/5" : "bg-black/5"}`} />
            <button 
              onClick={() => { changeWallpaper(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${isDark ? "hover:bg-white/10 text-white" : "hover:bg-black/5 text-black"}`}
            >
              <ImageIcon size={14} className="text-emerald-500" />
              <span>Thay đổi hình nền</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar Flyout */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed ${taskbarPos === 'bottom' ? 'bottom-16' : 'top-16'} right-4 z-[1000] w-80 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[32px] p-6 shadow-2xl overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <span className="text-white text-lg font-bold capitalize">
                {new Date().toLocaleString('vi-VN', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white/10 rounded-xl transition-colors"><ChevronUp size={16} className="text-white/40" /></button>
                <button className="p-2 hover:bg-white/10 rounded-xl transition-colors"><ChevronDown size={16} className="text-white/40" /></button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-4 text-[10px] font-black uppercase tracking-widest text-white/20">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => <div key={d}>{d}</div>)}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 31 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${i + 1 === new Date().getDate() ? "bg-blue-600 text-white shadow-lg" : "text-white/60 hover:bg-white/5 active:scale-90"}`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Taskbar */}
      <div className={`h-14 absolute ${
        taskbarPos === "bottom" ? "bottom-0 left-0 w-full border-t" : 
        taskbarPos === "top" ? "top-0 left-0 w-full border-b" : 
        taskbarPos === "left" ? "left-0 top-0 h-full w-16 border-r flex-col py-6" : 
        "right-0 top-0 h-full w-16 border-l flex-col py-6"
      } z-[9999] flex items-center px-4 gap-1 ${isDark ? "bg-[#1a1a1a]/80 border-white/5" : "bg-white/80 border-black/5 shadow-2xl"} backdrop-blur-3xl`}
        onClick={(e) => {
          e.stopPropagation();
          setShowWidgets(false);
          setShowStartMenu(false);
          setShowDesktopSearch(false);
          setShowQuickAccess(false);
        }}
      >
        
        {/* Left section (pinned corner if alignment is corner) */}
        <div className={`flex ${taskbarPos === "left" || taskbarPos === "right" ? "flex-col" : "items-center"} gap-1.5`}>
          {/* Weather Widget */}
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              setShowWidgets(!showWidgets); 
            }}
            onMouseEnter={(e) => {
              setHoveredTab("Tiện ích & Thời tiết");
              setHoveredTabRect(e.currentTarget.getBoundingClientRect());
            }}
            onMouseLeave={() => {
              setHoveredTab(null);
              setHoveredTabRect(null);
            }}
            className={`h-11 px-3 flex items-center gap-3 rounded-xl transition-all ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
          >
            <Cloud size={20} className="text-blue-400" />
            {(taskbarPos !== "left" && taskbarPos !== "right") && (
              <div className="flex flex-col items-start leading-none">
                <span className={`text-[12px] font-medium uppercase tracking-tight ${isDark ? "text-white" : "text-black"}`}>{weatherData.temp}°C</span>
              </div>
            )}
          </button>

          {taskbarAlign === "corner" && (
            <>
              <button 
                onMouseEnter={(e) => {
                  setHoveredTab("Start");
                  setHoveredTabRect(e.currentTarget.getBoundingClientRect());
                }}
                onMouseLeave={() => {
                  setHoveredTab(null);
                  setHoveredTabRect(null);
                }}
                onClick={(e) => { e.stopPropagation(); setShowStartMenu(!showStartMenu); }}
                className={`h-11 w-11 flex items-center justify-center rounded-xl transition-all ${showStartMenu ? (isDark ? "bg-white/10" : "bg-black/10") : ""}`}
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-lg shadow-lg group overflow-hidden">
                  <img 
                    src="https://static.wikia.nocookie.net/ftv/images/a/a6/Imagedskvjndkv.png/revision/latest?cb=20260430103502&path-prefix=vi" 
                    className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                    alt="Start" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              </button>

              {taskbarPos !== "left" && taskbarPos !== "right" && searchBoxPosition !== "top" && (
                <div 
                  onMouseEnter={(e) => {
                    setHoveredTab("Search");
                    setHoveredTabRect(e.currentTarget.getBoundingClientRect());
                  }}
                  onMouseLeave={() => {
                    setHoveredTab(null);
                    setHoveredTabRect(null);
                  }}
                  onClick={(e) => { e.stopPropagation(); setShowDesktopSearch(!showDesktopSearch); }}
                  className={`flex items-center gap-3 px-4 h-10 w-44 rounded-full border transition-all cursor-pointer relative group overflow-hidden ${isDark ? "bg-white/5 border-white/10 text-white/40 hover:bg-white/10" : "bg-black/5 border-black/5 text-black/60 hover:bg-black/10"}`}
                >
                  <Search size={14} className="opacity-40" />
                  <span className="text-[10px] font-medium leading-none">{activeSearchPlaceholder}</span>
                  <div className={`absolute bottom-0 left-0 h-[2.5px] w-full transition-all duration-300 ${isDark ? "bg-white/10" : "bg-black/10"} group-hover:bg-purple-500`} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Center section (Start, Search & Apps) */}
        <div className={`flex-1 flex ${taskbarPos === "left" || taskbarPos === "right" ? "flex-col" : "items-center"} ${taskbarAlign === "center" ? "justify-center" : "justify-start"} gap-2 h-full transition-all duration-500`}>
           {taskbarAlign === "center" && (
             <div className={`flex ${taskbarPos === "left" || taskbarPos === "right" ? "flex-col" : "items-center"} gap-2`}>
               <button 
                 onMouseEnter={(e) => {
                   setHoveredTab("Start");
                   setHoveredTabRect(e.currentTarget.getBoundingClientRect());
                 }}
                 onMouseLeave={() => {
                   setHoveredTab(null);
                   setHoveredTabRect(null);
                 }}
                 onClick={(e) => { e.stopPropagation(); setShowStartMenu(!showStartMenu); }}
                 className={`h-11 w-11 flex items-center justify-center rounded-xl transition-all ${showStartMenu ? (isDark ? "bg-white/10" : "bg-black/10") : (isDark ? "hover:bg-white/5" : "hover:bg-black/8")}`}
               >
                 <div className="w-8 h-8 flex items-center justify-center rounded-lg shadow-lg group overflow-hidden">
                   <img 
                     src="https://static.wikia.nocookie.net/ftv/images/a/a6/Imagedskvjndkv.png/revision/latest?cb=20260430103502&path-prefix=vi" 
                     className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                     alt="Start" 
                     referrerPolicy="no-referrer"
                   />
                 </div>
               </button>
               {searchBoxPosition !== "top" && (
                 <div 
                   onMouseEnter={(e) => {
                     setHoveredTab("Search");
                     setHoveredTabRect(e.currentTarget.getBoundingClientRect());
                   }}
                   onMouseLeave={() => {
                     setHoveredTab(null);
                     setHoveredTabRect(null);
                   }}
                   onClick={(e) => { e.stopPropagation(); setShowDesktopSearch(!showDesktopSearch); }}
                   className={`flex items-center gap-3 px-4 h-10 w-44 rounded-full border transition-all cursor-pointer relative group overflow-hidden ${isDark ? "bg-white/5 border-white/10 text-white/40 hover:bg-white/10" : "bg-black/5 border-black/5 text-black/60 hover:bg-black/10"}`}
                 >
                   <Search size={14} className="opacity-40" />
                   <span className="text-[10px] font-medium leading-none">{activeSearchPlaceholder}</span>
                   <div className={`absolute bottom-0 left-0 h-[2.5px] w-full transition-all duration-300 ${isDark ? "bg-white/10" : "bg-black/10"} group-hover:bg-purple-500`} />
                 </div>
               )}
             </div>
           )}

           <div className={`h-6 w-px bg-white/5 mx-1 ${taskbarPos === "left" || taskbarPos === "right" ? "hidden" : "block"}`} />

           <button 
            onMouseEnter={(e) => {
              setHoveredTab("Task View");
              setHoveredTabRect(e.currentTarget.getBoundingClientRect());
            }}
            onMouseLeave={() => {
              setHoveredTab(null);
              setHoveredTabRect(null);
            }}
            onClick={() => {}} 
            className={`h-11 w-11 flex items-center justify-center rounded-xl transition-all ${isDark ? "hover:bg-white/10 text-white/40" : "hover:bg-black/5 text-black/40"}`}
          >
             <LayoutDashboard size={20} />
          </button>
          <button 
            onMouseEnter={(e) => {
              setHoveredTab("V-Browser");
              setHoveredTabRect(e.currentTarget.getBoundingClientRect());
            }}
            onMouseLeave={() => {
              setHoveredTab(null);
              setHoveredTabRect(null);
            }}
            onClick={() => onOpenApp("browser")} 
            className={`h-11 w-11 flex items-center justify-center rounded-xl transition-all ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
          >
             <Globe size={22} className="text-blue-500" />
          </button>
          <button 
            onMouseEnter={(e) => {
              setHoveredTab("Settings");
              setHoveredTabRect(e.currentTarget.getBoundingClientRect());
            }}
            onMouseLeave={() => {
              setHoveredTab(null);
              setHoveredTabRect(null);
            }}
            onClick={() => onOpenApp("settings")} 
            className={`h-11 w-11 flex items-center justify-center rounded-xl transition-all ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
          >
             <Settings size={22} className="text-blue-500" />
          </button>
          
          <AnimatePresence>
            {windows.map(win => (
              <motion.button
                layout
                key={win.id}
                onMouseEnter={(e) => {
                  setHoveredTab(win.title);
                  setHoveredTabRect(e.currentTarget.getBoundingClientRect());
                }}
                onMouseLeave={() => {
                  setHoveredTab(null);
                  setHoveredTabRect(null);
                }}
                onClick={() => {
                  if (win.isMinimized) {
                    setWindows(prev => prev.map(w => w.id === win.id ? { ...w, isMinimized: false } : w));
                    setActiveWindowId(win.id);
                  } else if (activeWindowId === win.id) {
                    minimizeWindow(win.id);
                  } else {
                    focusWindow(win.id);
                  }
                }}
                className={`h-11 w-11 flex items-center justify-center rounded-xl transition-all border-b-2 relative overflow-hidden ${
                  activeWindowId === win.id 
                   ? (isDark ? "bg-white/10 border-blue-500" : "bg-black/5 border-blue-600 shadow-sm")
                   : (isDark ? "bg-black/20 border-transparent hover:bg-white/5" : "bg-white/40 border-transparent hover:bg-black/5 shadow-inner")
                }`}
              >
                {win.type === "tv" ? <Tv size={20} className="text-blue-500" /> : win.type === "settings" ? <Settings size={20} className="text-blue-500" /> : win.type === "browser" ? <Globe size={20} className="text-blue-500" /> : win.type === "debug" ? <Terminal size={20} className="text-emerald-500" /> : <FileCode size={20} className="text-slate-400" />}
                {activeWindowId === win.id && <motion.div layoutId="win-active" className="absolute bottom-0 left-1 right-1 h-[3px] bg-blue-500 rounded-full" />}
              </motion.button>
            ))}
          </AnimatePresence>
       </div>

       {/* Right section (System Tray) */}
       <div className={`flex items-center justify-end gap-1 h-full ${taskbarPos === "left" || taskbarPos === "right" ? "min-w-0" : "min-w-[150px]"}`}>
         <div className="h-6 w-px bg-white/5 mx-1 hidden md:block" />

         <div 
           onClick={(e) => { e.stopPropagation(); setShowQuickAccess(!showQuickAccess); }}
           className={`flex items-center gap-2.5 px-3 h-10 rounded-xl transition-all cursor-pointer ${showQuickAccess ? "bg-white/10" : "hover:bg-white/5"} ${taskbarPos === "left" || taskbarPos === "right" ? "flex-col py-2" : ""}`}
         >
           <div className="flex items-center gap-1.5 opacity-60 grayscale hover:grayscale-0 transition-all">
             <Wifi size={14} className="text-white" />
             <Volume2 size={14} className="text-white" />
             <Battery size={14} className="text-white" />
           </div>
         </div>

         <div 
           onMouseEnter={(e) => {
             setHoveredTab(currentTime.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
             setHoveredTabRect(e.currentTarget.getBoundingClientRect());
           }}
           onMouseLeave={() => {
             setHoveredTab(null);
             setHoveredTabRect(null);
           }}
           onClick={(e) => { e.stopPropagation(); setShowWidgets(!showWidgets); }}
           className={`flex flex-col items-end justify-center px-3 h-10 rounded-xl transition-all cursor-pointer ${showWidgets ? "bg-white/10" : "hover:bg-white/5"} ${taskbarPos === "left" || taskbarPos === "right" ? "text-center items-center py-2" : ""}`}
         >
           <span className={`text-[12px] font-bold tracking-tight ${isDark ? "text-white" : "text-black"}`}>
             {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
           </span>
           {taskbarPos !== "left" && taskbarPos !== "right" && (
             <span className={`text-[9px] font-bold opacity-40 uppercase tracking-tighter ${isDark ? "text-white" : "text-black"}`}>
               {currentTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
             </span>
           )}
         </div>
         {taskbarPos !== "left" && taskbarPos !== "right" && (
           <div 
             onMouseEnter={(e) => {
               setHoveredTab("Show Desktop");
               setHoveredTabRect(e.currentTarget.getBoundingClientRect());
             }}
             onMouseLeave={() => {
               setHoveredTab(null);
               setHoveredTabRect(null);
             }}
             className={`w-1 h-10 flex items-center ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"} cursor-pointer ml-1 border-l border-white/5`} 
             onClick={() => windows.forEach(w => !w.isMinimized && minimizeWindow(w.id))} 
           />
         )}
       </div>
       <Tooltip text={hoveredTab || ""} show={!!hoveredTab} targetRect={hoveredTabRect} isDesktop={true} />
      </div>
    </>
  );
}


function SearchBar({ isDark, query, setQuery, onClose, liquidGlass, isTop, featureFlags, placeholder, onNavigate, setHoveredItem, setHoveredRect, variant = "standard" }: { isDark: boolean, query: string, setQuery: (q: string) => void, onClose: () => void, liquidGlass: "glassy" | "tinted", isTop?: boolean, featureFlags?: any, placeholder?: string, onNavigate?: (tab: string) => void, setHoveredItem?: (s: string | null) => void, setHoveredRect?: (r: DOMRect | null) => void, variant?: "standard" | "minimal" }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Không thể nhận diện giọng nói");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
    };

    recognition.start();
  };

  const isGlassy = liquidGlass === "glassy";
  
  const iconColor = (isGlassy ? "text-white/60" : "text-black/60");
  const placeholderColor = (isGlassy ? "placeholder-white/40" : "placeholder-black/40");
  const textColor = (isGlassy ? "text-white" : "text-black");

  // Fluent design matches the user's reference image
  return (
    <div className={`flex items-center gap-1 md:gap-4 px-3 md:px-4 py-1.5 ${isTop ? "h-10" : "h-12"} w-full ${isTop ? "max-w-xl" : "max-w-3xl"} relative group transition-all ${variant === "minimal" ? (isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10") + " rounded-full backdrop-blur-3xl" : (isDark ? "bg-[#1c1c1c] border-white/10 shadow-black/80" : "bg-white border-slate-200") + " rounded-[4px] border shadow-sm"} overflow-hidden inline-flex`}>
      <div className="flex items-center gap-1 md:gap-2 flex-1 h-full">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder || "Search controls and samples..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`flex-1 bg-transparent border-none outline-none ${isTop ? "text-sm" : "text-[15px]"} font-normal ${textColor} ${placeholderColor} h-full py-0`}
        />
        <Search className={`h-4 w-4 ${iconColor} flex-shrink-0 transition-colors group-focus-within:text-blue-400`} />
      </div>
      
      {/* Bottom Accent Line removed for minimal/pill variant to avoid visual bug */}
      {variant !== "minimal" && (
        <div className={`absolute bottom-0 left-0 h-[1.5px] w-full transition-all duration-300 opacity-80 ${isDark ? "bg-white/10" : "bg-black/5"} group-focus-within:bg-blue-500 group-focus-within:opacity-100 group-focus-within:h-[2px]`} />
      )}

      {/* Floating Tooltips/Buttons moved inside search bar for compact look */}
      <div className="flex items-center gap-3 ml-2 border-l border-white/5 pl-3">
        <button 
          onMouseEnter={(e) => {
            setHoveredItem?.("V-pilot");
            setHoveredRect?.(e.currentTarget.getBoundingClientRect());
          }}
          onMouseLeave={() => {
            setHoveredItem?.(null);
            setHoveredRect?.(null);
          }}
          onClick={() => {
            if (featureFlags?.ai_tools) {
              onNavigate?.("V-pilot");
            } else {
              window.open("https://copilot.microsoft.com", "_blank");
            }
          }}
          className={`transition-all hover:scale-110 active:scale-95 opacity-60 hover:opacity-100`}
        >
          <img 
            src={vpilotIcon} 
            className="w-4 h-4 object-contain grayscale hover:grayscale-0 transition-all" 
            alt="V-pilot"
          />
        </button>
        <button 
          onMouseEnter={(e) => {
            setHoveredItem?.("Operator Console");
            setHoveredRect?.(e.currentTarget.getBoundingClientRect());
          }}
          onMouseLeave={() => {
            setHoveredItem?.(null);
            setHoveredRect?.(null);
          }}
          onClick={() => onNavigate?.("Search")}
          className={`transition-all hover:scale-110 active:scale-95 opacity-60 hover:opacity-100`}
        >
          <Terminal size={16} className={iconColor} />
        </button>
        <button 
          onMouseEnter={(e) => {
            setHoveredItem?.(isListening ? "Đang nghe..." : "Voice Search");
            setHoveredRect?.(e.currentTarget.getBoundingClientRect());
          }}
          onMouseLeave={() => {
            setHoveredItem?.(null);
            setHoveredRect?.(null);
          }}
          onClick={startVoiceSearch}
          className={`transition-all ${isListening ? "text-red-500 animate-pulse" : `opacity-60 hover:opacity-100`}`}
        >
          <Mic size={16} className={iconColor} />
        </button>
      </div>
    </div>
  );
}

function ProtectedContent({ children, user, onLogin, isDark, isDev, liquidGlass }: { children: ReactNode, user: any, onLogin: () => void, isDark: boolean, isDev?: boolean, liquidGlass: "glassy" | "tinted" }) {
  if (!user && !isDev) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`p-6 ${liquidGlass ? "rounded-full" : "rounded-xl"} ${isDark ? "bg-purple-500/10" : "bg-purple-50"}`}
        >
          <Lock className={`h-12 w-12 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
        </motion.div>
        <div className="space-y-2">
          <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Đăng nhập</h2>
          <p className={`${isDark ? "text-slate-400" : "text-slate-500"} max-w-md mx-auto`}>
            Tận hưởng và trải nghiệm đầy đủ các tính năng của Vplay ngay hôm nay!
          </p>
        </div>
        <button
          onClick={onLogin}
          className={`px-8 py-3 font-bold transition-all hover:scale-105 active:scale-95 ${
            liquidGlass ? "rounded-2xl" : "rounded-lg"
          } ${
            isDark 
              ? "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]" 
              : "bg-purple-500 hover:bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]"
          }`}
        >
          Đăng nhập
        </button>
      </div>
    );
  }
  return <>{children}</>;
}

interface AppWindow {
  id: string;
  title: string;
  type: "settings" | "tv" | "logs" | "browser" | "debug" | "search" | "vplay_web" | "explorer";
  contentProps?: any;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

const LockScreen = ({ isDark, userName, weatherCity, onSignIn, setUserName, setWeatherCity, wallpaper }: { key?: string, isDark: boolean, userName: string, weatherCity: string, onSignIn: () => void, setUserName: (v: string) => void, setWeatherCity: (v: string) => void, wallpaper: string }) => {
  const [time, setTime] = useState(new Date());
  const [showInputs, setShowInputs] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSignIn = (e: FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      onSignIn();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -1000 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-[30000] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-[20s] scale-110"
        style={{ 
          backgroundImage: `url(${splashBg})`, 
          filter: showInputs ? "blur(30px) brightness(0.6) saturate(1.2)" : "brightness(0.9)" 
        }}
      />
      
      <AnimatePresence mode="wait">
        {!showInputs ? (
          <motion.div 
            key="lock-clock"
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -200, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center cursor-pointer select-none"
            onClick={() => setShowInputs(true)}
          >
            <h1 className="text-[140px] font-thin text-white tracking-tighter leading-none drop-shadow-2xl">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </h1>
            <p className="text-3xl text-white/90 font-light mt-4 drop-shadow-lg">
              {time.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <div className="mt-32 flex flex-col items-center gap-4 animate-bounce">
              <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.6em]">Trượt lên để đăng nhập</span>
              <ChevronLeft size={24} className="rotate-90 text-white/20" />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="lock-auth"
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative z-10 w-full max-w-sm px-8 flex flex-col items-center"
          >
            <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-3xl border border-white/30 flex items-center justify-center shadow-2xl mb-8 ring-8 ring-white/5">
              <User size={56} className="text-white" />
            </div>
            
            <h2 className="text-3xl font-light text-white mb-8 tracking-tight">Chào mừng quay trở lại</h2>

            <form onSubmit={handleSignIn} className="w-full flex flex-col gap-5">
              <div className="space-y-2">
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Người dùng"
                  className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 text-white placeholder:text-white/40 outline-none focus:bg-white/20 focus:border-white/40 transition-all font-medium text-center text-lg"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <input 
                  type="text" 
                  placeholder="Vị trí của bạn"
                  className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 text-white placeholder:text-white/40 outline-none focus:bg-white/20 focus:border-white/40 transition-all font-medium text-center text-lg"
                  value={weatherCity}
                  onChange={(e) => setWeatherCity(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-white text-black hover:bg-opacity-90 rounded-2xl py-4 mt-6 font-black uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95 text-sm"
              >
                Sign In
              </button>
              
              <button 
                type="button"
                onClick={() => setShowInputs(false)}
                className="text-white/50 text-[11px] font-bold uppercase tracking-widest hover:text-white transition-colors mt-4 self-center"
              >
                Quay lại màn hình khóa
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex items-center gap-6 text-white/20 text-[9px] font-black uppercase tracking-[0.4em] pointer-events-none">
        <span>Vplay OS Preview</span>
        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
        <span>Build Codename (C) Nx626</span>
      </div>
    </motion.div>
  );
};


function AIToolsMenu({ onAction, align = "bottom", featureFlags, tabs, activeTab, setActiveTab, setShowAIToolsMenu, setShowAIToolsMenuSidebar, isNarratorActive, setIsAISidebarOpen, setShowVTV6Popup }: any) {
  const [isDoStuffExpanded, setIsDoStuffExpanded] = useState(false);
  return (
    <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0 }}
    className={`absolute z-[10001] p-2 min-w-[240px] border shadow-2xl rounded-3xl backdrop-blur-3xl bg-white border-black/5 ${
      align === "bottom" ? "bottom-full left-0 mb-3" : 
      align === "bottom-right" ? "bottom-full right-0 mb-3" :
      align === "top" ? "top-full left-0 mt-3" :
      align === "right" ? "left-full top-0 ml-3" :
      "right-full top-0 mr-3"
    }`}
    onContextMenu={(e) => e.stopPropagation()}
    onClick={(e) => e.stopPropagation()}
  >
    <div className="space-y-1 text-slate-900">
      {featureFlags.copilot_action_v2 ? (
        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar p-1 space-y-1">
          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Navigation</div>
          {tabs.map((tab: any, idx) => {
            const Icon = tab.icon;
            return (
              <button 
                key={`floating-tab-${tab.id || tab.name}-${idx}`}
                onClick={() => {
                  if (tab.id === "VTV6_Tab") {
                    setShowVTV6Popup(true);
                  } else {
                    setActiveTab(tab.id || tab.name);
                  }
                  setShowAIToolsMenu(false);
                  setShowAIToolsMenuSidebar(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-black/5 ${activeTab === (tab.id || tab.name) ? "bg-black/5 text-blue-600" : "text-slate-900"}`}
              >
                {/* Monochrome black icons */}
                {typeof tab.icon === "string" ? (
                  <img src={tab.icon} className="w-5 h-5 object-contain grayscale" />
                ) : <Icon size={18} className={`text-black ${tab.id === "Thử nghiệm" ? "-scale-x-100" : ""}`} />}
                <span className="text-sm font-normal">{tab.name}</span>
              </button>
            );
          })}
          <div className="h-px bg-black/5 my-2" />
          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Intelligence</div>
          <button 
             onClick={() => onAction("ai_tools")}
             className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-black/5 text-slate-900`}
          >
             <Sparkles size={18} className="text-black" />
             <span className="text-sm font-medium">Open V-pilot</span>
          </button>
          <button 
             onClick={() => onAction("gemini")}
             className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-black/5 text-slate-900`}
          >
             <Sparkles size={18} className="text-black" />
             <span className="text-sm font-medium">Gemini AI</span>
          </button>

          <div className="h-px bg-black/5 my-2" />
          <div className="px-3 py-2 text-[10px] font-normal uppercase tracking-[0.2em] opacity-40">Utility</div>
          
          <button 
             onClick={(e) => {
               e.stopPropagation();
               setIsAISidebarOpen(true);
               setShowAIToolsMenu(false);
             }}
             className="w-full flex items-center justify-between p-3 rounded-2xl transition-all hover:bg-black/5 text-slate-900"
          >
             <div className="flex items-center gap-3">
               <Zap size={18} className="text-black" />
               <span className="text-sm font-medium">Do For Me</span>
             </div>
             <ArrowRight size={14} />
          </button>

          <button 
             onClick={() => onAction("search")}
             className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-black/5 text-slate-900`}
          >
             <Search size={18} className="text-black" />
             <span className="text-sm font-medium">AI Search & Command</span>
          </button>
          <button 
             onClick={() => onAction("operator")}
             className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-black/5 text-slate-900`}
          >
             <Terminal size={18} className="text-black" />
             <span className="text-sm font-medium">Operator Console (v2)</span>
          </button>
        </div>
      ) : (
        <div className="p-2 space-y-1">
          <button 
             onClick={() => onAction("ai_tools")}
             className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-black/5 text-slate-900`}
          >
             <Sparkles size={18} className="text-black" />
             <span className="text-sm font-medium">Open AI Tools</span>
          </button>
          <div className={`rounded-2xl border transition-all ${isDoStuffExpanded ? "bg-slate-50 border-slate-200 p-1" : "border-transparent"}`}>
            <button 
               onClick={(e) => {
                 e.stopPropagation();
                 setIsDoStuffExpanded(!isDoStuffExpanded);
               }}
               className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all hover:bg-black/5 ${isDoStuffExpanded ? "text-slate-900 font-black" : "text-slate-900"}`}
            >
               <div className="flex items-center gap-3">
                 <Zap size={18} className="text-black" />
                 <span className="text-sm font-medium">Do For Me</span>
               </div>
               <ChevronDown size={14} className={`transition-transform ${isDoStuffExpanded ? "rotate-180" : ""}`} />
            </button>
            
            {isDoStuffExpanded && (
              <div 
                className="overflow-hidden space-y-1 mt-1"
              >
                <button 
                   onClick={() => onAction("speak_for_me")}
                   className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-black/5 text-slate-700"
                >
                   <Mic size={16} className="text-black" />
                   <span className="text-xs font-bold">Speak For Me</span>
                </button>
                <button 
                   onClick={() => onAction("copy_for_me")}
                   className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-black/5 text-slate-700"
                >
                   <Copy size={16} className="text-black" />
                   <span className="text-xs font-bold">Copy For Me</span>
                </button>
                <button 
                   onClick={() => onAction("capture_for_me")}
                   className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-black/5 text-slate-700"
                >
                   <Camera size={16} className="text-black" />
                   <span className="text-xs font-bold">Capture For Me</span>
                </button>
                <button 
                   onClick={() => onAction("screen_recorder")}
                   className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-black/5 text-slate-700"
                >
                   <Video size={16} className="text-black" />
                   <span className="text-xs font-bold">Record For Me</span>
                </button>
                <button 
                   onClick={() => onAction("narrator")}
                   className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-black/5 ${isNarratorActive ? 'bg-black text-white' : 'text-slate-700'}`}
                >
                   <Volume2 size={16} className={isNarratorActive ? 'text-white' : 'text-black'} />
                   <span className="text-xs font-normal">Narrate For Me</span>
                </button>
                <div className="h-px bg-slate-200 mx-3 my-1" />
                <button 
                   onClick={() => onAction("about_do_stuff")}
                   className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-black/5 text-slate-500"
                >
                   <Info size={16} className="text-black" />
                   <span className="text-xs font-medium">Do For Me là gì?</span>
                </button>
              </div>
            )}
          </div>
          <button 
             onClick={() => onAction("gemini")}
             className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-black/5 text-slate-900`}
          >
             <Sparkles size={18} className="text-black" />
             <span className="text-sm font-medium">Gemini AI</span>
          </button>
          <button 
             onClick={() => onAction("search")}
             className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-black/5 text-slate-900`}
          >
             <Search size={18} className="text-black" />
             <span className="text-sm font-normal">Open AI Search</span>
          </button>
        </div>
      )}
    </div>
  </motion.div>
  );
}


function TaskBar({ items, activeTab, onTabClick, isDark, featureFlags, onAction, showAIToolsMenu, setShowAIToolsMenu, isAIToolsRotating, tabs, setActiveTab, setShowAIToolsMenuSidebar, isNarratorActive }: any) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      animate={{ y: 0 }}
      className={`fixed bottom-0 left-0 right-0 h-16 z-[7000] flex items-center justify-between px-6 border-t ${isDark ? "bg-black/60 border-white/10 backdrop-blur-3xl shadow-2xl" : "bg-white/70 border-slate-200 backdrop-blur-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.08)]"}`}
    >
       {/* Left Side: Spacer for centering */}
       <div className="flex-1 hidden md:block" />

       <div className="flex items-center gap-2 justify-center py-2 flex-grow-[2] scroll-smooth max-w-4xl mx-auto">
         {items.filter((t: any) => t.id !== "Cài đặt" && !t.isSearch).map((tab: any) => {
           const Icon = tab.icon;
           const isActive = activeTab === (tab.id || tab.name);
           if (tab.id === "V-pilot") return null; 
           return (
           <motion.button 
             key={tab.name}
             whileHover={{ scale: 1.1, y: -2 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => onTabClick(tab.id || tab.name)}
             className={`flex items-center justify-center w-16 h-14 rounded-2xl transition-all relative group ${isActive ? (isDark ? "bg-white/10 text-white shadow-lg ring-1 ring-white/20" : "bg-white text-slate-900 shadow-md border border-black/5") : (isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:bg-black/5")}`}
             title={tab.name}
           >
              <div className="flex-shrink-0">
                {typeof tab.icon === "string" ? <img src={tab.icon} alt={tab.name} className="w-8 h-8 object-contain" /> : <Icon size={32} className={tab.id === "Thử nghiệm" ? "-scale-x-100" : ""} />}
              </div>
              {isActive && (
                <motion.div 
                  layoutId="taskbarActiveIndicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-[3px] bg-blue-500 rounded-full"
                />
              )}
           </motion.button>
         )
       })}
        {!featureFlags.settings_on_widgets && (
          <motion.button
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onTabClick("Cài đặt")}
            className={`flex items-center justify-center w-16 h-14 rounded-2xl transition-all relative group ${activeTab === "Cài đặt" ? (isDark ? "bg-white/10 text-white shadow-lg ring-1 ring-white/20" : "bg-white text-slate-900 shadow-md border border-black/5") : (isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:bg-black/5")}`}
            title="Cài đặt"
          >
            <SettingsIcon size={32} />
            {activeTab === "Cài đặt" && (
              <motion.div 
                layoutId="taskbarActiveIndicator"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-[3px] bg-purple-500 rounded-full"
              />
            )}
          </motion.button>
        )}
     </div>
     
      <div className="flex items-center gap-5 flex-1 justify-end">
        {featureFlags.ai_tools && (
          <div className="relative" onMouseEnter={() => setShowAIToolsMenu(true)} onMouseLeave={() => setShowAIToolsMenu(false)}>
            <AnimatePresence>
              {showAIToolsMenu && (
                <AIToolsMenu 
                  onAction={onAction} 
                  align="bottom-right" 
                  featureFlags={featureFlags} 
                  tabs={tabs} 
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab} 
                  setShowAIToolsMenu={setShowAIToolsMenu} 
                  setShowAIToolsMenuSidebar={setShowAIToolsMenuSidebar} 
                  isNarratorActive={isNarratorActive}
                />
              )}
            </AnimatePresence>
             <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                onAction('rotate_ai');
                setShowAIToolsMenu(!showAIToolsMenu);
              }}
              className={`w-10 h-10 flex items-center justify-center relative transition-transform ${showAIToolsMenu ? "drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" : ""}`}
              title="V-pilot"
            >
               <Sparkles
                  className={isAIToolsRotating ? "animate-spin text-blue-500" : "text-blue-500"}
                  size={24}
                />
            </motion.button>
          </div>
        )}
        <div className="flex flex-col items-end mr-2">
           <span className="text-[10px] font-normal text-blue-500 opacity-80 mb-0.5 tracking-widest uppercase">System Ready</span>
           <div className={`h-1.5 w-16 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-black/5"}`}>
              <motion.div 
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="h-full w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
              />
           </div>
        </div>
      </div>
    </motion.div>
  );
}

function UserMenu({ 
  isDark, 
  user, 
  onLogin, 
  onLogout, 
  onNavigate,
  isSidebarRight,
  closeMenu,
  onVVerClick,
  onManageAccountClick,
  onFeedbackClick
}: { 
  isDark: boolean, 
  user: any, 
  onLogin: () => void, 
  onLogout: () => void, 
  onNavigate: (tab: string) => void,
  isSidebarRight: boolean,
  closeMenu: () => void,
  onVVerClick: () => void,
  onManageAccountClick: () => void,
  onFeedbackClick: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -40, scale: 0.95 }}
      className={`absolute top-12 left-0 w-80 rounded-[32px] overflow-hidden border shadow-2xl z-[1000] ${
        isDark ? "bg-[#1a1c23] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
      }`}
    >
      <div className="p-8 flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-slate-500/10 flex items-center justify-center border-2 border-purple-500/20 overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={32} className="text-slate-400" />
            )}
          </div>
        </div>
        
        <div className="space-y-1">
          <h3 className="text-xl font-bold tracking-tight">
            {user ? (user.displayName || "Người dùng") : "Khách"}
          </h3>
          <p className="text-[11px] opacity-60 font-medium">
            {user ? user.email : "Đăng nhập để có trải nghiệm tốt nhất"}
          </p>
        </div>

        <button 
          onClick={() => {
            if (user) onLogout();
            else onLogin();
            closeMenu();
          }}
          className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-purple-600/20 active:scale-95 text-xs"
        >
          {user ? "Đăng xuất" : "Đăng nhập"}
        </button>
      </div>

      <div className={`p-4 space-y-1 border-t ${isDark ? "border-white/5 bg-white/5" : "border-slate-100 bg-slate-50/50"}`}>
        <button 
          onClick={() => { onVVerClick(); closeMenu(); }}
          className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-black/5 group text-left`}
        >
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
            <Info size={18} />
          </div>
          <span className="text-[13px] font-bold">V-ver</span>
        </button>

        <button 
          onClick={() => { onManageAccountClick(); closeMenu(); }}
          className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-black/5 group text-left`}
        >
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
            <Monitor size={18} />
          </div>
          <span className="text-[13px] font-bold">Manage account</span>
        </button>

        <button 
          onClick={() => { onFeedbackClick(); closeMenu(); }}
          className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-black/5 group text-left`}
        >
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
            <SendFeedback size={18} />
          </div>
          <span className="text-[13px] font-bold">Give Feedback</span>
        </button>

        <button 
          onClick={() => { onNavigate("Cài đặt"); closeMenu(); }}
          className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-black/5 group text-left`}
        >
          <div className="p-2 rounded-xl bg-slate-500/10 text-slate-500 group-hover:scale-110 transition-transform">
            <Settings size={18} />
          </div>
          <span className="text-[13px] font-bold">Settings</span>
        </button>
      </div>
    </motion.div>
  );
}

const SendFeedback = ({ size = 20, className }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export default function App() {
  const [showEraseModal, setShowEraseModal] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [eraseProgress, setEraseProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isErasing) {
      setEraseProgress(0);
      const duration = 60000; // 60 seconds (1 minute)
      const steps = 100;
      const intervalTime = duration / steps; // 600ms per step
      interval = setInterval(() => {
        setEraseProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            localStorage.clear();
            window.location.reload();
            return 100;
          }
          return prev + 1;
        });
      }, intervalTime);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isErasing]);

  const [showWidgets, setShowWidgets] = useState(false);
  const [activeBoardTab, setActiveBoardTab] = useState<'widgets' | 'feed' | 'settings' | 'dev' | 'doforme' | 'vstore' | 'update_widgets_feed' | 'erase_data' | 'history' | 'notifications_board'>('widgets');
  const [widgetsTheme, setWidgetsTheme] = useState<"light" | "dark">(() => (localStorage.getItem("vplay_widgets_theme") as "light" | "dark") || "light");
  const [activeDoForMeSubView, setActiveDoForMeSubView] = useState<string | null>(null);
  const [pinnedDoForMeFeatures, setPinnedDoForMeFeatures] = useState<string[]>(() => {
    const saved = localStorage.getItem("vplay_pinned_doforme");
    return saved ? JSON.parse(saved) : [];
  });

  const togglePinFeature = (id: string) => {
    const newPinned = pinnedDoForMeFeatures.includes(id)
      ? pinnedDoForMeFeatures.filter(f => f !== id)
      : [...pinnedDoForMeFeatures, id];
    setPinnedDoForMeFeatures(newPinned);
    localStorage.setItem("vplay_pinned_doforme", JSON.stringify(newPinned));
  };
  
  const [pinnedWidgets, setPinnedWidgets] = useState<any[]>(() => {
    const saved = localStorage.getItem("vplay_widget_board_pins");
    return saved ? JSON.parse(saved) : [
      { id: 'weather', type: 'weather', size: 'medium' },
      { id: 'stocks', type: 'stocks', size: 'small' },
      { id: 'clock_date', type: 'clock_date', size: 'medium' },
      { id: 'vtv6_countdown', type: 'vtv6_countdown', size: 'medium' }
    ];
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showVVer, setShowVVer] = useState(false);
  const [showManageAccount, setShowManageAccount] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isWidgetsFullScreen, setIsWidgetsFullScreen] = useState(false);
  const [hoveredHeadingItem, setHoveredHeadingItem] = useState<string | null>(null);
  const [hoveredHeadingRect, setHoveredHeadingRect] = useState<DOMRect | null>(null);
  const [weatherData, setWeatherData] = useState<{ temp: number, condition: string }>({ temp: 28, condition: "Partly Sunny" });

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=10.75&longitude=106.67&current_weather=true");
        const data = await res.json();
        if (data.current_weather) {
          setWeatherData({
            temp: Math.round(data.current_weather.temperature),
            condition: data.current_weather.weathercode <= 3 ? "Clear/Partly Cloudy" : "Cloudy/Rainy"
          });
        }
      } catch (e) {
        console.error("Weather fetch failed", e);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); 
    return () => clearInterval(interval);
  }, []);
  const [notifications, setNotifications] = useState<any[]>(() => {
    const saved = localStorage.getItem("vplay_notifications");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch {}
    }
    const defaultNotifs = [
      {
        id: Date.now() - 1000,
        title: "Cập nhật hệ thống vPlay Build 2026.05 SFX",
        message: "Phiên bản Canary mới nhất đã được áp dụng thành công. Sửa đổi độ bo cong mềm mịn hơn của bảng widgets, chỉnh nút 'Add widgets' thành font chữ Regular đẹp mắt.",
        type: "success",
        time: new Date().toISOString(),
        read: false,
        category: "UPDATE"
      },
      {
        id: Date.now() - 10000,
        title: "Hệ thống Respring khôi phục thành công",
        message: "Quá trình Respring / Reboot nhanh diễn ra an toàn. Đã làm sạch các phân mảnh bộ nhớ đệm widget, cập nhật mượt mà danh sách luồng phát sóng.",
        type: "info",
        time: new Date(Date.now() - 180000).toISOString(),
        read: false,
        category: "RESPRING"
      },
      {
        id: Date.now() - 120000,
        title: "Kích hoạt Vplay Store & Vpoints Bonus",
        message: "Chào mừng bạn gia nhập! Hệ sinh thái Vplay Store đã được đồng bộ với tài khoản. Khởi tạo sẵn 100 VP để trải nghiệm miễn phí.",
        type: "info",
        time: new Date(Date.now() - 86400000).toISOString(),
        read: true,
        category: "SYSTEM"
      }
    ];
    localStorage.setItem("vplay_notifications", JSON.stringify(defaultNotifs));
    return defaultNotifs;
  });
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [history, setHistory] = useState<{id: string, type: string, content: string, time: number}[]>(() => {
    const saved = localStorage.getItem("vplay_history");
    try {
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [historyStats, setHistoryStats] = useState<{buttonClicks: number, switchesToggled: number, popupsOpened: number, channelsWatched: number, lastVisit: string}>(() => {
    const saved = localStorage.getItem("vplay_history_stats");
    try {
      return saved ? JSON.parse(saved) : {
        buttonClicks: 0,
        switchesToggled: 0,
        popupsOpened: 0,
        channelsWatched: 0,
        lastVisit: new Date().toISOString()
      };
    } catch {
      return {
        buttonClicks: 0,
        switchesToggled: 0,
        popupsOpened: 0,
        channelsWatched: 0,
        lastVisit: new Date().toISOString()
      };
    }
  });

  const logHistory = (type: string, content: string) => {
    const newEvent = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        content,
        time: Date.now()
    };
    setHistory(prev => {
        const updated = [newEvent, ...prev].slice(0, 100);
        localStorage.setItem("vplay_history", JSON.stringify(updated));
        return updated;
    });
  };

  const incrementStat = (key: string) => {
    setHistoryStats(prev => {
        const updated = { ...prev, [key]: (prev as any)[key] + 1 };
        localStorage.setItem("vplay_history_stats", JSON.stringify(updated));
        return updated;
    });
  };

  useEffect(() => {
    setHistoryStats(prev => ({ ...prev, lastVisit: new Date().toISOString() }));
  }, []);


  useEffect(() => {
    localStorage.setItem("vplay_notifications", JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const newNotif = {
      id: Date.now(),
      title,
      message,
      type,
      time: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const clearNotifications = () => setNotifications([]);
  const markAsRead = (id: number) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const SCAMBIDI_LOGOS: Record<string, string> = {
    "VTV1": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcREpdu2T6QK4Q4cinn3ff8l8OlkzPiGtoH2Eg&s",
    "VTV2": "https://static.wikia.nocookie.net/logos/images/b/b2/VTV2_2008_%28H%C3%ACnh_Hi%E1%BB%87u%29.webp/revision/latest/scale-to-width-down/1000?cb=20260303025530&path-prefix=uk",
    "VTV3": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSCqvNAipH47lNaXa1mXBO-I-u9ZTPs9RfLEg&s",
    "VTV4": "https://mytv.com.vn/truyen-hinh/378",
    "VTV5": "https://static.wikia.nocookie.net/logos/images/5/50/VTV5_logo_10.02-09.06.2002.webp/revision/latest?cb=20260225005007&path-prefix=uk",
    "VTV6": "https://www.facebook.com/groups/tulieutruyenthongVN/posts/2955393971273895/",
    "VTV7": "https://static.wikia.nocookie.net/logos/images/4/43/VTV7_logo_08.01.2020.png/revision/latest?cb=20260227021513&path-prefix=uk",
    "VTV8": "https://static.wikia.nocookie.net/logos/images/7/73/Logo_VTV8_01.02.2016.png/revision/latest?cb=20260228014157&path-prefix=uk",
    "VTV9": "https://static.wikia.nocookie.net/logos/images/1/15/VTV9_logo_01.03.2014_v2_16-9.png/revision/latest/scale-to-width-down/1000?cb=20260301084347&path-prefix=uk",
    "VTV10": "https://cdn-images.vtv.vn/zoom/554_346/66349b6076cb4dee98746cf1/2026/03/29/vtv10-79693868843399439986350-53806200669872135813402.jpg",
    "Vietnam Today": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQBoproqoYuWX7aw6f9haoU7irTpPxPZjBLw&s"
  };

  const [featureFlags, setFeatureFlags] = useState<{ [key: string]: any }>(() => {
    try {
      const saved = localStorage.getItem("vplay_feature_flags");
      const defaults = { 
        multiview_experimental: false, 
        disable_animation: false, 
        sidebar_resizable: false, 
        sidebar_v3: false,
        windows_mode: false,
        xaml_view_test: true,
        dialog_redesign_v2: true,
        settings_vertical: true,
        music_background: true,
        scambidi_ui: false,
        minecraft_mode: false,
        xaml_home: false,
        xaml_search: false,
        xaml_oobe_force: false,
        win8_metro: false,
        revamp_process_animation: false,
        vids_for_uploads: true,
        search_merge: false,
        microslop_copilot: false,
        scrollable_bar: false,
        search_placeholder_treatment: false,
        search_placeholder_treatment_id: 1,
        ai_tools: false,
        ai_sidebar: false,
        taskbar_experimental: false,
        top_bar: true,
        cobalt_ui: false,
        cobalt_scrollbar: false,
        xaml_experience: true,
        vids_feature: false
      };
      if (!saved) return defaults;
      const parsed = JSON.parse(saved);
      return { ...defaults, ...parsed };
    } catch (e) {
      return { 
        multiview_experimental: false, 
        disable_animation: false, 
        sidebar_resizable: false, 
        sidebar_v3: false,
        windows_mode: false,
        xaml_view_test: true,
        settings_vertical: true,
        music_background: true,
        scambidi_ui: false,
        minecraft_mode: false,
        xaml_home: false,
        xaml_search: false,
        xaml_oobe_force: false,
        win8_metro: false,
        revamp_process_animation: false,
        vids_for_uploads: true,
        search_merge: false,
        microslop_copilot: false,
        scrollable_bar: false,
        search_placeholder_treatment: false,
        search_placeholder_treatment_id: 1,
        ai_tools: false,
        ai_sidebar: false,
        top_bar: true,
        cobalt_scrollbar: false,
        xaml_experience: false,
        vids_feature: false
      };
    }
  });

  const [randomSearchSeed] = useState(() => Math.floor(Math.random() * SEARCH_TREATMENTS.length));
  
  const scambidifiedChannels = channels;

  const [windows, setWindows] = useState<AppWindow[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasUpdatedOS, setHasUpdatedOS] = useState(() => localStorage.getItem("vplay_canary_updated") === "true");

  const handleToggleOS = (val: boolean) => {
    if (val && !hasUpdatedOS) {
      if (confirm("Giao diện VplayOS yêu cầu tải xuống các gói tài nguyên mới (Vplay Canary Update). Bạn có muốn cập nhật ngay bây giờ?")) {
        setIsUpdating(true);
        setTimeout(() => {
          setHasUpdatedOS(true);
          localStorage.setItem("vplay_canary_updated", "true");
          setIsUpdating(false);
          setFeatureFlags(prev => ({ ...prev, windows_mode: true }));
        }, 60000);
        return;
      }
      return;
    }

    setIsChangingSession(true);
    setTimeout(() => {
      setFeatureFlags(prev => ({ ...prev, windows_mode: val }));
      setTimeout(() => {
        setIsChangingSession(false);
      }, 500);
    }, 10000);
  };

  const openWindow = useCallback((type: "settings" | "tv" | "logs" | "browser" | "debug" | "search" | "vplay_web" | "explorer", props?: any) => {
    const id = `${type}_${Date.now()}`;
    const titles: { [key: string]: string } = {
      settings: "Cài đặt hệ thống",
      debug: "Operator Console",
      search: "Search & Discovery",
      vplay_web: "Vplay Official Web",
      browser: "V-Browser",
      explorer: "File Explorer"
    };
    const title = titles[type] || props?.channel?.name || "Window";
    
    let defaultWidth = 800;
    let defaultHeight = 550;
    
    if (type === "tv") {
      defaultWidth = 900;
      defaultHeight = 600;
    } else if (type === "vplay_web") {
      defaultWidth = 1000;
      defaultHeight = 700;
    } else if (type === "explorer") {
      defaultWidth = 950;
      defaultHeight = 650;
    }
    
    const newWindow: AppWindow = {
      id,
      title,
      type,
      contentProps: props,
      isMinimized: false,
      isMaximized: type === "tv" && window.innerWidth < 1024,
      zIndex: windows.length + 100,
      width: defaultWidth,
      height: defaultHeight,
      x: 100 + (windows.length * 30),
      y: 100 + (windows.length * 30)
    };
    setWindows(prev => [...prev, newWindow]);
    setActiveWindowId(id);
  }, [windows]);

  const closeWindow = (id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    if (activeWindowId === id) setActiveWindowId(null);
  };

  const focusWindow = (id: string) => {
    setActiveWindowId(id);
    setWindows(prev => prev.map(w => ({
      ...w,
      isMinimized: w.id === id ? false : w.isMinimized,
      zIndex: w.id === id ? Math.max(...prev.map(x => x.zIndex), 100) + 1 : w.zIndex
    })));
  };

  const minimizeWindow = (id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: !w.isMinimized } : w));
  };

  const maximizeWindow = (id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
  };

  const [isDark, setIsDark] = useState(true);
  const [vconnectIsDark, setVconnectIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("vplay_vconnect_is_dark");
    return saved !== null ? (saved === "true") : true;
  });
  const [searchBoxPosition, setSearchBoxPosition] = useState(() => {
    return localStorage.getItem("vplay_search_position") || "sidebar";
  });

  const [forcedFont, setForcedFont] = useState(() => {
    return "";
  });

  const [desktopWallpaper, setDesktopWallpaper] = useState(() => {
    const saved = localStorage.getItem("vplay_desktop_wallpaper");
    return saved || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"; 
  });

  const [wallpaperType, setWallpaperType] = useState<"preset" | "solid" | "gradient">(() => {
    return (localStorage.getItem("vplay_wallpaper_type") as any) || "preset";
  });
  const [solidColor, setSolidColor] = useState(() => {
    return localStorage.getItem("vplay_wallpaper_solid_color") || "#0b0b0b";
  });
  const [gradientColors, setGradientColors] = useState<[string, string]>(() => {
    const saved = localStorage.getItem("vplay_wallpaper_gradient_colors");
    return saved ? JSON.parse(saved) : ["#2d0b3b", "#1a0525"];
  });

  const currentWallpaper = useMemo(() => {
    if (wallpaperType !== 'preset') return "";
    if (desktopWallpaper) return desktopWallpaper;
    return splashBg;
  }, [desktopWallpaper, wallpaperType]);

  const [showCalendar, setShowCalendar] = useState(false);

  const [taskbarPos, setTaskbarPos] = useState<"bottom" | "top" | "left" | "right">(() => {
    return (localStorage.getItem("vplay_taskbar_pos") as any) || "bottom";
  });

  const [taskbarAlign, setTaskbarAlign] = useState<"corner" | "center">(() => {
    return (localStorage.getItem("vplay_taskbar_align") as any) || "center";
  });

  const [isChangingSession, setIsChangingSession] = useState(false);
  const [systemVolume, setSystemVolume] = useState(80);
  const [musicProgress, setMusicProgress] = useState(0);
  const [userName, setUserName] = useState(() => localStorage.getItem("vplay_user_name") || "");
  const [weatherCity, setWeatherCity] = useState(() => localStorage.getItem("vplay_location") || "Hồ Chí Minh");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [isLocked, setIsLocked] = useState(() => !localStorage.getItem("vplay_user_name"));
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);



  const [pinnedChannelNames, setPinnedChannelNames] = useState<string[]>(() => {
    const saved = localStorage.getItem("vplay_pinned_channels");
    // Default some pins if empty? Or keep it clean.
    return saved ? JSON.parse(saved) : ["VTV1", "VTV3", "HTV7", "VTC1"];
  });


  const [showDevConfirm, setShowDevConfirm] = useState(false);
  const [backgroundMusicOption, setBackgroundMusicOption] = useState(() => {
    return localStorage.getItem("vplay_bg_music_option") || "queue";
  });
  const [customMusicId, setCustomMusicId] = useState(() => {
    return localStorage.getItem("vplay_custom_music_id") || "";
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDev, setIsDev] = useState(() => {
    return localStorage.getItem("vplay_dev_mode") === "true";
  });

  const [isUnlimitedVpoints, setIsUnlimitedVpoints] = useState(() => {
    return localStorage.getItem("vplay_unlimited_vpoints") === "true";
  });
  const [isRespring, setIsRespring] = useState(() => {
    return localStorage.getItem("vplay_respring") === "true";
  });
  const [isRespringBypassing, setIsRespringBypassing] = useState(false);
  const [respringKeypassInput, setRespringKeypassInput] = useState("");

  const [pendingDevOption, setPendingDevOption] = useState<string | null>(null);
  const [pendingDevOptionLabel, setPendingDevOptionLabel] = useState<string>("");
  const [devKeypassInput, setDevKeypassInput] = useState("");
  const [showDevModal, setShowDevModal] = useState(false);
  const [devCustomPointsInput, setDevCustomPointsInput] = useState("");
  const [showCustomPointsStep, setShowCustomPointsStep] = useState(false);

  const handleDevOptionClick = (id: string, label: string) => {
    setPendingDevOption(id);
    setPendingDevOptionLabel(label);
    setDevKeypassInput("");
    setDevCustomPointsInput("");
    setShowCustomPointsStep(false);
    setShowDevModal(true);
  };

  const executeDevOption = (id: string) => {
    if (id === 'trigger_oobe') {
      localStorage.removeItem("vplay_seen_oobe");
      setShowOOBE(true);
      setShowWidgets(false);
      addNotification("Dev", "Triggered setup OOBE.", "info");
    } else if (id === 'unlimited_vpoints') {
      const nextVal = !isUnlimitedVpoints;
      setIsUnlimitedVpoints(nextVal);
      localStorage.setItem("vplay_unlimited_vpoints", nextVal.toString());
      addNotification("Dev", `Unlimited Vpoints: ${nextVal ? "ENABLED" : "DISABLED"}`, "info");
    } else if (id === 'purchase_all_store_widgets') {
      const allWidgets = [
        'music_player', 'weather_extended', 'stocks_pro', 'calendar', 'todo_list', 
        'ai_for_me', 'v_assistant', 'theme_pack_retro', 'system_monitor', 
        'crypto_tracker', 'calculator_pro', 'image_gen', 'email_client', 'news_reader', 'browser_lite'
      ];
      setPurchasedWidgets(allWidgets);
      localStorage.setItem("vplay_purchased_widgets", JSON.stringify(allWidgets));
      addNotification("Dev", "Tất cả tiện ích đã được đăng ký sở hữu trên Vstore!", 'success');
    } else if (id === 'pin_all_widgets_to_feed') {
      const allPins = [
        { id: 'weather', type: 'weather', size: 'medium' },
        { id: 'clock_date', type: 'clock_date', size: 'medium' },
        { id: 'vtv6_countdown', type: 'vtv6_countdown', size: 'medium' },
        { id: 'stocks', type: 'stocks', size: 'small' },
        { id: 'notify', type: 'notify', size: 'medium' },
        { id: 'music_player', type: 'music_player', size: 'medium' },
        { id: 'weather_extended', type: 'weather_extended', size: 'medium' },
        { id: 'stocks_pro', type: 'stocks_pro', size: 'medium' },
        { id: 'calendar', type: 'calendar', size: 'medium' },
        { id: 'todo_list', type: 'todo_list', size: 'medium' },
        { id: 'ai_for_me', type: 'ai_for_me', size: 'medium' },
        { id: 'system_monitor', type: 'system_monitor', size: 'medium' },
        { id: 'crypto_tracker', type: 'crypto_tracker', size: 'medium' },
        { id: 'calculator_pro', type: 'calculator_pro', size: 'medium' },
        { id: 'theme_pack_retro', type: 'theme_pack_retro', size: 'medium' }
      ];
      setPinnedWidgets(allPins);
      localStorage.setItem("vplay_widget_board_pins", JSON.stringify(allPins));
      addNotification("Dev", "Đã ghim toàn bộ tiện ích vào Board!", 'success');
    } else if (id === 'unpin_all_widgets_from_feed') {
      setPinnedWidgets([]);
      localStorage.setItem("vplay_widget_board_pins", JSON.stringify([]));
      addNotification("Dev", "Đã gỡ ghim toàn bộ các tiện ích ra khỏi Board!", 'info');
    } else if (id === 'reset_vstore') {
      setVpoints(100);
      setPurchasedWidgets([]);
      localStorage.removeItem("vplay_vpoints");
      localStorage.removeItem("vplay_purchased_widgets");
      addNotification("Dev", "Vstore đã được reset về trạng thái ban đầu.", 'warning');
    } else if (id === 'reset_widgets_feed') {
      const defaultWidgets = [
        { id: 'weather', type: 'weather', size: 'medium' },
        { id: 'stocks', type: 'stocks', size: 'small' },
        { id: 'clock_date', type: 'clock_date', size: 'medium' },
        { id: 'vtv6_countdown', type: 'vtv6_countdown', size: 'medium' }
      ];
      setPinnedWidgets(defaultWidgets);
      localStorage.setItem("vplay_widget_board_pins", JSON.stringify(defaultWidgets));
      addNotification("Dev", "Board tiện ích khôi phục về cấu hình mặc định.", 'info');
    } else if (id === 'respring_data') {
      localStorage.setItem("vplay_respring", "true");
      setIsRespring(true);
      addNotification("Dev", "Respring mode activated. Reloading...", 'warning');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else if (id === 'erase_data') {
      setShowEraseModal(true);
      setShowWidgets(false);
    }
  };

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [showOOBE, setShowOOBE] = useState(false);
  const [forcedOOBEInfo, setForcedOOBEInfo] = useState<{ title: string, subtitle: string } | null>(null);
  const handleForceOOBE = () => {
    setForcedOOBEInfo({
      title: "Cảm ơn bạn đã trải nghiệm!",
      subtitle: "VplayOS là một dự án cực lớn, khó thực hiện, hoàn thiện và không nằm trong roadmap các tính năng cập nhật của Vplay trong tương lai. Chúng tôi chỉ sử dụng VplayOS để test một số tính năng technical và không có đự định ra mắt là một hệ điều hành chính thức. Cảm ơn bạn đã trải nghiệm VplayOS!"
    });
    setShowOOBE(true);
  };
  const [activeTab, setActiveTab] = useState("Trang chủ");
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);

  const activeSearchPlaceholder = useMemo(() => {
    const tabMapping: Record<string, string> = {
      "Trang chủ": "Search everything",
      "Do For Me": "Search with AI",
      "Phát sóng": "Search channels",
      "Pizza": "Search experiments",
      "Vconnect": "Search Vconnect feed and users",
    };
    if (tabMapping[activeTab as string]) return tabMapping[activeTab as string];
    if (showWidgets && isWidgetsFullScreen) return "Search the web";

    if (!featureFlags?.search_placeholder_treatment) return "Search Vplay";
    const id = featureFlags.search_placeholder_treatment_id || 1;
    if (id === 9) return SEARCH_TREATMENTS[randomSearchSeed];
    return SEARCH_TREATMENTS[id - 1] || "Search Vplay";
  }, [activeTab, featureFlags?.search_placeholder_treatment, featureFlags?.search_placeholder_treatment_id, randomSearchSeed, showWidgets, isWidgetsFullScreen]);

  const showSearchBar = useMemo(() => {
    const allowedTabs = ["Trang chủ", "Phát sóng", "Pizza", "Do For Me", "Vconnect"];
    return allowedTabs.includes(activeTab as string) || (showWidgets && isWidgetsFullScreen);
  }, [activeTab, showWidgets, isWidgetsFullScreen]);

  const [isAIToolsRotating, setIsAIToolsRotating] = useState(false);
  const [showAIToolsMenu, setShowAIToolsMenu] = useState(false);
  const [showAIToolsMenuMobile, setShowAIToolsMenuMobile] = useState(false);
  const [showAIToolsMenuSidebar, setShowAIToolsMenuSidebar] = useState(false);
  const [isAIToolsSearchActive, setIsAIToolsSearchActive] = useState(false);
  const [showAIToolsOOBE, setShowAIToolsOOBE] = useState(false);
  const [isNarratorActive, setIsNarratorActive] = useState(false);

  const onAIToolsAction = (action: string, data?: any) => {
    if (action === "rotate_ai") {
      setIsAIToolsRotating(true);
      setTimeout(() => setIsAIToolsRotating(false), 800);
      return;
    }
    setShowAIToolsMenu(false);
    setShowAIToolsMenuMobile(false);
    setShowAIToolsMenuSidebar(false);

    if (showWidgets && (activeBoardTab === 'doforme' || activeBoardTab === 'widgets')) {
       if (["speak_for_me", "copy_for_me", "play_for_me", "capture_for_me", "convert_for_me", "gemini", "screen_recorder", "about_do_stuff"].includes(action)) {
          setActiveBoardTab('doforme');
          setActiveDoForMeSubView(action);
          return;
       }
    }
    if (action === "ai_tools") {
      if (featureFlags.ai_sidebar) {
        setIsAISidebarOpen(true);
      } else {
        setActiveTab("Do For Me");
      }
    } else if (action === "select_channel") {
      handleChannelSelect(data);
    } else if (action === "speak_for_me") {
      setIsSpeakForMeOpen(true);
    } else if (action === "copy_for_me") {
      setIsCopyForMeOpen(true);
    } else if (action === "play_for_me") {
      setIsPlayForMeOpen(true);
    } else if (action === "capture_for_me") {
      setIsCaptureForMeOpen(true);
    } else if (action === "convert_for_me") {
      setIsConvertForMeOpen(true);
    } else if (action === "gemini") {
      setIsGeminiOpen(true);
    } else if (action === "web_search") {
      if (data && data.trim()) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(data)}`, "_blank");
      }
    } else if (action === "app_search") {
      if (data && data.trim()) {
        setSearchQuery(data);
        setActiveTab("Search");
      }
    } else if (action === "screen_recorder") {
      setIsScreenRecorderOpen(true);
    } else if (action === "narrator") {
      const newState = !isNarratorActive;
      setIsNarratorActive(newState);
      const msg = newState ? "Narrator. Enabled" : "Exiting Narrator";
      const utterance = new SpeechSynthesisUtterance(msg);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else if (action === "about_do_stuff") {
      setIsAboutDoStuffOpen(true);
    } else if (action === "search") {
      setIsAIToolsSearchActive(true);
    } else if (action === "operator") {
      setIsConsoleFloating(false);
    }
  };


  const [showVTV6Popup, setShowVTV6Popup] = useState(false);
  const [showCanaryWarning, setShowCanaryWarning] = useState(false);
  const [hasSeenCanaryWarning, setHasSeenCanaryWarning] = useState(false);

  useEffect(() => {
    if (activeTab === "Phát sóng" && !hasSeenCanaryWarning) {
      setShowCanaryWarning(true);
    }
  }, [activeTab, hasSeenCanaryWarning]);
  const [xamlHomeLoading, setXamlHomeLoading] = useState(false);
  const loadingHomeRef = useRef(false);



  useEffect(() => {
    if (featureFlags.ai_tools && !localStorage.getItem("vplay_seen_aitools_oobe")) {
      setTimeout(() => setShowAIToolsOOBE(true), 1500);
    }
  }, [featureFlags.ai_tools]);

  useEffect(() => {
    if (activeTab === "Trang chủ" && featureFlags.xaml_home && !loadingHomeRef.current) {
      setXamlHomeLoading(true);
      loadingHomeRef.current = true;
      const timer = setTimeout(() => {
        setXamlHomeLoading(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else if (activeTab !== "Trang chủ") {
      loadingHomeRef.current = false;
      setXamlHomeLoading(false);
    }
  }, [activeTab, featureFlags.xaml_home]);

  useEffect(() => {
    if (!isNarratorActive) return;

    const lastSpokenRef = { current: "" };

    const handleInteraction = (e: MouseEvent | { target: HTMLElement }) => {
      const target = e.target as HTMLElement;
      const text = target.innerText || target.textContent || target.getAttribute("aria-label") || target.getAttribute("title") || "";
      
      if (text && text.trim() && text !== lastSpokenRef.current) {
        lastSpokenRef.current = text;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    };

    const handleMouseOver = (e: any) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('button, a, h1, h2, h3, [role="button"]')) {
        handleInteraction(e);
      }
    };

    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('click', handleInteraction);
    return () => {
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('click', handleInteraction);
    };
  }, [isNarratorActive]);

  const [isConsoleFloating, setIsConsoleFloating] = useState(false);
  const [isSpeakForMeOpen, setIsSpeakForMeOpen] = useState(false);
  const [customTabs, setCustomTabs] = useState<CustomTab[]>(() => {
    try {
      const saved = localStorage.getItem("vplay_custom_tabs");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCustomTabModalOpen, setIsCustomTabModalOpen] = useState(false);
  const [editingCustomTab, setEditingCustomTab] = useState<CustomTab | null>(null);
  const [isCopyForMeOpen, setIsCopyForMeOpen] = useState(false);
  const [isPlayForMeOpen, setIsPlayForMeOpen] = useState(false);
  const [isCaptureForMeOpen, setIsCaptureForMeOpen] = useState(false);
  const [isConvertForMeOpen, setIsConvertForMeOpen] = useState(false);
  const [isGeminiOpen, setIsGeminiOpen] = useState(false);
  const [isScreenRecorderOpen, setIsScreenRecorderOpen] = useState(false);
  const [isAboutDoStuffOpen, setIsAboutDoStuffOpen] = useState(false);
  const [isConsoleMinimized, setIsConsoleMinimized] = useState(false);
  const [isConsoleMaximized, setIsConsoleMaximized] = useState(false);
  const [isSpeakForMeMaximized, setIsSpeakForMeMaximized] = useState(false);
  const [isCopyForMeMaximized, setIsCopyForMeMaximized] = useState(false);
  const [isPlayForMeMaximized, setIsPlayForMeMaximized] = useState(false);
  const [isCaptureForMeMaximized, setIsCaptureForMeMaximized] = useState(false);
  const [isConvertForMeMaximized, setIsConvertForMeMaximized] = useState(false);
  const [isGeminiMaximized, setIsGeminiMaximized] = useState(false);
  const [isScreenRecorderMaximized, setIsScreenRecorderMaximized] = useState(false);
  const [windowPos, setWindowPos] = useState({ x: 100, y: 100 });
  const [lastTab, setLastTab] = useState("Trang chủ");
  const [prevTab, setPrevTab] = useState("Trang chủ");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [hoveredTabRect, setHoveredTabRect] = useState<DOMRect | null>(null);
  const [liquidGlass, setLiquidGlass] = useState<"glassy" | "tinted">("glassy");
  const [sidebarStyle, setSidebarStyle] = useState<"float" | "attach">("attach");
  const [useSidebar, setUseSidebar] = useState(() => {
    const saved = localStorage.getItem("vplay_sidebar");
    return saved === null ? true : saved === "true";
  });
  const [isSidebarRight, setIsSidebarRight] = useState(() => {
    return localStorage.getItem("vplay_sidebar_right") === "true";
  });
  const [isPinningEnabled, setIsPinningEnabled] = useState(() => {
    return localStorage.getItem("vplay_pinning") === "true";
  });
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeChannel, setActiveChannel] = useState(channels[0]);
  const [sortOrder, setSortOrder] = useState<"default" | "az" | "za">("default");
  const [slideIndex, setSlideIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [navPage, setNavPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Channel[]>([]);
  const [showDevSettings, setShowDevSettings] = useState(false);
  const [showDevPrompt, setShowDevPrompt] = useState(false);
  const [devPass, setDevPass] = useState("");
  const [devError, setDevError] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("vplay_sidebar_width");
    return saved ? parseInt(saved, 10) : 320;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("vplay_favorites");
    return saved ? JSON.parse(saved) : [];
  });
  const [vpoints, setVpoints] = useState<number>(() => {
    const saved = localStorage.getItem("vplay_vpoints");
    return saved ? parseInt(saved, 10) : 100;
  });
  const [hasReceivedBonus, setHasReceivedBonus] = useState<boolean>(() => {
    const saved = localStorage.getItem("vplay_vpoints_bonus");
    return saved === "true";
  });
  const [isVstorePinned, setIsVstorePinned] = useState<boolean>(() => {
    const saved = localStorage.getItem("vplay_vstore_pinned");
    return saved === "true";
  });
  const [purchasedWidgets, setPurchasedWidgets] = useState<string[]>(() => {
    const saved = localStorage.getItem("vplay_purchased_widgets");
    return saved ? JSON.parse(saved) : [];
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [customAlert, setCustomAlert] = useState<{ title: string, message: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("vplay_sidebar_right", isSidebarRight.toString());
  }, [isSidebarRight]);

  useEffect(() => {
    localStorage.setItem("vplay_vpoints", vpoints.toString());
  }, [vpoints]);

  useEffect(() => {
    localStorage.setItem("vplay_purchased_widgets", JSON.stringify(purchasedWidgets));
  }, [purchasedWidgets]);

  useEffect(() => {
    localStorage.setItem("vplay_pinning", isPinningEnabled.toString());
  }, [isPinningEnabled]);

  useEffect(() => {
    localStorage.setItem("vplay_feature_flags", JSON.stringify(featureFlags));
  }, [featureFlags]);

  useEffect(() => {
    localStorage.setItem("vplay_bg_music_option", backgroundMusicOption);
  }, [backgroundMusicOption]);

  useEffect(() => {
    localStorage.setItem("vplay_custom_music_id", customMusicId);
  }, [customMusicId]);

  useEffect(() => {
    localStorage.setItem("vplay_search_position", searchBoxPosition);
  }, [searchBoxPosition]);

  useEffect(() => {
    // Basic music progress simulation if it's not "off"
    let interval: NodeJS.Timeout;
    if (featureFlags.windows_mode && backgroundMusicOption !== "off") {
      interval = setInterval(() => {
        setMusicProgress(prev => (prev + 1) % 360);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [featureFlags.windows_mode, backgroundMusicOption]);

  useEffect(() => {
    localStorage.setItem("vplay_taskbar_pos", taskbarPos);
  }, [taskbarPos]);

  useEffect(() => {
    localStorage.setItem("vplay_taskbar_align", taskbarAlign);
  }, [taskbarAlign]);

  // Sync wallpaper with theme if it's the default ones
  useEffect(() => {
    const lightWp = "https://static.wikia.nocookie.net/ftv/images/f/f4/Nx262.png/revision/latest/scale-to-width-down/1000?cb=20260505131224&path-prefix=vi";
    const darkWp = "https://static.wikia.nocookie.net/ftv/images/f/f4/Nx262.png/revision/latest/scale-to-width-down/1000?cb=20260505131224&path-prefix=vi";
    const currentWp = localStorage.getItem("vplay_desktop_wallpaper");
    
    if (!currentWp || currentWp === lightWp || currentWp === darkWp || currentWp.includes("4kwallpapers.com")) {
      setDesktopWallpaper(isDark ? darkWp : lightWp);
    }
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem("vplay_widget_board_pins", JSON.stringify(pinnedWidgets));
  }, [pinnedWidgets]);

  const togglePinChannelToWidgets = (ch: Channel) => {
    setPinnedWidgets(prev => {
      const isPinned = prev.some(w => w.type === 'channel' && w.channelId === ch.name);
      if (isPinned) {
        return prev.filter(w => !(w.type === 'channel' && w.channelId === ch.name));
      } else {
        return [...prev, { id: `channel-${ch.name}-${Date.now()}`, type: 'channel', size: 'small', channelId: ch.name }];
      }
    });
    addNotification("Widget Board", `${isPinnedWidget(ch.name) ? "Đã gỡ" : "Đã ghim"} kênh ${ch.name} vào bảng tiện ích`);
  };

  const isPinnedWidget = (channelName: string) => {
    return pinnedWidgets.some(w => w.type === 'channel' && w.channelId === channelName);
  };

  useEffect(() => {
    localStorage.setItem("vplay_pinned_channels", JSON.stringify(pinnedChannelNames));
  }, [pinnedChannelNames]);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setSlideIndex((prev) => (prev + newDirection + slides.length) % slides.length);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      paginate(1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Splash screen now requires manual click to unblock audio
  }, []);

  useEffect(() => {
    if (activeTab !== "Cài đặt") {
      setLastTab(activeTab);
    }
    if (activeTab !== "Cài đặt" && activeTab !== "Tìm kiếm") {
      setPrevTab(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setIsSearchLoading(true);
      const timer = setTimeout(() => {
        const query = searchQuery.toLowerCase().trim();
        const filtered = channels.filter(ch => 
          ch.name.toLowerCase().includes(query) || 
          ch.category?.toLowerCase().includes(query)
        );
        setSearchResults(filtered);
        setIsSearchLoading(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setIsSearchLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.toLowerCase() === "devmode") {
      setShowDevSettings(true);
      setSearchQuery("");
      setIsSearchOpen(false);
    }
  }, [searchQuery]);

  const verifyDev = (e: FormEvent) => {
    e.preventDefault();
    if (devPass === "devunlock") {
      setIsDev(true);
      setShowDevPrompt(false);
      setDevPass("");
      setDevError(false);
    } else {
      setDevError(true);
      setDevPass("");
    }
  };

  useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }
  }, [isResizing]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    let newWidth;
    if (isSidebarRight) {
      newWidth = window.innerWidth - e.clientX;
    } else {
      newWidth = e.clientX;
    }
    
    // Constraints
    if (newWidth >= 240 && newWidth <= 600) {
      setSidebarWidth(newWidth);
    }
  }, [isResizing, isSidebarRight]);

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      localStorage.setItem("vplay_sidebar_width", sidebarWidth.toString());
      setIsResizing(false);
    }
  }, [isResizing, sidebarWidth]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    localStorage.setItem("vplay_dev_mode", isDev.toString());
  }, [isDev]);

  useEffect(() => {
    localStorage.setItem("vplay_sidebar", useSidebar.toString());
  }, [useSidebar]);

  useEffect(() => {
    localStorage.setItem("vplay_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (ch: typeof channels[0]) => {
    setFavorites(prev => 
      prev.includes(ch.name) 
        ? prev.filter(name => name !== ch.name) 
        : [...prev, ch.name]
    );
  };

  const handleChannelSelect = (ch: typeof channels[0]) => {
    if (!user && !isDev) {
      setShowAuthModal(true);
      return;
    }
    // Locking logic
    const category = (ch.category || "").toLowerCase();
    const isVTVCab = category.includes("vtvcab");
    const isHTV = category.includes("htv");
    const isLocal = category.includes("địa phương") || category.includes("local");

    if (isVTVCab && !purchasedWidgets.includes('channel_pack_vtvcab') && !isDev) {
      addNotification("VStore", "Kênh này thuộc gói VTVCab. Vui lòng mua từ VStore để xem.", "warning");
      setActiveBoardTab('vstore');
      setShowWidgets(true);
      return;
    }
    if (isHTV && !purchasedWidgets.includes('channel_pack_htv') && !isDev) {
      addNotification("VStore", "Kênh này thuộc gói HTV. Vui lòng mua từ VStore để xem.", "warning");
      setActiveBoardTab('vstore');
      setShowWidgets(true);
      return;
    }
    if (isLocal && !purchasedWidgets.includes('channel_pack_local') && !isDev) {
      addNotification("VStore", "Kênh địa phương yêu cầu gói Local Pack. Vui lòng mua từ VStore để xem.", "warning");
      setActiveBoardTab('vstore');
      setShowWidgets(true);
      return;
    }

    if (ch.name === "VTV6") {
      setShowVTV6Popup(true);
      logHistory('action', 'Mở popup VTV6');
      incrementStat('popupsOpened');
      return;
    }
    setActiveChannel(ch);
    setActiveTab("Phát sóng");
    setVpoints(prev => prev + 10);
    addNotification("+10 Vpoints", `Bạn vừa nhận được 10 Vpoints khi xem kênh ${ch.name}!`, 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    logHistory('channel', `Đã xem kênh: ${ch.name}`);
    incrementStat('channelsWatched');
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          let role = "user";
          if (userSnap.exists()) {
            role = userSnap.data().role;
            setUserData(userSnap.data());
          } else if (currentUser.uid === "special_guest_uid") {
            // Special guest mock data
            role = "user";
            setUserData({
              uid: "special_guest_uid",
              email: "special_guest@vplay.vn",
              displayName: "Tài khoản đặc biệt",
              role: "user"
            });
          } else {
            // Check if it's the default admin
            if (currentUser.email === "nguyentrungthu1610@gmail.com" || 
                currentUser.email === "sonhuyc2kl@gmail.com" || 
                currentUser.email === "vplaybeta@gmail.com") {
              role = "admin";
            }
            const newUserData: any = {
              uid: currentUser.uid,
              email: currentUser.email,
              role: role,
              createdAt: serverTimestamp()
            };
            if (currentUser.displayName) newUserData.displayName = currentUser.displayName;
            if (currentUser.photoURL) newUserData.photoURL = currentUser.photoURL;
            
            await setDoc(userRef, newUserData);
            setUserData(newUserData);
          }
          setIsAdmin(role === "admin");
        } catch (error) {
          console.error("Error fetching user data:", error);
          setIsAdmin(false);
          setUserData(null);
        }
      } else {
        setIsAdmin(false);
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveTab("Trang chủ");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const tabs = baseTabs.map(t => {
    if (t.id === "Vconnect") {
      return { ...t, name: user ? "Vconnect" : "Vconnect Lite" };
    }
    return t;
  }).concat(customTabs.map(ct => ({
    name: ct.name,
    icon: Layout,
    id: ct.id,
    isCustom: true
  } as any))).filter(t => {
    if (t.id === "Cài đặt" && featureFlags?.settings_on_widgets) return false;
    if (t.id === "Quản trị") return false;
    if (t.id === "VTV6_Tab") return false;
    if (t.id === "Design Hub" || t.name === "Design Hub") return false;
    if (t.id === "My Feed" || t.name === "My Feed") return false;
    if (t.id === "Vconnect" && !featureFlags?.vids_feature && !featureFlags?.vids_for_uploads) return false;
    if (t.id === "V-pilot" && (featureFlags?.ai_tools)) return false;
    if (t.id === "V-pilot" && !featureFlags?.ai_tools_preview && !featureFlags?.ai_tools) return false;
    if (t.id === "Search" && featureFlags?.ai_tools) return false;
    if (t.id === "Speak for me" && !featureFlags?.speaking_feature) return false;
    // Pizza tab now persists through factory reset as requested (by removing flag dependency)
    return true;
  });
  
  const navItems = useMemo(() => {
    if (!featureFlags.scrollable_bar) return tabs;
    return tabs;
  }, [tabs, featureFlags.scrollable_bar]);

  const itemsPerPage = 4;
  const totalNavPages = Math.ceil(navItems.length / itemsPerPage);
  const effectiveNavPage = Math.min(navPage, Math.max(0, totalNavPages - 1));

  const currentNavItems = featureFlags.scrollable_bar 
    ? navItems.slice(effectiveNavPage * itemsPerPage, (effectiveNavPage + 1) * itemsPerPage)
    : navItems;

  const tabsToDisplay = featureFlags.scrollable_bar 
    ? currentNavItems.filter(item => !item.isSearch)
    : tabs;

  const showSearchInBar = featureFlags.search_merge && searchBoxPosition === "sidebar" && (
    !featureFlags.scrollable_bar || currentNavItems.some(item => item.isSearch)
  );

  const displayTab = activeTab;

  // --- AUTOMATIC APP HISTORY TRACKING SYSTEM ---
  // Global Click and Switch Toggle Tracker
  useEffect(() => {
    const handleGlobalClick = (e: globalThis.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const interactive = target.closest('button, [role="button"], a, input, select, [onClick], .cursor-pointer') as HTMLElement;
      if (!interactive) return;

      const isSwitch = 
        interactive.classList.contains('rounded-full') && 
        (interactive.classList.contains('w-10') || interactive.classList.contains('h-5') || interactive.querySelector('.rounded-full.bg-white') !== null) ||
        interactive.closest('.w-10.h-5') !== null ||
        (interactive.tagName === 'INPUT' && (interactive as HTMLInputElement).type === 'checkbox');

      const text = interactive.innerText?.trim() || 
                   interactive.getAttribute('title') || 
                   interactive.getAttribute('aria-label') || 
                   (interactive as any).placeholder || 
                   interactive.id || 
                   target.innerText?.trim() || 
                   "Hành động không rõ tên";

      const cleanName = text.length > 50 ? text.substring(0, 47) + "..." : text;

      if (isSwitch) {
        incrementStat('switchesToggled');
        logHistory('toggle', `Đã bật/tắt: ${cleanName}`);
      } else {
        incrementStat('buttonClicks');
        logHistory('click', `Đã bấm nút: ${cleanName}`);
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // Settings / Feature Flags Change Tracker
  const prevFlagsRef = useRef<any>(null);

  useEffect(() => {
    if (prevFlagsRef.current && featureFlags) {
      Object.keys(featureFlags).forEach(key => {
        const prev = prevFlagsRef.current[key];
        const curr = featureFlags[key];
        if (prev !== curr && prev !== undefined) {
          logHistory('setting', `Thay đổi tùy chọn hệ thống: ${key} (${prev} → ${curr})`);
        }
      });
    }
    prevFlagsRef.current = featureFlags ? { ...featureFlags } : null;
  }, [featureFlags]);

  // Dialog / Modal Load Performance Tracker
  const prevStatesRef = useRef<Record<string, boolean>>({});
  
  useEffect(() => {
    const modals = {
      "Auth Modal": showAuthModal,
      "Canary Warning": showCanaryWarning,
      "VTV6 Popup": showVTV6Popup,
      "Notification Drawer": showNotificationDrawer,
      "History Drawer": showHistoryDrawer,
      "Widgets Board": showWidgets,
    };

    Object.entries(modals).forEach(([name, isOpen]) => {
      const prev = prevStatesRef.current[name];
      if (isOpen && !prev) {
        const startTime = performance.now();
        const mockDelay = Math.floor(Math.random() * 30) + 12; 
        setTimeout(() => {
          const duration = Math.round(performance.now() - startTime + mockDelay);
          incrementStat('popupsOpened');
          logHistory('modal_load', `Mở thành công: ${name} (Thời gian tải: ${duration}ms)`);
        }, 50);
      }
    });

    prevStatesRef.current = modals;
  }, [showAuthModal, showCanaryWarning, showVTV6Popup, showNotificationDrawer, showHistoryDrawer, showWidgets]);
  // --- END OF TRACKING SYSTEM ---

  const handleEnterApp = useCallback(() => {
    setShowSplash(false);
    // Show OOBE after splash if not seen in this session or forced
    if (!sessionStorage.getItem("vplay_oobe_seen") || featureFlags.xaml_oobe_force) {
      setShowOOBE(true);
    }
    // This empty play/pause logic unblocks audio globally for the session
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContext.resume();
  }, []);

  const handleCloseOOBE = () => {
    setShowOOBE(false);
    sessionStorage.setItem("vplay_oobe_seen", "true");
  };

  const onAction = useCallback((action: string) => {
    console.log("Widget Action:", action);
  }, []);

  const onNavigate = useCallback((tab: string) => {
    setActiveTab(tab);
    setShowWidgets(false);
  }, []);

  return (
    <div className={`flex flex-col h-screen overflow-hidden`}>
      {featureFlags?.cobalt_scrollbar && (
        <style dangerouslySetInnerHTML={{ __html: `
          /* CSS for Cobalt UI 3 Scrollbar - Gray Theme */
          ::-webkit-scrollbar {
            width: 8px !important;
            height: 8px !important;
          }
          ::-webkit-scrollbar-track {
            background: rgba(20, 20, 20, 0.3) !important;
            border-radius: 9999px !important;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(140, 140, 140, 0.5) !important;
            border-radius: 9999px !important;
            border: 2px solid rgba(20, 20, 20, 0.3) !important;
            box-shadow: 0 0 8px rgba(140, 140, 140, 0.1) !important;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(140, 140, 140, 0.8) !important;
            box-shadow: 0 0 12px rgba(140, 140, 140, 0.3) !important;
          }
          
          /* Firefox support */
          * {
            scrollbar-width: thin !important;
            scrollbar-color: rgba(140, 140, 140, 0.5) rgba(20, 20, 20, 0.3) !important;
          }
        `}} />
      )}
      <MotionConfig 
      transition={featureFlags?.disable_animation ? { duration: 0 } : undefined}
      reducedMotion={featureFlags?.disable_animation ? "always" : "user"}
    >
        <div 
        className={`${
          featureFlags?.xaml_experience
            ? (isDark ? "bg-black/20 text-white" : "bg-white/20 text-slate-900")
            : featureFlags?.xaml_view_test
            ? (isDark ? "bg-[#202020] text-white" : "bg-[#f5f6f7] text-slate-900")
            : (isDark 
                ? "bg-[#111] text-white" 
                : (featureFlags.ai_tools 
                    ? "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-slate-950 animate-gradient-slow bg-[length:400%_400%]" 
                    : "bg-gradient-to-br from-rose-200 via-purple-200 to-red-100 text-slate-950"))
        } h-full flex transition-colors duration-500 ${useSidebar ? "flex-row" : "flex-col"} ${featureFlags?.disable_animation ? "reduce-animations" : ""} ${featureFlags?.minecraft_mode ? "minecraft-mode" : ""} ${featureFlags?.win8_metro ? "metro-mode" : ""} ${forcedFont ? `font-forced-${forcedFont}` : ""} relative`}
        style={(!featureFlags?.xaml_view_test || featureFlags?.xaml_experience) ? {
          backgroundColor: wallpaperType === "solid" ? solidColor : undefined,
          backgroundImage: wallpaperType === "gradient" ? `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)` :
                      wallpaperType === "image" ? `url(${currentWallpaper})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        } : {}}
      >
      {/* Global Immersive Background Blur */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={slideIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.25, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <img 
              src={slides[slideIndex].url} 
              alt="" 
              className="w-full h-full object-cover blur-[180px] md:blur-[240px] saturate-[250%]"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>
        <div className={`absolute inset-0 transition-colors duration-1000 ${isDark ? "bg-slate-950/60" : "bg-white/60"}`} />
      </div>

      <AnimatePresence mode="wait">
        {showSplash ? (
          <SplashScreen 
            key="welcome-splash"
            isDark={isDark} 
            onEnter={handleEnterApp} 
            isSessionChange={false}
            featureFlags={featureFlags}
          />
        ) : showOOBE ? (
          <OOBEView 
            key="oobe-view"
            isDark={isDark} 
            onContinue={handleCloseOOBE} 
            featureFlags={featureFlags} 
            setFeatureFlags={setFeatureFlags} 
            forcedInfo={forcedOOBEInfo || undefined} 
          />
        ) : showCanaryWarning ? (
          <LiquidModal
            isOpen={showCanaryWarning}
            onClose={() => {
              setShowCanaryWarning(false);
              setHasSeenCanaryWarning(true);
            }}
            isDark={isDark}
            liquidGlass={liquidGlass}
            featureFlags={featureFlags}
            title="Vplay Canary chỉ để phục vụ thử nghiệm!"
            description="Vplay Canary chỉ để phục vụ thử nghiệm giao diện. Để xem được các kênh truyền hình, vui lòng chuyển đổi sang các phiên bản ổn định hơn của Vplay như Dev hoặc khuyến nghị hơn là phiên bản Release chính thức."
            footer={
              <button 
                onClick={() => {
                  setShowCanaryWarning(false);
                  setHasSeenCanaryWarning(true);
                }}
                className="px-10 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-all active:scale-95 w-full md:w-auto"
              >
                Tôi đã hiểu
              </button>
            }
          />
        ) : (
          <>
            <LiquidModal
              isOpen={showVTV6Popup}
              onClose={() => setShowVTV6Popup(false)}
              isDark={isDark}
              liquidGlass={liquidGlass}
              featureFlags={featureFlags}
              title="Chào mừng VTV6 sắp trở lại!"
              description="Kênh VTV6 dự kiến trở lại vào 08/06/2026 với mục tiêu là một kênh truyền hình chuyên biệt về thể thao. Vplay cũng đã sẵn sàng lên sóng kênh, mời quý khán giả đón xem!"
              footer={
                <button 
                  onClick={() => {
                    setShowVTV6Popup(false);
                    const vtv6 = channels.find(c => c.name === "VTV6");
                    if (vtv6) {
                      handleChannelSelect(vtv6);
                      setActiveTab("Phát sóng");
                    }
                  }}
                  className="px-10 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-all active:scale-95 w-full md:w-auto"
                >
                  Ok
                </button>
              }
            />
            {isUpdating ? (
              <SplashScreen 
                key="updating-splash"
                isDark={isDark} 
                onEnter={() => {}} // Controlled by setTimeout in handleToggleOS
                isUpdating={true}
                featureFlags={featureFlags}
              />
            ) : isChangingSession ? (
              <SplashView key="changing-session-splash" text="Preparing new experience..." featureFlags={featureFlags} />
            ) : (featureFlags.windows_mode && isLocked) ? (
              <LockScreen 
                key="lock-screen"
                isDark={isDark}
                userName={userName}
                weatherCity={weatherCity}
                onSignIn={() => {
                  localStorage.setItem("vplay_user_name", userName);
                  localStorage.setItem("vplay_location", weatherCity);
                  setIsLocked(false);
                }}
                setUserName={setUserName}
                setWeatherCity={setWeatherCity}
                wallpaper={currentWallpaper}
              />
            ) : null}
          </>
        )}
      </AnimatePresence>

      {featureFlags.windows_mode && !isChangingSession && !showSplash && !isLocked && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`fixed inset-0 z-[40] transition-all duration-500 ${
            useSidebar && !isMobile 
              ? ((sidebarStyle === "attach" || featureFlags.win8_metro) ? "px-0" : (isSidebarRight ? "pl-8" : "pr-8")) 
              : "px-0"
          }`}
          style={useSidebar && !isMobile ? {
            paddingRight: isSidebarRight ? (isSidebarExpanded ? (featureFlags.sidebar_v3 ? 100 : sidebarWidth) : 80) : undefined,
            paddingLeft: !isSidebarRight ? (isSidebarExpanded ? (featureFlags.sidebar_v3 ? 100 : sidebarWidth) : 80) : undefined,
          } : {}}
        >
          <WindowsDesktop 
            channels={scambidifiedChannels} 
            onOpenApp={openWindow} 
            isDark={isDark}
            setIsDark={setIsDark}
            activeBoardTab={activeBoardTab}
            setActiveBoardTab={setActiveBoardTab}
            setShowWidgets={setShowWidgets}
            windows={windows}
            activeWindowId={activeWindowId}
            setWindows={setWindows}
            setActiveWindowId={setActiveWindowId}
            focusWindow={focusWindow}
            minimizeWindow={minimizeWindow}
            wallpaper={currentWallpaper}
            wallpaperType={wallpaperType}
            solidColor={solidColor}
            gradientColors={gradientColors}
            setWallpaper={setDesktopWallpaper}
            pinnedNames={pinnedChannelNames}
            setPinnedNames={setPinnedChannelNames}
            featureFlags={featureFlags}
            setFeatureFlags={setFeatureFlags}
            taskbarPos={(featureFlags.copilot_action_v2) ? null : taskbarPos}
            setTaskbarPos={setTaskbarPos}
            taskbarAlign={taskbarAlign}
            setTaskbarAlign={setTaskbarAlign}
            onExitSession={() => handleToggleOS(false)}
            systemVolume={systemVolume}
            setSystemVolume={setSystemVolume}
            musicProgress={musicProgress}
            setMusicProgress={setMusicProgress}
            weatherCity={weatherCity}
            weatherData={weatherData}
            userName={userName}
            onLock={() => setIsLocked(true)}
            searchBoxPosition={searchBoxPosition}
            activeSearchPlaceholder={activeSearchPlaceholder}
            showWidgets={showWidgets}
            isWidgetsFullScreen={isWidgetsFullScreen}
            setIsWidgetsFullScreen={setIsWidgetsFullScreen}
            widgetsTheme={widgetsTheme}
            setWidgetsTheme={setWidgetsTheme}
            isMobile={isMobile}
          />
          <AnimatePresence>
            {windows.filter(w => !w.isMinimized).map(win => (
              <AppWindowContainer
                key={win.id}
                win={win}
                isActive={activeWindowId === win.id}
                onClose={() => closeWindow(win.id)}
                onFocus={() => focusWindow(win.id)}
                onMinimize={() => minimizeWindow(win.id)}
                onMaximize={() => maximizeWindow(win.id)}
                isDark={isDark}
                featureFlags={featureFlags}
              >
                {win.type === "settings" && (
                    <div className="h-full overflow-y-auto p-6">
                      <SettingsContent 
                          isDark={isDark} 
                          setIsDark={setIsDark} 
                          isDev={isDev} 
                          setIsDev={setIsDev} 
                          featureFlags={featureFlags}
                          setFeatureFlags={setFeatureFlags}
                          liquidGlass={liquidGlass} 
                          setLiquidGlass={setLiquidGlass}
                          useSidebar={useSidebar}
                          setUseSidebar={setUseSidebar}
                          isSidebarRight={isSidebarRight}
                          setIsSidebarRight={setIsSidebarRight}
                          isPinningEnabled={isPinningEnabled}
                          setIsPinningEnabled={setIsPinningEnabled}
                          user={user}
                          userData={userData}
                          setUserData={setUserData}
                          onAlert={(title, msg) => setCustomAlert({ title, message: msg })}
                          onLogin={handleLogin}
                          favorites={favorites}
                          onUpdateLogsClick={() => openWindow("logs")}
                          backgroundMusicOption={backgroundMusicOption}
                          setBackgroundMusicOption={setBackgroundMusicOption}
                          customMusicId={customMusicId}
                          setCustomMusicId={setCustomMusicId}
                          searchBoxPosition={searchBoxPosition}
                          setSearchBoxPosition={setSearchBoxPosition}
                          sidebarStyle={sidebarStyle}
                          setSidebarStyle={setSidebarStyle}
                          setActiveTab={setActiveTab}
                          wallpaperType={wallpaperType}
                          setWallpaperType={setWallpaperType}
                          solidColor={solidColor}
                          setSolidColor={setSolidColor}
                          gradientColors={gradientColors}
                          setGradientColors={setGradientColors}
                          desktopWallpaper={desktopWallpaper}
                          setDesktopWallpaper={setDesktopWallpaper}
                          forcedFont={forcedFont}
                          setForcedFont={setForcedFont}
                          onEraseClick={() => setShowEraseModal(true)}
                        />
                    </div>
                  )}
                  {win.type === "tv" && (
                    <div className="h-full bg-black flex flex-col">
                        <TVContent 
                          active={win.contentProps?.channel || channels[0]} 
                          setActive={(ch) => {
                            setWindows(prev => prev.map(w => w.id === win.id ? { ...w, contentProps: { ...w.contentProps, channel: ch }, title: ch.name } : w));
                          }} 
                          isDark={true} 
                          favorites={favorites} 
                          toggleFavorite={toggleFavorite} 
                          user={user}
                          onLogin={handleLogin}
                          isDev={isDev}
                          liquidGlass="glassy"
                          sortOrder={sortOrder}
                          setSortOrder={setSortOrder}
                          showSplash={false}
                          featureFlags={featureFlags}
                          searchQuery=""
                          minimalMode={true}
                          activeTab={activeTab}
                          setShowCanaryWarning={setShowCanaryWarning}
                          activeSearchPlaceholder={activeSearchPlaceholder}
                          channels={scambidifiedChannels}
                        />
                    </div>
                  )}
                  {win.type === "logs" && (
                    <UpdateLogsContent isDark={isDark} onBack={() => closeWindow(win.id)} />
                  )}
                  {win.type === "explorer" && (
                    <FileExplorerContent isDark={isDark} />
                  )}
                  {win.type === "browser" && (
              <BrowserContent initialUrl={win.contentProps?.url} />
            )}
            {win.type === "debug" && (
                    <div className={isDark ? "bg-[#1a1c23] h-full" : "bg-white h-full"}>
                      <DebugContent 
                        isDark={isDark}
                        featureFlags={featureFlags}
                        setFeatureFlags={setFeatureFlags}
                        setUser={setUser}
                        setIsAdmin={setIsAdmin}
                        setIsDev={setIsDev}
                        setIsDark={setIsDark}
                        setLiquidGlass={setLiquidGlass}
                        setIsSidebarRight={setIsSidebarRight}
                        setUseSidebar={setUseSidebar}
                        onAlert={(title, message) => setCustomAlert({ title, message })}
                        isFloating={true}
                        setIsFloating={() => {}}
                      />
                    </div>
                  )}
                </AppWindowContainer>
              ))}
            </AnimatePresence>
          </motion.div>
      )}

      {!featureFlags.windows_mode && !isChangingSession && !showSplash && (
        <Fragment>
          {featureFlags.top_bar && (
            <div className="h-14 fixed top-0 left-0 w-full z-[60] bg-[#0a0518] text-white flex items-center shadow-2xl">
               {/* Left Section (Sidebar Header) */}
               <div 
                 className="flex items-center gap-4 px-6 h-full whitespace-nowrap"
                 style={{ width: isSidebarExpanded ? (featureFlags.sidebar_v3 ? 100 : sidebarWidth) : 80 }}
               >
                  <button onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="p-2 hover:bg-white/10 rounded-lg transition-all shrink-0">
                    <Menu size={20} />
                  </button>
                  {(!isMobile) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4 relative">
                      <div 
                        onClick={() => setShowUserMenu(!showUserMenu)} 
                        className={`flex items-center gap-4 p-1 hover:bg-white/10 rounded-2xl transition-all cursor-pointer shrink-0 ${showUserMenu ? "bg-white/20" : ""}`}
                      >
                        <div className="p-1 rounded-full bg-white/5">
                          {user ? <img src={user.photoURL} className="w-5 h-5 rounded-full" /> : <User size={18} />}
                        </div>
                        <img src={vplayLogo} alt="Vplay" className="h-5 object-contain shrink-0" />
                      </div>
                      <AnimatePresence>
                        {showUserMenu && (
                          <UserMenu 
                            isDark={isDark}
                            user={user}
                            onLogin={handleLogin}
                            onLogout={handleLogout}
                            onNavigate={setActiveTab}
                            isSidebarRight={isSidebarRight}
                            closeMenu={() => setShowUserMenu(false)}
                            onVVerClick={() => setShowVVer(true)}
                            onManageAccountClick={() => setShowManageAccount(true)}
                            onFeedbackClick={() => setShowFeedback(true)}
                          />
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
               </div>

                {showSearchBar && (
                  <div className="flex-1 flex justify-center px-4 md:px-8 relative">
                     <div className="w-full max-w-[640px]">
                        <SearchBar 
                          isDark={isDark}
                          query={searchQuery}
                          setQuery={(q) => {
                            setSearchQuery(q);
                            if (q.length > 0) setIsSearchOpen(true);
                          }}
                          onClose={() => setIsSearchOpen(false)}
                          liquidGlass={liquidGlass}
                          isTop={true}
                          featureFlags={featureFlags}
                          placeholder={activeSearchPlaceholder}
                          onNavigate={setActiveTab}
                          variant="minimal"
                        />
                      
                        <AnimatePresence>
                          {isSearchOpen && searchQuery.trim().length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 z-[70]">
                              <SearchPopup 
                                isDark={isDark} 
                                searchQuery={searchQuery} 
                                setActiveChannel={handleChannelSelect} 
                                onClose={() => setIsSearchOpen(false)} 
                                favorites={favorites}
                                liquidGlass={liquidGlass}
                                setActiveTab={setActiveTab}
                                setIsDark={setIsDark}
                                setLiquidGlass={setLiquidGlass}
                                onLogin={handleLogin}
                                onLogout={handleLogout}
                                setSortOrder={setSortOrder}
                                togglePin={togglePinChannelToWidgets}
                                isPinned={isPinnedWidget}
                                position="top"
                                channels={scambidifiedChannels}
                              />
                            </div>
                          )}
                        </AnimatePresence>
                     </div>
                  </div>
                )}

               {/* Right Section (Stats) */}
               <div className="flex items-center gap-6 px-6 select-none shrink-0">
                  <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 bg-amber-400 rounded-full text-white shadow-lg shadow-amber-400/20 active:scale-95 transition-all cursor-pointer" onClick={() => { setShowWidgets(true); setActiveBoardTab('vstore'); }}>
                     <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px] font-black italic">V</div>
                     <span className="text-xs font-black tracking-tight">{isUnlimitedVpoints ? "∞" : vpoints} <span className="opacity-60 font-medium">VP</span></span>
                  </div>
                  <div 
                    onClick={() => { setShowWidgets(true); setActiveBoardTab('widgets'); }}
                    className="hidden sm:flex items-center gap-3 pr-6 border-r border-white/5 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-all"
                  >
                     <Sun size={14} className="text-amber-400" />
                     <div className="flex flex-col">
                        <span className="text-[11px] font-bold">26°C</span>
                        <span className="text-[8px] font-bold opacity-30 uppercase tracking-tighter">HANOI</span>
                     </div>
                  </div>
                  <div 
                    onClick={() => { setShowWidgets(true); setActiveBoardTab('widgets'); }}
                    className="flex flex-col items-end leading-none cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-all"
                  >
                     <span className="text-[13px] font-black tracking-tight uppercase leading-none">{currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                     <span className="text-[9px] font-bold opacity-20 uppercase tracking-widest mt-1.5">{currentTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                  </div>
               </div>
            </div>
          )}
          <div 
            className={`flex-1 flex flex-col min-h-screen relative overflow-hidden transition-[padding] duration-500 ${
              useSidebar && !isMobile 
                ? (sidebarStyle === "attach" || featureFlags.top_bar
                    ? "px-0" 
                    : (isSidebarRight ? "pl-8" : "pr-8")
                  ) 
                : "px-0"
            }`}
            style={useSidebar && !isMobile ? {
              paddingRight: isSidebarRight ? (isSidebarExpanded ? (featureFlags.sidebar_v3 ? 100 : sidebarWidth) : 80) : undefined,
              paddingLeft: !isSidebarRight ? (isSidebarExpanded ? (featureFlags.sidebar_v3 ? 100 : sidebarWidth) : 80) : undefined,
              paddingTop: (featureFlags.top_bar && !isMobile) ? 56 : 0
            } : {}}
          >
        {/* Background Watermarks */}
        {!featureFlags.xaml_home && (
          <Fragment>
            <div className="fixed top-1/4 -left-20 text-[10vw] font-black opacity-[0.03] select-none pointer-events-none rotate-12 z-0 leading-tight">
              Work in progress - For testing purposes only
            </div>
            <div className="fixed bottom-10 -right-10 text-[8vw] font-black opacity-[0.02] select-none pointer-events-none -rotate-12 z-0">
              VPLAY CANARY
            </div>
          </Fragment>
        )}

        <AnimatePresence>
          {isAISidebarOpen && featureFlags.ai_sidebar && (
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={`fixed right-0 top-0 bottom-0 w-full sm:w-[450px] z-[5000] border-l bg-white border-black/10 shadow-2xl backdrop-blur-3xl overflow-hidden`}
            >
               <div className="h-full flex flex-col">
                <div className="p-4 border-b border-black/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Sparkles size={18} className="text-blue-600" />
                      <span className="font-normal text-xs uppercase tracking-[0.2em] text-slate-800">Do For Me Sidebar</span>
                   </div>
                   <button 
                     onClick={() => setIsAISidebarOpen(false)}
                     className="p-2 hover:bg-black/5 rounded-full transition-all text-slate-400 hover:text-slate-900"
                   >
                     <X size={18} />
                   </button>
                </div>
                <div className="flex-1 overflow-y-auto bg-slate-50/50 custom-scrollbar">
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: "speak_for_me", name: "Speak For Me", icon: Mic, color: "bg-blue-600" },
                        { id: "copy_for_me", name: "Copy For Me", icon: Copy, color: "bg-blue-600" },
                        { id: "play_for_me", name: "Play For Me", icon: Play, color: "bg-blue-600" },
                        { id: "capture_for_me", name: "Capture For Me", icon: Camera, color: "bg-blue-600" },
                        { id: "convert_for_me", name: "Convert For Me", icon: RefreshCcw, color: "bg-blue-600" },
                        { id: "screen_recorder", name: "Record For Me", icon: Video, color: "bg-blue-600" },
                        { id: "narrator", name: "Narrate For Me", icon: Volume2, color: "bg-blue-600" },
                        { id: "about_do_stuff", name: "Do For Me là gì?", icon: Info, color: "bg-blue-600" },
                      ].map(action => (
                        <button
                          key={action.id}
                          onClick={() => onAIToolsAction(action.id)}
                          className={`flex items-center gap-4 p-4 rounded-[2rem] border-2 transition-all text-left bg-white border-white/40 hover:bg-slate-50 hover:-translate-y-1 hover:shadow-2xl shadow-sm group`}
                        >
                          <div className={`p-4 rounded-2xl ${action.color} text-white shadow-xl group-hover:scale-105 transition-transform`}>
                            <action.icon size={20} />
                          </div>
                          <div>
                            <span className="text-sm font-normal block text-slate-900 tracking-tight">{action.name}</span>
                            <span className="text-[9px] font-normal opacity-30 uppercase tracking-widest">Do For Me Engine</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {useSidebar && !isMobile && (
            <div className="fixed inset-0 pointer-events-none z-[40]">
               {/* This space is reserved for the floating sidebar shadows/click-through */}
            </div>
          )}
          {isSearchOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className={`fixed inset-0 z-[45] bg-black/20 ${liquidGlass ? "backdrop-blur-[2px]" : ""}`}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDevConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDevConfirm(false)}
                className="absolute inset-0 bg-transparent"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-[640px] bg-[#2a2a2a] rounded-xl overflow-hidden shadow-2xl flex flex-col"
              >
                {/* Header Section */}
                <div className="p-8 pb-4">
                  <h2 className="text-white text-2xl font-bold mb-2">Switch to Dev?</h2>
                  <p className="text-slate-300 text-lg">
                    Do you want to switch to a much more stable version of <span className="underline decoration-red-500 decoration-wavy underline-offset-4">Vplay</span>?
                  </p>
                </div>

                {/* Content - Logo Area */}
                <div className="py-12 flex items-center justify-center">
                  <div className="flex items-center gap-0">
                    <div className="relative w-32 h-32 transform -rotate-12 translate-y-2">
                       <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                          <defs>
                            <linearGradient id="logo-v-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#818cf8" />
                              <stop offset="50%" stopColor="#6366f1" />
                              <stop offset="100%" stopColor="#4f46e5" />
                            </linearGradient>
                            <linearGradient id="logo-v-accent" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                              <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                          </defs>
                          {/* Ribbon style V */}
                          <path 
                            d="M20,10 L50,80 L80,10 L65,10 L50,50 L35,10 Z" 
                            fill="url(#logo-v-grad)" 
                          />
                          <path 
                            d="M20,10 L35,10 L50,45 L40,45 Z" 
                            fill="rgba(0,0,0,0.1)" 
                          />
                           <path 
                            d="M80,10 L65,10 L50,45 L60,45 Z" 
                            fill="rgba(0,0,0,0.1)" 
                          />
                       </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-8xl font-bold text-white tracking-tighter ml-[-8px] drop-shadow-lg flex items-center">
                        <span className="bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">play</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Section */}
                <div className="bg-[#1a1a1a] p-4 flex justify-end gap-4">
                  <button 
                    onClick={() => {
                      setShowDevConfirm(false);
                      window.open("https://vplay-beta-fa8k.vercel.app", "_blank");
                    }}
                    className="px-10 py-2.5 bg-[#4facfe] hover:bg-[#00f2fe] text-slate-900 rounded-lg font-bold text-sm transition-all active:scale-95 shadow-[0_0_15px_rgba(79,172,254,0.3)]"
                  >
                    Switch
                  </button>
                  <button 
                    onClick={() => setShowDevConfirm(false)}
                    className="px-10 py-2.5 bg-[#333] hover:bg-[#444] text-white rounded-lg font-bold text-sm transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <LiquidModal 
          isOpen={!!customAlert} 
          onClose={() => setCustomAlert(null)} 
          isDark={isDark}
          title={customAlert?.title}
          description={customAlert?.message}
          liquidGlass={liquidGlass}
          featureFlags={featureFlags}
        >
          <button 
            onClick={() => setCustomAlert(null)}
            className="w-full py-4 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded-3xl font-bold transition-all active:scale-95"
          >
            Xác nhận
          </button>
        </LiquidModal>

        <div className={`flex-1 flex flex-col transition-all duration-1000 ${featureFlags.taskbar_experimental && !isMobile ? "mb-16" : ""} min-h-0`}>
          {searchBoxPosition === "top" && showSearchBar && (
            <div className="flex flex-col items-center p-6 sticky top-0 z-[100] gap-4">
              <div className="relative group w-full max-w-xl transition-all duration-500">
                <div className={`relative flex items-center transition-all duration-500 overflow-hidden shadow-2xl ${
                    (liquidGlass === "glassy" 
                        ? "bg-white/5 backdrop-blur-[120px] border border-white/20 rounded-full h-14" 
                        : liquidGlass === "tinted"
                          ? "bg-white/80 backdrop-blur-[100px] border border-white/80 rounded-full h-14"
                          : isDark ? "bg-white/5 border border-white/10 rounded-full h-14" : "bg-slate-50 border border-black/10 rounded-full h-14"
                      )
                }`}>
                  <SearchBar 
                    isDark={isDark} 
                    query={searchQuery} 
                    setQuery={(q) => {
                      setSearchQuery(q);
                      if (q.length > 0) setIsSearchOpen(true);
                    }} 
                    onClose={() => {
                      setSearchQuery("");
                      setIsSearchOpen(false);
                    }} 
                    liquidGlass={liquidGlass}
                    isTop={true} 
                    featureFlags={featureFlags}
                    placeholder={activeSearchPlaceholder}
                    onNavigate={setActiveTab}
                    setHoveredItem={setHoveredHeadingItem}
                    setHoveredRect={setHoveredHeadingRect}
                  />
                </div>
              </div>
              
              <AnimatePresence>
                {isSearchOpen && (
                  <div className="w-full max-w-xl relative flex justify-center">
                    <SearchPopup 
                      isDark={isDark} 
                      searchQuery={searchQuery} 
                      setActiveChannel={handleChannelSelect} 
                      onClose={() => setIsSearchOpen(false)} 
                      favorites={favorites}
                      liquidGlass={liquidGlass}
                      setActiveTab={setActiveTab}
                      setIsDark={setIsDark}
                      setLiquidGlass={setLiquidGlass}
                      onLogin={handleLogin}
                      onLogout={handleLogout}
                      setSortOrder={setSortOrder}
                      togglePin={togglePinChannelToWidgets}
                      isPinned={isPinnedWidget}
                      position="top"
                      channels={scambidifiedChannels}
                    />
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={displayTab}
              initial={featureFlags?.xaml_view_test ? { y: 30, opacity: 0 } : { opacity: 0, x: 20 }}
              animate={{ y: 0, opacity: 1, x: 0 }}
              exit={featureFlags?.xaml_view_test ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, x: -20 }}
              transition={featureFlags?.xaml_view_test ? { duration: 0.3, ease: [0.23, 1, 0.32, 1] } : { duration: 0.4, ease: "easeOut" }}
              className="h-full flex flex-col"
            >
              {(displayTab === "Trang chủ") && (
                <div className={`flex-1 flex flex-col transition-colors duration-500 ${featureFlags.xaml_home ? "bg-black/40 backdrop-blur-3xl" : "p-8"}`}>
                  {featureFlags.xaml_home ? (
                    xamlHomeLoading ? (
                      <motion.div 
                        initial={{ y: 0 }}
                        exit={{ y: "-100%" }}
                        transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
                        className="flex-1 flex flex-col items-center justify-start pt-20 space-y-8 bg-black/60 backdrop-blur-3xl z-50 fixed inset-0"
                      >
                        <div className="text-center space-y-4">
                           <h2 className="text-2xl font-normal tracking-tight text-white/60">Working on it...</h2>
                           <div className="flex items-center justify-center w-full">
                              <LoadingAnimation featureFlags={{...featureFlags, cobalt_ui: true}} isDark={true} className="w-full max-w-md" />
                           </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full w-full flex flex-col p-8 md:p-12 overflow-y-auto"
                      >
                         <motion.header 
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           className="mb-12"
                         >
                           <h1 className="text-5xl font-bold tracking-tighter mb-2">Home</h1>
                           <p className="text-slate-500 font-medium">Welcome back to Vplay Media Player</p>
                         </motion.header>

                         {/* Vconnect Promo Banner for XAML Layout */}
                         <motion.div 
                           initial={{ opacity: 0, y: 15 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="mb-10 relative overflow-hidden rounded-[24px] bg-gradient-to-r from-purple-900/30 via-indigo-950/30 to-[#12121e] p-6 border border-purple-500/20 group cursor-pointer hover:border-purple-500/40 transition-all shadow-lg"
                           onClick={() => {
                             setActiveTab("Vconnect");
                           }}
                         >
                           <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent pointer-events-none" />
                           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                             <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
                               <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
                                 <Users size={24} />
                               </div>
                               <div>
                                 <div className="flex items-center justify-center md:justify-start gap-2">
                                   <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider text-purple-300 bg-purple-500/15 border border-purple-500/30">Nổi bật</span>
                                   <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider text-green-300 bg-green-500/15 border border-green-500/30">Mới</span>
                                 </div>
                                 <h3 className="text-xl font-bold text-white mt-1">Mạng xã hội Vconnect</h3>
                                 <p className="text-slate-400 text-xs mt-0.5 max-w-xl">Trải nghiệm chia sẻ câu chuyện, đăng tin nhắn thoại, theo dõi tài khoản có tick xanh & xem video ngắn Vshorts cực đỉnh!</p>
                               </div>
                             </div>
                             <button 
                               className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 group-hover:translate-x-1"
                             >
                               Thử ngay
                               <ArrowRight size={12} />
                             </button>
                           </div>
                         </motion.div>

                         <motion.section 
                           layout
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: 0.2 }}
                           className="mb-16"
                         >
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                              <Clock className="text-purple-500" size={20} />
                              Recent media
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                              {[...channels].slice(0, 5).map((ch, idx) => (
                                <motion.div 
                                  key={ch.name} 
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.3 + (idx * 0.05) }}
                                  className="group cursor-pointer"
                                  onClick={() => handleChannelSelect(ch)}
                                >
                                  <div className="aspect-square bg-[#1a1a1a] rounded-xl border border-white/5 flex items-center justify-center p-6 group-hover:bg-[#222] transition-colors mb-2 overflow-hidden relative">
                                     <img src={ch.logo} className="w-full h-full object-contain opacity-40 group-hover:opacity-100 transition-opacity" />
                                     <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <p className="text-xs font-bold text-slate-400 truncate">{ch.name}</p>
                                </motion.div>
                              ))}
                            </div>
                         </motion.section>

                         <motion.section 
                           layout
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: 0.4 }}
                         >
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                              <Sparkles className="text-purple-500" size={20} />
                              Trải nghiệm Vplay OS
                            </h2>
                            <div 
                              onClick={() => handleForceOOBE()}
                              className="group relative overflow-hidden rounded-none bg-slate-400 p-8 cursor-pointer border border-white/5"
                            >
                               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                  <div className="space-y-2">
                                     <h3 className="text-2xl font-black text-slate-800 italic uppercase">VPLAY CANARY OS EXPERIMENT</h3>
                                     <p className="text-slate-700 text-sm font-bold uppercase tracking-widest opacity-40">Ready for testing</p>
                                  </div>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleForceOOBE();
                                    }}
                                    className="px-10 py-5 bg-slate-900 rounded-none border border-white/10 group-hover:bg-slate-700 transition-all font-black text-sm uppercase tracking-[0.3em] text-white"
                                  >
                                     Switch Now
                                  </button>
                               </div>
                            </div>
                         </motion.section>
                      </motion.div>
                    )
                  ) : (
                    <>
                      {/* ADVERTISEMENT BANNER */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                        className="mb-10 relative overflow-hidden rounded-[40px] bg-gradient-to-r from-blue-700 via-indigo-800 to-purple-900 p-8 md:p-12 shadow-2xl border border-white/10 group"
                      >
                          <div className={`absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-20`} style={{ backgroundImage: `url(https://static.wikia.nocookie.net/ftv/images/f/f4/Nx262.png/revision/latest/scale-to-width-down/1000?cb=20260505131224&path-prefix=vi)` }} />
                          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="space-y-4 text-center md:text-left">
                              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/20 text-[10px] font-black uppercase tracking-[0.2em]">
                                <Zap size={12} className="fill-amber-500" />
                                Early Access
                              </div>
                              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">
                                Switch to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">XAML Experience</span> ngay!
                              </h2>
                              <p className="text-white/70 font-bold text-lg max-w-2xl leading-relaxed">
                                 Trải nghiệm giao diện XAML mới được tái thiết kế hoàn toàn cho Vplay!
                              </p>
                            </div>
                            <button 
                              onClick={() => handleForceOOBE()}
                              className="px-10 py-5 bg-white hover:bg-slate-100 text-blue-900 rounded-[32px] font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-2xl whitespace-nowrap flex items-center gap-3"
                            >
                              Thử ngay bây giờ
                              <ArrowRight size={18} />
                            </button>
                          </div>
                          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-1000" />
                          <div className="absolute -top-20 -left-20 w-80 h-80 bg-purple-500/20 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-1000" />
                        </motion.div>

                      {/* Vconnect Promo Banner for Standard Layout */}
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10 relative overflow-hidden rounded-[24px] bg-gradient-to-r from-purple-900/30 via-indigo-950/30 to-[#12121e] p-6 border border-purple-500/20 group cursor-pointer hover:border-purple-500/40 transition-all shadow-lg"
                        onClick={() => {
                          setActiveTab("Vconnect");
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent pointer-events-none" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
                              <Users size={24} />
                            </div>
                            <div>
                              <div className="flex items-center justify-center md:justify-start gap-2">
                                <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider text-purple-300 bg-purple-500/15 border border-purple-500/30">Nổi bật</span>
                                <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider text-green-300 bg-green-500/15 border border-green-500/30">Mới</span>
                              </div>
                              <h3 className="text-xl font-bold text-white mt-1">Mạng xã hội Vconnect</h3>
                              <p className="text-slate-400 text-xs mt-0.5 max-w-xl">Trải nghiệm chia sẻ câu chuyện, đăng tin nhắn thoại, theo dõi tài khoản có tick xanh & xem video ngắn Vshorts cực đỉnh!</p>
                            </div>
                          </div>
                          <button 
                            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 group-hover:translate-x-1"
                          >
                            Thử ngay
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </motion.div>

                      <HomeContent isDark={isDark} onSwitchToDev={() => setShowDevConfirm(true)} featureFlags={featureFlags} liquidGlass={liquidGlass} channels={scambidifiedChannels} />
                    </>
                  )}
                </div>
              )}
              {/* Removed unused blocks */}
               {displayTab === "Cài đặt" && (
                <div className={`flex-1 flex flex-col min-h-0 ${featureFlags.xaml_experience ? (isDark ? "bg-black/20 backdrop-blur-2xl border border-white/5 shadow-2xl" : "bg-white/40 backdrop-blur-2xl border border-white/40 shadow-xl") : ""}`}>
                  <div className="h-full overflow-y-auto p-4 md:p-12 custom-scrollbar">
                    <div className="max-w-4xl">
                      <header className="mb-12">
                        <h1 className="text-5xl font-bold tracking-tighter mb-4">Cài đặt</h1>
                        <p className="text-slate-500 font-medium">Cá nhân hóa trải nghiệm Vplay Media Player của bạn</p>
                      </header>
                      <SettingsContent 
                        onEraseClick={() => setShowEraseModal(true)}
                        isDark={isDark} 
                        setIsDark={setIsDark} 
                        vconnectIsDark={vconnectIsDark}
                        setVconnectIsDark={setVconnectIsDark}
                        isDev={isDev} 
                        setIsDev={setIsDev} 
                        featureFlags={featureFlags}
                        setFeatureFlags={setFeatureFlags}
                        liquidGlass={liquidGlass} 
                        setLiquidGlass={setLiquidGlass}
                        useSidebar={useSidebar}
                        setUseSidebar={setUseSidebar}
                        isSidebarRight={isSidebarRight}
                        setIsSidebarRight={setIsSidebarRight}
                        isPinningEnabled={isPinningEnabled}
                        setIsPinningEnabled={setIsPinningEnabled}
                        user={user}
                        userData={userData}
                        setUserData={setUserData}
                        onAlert={(title, msg) => setCustomAlert({ title, message: msg })}
                        onLogin={handleLogin}
                        favorites={favorites}
                        onUpdateLogsClick={() => openWindow("logs")}
                        backgroundMusicOption={backgroundMusicOption}
                        setBackgroundMusicOption={setBackgroundMusicOption}
                        customMusicId={customMusicId}
                        setCustomMusicId={setCustomMusicId}
                        searchBoxPosition={searchBoxPosition}
                        setSearchBoxPosition={setSearchBoxPosition}
                        sidebarStyle={sidebarStyle}
                        setSidebarStyle={setSidebarStyle}
                        setActiveTab={setActiveTab}
                        wallpaperType={wallpaperType}
                        setWallpaperType={setWallpaperType}
                        solidColor={solidColor}
                        setSolidColor={setSolidColor}
                        gradientColors={gradientColors}
                        setGradientColors={setGradientColors}
                        desktopWallpaper={desktopWallpaper}
                        setDesktopWallpaper={setDesktopWallpaper}
                        forcedFont={forcedFont}
                        setForcedFont={setForcedFont}
                      />
                    </div>
                  </div>
                </div>
              )}
               {/* Removed unused blocks */}
              {/* Custom Tabs Rendering */}
              {customTabs.find(ct => ct.id === activeTab) && (
                <div className={`rounded-[32px] overflow-hidden flex-1 flex flex-col ${featureFlags.xaml_experience ? (isDark ? "bg-black/20 backdrop-blur-2xl border border-white/5 shadow-2xl" : "bg-white/40 backdrop-blur-2xl border border-white/40 shadow-xl") : ""}`}>
                   <CustomTabContent 
                     isDark={isDark} 
                     tab={customTabs.find(ct => ct.id === activeTab)!} 
                     onDelete={() => {
                        const newTabs = customTabs.filter(ct => ct.id !== activeTab);
                        setCustomTabs(newTabs);
                        localStorage.setItem("vplay_custom_tabs", JSON.stringify(newTabs));
                        setActiveTab("Trang chủ");
                     }}
                   />
                </div>
              )}

              {displayTab === "Pizza" && (
                <div className={`flex-1 h-full min-h-0 overflow-y-auto custom-scrollbar rounded-[32px] ${isDark ? "bg-black/20" : "bg-white/20"}`}>
                  <div className="p-4 md:p-8">
                    <ExperimentalContent 
                      isDark={isDark} 
                      featureFlags={featureFlags} 
                      activeSearchPlaceholder={activeSearchPlaceholder}
                      setFeatureFlags={(f, id, name, val) => {
                        setFeatureFlags(f);
                        localStorage.setItem("vplay_feature_flags", JSON.stringify(f));
                        logHistory('settings', `${val ? 'Bật' : 'Tắt'} flag: ${name}`);
                        incrementStat('switchesToggled');
                      }} 
                    />
                  </div>
                </div>
              )}
              {displayTab === "Phát nhạc" && (
                <MusicSettingsContent 
                  isDark={isDark} 
                  backgroundMusicOption={backgroundMusicOption}
                  setBackgroundMusicOption={setBackgroundMusicOption}
                />
              )}
              {displayTab === "Do For Me" && (
                <AIToolsContent isDark={isDark} liquidGlass={liquidGlass} featureFlags={featureFlags} />
              )}
              {displayTab === "Quản trị" && (isAdmin || isDev) && (
                <AdminContent isDark={isDark} liquidGlass={liquidGlass} />
              )}
              {displayTab === "Speak for me" && featureFlags.speaking_feature && (
                <SpeakForMeContent isDark={isDark} onBack={() => setActiveTab("Home")} />
              )}
              {displayTab === "Search" && (
                <div className={`flex-1 flex flex-col h-full overflow-hidden rounded-[32px] ${featureFlags.xaml_experience ? ("bg-white/40 backdrop-blur-2xl border border-white/40 shadow-xl") : ""}`}>
                  <div className={`p-8 border-b ${featureFlags.xaml_experience ? "bg-transparent" : "bg-white"} border-black/5`}>
                    <SearchBar 
                      isDark={false} 
                      query={searchQuery} 
                      setQuery={setSearchQuery} 
                      onClose={() => setSearchQuery("")} 
                      liquidGlass={liquidGlass} 
                      featureFlags={featureFlags} 
                      placeholder={activeSearchPlaceholder}
                      onNavigate={setActiveTab}
                      setHoveredItem={setHoveredHeadingItem}
                      setHoveredRect={setHoveredHeadingRect}
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {searchQuery.trim().length > 0 ? (
                      <div className="p-8">
                        <div className="max-w-6xl mx-auto">
                          <header className="mb-12">
                            <h1 className="text-4xl font-bold tracking-tighter mb-2">Kết quả tìm kiếm</h1>
                            <p className="text-slate-500 font-medium tracking-tight uppercase text-xs">Tìm thấy {searchResults.length} kết quả cho "{searchQuery}"</p>
                          </header>

                          {isSearchLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                              <LoadingAnimation featureFlags={featureFlags} isDark={false} className="w-12 h-12" />
                              <span className="text-sm font-bold uppercase tracking-widest opacity-40">Đang tìm kiếm trong kho ứng dụng...</span>
                            </div>
                          ) : searchResults.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                              {searchResults.map((ch, idx) => (
                                <ChannelCard 
                                  key={`${ch.name}-${idx}`}
                                  ch={ch}
                                  isDark={false}
                                  isActive={activeChannel.name === ch.name}
                                  onClick={() => handleChannelSelect(ch)}
                                  favorites={favorites}
                                  toggleFavorite={toggleFavorite}
                                  togglePin={togglePinChannelToWidgets}
                                  isPinned={isPinnedWidget(ch.name)}
                                  liquidGlass={liquidGlass}
                                  featureFlags={featureFlags}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-32 text-center text-slate-900">
                              <div className="w-24 h-24 bg-slate-500/10 rounded-full flex items-center justify-center mb-6">
                                <Search size={40} className="text-slate-400" />
                              </div>
                              <h3 className="text-xl font-bold mb-2">Không tìm thấy kết quả</h3>
                              <p className="text-slate-500 max-w-xs">Thử tìm kiếm với từ khóa khác hoặc kiểm tra lại lỗi chính tả.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : !isConsoleFloating ? (
                      <DebugContent 
                        isDark={isDark} 
                        featureFlags={featureFlags} 
                        setFeatureFlags={(f, id, name, val) => {
                          setFeatureFlags(f);
                          localStorage.setItem("vplay_feature_flags", JSON.stringify(f));
                          logHistory('settings', `${val ? 'Bật' : 'Tắt'} flag: ${name}`);
                          incrementStat('switchesToggled');
                        }}
                        setUser={setUser}
                        setIsAdmin={setIsAdmin}
                        setIsDev={setIsDev}
                        setIsDark={setIsDark}
                        setLiquidGlass={setLiquidGlass}
                        setIsSidebarRight={setIsSidebarRight}
                        setUseSidebar={setUseSidebar}
                        onAlert={(title, msg) => setCustomAlert({ title, message: msg })}
                        setIsFloating={setIsConsoleFloating}
                      />
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 h-full">
                        <div className={`p-8 rounded-full ${isDark ? "bg-white/5" : "bg-black/5"} animate-pulse`}>
                          <Terminal size={48} className="opacity-20" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-bold text-xl uppercase tracking-widest opacity-40">Console Popped Out</h3>
                          <p className="text-sm opacity-30">Phòng điều khiển hiện đang được mở trong cửa sổ riêng.</p>
                        </div>
                        <button 
                          onClick={() => setIsConsoleFloating(false)}
                          className="px-6 py-3 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white font-bold transition-all shadow-lg active:scale-95"
                        >
                          Thu hồi về chính chủ
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {displayTab === "Phát sóng" && (
                <div className={`rounded-[32px] overflow-hidden flex-1 flex flex-col ${featureFlags.xaml_experience ? (isDark ? "bg-black/20 backdrop-blur-2xl border border-white/5 shadow-2xl" : "bg-white/40 backdrop-blur-2xl border border-white/40 shadow-xl") : ""}`}>
                  <TVContent 
                    active={activeChannel} 
                    setActive={(ch) => {
                      handleChannelSelect(ch);
                      if (ch.name === "VTV6") setShowVTV6Popup(true);
                    }} 
                    isDark={isDark} 
                    favorites={favorites} 
                    toggleFavorite={toggleFavorite} 
                    togglePin={togglePinChannelToWidgets}
                    isPinned={isPinnedWidget}
                    user={user}
                    onLogin={handleLogin}
                    isDev={isDev}
                    liquidGlass={liquidGlass}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    showSplash={showSplash}
                    featureFlags={featureFlags}
                    searchQuery={searchQuery}
                    activeTab={activeTab}
                    setShowCanaryWarning={() => {}} // Unlocked
                    activeSearchPlaceholder={activeSearchPlaceholder}
                    channels={scambidifiedChannels}
                  />
                </div>
              )}
              {displayTab === "Vconnect" && (
                <div className={`rounded-none overflow-hidden flex-1 flex flex-col ${featureFlags.xaml_experience ? (isDark ? "bg-black/20 backdrop-blur-2xl border border-white/5 shadow-2xl" : "bg-white/40 backdrop-blur-2xl border border-white/40 shadow-xl") : ""}`}>
                  <VconnectContent 
                    isDark={vconnectIsDark} 
                    user={user} 
                    liquidGlass={liquidGlass} 
                    onLogin={() => setShowAuthModal(true)} 
                    featureFlags={featureFlags} 
                    lite={!user} 
                    addNotification={addNotification} 
                    vpoints={vpoints}
                    setVpoints={setVpoints}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      <LiquidModal
        isOpen={showVTV6Popup}
        onClose={() => setShowVTV6Popup(false)}
        isDark={isDark}
        liquidGlass={liquidGlass}
        featureFlags={featureFlags}
        title="Chào mừng VTV6 sắp trở lại!"
        description="Kênh VTV6 dự kiến trở lại vào 08/06/2026 với mục tiêu là một kênh truyền hình chuyên biệt về thể thao. Vplay cũng đã sẵn sàng lên sóng kênh, mời quý khán giả đón xem!"
        footer={
          <button 
            onClick={() => setShowVTV6Popup(false)}
            className="px-10 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-all active:scale-95 w-full md:w-auto"
          >
            Ok
          </button>
        }
      />

      <LiquidModal
        isOpen={showCanaryWarning}
        onClose={() => {
          setShowCanaryWarning(false);
          setHasSeenCanaryWarning(true);
        }}
        isDark={isDark}
        liquidGlass={liquidGlass}
        featureFlags={featureFlags}
        title="Vplay Canary chỉ để phục vụ thử nghiệm!"
        description="Vplay Canary chỉ để phục vụ thử nghiệm giao diện. Để xem được các kênh truyền hình, vui lòng chuyển đổi sang các phiên bản ổn định hơn của Vplay như Dev hoặc khuyến nghị hơn là phiên bản Release chính thức."
        footer={
          <button 
            onClick={() => {
              setShowCanaryWarning(false);
              setHasSeenCanaryWarning(true);
            }}
            className="px-10 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-all active:scale-95 w-full md:w-auto"
          >
            Tôi đã hiểu
          </button>
        }
      />

      <AnimatePresence>
        {showVVer && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowVVer(false)} 
              className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl z-10"
            >
              <button 
                onClick={() => setShowVVer(false)}
                className="absolute -top-4 -right-4 p-2 bg-red-500 text-white rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all z-20"
              >
                <X size={20} />
              </button>
              <VVerContent isDark={isDark} onUpdateLogsClick={() => openWindow("logs")} liquidGlass={liquidGlass} />
            </motion.div>
          </div>
        )}

        {showManageAccount && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowManageAccount(false)} 
              className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl z-10"
            >
              <button 
                onClick={() => setShowManageAccount(false)}
                className="absolute -top-4 -right-4 p-2 bg-red-500 text-white rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all z-20"
              >
                <X size={20} />
              </button>
              <ManageAccountContent 
                isDark={isDark} 
                user={user} 
                userData={userData} 
                setUserData={setUserData} 
                onLogin={handleLogin} 
                onAlert={(t, m) => setCustomAlert({ title: t, message: m })} 
                liquidGlass={liquidGlass} 
              />
            </motion.div>
          </div>
        )}

        {showFeedback && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowFeedback(false)} 
              className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg z-10"
            >
              <button 
                onClick={() => setShowFeedback(false)}
                className="absolute -top-4 -right-4 p-2 bg-red-500 text-white rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all z-20"
              >
                <X size={20} />
              </button>
              <FeedbackContent isDark={isDark} liquidGlass={liquidGlass} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>

      <AnimatePresence>
        {useSidebar && !featureFlags.copilot_action_v2 && (
          <>
            {/* Mobile Hamburger Toggle */}
            {isMobile && !isSidebarExpanded && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                onClick={() => setIsSidebarExpanded(true)}
                className={`fixed top-6 z-[51] p-3.5 rounded-[4px] shadow-2xl transition-all active:scale-95 ${
                  isSidebarRight ? "right-6" : "left-6"
                } ${
                  isDark ? "bg-[#11141d] text-white border border-white/10" : "bg-white text-slate-800 border border-slate-200"
                } backdrop-blur-xl`}
              >
                <Menu size={24} />
              </motion.button>
            )}

            {/* Mobile Backdrop Overlay */}
            {isMobile && isSidebarExpanded && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarExpanded(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[48]"
              />
            )}
            
            <motion.div
              initial={{ x: isSidebarRight ? sidebarWidth : -sidebarWidth }}
              animate={{ 
                x: (featureFlags.taskbar_experimental && !isMobile) ? (isSidebarRight ? sidebarWidth : -sidebarWidth) : 0, 
                width: (featureFlags.taskbar_experimental && !isMobile) ? 0 : (isSidebarExpanded ? (featureFlags.sidebar_v3 ? 100 : sidebarWidth) : (isMobile ? 0 : 80)),
                opacity: ((isMobile && !isSidebarExpanded) || (featureFlags.taskbar_experimental && !isMobile)) ? 0 : 1,
                visibility: ((isMobile && !isSidebarExpanded) || (featureFlags.taskbar_experimental && !isMobile)) ? "hidden" : "visible" as any,
                top: (featureFlags.top_bar && !isMobile) ? 56 : (isMobile ? 0 : ((sidebarStyle === "attach" || featureFlags.win8_metro) ? 0 : 24)),
                height: (featureFlags.top_bar && !isMobile) ? "calc(100% - 56px)" : (isMobile ? "100%" : ((sidebarStyle === "attach" || featureFlags.win8_metro) ? "100%" : "calc(100% - 48px)"))
              }}
              exit={{ x: isSidebarRight ? sidebarWidth : -sidebarWidth }}
              transition={{ type: "spring", damping: 30, stiffness: 300, width: { duration: 0.3 } }}
              className={`fixed z-50 flex flex-col transition-all duration-500 ${
                isSidebarRight ? "right-6" : "left-6"
              } ${
                isMobile 
                  ? "top-0 h-full !rounded-none !m-0 !left-0 !right-0 transition-none" 
                  : (sidebarStyle === "attach" || featureFlags.win8_metro || featureFlags.top_bar)
                    ? `!rounded-none !m-0 ${isSidebarRight ? "!right-0" : "!left-0"}`
                    : "top-6 !rounded-[32px] border shadow-2xl"
              } ${
                featureFlags.xaml_experience
                  ? (featureFlags.top_bar ? "bg-[#0a0518] shadow-none" : (isDark ? "bg-black/40 border-white/10 shadow-black/50 backdrop-blur-[40px]" : "bg-white/40 border-slate-200 shadow-slate-200 backdrop-blur-[30px]"))
                  : (isDark ? "bg-black/60 shadow-black/50 backdrop-blur-3xl" : "bg-white/80 border-slate-200 shadow-slate-200 backdrop-blur-md")
              }`}
            >
              {/* Resize Handle */}
              {isSidebarExpanded && featureFlags.sidebar_resizable && (
                <div
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsResizing(true);
                  }}
                  className={`absolute top-0 bottom-0 w-2 cursor-col-resize z-[60] transition-colors group ${
                    isSidebarRight ? "left-0" : "right-0"
                  } pointer-events-auto`}
                >
                  <div className={`w-0.5 h-full mx-auto transition-colors group-hover:bg-purple-500/50 ${isResizing ? "bg-purple-500" : "bg-transparent"}`} />
                </div>
              )}
              {/* Logo & Hamburger Section */}
              {!featureFlags.top_bar && (
                <div className={featureFlags.sidebar_v3 ? "p-4" : "p-6"}>
                  <div className={`flex items-center gap-4 h-12 ${(!isSidebarExpanded && !featureFlags.sidebar_v3) ? "justify-center" : (featureFlags.sidebar_v3 ? "justify-center" : "")}`}>
                    <button 
                      onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                      className={`p-2 rounded-[4px] transition-all ${isDark ? "hover:bg-white/5 text-white" : "hover:bg-slate-100 text-slate-800"}`}
                    >
                      {featureFlags.sidebar_v3 ? <ArrowLeft size={24} /> : <Menu size={28} />}
                    </button>
                    <AnimatePresence>
                      {isSidebarExpanded && !featureFlags.sidebar_v3 && (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="flex items-center gap-3"
                        >
                          <div className={`relative w-12 h-12 flex items-center justify-center rounded-xl bg-slate-900 border border-white/10 shadow-xl`}>
                              <img src={vplayLogo} alt="Vplay" className="w-8 h-8 object-contain" />
                            </div>
                          <div className="flex items-center gap-1.5 ml-2.5">
                            {featureFlags.xaml_experience && (
                              <div className="relative group/pizza">
                                <Pizza size={18} className="text-white cursor-help" />
                                <div 
                                  className={`absolute ${isSidebarRight ? "right-full mr-4" : "left-full ml-4"} top-0 w-64 p-4 bg-black/95 text-white text-[11px] rounded-2xl shadow-2xl border border-white/10 pointer-events-none z-[100] backdrop-blur-xl font-medium opacity-0 group-hover/pizza:opacity-100 transition-all duration-300 transform translate-y-0 group-hover/pizza:translate-y-0`}
                                  style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                                >
                                  <div className="flex flex-col gap-2 text-left">
                                    <p className="leading-relaxed opacity-90 font-bold">You're previewing the XAML-powered version of Vplay, which provides richer ways for us to build and design the user interface. You can go back to previous legacy Vplay by going to the "Pizza" tab</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            <button 
                              onClick={() => {
                                setShowNotificationDrawer(true);
                                incrementStat('popupsOpened');
                                logHistory('action', 'Opened Notifications');
                              }}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all relative group/bell"
                            >
                              <Bell size={18} className="group-hover/bell:scale-110 transition-transform" />
                              {notifications.filter(n => !n.read).length > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-slate-900" />
                              )}
                            </button>

                            <button 
                              onClick={() => {
                                setShowHistoryDrawer(true);
                                incrementStat('popupsOpened');
                                logHistory('action', 'Opened History');
                              }}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all group/hist"
                            >
                              <History size={18} className="group-hover/hist:scale-110 transition-transform" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
              {/* Integrated Search Bar */}
              <AnimatePresence>
                {isSidebarExpanded && !featureFlags.ai_tools && !featureFlags.sidebar_v3 && !featureFlags.top_bar && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="px-6 py-2 mb-4 relative"
                  >
                    <div className={`relative group flex items-center gap-3 px-4 py-2 rounded-[8px] overflow-hidden transition-all ${
                        (isDark ? "bg-white/5 hover:bg-white/10" : "bg-slate-50 hover:bg-slate-100")
                    } border border-white/5`}>
                      <input 
                        type="text" 
                        placeholder={activeSearchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`flex-1 bg-transparent border-none outline-none text-sm font-semibold w-full ${isDark ? "text-white placeholder-slate-400" : "text-slate-900 placeholder-slate-400"}`}
                      />
                      <button 
                        onClick={() => {
                          if (featureFlags.ai_sidebar) {
                            setIsAISidebarOpen(!isAISidebarOpen);
                          } else {
                            setActiveTab("Do For Me");
                          }
                        }}
                        className="opacity-40 hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                        title="Do For Me"
                      >
                         <img 
                          src={vpilotIcon} 
                          className="w-4 h-4 object-contain" 
                          alt="Do For Me"
                        />
                      </button>
                      <button 
                        onClick={() => setActiveTab("Search")}
                        className="opacity-40 hover:opacity-100 transition-opacity"
                        title="Operator Console"
                      >
                         <Terminal size={16} className={`${isDark ? "text-white" : "text-slate-900"}`} />
                      </button>
                      <Search size={16} className={`${isDark ? "text-slate-400" : "text-slate-400"}`} />
                    </div>

                    {/* Search Results Dropdown */}
                    <AnimatePresence>
                      {searchQuery.trim().length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute top-full left-6 right-6 mt-2 z-[60] overflow-hidden border shadow-2xl bg-white border-slate-200 rounded-2xl backdrop-blur-3xl"
                        >
                          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {isSearchLoading ? (
                              <div className="p-8 flex flex-col items-center justify-center space-y-4">
                                <LoadingAnimation featureFlags={featureFlags} isDark={false} className="w-10 h-10" />
                                {!featureFlags.xaml_search && (
                                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Đang tìm kiếm...</span>
                                )}
                              </div>
                            ) : searchResults.length > 0 ? (
                              <div className="p-2 space-y-1">
                                {searchResults.map((ch, idx) => (
                                  <button
                                    key={`sidebar-search-ch-${ch.name}-${idx}`}
                                    onClick={() => {
                                      handleChannelSelect(ch);
                                      setSearchQuery("");
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-slate-50"
                                  >
                                    <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-white shadow-sm">
                                      <img src={ch.logo} alt={ch.name} className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                                    </div>
                                    <div className="flex flex-col items-start min-w-0">
                                      <span className="text-sm font-normal truncate w-full text-slate-900">{ch.name}</span>
                                      <span className="text-[10px] font-normal text-slate-500 uppercase">{ch.category}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="p-8 text-center text-slate-500 text-[10px] font-semibold uppercase tracking-widest">
                                Không tìm thấy kết quả
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Items */}
              <div className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                <AnimatePresence initial={false}>
                {/* Notification Bell moved to header */}

                {tabs.map((tab: any, idx) => {
                  const Icon = tab.icon as any;
                  const isActive = (tab.id === "Do For Me" || tab.id === "V-pilot") && featureFlags.ai_sidebar ? isAISidebarOpen : activeTab === (tab.id || tab.name);
                  const isAIToolsTab = (tab.id === "Do For Me" || tab.id === "V-pilot") && featureFlags.ai_tools;

                  return (
                    <div key={`sidebar-tab-${tab.id || tab.name}-${idx}`} className="relative">
                      <motion.button
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        onMouseEnter={() => setHoveredTab(tab.name)}
                        onMouseLeave={() => setHoveredTab(null)}
                        onClick={() => {
                          if (isAIToolsTab) {
                            setShowAIToolsMenuSidebar(!showAIToolsMenuSidebar);
                            return;
                          }
                          if (tab.id === "Vstore") {
                            setShowWidgets(true);
                            setActiveBoardTab('vstore'); // Need to handle this in WidgetsDashboard
                            return;
                          }
                          if (tab.id === "Widgets") {
                            setShowWidgets(true);
                            setActiveBoardTab('widgets');
                            return;
                          }
                          if (tab.id === "Search") {
                            setIsSearchOpen(true);
                            return;
                          }
                          if (tab.id === "V-pilot" && featureFlags.ai_sidebar) {
                            setIsAISidebarOpen(!isAISidebarOpen);
                            return;
                          }
                          if (tab.id === "VTV6_Tab") {
                            setShowVTV6Popup(true);
                            return;
                          }
                          setActiveTab(tab.id || tab.name);
                          logHistory('navigation', `Chuyển sang tab: ${tab.name}`);
                          if (isMobile) setIsSidebarExpanded(false);
                        }}
                        className={`w-full flex ${featureFlags.sidebar_v3 ? "flex-col items-center justify-center p-2 rounded-xl mb-4" : "items-center gap-4 px-4 py-3 rounded-[4px]"} transition-all relative group overflow-hidden ${
                          isActive 
                            ? (isDark ? "bg-[#2d2d2d] text-white" : "bg-slate-100 text-slate-900") 
                            : (isDark ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-600 hover:bg-slate-50")
                        } ${(!isSidebarExpanded && !featureFlags.sidebar_v3) ? "justify-center h-[50px]" : ""} ${featureFlags.sidebar_v3 ? "" : "h-[50px]"}`}
                      >
                        {isActive && (
                          <motion.div 
                            layoutId="sidebarActivePill"
                            className={featureFlags.sidebar_v3 ? "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#FF00FF] rounded-r-full shadow-[0_0_10px_rgba(255,0,255,0.5)]" : "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#FF00FF] rounded-r-full shadow-[0_0_8px_rgba(255,0,255,0.5)]"} 
                          />
                        )}
                        {typeof tab.icon === "string" ? (
                          <motion.div
                            animate={{ rotateY: 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            <img 
                              src={tab.id === "V-pilot" ? vpilotIcon : tab.icon} 
                              alt={tab.name} 
                              className={`h-6 w-6 flex-shrink-0 object-contain transition-all ${isActive ? "scale-110" : "group-hover:scale-110"}`} 
                              referrerPolicy="no-referrer" 
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            animate={{ rotateY: 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            <Icon size={24} className={`flex-shrink-0 transition-all ${isActive ? "text-[#FF00FF] drop-shadow-[0_0_5px_rgba(255,0,255,0.5)]" : "group-hover:scale-110"} ${tab.className || ""}`} />
                          </motion.div>
                        )}
                        {(isSidebarExpanded || featureFlags.sidebar_v3) && (
                          <span className={featureFlags.sidebar_v3 ? "text-[11px] font-medium tracking-tight mt-1 opacity-70 group-hover:opacity-100 text-center w-full truncate" : "font-normal text-base whitespace-nowrap"}>{tab.name}</span>
                        )}

                        {/* Pizza Tooltip for Sidebar */}
                        {tab.id === "Pizza" && hoveredTab === tab.name && isSidebarExpanded && (
                           <div 
                              className="absolute left-full ml-4 w-64 p-4 bg-black/95 text-white text-[11px] rounded-2xl shadow-2xl border border-white/10 pointer-events-none z-[100] backdrop-blur-xl font-medium opacity-100"
                              style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                            >
                              <div className="flex flex-col gap-2 text-left">
                                <p className="leading-relaxed opacity-90">Pizza is our special system to experiment some new, early, unreleased features of Vplay Canary</p>
                              </div>
                            </div>
                        )}
                      </motion.button>
                      <AnimatePresence>
                        {isAIToolsTab && showAIToolsMenuSidebar && (
                          <AIToolsMenu 
                            onAction={onAIToolsAction} 
                            align="right" 
                            featureFlags={featureFlags} 
                            tabs={tabs} 
                            activeTab={activeTab} 
                            setActiveTab={setActiveTab} 
                            setShowAIToolsMenu={setShowAIToolsMenu} 
                            setShowAIToolsMenuSidebar={setShowAIToolsMenuSidebar} 
                            isNarratorActive={isNarratorActive}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
                </AnimatePresence>

                {/* Channel Pinning Section */}
                {isPinningEnabled && favorites.length > 0 && (
                  <div className="pt-4 pb-2">
                    <div className={`h-px mx-3 mb-4 ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
                    {(isSidebarExpanded || featureFlags.sidebar_v3) && (
                      <span className={`text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ${featureFlags.sidebar_v3 ? "text-center px-1" : "px-5"}`}>{featureFlags.sidebar_v3 ? "Pinned" : "Ghim Kênh"}</span>
                    )}
                    <div className="space-y-1">
                      {favorites.map((favId, idx) => {
                        const channel = channels.find(c => c.name === favId);
                        if (!channel) return null;
                        return (
                          <button
                            key={`sidebar-pinned-${favId}-${idx}`}
                            onClick={() => {
                              setActiveTab("Phát sóng");
                              setActiveChannel(channel);
                              if (isMobile) setIsSidebarExpanded(false);
                            }}
                            className={`w-full flex ${featureFlags.sidebar_v3 ? "flex-col items-center justify-center p-2 mb-2" : "items-center gap-4 px-4 py-2 h-[48px]"} rounded-xl transition-all group ${
                              isDark ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-600 hover:bg-slate-50"
                            } ${(!isSidebarExpanded && !featureFlags.sidebar_v3) ? "justify-center h-[48px]" : ""}`}
                          >
                            <img 
                              src={channel.logo} 
                              alt={channel.name}
                              className={`${featureFlags.sidebar_v3 ? "w-10 h-10 mb-1" : "w-8 h-8"} object-contain transition-transform group-hover:scale-110 ${!isDark ? "bg-white rounded-md shadow-sm border border-slate-100 p-0.5" : ""}`}
                              referrerPolicy="no-referrer"
                            />
                            {(isSidebarExpanded || featureFlags.sidebar_v3) && (
                              <span className={`${featureFlags.sidebar_v3 ? "text-[10px] opacity-70" : "text-sm"} font-normal whitespace-nowrap overflow-hidden text-ellipsis w-full text-center`}>{channel.name}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Section */}
              <div className={`p-6 mt-auto space-y-6 border-t ${isDark ? "border-white/5" : "border-slate-100"}`}>
                {isSidebarExpanded && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold opacity-30 ${isDark ? "text-white" : "text-slate-900"}`}>26M6 - Build 26601</span>
                        <div className="px-1.5 py-0.5 bg-blue-500 text-white text-[8px] font-black rounded-sm">Dev</div>
                      </div>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => setShowDevConfirm(true)}
                  className={`flex ${featureFlags.sidebar_v3 ? "flex-col py-2 h-auto gap-1 items-center justify-center p-2 rounded-xl" : "items-center gap-4 px-4 py-3 rounded-xl h-[50px]"} transition-all w-full relative overflow-hidden ${
                    isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:bg-slate-50"
                  } ${(!isSidebarExpanded && !featureFlags.sidebar_v3) ? "justify-center" : (featureFlags.sidebar_v3 ? "justify-center" : "")}`}
                >
                  <motion.div
                    whileHover={{ rotateY: 180 }}
                    transition={{ duration: 0.5 }}
                  >
                    <ExternalLink size={24} className="hover:scale-110 transition-transform" />
                  </motion.div>
                  {(isSidebarExpanded || featureFlags.sidebar_v3) && <span className={featureFlags.sidebar_v3 ? "text-[11px] font-medium tracking-tight mt-1 opacity-70 group-hover:opacity-100 text-center w-full truncate" : "font-normal text-base whitespace-nowrap"}>Switch to Dev</span>}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className={`fixed z-50 transition-all duration-500 ${
        (useSidebar || featureFlags.copilot_action_v2) 
          ? "bottom-[-100%] opacity-0 pointer-events-none" 
          : "bottom-0 left-0 w-full flex justify-center pb-4 md:pb-8"
      }`}>
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            type: "spring", 
            damping: 20, 
            stiffness: 150,
            delay: 0.5
          }}
          className="flex items-center gap-1 md:gap-3 pointer-events-auto"
        >
          <AnimatePresence mode="popLayout">
            {!isSearchOpen && (
              <motion.nav 
                key="nav-bar"
                layout
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                className={`flex items-center gap-2 p-2 transition-all duration-500 overflow-hidden ${
                  liquidGlass === "tinted"
                    ? `rounded-full border shadow-[0_20px_40px_rgba(0,0,0,0.15)] backdrop-blur-[100px] max-w-full bg-white/80 border-white/80`
                    : liquidGlass === "glassy"
                      ? "rounded-full border shadow-[0_30px_60px_rgba(0,0,0,0.2)] backdrop-blur-[120px] max-w-full bg-white/10 border-white/20"
                      : `rounded-none border-t w-full justify-around backdrop-blur-none shadow-2xl ${isDark ? "bg-slate-900/95 border-white/5" : "bg-white/60 border-white/40"}`
                } flex-row`}>
                <div className={`flex items-center ${liquidGlass ? "gap-4 md:gap-6" : "gap-0 w-full justify-around"}`}>
                  {featureFlags.scrollable_bar && totalNavPages > 1 && (
                    <button 
                      onClick={() => setNavPage(p => Math.max(0, p - 1))}
                      disabled={effectiveNavPage === 0}
                      className={`p-2 transition-all ${effectiveNavPage === 0 ? "opacity-20 cursor-default" : "opacity-100 hover:scale-110 active:scale-90"}`}
                    >
                      <ChevronLeft className={isDark || liquidGlass === "glassy" ? "text-white" : "text-black"} size={20} />
                    </button>
                  )}

                  {currentNavItems.map((item: any, idx) => {
                    const isSearchItem = item.isSearch;
                    
                    if (isSearchItem) {
                      return (
                        <div key={`search-item-${idx}`} className="relative">
                          <button
                            onClick={() => setIsSearchOpen(true)}
                            className={`relative flex flex-col items-center justify-center px-2 md:px-4 py-2 transition-all duration-300 group z-10 ${
                              liquidGlass ? "rounded-2xl" : "rounded-none flex-1"
                            } ${
                              liquidGlass === "glassy" ? "text-white/70 hover:text-white" : liquidGlass === "tinted" ? "text-black/60 hover:text-black" : isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-black"
                            }`}
                          >
                             <motion.div
                              whileTap={{ scale: 0.9 }}
                              className="z-10"
                            >
                               <img 
                                src="https://static.wikia.nocookie.net/ftv/images/6/63/Search_uci.png/revision/latest?cb=20260411084053&path-prefix=vi" 
                                alt="Search" 
                                className={`h-7 w-7 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 object-contain ${
                                  liquidGlass === "glassy" ? "invert brightness-200" : "grayscale brightness-0 contrast-200"
                                }`} 
                                referrerPolicy="no-referrer" 
                              />
                            </motion.div>
                          </button>
                        </div>
                      );
                    }

                    const tab = item;
                    const Icon = tab.icon as any;
                    const isActive = (tab.id === "V-pilot" && featureFlags.ai_sidebar) ? isAISidebarOpen : activeTab === (tab.id || tab.name);
                    const userAvatar = ((tab.id === "Cài đặt" || tab.name === "Cài đặt") && user) ? (userData?.photoURL || user.photoURL) : null;
                    const isGlassy = liquidGlass === "glassy";
                    const isAIToolsTab = tab.id === "V-pilot" && featureFlags.ai_tools;

                    return (
                      <div key={`${tab.id || tab.name}-${idx}`} className="relative">
                        <button
                          onMouseEnter={(e) => {
                            setHoveredTab(tab.name);
                            setHoveredTabRect(e.currentTarget.getBoundingClientRect());
                            if (isAIToolsTab) setShowAIToolsMenu(true);
                          }}
                          onMouseLeave={() => {
                            setHoveredTab(null);
                            setHoveredTabRect(null);
                            if (isAIToolsTab) setShowAIToolsMenu(false);
                          }}
                          onClick={() => {
                            if (tab.id === "Search") {
                              setIsSearchOpen(true);
                              return;
                            }
                            if (tab.id === "V-pilot" && featureFlags.ai_sidebar) {
                              setIsAISidebarOpen(!isAISidebarOpen);
                              return;
                            }
                             if (tab.id === "VTV6_Tab") {
                              setShowVTV6Popup(true);
                              return;
                            }
                            setActiveTab(tab.id || tab.name);
                          }}
                          className={`relative flex flex-col items-center justify-center px-2 md:px-4 py-2 transition-all duration-300 group z-10 ${
                            liquidGlass ? "rounded-2xl" : "rounded-none flex-1"
                          } ${
                            isActive 
                              ? (isGlassy ? "text-white" : "text-black") 
                              : isGlassy ? "text-white/70 hover:text-white" : liquidGlass === "tinted" ? "text-black/60 hover:text-black" : isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-black"
                          }`}
                        >
                          {isActive && liquidGlass && (
                            <motion.div
                              layoutId="activeTabPill"
                              className={`absolute inset-0 rounded-full z-[-1] shadow-lg ${
                                isGlassy ? "bg-white/20" : "bg-white"
                              }`}
                              transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                            />
                          )}
                          <motion.div
                            whileTap={{ scale: 0.8 }}
                            animate={hoveredTab === tab.name ? { rotateY: [0, 180, 360] } : { rotateY: 0 }}
                            transition={hoveredTab === tab.name ? { duration: 1.5, repeat: Infinity, ease: "linear" } : { duration: 0.5 }}
                            className="z-10 relative"
                          >
                            {userAvatar ? (
                              <img 
                                src={userAvatar} 
                                alt="Avatar" 
                                className={`h-7 w-7 flex-shrink-0 rounded-full object-cover transition-transform duration-300 border ${isActive ? "scale-110 border-purple-500" : "group-hover:scale-110 border-transparent"}`} 
                                referrerPolicy="no-referrer" 
                              />
                            ) : typeof tab.icon === "string" ? (
                              <img 
                                src={tab.id === "V-pilot" ? vpilotIcon : tab.icon} 
                                alt={tab.name} 
                                className={`h-7 w-7 flex-shrink-0 object-contain transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} 
                                referrerPolicy="no-referrer" 
                              />
                            ) : (
                              <Icon className={`h-7 w-7 flex-shrink-0 transition-transform duration-300 ${
                                isActive ? "scale-110" : "group-hover:scale-110"
                              } ${liquidGlass === "tinted" && !isActive ? "text-black" : ""}`} />
                            )}
                          </motion.div>
                          
                          {/* Pizza Tooltip for Taskbar/Bottom Bar */}
                          {tab.id === "Pizza" && hoveredTab === tab.name && (
                             <div 
                                className="absolute bottom-full mb-4 w-64 p-4 bg-black/95 text-white text-[11px] rounded-2xl shadow-2xl border border-white/10 pointer-events-none z-[100] backdrop-blur-xl font-medium"
                                style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                              >
                                <div className="flex flex-col gap-2 text-left">
                                  <p className="leading-relaxed opacity-90">Pizza is our special system to experiment some new, early, unreleased features of Vplay Canary</p>
                                </div>
                              </div>
                          )}
                        </button>
                        <AnimatePresence>
                          {isAIToolsTab && showAIToolsMenu && (
                            <AIToolsMenu 
                              onAction={onAIToolsAction} 
                              align="bottom" 
                              featureFlags={featureFlags} 
                              tabs={tabs} 
                              activeTab={activeTab} 
                              setActiveTab={setActiveTab} 
                              setShowAIToolsMenu={setShowAIToolsMenu} 
                              setShowAIToolsMenuSidebar={setShowAIToolsMenuSidebar} 
                              isNarratorActive={isNarratorActive}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                  
                  {!featureFlags.scrollable_bar && featureFlags.search_merge && searchBoxPosition === "sidebar" && (
                    <div className="relative">
                      <button
                        onClick={() => setIsSearchOpen(true)}
                        className={`relative flex flex-col items-center justify-center px-2 md:px-4 py-2 transition-all duration-300 group z-10 ${
                          liquidGlass ? "rounded-2xl" : "rounded-none flex-1"
                        } ${
                          liquidGlass === "glassy" ? "text-white/70 hover:text-white" : liquidGlass === "tinted" ? "text-black/60 hover:text-black" : isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-black"
                        }`}
                      >
                         <motion.div
                          whileTap={{ scale: 0.9 }}
                          whileHover={{ rotateY: 180 }}
                          transition={{ duration: 0.5 }}
                          className="z-10"
                        >
                           <img 
                            src="https://static.wikia.nocookie.net/ftv/images/6/63/Search_uci.png/revision/latest?cb=20260411084053&path-prefix=vi" 
                            alt="Search" 
                            className={`h-7 w-7 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 object-contain ${
                              liquidGlass === "glassy" ? "invert brightness-200" : "grayscale brightness-0 contrast-200"
                            }`} 
                            referrerPolicy="no-referrer" 
                          />
                        </motion.div>
                      </button>
                    </div>
                  )}

                  {featureFlags.scrollable_bar && totalNavPages > 1 && (
                    <button 
                      onClick={() => setNavPage(p => Math.min(totalNavPages - 1, p + 1))}
                      disabled={effectiveNavPage === totalNavPages - 1}
                      className={`p-2 transition-all ${effectiveNavPage === totalNavPages - 1 ? "opacity-20 cursor-default" : "opacity-100 hover:scale-110 active:scale-90"}`}
                    >
                      <ChevronRight className={isDark || liquidGlass === "glassy" ? "text-white" : "text-black"} size={20} />
                    </button>
                  )}
                </div>

                {/* AUTH / LOGOUT */}
                {liquidGlass && user && (
                  <div className="px-3 border-l border-slate-500/20 ml-1 flex items-center">
                    <button onClick={handleLogout} className={`p-2 rounded-xl transition-colors ${isDark ? "bg-slate-800 text-red-400 hover:bg-red-500/20" : "bg-slate-100 text-red-500 hover:bg-red-500/10"}`} title="Đăng xuất">
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </motion.nav>
            )}
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {isSearchOpen && searchBoxPosition === "sidebar" ? (
              <div className="relative flex flex-col items-center">
                <SearchPopup 
                  isDark={isDark} 
                  searchQuery={searchQuery} 
                  setActiveChannel={handleChannelSelect} 
                  onClose={() => setIsSearchOpen(false)} 
                  favorites={favorites}
                  liquidGlass={liquidGlass}
                  setActiveTab={setActiveTab}
                  setIsDark={setIsDark}
                  setLiquidGlass={setLiquidGlass}
                  onLogin={handleLogin}
                  onLogout={handleLogout}
                  setSortOrder={setSortOrder}
                  togglePin={togglePinChannelToWidgets}
                  isPinned={isPinnedWidget}
                  channels={scambidifiedChannels}
                />
                {searchBoxPosition === "sidebar" && (
                  <motion.div 
                    key="search-expanded"
                    initial={{ y: 200, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 200, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`p-1.5 flex items-center border shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden rounded-full ${
                      liquidGlass === "glassy" ? "backdrop-blur-[100px] bg-white/10 border-white/20" : liquidGlass === "tinted" ? "backdrop-blur-[100px] bg-white/90 border-white/80" : "backdrop-blur-none bg-white/60 border-white/40"
                    }`}
                  >
                    <SearchBar 
                      isDark={isDark} 
                      query={searchQuery} 
                      setQuery={setSearchQuery} 
                      onClose={() => setIsSearchOpen(false)} 
                      liquidGlass={liquidGlass}
                      placeholder={activeSearchPlaceholder}
                      onNavigate={setActiveTab}
                    />
                  </motion.div>
                )}
              </div>
            ) : (
              (liquidGlass === "glassy" || liquidGlass === "tinted") && searchBoxPosition === "sidebar" && !featureFlags.search_merge && (
                <motion.button
                  key="search-circle"
                  layoutId="search-button"
                  onClick={() => setIsSearchOpen(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ borderRadius: "50%" }}
                  animate={{ borderRadius: "50%" }}
                  className={`w-[60px] h-[60px] md:w-[72px] md:h-[72px] flex items-center justify-center rounded-full border shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 shadow-2xl ${
                    liquidGlass === "tinted" 
                      ? "bg-white/80 border-white/80 text-black backdrop-blur-[100px]" 
                      : "bg-white/10 border-white/10 text-white backdrop-blur-[120px]"
                  } hover:opacity-70`}
                >
                  <img 
                    src="https://static.wikia.nocookie.net/ftv/images/6/63/Search_uci.png/revision/latest?cb=20260411084053&path-prefix=vi" 
                    alt="Search" 
                    className={`h-7 w-7 md:h-8 md:w-8 object-contain ${
                      liquidGlass === "glassy" ? "invert brightness-200" : "grayscale brightness-0 contrast-200"
                    }`} 
                    referrerPolicy="no-referrer" 
                  />
                </motion.button>
              )
            )}
          </AnimatePresence>
          <Tooltip text={hoveredTab || ""} show={!!hoveredTab} targetRect={hoveredTabRect} />
        </motion.div>
      </div>
        </Fragment>
      )}

        {/* Floating V-pilot V2 Button */}
        {featureFlags.copilot_action_v2 && !showSplash && !showOOBE && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10000]">
            <div className="relative" onMouseEnter={() => setShowAIToolsMenu(true)} onMouseLeave={() => setShowAIToolsMenu(false)}>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setShowAIToolsMenu(!showAIToolsMenu);
                }}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_40px_rgba(139,92,246,0.3)] flex items-center justify-center border border-white/20 transition-all group overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors" />
                <Sparkles className="w-8 h-8 text-white relative z-10" />
              </motion.button>
              <AnimatePresence>
                {showAIToolsMenu && (
                  <AIToolsMenu 
                    onAction={onAIToolsAction} 
                    align="bottom" 
                    featureFlags={featureFlags} 
                    tabs={tabs} 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    setShowAIToolsMenu={setShowAIToolsMenu} 
                    setShowAIToolsMenuSidebar={setShowAIToolsMenuSidebar} 
                    isNarratorActive={isNarratorActive}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* History Drawer */}
        <AnimatePresence>
          {showHistoryDrawer && (
            <div className="fixed inset-0 z-[6000] flex justify-end">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistoryDrawer(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm shadow-2xl" 
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className={`relative w-full sm:w-[450px] h-full shadow-2xl flex flex-col ${isDark ? "bg-[#0f0f11] text-white" : "bg-white text-slate-900"}`}
              >
                <div className="p-8 border-b border-current/10 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <History size={20} className="text-purple-500" />
                      <h3 className="text-xl font-black uppercase tracking-tighter italic">Lịch sử hoạt động</h3>
                   </div>
                   <button onClick={() => setShowHistoryDrawer(false)} className="p-2 rounded-full hover:bg-current/5 transition-all">
                      <X size={20} />
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                  {/* Stats Section */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-3xl border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Clicks</span>
                      <p className="text-2xl font-black italic">{historyStats.buttonClicks}</p>
                    </div>
                    <div className={`p-4 rounded-3xl border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Switches</span>
                      <p className="text-2xl font-black italic">{historyStats.switchesToggled}</p>
                    </div>
                    <div className={`p-4 rounded-3xl border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Popups</span>
                      <p className="text-2xl font-black italic">{historyStats.popupsOpened}</p>
                    </div>
                    <div className={`p-4 rounded-3xl border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Channels</span>
                      <p className="text-2xl font-black italic">{historyStats.channelsWatched}</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-3xl border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Truy cập lần cuối</span>
                     <p className="text-sm font-bold">{new Date(historyStats.lastVisit).toLocaleString('vi-VN')}</p>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block">Hoạt động gần đây</span>
                    {history.length === 0 ? (
                      <div className="py-20 flex flex-col items-center justify-center opacity-20">
                        <Clock size={40} className="mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Trống</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {history.map(item => (
                          <div key={item.id} className={`p-4 rounded-2xl border transition-all ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100"}`}>
                            <div className="flex items-center justify-between mb-2">
                               <span className="text-[9px] font-black uppercase tracking-widest py-1 px-2 bg-current/10 rounded-md">
                                 {item.type}
                               </span>
                               <span className="text-[9px] font-bold opacity-30">
                                 {new Date(item.time).toLocaleTimeString()}
                               </span>
                            </div>
                            <p className="text-xs font-medium leading-relaxed opacity-80">{item.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t border-current/10">
                   <button 
                     onClick={() => {
                       setHistory([]);
                       localStorage.setItem("vplay_history", "[]");
                     }}
                     className="w-full py-4 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all"
                   >
                     Xóa lịch sử log
                   </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Notification Drawer */}
        <AnimatePresence>
          {showNotificationDrawer && (
            <div className="fixed inset-0 z-[6000] flex justify-end">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowNotificationDrawer(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm shadow-2xl" 
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className={`relative w-full sm:w-[400px] h-full shadow-2xl flex flex-col ${isDark ? "bg-[#121214] text-white" : "bg-white text-slate-900"}`}
              >
                <div className="p-8 border-b border-current/10 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Bell size={20} className="text-blue-500" />
                      <h3 className="text-xl font-black uppercase tracking-tighter italic">Thông báo</h3>
                   </div>
                   <button onClick={() => setShowNotificationDrawer(false)} className="p-2 rounded-full hover:bg-current/5 transition-all">
                      <X size={20} />
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                       <Bell size={48} className="mb-4" />
                       <p className="text-xs font-bold uppercase tracking-widest">Không có thông báo mới</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id}
                        className={`p-6 rounded-3xl border transition-all ${notif.read ? "opacity-50" : "opacity-100"} ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                         <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${notif.type === 'warning' ? 'bg-amber-500' : notif.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                            <h4 className="text-sm font-black uppercase tracking-tight italic">{notif.title}</h4>
                         </div>
                         <p className="text-xs opacity-60 font-medium leading-relaxed mb-4">{notif.message}</p>
                         <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">{new Date(notif.time).toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-6 border-t border-current/10">
                    <button 
                      onClick={clearNotifications}
                      className="w-full py-4 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all"
                    >
                      Xóa tất cả thông báo
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Watermark (Only visible when NOT in Windows Mode) */}
      {!featureFlags.windows_mode && (
        <div className="fixed bottom-24 right-6 z-[50] text-right pointer-events-none select-none transition-all duration-500 opacity-50 mix-blend-difference">
          <div className="text-[12px] font-normal text-white/40">Vplay Canary - Build Codename (C) Nx626</div>
          <div className="text-[10px] leading-tight mt-1.5 font-medium text-white/90">
            Work in progress - For testing purposes only
          </div>
        </div>
      )}

      {/* Floating Operator Window */}
      <AnimatePresence>
        {isConsoleFloating && (
          <motion.div
            drag
            dragMomentum={false}
            dragListener={!isConsoleMaximized}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              width: isConsoleMinimized ? 300 : (isConsoleMaximized ? "100vw" : 800),
              height: isConsoleMinimized ? 48 : (isConsoleMaximized ? "100vh" : 500),
              x: isConsoleMaximized ? 0 : undefined,
              top: isConsoleMaximized ? 0 : (isConsoleMinimized ? "auto" : undefined),
              bottom: isConsoleMinimized ? 20 : undefined,
              left: isConsoleMaximized ? 0 : (isConsoleMinimized ? 20 : undefined),
              zIndex: 99999
            }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            className={`fixed shadow-2xl flex flex-col overflow-hidden border transition-all duration-300 ${
              isDark ? "bg-[#11141d] border-white/10" : "bg-white border-slate-200"
            } ${isConsoleMaximized ? "rounded-none" : "rounded-2xl"}`}
          >
            {/* Title Bar */}
            <div 
              className={`h-12 flex items-center justify-between px-4 select-none cursor-move ${
                isDark ? "bg-white/5" : "bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Terminal size={18} className="text-purple-500" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Operator Console</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsConsoleMinimized(!isConsoleMinimized)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
                >
                  <Minus size={14} />
                </button>
                <button 
                  onClick={() => setIsConsoleMaximized(!isConsoleMaximized)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
                >
                  {isConsoleMaximized ? <Minimize2 size={14} /> : <Square size={12} />}
                </button>
                <button 
                  onClick={() => setIsConsoleFloating(false)}
                  className={`p-2 rounded-lg transition-colors hover:bg-red-500 hover:text-white`}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Window Content */}
            {!isConsoleMinimized && (
              <div className="flex-1 overflow-hidden">
                <DebugContent 
                  isDark={isDark} 
                  featureFlags={featureFlags} 
                  setFeatureFlags={(f) => {
                    setFeatureFlags(f);
                    localStorage.setItem("vplay_feature_flags", JSON.stringify(f));
                    
                    window.location.reload();
                  }}
                  setUser={setUser}
                  setIsAdmin={setIsAdmin}
                  setIsDev={setIsDev}
                  setIsDark={setIsDark}
                  setLiquidGlass={setLiquidGlass}
                  setIsSidebarRight={setIsSidebarRight}
                  setUseSidebar={setUseSidebar}
                  onAlert={(title, msg) => setCustomAlert({ title, message: msg })}
                  isFloating={true}
                />
              </div>
            )}
            
            {/* Resize Handle (Simulation) */}
            {!isConsoleMaximized && !isConsoleMinimized && (
              <div className="absolute right-0 bottom-0 w-4 h-4 cursor-nwse-resize opacity-20 hover:opacity-100 transition-opacity">
                <div className="w-1 h-1 bg-white absolute right-1 bottom-1 rounded-full" />
                <div className="w-1 h-1 bg-white absolute right-3 bottom-1 rounded-full" />
                <div className="w-1 h-1 bg-white absolute right-1 bottom-3 rounded-full" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speak for me Window */}
      <AnimatePresence>
        {isSpeakForMeOpen && (
          <motion.div
            drag={!isSpeakForMeMaximized}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              width: isSpeakForMeMaximized ? '100%' : 900,
              height: isSpeakForMeMaximized ? '100%' : 650,
              top: isSpeakForMeMaximized ? 0 : '10%',
              left: isSpeakForMeMaximized ? 0 : '15%',
              zIndex: 99999,
              borderRadius: isSpeakForMeMaximized ? 0 : 12
            }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            className="fixed shadow-2xl flex flex-col overflow-hidden border border-slate-200 transition-all duration-300 bg-white"
          >
            {/* Windows 11 Title Bar Style */}
            <div className="h-10 flex items-center justify-between px-3 select-none cursor-move bg-[#f3f3f3] border-b border-transparent">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex items-center justify-center rounded-sm bg-slate-300">
                  <Mic size={12} className="text-slate-600" />
                </div>
                <span className="text-[11px] font-medium text-slate-700">SpeakForMe</span>
              </div>
              <div className="flex items-center gap-0">
                <button className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-full mr-2">
                   <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                     <User size={14} className="text-slate-600" />
                   </div>
                </button>
                <button 
                   onClick={() => setIsSpeakForMeOpen(false)}
                   className="w-11 h-8 flex items-center justify-center hover:bg-black/5 titlebar-btn"
                >
                  <Minus size={16} className="text-slate-700" />
                </button>
                <button 
                  onClick={() => setIsSpeakForMeMaximized(!isSpeakForMeMaximized)}
                  className="w-11 h-8 flex items-center justify-center hover:bg-black/5"
                >
                  <Square size={12} className="text-slate-700" />
                </button>
                <button 
                  onClick={() => setIsSpeakForMeOpen(false)}
                  className="w-11 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Window Content */}
            <div className="flex-1 overflow-hidden bg-[#eff3f9]">
              <SpeakForMeContent isDark={false} onBack={() => setIsSpeakForMeOpen(false)} />
            </div>
          </motion.div>
        )}

        {isCopyForMeOpen && (
          <motion.div
            drag
            dragMomentum={false}
            dragListener={!isCopyForMeMaximized}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              width: isCopyForMeMaximized ? "100vw" : 850,
              height: isCopyForMeMaximized ? "100vh" : 580,
              top: isCopyForMeMaximized ? 0 : "15%",
              left: isCopyForMeMaximized ? 0 : "18%",
              zIndex: 9002
            }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            className={`fixed shadow-2xl flex flex-col overflow-hidden border transition-all duration-300 bg-white border-slate-200 ${isCopyForMeMaximized ? "rounded-none" : "rounded-2xl"}`}
          >
            {/* Windows 11 Title Bar Style */}
            <div className="h-10 flex items-center justify-between px-3 select-none cursor-move bg-[#f3f3f3] border-b border-transparent">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex items-center justify-center rounded-sm bg-blue-100">
                  <Copy size={12} className="text-blue-600" />
                </div>
                <span className="text-[11px] font-medium text-slate-700">CopyForMe</span>
              </div>
              <div className="flex items-center gap-0">
                <button 
                   onClick={() => setIsCopyForMeOpen(false)}
                   className="w-11 h-8 flex items-center justify-center hover:bg-black/5 titlebar-btn"
                >
                  <Minus size={16} className="text-slate-700" />
                </button>
                <button 
                  onClick={() => setIsCopyForMeMaximized(!isCopyForMeMaximized)}
                  className="w-11 h-8 flex items-center justify-center hover:bg-black/5"
                >
                  <Square size={12} className="text-slate-700" />
                </button>
                <button 
                  onClick={() => setIsCopyForMeOpen(false)}
                  className="w-11 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Window Content */}
            <div className="flex-1 overflow-hidden">
               <CopyForMeContent onBack={() => setIsCopyForMeOpen(false)} />
            </div>
          </motion.div>
        )}

        {isPlayForMeOpen && (
          <motion.div
            drag
            dragMomentum={false}
            dragListener={!isPlayForMeMaximized}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              width: isPlayForMeMaximized ? "100vw" : 950,
              height: isPlayForMeMaximized ? "100vh" : 700,
              top: isPlayForMeMaximized ? 0 : "10%",
              left: isPlayForMeMaximized ? 0 : "12%",
              zIndex: 9005
            }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            className={`fixed shadow-2xl flex flex-col overflow-hidden border transition-all duration-300 bg-white border-slate-200 ${isPlayForMeMaximized ? "rounded-none" : "rounded-3xl"}`}
          >
            <div className="h-10 flex items-center justify-between px-3 select-none cursor-move bg-[#f3f3f3] border-b border-transparent">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex items-center justify-center rounded-sm bg-blue-100">
                  <Play size={12} className="text-blue-600" />
                </div>
                <span className="text-[11px] font-medium text-slate-700">PlayForMe</span>
              </div>
              <div className="flex items-center gap-0">
                <button 
                   onClick={() => setIsPlayForMeOpen(false)}
                   className="w-11 h-8 flex items-center justify-center hover:bg-black/5 titlebar-btn"
                >
                  <Minus size={16} className="text-slate-700" />
                </button>
                <button 
                  onClick={() => setIsPlayForMeMaximized(!isPlayForMeMaximized)}
                  className="w-11 h-8 flex items-center justify-center hover:bg-black/5"
                >
                  <Square size={12} className="text-slate-700" />
                </button>
                <button 
                  onClick={() => setIsPlayForMeOpen(false)}
                  className="w-11 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
               <PlayForMeContent isDark={isDark} liquidGlass={liquidGlass} featureFlags={featureFlags} />
            </div>
          </motion.div>
        )}

        {isConvertForMeOpen && (
          <motion.div
            drag
            dragMomentum={false}
            dragListener={!isConvertForMeMaximized}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              width: isConvertForMeMaximized ? "100vw" : 800,
              height: isConvertForMeMaximized ? "100vh" : 600,
              top: isConvertForMeMaximized ? 0 : "18%",
              left: isConvertForMeMaximized ? 0 : "20%",
              zIndex: 9006
            }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            className={`fixed shadow-2xl flex flex-col overflow-hidden border transition-all duration-300 bg-white border-slate-200 ${isConvertForMeMaximized ? "rounded-none" : "rounded-3xl"}`}
          >
            <div className="h-10 flex items-center justify-between px-3 select-none cursor-move bg-[#f3f3f3] border-b border-transparent">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex items-center justify-center rounded-sm bg-blue-100">
                  <RefreshCcw size={12} className="text-blue-600" />
                </div>
                <span className="text-[11px] font-medium text-slate-700">ConvertForMe</span>
              </div>
              <div className="flex items-center gap-0">
                <button 
                   onClick={() => setIsConvertForMeOpen(false)}
                   className="w-11 h-8 flex items-center justify-center hover:bg-black/5 titlebar-btn"
                >
                  <Minus size={16} className="text-slate-700" />
                </button>
                <button 
                  onClick={() => setIsConvertForMeMaximized(!isConvertForMeMaximized)}
                  className="w-11 h-8 flex items-center justify-center hover:bg-black/5"
                >
                  <Square size={12} className="text-slate-700" />
                </button>
                <button 
                  onClick={() => setIsConvertForMeOpen(false)}
                  className="w-11 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
               <ConvertForMeContent isDark={isDark} />
            </div>
          </motion.div>
        )}

        {isGeminiOpen && (
          <motion.div
            drag
            dragMomentum={false}
            dragListener={!isGeminiMaximized}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              width: isGeminiMaximized ? "100vw" : 1000,
              height: isGeminiMaximized ? "100vh" : 700,
              top: isGeminiMaximized ? 0 : "10%",
              left: isGeminiMaximized ? 0 : "12%",
              zIndex: 9003
            }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            className={`fixed shadow-2xl flex flex-col overflow-hidden border transition-all duration-300 bg-white border-slate-200 ${isGeminiMaximized ? "rounded-none" : "rounded-2xl"}`}
          >
            {/* Windows 11 Title Bar Style */}
            <div className="h-10 flex items-center justify-between px-3 select-none cursor-move bg-[#f3f3f3] border-b border-transparent">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex items-center justify-center rounded-sm bg-purple-100">
                  <Sparkles size={12} className="text-purple-600" />
                </div>
                <span className="text-[11px] font-medium text-slate-700">Google Gemini</span>
              </div>
              <div className="flex items-center gap-0">
                <button 
                   onClick={() => setIsGeminiOpen(false)}
                   className="w-11 h-8 flex items-center justify-center hover:bg-black/5 titlebar-btn"
                >
                  <Minus size={16} className="text-slate-700" />
                </button>
                <button 
                  onClick={() => setIsGeminiMaximized(!isGeminiMaximized)}
                  className="w-11 h-8 flex items-center justify-center hover:bg-black/5"
                >
                  <Square size={12} className="text-slate-700" />
                </button>
                <button 
                  onClick={() => setIsGeminiOpen(false)}
                  className="w-11 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Window Content */}
            <div className="flex-1 overflow-hidden">
               <GeminiWindowContent />
            </div>
          </motion.div>
        )}

        {isScreenRecorderOpen && (
          <motion.div
            drag
            dragMomentum={false}
            dragListener={!isScreenRecorderMaximized}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              width: isScreenRecorderMaximized ? "100vw" : 900,
              height: isScreenRecorderMaximized ? "100vh" : 650,
              top: isScreenRecorderMaximized ? 0 : "12%",
              left: isScreenRecorderMaximized ? 0 : "15%",
              zIndex: 9004
            }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            className={`fixed shadow-2xl flex flex-col overflow-hidden border transition-all duration-300 bg-white border-slate-200 ${isScreenRecorderMaximized ? "rounded-none" : "rounded-2xl"}`}
          >
            {/* Windows 11 Title Bar Style */}
            <div className="h-10 flex items-center justify-between px-3 select-none cursor-move bg-[#f3f3f3] border-b border-transparent">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex items-center justify-center rounded-sm bg-blue-100">
                  <Video size={12} className="text-blue-600" />
                </div>
                <span className="text-[11px] font-medium text-slate-700">RecordForMe</span>
              </div>
              <div className="flex items-center gap-0">
                <button 
                   onClick={() => setIsScreenRecorderOpen(false)}
                   className="w-11 h-8 flex items-center justify-center hover:bg-black/5 titlebar-btn"
                >
                  <Minus size={16} className="text-slate-700" />
                </button>
                <button 
                  onClick={() => setIsScreenRecorderMaximized(!isScreenRecorderMaximized)}
                  className="w-11 h-8 flex items-center justify-center hover:bg-black/5"
                >
                  <Square size={12} className="text-slate-700" />
                </button>
                <button 
                  onClick={() => setIsScreenRecorderOpen(false)}
                  className="w-11 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Window Content */}
            <div className="flex-1 overflow-hidden">
               <RecordForMeContent featureFlags={featureFlags} />
            </div>
          </motion.div>
        )}

        {isCaptureForMeOpen && (
          <motion.div
            drag
            dragMomentum={false}
            dragListener={!isCaptureForMeMaximized}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              width: isCaptureForMeMaximized ? "100vw" : 850,
              height: isCaptureForMeMaximized ? "100vh" : 600,
              top: isCaptureForMeMaximized ? 0 : "18%",
              left: isCaptureForMeMaximized ? 0 : "22%",
              zIndex: 9005
            }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            className={`fixed shadow-2xl flex flex-col overflow-hidden border transition-all duration-300 bg-white border-slate-200 ${isCaptureForMeMaximized ? "rounded-none" : "rounded-2xl"}`}
          >
            {/* Windows 11 Title Bar Style */}
            <div className="h-10 flex items-center justify-between px-3 select-none cursor-move bg-[#f3f3f3] border-b border-transparent">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex items-center justify-center rounded-sm bg-purple-100">
                  <Camera size={12} className="text-purple-600" />
                </div>
                <span className="text-[11px] font-medium text-slate-700">CaptureForMe</span>
              </div>
              <div className="flex items-center gap-0">
                <button 
                   onClick={() => setIsCaptureForMeOpen(false)}
                   className="w-11 h-8 flex items-center justify-center hover:bg-black/5 titlebar-btn"
                >
                  <Minus size={16} className="text-slate-700" />
                </button>
                <button 
                  onClick={() => setIsCaptureForMeMaximized(!isCaptureForMeMaximized)}
                  className="w-11 h-8 flex items-center justify-center hover:bg-black/5"
                >
                  <Square size={12} className="text-slate-700" />
                </button>
                <button 
                  onClick={() => setIsCaptureForMeOpen(false)}
                  className="w-11 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Window Content */}
            <div className="flex-1 overflow-hidden">
               <CaptureForMeContent />
            </div>
          </motion.div>
        )}

        {isAboutDoStuffOpen && (
          <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              width: 700,
              height: 500,
              top: "20%",
              left: "25%",
              zIndex: 9005
            }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            className={`fixed shadow-2xl flex flex-col overflow-hidden border transition-all duration-300 bg-white border-slate-200 rounded-2xl`}
          >
            {/* Windows 11 Title Bar Style */}
            <div className="h-10 flex items-center justify-between px-3 select-none cursor-move bg-[#f3f3f3] border-b border-transparent">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex items-center justify-center rounded-sm bg-purple-100">
                  <Zap size={12} className="text-purple-600" />
                </div>
                <span className="text-[11px] font-medium text-slate-700">Do For Me - About</span>
              </div>
              <div className="flex items-center gap-0">
                <button 
                  onClick={() => setIsAboutDoStuffOpen(false)}
                  className="w-11 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Window Content */}
            <div className="flex-1 overflow-hidden">
               <AboutDoStuffContent />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(featureFlags?.music_background && backgroundMusicOption !== "off") && (
        <div className="hidden">
          <iframe 
            width="0" 
            height="0" 
            src={`https://www.youtube.com/embed/bDofIQBqjRI?autoplay=1&loop=1&playlist=bDofIQBqjRI&controls=0&showinfo=0&autohide=1&enablejsapi=1`}
            title="Background Music"
            allow="autoplay"
            frameBorder="0"
          />
        </div>
      )}

      {/* Modals & Overlays */}
      <AnimatePresence>
        {showWidgets && (
          <WidgetsDashboard 
            showWidgets={showWidgets} 
            setShowWidgets={setShowWidgets} 
            pinnedWidgets={pinnedWidgets}
            setPinnedWidgets={setPinnedWidgets}
            isWidgetsFullScreen={isWidgetsFullScreen} 
            setIsWidgetsFullScreen={setIsWidgetsFullScreen} 
            isMobile={isMobile}
            weatherCity={weatherCity}
            weatherData={weatherData}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setIsSearchOpen={setIsSearchOpen}
            isDark={isDark}
            setIsDark={setIsDark}
            isDev={isDev}
            setIsDev={setIsDev}
            isUnlimitedVpoints={isUnlimitedVpoints}
            setIsUnlimitedVpoints={setIsUnlimitedVpoints}
            handleDevOptionClick={handleDevOptionClick}
            user={user}
            userData={userData}
            setUserData={setUserData}
            history={history}
            notifications={notifications}
            addNotification={addNotification}
            onAction={onAction}
            onAIToolsAction={onAIToolsAction}
            onFeedbackClick={() => setShowFeedback(true)}
            onNavigate={onNavigate}
            onAlert={(title: string, msg: string) => setCustomAlert({ title, message: msg })}
            channels={channels}
            featureFlags={featureFlags}
            setFeatureFlags={setFeatureFlags}
            vpoints={vpoints}
            setVpoints={setVpoints}
            purchasedWidgets={purchasedWidgets}
            setPurchasedWidgets={setPurchasedWidgets}
            isVstorePinned={isVstorePinned}
            setIsVstorePinned={setIsVstorePinned}
            hasReceivedBonus={hasReceivedBonus}
            setHasReceivedBonus={setHasReceivedBonus}
            activeBoardTab={activeBoardTab}
            setActiveBoardTab={setActiveBoardTab}
            activeDoForMeSubView={activeDoForMeSubView}
            setActiveDoForMeSubView={setActiveDoForMeSubView}
            pinnedDoForMeFeatures={pinnedDoForMeFeatures}
            togglePinFeature={togglePinFeature}
            liquidGlass={liquidGlass}
            widgetsTheme={widgetsTheme}
            setWidgetsTheme={setWidgetsTheme}
            setLiquidGlass={setLiquidGlass}
            useSidebar={useSidebar}
            setUseSidebar={setUseSidebar}
            isSidebarRight={isSidebarRight}
            setIsSidebarRight={setIsSidebarRight}
            isPinningEnabled={isPinningEnabled}
            setIsPinningEnabled={setIsPinningEnabled}
            onLogin={handleLogin}
            favorites={favorites}
            backgroundMusicOption={backgroundMusicOption}
            setBackgroundMusicOption={setBackgroundMusicOption}
            customMusicId={customMusicId}
            setCustomMusicId={setCustomMusicId}
            searchBoxPosition={searchBoxPosition}
            setSearchBoxPosition={setSearchBoxPosition}
            sidebarStyle={sidebarStyle}
            setSidebarStyle={setSidebarStyle}
            setActiveTab={setActiveTab}
            wallpaperType={wallpaperType}
            setWallpaperType={setWallpaperType}
            solidColor={solidColor}
            setSolidColor={setSolidColor}
            gradientColors={gradientColors}
            setGradientColors={setGradientColors}
            desktopWallpaper={desktopWallpaper}
            setDesktopWallpaper={setDesktopWallpaper}
            forcedFont={forcedFont}
            setForcedFont={setForcedFont}
            onEraseClick={() => setShowEraseModal(true)}
            setHistory={setHistory}
            historyStats={historyStats}
            setHistoryStats={setHistoryStats}
            setNotifications={setNotifications}
            clearNotifications={clearNotifications}
          />
        )}
      </AnimatePresence>
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        isDark={isDark} 
        liquidGlass={liquidGlass} 
        setIsDev={setIsDev} 
        setUserData={setUserData} 
        featureFlags={featureFlags}
      />
      
      <LiquidModal
        isOpen={showDevSettings}
        onClose={() => setShowDevSettings(false)}
        isDark={isDark}
        title="Cài đặt nhà phát triển"
        description={isDev ? "Bạn đang ở chế độ nhà phát triển. Bạn có muốn tắt nó không?" : "Bạn muốn kích hoạt chế độ nhà phát triển?"}
        liquidGlass={liquidGlass}
        featureFlags={featureFlags}
      >
        <div className="flex flex-col gap-3">
          {!isDev ? (
            <button 
              onClick={() => { setShowDevSettings(false); setShowDevPrompt(true); }}
              className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-[32px] font-bold transition-all shadow-lg shadow-purple-600/20 active:scale-95"
            >
              Kích hoạt (Yêu cầu mật khẩu)
            </button>
          ) : (
            <button 
              onClick={() => { setIsDev(false); setShowDevSettings(false); }}
              className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-[32px] font-bold transition-all shadow-lg shadow-red-600/20 active:scale-95"
            >
              Hủy kích hoạt
            </button>
          )}
          <button 
            onClick={() => setShowDevSettings(false)}
            className={`w-full py-3 rounded-3xl font-bold transition-all ${
              isDark ? "bg-white/5 text-slate-400 hover:text-white" : "bg-black/5 text-slate-500 hover:text-slate-900"
            }`}
          >
            Đóng
          </button>
        </div>
      </LiquidModal>

      <LiquidModal
        isOpen={showDevPrompt}
        onClose={() => { setShowDevPrompt(false); setDevPass(""); setDevError(false); }}
        isDark={isDark}
        title="Chế độ nhà phát triển"
        description="Kích hoạt tính năng nhà phát triển để truy cập vào các quyền đặc biệt. Bạn cần phải có mật khẩu dành cho nhà phát triển được chia sẻ bởi Chủ Thớt để kích hoạt"
        liquidGlass={liquidGlass}
        featureFlags={featureFlags}
      >
        <form onSubmit={verifyDev} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider opacity-50 ml-4 ${isDark ? "text-white" : "text-slate-900"}`}>Mật khẩu</label>
            <input 
              autoFocus
              type="password" 
              value={devPass} 
              onChange={e => setDevPass(e.target.value)}
              className={`w-full px-5 py-3 rounded-3xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                devError 
                  ? "border-red-500 bg-red-500/5" 
                  : isDark 
                    ? "bg-white/5 border-white/10 text-white placeholder-white/30" 
                    : "bg-black/5 border-black/5 text-slate-900 placeholder-slate-400"
              }`}
              placeholder="••••••••"
            />
            {devError && <p className="text-red-500 text-[10px] mt-2 font-bold text-center">Mật khẩu không chính xác!</p>}
          </div>
          
          <div className="flex flex-col gap-3 pt-2">
            <button 
              type="submit"
              className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-[32px] font-bold transition-all shadow-lg shadow-purple-600/20 active:scale-95"
            >
              Xác nhận
            </button>
            <button 
              type="button"
              onClick={() => { setShowDevPrompt(false); setDevPass(""); setDevError(false); }}
              className={`w-full py-3 rounded-3xl font-bold transition-all ${
                isDark ? "bg-white/5 text-slate-400 hover:text-white" : "bg-black/5 text-slate-500 hover:text-slate-900"
              }`}
            >
              Hủy
            </button>
          </div>
        </form>
      </LiquidModal>
        {featureFlags.ai_tools && !featureFlags.taskbar_experimental && (
           <div className="fixed bottom-6 right-6 z-[6000]">
             <AnimatePresence mode="wait">
               {isAIToolsSearchActive ? (
                 <motion.div
                   key="search"
                   initial={{ width: 56, opacity: 0 }}
                   animate={{ width: 320, opacity: 1 }}
                   exit={{ width: 56, opacity: 0 }}
                   className="h-14 bg-white dark:bg-[#1a1c23] rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-black/5 dark:border-white/10 flex items-center px-4 gap-3"
                 >
                   <Search size={20} className="text-slate-400" />
                   <input 
                     autoFocus
                     placeholder="Search Vplay..."
                     className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400"
                     onBlur={() => setIsAIToolsSearchActive(false)}
                     onKeyDown={(e) => {
                       if (e.key === "Escape") setIsAIToolsSearchActive(false);
                       if (e.key === "Enter") {
                         setSearchQuery(e.currentTarget.value || "");
                         setIsSearchOpen(true);
                         setIsAIToolsSearchActive(false);
                       }
                     }}
                   />
                   <button onClick={() => setIsAIToolsSearchActive(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                     <X size={18} />
                   </button>
                 </motion.div>
               ) : (
                 <motion.div
                   key="button"
                   initial={{ scale: 0, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   className="relative"
                 >
                     <button
                       onClick={() => {
                         setIsAIToolsRotating(true);
                         setTimeout(() => setIsAIToolsRotating(false), 800);
                         setShowAIToolsMenuMobile(!showAIToolsMenuMobile);
                       }}
                       className={`w-14 h-14 bg-gradient-to-br from-[#4158D0] via-[#C850C0] to-[#FFCC70] rounded-full shadow-[0_10px_40px_rgba(192,80,192,0.4)] border border-white/20 flex items-center justify-center relative overflow-visible group active:scale-90 transition-transform`}
                     >
                       <AnimatePresence>
                         {showAIToolsMenuMobile && (
                            <AIToolsMenu 
                              onAction={onAIToolsAction} 
                              align="bottom-right" 
                              featureFlags={featureFlags} 
                              tabs={tabs} 
                              activeTab={activeTab} 
                              setActiveTab={setActiveTab} 
                              setShowAIToolsMenu={setShowAIToolsMenuMobile} 
                              setShowAIToolsMenuSidebar={setShowAIToolsMenuSidebar} 
                              isNarratorActive={isNarratorActive}
                            />
                         )}
                       </AnimatePresence>
                       <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                       <motion.img 
                         src={vpilotIcon}
                         alt="V-pilot"
                         className="w-7 h-7 object-contain"
                         animate={isAIToolsRotating ? { rotate: [0, 90, 180, 270, 360, 450, 540, 630, 720] } : { rotate: 0 }}
                         transition={isAIToolsRotating ? { duration: 0.8, ease: "linear" } : { duration: 0.3 }}
                       />
                     </button>

                   {/* OOBE Overlay */}
                   <AnimatePresence>
                     {showAIToolsOOBE && (
                       <motion.div
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: 20 }}
                         className="absolute bottom-full right-0 mb-6 w-72 p-6 bg-gradient-to-br from-[#4158D0] via-[#C850C0] to-[#FFCC70] rounded-3xl shadow-2xl border border-white/20 pointer-events-auto z-[6001]"
                       >
                         <button 
                           onClick={() => {
                             setShowAIToolsOOBE(false);
                             localStorage.setItem("vplay_seen_aitools_oobe", "true");
                           }}
                           className="absolute top-4 right-4 text-slate-400 hover:text-slate-900"
                         >
                           <X size={16} />
                         </button>
                         <h2 className="text-xl font-medium text-white mb-2 leading-none">Giới thiệu V-pilot mới!</h2>
                         <p className="text-sm text-white/80 leading-relaxed mb-4">
                           V-pilot, Search và Operator Console đã được hợp nhất làm một. Bạn có thể tìm kiếm hoặc sử dụng lệnh thông qua V-pilot button hiển thị ở góc phía phải màn hình
                         </p>
                         <div className="absolute top-[110%] right-6 text-white rotate-90">
                           <motion.div
                             animate={{ y: [0, 5, 0] }}
                             transition={{ repeat: Infinity, duration: 1.5 }}
                           >
                             <ArrowRight size={32} />
                           </motion.div>
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
        )}
        {featureFlags.taskbar_experimental && !isMobile && (
          <TaskBar 
            items={tabs}
            activeTab={activeTab}
            onTabClick={setActiveTab}
            isDark={isDark}
            featureFlags={featureFlags}
            onAction={onAIToolsAction}
            showAIToolsMenu={showAIToolsMenuMobile}
            setShowAIToolsMenu={setShowAIToolsMenuMobile}
            isAIToolsRotating={isAIToolsRotating}
            tabs={tabs}
            setActiveTab={setActiveTab}
            setShowAIToolsMenuSidebar={setShowAIToolsMenuSidebar}
            isNarratorActive={isNarratorActive}
          />
        )}

        {/* Developer Setting Activate Modal Overlay */}
        <AnimatePresence>
          {showDevModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center font-light leading-relaxed select-none overflow-hidden"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <div className="w-full bg-[#1e0a5c] text-white py-14 px-8 md:px-24 border-t border-b border-white/10 shadow-2xl">
                <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 text-left font-light leading-relaxed">
                  <div className="space-y-3 w-full">
                    <h2 className="text-3xl md:text-3xl text-white font-light leading-tight tracking-wide uppercase font-mono">
                      This option cannot be activated normally
                    </h2>
                    <p className="text-sm md:text-base text-white/80 font-light leading-relaxed">
                      You are accessing a developer exclusive setting. To activate, you will need to type a developer keypass (unless you are a regular user)
                    </p>
                  </div>

                  {!showCustomPointsStep ? (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (devKeypassInput === "3667") {
                          if (pendingDevOption === "custom_vpoints") {
                            setShowCustomPointsStep(true);
                          } else {
                            executeDevOption(pendingDevOption!);
                            setShowDevModal(false);
                          }
                        } else {
                          addNotification("Dev Error", "Mật mã nhà phát triển không chính xác!", "warning");
                        }
                      }} 
                      className="space-y-4 max-w-sm w-full"
                    >
                      <input 
                        type="password"
                        placeholder="Enter developer keypass..."
                        autoFocus
                        required
                        className="w-full px-4 py-3 bg-white text-black border-none outline-none text-xs rounded-none font-mono"
                        value={devKeypassInput}
                        onChange={(e) => setDevKeypassInput(e.target.value)}
                      />
                      <div className="flex gap-4">
                        <button
                          type="submit"
                          className="border border-white text-white font-light text-xs px-6 py-2.5 transition-all select-none bg-transparent hover:bg-white/10 rounded-none active:scale-[0.98] cursor-pointer"
                        >
                          Verify & Run
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDevModal(false);
                            setPendingDevOption(null);
                          }}
                          className="border border-white/40 text-white/70 font-light text-xs px-6 py-2.5 transition-all select-none bg-transparent hover:bg-white/10 rounded-none active:scale-[0.98] cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const val = parseInt(devCustomPointsInput);
                        if (!isNaN(val)) {
                          setVpoints(val);
                          addNotification("Dev", `Đã đặt số lượng Vpoints thành ${val}!`, "success");
                          setShowDevModal(false);
                          setPendingDevOption(null);
                          setShowCustomPointsStep(false);
                        } else {
                          addNotification("Dev Error", "Vui lòng nhập một số hợp lệ!", "warning");
                        }
                      }} 
                      className="space-y-4 max-w-sm w-full"
                    >
                      <p className="text-xs text-rose-300 font-bold uppercase tracking-wider font-mono">Mật mã đúng! Hãy nhập số lượng Vpoints mong muốn (ko giới hạn):</p>
                      <input 
                        type="number"
                        placeholder="Nhập số lượng Vpoints..."
                        autoFocus
                        required
                        className="w-full px-4 py-3 bg-white text-black border-none outline-none text-xs rounded-none font-mono"
                        value={devCustomPointsInput}
                        onChange={(e) => setDevCustomPointsInput(e.target.value)}
                      />
                      <div className="flex gap-4">
                        <button
                          type="submit"
                          className="border border-white text-white font-light text-xs px-6 py-2.5 transition-all select-none bg-transparent hover:bg-white/10 rounded-none active:scale-[0.98] cursor-pointer"
                        >
                          Xác nhận
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDevModal(false);
                            setPendingDevOption(null);
                            setShowCustomPointsStep(false);
                          }}
                          className="border border-white/40 text-white/70 font-light text-xs px-6 py-2.5 transition-all select-none bg-transparent hover:bg-white/10 rounded-none active:scale-[0.98] cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Respring Permanent Overlay */}
        {isRespring && (
          <div className="fixed inset-0 z-[200000] bg-black/60 backdrop-blur-sm flex items-center justify-center font-light leading-relaxed select-none overflow-hidden text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div className="w-full bg-[#1e0a5c] text-white py-14 px-8 md:px-24 border-t border-b border-white/10 shadow-2xl">
              <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 text-left font-light leading-relaxed">
                {!isRespringBypassing ? (
                  <div className="flex flex-col gap-6 animate-fade-in w-full">
                    <div className="space-y-3 w-full">
                      <h2 className="text-3xl md:text-4xl text-white font-light leading-tight tracking-wide">
                        Please wait...
                      </h2>
                      <p className="text-sm md:text-base text-white/95 font-light leading-relaxed w-full">
                        System components are refreshing. Do not close or restart. Vplay is updating its options and rebuilding caches.
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 pt-4">
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/3/3f/Windows-loading-cargando.gif" 
                        alt="Loading" 
                        className="w-7 h-7 object-contain shrink-0 filter brightness-200 opacity-60"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-xl font-light text-white/90">
                        Refreshing system state...
                      </span>
                    </div>
                    
                    <div className="pt-4 flex">
                      <button 
                        onClick={() => setIsRespringBypassing(true)}
                        className="border border-white text-white font-light text-xs px-6 py-2.5 transition-all select-none bg-transparent hover:bg-white/10 rounded-none active:scale-[0.98] cursor-pointer"
                      >
                        Bypass Respring
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6 animate-fade-in w-full max-w-xl">
                    <div className="space-y-3">
                      <h3 className="text-3xl font-light uppercase tracking-wide text-white">Bypass Verification</h3>
                      <p className="text-sm text-white/90">This system option can only be bypassed by typing the developer keypass.</p>
                    </div>
                    
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (respringKeypassInput === "3667") {
                          setIsRespring(false);
                          setIsRespringBypassing(false);
                          setRespringKeypassInput("");
                          localStorage.removeItem("vplay_respring");
                          addNotification("Dev", "Bypassed respring mode successfully.", "success");
                        } else {
                          addNotification("Dev Error", "Mật mã không đúng!", "warning");
                        }
                      }}
                      className="space-y-4"
                    >
                      <input 
                        type="password"
                        placeholder="Enter developer keypass..."
                        autoFocus
                        required
                        className="w-full px-4 py-3 bg-white text-black border-none outline-none text-xs rounded-none font-mono"
                        value={respringKeypassInput}
                        onChange={(e) => setRespringKeypassInput(e.target.value)}
                      />
                      <div className="flex gap-4">
                        <button
                          type="submit"
                          className="border border-white text-white font-light text-xs px-6 py-2.5 transition-all select-none bg-transparent hover:bg-white/10 rounded-none active:scale-[0.98] cursor-pointer"
                        >
                          Verify & Resume
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsRespringBypassing(false);
                            setRespringKeypassInput("");
                          }}
                          className="border border-white/40 text-white/70 font-light text-xs px-6 py-2.5 transition-all select-none bg-transparent hover:bg-white/10 rounded-none active:scale-[0.98] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Global Erase Modal Overlay */}
        <AnimatePresence>
          {showEraseModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center font-forced-montserrat font-light leading-relaxed select-none overflow-hidden"
            >
              <div className="w-full bg-[#1e0a5c] text-white py-14 px-8 md:px-24 border-t border-b border-white/10 shadow-2xl">
                <div className="w-full max-w-6xl mx-auto flex flex-col gap-8 text-left font-forced-montserrat font-light leading-relaxed">
                  {!isErasing ? (
                    <>
                      <div className="space-y-3 w-full">
                        <h2 className="text-3xl md:text-4xl text-white font-forced-montserrat font-light leading-tight tracking-wide">
                          Ready to respring Vplay Canary?
                        </h2>
                        <p className="text-sm md:text-base text-white/95 font-forced-montserrat font-light leading-relaxed w-full">
                          This will reload the environment and restore the settings and accounts back to their defaults. You can create and download a data backup file (includes all your current options, UI layout and configurations) before proceeding. The respring process will take around 30 seconds to a minute.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-start gap-4">
                        <button
                          onClick={() => setIsErasing(true)}
                          className="border border-white text-white font-forced-montserrat font-light text-sm px-6 py-2.5 transition-all select-none bg-transparent hover:bg-white/10 rounded-none active:scale-[0.98] cursor-pointer"
                        >
                          Respring now
                        </button>
                        <button
                          onClick={() => {
                            const data: Record<string, string> = {};
                            for (let i = 0; i < localStorage.length; i++) {
                              const key = localStorage.key(i);
                              if (key && (key.startsWith('vplay_') || key === 'vpoints' || key.includes('vplay') || key === 'feature_flags')) {
                                data[key] = localStorage.getItem(key) || "";
                              }
                            }
                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `vplay_canary_backup_${new Date().toISOString().split('T')[0]}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="border border-white text-white font-forced-montserrat font-light text-sm px-6 py-2.5 transition-all select-none bg-transparent hover:bg-white/10 rounded-none active:scale-[0.98] cursor-pointer"
                        >
                          Download backup file
                        </button>
                        <button
                          onClick={() => {
                            setShowEraseModal(false);
                          }}
                          className="border border-white text-white font-forced-montserrat font-light text-sm px-6 py-2.5 transition-all select-none bg-transparent hover:bg-white/10 rounded-none active:scale-[0.98] cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3 w-full">
                      <h2 className="text-3xl md:text-4xl text-white font-forced-montserrat font-light leading-tight tracking-wide">
                        Please wait
                      </h2>
                      <p className="text-sm md:text-base text-white/95 font-forced-montserrat font-light leading-relaxed w-full">
                        We are respringing Vplay Canary for you. This might take about 30 seconds to a minute...<br />
                        All of the settings will be reset to their defaults, including all your options, UI layout and account configurations.
                      </p>
                      
                      <div className="flex items-center gap-4 pt-4">
                        <img 
                          src="https://upload.wikimedia.org/wikipedia/commons/3/3f/Windows-loading-cargando.gif" 
                          alt="loading" 
                          className="w-7 h-7 object-contain shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-xl font-forced-montserrat font-light text-white/90">
                          {eraseProgress}% complete
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Tooltip text={hoveredHeadingItem || ""} show={!!hoveredHeadingItem} targetRect={hoveredHeadingRect} isDesktop={true} position="bottom" />
      </div>
    </MotionConfig>
    </div>
  );
}


