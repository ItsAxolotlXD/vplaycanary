/**
 * EPG Service for Vplay 3
 * Provides mock program schedules for TV channels.
 */

export interface Program {
  title: string;
  start: string; // ISO string
  end: string;   // ISO string
  description: string;
}

const GENERIC_PROGRAMS = [
  { title: "Thời sự VPlay", description: "Tin tức cập nhật trong và ngoài nước." },
  { title: "Phim truyện đặc sắc", description: "Bộ phim tâm lý tình cảm hấp dẫn." },
  { title: "Ký sự truyền hình", description: "Khám phá những vùng đất mới lạ." },
  { title: "Thế giới động vật", description: "Vẻ đẹp của thiên nhiên hoang dã." },
  { title: "Ca nhạc quốc tế", description: "Những bản hit mới nhất từ khắp nơi trên thế giới." },
  { title: "Thể thao 24h", description: "Tổng hợp các tin tức thể thao nổi bật." },
  { title: "Talkshow: Góc nhìn", description: "Cuộc trò chuyện với những vị khách mời đặc biệt." },
  { title: "Hài kịch cuối tuần", description: "Những tiểu phẩm hài mang lại tiếng cười sảng khoái." },
  { title: "Gameshow: Siêu trí tuệ", description: "Thử thách trí thông minh và nhạy bén." },
  { title: "Hoạt hình: Thế giới tuổi thơ", description: "Những thước phim màu sắc dành cho các bé." }
];

export function generateSchedules(channelName: string): Program[] {
  const programs: Program[] = [];
  const now = new Date();
  
  // Start from midnight of today
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  // Use channel name to seed random choices so it's consistent for a few hours
  const seed = channelName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  let currentStart = new Date(startOfDay);

  for (let i = 0; i < 12; i++) {
    const durationHours = 2; // Each program lasts 2 hours for simplicity
    const currentEnd = new Date(currentStart.getTime() + durationHours * 60 * 60 * 1000);
    
    // Pseudo-random selection based on index and seed
    const programIndex = (seed + i) % GENERIC_PROGRAMS.length;
    const template = GENERIC_PROGRAMS[programIndex];

    programs.push({
      ...template,
      start: currentStart.toISOString(),
      end: currentEnd.toISOString()
    });

    currentStart = new Date(currentEnd);
  }

  return programs;
}

export function getCurrentProgram(programs: Program[]): Program | null {
  const now = new Date();
  return programs.find(p => {
    const start = new Date(p.start);
    const end = new Date(p.end);
    return now >= start && now < end;
  }) || null;
}
