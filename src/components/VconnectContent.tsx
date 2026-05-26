import React, { useState, useEffect, useRef, useMemo, ChangeEvent, FormEvent } from "react";
import { 
  Film, Heart, MessageSquare, Share2, Star, ShieldAlert, Flag, Upload, Play, Pause, Trash2, 
  Send, Plus, Users, UserPlus, Search, X, Volume2, Mic, ArrowRight, ArrowLeft, Bookmark, 
  RefreshCw, Sparkles, Smile, MessageCircle, MoreHorizontal, Radio, ShieldCheck, HeartOff,
  ChevronLeft, ChevronRight, User, MapPin, Calendar, Camera, Check, ShoppingBag, Tag
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, 
  serverTimestamp, onSnapshot, query, where, orderBy, limit 
} from "firebase/firestore";
import { db, auth } from "../firebase";

interface VconnectContentProps {
  isDark: boolean;
  user: any;
  liquidGlass: "glassy" | "tinted";
  onLogin: () => void;
  featureFlags?: any;
  lite?: boolean;
  addNotification?: (title: string, msg: string, type?: "info" | "success" | "warning" | "error") => void;
  vpoints?: number;
  setVpoints?: React.Dispatch<React.SetStateAction<number>>;
}

// Interfaces for Vconnect
interface Story {
  id: string;
  userEmail: string;
  userName: string;
  userPhoto?: string;
  mediaUrl?: string; // Image URL or blank for text
  mediaType: "image" | "text" | "voice";
  textContent?: string;
  voiceUrl?: string;
  createdAt: string;
}

interface Comment {
  id: string;
  userEmail: string;
  userName: string;
  userPhoto?: string;
  content: string;
  voiceUrl?: string;
  createdAt: string;
}

interface Post {
  id: string;
  type: "post" | "blog" | "poll";
  title?: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "voice" | "";
  voiceUrl?: string;
  createdAt: any;
  userEmail: string;
  userName: string;
  userPhoto?: string;
  likes: number;
  likesVoted?: boolean;
  favoritesVoted?: boolean;
  category?: string;
  coverUrl?: string;
  pollOptions?: string[];
  pollVotes?: number[];
  votedOption?: number | null;
  comments?: Comment[];
}

interface ChatMessage {
  id: string;
  senderEmail: string;
  senderName: string;
  text: string;
  voiceUrl?: string;
  createdAt: string;
}

interface ChatRoom {
  id: string;
  name: string;
  isGroup: boolean;
  participants: string[]; // Emails
  messages: ChatMessage[];
  avatar?: string;
}

interface Person {
  email: string;
  name: string;
  avatar: string;
  status: "online" | "offline";
  bio: string;
}

interface Vshort {
  id: string;
  userEmail: string;
  userName: string;
  userPhoto?: string;
  videoUrl: string;
  title: string;
  likes: number;
  likesVoted?: boolean;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
}

