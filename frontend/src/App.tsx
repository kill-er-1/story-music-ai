import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { 
  Sparkles, 
  Play, 
  RefreshCw, 
  Share2, 
  Download, 
  Edit3, 
  Check,
  Music,
  Mic2,
  Disc,
  ArrowRight,
  Wand2,
  Flame,
  Droplets,
  Wind
} from 'lucide-react';

import { sessionApi } from './api/client';
import type { StoryResponse, MusicInfo, SceneCard } from './types';
import { GlassCard } from './components/GlassCard';
import { PrimaryButton } from './components/PrimaryButton';
import { InkTransition } from './components/InkTransition';

// --- Constants ---
const APP_NAME = "EchoFrames"; 
const APP_SLOGAN = "把故事变成画，再唱成歌";

const QUOTES = [
  "念念不忘，必有回响 |",
  "每一个故事，都值得被大声唱出来 |",
  "让 AI 听懂你的沉默与狂欢 |"
];

const MOCK_DATA: StoryResponse = {
  summary: "这是一个关于“释怀”的故事。主角在深夜独自整理旧物，翻到了前任的信件。核心冲突是理性上想遗忘，感性上却在怀念。",
  agent_question: {
    dimension: "风格偏好",
    text: "这首歌，你脑海里响起的是激昂的宣泄，还是安静的独白？",
    options: [
      { id: "rock", label: "激昂宣泄 (Rock/Pop)", icon: "🔥" },
      { id: "ballad", label: "安静独白 (Piano/Ballad)", icon: "🎹" }
    ]
  },
  lyrics_a: {
    label: "版本 A：口语感 · 痛快",
    tags: ["节奏强", "直白"],
    content: [
      "我不恨你，我只是想不通",
      "为什么承诺最后都变成风",
      "烧掉信件，火光映红了瞳孔",
      "从此以后，你是你，我是我，互不相送"
    ],
    critic: "更像说出来的真心话，适合强爆发的副歌。"
  },
  lyrics_b: {
    label: "版本 B：意象感 · 诗意",
    tags: ["画面多", "深沉"],
    content: [
      "旧纸箱里沉睡着一片海",
      "打捞起那些生锈的对白",
      "火焰吞噬了最后一点依赖",
      "余烬里，并没有我想要的未来"
    ],
    critic: "文学性更强，适合营造电影般的氛围。"
  },
  hooks: [
    "我不恨你，我只是想不通",
    "你把我的雨天全带走了",
    "（自定义金句...）"
  ]
};

const SCENE_CARDS: SceneCard[] = [
  { 
    id: "card1", 
    title: "深海隧道", 
    desc: "一个人走在深海隧道里，周围只有心跳的回声。",
    audio_tags: "Reverb++, Low BPM, Spacious",
    visual_icon: <Droplets size={48} className="text-cyan-200" />,
    color: "from-blue-900 to-slate-900"
  },
  { 
    id: "card2", 
    title: "火焰信件", 
    desc: "将所有的信件丢进火盆，看火焰疯狂地吞噬一切。",
    audio_tags: "Distortion, High Energy, Fast",
    visual_icon: <Flame size={48} className="text-orange-400" />,
    color: "from-red-900 to-orange-900"
  },
  { 
    id: "card3", 
    title: "午后公园", 
    desc: "坐在旧公园的长椅上，看着气球慢慢飘向天空。",
    audio_tags: "Acoustic, Clean, Chill",
    visual_icon: <Wind size={48} className="text-emerald-200" />,
    color: "from-emerald-900 to-teal-900"
  }
];

// --- Animation Config ---
const contentVariants: Variants = {
  initial: { opacity: 0, scale: 0.98, filter: 'blur(8px)' },
  in: { 
    opacity: 1, 
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 1.2, ease: "easeOut", delay: 0.5 }
  },
  out: { 
    opacity: 0, 
    scale: 1.02,
    filter: 'blur(8px)',
    transition: { duration: 0.6 }
  }
};

