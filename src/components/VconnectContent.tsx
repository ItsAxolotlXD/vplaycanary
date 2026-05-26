import React, { useState, useEffect, useRef, useMemo, ChangeEvent, FormEvent } from "react";
import { 
  Film, Heart, MessageSquare, Share2, Star, ShieldAlert, Flag, Upload, Play, Pause, Trash2, 
  Send, Plus, Users, UserPlus, Search, X, Volume2, Mic, ArrowRight, ArrowLeft, Bookmark, 
  RefreshCw, Sparkles, Smile, MessageCircle, MoreHorizontal, Radio, ShieldCheck, HeartOff,
  ChevronLeft, ChevronRight
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

export function VconnectContent({ 
  isDark, 
  user, 
  liquidGlass, 
  onLogin, 
  featureFlags, 
  lite = false, 
  addNotification 
}: VconnectContentProps) {
  // Feed item states
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "media" | "post_blog" | "poll" | "favorites">("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Fetch current user display info
  const currentUserEmail = user?.email || "guest@vplay.local";
  const currentUserName = user?.displayName || user?.email?.split("@")[0] || "Khách Danh Tính";
  const currentUserPhoto = user?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";

  // Dummy list of seed people for discovery
  const defaultPeople: Person[] = [
    { email: "developer@vplay.local", name: "Vplay OS Developer", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80", status: "online", bio: "Hệ điều hành vPlay OS và các tiện ích Board." },
    { email: "music_queen@vplay.local", name: "DJ Minari", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", status: "online", bio: "Đam mê âm nhạc, DJ, lướt vStore tìm nhạc hay." },
    { email: "v_reporter@vplay.local", name: "V-Canary News", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", status: "offline", bio: "Tin tức VTV nóng hổi, canaries cập nhật 24/7." },
    { email: "gamer_pro@vplay.local", name: "Phú Sát Gamer", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80", status: "online", bio: "Top 1 Thách Đấu vPlay, lập hội party ngay nào!" },
    { email: "cosmic_explorer@vplay.local", name: "Trâm Anh Vũ Trụ", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80", status: "offline", bio: "UFO, thiên văn học, mê lướt Pizza Labs." }
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

    // Load Stories
    const savedStories = localStorage.getItem("vplay_vconnect_stories");
    if (savedStories) {
      setStories(JSON.parse(savedStories));
    } else {
      setStories(defaultStories);
      localStorage.setItem("vplay_vconnect_stories", JSON.stringify(defaultStories));
    }

    if (lite) {
      // Offline LocalStorage Mode
      const savedFeed = localStorage.getItem("vplay_vconnect_feed");
      if (savedFeed) {
        setItems(JSON.parse(savedFeed));
      } else {
        setItems(defaultPosts);
        localStorage.setItem("vplay_vconnect_feed", JSON.stringify(defaultPosts));
      }
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

    // Interactive AUTO REPLY generator to simulate immersive social environment
    const room = chatRooms.find(r => r.id === targetRoomId);
    if (room && !textOverride) {
      setTimeout(() => {
        const senderAnswers = [
          "Tuyệt vời quá! Mình rất đồng tình luôn nè. 💯",
          "Thú vị thật đó, hôm nào làm ly cà phê chém gió tiếp nhé!",
          "Chuẩn luôn ad ơi, vPlay OS chạy ngày một mượt ra đó!",
          "Ủng hộ ad phát triển thêm mảng micro voice chat này nhé!",
          "Vừa lướt Vconnect thấy bài đăng của bạn đỉnh quá, thả tim luôn!"
        ];
        const randomAnswer = senderAnswers[Math.floor(Math.random() * senderAnswers.length)];
        const systemPartnerEmail = room.participants.find(p => p !== currentUserEmail) || "system@vplay.local";
        const systemPartnerName = room.isGroup ? "Phú Sát Gamer" : room.name;

        const botReply: ChatMessage = {
          id: "msg-reply-" + Date.now(),
          senderEmail: systemPartnerEmail,
          senderName: systemPartnerName,
          text: randomAnswer,
          createdAt: new Date().toISOString()
        };

        const reUpdatedRooms = updatedRooms.map(rm => {
          if (rm.id === targetRoomId) {
            return {
              ...rm,
              messages: [...rm.messages, botReply]
            };
          }
          return rm;
        });
        setChatRooms(reUpdatedRooms);
        localStorage.setItem("vplay_vconnect_rooms", JSON.stringify(reUpdatedRooms));
      }, 2000);
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
              <Film size={22} className="text-[#a855f7]" />
              <h2 className="text-xl font-black uppercase tracking-tight text-white font-mono">
                Vconnect Social
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

        {/* FEED BODY */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          
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
                        <p className="text-sm text-slate-200 leading-relaxed font-sans">{post.content}</p>
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
                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{post.content}</p>
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

    </div>
  );
}