const USER_POOL = [
  { name: "Vplay News", email: "news@vplay.vn", photo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80", isVerified: true, bio: "Trang tin tức nhanh nhạy, cập nhật thời sự công nghệ, game Việt Nam" },
  { name: "Vplay Updates", email: "updates@vplay.vn", photo: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=150&q=80", isVerified: true, bio: "Bản vá, tính năng vPlayOS & tiện ích Board vPlay" },
  { name: "Vplay Features", email: "features@vplay.vn", photo: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=150&q=80", isVerified: true, bio: "Bí quyết tối ưu, tính năng ẩn hữu dụng trên hệ sinh thái vPlay" },
  { name: "Phú Sát Gamer", email: "phu_sat_gamer@vplay.local", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80", isVerified: true, bio: "Game thủ chuyên nghiệp, bình luận chiến thuật Esport đỉnh cao" },
  { name: "DJ Minari", email: "music_queen@vplay.local", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", isVerified: true, bio: "Nữ DJ chơi nhạc Techno, House cực chất tại vPlay Club" },
  { name: "Bảo Ngọc Streamer", email: "bao_ngoc@vplay.vn", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80", isVerified: true, bio: "Nữ streamer Liên Minh dí hỏm đáng yêu" },
  { name: "Quốc Anh FIFA", email: "quoc_anh_fifa@gmail.com", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", isVerified: false, bio: "Nhà vô địch giải bóng đá FIFA vPlay Tournament" },
  { name: "Minh Trang Chill", email: "minh_trang@outlook.com", photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80", isVerified: false, bio: "Thích nghe nhạc lofi & lướt vStore tìm widget đẹp" },
  { name: "Dũng PC Tech", email: "dung_pc@vplay.vn", photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80", isVerified: true, bio: "Reviewer phần cứng PC, vPlay Board xịn mịn" },
  { name: "VTV6 Official", email: "vtv6_official@vtv.vn", photo: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=150&q=80", isVerified: true, bio: "Kênh truyền hình Thể Thao - Giải Trí chất lượng cao VTV6" },
  { name: "Garena Việt Nam", email: "garena@vplay.vn", photo: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&q=80", isVerified: true, bio: "Trang tin tức Esport quốc gia Garena" },
  { name: "Thế Hùng Gamer", email: "hung_gamer@vplay.vn", photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80", isVerified: true, bio: "Streamer kì cựu - Thân thiện, hài hước, livestream mỗi tối" },
  { name: "Anh Tú Melodic", email: "anhtu_music@vplay.vn", photo: "https://images.unsplash.com/photo-1489980508314-941910ded1f4?auto=format&fit=crop&w=150&q=80", isVerified: true, bio: "Sáng tác nhạc trẻ - Đam mê âm nhạc và chia sẻ tại vPlay" },
  { name: "Khánh Linh Rap", email: "linh_rap@gmail.com", photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80", isVerified: true, bio: "Nhịp điệu sôi động - Đam mê Rap và Hip Hop nghệ thuật" },
  { name: "Hải Nam Acoustic", email: "nam_guitar@yahoo.com", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80", isVerified: false, bio: "Gợi ý những bản nhạc Acoustic mộc mạc thư giãn mỗi chiều" },
  { name: "Thanh Vân Vlogger", email: "van_vlog@vplay.vn", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80", isVerified: true, bio: "Vlogger ẩm thực và phong cách sống, luôn năng động và lạc quan" },
  { name: "Minh Quân MC", email: "quan_mc@vplay.vn", photo: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=150&q=80", isVerified: true, bio: "Người dẫn chương trình, yêu thích trò chuyện kết nối mọi người" },
  { name: "Thu Thảo Singer", email: "thao_singer@singer.vn", photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80", isVerified: true, bio: "Ca sĩ tự do, yêu thích Pop, Indie và Ballad ngọt ngào" },
  { name: "Quang Huy Rapper", email: "quang_huy@vplay.vn", photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80", isVerified: true, bio: "Rapper học đường, yêu thích giao lưu và viết lời rap đầy ý nghĩa" },
  { name: "Kiên Trần Composer", email: "kien_music@gmail.com", photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80", isVerified: false, bio: "Nhà sản xuất âm nhạc trẻ, phối khí và chia sẻ sản phẩm đỉnh cao" },
  { name: "Nam Sơn Artist", email: "nam_son@outlook.com", photo: "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=150&q=80", isVerified: true, bio: "Giai điệu mộc mạc quê hương, chia sẻ khoảnh khắc an yên" },
  { name: "Viết Hoàng Beatmaker", email: "hoang_beat@gmail.com", photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80", isVerified: true, bio: "Chuyên gia âm thanh và làm beat lofi cổ điển cực chill" }
];

const STORY_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?auto=format&fit=crop&w=400&q=80"
];

const STORY_TEXT_POOL = [
  "🔥 Cuối tuần chiến game thôi anh em ơi! #vplay #gamers",
  "📺 Ai đang xem trực tiếp trận đấu trên VTV6 không nhỉ? Gáy lên nào!",
  "🎧 Đang thiết lập playlist Music Pro cực cháy cho đêm nay.",
  "✨ Bản cập nhật Canary SMR26 đỉnh chóp thực sự á, mượt phết!",
  "🚀 Đang code dở cái widget xịn sò này cho bàn làm việc vPlay...",
  "🌟 Chúc mọi người ngày mới tràn đầy năng lượng nha! ❤️ #chill",
  "☕ Làm ly cafe sáng rồi leo rank Liên Minh thôi anh em.",
  "🎵 Nhạc hay thì phải nghe bằng loa xịn, đúng không cả nhà? #musicpro",
  "🎮 Tối nay có ai rảnh giao hữu vài trận FIFA không nào? #fifa",
  "🎁 Cảm ơn VStore đã tặng bonus 50 Vpoints nhé!"
];

const POST_CONTENT_POOL = [
  { title: "Khai hỏa Chiến Dịch Mùa Hè cực cháy trên vPlay OS!", content: "Hồng quân vPlay chính thức phát động chuỗi nhiệm vụ nhận điểm và quà tặng kép. Admin đã chuẩn bị giải thưởng cực khủng lên tới 10.000 Vpoints cho các bạn hoàn thành hết các thử thách hàng tuần! Tham gia ngay thôi nào anh em ơi! 🔥🎁 #vplay #vconnect" },
  { title: "Trực tiếp EURO kịch tính chuẩn bị phát sóng từ tối nay!", content: "Kênh livestream Phát sóng VTV6 của chúng tôi đã tối ưu hóa băng thông HLS proxy mượt mà không độ trễ. Chuẩn bị đồ uống, rủ bạn bè lập Room Party để cổ vũ những pha bóng đỉnh cao đêm nay nhé cả nhà! 📺⚽ #vplay #xemtivi" },
  { title: "Anh em nghĩ sao về việc tích hợp AI Gemini trực tiếp?", content: "Hệ điều hành vPlay OS thế hệ mới đang nghiên cứu cho phép người dùng ra lệnh bằng giọng nói hỗ trợ bởi mô hình Gemini 3.5 siêu tốc. Bình luận ý tưởng của bạn hoặc drop tim nếu ủng hộ tính năng này để ad triển khai luôn nào! 🤖💬 #geminiai #vconnect" },
  { title: "Gợi ý list nhạc Lofi chill ngày mưa rả rích", content: "Mở widget Music Pro, bật bài 'Pigstep' hoặc chọn kênh âm nhạc Vstore của Quốc Anh để cảm nhận giai điệu êm dịu, sảng khoái tối đa. Có ai có bài hát ruột nào hay ho không, chia sẻ nhé! 🎧🌧️ #musicpro #chill" },
  { title: "Góc khoe góc máy: Trải nghiệm tay cầm Bluetooth siêu mượt!", content: "Setup cực nhanh với vPlay Board, chiến Liên quân hay đá FIFA mượt vô đối. Trình thiết lập Driver Bluetooth tự động nhận diện tất cả model tay cầm phổ biến hiện nay. Comment ảnh góc máy của bạn bên dưới nha! 🎮⚡ #lienminh #fifa" },
  { title: "Bí kíp leo rank Kim Cương thần tốc cực đơn giản", content: "Hãy rủ tối thiểu 2 người trong danh sách bạn bè Vconnect, mở cuộc gọi micro voice chat trực tiếp để bàn chiến thuật thời gian thực. Đảm bảo tỷ lệ thắng tăng lên ít nhất 30%! Chúc anh em tối nay leo rank thành công nhé! 🎙️🔥 #lienminh" },
  { title: "Cảm nhận cá nhân sau 1 tuần đồng hành cùng vPlay", content: "Hệ sinh thái chạy ngày một mượt mà, nhiều tính năng giải trí chất chơi người dơi. Thiết kế widget card sắc nét mang cảm giác cao cấp rõ rệt. Cảm ơn đội ngũ phát triển đã lắng nghe và liên tục nâng cấp nhé! ⭐👍 #vconnect" }
];

const DEFAULT_VSTORE_PRODUCTS = [
  {
    id: "vsp_1",
    title: "Bàn phím cơ Vplay Pro Blue Switch",
    category: "Gaming Gear",
    price: 350,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=300&q=80",
    desc: "Bàn phím cơ fullsize phím bấm cực nảy dòn tan tiếng gỗ, LED RGB 16.8 triệu màu siêu chất.",
    seller: "vPlay Store Chính Hãng",
    sellerPhoto: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
    likes: 124,
    comments: 18,
    rating: 4.8
  },
  {
    id: "vsp_2",
    title: "Tai nghe Không dây Cyberpunk 2077 Edition",
    category: "Phụ kiện",
    price: 280,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80",
    desc: "Độ trễ cực thấp 15ms chơi Liên Minh siêu tốc cực chuẩn, âm bass giả lập vòm 7.1 sống động.",
    seller: "Quốc Anh Tech",
    sellerPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    likes: 92,
    comments: 11,
    rating: 4.9
  },
  {
    id: "vsp_3",
    title: "Áo Hoodie vPlay Over-Sized Black-Pink",
    category: "Thời trang",
    price: 180,
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&q=80",
    desc: "Áo nỉ cotton 100% cực dày giữ ấm tốt ngày se lạnh, in logo vPlay OS hologram đổi màu.",
    seller: "Bảo Ngọc Streamer",
    sellerPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    likes: 215,
    comments: 42,
    rating: 5.0
  },
  {
    id: "vsp_4",
    title: "Củ sạc GaN 100W Mini Toản C3 Edition",
    category: "Phụ kiện",
    price: 140,
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=300&q=80",
    desc: "Cốt lõi chip sạc thế hệ mới siêu nhỏ, 3 cổng sạc nhanh Type C, sạc đầy Macbook Pro chỉ 1.5h.",
    seller: "Dũng PC Tech",
    sellerPhoto: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80",
    likes: 67,
    comments: 7,
    rating: 4.7
  },
  {
    id: "vsp_5",
    title: "Tấm Di Chuột Horizon V2 Cực Lớn 90x40cm",
    category: "Phụ kiện",
    price: 90,
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=300&q=80",
    desc: "Bề mặt vải dệt micro-woven cao cấp tối ưu hóa tốc độ di chuột, đế cao su thiên nhiên chống trượt bảo vệ cổ tay.",
    seller: "vPlay Store Chính Hãng",
    sellerPhoto: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=150&q=80",
    likes: 80,
    comments: 14,
    rating: 4.6
  },
  {
    id: "vsp_6",
    title: "Tài khoản Pro VIP vPlay Board 1 Năm",
    category: "Dịch vụ",
    price: 450,
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80",
    desc: "Mở khóa toàn bộ 25+ Widgets Premium, trải nghiệm AI ra lệnh không giới hạn trong 12 tháng liên tục.",
    seller: "vPlay Updates",
    sellerPhoto: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=150&q=80",
    likes: 310,
    comments: 55,
    rating: 4.9
  }
];

export function VconnectContent({ 
  isDark, 
  user, 
  liquidGlass, 
  onLogin, 
  featureFlags, 
  lite = false, 
  addNotification,
  vpoints = 100,
  setVpoints
}: VconnectContentProps) {
  // Feed item states
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "media" | "post_blog" | "poll" | "favorites">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Vconnect Store States
  const [vstoreProducts, setVstoreProducts] = useState(() => {
    const saved = localStorage.getItem("vplay_vconnect_vstore_p");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return DEFAULT_VSTORE_PRODUCTS;
  });

  const [vstoreCategoryFilter, setVstoreCategoryFilter] = useState("Tất cả");
  const [vstoreSearchQuery, setVstoreSearchQuery] = useState("");
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdTitle, setNewProdTitle] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("Gaming Gear");
  const [newProdPrice, setNewProdPrice] = useState(100);
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdImage, setNewProdImage] = useState("");
  const [buyingProduct, setBuyingProduct] = useState<any>(null);

  useEffect(() => {
    localStorage.setItem("vplay_vconnect_vstore_p", JSON.stringify(vstoreProducts));
  }, [vstoreProducts]);

  // Stories states
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [activeStoryProgress, setActiveStoryProgress] = useState(0);
  const [showAddStoryModal, setShowAddStoryModal] = useState(false);
  const [newStoryType, setNewStoryType] = useState<"text" | "image" | "voice">("text");
  const [newStoryText, setNewStoryText] = useState("");
  const [newStoryFileUrl, setNewStoryFileUrl] = useState("");

  // Creation states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<"post" | "blog" | "poll">("post");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [blogCategory, setBlogCategory] = useState("Technology");
  const [blogCoverUrl, setBlogCoverUrl] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  
  // Media attachments & Voice state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | "voice" | "">("");
  
  // Voice Recording API Setup
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voiceUrl, setVoiceUrl] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordIntervalRef = useRef<any>(null);

  // Comments Sheet setup
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [isRecordingComment, setIsRecordingComment] = useState(false);
  const [commentVoiceUrl, setCommentVoiceUrl] = useState("");

  // Social Connections & Search States
  const [people, setPeople] = useState<Person[]>([]);
  const [friends, setFriends] = useState<string[]>([]); // Array of emails
  const [peopleSearch, setPeopleSearch] = useState("");
  const [showFriendDrawer, setShowFriendDrawer] = useState(true);

  // Direct Messages & Rooms
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [chatInputText, setChatInputText] = useState("");
  const [isRecordingChat, setIsRecordingChat] = useState(false);
  const [chatVoiceUrl, setChatVoiceUrl] = useState("");

  // Report Modal state
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("Spam hoặc quấy rối");

  // Blog Reader
  const [readingBlog, setReadingBlog] = useState<Post | null>(null);

  // Navigation sub-tab inside Vconnect
  const [vconnectSubTab, setVconnectSubTab] = useState<"feed" | "vshorts" | "vstore" | "profile">("feed");

  // Custom User Profile States (persisted Offline / Online)
  const [profileName, setProfileName] = useState(() => localStorage.getItem("vplay_vconnect_p_name") || user?.displayName || user?.email?.split("@")[0] || "Khách Danh Tính");
  const [profileId, setProfileId] = useState(() => localStorage.getItem("vplay_vconnect_p_id") || "guest_" + (user?.uid?.slice(0, 5) || "visitor"));
  const [profileBio, setProfileBio] = useState(() => localStorage.getItem("vplay_vconnect_p_bio") || "Thành viên yêu đời của mạng xã hội vPlay Vconnect.");
  const [profileBirth, setProfileBirth] = useState(() => localStorage.getItem("vplay_vconnect_p_birth") || "2000-01-01");
  const [profileHometown, setProfileHometown] = useState(() => localStorage.getItem("vplay_vconnect_p_hometown") || "Hà Nội, Việt Nam");
  const [profileAvatar, setProfileAvatar] = useState(() => localStorage.getItem("vplay_vconnect_p_avatar") || user?.photoURL || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80");
  const [profileCover, setProfileCover] = useState(() => localStorage.getItem("vplay_vconnect_p_cover") || "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&h=300&w=600&q=80");

  // Vshorts States
  const [vshorts, setVshorts] = useState<Vshort[]>([]);
  const [activeVshortIndex, setActiveVshortIndex] = useState(0);
  const [isVshortPlaying, setIsVshortPlaying] = useState(true);
  const [showVshortUploadModal, setShowVshortUploadModal] = useState(false);
  const [uploadVshortTitle, setUploadVshortTitle] = useState("");
  const [uploadVshortUrl, setUploadVshortUrl] = useState("");

  // Synchronize user displayName and avatar in state if present and not overridden
  useEffect(() => {
    if (user) {
      if (!localStorage.getItem("vplay_vconnect_p_name")) {
        setProfileName(user.displayName || user.email?.split("@")[0] || "Khách Danh Tính");
      }
      if (!localStorage.getItem("vplay_vconnect_p_avatar")) {
        setProfileAvatar(user.photoURL || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80");
      }
    }
  }, [user]);

  // Fetch current user display info
  const currentUserEmail = user?.email || "guest@vplay.local";
  const currentUserName = profileName;
  const currentUserPhoto = profileAvatar;
  const currentUserId = profileId;

  // Verification Helper
  const isUserVerified = (email: string) => {
    if (!email) return false;
    const lower = email.toLowerCase();
    return (
      lower.includes("news@") ||
      lower.includes("updates@") ||
      lower.includes("features@") ||
      lower.endsWith("@vplay.vn") ||
      [
        "news@vplay.local",
        "updates@vplay.local",
        "features@vplay.local",
        "developer@vplay.local",
        "music_queen@vplay.local"
      ].includes(lower)
    );
  };

  // Dummy list of seed people for discovery
  const defaultPeople: Person[] = [
    { email: "news@vplay.vn", name: "Vplay News", avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80", status: "online", bio: "Ban biên tập tin tức vPlay nóng hổi, cập nhật liên tục 24/7." },
    { email: "updates@vplay.vn", name: "Vplay Updates", avatar: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=150&q=80", status: "online", bio: "Các bản vá phần mềm, tính năng vPlayOS & tiện ích Board." },
    { email: "features@vplay.vn", name: "Vplay Features", avatar: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=150&q=80", status: "online", bio: "Khám phá thủ thuật, mẹo hay và tính năng ẩn." },
    { email: "developer@vplay.local", name: "Vplay OS Developer", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80", status: "online", bio: "Hệ điều hành vPlay OS và các tiện ích Board." },
    { email: "music_queen@vplay.local", name: "DJ Minari", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", status: "online", bio: "Đam mê âm nhạc, DJ, lướt vStore tìm nhạc hay." }
  ];

  // Dummy mock chats
  const defaultRooms: ChatRoom[] = [
    {
      id: "room-party-1",
      name: "🎮 Party Liên Quân vPlay",
      isGroup: true,
      participants: ["gamer_pro@vplay.local", "developer@vplay.local", "guest@vplay.local"],
      avatar: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&q=80",
      messages: [
        { id: "m1", senderEmail: "gamer_pro@vplay.local", senderName: "Phú Sát Gamer", text: "Alo anh em tối nay làm vài trận leo cao thủ không nhỉ?", createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: "m2", senderEmail: "developer@vplay.local", senderName: "Vplay OS Developer", text: "Đang fix nốt cái Vconnect bạn ơi, tí nữa vào chiến sau nha!", createdAt: new Date(Date.now() - 1800000).toISOString() }
      ]
    },
    {
      id: "room-dm-1",
      name: "DJ Minari",
      isGroup: false,
      participants: ["music_queen@vplay.local", "guest@vplay.local"],
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      messages: [
        { id: "m3", senderEmail: "music_queen@vplay.local", senderName: "DJ Minari", text: "Trình phát nhạc Music Pro trên Vstore đỉnh quá, vừa mua xong nè!", createdAt: new Date(Date.now() - 7200000).toISOString() }
      ]
    }
  ];

  // Feed items static defaults
  const defaultPosts: Post[] = [
    {
      id: "post-1",
      type: "post",
      content: "Chào mừng các bạn đến với bản cập nhật Vconnect mạng xã hội đỉnh cao! Nay mình vừa tích hợp thêm ghi âm giọng nói trực tiếp cực xịn. Anh em nghe thử bản tin thoại ngắn này nhé! 🎤☄️",
      voiceUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      mediaType: "voice",
      createdAt: new Date().toISOString(),
      userEmail: "developer@vplay.local",
      userName: "Vplay OS Developer",
      userPhoto: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80",
      likes: 42,
      likesVoted: false,
      favoritesVoted: false,
      comments: [
        { id: "c1", userEmail: "music_queen@vplay.local", userName: "DJ Minari", content: "Chất giọng phát thanh ấm quá ad ơi, tuyển làm MC liền luôn!", createdAt: new Date().toISOString() }
      ]
    },
    {
      id: "post-2",
      type: "blog",
      title: "Hành trình xây dựng hệ sinh thái VTV & vPlay",
      content: "Trong một thế kỷ mạng xã hội bùng nổ, việc phát triển một hệ điều hành thu nhỏ dành cho tivi và máy tính (VplayOS) là một thách thức kỹ thuật lớn. Chúng tôi tập trung tối ưu hóa tài nguyên phần cứng, tận dụng tối đa kiến trúc phi tập trung, lưu trữ bảo mật qua Sandbox Cloud và Firebase. Vconnect sẽ là trung tâm kết nối các developer và người dùng cuối, là trái tim năng động của vPlay...\n\nĐọc tiếp để ủng hộ đội ngũ phát triển nhé!",
      category: "Công Nghệ",
      coverUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      userEmail: "developer@vplay.local",
      userName: "Vplay OS Developer",
      userPhoto: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80",
      likes: 68,
      likesVoted: false,
      favoritesVoted: false,
      comments: []
    },
    {
      id: "post-3",
      type: "poll",
      title: "Bạn đánh giá bản cập nhật Social Vconnect này ở thang điểm mấy?",
      pollOptions: ["10/10 Quá tuyệt vời", "9/10 Cực kỳ hữu dụng", "Cần nâng cấp thêm nhiều game", "Bình thường"],
      pollVotes: [120, 45, 12, 1],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      userEmail: "v_reporter@vplay.local",
      userName: "V-Canary News",
      userPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      likes: 18,
      likesVoted: false,
      favoritesVoted: false,
      comments: []
    }
  ];

  // Stories defaults
  const defaultStories: Story[] = [
    { id: "s-1", userEmail: "music_queen@vplay.local", userName: "DJ Minari", userPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", mediaUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=400", mediaType: "image", createdAt: new Date().toISOString() },
    { id: "s-2", userEmail: "developer@vplay.local", userName: "Vplay OS Developer", userPhoto: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80", textContent: "🔥 Vconnect Social Hub chính thức ra lò!", mediaType: "text", createdAt: new Date().toISOString() },
    { id: "s-3", userEmail: "gamer_pro@vplay.local", userName: "Phú Sát Gamer", userPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80", mediaUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=400", mediaType: "image", createdAt: new Date().toISOString() }
  ];

  // Vshorts Defaults
  const defaultVshorts: Vshort[] = [
    {
      id: "vs-1",
      userEmail: "updates@vplay.local",
      userName: "Vplay Updates",
      userPhoto: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-light-12402-large.mp4",
      title: "Tính năng Vshorts cực cháy nay đã có mặt trên Vconnect! Hãy tải ngay video ngắn của bạn dưới 5 phút nào! 🔥🎥 #vplay #v_short",
      likes: 120,
      likesVoted: false,
      commentsCount: 15,
      sharesCount: 34,
      createdAt: new Date().toISOString()
    },
    {
      id: "vs-2",
      userEmail: "developer@vplay.local",
      userName: "Vplay OS Developer",
      userPhoto: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-playing-3d-video-game-41804-large.mp4",
      title: "Party Game mượt mà kết nối tay cầm bluetooth trên vPlay Board. Hướng dẫn setup cực nhanh chỉ trong 1 phút! 🎮🖥️",
      likes: 85,
      likesVoted: false,
      commentsCount: 9,
      sharesCount: 12,
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "vs-3",
      userEmail: "music_queen@vplay.local",
      userName: "DJ Minari",
      userPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-neon-lights-40094-large.mp4",
      title: "Live set đặc biệt tối nay lúc 20:00 trên kênh Phát thanh Vplay. Anh em đón nghe quầy cùng mình nha! 🎧⚡ #synthwave #edm",
      likes: 215,
      likesVoted: false,
      commentsCount: 42,
      sharesCount: 56,
      createdAt: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  const generateRandomStories = (): Story[] => {
    const storiesList: Story[] = [];
    
    // Always include Vplay News, Updates, Features first
    const primary = USER_POOL.filter(u => u.name.startsWith("Vplay"));
    const rest = USER_POOL.filter(u => !u.name.startsWith("Vplay"));
    
    // Combine and shuffle rest
    const shuffledRest = [...rest].sort(() => 0.5 - Math.random());
    const finalUsers = [...primary, ...shuffledRest];
    
    // Ensure we have at least 20 items
    while (finalUsers.length < 20) {
      finalUsers.push(...USER_POOL);
    }
    
    // Build 20 distinct stories
    for (let i = 0; i < 20; i++) {
      const userItem = finalUsers[i];
      const mediaType = Math.random() > 0.5 ? "image" : "text";
      const mediaUrl = mediaType === "image" 
        ? STORY_IMAGE_POOL[i % STORY_IMAGE_POOL.length]
        : "";
      const textContent = STORY_TEXT_POOL[i % STORY_TEXT_POOL.length];
      
      storiesList.push({
        id: `story-rand-${i}-${Math.random().toString(36).slice(2, 6)}`,
        userEmail: userItem.email,
        userName: userItem.name,
        userPhoto: userItem.photo,
        mediaType,
        mediaUrl: mediaUrl || undefined,
        textContent,
        createdAt: new Date(Date.now() - i * 300000).toISOString()
      });
    }
    return storiesList;
  };

  const generateRandomPosts = (): Post[] => {
    // Shuffled post contents
    const shuffledPool = [...POST_CONTENT_POOL].sort(() => 0.5 - Math.random());
    const shuffledUsers = [...USER_POOL].sort(() => 0.5 - Math.random());
    const postsList: Post[] = [];
    
    // Create 15-20 randomized, realistic posts from pools
    const count = 15;
    for (let i = 0; i < count; i++) {
      const contentItem = shuffledPool[i % shuffledPool.length];
      const userItem = shuffledUsers[i % shuffledUsers.length];
      const hasImage = Math.random() > 0.4;
      const mediaUrl = hasImage 
        ? STORY_IMAGE_POOL[(i + 3) % STORY_IMAGE_POOL.length]
        : "";
      
      postsList.push({
        id: `post-rand-${i}-${Math.random().toString(36).slice(2, 6)}`,
        type: Math.random() > 0.7 ? "blog" : "post",
        title: contentItem.title,
        content: contentItem.content,
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaUrl ? "image" : "",
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
        userEmail: userItem.email,
        userName: userItem.name,
        userPhoto: userItem.photo,
        likes: Math.floor(Math.random() * 200) + 12,
        likesVoted: false,
        favoritesVoted: false,
        comments: [
          {
            id: `c-rand-${i}`,
            userEmail: "developer@vplay.local",
            userName: "Vplay OS Developer",
            content: "Bài đăng tuyệt vời quá! Rất thực tế và bổ ích. Đã thả tim luôn. 👍",
            createdAt: new Date(Date.now() - i * 1800000).toISOString()
          }
        ]
      });
    }
    return postsList;
  };

  // Fetch or setup items relative to mode (lite / server)
  const loadAllData = async () => {
    setLoading(true);

    // Load Friends
    const savedFriends = localStorage.getItem("vplay_vconnect_friends");
    if (savedFriends) {
      setFriends(JSON.parse(savedFriends));
    } else {
      const initFriends = ["developer@vplay.local", "music_queen@vplay.local"];
      setFriends(initFriends);
      localStorage.setItem("vplay_vconnect_friends", JSON.stringify(initFriends));
    }

    // Load Discovery People
    const savedPeople = localStorage.getItem("vplay_vconnect_people");
    if (savedPeople) {
      setPeople(JSON.parse(savedPeople));
    } else {
      setPeople(defaultPeople);
      localStorage.setItem("vplay_vconnect_people", JSON.stringify(defaultPeople));
    }

    // Load Chats & Group Rooms
    const savedRooms = localStorage.getItem("vplay_vconnect_rooms");
    if (savedRooms) {
      setChatRooms(JSON.parse(savedRooms));
    } else {
      setChatRooms(defaultRooms);
      localStorage.setItem("vplay_vconnect_rooms", JSON.stringify(defaultRooms));
    }

    // Load Stories (always keep user's stories and fill with 20+ scrambled random stories!)
    const savedStoriesJson = localStorage.getItem("vplay_vconnect_stories");
    let userStories: Story[] = [];
    if (savedStoriesJson) {
      try {
        const parsed = JSON.parse(savedStoriesJson) as Story[];
        userStories = parsed.filter(s => s.userEmail === currentUserEmail);
      } catch (e) {
        console.error(e);
      }
    }
    const randomizedPoolStories = generateRandomStories();
    // Unique user stories merged with dynamic
    const mergedStories = [...userStories, ...randomizedPoolStories];
    setStories(mergedStories);

    // Load Vshorts
    const savedVshorts = localStorage.getItem("vplay_vconnect_vshorts");
    if (savedVshorts) {
      setVshorts(JSON.parse(savedVshorts));
    } else {
      setVshorts(defaultVshorts);
      localStorage.setItem("vplay_vconnect_vshorts", JSON.stringify(defaultVshorts));
    }

    if (lite) {
      // Offline LocalStorage Mode
      const savedFeed = localStorage.getItem("vplay_vconnect_feed");
      let userPosts: Post[] = [];
      if (savedFeed) {
        try {
          const parsed = JSON.parse(savedFeed) as Post[];
          userPosts = parsed.filter(p => p.userEmail === currentUserEmail);
        } catch (e) {
          console.error(e);
        }
      }
      const randomizedPoolPosts = generateRandomPosts();
      setItems([...userPosts, ...randomizedPoolPosts]);
      setLoading(false);
    } else {
      // Firebase Online Mode
      try {
        const querySnapshot = await getDocs(collection(db, "vplay_community_vconnect"));
        const fbItems: Post[] = [];
        querySnapshot.forEach((docSnap) => {
          fbItems.push({ id: docSnap.id, ...docSnap.data() } as Post);
        });

        // Date sorting descending
        fbItems.sort((a, b) => {
          const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || "").getTime();
          const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || "").getTime();
          return tB - tA;
        });

        if (fbItems.length === 0) {
          setItems(defaultPosts);
          // Auto populate demo data in online database to seed
          for (const dp of defaultPosts) {
            await addDoc(collection(db, "vplay_community_vconnect"), {
              ...dp,
              createdAt: serverTimestamp()
            });
          }
        } else {
          setItems(fbItems);
        }
      } catch (err) {
        console.error("Firestore Loading Failed, falling back to LocalStorage:", err);
        const savedFeed = localStorage.getItem("vplay_vconnect_feed");
        setItems(savedFeed ? JSON.parse(savedFeed) : defaultPosts);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadAllData();
  }, [lite, user]);

  // Story playback timer logic
  useEffect(() => {
    let interval: any = null;
    if (selectedStoryIndex !== null) {
      interval = setInterval(() => {
        setActiveStoryProgress((prev) => {
          if (prev >= 100) {
            // Next story or close
            if (selectedStoryIndex < stories.length - 1) {
              setSelectedStoryIndex(selectedStoryIndex + 1);
              return 0;
            } else {
              setSelectedStoryIndex(null);
              return 0;
            }
          }
          return prev + 2; // ~5 seconds total
        });
      }, 100);
    } else {
      setActiveStoryProgress(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedStoryIndex, stories.length]);

  // Vshorts Video Upload Action handler
  const handleUploadVshort = () => {
    if (!uploadVshortTitle || !uploadVshortTitle.trim()) {
      alert("Vui lòng nhập tựa đề cho video shorts!");
      return;
    }
    const finalUrl = uploadVshortUrl && uploadVshortUrl.trim() !== "" 
      ? uploadVshortUrl.trim() 
      : "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c0227e339f400cf9e2da0ede11234720&profile_id=139&oauth2_token_id=57447761";

    const newVshort: Vshort = {
      id: "vshort-" + Date.now(),
      title: uploadVshortTitle,
      videoUrl: finalUrl,
      likes: Math.floor(Math.random() * 5) + 1,
      commentsCount: 0,
      sharesCount: 0,
      userName: profileName || "Guest User",
      userPhoto: profileAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      userEmail: currentUserEmail,
      createdAt: new Date().toISOString()
    };

    const updated = [newVshort, ...vshorts];
    setVshorts(updated);
    localStorage.setItem("vplay_vconnect_vshorts", JSON.stringify(updated));
    setActiveVshortIndex(0);
    
    // Reset states
    setUploadVshortTitle("");
    setUploadVshortUrl("");
    setShowVshortUploadModal(false);
    
    addNotification?.("Tải lên Vshorts", "Video ngắn của bạn đã được tải lên thành công!", "success");
  };

  // AUDIO RECORDING CORE IMPLEMENTATION
  const startVoiceRecording = async (mode: "post" | "comment" | "chat") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        const localUrl = URL.createObjectURL(blob);
        
        if (mode === "post") {
          setVoiceUrl(localUrl);
          setMediaType("voice");
        } else if (mode === "comment") {
          setCommentVoiceUrl(localUrl);
        } else if (mode === "chat") {
          setChatVoiceUrl(localUrl);
        }

        if (addNotification) {
          addNotification("Ghi âm thành công", "Đã nạp file thoại của bạn làm tập tin đính kèm!", "success");
        }
      };

      mediaRecorder.start();
      setRecordDuration(0);
      setIsRecording(true);
      if (mode === "comment") setIsRecordingComment(true);
      if (mode === "chat") setIsRecordingChat(true);

      recordIntervalRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (e) {
      console.error("Microphone Access Request Throws:", e);
      if (addNotification) {
        addNotification("Phần cứng lỗi", "Không tìm thấy hoặc không có quyền truy cập vào micro thoại!", "error");
      }
    }
  };

  const stopVoiceRecording = (mode: "post" | "comment" | "chat") => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      // stop track stream
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    if (mode === "comment") setIsRecordingComment(false);
    if (mode === "chat") setIsRecordingChat(false);
    
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
    }
  };

  const handleMediaUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024 * 50) { // limit 50MB for social
      addNotification?.("Cảnh báo file", "Tập tin phương tiện tối đa là 50MB!", "warning");
      return;
    }
    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setMediaUrl(localUrl);
    setMediaType(file.type.startsWith("video/") ? "video" : "image");
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
    setVoiceUrl("");
    setAudioBlob(null);
  };

  // Publish feed item
  const handlePublishPost = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() && createType !== "poll" && createType !== "blog" && !voiceUrl) {
      addNotification?.("Soạn bài viết", "Vui lòng nhập nội dung đăng tải hoặc ghi âm giọng nói!", "warning");
      return;
    }
    if (createType === "blog" && (!title.trim() || !content.trim())) {
      addNotification?.("Soạn blog", "Blog thiết yếu phải điền đầy đủ tiêu đề và nội dung bài viết!", "warning");
      return;
    }
    if (createType === "poll" && (!title.trim() || pollOptions.some(o => !o.trim()))) {
      addNotification?.("Bình chọn", "Nhập cuộc khảo sát thăm dò ý kiến và điền đầy đủ các mục chọn!", "warning");
      return;
    }

    const newId = "vid-" + Date.now();
    const newPost: Post = {
      id: newId,
      type: createType,
      createdAt: new Date().toISOString(),
      userEmail: currentUserEmail,
      userName: currentUserName,
      userPhoto: currentUserPhoto,
      likes: 0,
      likesVoted: false,
      favoritesVoted: false,
      comments: []
    };

    if (createType === "post") {
      newPost.content = content;
      if (mediaUrl) {
        newPost.mediaUrl = mediaUrl;
        newPost.mediaType = mediaType;
      }
      if (voiceUrl) {
        newPost.voiceUrl = voiceUrl;
        newPost.mediaType = "voice";
      }
    } else if (createType === "blog") {
      newPost.title = title;
      newPost.content = content;
      newPost.category = blogCategory;
      newPost.coverUrl = blogCoverUrl || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=400&q=80";
    } else if (createType === "poll") {
      newPost.title = title;
      newPost.pollOptions = pollOptions.filter(o => o.trim() !== "");
      newPost.pollVotes = new Array(newPost.pollOptions.length).fill(0);
      newPost.votedOption = null;
    }

    if (lite) {
      const merged = [newPost, ...items];
      setItems(merged);
      localStorage.setItem("vplay_vconnect_feed", JSON.stringify(merged));
      addNotification?.("Vconnect Offline", "Bài viết đã lưu offline thành công trong trình duyệt!", "success");
    } else {
      try {
        await addDoc(collection(db, "vplay_community_vconnect"), {
          ...newPost,
          createdAt: serverTimestamp()
        });
        addNotification?.("Vconnect Community", "Đăng tải bài viết thành công lên bảng tin công cộng!", "success");
        loadAllData();
      } catch (err) {
        console.error("Firebase post upload error:", err);
        // Fallback local append
        const merged = [newPost, ...items];
        setItems(merged);
        localStorage.setItem("vplay_vconnect_feed", JSON.stringify(merged));
        addNotification?.("Vconnect", "Ghi khẩn cấp offline, bài viết khả dụng tạm thời.", "warning");
      }
    }

    // Reset inputs
    setTitle("");
    setContent("");
    setBlogCategory("Technology");
    setBlogCoverUrl("");
    setPollOptions(["", ""]);
    setSelectedFile(null);
    setMediaUrl("");
    setMediaType("");
    setVoiceUrl("");
    setAudioBlob(null);
    setShowCreateModal(false);
  };

  // Story Creation
  const handlePublishStory = () => {
    if (newStoryType === "text" && !newStoryText.trim()) {
      addNotification?.("Thêm tin", "Nội dung tin thoại văn bản không được trống!", "warning");
      return;
    }

    const storyId = "st-" + Date.now();
    const newStory: Story = {
      id: storyId,
      userEmail: currentUserEmail,
      userName: currentUserName,
      userPhoto: currentUserPhoto,
      mediaType: newStoryType,
      createdAt: new Date().toISOString()
    };

    if (newStoryType === "text") {
      newStory.textContent = newStoryText;
    } else if (newStoryType === "image") {
      newStory.mediaUrl = newStoryFileUrl || "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=600&q=80";
    } else if (newStoryType === "voice") {
      newStory.voiceUrl = voiceUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3";
    }

    const updatedStories = [newStory, ...stories];
    setStories(updatedStories);
    localStorage.setItem("vplay_vconnect_stories", JSON.stringify(updatedStories));

    setNewStoryText("");
    setNewStoryFileUrl("");
    setVoiceUrl("");
    setAudioBlob(null);
    setShowAddStoryModal(false);
    addNotification?.("Tin của bạn", "Đã thêm tin Vconnect Story thành công (hiệu lực 24h)!", "success");
  };

  // Liking Feed Posts
  const handleLikePost = async (postId: string) => {
    const updated = items.map(p => {
      if (p.id === postId) {
        const alreadyLiked = p.likesVoted;
        return {
          ...p,
          likes: p.likes + (alreadyLiked ? -1 : 1),
          likesVoted: !alreadyLiked
        };
      }
      return p;
    });

    setItems(updated);
    localStorage.setItem("vplay_vconnect_feed", JSON.stringify(updated));

    if (!lite) {
      try {
        const target = updated.find(p => p.id === postId);
        if (target && !postId.startsWith("post-") && !postId.startsWith("online-")) {
          await updateDoc(doc(db, "vplay_community_vconnect", postId), {
            likes: target.likes
          });
        }
      } catch (err) {
        console.error("Failed to sync like with Firebase:", err);
      }
    }
  };

  // Favoriting Feed Posts
  const handleFavoritePost = (postId: string) => {
    const updated = items.map(p => {
      if (p.id === postId) {
        const alreadySaved = p.favoritesVoted;
        const result = {
          ...p,
          favoritesVoted: !alreadySaved
        };
        addNotification?.(
          "Favorites",
          !alreadySaved ? "Đã lưu bài viết vào mục yêu tú của bạn!" : "Đã gỡ bài viết khỏi danh mục yêu tú!",
          "success"
        );
        return result;
      }
      return p;
    });

    setItems(updated);
    localStorage.setItem("vplay_vconnect_feed", JSON.stringify(updated));
  };

  // Report Posts
  const handleSubmitReport = () => {
    if (!reportingPostId) return;
    
    addNotification?.("Báo cáo vi phạm", `Vconnect đã tiếp nhận báo cáo của bạn về bài viết này lý do: ${reportReason}. Ban quản trị sẽ rà soát lập tức!`, "success");
    setReportingPostId(null);
  };

  // Render text content and highlight hashtags with click handlers
  const renderTextWithHashtags = (text?: string) => {
    if (!text) return null;
    const parts = text.split(/(\s+)/);
    return parts.map((part, idx) => {
      if (part.startsWith("#") && part.length > 1) {
        return (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              setSearchQuery(part);
              addNotification?.("Hashtag Lọc", `Đang lọc theo mã hashtag ${part}!`, "info");
            }}
            className="text-purple-400 hover:text-pink-400 font-extrabold hover:underline transition-colors mx-0.5 inline"
          >
            {part}
          </button>
        );
      }
      return part;
    });
  };

  // Share Feed Post (Simulated and clipboard Copy link)
  const handleSharePost = (post: Post, shareToChatRoomId?: string) => {
    const virtualLink = `${window.location.origin}/vconnect/post/${post.id}`;
    
    if (shareToChatRoomId) {
      // Send directly to chat room
      const textShare = `[Chia sẻ bài viết từ Vconnect] "${post.title || post.content?.slice(0, 30)}...": ${virtualLink}`;
      handleSendChatMessage(textShare, undefined, shareToChatRoomId);
      addNotification?.("Chia sẻ thành công", `Đã gửi trực tiếp liên kết bài viết tới phòng trò chuyện!`, "success");
    } else {
      // Copy to clipboard
      navigator.clipboard.writeText(virtualLink).then(() => {
        addNotification?.("Sao chép liên kết", "Đã lưu URL chia sẻ mạng xã hội Vconnect vào clipboard!", "success");
      }).catch(() => {
        alert("Liên kết chia sẻ bài viết: " + virtualLink);
      });
    }
  };

  // Adding Comment (Text or Voice Recording Comment)
  const handleAddComment = () => {
    if (!activeCommentsPostId) return;
    if (!newCommentText.trim() && !commentVoiceUrl) return;

    const newComment: Comment = {
      id: "cm-" + Date.now(),
      userEmail: currentUserEmail,
      userName: currentUserName,
      userPhoto: currentUserPhoto,
      content: newCommentText,
      voiceUrl: commentVoiceUrl || undefined,
      createdAt: new Date().toISOString()
    };

    const updated = items.map(p => {
      if (p.id === activeCommentsPostId) {
        const currentComments = p.comments || [];
        return {
          ...p,
          comments: [...currentComments, newComment]
        };
      }
      return p;
    });

    setItems(updated);
    localStorage.setItem("vplay_vconnect_feed", JSON.stringify(updated));

    if (!lite && !activeCommentsPostId.startsWith("post-") && !activeCommentsPostId.startsWith("online-")) {
      try {
        const target = updated.find(p => p.id === activeCommentsPostId);
        if (target) {
          updateDoc(doc(db, "vplay_community_vconnect", activeCommentsPostId), {
            comments: target.comments
          });
        }
      } catch (e) {
        console.error("Failed to upload comment arrays:", e);
      }
    }

    // Gemini AI Auto Reply inside Comments Feed
    const postObj = items.find(p => p.id === activeCommentsPostId);
    const commentMsgText = newCommentText;
    if (postObj && postObj.userEmail !== currentUserEmail && commentMsgText.trim()) {
      setTimeout(() => {
        fetch("/api/gemini/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `Bài đăng có chủ đề: "${postObj.title || ""}". Nội dung: "${postObj.content}". Có người bình luận: "${commentMsgText}". Với tư cách là tác giả bài viết, hãy trả lời bình luận này thật tự nhiên, dí hỏm.`,
            contextType: "feed"
          })
        })
        .then(res => res.json())
        .then(data => {
          const aiCommentReplyText = data.reply || "Cảm ơn đóng góp và phản hồi quý giá của bạn nhé! Trân trọng. ❤️";
          const aiComment: Comment = {
            id: "cm-ai-" + Date.now(),
            userEmail: postObj.userEmail,
            userName: postObj.userName,
            userPhoto: postObj.userPhoto,
            content: aiCommentReplyText,
            createdAt: new Date().toISOString()
          };

          setItems(prevItems => {
            const upd = prevItems.map(p => {
              if (p.id === activeCommentsPostId) {
                return {
                  ...p,
                  comments: [...(p.comments || []), aiComment]
                };
              }
              return p;
            });
            localStorage.setItem("vplay_vconnect_feed", JSON.stringify(upd));
            return upd;
          });
        })
        .catch(err => {
          console.error("Failed to generate Gemini comments response:", err);
        });
      }, 3500);
    }

    setNewCommentText("");
    setCommentVoiceUrl("");
    setAudioBlob(null);
    addNotification?.("Bình luận mới", "Gửi phản hồi bình luận thành công tới tác giả!", "success");
  };

  // Voting on Poll Posts
  const handlePollVote = async (postId: string, optIdx: number) => {
    const updated = items.map(p => {
      if (p.id === postId) {
        if (p.votedOption !== undefined && p.votedOption !== null) return p;
        const votes = [...(p.pollVotes || [])];
        votes[optIdx] = (votes[optIdx] || 0) + 1;
        return {
          ...p,
          pollVotes: votes,
          votedOption: optIdx
        };
      }
      return p;
    });

    setItems(updated);
    localStorage.setItem("vplay_vconnect_feed", JSON.stringify(updated));

    if (!lite && !postId.startsWith("post-") && !postId.startsWith("online-")) {
      try {
        const target = updated.find(p => p.id === postId);
        if (target) {
          await updateDoc(doc(db, "vplay_community_vconnect", postId), {
            pollVotes: target.pollVotes
          });
        }
      } catch (err) {
        console.error("Failed to upload voted counts:", err);
      }
    }
    addNotification?.("Bình chọn", "Cảm ơn ý kiến bỏ phiếu của bạn!", "success");
  };

  // Add Friend Flow
  const handleAddFriend = (personEmail: string, personName: string) => {
    if (friends.includes(personEmail)) {
      // Unfriend
      const filtered = friends.filter(f => f !== personEmail);
      setFriends(filtered);
      localStorage.setItem("vplay_vconnect_friends", JSON.stringify(filtered));
      addNotification?.("Hủy kết bạn", `Đã xóa kết nối bạn bè với ${personName}.`, "info");
    } else {
      // Add Friend
      const updated = [...friends, personEmail];
      setFriends(updated);
      localStorage.setItem("vplay_vconnect_friends", JSON.stringify(updated));
      addNotification?.("Thêm bạn bè", `Đã gửi lời mời & kết bạn thành công với ${personName}!`, "success");

      // Auto start DM room with this friend if not existing
      const roomExists = chatRooms.find(r => !r.isGroup && r.participants.includes(personEmail));
      if (!roomExists) {
        const personData = people.find(p => p.email === personEmail);
        const newRoom: ChatRoom = {
          id: "dm-" + Date.now(),
          name: personName,
          isGroup: false,
          participants: [currentUserEmail, personEmail],
          avatar: personData?.avatar,
          messages: [
            { id: "m-welcome", senderEmail: personEmail, senderName: personName, text: `Chào bạn! Chúng mình đã là bạn bè trên Vconnect. Hãy nhắn tin trò chuyện nhé! 👋`, createdAt: new Date().toISOString() }
          ]
        };
        const updatedRooms = [newRoom, ...chatRooms];
        setChatRooms(updatedRooms);
        localStorage.setItem("vplay_vconnect_rooms", JSON.stringify(updatedRooms));
      }
    }
  };

  // Chat message send (supports Text or Voice messages)
  const handleSendChatMessage = (textOverride?: string, voiceUrlOverride?: string, forceTargetRoomId?: string) => {
    const targetRoomId = forceTargetRoomId || activeRoomId;
    if (!targetRoomId) return;

    const actualText = textOverride !== undefined ? textOverride : chatInputText;
    const actualVoice = voiceUrlOverride !== undefined ? voiceUrlOverride : chatVoiceUrl;

    if (!actualText.trim() && !actualVoice) return;

    const newMessage: ChatMessage = {
      id: "msg-" + Date.now(),
      senderEmail: currentUserEmail,
      senderName: currentUserName,
      text: actualText,
      voiceUrl: actualVoice || undefined,
      createdAt: new Date().toISOString()
    };

    const updatedRooms = chatRooms.map(r => {
      if (r.id === targetRoomId) {
        return {
          ...r,
          messages: [...r.messages, newMessage]
        };
      }
      return r;
    });

    setChatRooms(updatedRooms);
    localStorage.setItem("vplay_vconnect_rooms", JSON.stringify(updatedRooms));

    if (!forceTargetRoomId) {
      setChatInputText("");
      setChatVoiceUrl("");
      setAudioBlob(null);
    }

    // Interactive AUTO REPLY generator to simulate immersive social environment (using Gemini AI)
    const room = chatRooms.find(r => r.id === targetRoomId);
    if (room && !textOverride) {
      const systemPartnerEmail = room.participants.find(p => p !== currentUserEmail) || "system@vplay.local";
      const systemPartnerName = room.isGroup ? "Phú Sát Gamer" : room.name;

      // Call our server endpoint
      fetch("/api/gemini/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: actualText,
          contextType: "chat",
          chatHistory: room.messages.map(m => ({
            role: m.senderEmail === currentUserEmail ? "user" : "model",
            parts: [{ text: m.text }]
          }))
        })
      })
      .then(res => res.json())
      .then(data => {
        const replyText = data.reply || "Tuyệt vời quá! Mình đồng ý cả hai tay luôn nè. 👍";
        
        const botReply: ChatMessage = {
          id: "msg-reply-" + Date.now(),
          senderEmail: systemPartnerEmail,
          senderName: systemPartnerName,
          text: replyText,
          createdAt: new Date().toISOString()
        };

        setChatRooms(prevRooms => {
          const updated = prevRooms.map(rm => {
            if (rm.id === targetRoomId) {
              return {
                ...rm,
                messages: [...rm.messages, botReply]
              };
            }
            return rm;
          });
          localStorage.setItem("vplay_vconnect_rooms", JSON.stringify(updated));
          return updated;
        });
      })
      .catch(err => {
        console.error("Gemini vChat error falling back to mock reply:", err);
        const senderAnswers = [
          "Tuyệt vời quá! Mình rất đồng tình luôn nè. 💯",
          "Thú vị thật đó, hôm nào làm ly cà phê chém gió tiếp nhé! ☕",
          "Chuẩn luôn bạn ơi, vPlay OS chạy ngày một mượt ra đó! 🔥",
          "Ủng hộ bạn phát triển thêm mảng micro voice chat này nhé! 🎙️",
          "Vừa lướt Vconnect thấy bài đăng của bạn đỉnh quá, thả tim luôn! ❤️"
        ];
        const randomAnswer = senderAnswers[Math.floor(Math.random() * senderAnswers.length)];
        
        const botReply: ChatMessage = {
          id: "msg-reply-" + Date.now(),
          senderEmail: systemPartnerEmail,
          senderName: systemPartnerName,
          text: randomAnswer,
          createdAt: new Date().toISOString()
        };

        setChatRooms(prevRooms => {
          const updated = prevRooms.map(rm => {
            if (rm.id === targetRoomId) {
              return {
                ...rm,
                messages: [...rm.messages, botReply]
              };
            }
            return rm;
          });
          localStorage.setItem("vplay_vconnect_rooms", JSON.stringify(updated));
          return updated;
        });
      });
    }
  };

  // Group / Party creation flow
  const handleCreateGroupParty = () => {
    const partyName = prompt("Nhập tên nhóm Party trò chuyện mới của bạn:");
    if (!partyName || !partyName.trim()) return;

    const newGroup: ChatRoom = {
      id: "room-party-" + Date.now(),
      name: "🚀 Party " + partyName,
      isGroup: true,
      participants: [currentUserEmail, "developer@vplay.local", "gamer_pro@vplay.local"],
      avatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80",
      messages: [
        { id: "m-grp", senderEmail: "developer@vplay.local", senderName: "Vplay OS Developer", text: `Chào mừng anh em gia nhập Party ${partyName}! Đã kết nối voice chat & phòng tiệc! 🎉`, createdAt: new Date().toISOString() }
      ]
    };

    const updated = [newGroup, ...chatRooms];
    setChatRooms(updated);
    localStorage.setItem("vplay_vconnect_rooms", JSON.stringify(updated));
    setActiveRoomId(newGroup.id);
    addNotification?.("Tạo Party", `Phòng chat nhóm ${partyName} đã hoạt động!`, "success");
  };

  // Filter the Feed posts
  const filteredFeedPosts = useMemo(() => {
    return items.filter(p => {
      // search query match
      const contentString = `${p.title || ""} ${p.content || ""} ${p.category || ""}`.toLowerCase();
      const matchesSearch = searchQuery.trim() === "" || contentString.includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // tab filters
      if (filter === "all") return true;
      if (filter === "media") return p.mediaUrl !== undefined || p.voiceUrl !== undefined;
      if (filter === "post_blog") return p.type === "post" || p.type === "blog";
      if (filter === "poll") return p.type === "poll";
      if (filter === "favorites") return p.favoritesVoted === true;

      return true;
    });
  }, [items, filter, searchQuery]);

  // People matching search criteria
  const filteredPeople = useMemo(() => {
    return people.filter(p => {
      if (p.email === currentUserEmail) return false; // hide self in search list
      const queryStr = peopleSearch.trim().toLowerCase();
      return queryStr === "" || p.name.toLowerCase().includes(queryStr) || p.email.toLowerCase().includes(queryStr);
    });
  }, [people, peopleSearch, currentUserEmail]);

  return (
    <div className="flex-1 flex flex-row h-full overflow-hidden bg-[#0c0c0e] text-white">
      {/* LEFT: Central Social Feed & Stories */}
      <div className="flex-1 flex flex-col min-h-0 bg-transparent relative border-r border-white/5">
        
        {/* Sub-header inside Vconnect tab */}
        <div className="px-8 py-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/60 backdrop-blur-2xl">
          <div>
            <div className="flex items-center gap-2">
              <Users size={22} className="text-[#a855f7]" />
              <h2 className="text-xl font-black uppercase tracking-tight text-white font-mono">
                {lite ? "Vconnect Lite" : "Vconnect Social"}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20">
                vPlay Hub
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
              Ghi âm thoại • Kết bạn • Chia sẻ câu chuyện • Trò chuyện nhóm Party
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setShowFriendDrawer(!showFriendDrawer);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                showFriendDrawer 
                  ? "bg-purple-600/20 text-purple-400 border-purple-500/30" 
                  : "bg-[#141416] border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              <Users size={14} />
              <span>{showFriendDrawer ? "Ẩn thanh bạn bè" : "Hiện thanh bạn bè"}</span>
            </button>

            <button 
              onClick={() => {
                setCreateType("post");
                setShowCreateModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-[11px] hover:brightness-110 active:scale-95 transition-all shadow-md shadow-purple-900/10"
            >
              <Plus size={14} />
              <span>Viết bài</span>
            </button>
          </div>
        </div>

        {/* Navigation sub-tabs inside Vconnect */}
        <div className="flex items-center gap-2 bg-black/40 px-8 py-2.5 border-b border-white/5 overflow-x-auto scrollbar-none">
          <button 
            onClick={() => setVconnectSubTab("feed")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all border ${vconnectSubTab === "feed" ? "bg-purple-600 border-purple-500 text-white shadow-lg" : "bg-[#141416] border-transparent text-slate-400 hover:text-white"}`}
          >
            <Users size={12} />
            <span>Bảng tin</span>
          </button>
          
          <button 
            onClick={() => setVconnectSubTab("vshorts")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all border ${vconnectSubTab === "vshorts" ? "bg-purple-600 border-purple-500 text-white shadow-lg" : "bg-[#141416] border-transparent text-slate-400 hover:text-white"}`}
          >
            <Film size={12} />
            <span className="flex items-center gap-1">
              Vshorts
              <span className="px-1 py-0.2 rounded text-[7.5px] bg-rose-500 text-white font-mono font-bold uppercase animate-pulse">Hot</span>
            </span>
          </button>

          <button 
            onClick={() => setVconnectSubTab("vstore")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all border ${vconnectSubTab === "vstore" ? "bg-purple-600 border-purple-500 text-white shadow-lg" : "bg-[#141416] border-transparent text-slate-400 hover:text-white"}`}
          >
            <ShoppingBag size={12} />
            <span className="flex items-center gap-1">
              Vstore Shop
              <span className="px-1 py-0.2 rounded text-[7.5px] bg-emerald-500 text-white font-mono font-bold uppercase">Mới</span>
            </span>
          </button>

          <button 
            onClick={() => setVconnectSubTab("profile")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all border ${vconnectSubTab === "profile" ? "bg-purple-600 border-purple-500 text-white shadow-lg" : "bg-[#141416] border-transparent text-slate-400 hover:text-white"}`}
          >
            <User size={12} />
            <span>Trang cá nhân</span>
          </button>
        </div>

        {vconnectSubTab === "feed" && (
          /* FEED BODY */
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            
            {lite && (
              <div className="mb-2 p-5 rounded-2xl bg-gradient-to-r from-purple-900/60 via-indigo-950/50 to-slate-900 border border-purple-500/30 shadow-xl shadow-purple-950/30 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-purple-300">Bạn đang trải nghiệm Vconnect Lite</h4>
                    <p className="text-[11px] text-slate-300 mt-1 max-w-xl">
                      Đăng nhập tài khoản vPlay ngay để tham gia bình luận, chia sẻ bài viết, đăng câu chuyện Stories của riêng bạn và đàm thoại đập hộp cùng Party!
                    </p>
                  </div>
                </div>
                <button 
                  onClick={onLogin}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:brightness-110 active:scale-95 transition-all text-white font-extrabold uppercase text-[10px] tracking-wider rounded-xl cursor-pointer shrink-0 shadow-lg shadow-purple-500/10"
                >
                  Đăng nhập ngay
                </button>
              </div>
            )}
          
          {/* STORIES BROWSER SECTION */}
          <div className="space-y-3 pb-3 border-b border-white/5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Vconnect Stories</h3>
            <div className="flex items-center gap-4 overflow-x-auto py-2 scrollbar-none">
              
              {/* Creator Add Story trigger */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setVoiceUrl("");
                    setNewStoryText("");
                    setNewStoryType("text");
                    setShowAddStoryModal(true);
                  }}
                  className="w-16 h-16 rounded-full border-2 border-dashed border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 flex items-center justify-center transition-all group hover:scale-105 active:scale-95"
                >
                  <Plus size={24} className="text-purple-400 group-hover:scale-110 transition-transform" />
                </button>
                <span className="text-[10px] font-bold text-purple-400">Đăng story</span>
              </div>

              {/* Stories Feed Loop */}
              {stories.map((st, idx) => (
                <button
                  key={st.id}
                  onClick={() => {
                    setSelectedStoryIndex(idx);
                    setActiveStoryProgress(0);
                  }}
                  className="flex flex-col items-center gap-2 flex-shrink-0 group focus:outline-none"
                >
                  <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-purple-600 to-pink-500 group-hover:scale-105 transition-all shadow-lg active:scale-95">
                    <div className="w-full h-full rounded-full border-2 border-[#0c0c0e] overflow-hidden bg-slate-800">
                      <img 
                        src={st.userPhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
                        alt={st.userName} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-slate-300 group-hover:text-white max-w-[70px] truncate">
                    {st.userEmail === currentUserEmail ? "Tin của bạn" : st.userName}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* FILTER AND SEARCH ROW */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 p-1 bg-[#141416] rounded-xl border border-white/5 w-full sm:w-auto overflow-x-auto scrollbar-none">
              {[
                { id: "all", label: "Tất cả" },
                { id: "media", label: "Media & Thoại" },
                { id: "post_blog", label: "Bài viết & Blog" },
                { id: "poll", label: "Bình chọn" },
                { id: "favorites", label: "Yêu thích ⭐" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                    filter === tab.id 
                      ? "bg-purple-600 text-white shadow" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-black/30 border-white/5 w-full sm:w-48 text-white focus-within:border-purple-500/50 transition-colors">
              <Search size={14} className="text-slate-500" />
              <input 
                type="text" 
                placeholder="Tìm trang Feed Vconnect" 
                className="bg-transparent border-none outline-none text-[11px] w-full font-bold text-white placeholder-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X size={12} className="text-slate-400 hover:text-white" />
                </button>
              )}
            </div>
          </div>

          {/* MAIN POST FEED CARDS */}
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="animate-spin text-purple-400" size={32} />
              <p className="text-xs text-slate-400 font-medium font-mono">Đang đồng bộ mạng xã hội Vconnect...</p>
            </div>
          ) : filteredFeedPosts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-[#141416]/40 border border-white/5 rounded-3xl">
              <Smile size={32} className="text-slate-500 mb-2" />
              <span className="text-sm font-bold text-slate-300">Nhật ký trống bách</span>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">Không tìm thấy bài viết nào phù hợp vào thời điểm này. Hãy tự tay đăng câu chuyện độc nhất của bạn nhé!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredFeedPosts.map(post => (
                <div 
                  key={post.id} 
                  className={`p-6 rounded-[28px] border transition-all flex flex-col bg-[#141416] border-white/5 hover:bg-[#1a1a1e] hover:-translate-y-0.5 shadow-xl`}
                >
                  {/* Card top headers */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={post.userPhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
                        alt={post.userName} 
                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-white">{post.userName}</span>
                          <span className="text-[9px] text-slate-400 font-bold max-w-[120px] truncate">({post.userEmail})</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium font-mono">
                          {new Date(post.createdAt?.seconds ? post.createdAt.seconds * 1000 : post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {post.type === "blog" && (
                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-black uppercase rounded-lg">
                          Blog • {post.category}
                        </span>
                      )}
                      {post.type === "poll" && (
                        <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[9px] font-black uppercase rounded-lg">
                          Bình chọn
                        </span>
                      )}
                      
                      {/* Dropdown controls (Report triggers) */}
                      <button 
                        onClick={() => setReportingPostId(post.id)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Báo cáo vi phạm"
                      >
                        <Flag size={14} />
                      </button>
                    </div>
                  </div>

                  {/* MAIN CARD CONTENT */}
                  {post.type === "post" && (
                    <div className="space-y-4">
                      {post.content && (
                        <p className="text-sm text-slate-200 leading-relaxed font-sans">{renderTextWithHashtags(post.content)}</p>
                      )}
                      
                      {/* Attached Image method */}
                      {post.mediaUrl && post.mediaType === "image" && (
                        <div className="rounded-2xl overflow-hidden max-h-96 bg-black/30 border border-white/5">
                          <img src={post.mediaUrl} alt="Attached Preview" className="w-full h-full object-contain" />
                        </div>
                      )}

                      {/* Attached Video method */}
                      {post.mediaUrl && post.mediaType === "video" && (
                        <div className="rounded-2xl overflow-hidden max-h-96 bg-black/40 border border-white/5">
                          <video src={post.mediaUrl} controls className="w-full max-h-96" />
                        </div>
                      )}

                      {/* Attached VOICE RECORDING audio player */}
                      {post.voiceUrl && (
                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/20 to-indigo-950/20 border border-purple-500/20 flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 hover:bg-purple-500/30 flex items-center justify-center text-purple-400 animate-pulse">
                            <Volume2 size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">Tin nhắn thoại</span>
                            <audio src={post.voiceUrl} controls className="w-full mt-1.5 h-8 scale-95" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {post.type === "blog" && (
                    <div className="space-y-4">
                      {post.coverUrl && (
                        <div className="rounded-2xl overflow-hidden h-40 bg-slate-800 border border-white/5">
                          <img src={post.coverUrl} alt="Blog Cover" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <h4 className="font-black text-base text-white hover:text-rose-400 transition-colors">{post.title}</h4>
                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{renderTextWithHashtags(post.content)}</p>
                      <button 
                        onClick={() => setReadingBlog(post)}
                        className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 self-start pt-1.5"
                      >
                        <span>Đọc toàn bộ Blog</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  )}

                  {post.type === "poll" && (
                    <div className="space-y-4">
                      <h4 className="font-bold text-sm text-slate-200">{post.title}</h4>
                      
                      <div className="space-y-2">
                        {post.pollOptions?.map((opt, idx) => {
                          const votes = post.pollVotes?.[idx] || 0;
                          const totalVotes = post.pollVotes?.reduce((a, b) => a + b, 0) || 1;
                          const pct = Math.round((votes / totalVotes) * 100);
                          const isVoted = post.votedOption === idx;

                          return (
                            <button
                              key={idx}
                              onClick={() => handlePollVote(post.id, idx)}
                              disabled={post.votedOption !== undefined && post.votedOption !== null}
                              className={`w-full p-3.5 rounded-2xl border text-left flex flex-col justify-center relative overflow-hidden transition-all text-xs font-bold ${
                                isVoted 
                                  ? "border-sky-500/50 bg-[#1c2c36]" 
                                  : "border-white/5 bg-[#1a1a1e] hover:bg-white/5"
                              }`}
                            >
                              <div className="flex justify-between items-center z-10 w-full">
                                <span>{opt}</span>
                                <span className="text-slate-400 hover:text-slate-100">{votes} phiếu ({pct}%)</span>
                              </div>
                              <div 
                                className="absolute left-0 top-0 bottom-0 bg-sky-500/10 transition-all duration-500 rounded-l-2xl" 
                                style={{ width: `${pct}%` }}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* BOTTOM REACTION ACTION BUTTONS */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6">
                    <div className="flex items-center gap-1.5">
                      
                      {/* LIKE ACTION */}
                      <button 
                        onClick={() => handleLikePost(post.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          post.likesVoted 
                            ? "bg-rose-500/10 text-rose-500" 
                            : "hover:bg-white/5 text-slate-400 hover:text-slate-100"
                        }`}
                      >
                        <Heart size={14} className={post.likesVoted ? "fill-current" : ""} />
                        <span>{post.likes}</span>
                      </button>

                      {/* COMMENTS DRAWER ACTIVATE */}
                      <button 
                        onClick={() => setActiveCommentsPostId(post.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-white/5 text-slate-400 hover:text-slate-100 transition-all`}
                      >
                        <MessageSquare size={14} />
                        <span>{(post.comments || []).length}</span>
                      </button>

                      {/* FAVORITE TOGGLE */}
                      <button 
                        onClick={() => handleFavoritePost(post.id)}
                        className={`flex items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all ${
                          post.favoritesVoted 
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-500" 
                            : "border-transparent text-slate-400 hover:text-amber-400 hover:bg-white/5"
                        }`}
                        title="Thêm yêu thích"
                      >
                        <Star size={14} className={post.favoritesVoted ? "fill-current" : ""} />
                      </button>
                    </div>

                    {/* SHARE TRIGGER dropdown simulation */}
                    <div className="flex items-center gap-1">
                      {chatRooms.filter(r => r.isGroup).map(r => (
                        <button
                          key={r.id}
                          onClick={() => handleSharePost(post, r.id)}
                          className="px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-wider"
                          title={`Gửi tới nhóm ${r.name}`}
                        >
                          Send to Party
                        </button>
                      ))}
                      
                      <button 
                        onClick={() => handleSharePost(post)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-white/5 text-slate-400 hover:text-white transition-all"
                        title="Sao chép liên kết chia sẻ"
                      >
                        <Share2 size={14} />
                        <span className="hidden sm:inline">Chia sẻ</span>
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* ==================================================== */}
        {/* VSHORTS SCREEN RENDER AND CONTROLS */}
        {/* ==================================================== */}
        {vconnectSubTab === "vshorts" && (
          <div className="flex-1 flex flex-col min-h-0 bg-transparent relative">
            <div className="flex-1 flex flex-col items-center justify-between bg-black/40 p-4 overflow-y-auto custom-scrollbar h-full w-full">
              
              <div className="flex items-center justify-between w-full max-w-sm mb-2 pt-2">
                <div className="flex items-center gap-1.5">
                  <Film size={14} className="text-red-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 font-mono">
                    Vshorts ({vshorts.length > 0 ? `${activeVshortIndex + 1}/${vshorts.length}` : "0/0"})
                  </span>
                </div>
                
                <button
                  onClick={() => setShowVshortUploadModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-xl text-[9.5px] font-black uppercase text-white shadow-lg tracking-wider transition-all"
                >
                  <Plus size={11} />
                  <span>Đăng Shorts</span>
                </button>
              </div>

              {vshorts.length === 0 ? (
                <div className="text-center py-24 text-slate-500 space-y-3">
                  <Film size={44} className="mx-auto text-slate-600 animate-pulse" />
                  <p className="text-xs font-bold text-slate-400">Chưa có video Vshorts nào dưới 5 phút</p>
                  <button
                    onClick={() => setShowVshortUploadModal(true)}
                    className="text-[10px] font-black uppercase bg-[#a855f7] hover:brightness-110 text-white px-4 py-2 rounded-xl"
                  >
                    Tải lên Vshort đầu tiên
                  </button>
                </div>
              ) : (
                (() => {
                  const currentSt = vshorts[activeVshortIndex];
                  if (!currentSt) return null;
                  
                  return (
                    <div className="relative w-full max-w-sm h-[460px] md:h-[500px] bg-black border border-white/10 rounded-[32px] overflow-hidden flex flex-col justify-end shadow-2xl shrink-0 my-3">
                      
                      {/* Video Player */}
                      <video
                        key={currentSt.videoUrl}
                        src={currentSt.videoUrl}
                        autoPlay
                        loop
                        controls={false}
                        className="absolute inset-0 w-full h-full object-cover z-0"
                        playsInline
                        muted={!isVshortPlaying}
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/30 pointer-events-none z-10" />

                      {/* Top Sound and control toggle */}
                      <div className="absolute top-4 right-4 z-20 flex gap-2">
                        <button
                          onClick={() => setIsVshortPlaying(!isVshortPlaying)}
                          className="p-2.5 rounded-full bg-black/60 border border-white/10 text-white hover:bg-black/80 transition-all shadow-md active:scale-90"
                          title={isVshortPlaying ? "Tắt tiếng" : "Bật tiếng (Unmute)"}
                        >
                          {isVshortPlaying ? <Volume2 size={13} className="text-rose-400 animate-pulse" /> : <Mic size={13} className="text-slate-400" />}
                        </button>
                      </div>

                      {/* Right actions widget */}
                      <div className="absolute bottom-16 right-4 z-20 flex flex-col items-center gap-4">
                        
                        {/* Profile Avatar */}
                        <div className="relative">
                          <img 
                            src={currentSt.userPhoto || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"} 
                            alt="" 
                            className="w-10 h-10 rounded-full border-2 border-red-500 bg-slate-900 shadow-md object-cover" 
                          />
                          {isUserVerified(currentSt.userEmail) && (
                            <span className="absolute -bottom-1 -right-1 bg-sky-500 rounded-full p-0.5 text-white" title="Đã xác minh">
                              <ShieldCheck size={9} className="fill-current text-white" />
                            </span>
                          )}
                        </div>

                        {/* Likes */}
                        <div className="flex flex-col items-center">
                          <button
                            onClick={() => {
                              const copy = [...vshorts];
                              const cur = copy[activeVshortIndex];
                              if (cur.likesVoted) {
                                cur.likes -= 1;
                                cur.likesVoted = false;
                              } else {
                                cur.likes += 1;
                                cur.likesVoted = true;
                              }
                              setVshorts(copy);
                              localStorage.setItem("vplay_vconnect_vshorts", JSON.stringify(copy));
                            }}
                            className={`p-2.5 rounded-full border transition-all shadow-lg hover:scale-110 active:scale-95 ${currentSt.likesVoted ? "bg-rose-600 border-rose-500 text-white" : "bg-black/60 border-white/10 text-white hover:text-rose-400"}`}
                          >
                            <Heart size={14} className={currentSt.likesVoted ? "fill-current" : ""} />
                          </button>
                          <span className="text-[10px] text-white font-mono font-black mt-1 shadow-sm">{currentSt.likes}</span>
                        </div>

                        {/* Commments */}
                        <div className="flex flex-col items-center">
                          <button
                            onClick={() => {
                              addNotification?.("Vshorts", "Mở bảng tin báp bình luận video này...", "info");
                            }}
                            className="p-2.5 rounded-full bg-black/60 border border-white/10 text-white hover:text-purple-400 hover:scale-110 active:scale-95 transition-all shadow-lg"
                          >
                            <MessageSquare size={14} />
                          </button>
                          <span className="text-[10px] text-white font-mono font-black mt-1 shadow-sm">{currentSt.commentsCount}</span>
                        </div>

                        {/* Shares */}
                        <div className="flex flex-col items-center">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`Short link: ${currentSt.videoUrl}`);
                              addNotification?.("Chia sẻ", "Đã sao chép đường dẫn video Vshort!", "success");
                              const copy = [...vshorts];
                              copy[activeVshortIndex].sharesCount += 1;
                              setVshorts(copy);
                              localStorage.setItem("vplay_vconnect_vshorts", JSON.stringify(copy));
                            }}
                            className="p-2.5 rounded-full bg-black/60 border border-white/10 text-white hover:text-blue-400 hover:scale-110 active:scale-95 transition-all shadow-lg"
                            title="Sao chép liên kết"
                          >
                            <Share2 size={14} />
                          </button>
                          <span className="text-[10px] text-white font-mono font-black mt-1 shadow-sm">{currentSt.sharesCount}</span>
                        </div>

                      </div>

                      {/* Video descriptions details */}
                      <div className="absolute bottom-4 left-4 right-16 z-20 space-y-1 bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-md">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-[11px] text-white block truncate max-w-[120px]">{currentSt.userName}</span>
                          {isUserVerified(currentSt.userEmail) && (
                            <ShieldCheck size={11} className="text-sky-400 fill-current shrink-0" />
                          )}
                          <span className="text-[8.5px] text-slate-400 font-mono italic max-w-[80px] truncate block">@{currentSt.userEmail.split("@")[0]}</span>
                        </div>
                        <p className="text-[10.5px] text-slate-100 line-clamp-3 leading-relaxed font-sans font-medium">{currentSt.title}</p>
                      </div>

                    </div>
                  );
                })()
              )}

              {/* Navigation and paginator buttons */}
              {vshorts.length > 1 && (
                <div className="flex justify-center gap-3 w-full max-w-sm pb-2 pt-1 shrink-0">
                  <button
                    onClick={() => {
                      if (activeVshortIndex > 0) {
                        setActiveVshortIndex(activeVshortIndex - 1);
                      } else {
                        setActiveVshortIndex(vshorts.length - 1);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[9.5px] font-black uppercase tracking-wider transition-all"
                  >
                    <ArrowLeft size={11} />
                    <span>Lùi lại</span>
                  </button>

                  <button
                    onClick={() => {
                      if (activeVshortIndex < vshorts.length - 1) {
                        setActiveVshortIndex(activeVshortIndex + 1);
                      } else {
                        setActiveVshortIndex(0);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[9.5px] font-black uppercase tracking-wider transition-all"
                  >
                    <span>Tiếp theo</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* VSTORE ONLINE SHOPPING AND MARKETPLACE SUB-TAB */}
        {/* ==================================================== */}
        {vconnectSubTab === "vstore" && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            
            {/* VSTORE SHOP HEADER */}
            <div className="bg-[#141416]/90 border border-white/5 rounded-[32px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10" />
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Chợ điện tử vStore Online</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Sản phẩm chất bọc, gaming gear, phụ kiện thiết bị của cộng đồng vPlay</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 p-2 bg-black/40 rounded-xl border border-white/5 flex-1 md:flex-none">
                  <Search size={14} className="text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Tìm sản phẩm..." 
                    className="bg-transparent border-none outline-none text-xs text-white placeholder-slate-500 font-bold w-full md:w-36 font-sans text-left"
                    value={vstoreSearchQuery}
                    onChange={(e) => setVstoreSearchQuery(e.target.value)}
                  />
                  {vstoreSearchQuery && (
                    <button onClick={() => setVstoreSearchQuery("")} className="text-slate-500 hover:text-white">
                      <X size={12} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (lite) {
                      addNotification?.("Yêu cầu đăng nhập", "Bạn cần đăng nhập để đăng bán sản phẩm!", "warning");
                      onLogin();
                    } else {
                      setShowAddProductModal(true);
                    }
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white rounded-xl text-[10.5px] font-black uppercase tracking-wider flex items-center gap-2 shadow-lg"
                >
                  <Plus size={14} />
                  <span>Đăng bán sản phẩm</span>
                </button>
              </div>
            </div>

            {/* CATEGORIES HORIZONTAL FLOW */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
              {["Tất cả", "Gaming Gear", "Phụ kiện", "Thời trang", "Công nghệ", "Dịch vụ"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setVstoreCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 ${vstoreCategoryFilter === cat ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/10" : "bg-[#141416] border-transparent text-slate-400 hover:text-white"}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* PRODUCT GRID LISTING */}
            {(() => {
              const filtered = vstoreProducts.filter(p => {
                const matchesCat = vstoreCategoryFilter === "Tất cả" || p.category === vstoreCategoryFilter;
                const matchesQuery = p.title.toLowerCase().includes(vstoreSearchQuery.toLowerCase()) || p.desc.toLowerCase().includes(vstoreSearchQuery.toLowerCase());
                return matchesCat && matchesQuery;
              });

              if (filtered.length === 0) {
                return (
                  <div className="py-12 bg-[#141416]/50 rounded-[32px] border border-dashed border-white/5 flex flex-col items-center justify-center text-center">
                    <ShoppingBag size={48} className="text-slate-600 mb-3 animate-bounce" />
                    <h4 className="text-base font-bold text-slate-400">Không tìm thấy sản phẩm nào</h4>
                    <p className="text-xs text-slate-500 mt-1">Vui lòng thử đổi từ khóa tìm kiếm hoặc lọc danh mục khác!</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((prod) => (
                    <div 
                      key={prod.id} 
                      className="bg-[#141416] border border-white/5 rounded-[28px] overflow-hidden shadow-xl transition-all group hover:scale-[1.02] hover:border-emerald-500/20 flex flex-col justify-between"
                    >
                      <div>
                        {/* Image display with category badge */}
                        <div className="relative h-48 bg-slate-900 overflow-hidden">
                          <img 
                            src={prod.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80"} 
                            alt={prod.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                          <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                            {prod.category}
                          </div>
                        </div>

                        {/* Middle body content */}
                        <div className="p-5 space-y-3.5">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              {/* Display Vendor block */}
                              <div className="flex items-center gap-1.5">
                                <img src={prod.sellerPhoto || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"} className="w-4 h-4 rounded-full object-cover" />
                                <span className="text-[10px] font-bold text-slate-400 truncate max-w-[100px]">{prod.seller}</span>
                              </div>
                              <span className="text-[9.5px] font-bold text-amber-500 flex items-center gap-0.5 shrink-0">
                                ⭐ {prod.rating || 5.0}
                              </span>
                            </div>
                            <h4 className="text-sm font-extrabold text-white mt-2 group-hover:text-emerald-400 transition-colors line-clamp-1">{prod.title}</h4>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 min-h-[32px]">{prod.desc}</p>
                        </div>
                      </div>

                      {/* Footer buying action */}
                      <div className="p-5 pt-0 border-t border-white/5 bg-black/20 flex items-center justify-between gap-3 mt-auto">
                        <div className="text-left">
                          <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-black">Giá quy đổi</span>
                          <span className="text-emerald-400 font-mono font-black text-sm">{prod.price} <span className="text-[10px] font-normal uppercase">VP</span></span>
                          <span className="block text-[9px] text-slate-500">~ {(prod.price * 2500).toLocaleString("vi-VN")}đ</span>
                        </div>
                        
                        <button
                          onClick={() => {
                            if (lite) {
                              addNotification?.("Yêu cầu đăng nhập", "Bạn hãy đăng nhập vào vPlay để thực hiện giao dịch!", "warning");
                              onLogin();
                            } else {
                              setBuyingProduct(prod);
                            }
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-95 transition-all text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-lg shadow-emerald-950/20"
                        >
                          Mua ngay
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ==================================================== */}
        {/* MEMBER PROFILE SETTINGS AND EDIT SCREEN */}
        {/* ==================================================== */}
        {vconnectSubTab === "profile" && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            <div className="max-w-2xl mx-auto bg-[#141416] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl relative">
              
              {/* Cover Banner Cover display */}
              <div className="relative h-44 bg-slate-800 overflow-hidden">
                <img src={profileCover} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40" />
              </div>

              {/* Avatar position overlapped on Cover Banner */}
              <div className="relative px-6 -mt-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4 z-10 pb-6 border-b border-white/5 bg-[#141416]">
                <div className="flex items-end gap-3.5">
                  <div className="relative shrink-0">
                    <img src={profileAvatar} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-[#141416] bg-slate-900 object-cover" />
                  </div>

                  <div className="pb-1 text-left">
                    <h3 className="text-base font-black text-white flex items-center gap-1.5 leading-normal">
                      {profileName}
                      {isUserVerified(currentUserEmail) && (
                        <ShieldCheck size={15} className="text-sky-400 fill-current shrink-0" />
                      )}
                    </h3>
                    <span className="text-[10px] text-purple-400 font-mono font-bold block leading-none">@{profileId}</span>
                    <span className="text-[8.5px] text-slate-500 font-mono leading-none">{currentUserEmail}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[9px] font-bold text-slate-400 block mb-1">Cấu hình hồ sơ</span>
                  <p className="text-[10px] text-purple-400 font-semibold bg-purple-500/10 px-2.5 py-1.5 rounded-lg border border-purple-500/20 inline-block">Chỉnh sửa ở mục Cài đặt Vconnect</p>
                </div>
              </div>

              {/* Readonly profile details space */}
              <div className="p-6 space-y-6 text-left">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#a855f7] font-mono block">Giới thiệu</span>
                  <p className="text-slate-300 text-xs leading-relaxed bg-black/35 p-4 rounded-2xl border border-white/5 font-medium whitespace-pre-wrap">
                    {profileBio || "Chưa có tiểu sử ngắn."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-black/35 p-4 rounded-xl border border-white/5 flex items-center gap-3">
                    <MapPin size={16} className="text-purple-400" />
                    <div>
                      <span className="text-[9px] font-black text-slate-500 uppercase block leading-tight">Nơi ở</span>
                      <span className="text-xs text-white font-bold">{profileHometown || "Không xác định"}</span>
                    </div>
                  </div>

                  <div className="bg-black/35 p-4 rounded-xl border border-white/5 flex items-center gap-3">
                    <Calendar size={16} className="text-indigo-400" />
                    <div>
                      <span className="text-[9px] font-black text-slate-500 uppercase block leading-tight">Ngày sinh</span>
                      <span className="text-xs text-white font-bold">{profileBirth || "Chưa thiết lập"}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-600/10 border border-purple-500/20 p-5 rounded-[24px] flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                    <Settings size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-white leading-tight">Cần cập nhật tên hiển thị hay thay đổi avatar?</p>
                    <p className="text-[10.5px] text-slate-400 mt-1 font-medium leading-relaxed">
                      Để thống nhất các phân hệ, chức năng chỉnh sửa thuộc tính trang cá nhân của bạn đã được chuyển dời hoàn toàn vào <b>Tab Cài đặt chính &gt; Cài đặt Vconnect &amp; Hồ sơ</b>.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Friend list, discovery search, messaging inbox */}
      {showFriendDrawer && (
        <div className="w-80 md:w-96 flex flex-col min-h-0 bg-black/40 backdrop-blur-3xl shrink-0 p-5 space-y-6">
          
          {/* USER QUICK CARD */}
          <div className="p-4 bg-gradient-to-r from-purple-950/20 to-pink-950/20 border border-purple-500/10 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={currentUserPhoto} alt="User" className="w-10 h-10 rounded-full border border-purple-400/30" />
              <div>
                <span className="font-bold text-xs text-white max-w-[120px] truncate block">{currentUserName}</span>
                <span className="text-[9px] text-purple-400 font-bold uppercase tracking-widest font-mono">Bảng cá nhân</span>
              </div>
            </div>
            
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8.5px] font-black text-rose-400 bg-rose-500/10 uppercase tracking-widest border border-rose-500/20 animate-pulse">
              <Radio size={10} /> Live
            </span>
          </div>

          {/* ACTIVE DISCOVERY / PEOPLE SEARCH BOX */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Khám Phá Bạn Bè</h3>
              <span className="text-[10px] bg-[#141416] text-slate-400 font-mono px-2 py-0.5 rounded-md">Mọi người</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-black/30 border-white/5 text-white text-xs">
              <Search size={14} className="text-slate-500" />
              <input 
                type="text" 
                placeholder="Tìm người dùng / Kết bạn mới..." 
                className="bg-transparent border-none outline-none text-[11px] w-full font-bold text-white placeholder-slate-500"
                value={peopleSearch}
                onChange={(e) => setPeopleSearch(e.target.value)}
              />
              {peopleSearch && (
                <button onClick={() => setPeopleSearch("")}>
                  <X size={12} className="text-slate-400 hover:text-white" />
                </button>
              )}
            </div>

            {/* PEOPLE FIND RESULT */}
            <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-2">
              {filteredPeople.map(p => {
                const isFriend = friends.includes(p.email);
                return (
                  <div key={p.email} className="p-2 border border-white/5 rounded-xl bg-black/20 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full border border-white/5" />
                      <div className="min-w-0">
                        <span className="font-bold text-[11px] block text-white leading-normal truncate">{p.name}</span>
                        <span className="text-[9px] text-slate-400 font-medium font-mono truncate block">{p.bio}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleAddFriend(p.email, p.name)}
                      className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        isFriend 
                          ? "bg-white/5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400" 
                          : "bg-purple-600 text-white hover:bg-purple-500"
                      }`}
                    >
                      {isFriend ? "Bỏ bạn" : "Thêm bạn"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DM INBOX & PARTY SECTIONS */}
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Trò Chuyện & Party</h3>
              
              <button
                onClick={handleCreateGroupParty}
                className="text-[9px] font-black bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1"
                title="Tạo nhóm hội Party"
              >
                <Plus size={10} />
                <span>Tạo Party</span>
              </button>
            </div>

            {/* CHAT CHANNELS LIST */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 min-h-[120px]">
              {chatRooms.map(rm => {
                const isActive = activeRoomId === rm.id;
                const lastMsg = rm.messages[rm.messages.length - 1];
                
                return (
                  <button
                    key={rm.id}
                    onClick={() => {
                      setActiveRoomId(rm.id);
                      setChatVoiceUrl("");
                    }}
                    className={`w-full text-left p-3 rounded-2xl flex items-start gap-3 border transition-all ${
                      isActive 
                        ? "bg-[#1c1c24] border-purple-500/30" 
                        : "bg-[#101012] border-white/5 hover:bg-[#151518]"
                    }`}
                  >
                    <img 
                      src={rm.avatar || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80"} 
                      alt={rm.name} 
                      className="w-9 h-9 rounded-full object-cover border border-white/10" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-white truncate max-w-[125px]">{rm.name}</span>
                        {rm.isGroup && (
                          <span className="px-1.5 py-0.5 bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 rounded text-[7.5px] font-black uppercase font-mono">
                            Party
                          </span>
                        )}
                      </div>
                      <p className="text-[9.5px] text-slate-400 font-medium truncate leading-relaxed">
                        {lastMsg ? `${lastMsg.senderName}: ${lastMsg.text || "[Voice thoại]"}` : "Chưa có tin nhắn"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* CHAT DISPLAY DRAWER PANEL */}
            {activeRoomId && (
              <div className="flex flex-col border border-white/5 bg-[#141416]/50 rounded-[24px] h-80 min-h-[300px] overflow-hidden">
                {/* Active chat title bar */}
                {(() => {
                  const activeRoom = chatRooms.find(r => r.id === activeRoomId);
                  if (!activeRoom) return null;

                  return (
                    <>
                      <div className="px-4 py-2 border-b border-white/5 bg-black/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={activeRoom.avatar || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80"} alt="" className="w-6 h-6 rounded-full" />
                          <span className="font-bold text-[11px] text-white truncate max-w-[150px]">{activeRoom.name}</span>
                        </div>
                        <button 
                          onClick={() => setActiveRoomId(null)}
                          className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white"
                        >
                          <X size={12} />
                        </button>
                      </div>

                      {/* Msg records scroll view */}
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-2.5 bg-[#0c0c0e]">
                        {activeRoom.messages.map(m => {
                          const isMe = m.senderEmail === currentUserEmail;
                          return (
                            <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start animate-fade-in"}`}>
                              <span className="text-[7.5px] text-slate-500 font-bold mb-0.5 font-mono">{m.senderName}</span>
                              <div className={`p-2.5 rounded-2xl max-w-[80%] text-[11px] font-medium leading-normal ${
                                isMe 
                                  ? "bg-purple-600 text-white rounded-tr-none" 
                                  : "bg-[#18181c] text-slate-200 rounded-tl-none border border-white/5"
                              }`}>
                                {m.text && <p className="font-sans whitespace-pre-wrap">{m.text}</p>}
                                {m.voiceUrl && (
                                  <div className="mt-1.5 flex items-center gap-2 min-w-40 scale-90 origin-left">
                                    <Mic size={10} className="text-purple-400" />
                                    <audio src={m.voiceUrl} controls className="h-4 w-full" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* INPUT WRITER OR VOICE AUDIO */}
                      <div className="p-2 border-t border-white/5 bg-black/30 space-y-1.5">
                        
                        {/* Voice comment pending trigger */}
                        {chatVoiceUrl && (
                          <div className="p-1 px-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[9.5px] text-purple-400 flex items-center justify-between">
                            <span className="font-black">Voice Mail ready</span>
                            <button onClick={() => setChatVoiceUrl("")}>
                              <Trash2 size={12} className="hover:text-rose-500" />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5">
                          {/* Microphone recorder toggle */}
                          <button
                            onMouseDown={() => startVoiceRecording("chat")}
                            onMouseUp={() => stopVoiceRecording("chat")}
                            className={`p-2 rounded-xl transition-all ${
                              isRecordingChat 
                                ? "bg-rose-600 text-white scale-110 duration-200 animate-pulse" 
                                : "bg-[#141416] hover:bg-white/5 text-purple-400"
                            }`}
                            title="Nhấn giữ để ghi âm và thả ra"
                          >
                            <Mic size={13} />
                          </button>

                          <input
                            type="text"
                            placeholder="Nhập tin nhắn..."
                            className="flex-1 bg-black/30 border border-white/5 rounded-xl text-[10.5px] font-medium px-3 py-2 text-white outline-none focus:border-purple-500/30"
                            value={chatInputText}
                            onChange={(e) => setChatInputText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSendChatMessage();
                            }}
                          />

                          <button
                            onClick={() => handleSendChatMessage()}
                            className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-500 active:scale-90 transition-all"
                          >
                            <Send size={11} />
                          </button>
                        </div>
                        {isRecordingChat && (
                          <span className="text-[7.5px] text-rose-400 font-bold block text-center font-mono">Đang ghi âm giữ nói... {recordDuration}s</span>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

          </div>

        </div>
      )}

      {/* --- FLOATING OVERLAY DIALOGS --- */}
      
      {/* 1. CREATION DIALOG */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-[#141416] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-5 border-b border-white/5 bg-black/40 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black uppercase text-white tracking-widest font-mono">Soạn Bài Vconnect</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Viết bài, đăng blog hoặc tạo khảo sát ý kiến</p>
                </div>
                <button 
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(false);
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handlePublishPost} className="p-6 space-y-4">
                
                {/* SELECT TYPE PANEL */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "post", label: "Bài đăng" },
                    { id: "blog", label: "Blog dài" },
                    { id: "poll", label: "Khảo sát" }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCreateType(tab.id as any)}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                        createType === tab.id 
                          ? "bg-purple-600 text-white border-purple-500" 
                          : "bg-black/20 border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* FIELDS FOR TITLE (BLOG/POLL) */}
                {(createType === "blog" || createType === "poll") && (
                  <div className="space-y-1 px-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiêu đề {createType === "blog" ? "Blog" : "Câu hỏi"}</label>
                    <input 
                      type="text" 
                      placeholder={createType === "blog" ? "Hành Trình VTV6 của tôi..." : "Sử dụng vPlay có thuận tiện không?"}
                      className="w-full bg-black/40 border border-white/5 rounded-xl text-xs font-semibold px-4 py-3 text-white outline-none focus:border-purple-500"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                )}

                {/* FIELDS FOR BLOG SPECIFIC */}
                {createType === "blog" && (
                  <div className="grid grid-cols-2 gap-3 px-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thể loại</label>
                      <select 
                        className="w-full bg-black/40 border border-white/5 rounded-xl text-xs font-medium px-3 py-2.5 text-white outline-none focus:border-purple-500"
                        value={blogCategory}
                        onChange={(e) => setBlogCategory(e.target.value)}
                      >
                        {["Technology", "Entertainment", "Education", "News", "Others"].map(cat => (
                          <option key={cat} value={cat} className="bg-[#141416] text-white">{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">URL Ảnh bìa (Cover)</label>
                      <input 
                        type="text" 
                        placeholder="https://..."
                        className="w-full bg-black/40 border border-white/5 rounded-xl text-xs px-3 py-2.5 text-white outline-none focus:border-purple-500"
                        value={blogCoverUrl}
                        onChange={(e) => setBlogCoverUrl(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* CONTENT AREA (POST / BLOG) */}
                {createType !== "poll" && (
                  <div className="space-y-1 px-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nội dung</label>
                    <textarea 
                      placeholder={createType === "blog" ? "Nhập nội dung blog chi tiết (hỗ trợ markdown)..." : "Chia sẻ tâm tư của bạn ngay lúc này..."}
                      className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl text-xs font-medium p-4 text-white outline-none focus:border-purple-500 resize-none"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>
                )}

                {/* POLL COMPONENT SPECIFIICS */}
                {createType === "poll" && (
                  <div className="space-y-2 px-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Danh mục các câu trả lời</label>
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`Mục lựa chọn ${idx + 1}`}
                          className="flex-1 bg-black/40 border border-white/5 rounded-xl text-xs px-3.5 py-2 text-white outline-none focus:border-purple-500"
                          value={opt}
                          onChange={(e) => {
                            const copy = [...pollOptions];
                            copy[idx] = e.target.value;
                            setPollOptions(copy);
                          }}
                        />
                        {pollOptions.length > 2 && (
                          <button 
                            type="button" 
                            onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                    {pollOptions.length < 4 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions([...pollOptions, ""])}
                        className="text-[9px] font-black uppercase text-purple-400 hover:text-white pt-1"
                      >
                        + Thêm ô chọn
                      </button>
                    )}
                  </div>
                )}

                {/* ATTACHMENT AND REAL VOICE RECORDING ROW (POST ONLY) */}
                {createType === "post" && (
                  <div className="p-4 bg-black/30 rounded-2xl border border-white/5 space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#a855f7]">Phương Tiện & Ghi Âm Mic</span>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      
                      {/* GHI ÂM (VOICE RECORDING) BUTTONS */}
                      <div className="flex items-center gap-2">
                        {isRecording ? (
                          <button
                            type="button"
                            onClick={() => stopVoiceRecording("post")}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse duration-500 shadow-md shadow-rose-950"
                          >
                            <Pause size={12} />
                            <span>Dừng ({recordDuration}s)</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startVoiceRecording("post")}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600/20 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-wider hover:bg-purple-600/30 transition-all"
                          >
                            <Mic size={12} />
                            <span>Ghi âm giọng</span>
                          </button>
                        )}
                        
                        {voiceUrl && (
                          <span className="text-[8.5px] bg-purple-500/10 text-purple-400 font-mono font-bold px-2 py-1 rounded">
                            Thoại sẵn sàng
                          </span>
                        )}
                      </div>

                      {/* FILE UPLOAD BUTTONS */}
                      <div className="flex items-center gap-2 relative">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleMediaUpload}
                          id="file-attachment"
                          className="hidden"
                        />
                        <label
                          htmlFor="file-attachment"
                          className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/5 bg-black/40 text-slate-300 text-[10px] font-bold uppercase tracking-wider hover:bg-white/5"
                        >
                          <Upload size={12} />
                          <span>Tải tệp</span>
                        </label>

                        {mediaUrl && (
                          <span className="text-[8.5px] bg-sky-500/10 text-sky-400 font-bold px-2 py-1 rounded">
                            Đã nạp file
                          </span>
                        )}
                      </div>

                    </div>
                    
                    {/* Trash preview files */}
                    {(mediaUrl || voiceUrl) && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setVoiceUrl("");
                            setMediaUrl("");
                            setMediaType("");
                            setSelectedFile(null);
                            setAudioBlob(null);
                          }}
                          className="text-[9px] font-semibold text-rose-500 hover:text-rose-400 flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          <span>Xóa tệp đính kèm</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowCreateModal(false);
                    }}
                    className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-400 hover:bg-white/5"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-purple-600 text-white shadow-lg cursor-pointer hover:brightness-110"
                  >
                    Đăng tải
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. STORIES READER MODAL PANEL */}
      <AnimatePresence>
        {selectedStoryIndex !== null && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-lg p-4">
            {(() => {
              const activeSt = stories[selectedStoryIndex];
              if (!activeSt) return null;

              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-md h-[480px] sm:h-[600px] bg-[#111115] border border-white/10 rounded-[36px] overflow-hidden flex flex-col justify-between p-6 relative shadow-2xl"
                >
                  {/* Top Progress bars inside stories */}
                  <div className="flex gap-1 z-20">
                    {stories.map((st, i) => {
                      let pct = 0;
                      if (i < selectedStoryIndex) pct = 100;
                      if (i === selectedStoryIndex) pct = activeStoryProgress;
                      
                      return (
                        <div key={st.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-[#a855f7] transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      );
                    })}
                  </div>

                  {/* Creator name tags & close */}
                  <div className="flex items-center justify-between mt-3 z-20">
                    <div className="flex items-center gap-2.5">
                      <img src={activeSt.userPhoto} alt="" className="w-8 h-8 rounded-full border border-[#a855f7]" />
                      <div>
                        <span className="font-bold text-[11px] text-white block leading-normal">{activeSt.userName}</span>
                        <span className="text-[8.5px] text-slate-400 leading-none">{activeSt.userEmail}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedStoryIndex(null)}
                      className="p-1 rounded-full bg-black/40 hover:bg-black/60 text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* IMAGES OR TEXTS CENTRAL CONTAINER */}
                  <div className="flex-1 flex items-center justify-center p-4 relative z-10 my-4">
                    {activeSt.mediaType === "text" && (
                      <div className="p-8 bg-gradient-to-tr from-purple-900 to-indigo-950 border border-purple-500/20 rounded-2xl text-center shadow-lg">
                        <p className="text-sm font-bold text-slate-100 italic leading-relaxed whitespace-pre-wrap font-sans">
                          "{activeSt.textContent}"
                        </p>
                      </div>
                    )}

                    {activeSt.mediaType === "image" && activeSt.mediaUrl && (
                      <img src={activeSt.mediaUrl} alt="Story visual" className="max-h-[300px] w-full object-contain rounded-2xl" />
                    )}

                    {activeSt.mediaType === "voice" && (
                      <div className="p-6 bg-gradient-to-r from-purple-950/20 to-indigo-950/20 border border-purple-500/30 rounded-2xl text-center space-y-3 shadow-lg flex flex-col items-center">
                        <Mic size={24} className="text-purple-400 animate-bounce" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">Tin thoại story</span>
                        <audio src={activeSt.voiceUrl} controls autoPlay className="h-8 max-w-[200px]" />
                      </div>
                    )}
                  </div>

                  {/* NAVIGATION CONTROL CHEVRONS */}
                  <div className="flex justify-between items-center mt-3 z-10 shrink-0">
                    <button
                      onClick={() => {
                        if (selectedStoryIndex > 0) {
                          setSelectedStoryIndex(selectedStoryIndex - 1);
                          setActiveStoryProgress(0);
                        }
                      }}
                      disabled={selectedStoryIndex === 0}
                      className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white disabled:opacity-20"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Vconnect Story Feed</span>

                    <button
                      onClick={() => {
                        if (selectedStoryIndex < stories.length - 1) {
                          setSelectedStoryIndex(selectedStoryIndex + 1);
                          setActiveStoryProgress(0);
                        } else {
                          setSelectedStoryIndex(null);
                        }
                      }}
                      className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                </motion.div>
              );
            })()}
          </div>
        )}
      </AnimatePresence>

      {/* 3. ADD STORY DIALOG */}
      <AnimatePresence>
        {showAddStoryModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#141416] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="font-mono font-black text-xs uppercase tracking-widest">Tạo Story Tin Tức</span>
                <button onClick={() => setShowAddStoryModal(false)}>
                  <X size={16} className="text-slate-400 hover:text-white" />
                </button>
              </div>

              {/* story type selector */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/30 rounded-xl">
                {["text", "image", "voice"].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewStoryType(type as any)}
                    className={`py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                      newStoryType === type ? "bg-purple-600 text-white" : "text-slate-400"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {newStoryType === "text" && (
                <textarea
                  placeholder="Nhập nội dung châm ngôn của câu chuyện..."
                  className="w-full h-24 bg-black/30 border border-white/5 rounded-2xl p-3.5 text-xs font-semibold text-white outline-none focus:border-purple-500 resize-none font-sans"
                  value={newStoryText}
                  onChange={(e) => setNewStoryText(e.target.value)}
                />
              )}

              {newStoryType === "image" && (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400">URL Ảnh</span>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-black/30 border border-white/5 rounded-xl text-xs px-3 py-2 text-white outline-none focus:border-purple-500"
                    value={newStoryFileUrl}
                    onChange={(e) => setNewStoryFileUrl(e.target.value)}
                  />
                </div>
              )}

              {newStoryType === "voice" && (
                <div className="p-3.5 bg-black/30 border border-white/5 rounded-2xl flex flex-col items-center gap-3">
                  <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Bộ Ghi Âm Micron</span>
                  
                  {isRecording ? (
                    <button
                      onClick={() => stopVoiceRecording("post")}
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[9px] font-black uppercase"
                    >
                      DỪNG ({recordDuration}s)
                    </button>
                  ) : (
                    <button
                      onClick={() => startVoiceRecording("post")}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-[9px] font-black uppercase"
                    >
                      GHI ÂM THOẠI
                    </button>
                  )}

                  {voiceUrl && (
                    <span className="text-[8.5px] bg-purple-500/10 text-purple-400 font-mono font-bold px-1 py-0.5 rounded">
                      Sẵn sàng đăng
                    </span>
                  )}
                </div>
              )}

              <button
                onClick={handlePublishStory}
                className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-purple-500 active:scale-95 transition-all"
              >
                ĐĂNG TIN STORY
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. COMMENTS DRAWER (SIDE EXPANSION CARD SHEET) */}
      <AnimatePresence>
        {activeCommentsPostId && (
          <div className="fixed inset-0 z-[999] flex justify-end bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-full max-w-md h-full bg-[#111115] border-l border-white/5 shadow-2xl flex flex-col"
            >
              <div className="px-5 py-4 border-b border-white/5 bg-black/40 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-200 font-mono">Phản Hồi Vconnect</h3>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider">Danh sách bình luận thoại & chữ</span>
                </div>
                <button 
                  onClick={() => {
                    setActiveCommentsPostId(null);
                    setCommentVoiceUrl("");
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Comments lists */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                {(() => {
                  const currentPost = items.find(p => p.id === activeCommentsPostId);
                  const comments = currentPost?.comments || [];
                  if (comments.length === 0) {
                    return (
                      <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 space-y-1">
                        <MessageCircle size={24} />
                        <span className="text-xs font-bold text-slate-400">Chưa có bình luận nào</span>
                        <p className="text-[10px] text-slate-500">Hãy là người đưa cuộc trò chuyện bắt đầu!</p>
                      </div>
                    );
                  }

                  return comments.map(cm => (
                    <div key={cm.id} className="p-3 bg-black/30 border border-white/5 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2.5">
                        <img src={cm.userPhoto || currentUserPhoto} alt="" className="w-6 h-6 rounded-full" />
                        <div>
                          <span className="font-bold text-[11px] text-purple-400">{cm.userName}</span>
                          <span className="text-[8.5px] text-slate-500 font-medium font-mono ml-2">
                            {new Date(cm.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {cm.content && <p className="text-[11px] text-slate-200 font-medium font-sans leading-relaxed">{cm.content}</p>}
                      {cm.voiceUrl && (
                        <div className="p-1 px-2 border border-purple-500/10 bg-purple-500/5 rounded-xl flex items-center gap-2">
                          <Mic size={11} className="text-purple-400 shrink-0" />
                          <audio src={cm.voiceUrl} controls className="h-5 w-full text-xs" />
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>

              {/* Writing comments */}
              <div className="p-4 border-t border-white/5 bg-black/40 space-y-3">
                {commentVoiceUrl && (
                  <div className="p-1 px-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[9.5px] text-purple-400 flex items-center justify-between">
                    <span className="font-black">Voice Comment Clip loaded</span>
                    <button onClick={() => setCommentVoiceUrl("")}>
                      <Trash2 size={12} className="hover:text-rose-500" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onMouseDown={() => startVoiceRecording("comment")}
                    onMouseUp={() => stopVoiceRecording("comment")}
                    className={`p-2.5 rounded-xl transition-all ${
                      isRecordingComment 
                        ? "bg-rose-600 text-white animate-pulse" 
                        : "bg-[#141416] border border-white/5 text-purple-400"
                    }`}
                    title="Ấn giữ để thu âm bình luận, thả để nạp"
                  >
                    <Mic size={14} />
                  </button>

                  <input
                    type="text"
                    placeholder="Bình luận bài viết..."
                    className="flex-1 bg-black/30 border border-white/5 rounded-xl text-xs font-semibold px-4 py-2 text-white outline-none focus:border-purple-500/50"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddComment();
                    }}
                  />

                  <button
                    onClick={handleAddComment}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 text-white font-black uppercase text-[10px] tracking-wider"
                  >
                    Gửi
                  </button>
                </div>
                {isRecordingComment && (
                  <p className="text-[7.5px] text-rose-400 font-bold block text-center font-mono">Đang thu âm giọng... ({recordDuration}s)</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. MODERATION REPORT MODAL */}
      <AnimatePresence>
        {reportingPostId && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#141416] border border-white/5 rounded-[32px] overflow-hidden p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-2 text-rose-500 border-b border-white/5 pb-2.5">
                <Flag size={18} />
                <span className="font-black font-mono text-xs uppercase tracking-widest">Báo Cáo Nội Dung</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Chọn lý do vi phạm</span>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-xl text-xs px-3.5 py-2.5 text-white outline-none focus:border-rose-500"
                >
                  {["Spam hoặc quấy rối", "Ảnh khỏa thân rác", "Bản quyền trí tuệ", "Tin tức lừa đảo giật gân", "Chứa nội dung công kích thù địch"].map(r => (
                    <option key={r} value={r} className="bg-[#141416] text-white">{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportingPostId(null)}
                  className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-slate-400"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSubmitReport}
                  className="px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white"
                >
                  Gửi báo cáo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. BLOG VIEWER FULL HEIGHT MODAL */}
      <AnimatePresence>
        {readingBlog && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-[#141416] border border-white/5 rounded-[36px] overflow-hidden flex flex-col h-[650px] shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 bg-black/40 flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/25 rounded-md text-[9px] font-black uppercase tracking-widest">
                    Vconnect Blog Reader
                  </span>
                </div>
                <button 
                  onClick={() => setReadingBlog(null)}
                  className="p-1.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
                {readingBlog.coverUrl && (
                  <div className="w-full h-56 rounded-3xl overflow-hidden bg-slate-800 border border-white/5">
                    <img src={readingBlog.coverUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white leading-tight">{readingBlog.title}</h3>
                  <div className="flex items-center gap-3">
                    <img src={readingBlog.userPhoto} alt="" className="w-8 h-8 rounded-full" />
                    <span className="text-xs font-bold text-slate-300">{readingBlog.userName}</span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(readingBlog.createdAt?.seconds ? readingBlog.createdAt.seconds * 1000 : readingBlog.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {readingBlog.content}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. VSHORTS UPLOADER MODAL popup */}
      <AnimatePresence>
        {showVshortUploadModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#141416] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-1.5 text-red-500">
                  <Film size={16} />
                  <span className="font-mono font-black text-xs uppercase tracking-widest text-white">Đăng tải Vshorts mới</span>
                </div>
                <button onClick={() => setShowVshortUploadModal(false)} className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white">
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-3">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Tiêu đề / Caption video (dưới 5 phút)</label>
                  <textarea
                    placeholder="Nhập caption tâm trạng hôm nay... #vplay #game #shorts"
                    className="w-full h-16 bg-black/30 border border-white/5 rounded-xl p-3 text-xs font-semibold text-white outline-none focus:border-purple-500 resize-none"
                    value={uploadVshortTitle}
                    onChange={(e) => setUploadVshortTitle(e.target.value)}
                  />
                </div>

                {/* Video URL Link */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Đường dẫn URL Video (.mp4 / loop stream)</label>
                  <input
                    type="text"
                    placeholder="Dán link video hoặc để trống để dùng mẫu..."
                    className="w-full bg-black/30 border border-white/5 rounded-xl text-xs px-3 py-2 text-white outline-none focus:border-purple-500"
                    value={uploadVshortUrl}
                    onChange={(e) => setUploadVshortUrl(e.target.value)}
                  />
                  <span className="text-[8px] text-slate-500 block leading-normal pt-1">
                    * Thử dán một đường dẫn video MP4 bất kỳ, hoặc để trống hệ thống sẽ tự động cấp một video mẫu vũ trụ trừu tượng siêu bắt mắt!
                  </span>
                </div>

                {/* Preset suggestions */}
                <div className="p-2.5 bg-black/30 rounded-xl space-y-1">
                  <span className="text-[7.5px] text-slate-400 font-extrabold uppercase tracking-wider block">Gợi ý video mẫu của vPlay:</span>
                  <div className="flex flex-col gap-1 text-[8.5px]">
                    {[
                      { name: "✨ Cosmic Tunnel Loop", url: "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c0227e339f400cf9e2da0ede11234720&profile_id=139&oauth2_token_id=57447761" },
                      { name: "🌊 Waves & Water Flow", url: "https://player.vimeo.com/external/434045526.sd.mp4?s=c0030ad2c9b7de23ce3e5de9a7bb918342248882&profile_id=165&oauth2_token_id=57447761" },
                      { name: "👾 Retro Gaming Grid", url: "https://player.vimeo.com/external/340333241.sd.mp4?s=f52bc1d3e38c3132e01dfdb69b4c0420f18858e3&profile_id=139&oauth2_token_id=57447761" }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setUploadVshortUrl(item.url);
                          addNotification?.("Gợi ý", `Đã chọn video mẫu ${item.name}!`, "info");
                        }}
                        className="text-left py-1 text-[#a855f7] hover:text-white truncate"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 border-t border-white/5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowVshortUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-[9px] font-black uppercase text-slate-400 hover:text-white"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleUploadVshort}
                  className="px-4 py-2 rounded-xl text-[9px] font-black uppercase bg-red-600 hover:bg-red-500 text-white shadow-lg tracking-wider"
                >
                  Đăng Video
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. VSTORE BUY PRODUCT CONFIRMATION MODAL */}
      <AnimatePresence>
        {buyingProduct && (
          <div className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111115] border border-white/10 p-6 rounded-[32px] max-w-md w-full shadow-2xl relative text-left"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShoppingBag size={20} />
                  <h3 className="font-extrabold uppercase text-xs tracking-wider">Xác nhận giao dịch</h3>
                </div>
                <button 
                  onClick={() => setBuyingProduct(null)}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Product Info Display */}
              <div className="flex gap-4 bg-black/30 p-4 rounded-2xl border border-white/5 mb-5">
                <img 
                  src={buyingProduct.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=150&q=80"} 
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/10" 
                />
                <div className="min-w-0">
                  <span className="text-[9px] uppercase font-black tracking-widest text-emerald-400 block">{buyingProduct.category}</span>
                  <h4 className="font-bold text-sm text-white truncate mt-0.5">{buyingProduct.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">Người bán: {buyingProduct.seller}</p>
                </div>
              </div>

              {/* Summary details */}
              <div className="space-y-3.5 mb-6 text-xs text-slate-300">
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400 font-medium">Số dư hiện tại:</span>
                  <span className="font-bold text-white font-mono">{localStorage.getItem("vplay_unlimited_vpoints") === "true" ? "∞" : vpoints} VP</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-slate-400 font-medium">Giá sản phẩm:</span>
                  <span className="font-bold text-emerald-400 font-mono">-{buyingProduct.price} VP</span>
                </div>
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-slate-400 font-bold">Sau giao dịch:</span>
                  <span className="font-extrabold text-white font-mono">
                    {localStorage.getItem("vplay_unlimited_vpoints") === "true" ? "∞" : (vpoints - buyingProduct.price < 0 ? "Chưa đủ số dư" : `${vpoints - buyingProduct.price} VP`)}
                  </span>
                </div>
              </div>

              {/* Actions button */}
              <div className="flex gap-3">
                <button
                  onClick={() => setBuyingProduct(null)}
                  className="flex-1 py-3 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  Hủy giao dịch
                </button>
                <button
                  onClick={() => {
                    const isUnlimited = localStorage.getItem("vplay_unlimited_vpoints") === "true";
                    if (!isUnlimited && vpoints < buyingProduct.price) {
                      addNotification?.("Số dư không đủ", `Bạn cần tích lũy thêm Vpoints để mua sản phẩm từ ${buyingProduct.seller}!`, "warning");
                      setBuyingProduct(null);
                      return;
                    }
                    if (!isUnlimited && setVpoints) {
                      setVpoints((p: number) => p - buyingProduct.price);
                    }
                    addNotification?.("Giao dịch thành công!", `Bạn vừa sở hữu "${buyingProduct.title}". Vui lòng kiểm tra V-mail để nhận key/mã nhận hàng!`, "success");
                    setBuyingProduct(null);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-95 transition-all text-white text-[10px] font-black uppercase tracking-widest rounded-2xl cursor-pointer text-center"
                >
                  Xác nhận thanh toán
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. VSTORE COMMUNTIY SELL/POST NEW PRODUCT MODAL */}
      <AnimatePresence>
        {showAddProductModal && (
          <div className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111115] border border-white/10 p-6 rounded-[32px] max-w-lg w-full shadow-2xl relative text-left"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-black uppercase">
                  <ShoppingBag size={20} />
                  <span className="text-xs">Đăng bán sản phẩm lên vStore</span>
                </div>
                <button 
                  onClick={() => setShowAddProductModal(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newProdTitle.trim() || !newProdDesc.trim() || newProdPrice <= 0) {
                  addNotification?.("Hệ thống", "Không thành công! Bạn hãy nhập đầy đủ thông tin sản phẩm.", "warning");
                  return;
                }
                const newObj = {
                  id: "vsp_" + Date.now(),
                  title: newProdTitle,
                  category: newProdCategory,
                  price: Number(newProdPrice),
                  image: newProdImage.trim() || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80",
                  desc: newProdDesc,
                  seller: profileName,
                  sellerPhoto: profileAvatar,
                  likes: 0,
                  comments: 0,
                  rating: 5.0
                };
                setVstoreProducts([newObj, ...vstoreProducts]);
                addNotification?.("Đăng bán thành công!", `Sản phẩm "${newProdTitle}" đã được đưa lên Kênh Vstore!`, "success");
                
                // Clear state
                setNewProdTitle("");
                setNewProdDesc("");
                setNewProdPrice(100);
                setNewProdImage("");
                setShowAddProductModal(false);
              }} className="space-y-4">
                
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Tên sản phẩm *</label>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: Bàn phím cơ Custom vPlay Pro..."
                    value={newProdTitle}
                    onChange={(e) => setNewProdTitle(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-black/40 border border-white/5 text-xs text-white focus:border-emerald-500/50 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Giá quy đổi (Vpoints) *</label>
                    <input
                      type="number"
                      required
                      min={10}
                      max={10000}
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(Number(e.target.value))}
                      className="w-full p-3 rounded-2xl bg-black/40 border border-white/5 text-xs text-white focus:border-emerald-500/50 outline-none font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Danh mục sản phẩm *</label>
                    <select
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-black/40 border border-white/5 text-xs text-white focus:border-emerald-500/50 outline-none"
                    >
                      {["Gaming Gear", "Phụ kiện", "Thời trang", "Công nghệ", "Dịch vụ"].map(opt => (
                        <option value={opt} key={opt} className="bg-[#111115]">{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Mô tả sản phẩm *</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Nhập chất liệu, tính năng nổi bật hoặc mã nạp game/key để người mua nắm rõ nhé..."
                    value={newProdDesc}
                    onChange={(e) => setNewProdDesc(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-black/40 border border-white/5 text-xs text-white focus:border-emerald-500/50 outline-none resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Đường dẫn ảnh hoặc chọn mẫu nhanh</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={newProdImage}
                    onChange={(e) => setNewProdImage(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-black/40 border border-white/5 text-xs text-white focus:border-[#10b981] outline-none font-mono"
                  />
                  {/* Quick samples selection */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[
                      { name: "Keyboard", url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=300&q=80" },
                      { name: "Headphone", url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80" },
                      { name: "Áo thun", url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&q=80" },
                      { name: "Củ sạc", url: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=300&q=80" }
                    ].map((sm, sx) => (
                      <button
                        key={sx}
                        type="button"
                        onClick={() => {
                          setNewProdImage(sm.url);
                          addNotification?.("Ảnh nạp", `Đã chọn ảnh đại diện mẫu cho ${sm.name}!`, "info");
                        }}
                        className="p-1 px-2.5 rounded-lg border border-white/5 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 text-[9.5px] font-bold text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                      >
                        {sm.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 border-t border-white/5 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddProductModal(false)}
                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-white cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-lg animate-pulse"
                  >
                    Đăng sản phẩm
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
