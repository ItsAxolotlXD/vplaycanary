import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Compass, 
  Sparkles, 
  RefreshCw, 
  Check, 
  Trash2, 
  AlertCircle, 
  Gift, 
  Tv, 
  Coins, 
  X,
  Volume2,
  VolumeX,
  ChevronRight,
  Plus
} from "lucide-react";

interface Channel {
  category: string;
  name: string;
  logo: string;
  stream: string;
  status?: "working" | "maintenance";
}

interface SpinTheWheelProps {
  isDark: boolean;
  channels: Channel[];
  user: any;
  onLogin: () => void;
  handleChannelSelect: (ch: Channel) => void;
  vpoints: number;
  setVpoints: React.Dispatch<React.SetStateAction<number>>;
  isUnlimitedVpoints: boolean;
  addNotification?: (title: string, message: string, type?: "info" | "success" | "warning" | "error") => void;
  isDev?: boolean;
}

const COLOR_PALETTE = [
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#06b6d4", // cyan
  "#a855f7", // purple
  "#14b8a6", // teal
  "#eab308", // yellow
];

type WheelType = "channels" | "vpoints";

interface VpointReward {
  value: number;
  weight: number; // probability weighting
  color: string;
}

const VPOINT_REWARDS: VpointReward[] = [
  { value: 0, weight: 25, color: "#475569" },   // slate-600
  { value: 5, weight: 30, color: "#3b82f6" },   // blue-500
  { value: 10, weight: 20, color: "#10b981" },  // emerald-500
  { value: 15, weight: 15, color: "#8b5cf6" },  // violet-500
  { value: 20, weight: 6, color: "#d946ef" },   // fuchsia-500
  { value: 25, weight: 2.5, color: "#ec4899" }, // pink-500 (rare)
  { value: 30, weight: 1.5, color: "#f59e0b" }, // amber-500 (hyper rare)
];

