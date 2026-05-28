import React from "react";
import { motion } from "motion/react";
import { Tv, Flame, Calendar, BellRing } from "lucide-react";

interface VTV6CountdownBannerProps {
  currentTime: Date;
}

export function VTV6CountdownBanner({ currentTime }: VTV6CountdownBannerProps) {
  // Target time: 00h00, 08/06/2026 in Vietnam Time (GMT+7)
  const targetDate = new Date("2026-06-08T00:00:00+07:00");
  const diff = targetDate.getTime() - currentTime.getTime();

  let days = 0;
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let hasPassed = true;

  if (diff > 0) {
    hasPassed = false;
    days = Math.floor(diff / (1000 * 60 * 60 * 24));
    hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    seconds = Math.floor((diff % (1000 * 60)) / 1000);
  }

  const formatNum = (num: number) => num.toString().padStart(2, "0");

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mb-8 relative overflow-hidden rounded-[24px] bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 p-6 border border-red-500/30 group shadow-lg shadow-red-600/15 text-white"
    >
      {/* Background glass effect & graphic */}
      <div className="absolute inset-0 bg-radial-gradient from-white/10 to-transparent pointer-events-none" />
      <div className="absolute -right-24 -bottom-24 w-64 h-64 bg-white/5 blur-3xl rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
      <div className="absolute -left-10 -top-10 w-40 h-40 bg-red-500/20 blur-2xl rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
        
        {/* Left Side: Information */}
        <div className="flex items-center gap-4 text-center lg:text-left flex-col lg:flex-row">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white shadow-md shadow-black/10 relative overflow-hidden shrink-0">
            <Tv size={26} className="text-white drop-shadow-md animate-pulse" />
            <span className="text-[9px] font-black tracking-widest text-[#00ffff] mt-0.5">VTV6</span>
          </div>
          <div>
            <div className="flex items-center justify-center lg:justify-start gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider text-red-100 bg-red-800/40 border border-red-400/30 flex items-center gap-1">
                <Flame size={8} className="animate-bounce" /> Hot Event
              </span>
              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider text-cyan-200 bg-cyan-900/40 border border-cyan-400/30 flex items-center gap-1">
                <Calendar size={8} /> 08/06/2026
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white mt-1 tracking-tight drop-shadow-sm uppercase">
              VTV6 - Kênh Truyền hình Thể thao Trở Lại
            </h3>
            <p className="text-red-100 text-xs mt-0.5 max-w-xl font-medium opacity-90">
              Chào đón sự trở lại huyền thoại của VTV6! Kênh truyền hình Thể thao &amp; Giải trí dành cho giới trẻ chuẩn bị lên sóng chính thức.
            </p>
          </div>
        </div>

        {/* Right Side: Ticking Countdown */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0 bg-black/15 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:px-6">
          {hasPassed ? (
            <div className="text-center py-1 px-4">
              <span className="text-sm font-black uppercase tracking-widest text-[#00ffff] animate-pulse flex items-center gap-2">
                <BellRing size={16} /> VTV6 ĐÃ TRỞ LẠI PHÁT SÓNG CHÍNH THỨC!
              </span>
            </div>
          ) : (
            <>
              {/* Days */}
              <div className="flex flex-col items-center">
                <div className="flex gap-0.5">
                  <span className="font-mono text-2xl md:text-3xl font-black text-white tracking-widest bg-black/30 px-2 py-1 rounded">
                    {formatNum(days)[0]}
                  </span>
                  <span className="font-mono text-2xl md:text-3xl font-black text-white tracking-widest bg-black/30 px-2 py-1 rounded">
                    {formatNum(days)[1]}
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-rose-200 mt-1">Ngày</span>
              </div>
              
              <span className="text-xl md:text-2xl font-black text-white/50 mb-4 animate-ping">:</span>

              {/* Hours */}
              <div className="flex flex-col items-center">
                <div className="flex gap-0.5">
                  <span className="font-mono text-2xl md:text-3xl font-black text-white tracking-widest bg-black/30 px-2 py-1 rounded">
                    {formatNum(hours)[0]}
                  </span>
                  <span className="font-mono text-2xl md:text-3xl font-black text-white tracking-widest bg-black/30 px-2 py-1 rounded">
                    {formatNum(hours)[1]}
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-rose-200 mt-1">Giờ</span>
              </div>

              <span className="text-xl md:text-2xl font-black text-white/50 mb-4 animate-ping">:</span>

              {/* Mins */}
              <div className="flex flex-col items-center">
                <div className="flex gap-0.5">
                  <span className="font-mono text-2xl md:text-3xl font-black text-white tracking-widest bg-black/30 px-2 py-1 rounded">
                    {formatNum(minutes)[0]}
                  </span>
                  <span className="font-mono text-2xl md:text-3xl font-black text-white tracking-widest bg-black/30 px-2 py-1 rounded">
                    {formatNum(minutes)[1]}
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-rose-200 mt-1">Phút</span>
              </div>

              <span className="text-xl md:text-2xl font-black text-white/50 mb-4 animate-ping">:</span>

              {/* Secs */}
              <div className="flex flex-col items-center">
                <div className="flex gap-0.5">
                  <span className="font-mono text-2xl md:text-3xl font-black text-white tracking-widest bg-[#00ffff] text-slate-900 px-2 py-1 rounded shadow-[0_0_10px_rgba(0,255,255,0.4)]">
                    {formatNum(seconds)[0]}
                  </span>
                  <span className="font-mono text-2xl md:text-3xl font-black text-white tracking-widest bg-[#00ffff] text-slate-900 px-2 py-1 rounded shadow-[0_0_10px_rgba(0,255,255,0.4)]">
                    {formatNum(seconds)[1]}
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-[#00ffff] mt-1">Giây</span>
              </div>
            </>
          )}
        </div>

      </div>
    </motion.div>
  );
}
