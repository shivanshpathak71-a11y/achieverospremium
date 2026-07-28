import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, Check, ChevronLeft, SkipForward, SkipBack,
  Monitor, PictureInPicture, Camera, Lock, Unlock,
  Repeat, Gauge,
} from 'lucide-react';
import Hls from 'hls.js';
import type { Lecture } from '../lib/supabase';
import { formatDuration } from '../lib/hooks';
import { getProgress, setProgress, addStudyTime } from '../lib/storage';

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 4];
const QUALITIES = ['Auto', '144p', '240p', '360p', '480p', '720p', '1080p'];

const LS_SPEED = 'shivansh_playback_speed';
const LS_VOLUME = 'shivansh_playback_volume';
const LS_MUTED = 'shivansh_playback_muted';

type MenuView = 'main' | 'speed' | 'quality' | null;

export function CinematicPlayer({ lecture, onEnded, onNext }: {
  lecture: Lecture;
  onEnded?: () => void;
  onNext?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(() => localStorage.getItem(LS_MUTED) === 'true');
  const [volume, setVolume] = useState(() => parseFloat(localStorage.getItem(LS_VOLUME) || '1'));
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [menuView, setMenuView] = useState<MenuView>(null);
  const [speed, setSpeed] = useState(() => parseFloat(localStorage.getItem(LS_SPEED) || '1'));
  const [quality, setQuality] = useState('Auto');
  const [showTapFeedback, setShowTapFeedback] = useState<null | 'left' | 'right'>(null);
  const [locked, setLocked] = useState(false);
  const [abRepeat, setAbRepeat] = useState<{ a: number | null; b: number | null }>({ a: null, b: null });
  const [showAbHint, setShowAbHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoNext, setAutoNext] = useState(true);
  const [resumeChecked, setResumeChecked] = useState(false);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastTapRef = useRef<{ time: number; side: 'left' | 'right' } | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // hranker CDNs block browser Origin headers for both MP4 and HLS — route all through proxy
  const PROXY_BASE = 'https://hdkbxuxzedsqyiccwomw.supabase.co/functions/v1/hls-proxy';
  const isHls = lecture.video_url?.includes('.m3u8') ?? false;
  const needsProxy = lecture.video_url?.includes('hranker.com') ?? false;
  const streamUrl = needsProxy && lecture.video_url
    ? `${PROXY_BASE}?u=${encodeURIComponent(lecture.video_url)}${isHls ? '&rewrite=1' : ''}`
    : lecture.video_url || '';

  // HLS stream support
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !lecture.video_url) return;
    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          liveDurationInfinity: false,
          manifestLoadingTimeOut: 15000,
          manifestLoadingMaxRetry: 4,
          levelLoadingTimeOut: 10000,
          fragLoadingTimeOut: 20000,
          fragLoadingMaxRetry: 6,
          fragLoadingRetryDelay: 500,
        });
        hlsRef.current = hls;
        hls.loadSource(streamUrl || '');
        hls.attachMedia(v);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          v.play().catch(() => { /* autoplay blocked, user must tap */ });
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          console.error('[HLS]', data.type, data.details, data.fatal ? 'FATAL' : '', data.response?.code || '');
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                hlsRef.current = null;
                break;
            }
          }
        });
        return () => { hls.destroy(); hlsRef.current = null; };
      }
      // Native HLS support (Safari/iOS) — set src directly
      v.src = streamUrl || '';
      v.play().catch(() => { /* autoplay blocked */ });
    } else {
      // Plain MP4 — route through proxy if hranker (CDN blocks browser Origin headers)
      v.src = streamUrl || '';
    }
  }, [streamUrl]);

  // Persist settings
  useEffect(() => { localStorage.setItem(LS_SPEED, String(speed)); }, [speed]);
  useEffect(() => { localStorage.setItem(LS_VOLUME, String(volume)); }, [volume]);
  useEffect(() => { localStorage.setItem(LS_MUTED, String(muted)); }, [muted]);

  // Resume position
  useEffect(() => {
    if (!resumeChecked && videoRef.current && duration > 0) {
      const prog = getProgress(lecture.id);
      if (prog && prog.position > 5 && prog.position < prog.duration * 0.95) {
        videoRef.current.currentTime = prog.position;
        setPosition(prog.position);
      }
      setResumeChecked(true);
    }
  }, [duration, lecture.id, resumeChecked]);

  // Save progress periodically
  useEffect(() => {
    if (!playing || !duration) return;
    const interval = setInterval(() => {
      const v = videoRef.current;
      if (v) { setProgress(lecture.id, v.currentTime, v.duration || duration); addStudyTime(5); }
    }, 5000);
    return () => clearInterval(interval);
  }, [playing, duration, lecture.id]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current; if (!v || locked) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
    setShowControls(true);
  }, [locked]);

  const seek = useCallback((delta: number) => {
    const v = videoRef.current; if (!v || locked) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
    setPosition(v.currentTime);
  }, [locked]);

  const seekTo = useCallback((t: number) => {
    const v = videoRef.current; if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, t));
    setPosition(v.currentTime);
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current; if (!v || locked) return;
    v.muted = !v.muted; setMuted(v.muted);
  }, [locked]);

  const toggleFullscreen = useCallback(() => {
    if (locked) return;
    if (!document.fullscreenElement) { containerRef.current?.requestFullscreen(); setFullscreen(true); }
    else { document.exitFullscreen(); setFullscreen(false); }
  }, [locked]);

  const togglePiP = useCallback(async () => {
    const v = videoRef.current; if (!v || locked) return;
    try { if (document.pictureInPictureElement) await document.exitPictureInPicture(); else await v.requestPictureInPicture(); } catch { /* ignore */ }
  }, [locked]);

  const toggleTheater = useCallback(() => {
    if (locked) return;
    setTheaterMode((t) => !t);
  }, [locked]);

  const screenshot = useCallback(() => {
    const v = videoRef.current; if (!v) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lecture.title.replace(/\s+/g, '_')}_${Math.floor(v.currentTime)}s.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }, [lecture.title]);

  const toggleAbRepeat = useCallback(() => {
    const v = videoRef.current; if (!v) return;
    setAbRepeat((prev) => {
      if (prev.a === null) {
        setShowAbHint(`A set at ${formatDuration(v.currentTime)}`);
        setTimeout(() => setShowAbHint(null), 2000);
        return { a: v.currentTime, b: null };
      }
      if (prev.b === null) {
        setShowAbHint(`B set at ${formatDuration(v.currentTime)}`);
        setTimeout(() => setShowAbHint(null), 2000);
        return { ...prev, b: v.currentTime };
      }
      setShowAbHint('A-B cleared');
      setTimeout(() => setShowAbHint(null), 2000);
      return { a: null, b: null };
    });
  }, []);

  // A-B repeat loop
  useEffect(() => {
    if (abRepeat.a !== null && abRepeat.b !== null && position >= abRepeat.b) {
      seekTo(abRepeat.a);
    }
  }, [position, abRepeat, seekTo]);

  const handleSeekClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (locked) return;
    const v = videoRef.current; if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * v.duration;
    setPosition(v.currentTime);
  }, [locked]);

  const handleVideoClick = useCallback((e: React.MouseEvent) => {
    if (locked) return;
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const side = x < rect.width / 2 ? 'left' : 'right';
    const now = Date.now();
    const last = lastTapRef.current;
    if (last && now - last.time < 300 && last.side === side) {
      seek(side === 'left' ? -10 : 10);
      setShowTapFeedback(side);
      setTimeout(() => setShowTapFeedback(null), 500);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { time: now, side };
      setTimeout(() => { if (lastTapRef.current?.time === now) { togglePlay(); lastTapRef.current = null; } }, 300);
    }
  }, [seek, togglePlay, locked]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (locked && e.key !== 'l' && e.key !== 'L') return;
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': e.preventDefault(); seek(-5); break;
        case 'ArrowRight': e.preventDefault(); seek(5); break;
        case 'j': seek(-10); break;
        case 'l': if (locked) { setLocked(false); break; } seek(10); break;
        case 'm': toggleMute(); break;
        case 'f': toggleFullscreen(); break;
        case 't': toggleTheater(); break;
        case 'n': onNext?.(); break;
        case 's': screenshot(); break;
        case 'a': toggleAbRepeat(); break;
        case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9': {
          const v = videoRef.current; if (v && v.duration) { v.currentTime = (parseInt(e.key) / 10) * v.duration; setPosition(v.currentTime); }
          break;
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, seek, toggleMute, toggleFullscreen, toggleTheater, screenshot, toggleAbRepeat, onNext, locked]);

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    if (!menuView) setShowControls(true);
  }, [menuView]);

  const showControlsTemp = useCallback(() => {
    if (locked) return;
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (!menuView) {
      controlsTimerRef.current = setTimeout(() => { if (playing) setShowControls(false); }, 3000);
    }
  }, [menuView, playing, locked]);

  const abActive = abRepeat.a !== null && abRepeat.b !== null;

  return (
    <div className={theaterMode ? 'relative w-full' : 'relative w-full aspect-video'}>
      <div ref={containerRef} className="relative w-full h-full bg-black rounded-2xl overflow-hidden group select-none"
        onMouseMove={showControlsTemp} onMouseLeave={() => { if (!menuView && playing && !locked) setShowControls(false); }}
        style={{ cursor: locked ? 'no-drop' : (showControls ? 'auto' : 'none') }}>
        <video ref={videoRef} src={lecture.video_url && !isHls ? streamUrl : undefined} poster={lecture.thumbnail_url || undefined}
          className="w-full h-full object-contain"
          onClick={handleVideoClick}
          onLoadedMetadata={() => {
            const v = videoRef.current;
            if (v) {
              setDuration(v.duration);
              v.playbackRate = speed;
              v.volume = volume;
              v.muted = muted;
            }
          }}
          onWaiting={() => setLoading(true)}
          onPlaying={() => setLoading(false)}
          onCanPlay={() => setLoading(false)}
          onTimeUpdate={() => {
            const v = videoRef.current; if (!v) return;
            setPosition(v.currentTime);
            const bf = v.buffered;
            if (bf.length > 0) setBuffered(bf.end(bf.length - 1));
          }}
          onPlay={() => { setPlaying(true); showControlsTemp(); }}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            const v = videoRef.current;
            if (v) setProgress(lecture.id, v.duration, v.duration);
            onEnded?.();
            if (autoNext && onNext) setTimeout(onNext, 800);
          }}
          onVolumeChange={() => { const v = videoRef.current; if (v) { setMuted(v.muted); setVolume(v.volume); } }}
        />

        {/* Loading spinner */}
        <AnimatePresence>
          {loading && playing && (
            <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="w-12 h-12 rounded-full border-3 border-white/20 border-t-primary-400 animate-spin" style={{ borderWidth: '3px' }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tap feedback */}
        <AnimatePresence>
          {showTapFeedback && (
            <motion.div className={`absolute top-1/2 ${showTapFeedback === 'left' ? 'left-8' : 'right-8'} -translate-y-1/2 pointer-events-none`}
              initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
              <div className="bg-white/20 backdrop-blur-md rounded-full w-16 h-16 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{showTapFeedback === 'left' ? '−10s' : '+10s'}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* A-B hint */}
        <AnimatePresence>
          {showAbHint && (
            <motion.div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white text-xs font-medium px-4 py-2 rounded-full"
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {showAbHint}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lock indicator */}
        {locked && (
          <motion.div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md rounded-full p-2"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Lock className="w-4 h-4 text-white" />
          </motion.div>
        )}

        {/* Center play button */}
        <AnimatePresence>
          {!playing && !loading && !locked && (
            <motion.button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors">
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Controls bar */}
        <AnimatePresence>
          {showControls && !locked && (
            <motion.div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pt-12 pb-3"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              {/* Seek bar */}
              <div className="relative h-1.5 rounded-full bg-white/20 cursor-pointer mb-3 group/seek" onClick={handleSeekClick}>
                <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: `${duration > 0 ? (buffered / duration) * 100 : 0}%` }} />
                <div className="absolute inset-y-0 left-0 rounded-full bg-primary-500" style={{ width: `${duration > 0 ? (position / duration) * 100 : 0}%` }} />
                {abRepeat.a !== null && <div className="absolute top-0 bottom-0 w-0.5 bg-amber-400" style={{ left: `${duration > 0 ? (abRepeat.a / duration) * 100 : 0}%` }} />}
                {abRepeat.b !== null && <div className="absolute top-0 bottom-0 w-0.5 bg-amber-400" style={{ left: `${duration > 0 ? (abRepeat.b / duration) * 100 : 0}%` }} />}
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary-500 shadow-md opacity-0 group-hover/seek:opacity-100 transition-opacity"
                  style={{ left: `${duration > 0 ? (position / duration) * 100 : 0}%`, transform: 'translate(-50%, -50%)' }} />
              </div>

              <div className="flex items-center gap-2">
                <button onClick={togglePlay} className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-white/15 transition-colors">
                  {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button onClick={() => seek(-10)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-white/15 transition-colors" aria-label="Back 10s">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button onClick={() => seek(10)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-white/15 transition-colors" aria-label="Forward 10s">
                  <SkipForward className="w-4 h-4" />
                </button>
                <button onClick={toggleMute} className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-white/15 transition-colors">
                  {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                  onChange={(e) => { const v = videoRef.current; if (v) { v.volume = parseFloat(e.target.value); v.muted = false; } }}
                  className="w-16 h-1 accent-primary-500 cursor-pointer" />
                <span className="text-[11px] text-white/80 font-mono ml-1">{formatDuration(position)} / {formatDuration(duration)}</span>
                <div className="flex-1" />
                {/* A-B repeat */}
                <button onClick={toggleAbRepeat} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${abActive ? 'text-amber-400 bg-white/15' : 'text-white hover:bg-white/15'}`} aria-label="A-B Repeat">
                  <Repeat className="w-4 h-4" />
                </button>
                {/* Screenshot */}
                <button onClick={screenshot} className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-white/15 transition-colors" aria-label="Screenshot">
                  <Camera className="w-4 h-4" />
                </button>
                {/* Theater mode */}
                <button onClick={toggleTheater} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${theaterMode ? 'text-primary-400 bg-white/15' : 'text-white hover:bg-white/15'}`} aria-label="Theater Mode">
                  <Monitor className="w-4 h-4" />
                </button>
                {/* PiP */}
                <button onClick={togglePiP} className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-white/15 transition-colors" aria-label="Picture in Picture">
                  <PictureInPicture className="w-4 h-4" />
                </button>
                {/* Lock */}
                <button onClick={() => setLocked(true)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-white/15 transition-colors" aria-label="Lock Controls">
                  <Unlock className="w-4 h-4" />
                </button>
                {/* Settings */}
                <div className="relative">
                  <button onClick={() => setMenuView(menuView ? null : 'main')} className={`h-8 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs font-semibold ${menuView ? 'text-primary-400 bg-white/15' : 'text-white hover:bg-white/15'}`} aria-label="Settings">
                    <Settings className={`w-4 h-4 transition-transform duration-200 ${menuView ? 'rotate-45' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {menuView && (
                      <motion.div className="absolute bottom-10 right-0 w-48 bg-black/90 backdrop-blur-xl rounded-xl border border-white/10 p-1.5 shadow-2xl"
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}>
                        {menuView === 'main' && (
                          <>
                            <button onClick={() => setMenuView('speed')} className="w-full px-3 py-2 rounded-xl text-xs text-white hover:bg-white/10 flex items-center justify-between transition-colors">
                              <span className="flex items-center gap-2"><Gauge className="w-3.5 h-3.5" /> Speed</span>
                              <span className="text-primary-400">{speed}×</span>
                            </button>
                            <button onClick={() => setMenuView('quality')} className="w-full px-3 py-2 rounded-xl text-xs text-white hover:bg-white/10 flex items-center justify-between transition-colors">
                              <span className="flex items-center gap-2"><Monitor className="w-3.5 h-3.5" /> Quality</span>
                              <span className="text-primary-400">{quality}</span>
                            </button>
                            <div className="h-px bg-white/10 my-1" />
                            <button onClick={() => { setAutoNext(!autoNext); }} className="w-full px-3 py-2 rounded-xl text-xs text-white hover:bg-white/10 flex items-center justify-between transition-colors">
                              <span>Auto-play next</span>
                              <span className={autoNext ? 'text-primary-400' : 'text-white/40'}>{autoNext ? 'ON' : 'OFF'}</span>
                            </button>
                          </>
                        )}
                        {menuView === 'speed' && (
                          <>
                            <button onClick={() => setMenuView('main')} className="w-full px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 flex items-center gap-1.5 transition-colors mb-0.5">
                              <ChevronLeft className="w-3 h-3" /> Back
                            </button>
                            <div className="max-h-48 overflow-y-auto">
                              {SPEEDS.map((s) => (
                                <button key={s} onClick={() => { setSpeed(s); const v = videoRef.current; if (v) v.playbackRate = s; setMenuView(null); }}
                                  className={`w-full px-3 py-1.5 rounded-lg text-xs text-left flex items-center justify-between transition-colors ${speed === s ? 'text-primary-400 bg-white/10' : 'text-white hover:bg-white/10'}`}>
                                  {s}× {speed === s && <Check className="w-3 h-3" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                        {menuView === 'quality' && (
                          <>
                            <button onClick={() => setMenuView('main')} className="w-full px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 flex items-center gap-1.5 transition-colors mb-0.5">
                              <ChevronLeft className="w-3 h-3" /> Back
                            </button>
                            {QUALITIES.map((q) => (
                              <button key={q} onClick={() => { setQuality(q); setMenuView(null); }}
                                className={`w-full px-3 py-2 rounded-xl text-xs text-left flex items-center justify-between transition-colors ${quality === q ? 'text-primary-400 bg-white/10' : 'text-white hover:bg-white/10'}`}>
                                {q} {quality === q && <Check className="w-3 h-3" />}
                              </button>
                            ))}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button onClick={toggleFullscreen} className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-white/15 transition-colors">
                  {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unlock button (when locked) */}
        {locked && (
          <motion.button onClick={() => setLocked(false)} className="absolute top-4 left-4 bg-black/60 backdrop-blur-md rounded-full p-2.5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Unlock className="w-4 h-4 text-white" />
          </motion.button>
        )}

      </div>
    </div>
  );
}