export function SpinTheWheelContent({
  isDark,
  channels,
  user,
  onLogin,
  handleChannelSelect,
  vpoints,
  setVpoints,
  isUnlimitedVpoints,
  addNotification,
  isDev
}: SpinTheWheelProps) {
  const [wheelType, setWheelType] = useState<WheelType>("channels");
  const [spinDuration, setSpinDuration] = useState<number>(4); // default 4 seconds
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showCustomizeModal, setShowCustomizeModal] = useState<boolean>(false);
  const [showOutOfPointsModal, setShowOutOfPointsModal] = useState<boolean>(false);
  const [spinResult, setSpinResult] = useState<{ type: WheelType; name: string; value?: number; logo?: string } | null>(null);

  // Sound effects mockup via browser Audio or AudioContext
  const playTickSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // Ignored
    }
  };

  const playSuccessSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      osc1.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3); // C6

      osc1.type = "triangle";
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      
      osc1.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.6);
    } catch (e) {
      // Ignored
    }
  };

  // Customizable channels set
  const [customizedChannelNames, setCustomizedChannelNames] = useState<string[]>(() => {
    const saved = localStorage.getItem("vplay_wheel_channels");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          return parsed;
        }
      } catch (e) {
        // Fallback
      }
    }
    return channels.map(c => c.name);
  });

  // Save selection
  useEffect(() => {
    localStorage.setItem("vplay_wheel_channels", JSON.stringify(customizedChannelNames));
  }, [customizedChannelNames]);

  // Sync back if parent channels list updates
  useEffect(() => {
    if (customizedChannelNames.length === 0 && channels.length > 0) {
      setCustomizedChannelNames(channels.map(c => c.name));
    }
  }, [channels]);

  // Compute active channels config
  const activeChannels = useMemo(() => {
    const list = channels.filter(c => customizedChannelNames.includes(c.name));
    if (list.length < 2) {
      // safe fallback if nothing customized
      return channels.slice(0, 8);
    }
    return list;
  }, [channels, customizedChannelNames]);

  // Calculate coordinates for SVG paths
  const getSlicePath = (index: number, total: number, radius: number = 95, cx: number = 100, cy: number = 100) => {
    const startAngle = (index * 360) / total;
    const endAngle = ((index + 1) * 360) / total;
    
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    
    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  // Get text point coordinates for centering labels
  const getTextCoords = (index: number, total: number, radius: number = 65, cx: number = 100, cy: number = 100) => {
    const startAngle = (index * 360) / total;
    const endAngle = ((index + 1) * 360) / total;
    const midAngle = startAngle + (endAngle - startAngle) / 2;
    const midRad = ((midAngle - 90) * Math.PI) / 180;
    
    const x = cx + radius * Math.cos(midRad);
    const y = cy + radius * Math.sin(midRad);
    
    return { x, y, angle: midAngle };
  };

  // Generate weighted random for Vpoints
  const pickWeightedVpointIndex = () => {
    const totalWeight = VPOINT_REWARDS.reduce((sum, item) => sum + item.weight, 0);
    const randomNum = Math.random() * totalWeight;
    let sum = 0;
    for (let i = 0; i < VPOINT_REWARDS.length; i++) {
      sum += VPOINT_REWARDS[i].weight;
      if (randomNum <= sum) {
        return i;
      }
    }
    return 0; // fallback
  };

  // Sound ticker trigger
  const spinIntervalRef = useRef<any>(null);
  const latestRotRef = useRef<number>(0);

  const triggerSpin = () => {
    if (isSpinning) return;

    // Login check
    if (!user && !isDev) {
      onLogin();
      return;
    }

    // Balance check
    if (!isUnlimitedVpoints && vpoints < 5) {
      setShowOutOfPointsModal(true);
      return;
    }

    // Deduct cost
    if (!isUnlimitedVpoints) {
      setVpoints(prev => Math.max(0, prev - 5));
    }

    setIsSpinning(true);
    setSpinResult(null);

    // Pick index
    let winIndex = 0;
    let winName = "";
    let winVal = 0;
    let winLogo = "";

    if (wheelType === "channels") {
      winIndex = Math.floor(Math.random() * activeChannels.length);
      const ch = activeChannels[winIndex];
      winName = ch.name;
      winLogo = ch.logo;
    } else {
      winIndex = pickWeightedVpointIndex();
      const r = VPOINT_REWARDS[winIndex];
      winVal = r.value;
      winName = `${r.value} VP`;
    }

    // Total elements
    const N = wheelType === "channels" ? activeChannels.length : VPOINT_REWARDS.length;
    // Calculate mid-angle in degrees of winning index
    const midAngle = (winIndex + 0.5) * (360 / N);
    
    // Calculate final rotation to align this center angle (midAngle) to the top anchor (270 degrees)
    const extraSpins = 6 + Math.floor(Math.random() * 4); // 6 to 9 full spins
    const targetAngle = 360 * extraSpins + (270 - midAngle);

    // Animate rotation state
    const startTime = performance.now();
    latestRotRef.current = rotation;
    
    // Play subtle ticks at slowing intervals during spin
    let lastTickAngle = 0;
    const animateRotation = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / spinDuration, 1);
      
      // cubic-bezier easeOut approximation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentAngle = rotation + (targetAngle - rotation) * easeOut;
      setRotation(currentAngle);

      // Play tick sound on passing items
      const itemSpan = 360 / N;
      if (Math.abs(currentAngle - lastTickAngle) > itemSpan) {
        playTickSound();
        lastTickAngle = currentAngle;
      }

      if (progress < 1) {
        spinIntervalRef.current = requestAnimationFrame(animateRotation);
      } else {
        // Completed spinning!
        setIsSpinning(false);
        playSuccessSound();

        // Save result
        setSpinResult({
          type: wheelType,
          name: winName,
          value: winVal,
          logo: winLogo
        });

        // Add rewards or trigger channel play
        if (wheelType === "vpoints") {
          setVpoints(prev => prev + winVal);
          if (addNotification) {
            addNotification(
              `Thắng ${winVal} Vpoints!`,
              winVal > 0 
                ? `Tài khoản đã được cộng thêm ${winVal} VP từ lượt quay may mắn!` 
                : "Rất tiếc, chúc bạn may mắn lần sau!",
              "success"
            );
          }
        } else {
          // Channel selection
          if (addNotification) {
            addNotification(
              "Quay trúng Kênh!",
              `Chuyển đổi sang xem: ${winName}. Thưởng thức thôi!`,
              "info"
            );
          }
          // Redirect to play channel after a short delay so they can appreciate the celebration
          setTimeout(() => {
            const matchedCh = channels.find(c => c.name === winName);
            if (matchedCh) {
              handleChannelSelect(matchedCh);
            }
          }, 3500);
        }
      }
    };

    spinIntervalRef.current = requestAnimationFrame(animateRotation);
  };

  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) {
        cancelAnimationFrame(spinIntervalRef.current);
      }
    };
  }, []);

  return (
    <div id="spin-the-wheel-section" className={`w-full min-h-[calc(100vh-140px)] flex flex-col items-center justify-start p-4 md:p-8 select-none ${isDark ? "bg-[#090a0f] text-white" : "bg-slate-50 text-slate-900"}`}>
      
      {/* Title section */}
      <div className="text-center max-w-2xl mx-auto space-y-2 mt-4 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 font-black text-[10px] tracking-widest uppercase mb-2">
          <Sparkles size={11} className="animate-pulse" />
          <span>V-play Wheel of Fortune</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase leading-none bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Don't know what to watch here?
        </h1>
        <p className="text-xs sm:text-sm font-semibold opacity-60 leading-relaxed max-w-xl mx-auto">
          Just spin the wheel and enjoy wherever it takes you!
        </p>
      </div>

      {/* Main interactive grid */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center justify-center">
        
        {/* Left column: Spin options & stats */}
        <div id="spin-controls-layout" className="md:col-span-4 space-y-6 flex flex-col justify-center">
          
          {/* Wheel Type Tabs */}
          <div className={`p-1.5 rounded-2xl border flex gap-1 ${isDark ? "bg-black/30 border-white/5" : "bg-white border-slate-200"}`}>
            <button
              onClick={() => {
                if (isSpinning) return;
                setWheelType("channels");
                setSpinResult(null);
              }}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wide rounded-xl flex items-center justify-center gap-2 transition-all ${
                wheelType === "channels" 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/15" 
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <Tv size={14} />
              <span>Xem kênh</span>
            </button>
            <button
              onClick={() => {
                if (isSpinning) return;
                setWheelType("vpoints");
                setSpinResult(null);
              }}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wide rounded-xl flex items-center justify-center gap-2 transition-all ${
                wheelType === "vpoints" 
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/15" 
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <Coins size={14} />
              <span>Nhận VP</span>
            </button>
          </div>

          {/* Points display card */}
          <div className={`p-6 rounded-[28px] border relative overflow-hidden flex flex-col items-center text-center ${
            isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-200/80 shadow-md"
          }`}>
            <div className="absolute top-0 right-0 p-3">
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                  isDark ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-slate-100 border-slate-200 hover:bg-slate-200"
                }`}
                title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
              >
                {soundEnabled ? <Volume2 size={13} className="text-blue-400" /> : <VolumeX size={13} className="opacity-50" />}
              </button>
            </div>

            <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Số VPoints bạn đang có</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                {isUnlimitedVpoints ? "∞" : vpoints}
              </span>
              <span className="text-xs font-bold opacity-60">VP</span>
            </div>
            <p className="text-[10px] font-medium opacity-50 mt-1 max-w-[180px]">
              {wheelType === "channels" 
                ? "Mỗi lượt quay tốn 5 vpoints, trúng kênh nào hệ thống tự phát kênh đó!" 
                : "Mỗi lượt quay tốn 5 vpoints, cơ hội nhận thêm đến 30 vpoints tích lũy!"}
            </p>
          </div>

          {/* Spin duration slider */}
          <div className={`p-5 rounded-2xl border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-200 shadow-md"}`}>
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider mb-2">
              <span className="opacity-65">Thời gian quay</span>
              <span className="text-blue-400">{spinDuration} Giây</span>
            </div>
            <input 
              type="range"
              min="2"
              max="10"
              step="1"
              disabled={isSpinning}
              value={spinDuration}
              onChange={(e) => setSpinDuration(Number(e.target.value))}
              className="w-full h-1.5 bg-blue-500/10 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-40"
            />
            <div className="flex justify-between text-[9px] font-medium opacity-40 mt-1.5 px-0.5">
              <span>2s (Nhanh)</span>
              <span>6s</span>
              <span>10s (Hồi hộp)</span>
            </div>
          </div>

          {/* Edit channels list for channels wheel */}
          {wheelType === "channels" && (
            <button
              onClick={() => setShowCustomizeModal(true)}
              disabled={isSpinning}
              className="w-full py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all border border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            >
              <span>Customize my Spin</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20">{activeChannels.length} Kênh</span>
            </button>
          )}

        </div>

        {/* Middle column: Spinner wheel visual canvas */}
        <div className="md:col-span-8 flex flex-col items-center justify-center relative py-6">
          
          {/* Wheel wrapper container */}
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[440px] md:h-[440px] flex items-center justify-center">
            
            {/* Outer golden shining border */}
            <div className="absolute inset-0 rounded-full border-4 border-amber-500/25 shadow-[0_0_50px_rgba(245,158,11,0.15)] animate-pulse" />
            <div className={`absolute inset-4 rounded-full border-2 ${isDark ? "border-white/5 bg-zinc-950" : "border-slate-200 bg-white shadow-inner"}`} />

            {/* Glowing wheel shadows underlay */}
            <div className={`absolute inset-6 rounded-full transition-all duration-1000 ${
              isSpinning 
                ? "blur-[40px] scale-102 bg-radial from-violet-500/10 via-blue-500/15 to-transparent" 
                : "blur-[20px] bg-white/0"
            }`} />

            {/* Interactive rotatable SVG Wheel */}
            <motion.div
              style={{ rotate: rotation }}
              className="absolute inset-6 rounded-full overflow-hidden flex items-center justify-center cursor-pointer select-none"
              onClick={triggerSpin}
            >
              <svg 
                viewBox="0 0 200 200" 
                className="w-full h-full filter drop-shadow-[0_4px_15px_rgba(0,0,0,0.4)]"
              >
                {/* Draw slices */}
                {wheelType === "channels" ? (
                  activeChannels.map((ch, idx) => {
                    const N = activeChannels.length;
                    const pathD = getSlicePath(idx, N);
                    const color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
                    const coords = getTextCoords(idx, N, 68);

                    return (
                      <g key={ch.name}>
                        <path d={pathD} fill={color} stroke={isDark ? "#27272a" : "#ffffff"} strokeWidth="0.8" opacity="0.95" />
                        
                        {/* Rotated, centered text projection */}
                        <g transform={`translate(${coords.x}, ${coords.y}) rotate(${coords.angle + 90})`}>
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#ffffff"
                            fontSize={N > 12 ? "4" : N > 8 ? "4.8" : "6"}
                            fontWeight="900"
                            className="tracking-tight select-none pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                          >
                            {ch.name.substring(0, 10)}
                          </text>
                        </g>
                      </g>
                    );
                  })
                ) : (
                  VPOINT_REWARDS.map((r, idx) => {
                    const N = VPOINT_REWARDS.length;
                    const pathD = getSlicePath(idx, N);
                    const coords = getTextCoords(idx, N, 68);

                    return (
                      <g key={`reward-${idx}`}>
                        <path d={pathD} fill={r.color} stroke={isDark ? "#27272a" : "#ffffff"} strokeWidth="0.8" opacity="0.95" />
                        
                        <g transform={`translate(${coords.x}, ${coords.y}) rotate(${coords.angle + 90})`}>
                          {/* Gift boxes for high/medium rewards, standard coin text for zero/five */}
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#ffffff"
                            fontSize="6"
                            fontWeight="1000"
                            className="tracking-tight select-none pointer-events-none drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)]"
                          >
                            {r.value === 0 ? "LOST 💔" : `+${r.value} VP`}
                          </text>
                        </g>
                      </g>
                    );
                  })
                )}

                {/* Draw extra decorative concentric rings */}
                <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <circle cx="100" cy="100" r="30" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
              </svg>
            </motion.div>

            {/* Rigid golden center cap button (does not rotate) */}
            <div className="absolute w-20 h-20 bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-400 rounded-full flex items-center justify-center shadow-[0_10px_35px_rgba(245,158,11,0.5),inset_0_2px_4px_rgba(255,255,255,0.4)] border border-amber-300 z-10 pointer-events-auto select-none group active:scale-95 transition-transform">
              <button
                disabled={isSpinning}
                onClick={triggerSpin}
                className="w-full h-full flex flex-col items-center justify-center font-black"
                style={{ cursor: isSpinning ? "not-allowed" : "pointer" }}
              >
                <span className="text-[12px] text-zinc-950 uppercase tracking-widest leading-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">
                  {isSpinning ? "WAIT" : "SPIN"}
                </span>
                <span className="text-[8px] text-zinc-950 font-black opacity-80 mt-0.5">5 VP</span>
              </button>
            </div>

            {/* Beautiful pointed arrow anchor at the top position */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-3.5 z-20 flex flex-col items-center select-none pointer-events-none">
              <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[20px] border-l-transparent border-r-transparent border-t-amber-400 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]" />
              <div className="w-3 h-3 rounded-full bg-amber-200 border border-amber-500 -mt-2 shadow" />
            </div>

          </div>

          {/* Celebratory current result screen */}
          <div className="h-16 mt-6">
            <AnimatePresence mode="wait">
              {spinResult && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex flex-col items-center justify-center text-center space-y-1.5"
                >
                  <p className="text-[10px] font-black tracking-widest uppercase text-blue-500 opacity-90">Kết Quả Vòng Quay May Mắn</p>
                  
                  {spinResult.type === "vpoints" ? (
                    <div className="flex items-center gap-2">
                      <div className="p-1 px-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                        <Coins size={13} />
                        <span className="text-sm font-extrabold">{spinResult.name}</span>
                      </div>
                      <span className="text-xs font-semibold opacity-60">đã được tích lũy vào tài khoản của bạn!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-2.5 px-4 rounded-2xl max-w-sm">
                      {spinResult.logo && (
                        <div className="w-7 h-7 bg-black p-1 rounded-lg flex items-center justify-center shrink-0">
                          <img src={spinResult.logo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <div className="text-left overflow-hidden">
                        <p className="text-white text-xs font-bold leading-tight truncate">{spinResult.name}</p>
                        <p className="text-[9px] text-blue-400 font-black leading-none uppercase">Đang phát tự động...</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>

      {/* Out of VPoints Popup modal */}
      <AnimatePresence>
        {showOutOfPointsModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md p-8 rounded-[32px] border text-center relative overflow-hidden ${
                isDark ? "bg-[#14151b] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900 shadow-2xl"
              }`}
            >
              {/* Absolutes and visual effects */}
              <div className="absolute top-0 right-0 p-4">
                <button 
                  onClick={() => setShowOutOfPointsModal(false)}
                  className="w-10 h-10 border border-black/5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full flex items-center justify-center dark:text-zinc-500 dark:hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                  <AlertCircle size={28} />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold tracking-tight text-red-500 leading-none">
                    Ooops, you ran out of Vpoints
                  </h3>
                  <p className="text-[12px] opacity-60 leading-relaxed max-w-xs mx-auto">
                    Earn more Vpoints (at least 5) to continue spinning the wheel
                  </p>
                </div>

                <div className="w-full pt-4 space-y-2">
                  <button 
                    onClick={() => {
                      setShowOutOfPointsModal(false);
                      // Earn points by going to live TV stream
                      // Trigger normal notification explaining how to earn
                      if (addNotification) {
                        addNotification("Kiếm Vpoints", "Hãy xem bất cứ kênh Live TV nào để được tự động nhận +10 VP!", "info");
                      }
                    }}
                    className="w-full py-3 bg-red-500 hover:bg-red-400 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95 text-xs text-center"
                  >
                    Xem Live TV kiếm VP (+10 VP)
                  </button>
                  <button 
                    onClick={() => setShowOutOfPointsModal(false)}
                    className="w-full py-3 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-widest rounded-2xl transition-all active:scale-95 text-xs"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customize Spin Wheel items Selection panel */}
      <AnimatePresence>
        {showCustomizeModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-lg rounded-[32px] border flex flex-col relative overflow-hidden h-[540px] ${
                isDark ? "bg-[#14151b] border-white/5 text-white" : "bg-white border-slate-200 text-slate-900 shadow-2xl"
              }`}
            >
              {/* Header */}
              <div className="p-6 pb-4 border-b border-black/5 flex items-center justify-between shrink-0">
                <div className="text-left">
                  <h3 className="text-lg font-black uppercase tracking-wider">Customize my Spin</h3>
                  <p className="text-[10px] sm:text-[11px] opacity-55">Hãy chọn ít nhất 2 kênh để vòng quay có thể khởi động.</p>
                </div>
                <button 
                  onClick={() => setShowCustomizeModal(false)}
                  className="w-10 h-10 border border-black/5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full flex items-center justify-center"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Channels check/uncheck body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {/* Select All / Deselect buttons */}
                <div className="flex items-center gap-2 justify-end shrink-0">
                  <button 
                    onClick={() => setCustomizedChannelNames(channels.map(c => c.name))}
                    className="text-[9px] font-black uppercase tracking-wide border px-2.5 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100"
                  >
                    Chọn toàn bộ
                  </button>
                  <button 
                    onClick={() => setCustomizedChannelNames([channels[0]?.name, channels[1]?.name].filter(Boolean))}
                    className="text-[9px] font-black uppercase tracking-wide border px-2.5 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100"
                  >
                    Bỏ chọn ngoại trừ 2 kênh
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {channels.map((ch) => {
                    const isChecked = customizedChannelNames.includes(ch.name);
                    return (
                      <div
                        key={ch.name}
                        onClick={() => {
                          if (isChecked) {
                            if (customizedChannelNames.length > 2) {
                              setCustomizedChannelNames(prev => prev.filter(name => name !== ch.name));
                            } else {
                              if (addNotification) {
                                addNotification("Mục tiêu tối thiểu", "Vòng quay yêu cầu lựa chọn ít nhất 2 kênh hoạt động!", "warning");
                              }
                            }
                          } else {
                            setCustomizedChannelNames(prev => [...prev, ch.name]);
                          }
                        }}
                        className={`flex items-center gap-3 p-3 border rounded-2xl cursor-pointer transition-all hover:bg-blue-500/5 group ${
                          isChecked 
                            ? "border-blue-500/40 bg-blue-500/5" 
                            : isDark ? "border-white/5 bg-white/5" : "border-slate-200 bg-slate-50/50"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                          isChecked ? "bg-blue-500 border-blue-500 text-white" : "border-slate-400 opacity-60"
                        }`}>
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </div>
                        
                        <div className="w-6 h-6 bg-black rounded p-1 flex items-center justify-center shrink-0">
                          <img src={ch.logo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>

                        <div className="overflow-hidden text-left">
                          <p className="text-[11px] font-bold truncate">{ch.name}</p>
                          <p className="text-[8px] opacity-50 truncate">{ch.category}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-black/5 bg-black/5 flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setShowCustomizeModal(false)}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-95 text-xs text-center"
                >
                  Xác nhận chỉnh sửa ({customizedChannelNames.length} Kênh)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