export default function App() {
  const [currentStage, setCurrentStage] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Data States
  const [story, setStory] = useState('');
  const [apiData, setApiData] = useState<StoryResponse | null>(null);
  const [summary, setSummary] = useState('');
  const [agentChoice, setAgentChoice] = useState<string | null>(null);
  const [selectedLyrics, setSelectedLyrics] = useState<'A' | 'B'>('A');
  const [lyricsA, setLyricsA] = useState<string[]>([]);
  const [lyricsB, setLyricsB] = useState<string[]>([]);
  const [selectedHook, setSelectedHook] = useState(0);
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [tweakPrompt, setTweakPrompt] = useState('');
  const [musicInfo, setMusicInfo] = useState<MusicInfo | null>(null);
  
  // UI States
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Initialize session on mount
  useEffect(() => {
    sessionApi.createSession().then(data => setSessionId(data.session_id));
  }, []);

  const handleNextStage = async () => {
    if (!sessionId) return;
    
    setIsProcessing(true);

    try {
      if (currentStage === 0) {
        const data = await sessionApi.submitStory(sessionId, story);
        // Merge with mock data because backend is currently an MVP and doesn't return these fields
        const processedData: StoryResponse = {
          ...MOCK_DATA,
          ...data,
          // Explicitly ensure objects exist by using non-null assertion or fallback
          // since we know MOCK_DATA has everything.
          lyrics_a: data.lyrics_a || MOCK_DATA.lyrics_a,
          lyrics_b: data.lyrics_b || MOCK_DATA.lyrics_b,
          agent_question: data.agent_question || MOCK_DATA.agent_question,
          hooks: data.hooks || MOCK_DATA.hooks,
          summary: data.summary || MOCK_DATA.summary,
        };
        setApiData(processedData);
        setSummary(processedData.summary);
        setLyricsA(processedData.lyrics_a.content);
        setLyricsB(processedData.lyrics_b.content);
        // Transition after data is fetched
        setIsTransitioning(true);
        setTimeout(() => {
          setIsProcessing(false);
          setCurrentStage(1);
        }, 1000);
      } else if (currentStage === 1) {
        // Just transition, we'll lock lyrics in next step
        setIsTransitioning(true);
        setTimeout(() => {
          setIsProcessing(false);
          setCurrentStage(2);
        }, 1000);
      } else if (currentStage === 2) {
        const currentLyrics = selectedLyrics === 'A' ? lyricsA : lyricsB;
        const currentHook = apiData?.hooks[selectedHook] || '';
        await sessionApi.lockLyrics(sessionId, {
          lyrics: currentLyrics,
          language: 'zh',
          hook_line: currentHook
        });
        // Call generateStyles to ensure style_cards_json is set in backend session
        await sessionApi.generateStyles(sessionId);
        setIsTransitioning(true);
        setTimeout(() => {
          setIsProcessing(false);
          setCurrentStage(3);
        }, 1000);
      }
    } catch (error) {
      console.error("API Error:", error);
      setIsProcessing(false);
    }
  };

  const startMusicGeneration = async () => {
    if (!sessionId || !selectedScene) return;
    setIsProcessing(true);
    setGenerationProgress(0);

    try {
      const { job_id } = await sessionApi.generateMusic(sessionId, {
        scene_id: selectedScene,
        tweak_prompt: tweakPrompt
      });

      // Start polling
      const pollInterval = setInterval(async () => {
        try {
          const data = await sessionApi.getJobStatus(job_id);
          const { job, asset } = data;
          
          // Map status to progress for UI
          if (job.status === 'PENDING') setGenerationProgress(10);
          else if (job.status === 'PROCESSING') setGenerationProgress(50);
          else if (job.status === 'COMPLETED') {
            setGenerationProgress(100);
            clearInterval(pollInterval);
            setMusicInfo({
              music_id: job.job_id,
              title: "无题的情书", // Backend doesn't return title yet
              audio_url: asset?.url || '',
              style_tags: []
            });
            setIsProcessing(false);
            setIsTransitioning(true);
            setTimeout(() => {
              setCurrentStage(4);
            }, 1000);
          } else if (job.status === 'FAILED') {
            clearInterval(pollInterval);
            setIsProcessing(false);
            alert("Generation failed: " + (job.error_message || "Unknown error"));
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 2000);
    } catch (error) {
      console.error("Generation Error:", error);
      setIsProcessing(false);
    }
  };

  const handleTransitionComplete = () => {
    setIsTransitioning(false);
  };

  const restart = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStage(0);
      setStory('');
      setAgentChoice(null);
      setSelectedScene(null);
      setTweakPrompt('');
      // Re-create session
      sessionApi.createSession().then(data => setSessionId(data.session_id));
    }, 1000);
  };

  const getBackgroundGradient = () => {
    const defaultBg = "bg-gradient-to-br from-orange-300 via-rose-300 to-teal-600";
    if (currentStage === 3 && selectedScene) {
      const scene = SCENE_CARDS.find(s => s.id === selectedScene);
      if (scene?.id === 'scene1') return "bg-gradient-to-br from-teal-700 via-slate-600 to-blue-900";
      if (scene?.id === 'scene2') return "bg-gradient-to-br from-orange-400 via-red-400 to-stone-800";
      if (scene?.id === 'scene3') return "bg-gradient-to-br from-emerald-600 via-teal-500 to-slate-700";
    }
    return defaultBg;
  };

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden font-sans text-white transition-colors duration-[2000ms] ${getBackgroundGradient()}`}>
      <InkTransition isActive={isTransitioning} onComplete={handleTransitionComplete} />

      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 10, 0], opacity: [0.6, 0.4, 0.6] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[900px] h-[900px] bg-orange-200/30 rounded-full blur-[100px] mix-blend-soft-light" 
        />
        <motion.div 
           animate={{ scale: [1, 1.2, 1], rotate: [0, -15, 0], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[40%] -right-[10%] w-[800px] h-[800px] bg-teal-800/40 rounded-full blur-[120px] mix-blend-overlay" 
        />
      </div>

      {/* Top Branding */}
      <div className="absolute top-8 left-0 w-full flex justify-between items-center px-8 z-30">
        <div className="flex flex-col">
          <h1 className="font-bold text-2xl tracking-tighter flex items-center gap-2 drop-shadow-md">
            <div className="relative">
              <Disc className={`animate-spin-slow ${isProcessing ? 'text-white' : 'text-white/90'}`} /> 
              <div className="absolute inset-0 bg-white/30 blur-md rounded-full -z-10"></div>
            </div>
            {APP_NAME}
          </h1>
          <span className="text-xs text-white/70 tracking-widest uppercase font-medium">{APP_SLOGAN}</span>
        </div>
        {!isProcessing && currentStage < 4 && (
          <div className="hidden md:block">
            <AnimatePresence mode='wait'>
              <motion.p
                key={quoteIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 1 }}
                className="text-sm font-medium italic text-white/80 drop-shadow-sm"
              >
                {QUOTES[quoteIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-20 w-full max-w-5xl px-4">
        <AnimatePresence mode='wait'>
          
          {/* Stage 0: Story Intake */}
          {currentStage === 0 && (
            <motion.div key="stage0" variants={contentVariants} initial="initial" animate="in" exit="out" className="w-full max-w-2xl mx-auto">
              <GlassCard>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-orange-100 drop-shadow-sm">第一章：故事的种子</h2>
                  <p className="text-white/80">不需要华丽的辞藻，只需要真实的感受。</p>
                </div>
                <div className="relative group">
                  <textarea
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    placeholder="告诉我你的故事... (例如：深夜一个人喝着酒，想起了那个没能送出去的礼物...)"
                    className="w-full h-48 bg-black/5 rounded-2xl p-6 text-white placeholder-white/60 border border-white/20 focus:border-white/40 focus:bg-white/5 outline-none resize-none transition-all text-lg leading-relaxed shadow-inner backdrop-blur-md"
                    autoFocus
                  />
                  <div className="absolute bottom-4 right-4 text-xs text-white/60 font-mono">{story.length} 字</div>
                </div>
                <div className="mt-8 flex justify-end">
                  <PrimaryButton onClick={handleNextStage} disabled={!story.trim()} loading={isProcessing} text="生成摘要与灵感" />
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Stage 1: Brief & Clarification */}
          {currentStage === 1 && apiData && (
            <motion.div key="stage1" variants={contentVariants} initial="initial" animate="in" exit="out" className="w-full max-w-2xl mx-auto">
              <GlassCard>
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4 text-orange-100">
                    <Sparkles size={18} className="animate-pulse" />
                    <span className="text-sm font-bold uppercase tracking-wider">Agent 故事理解</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 border border-white/20 relative group hover:bg-white/10 transition-colors">
                    <textarea 
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-white text-lg leading-relaxed resize-none h-24"
                    />
                  </div>
                </div>
                <div className="space-y-4 animate-slide-up">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="bg-gradient-to-br from-white to-orange-200 text-orange-900 rounded-full w-7 h-7 flex items-center justify-center text-sm shadow-lg font-serif">?</span>
                    为了更懂你，我只确认一件事：
                  </h3>
                  <p className="text-white/90 text-lg pl-9 font-light">{apiData.agent_question.text}</p>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    {apiData.agent_question.options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setAgentChoice(opt.id)}
                        className={`p-5 rounded-xl border transition-all flex flex-col items-center gap-3 relative overflow-hidden group ${agentChoice === opt.id ? 'bg-gradient-to-br from-white/90 to-orange-100/90 border-white text-orange-900 scale-105 shadow-xl font-bold' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/30 hover:-translate-y-1'}`}
                      >
                        <div className={`text-3xl transition-transform duration-500 ${agentChoice === opt.id ? 'scale-110' : 'group-hover:scale-110'}`}>{opt.icon}</div>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-10 flex justify-between items-center">
                  <button onClick={() => setCurrentStage(0)} className="text-white/60 hover:text-white text-sm transition-colors border-b border-transparent hover:border-white/50">返回修改故事</button>
                  <PrimaryButton onClick={handleNextStage} disabled={!agentChoice} loading={isProcessing} text="确认，开始写词" />
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Stage 2: Lyrics & Hook Lock */}
          {currentStage === 2 && apiData && (
            <motion.div key="stage2" variants={contentVariants} initial="initial" animate="in" exit="out" className="w-full">
              <GlassCard>
                <div className="flex flex-col md:flex-row justify-between items-end mb-6 border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-orange-100">第二章：灵魂词作</h2>
                    <p className="text-white/70 text-sm mt-1">为你写了两个版本，选择基底并修饰。</p>
                  </div>
                  <div className="flex bg-black/10 p-1.5 rounded-xl mt-4 md:mt-0 backdrop-blur-md border border-white/5">
                    <button onClick={() => setSelectedLyrics('A')} className={`px-5 py-2 rounded-lg text-sm transition-all ${selectedLyrics === 'A' ? 'bg-white/90 text-teal-900 shadow-lg font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>版本 A ({apiData.lyrics_a.label})</button>
                    <button onClick={() => setSelectedLyrics('B')} className={`px-5 py-2 rounded-lg text-sm transition-all ${selectedLyrics === 'B' ? 'bg-white/90 text-teal-900 shadow-lg font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>版本 B ({apiData.lyrics_b.label})</button>
                  </div>
                </div>
                <div className="grid md:grid-cols-[1.5fr_1fr] gap-8">
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-2xl p-6 min-h-[300px] border border-white/10 shadow-inner">
                      {(selectedLyrics === 'A' ? lyricsA : lyricsB).map((line, idx) => (
                        <div key={idx} className="group relative mb-4 last:mb-0">
                          <input 
                            value={line}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              if(selectedLyrics === 'A') {
                                const l = [...lyricsA]; l[idx] = newVal; setLyricsA(l);
                              } else {
                                const l = [...lyricsB]; l[idx] = newVal; setLyricsB(l);
                              }
                            }}
                            className="w-full bg-transparent border-none outline-none text-xl text-white font-light focus:font-medium focus:text-orange-100 transition-all placeholder-white/30"
                          />
                          <Edit3 size={14} className="absolute -left-6 top-2 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 text-xs text-white/70 bg-white/5 p-4 rounded-xl items-start border border-white/10">
                      <Mic2 size={16} className="mt-0.5 shrink-0 text-orange-200" />
                      <p><span className="font-bold text-orange-200">Agent 点评：</span>{selectedLyrics === 'A' ? apiData.lyrics_a.critic : apiData.lyrics_b.critic}</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-white/10 to-teal-900/10 rounded-2xl p-6 border border-white/10 flex flex-col shadow-lg backdrop-blur-sm">
                    <div className="mb-5">
                      <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wide"><Wand2 size={16} className="text-orange-200" /> 核心金句 (Hook)</h3>
                      <p className="text-xs text-white/50 mt-1">这首歌最让人记住的一句话。</p>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                      {apiData.hooks.map((hook, i) => (
                        <button key={i} onClick={() => setSelectedHook(i)} className={`w-full text-left p-4 rounded-xl text-sm border transition-all relative group ${selectedHook === i ? 'bg-white/90 text-teal-900 border-white shadow-lg scale-105 font-medium' : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/20'}`}>
                          <span className="italic">"{hook}"</span>
                          {selectedHook === i && <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-700" />}
                        </button>
                      ))}
                    </div>
                    <button onClick={handleNextStage} disabled={isProcessing} className="mt-6 w-full py-4 bg-gradient-to-r from-orange-400 to-rose-400 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group">
                      {isProcessing ? '保存中...' : <>锁定歌词 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Stage 3: Scene Style */}
          {currentStage === 3 && (
            <motion.div key="stage3" variants={contentVariants} initial="initial" animate="in" exit="out" className="w-full max-w-4xl mx-auto">
              <GlassCard>
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-orange-100">第三章：听觉画面</h2>
                  <p className="text-white/70 text-lg">闭上眼，当这首歌响起时，你看到了什么？</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  {SCENE_CARDS.map((scene) => (
                    <button key={scene.id} onClick={() => setSelectedScene(scene.id)} className={`relative h-80 rounded-3xl p-6 text-left flex flex-col justify-between overflow-hidden transition-all duration-500 group ${selectedScene === scene.id ? 'ring-4 ring-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] scale-105 z-10' : 'opacity-80 hover:opacity-100 hover:scale-105 hover:shadow-xl grayscale-[0.3] hover:grayscale-0'}`}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${scene.color} transition-all duration-500`} />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                      <div className="relative z-10">
                        <div className="bg-white/20 w-fit p-4 rounded-full backdrop-blur-md mb-6 shadow-lg border border-white/10 group-hover:rotate-12 transition-transform duration-500">{scene.visual_icon}</div>
                        <h3 className="text-2xl font-bold text-white leading-tight mb-3 drop-shadow-md">{scene.title}</h3>
                        <p className="text-sm text-white/90 font-light leading-relaxed drop-shadow-sm">{scene.desc}</p>
                      </div>
                      <div className="relative z-10 border-t border-white/20 pt-4 mt-4">
                         <div className="flex items-center gap-2 text-xs font-mono text-white/80 bg-black/20 w-fit px-2 py-1 rounded-md"><Music size={12} />{scene.audio_tags}</div>
                      </div>
                      {selectedScene === scene.id && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-4 right-4 bg-white text-teal-900 rounded-full p-1.5 shadow-lg"><Check size={20} strokeWidth={3} /></motion.div>}
                    </button>
                  ))}
                </div>
                <AnimatePresence>
                  {selectedScene && (
                    <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="max-w-xl mx-auto">
                       <div className="relative mb-8 group">
                         <input 
                           value={tweakPrompt}
                           onChange={(e) => setTweakPrompt(e.target.value)}
                           placeholder="微调画面：比如“火焰更猛烈一点” 或 “节奏再慢一点”..."
                           className="w-full bg-white/10 border border-white/30 rounded-full px-8 py-5 text-white placeholder-white/50 outline-none focus:bg-white/20 focus:border-white/60 focus:ring-4 focus:ring-white/10 transition-all text-center text-lg shadow-lg"
                         />
                         <Wand2 size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/60 group-hover:text-white transition-colors" />
                       </div>
                       <PrimaryButton onClick={startMusicGeneration} loading={isProcessing} text="开始生成音乐" className="w-full text-xl py-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          )}

          {/* Loading Overlay */}
          {isProcessing && currentStage >= 3 && (
             <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-2xl">
                <div className="relative w-64 h-64 mb-10">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="w-full h-full rounded-full bg-black border-4 border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.1)] relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-teal-500/20 rounded-full" />
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center shadow-inner relative z-10">
                      <Music size={40} className="text-white animate-pulse" />
                    </div>
                  </motion.div>
                  <div className="absolute -bottom-20 left-0 w-full text-center">
                    <span className="text-6xl font-bold text-white tracking-tighter drop-shadow-lg">{generationProgress}%</span>
                  </div>
                </div>
                <div className="text-center space-y-3 relative z-10">
                   <h2 className="text-3xl font-bold text-white tracking-wide">
                     {generationProgress < 30 ? "正在编曲..." : generationProgress < 70 ? "合成人声..." : "最终混音..."}
                   </h2>
                   <p className="text-white/70 font-light text-lg">AI 正在为你的故事注入灵魂</p>
                </div>
             </motion.div>
          )}

          {/* Stage 4: Result */}
          {currentStage === 4 && musicInfo && (
            <motion.div key="result" variants={contentVariants} initial="initial" animate="in" exit="out" className="w-full max-w-md mx-auto">
              <div className="bg-white/10 backdrop-blur-3xl rounded-[40px] p-8 border border-white/20 shadow-2xl flex flex-col items-center text-center relative overflow-hidden group">
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-teal-500/30 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-orange-500/30 rounded-full blur-3xl pointer-events-none" />
                
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: "spring" }} className="w-72 h-72 bg-black rounded-2xl shadow-2xl mb-8 flex items-center justify-center border border-white/10 relative overflow-hidden">
                   <div className={`absolute inset-0 bg-gradient-to-br ${selectedScene ? SCENE_CARDS.find(s => s.id === selectedScene)?.color : 'from-gray-800 to-black'} opacity-80`} />
                   <div className="relative z-10 text-white flex flex-col items-center">
                     <span className="text-6xl mb-4 drop-shadow-lg">{selectedScene ? SCENE_CARDS.find(s => s.id === selectedScene)?.visual_icon : <Music />}</span>
                     <span className="font-serif italic text-2xl font-bold tracking-wide">{APP_NAME}</span>
                   </div>
                </motion.div>

                <div className="mb-8 w-full">
                  <h2 className="text-3xl font-bold text-white mb-2">{musicInfo.title}</h2>
                  <div className="flex justify-center items-center gap-2 text-white/60 text-xs uppercase tracking-widest font-mono bg-black/20 w-fit mx-auto px-3 py-1 rounded-full">
                    <span>{selectedScene ? SCENE_CARDS.find(s => s.id === selectedScene)?.title : 'Unknown Style'}</span>
                    <span>•</span>
                    <span>AI Generated</span>
                  </div>
                </div>

                <div className="flex items-center gap-8 mb-10 w-full justify-center">
                   <button className="text-white/60 hover:text-white hover:scale-110 transition-all p-2"><Share2 size={24} /></button>
                   <a href={musicInfo.audio_url} target="_blank" rel="noreferrer" className="w-20 h-20 bg-gradient-to-br from-orange-100 to-white text-orange-900 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-110 active:scale-95 transition-all ring-4 ring-white/10">
                     <Play fill="currentColor" className="ml-2 w-8 h-8" />
                   </a>
                   <button className="text-white/60 hover:text-white hover:scale-110 transition-all p-2"><Download size={24} /></button>
                </div>

                <div className="w-full space-y-3">
                  <button onClick={restart} className="w-full py-4 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold transition-all flex items-center justify-center gap-2 backdrop-blur-md"><RefreshCw size={18} /> 再写一个故事</button>
                  <p className="text-xs text-white/40 font-mono">Audio generated successfully.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
