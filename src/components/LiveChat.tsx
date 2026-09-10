import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, MessageCircle, WifiOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface SourceChatMessage {
  id: string;
  lecture_id: string;
  body: string;
  sender_name: string | null;
  source_created_at: string | null;
  created_at: string;
}

type SyncStatus = 'connecting' | 'live' | 'reconnecting' | 'offline';

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000];

export function LiveChat({ lectureId, isLive }: { lectureId: string; isLive: boolean }) {
  const [messages, setMessages] = useState<SourceChatMessage[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting');
  const [visible, setVisible] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const loadMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('source_chat_messages')
      .select('*')
      .eq('lecture_id', lectureId)
      .order('source_created_at', { ascending: true, nullsFirst: true });

    if (!error && data && mountedRef.current) {
      setMessages(data as SourceChatMessage[]);
      setTimeout(() => scrollToBottom(false), 100);
    }
  }, [lectureId, scrollToBottom]);

  const subscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`source-chat-${lectureId}`, {
        config: { broadcast: { self: false } },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'source_chat_messages',
          filter: `lecture_id=eq.${lectureId}`,
        },
        (payload) => {
          if (!mountedRef.current) return;
          const newMsg = payload.new as SourceChatMessage;
          const receivedAt = Date.now();
          if (newMsg.source_created_at) {
            const sourceTs = new Date(newMsg.source_created_at).getTime();
            const e2eLatency = receivedAt - sourceTs;
            console.log(`[LiveChat] Realtime INSERT received — e2e latency: ${e2eLatency}ms (source: ${newMsg.source_created_at} → client: ${new Date(receivedAt).toISOString()}) msg: "${newMsg.body.slice(0, 50)}"`);
          } else {
            console.log(`[LiveChat] Realtime INSERT received (no source_created_at) — db created_at: ${newMsg.created_at} → client: ${new Date(receivedAt).toISOString()}`);
          }
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setSyncStatus('live');
          reconnectAttemptRef.current = 0;
          setTimeout(() => scrollToBottom(), 50);
        },
      )
      .subscribe((status) => {
        if (!mountedRef.current) return;
        console.log(`[LiveChat] channel status: ${status}`);
        if (status === 'SUBSCRIBED') {
          setSyncStatus('live');
          reconnectAttemptRef.current = 0;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setSyncStatus('reconnecting');
          scheduleReconnect();
        } else if (status === 'CLOSED') {
          setSyncStatus('offline');
          scheduleReconnect();
        }
      });

    channelRef.current = channel;
  }, [lectureId, scrollToBottom]);

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;
    const attempt = reconnectAttemptRef.current;
    if (attempt >= RECONNECT_DELAYS.length) {
      console.warn(`[LiveChat] max reconnect attempts (${attempt}) reached, will retry on focus`);
      setSyncStatus('offline');
      return;
    }
    const delay = RECONNECT_DELAYS[attempt];
    console.log(`[LiveChat] scheduling reconnect attempt ${attempt + 1} in ${delay}ms`);
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      reconnectAttemptRef.current++;
      console.log(`[LiveChat] reconnecting (attempt ${reconnectAttemptRef.current})...`);
      setSyncStatus('reconnecting');
      loadMessages().then(() => subscribe());
    }, delay);
  }, [loadMessages, subscribe]);

  // Reconnect when tab regains focus or network comes back
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && mountedRef.current) {
        const status = channelRef.current?.state;
        if (status !== 'joined' && status !== 'joining') {
          console.log('[LiveChat] tab regained focus, reconnecting...');
          reconnectAttemptRef.current = 0;
          setSyncStatus('reconnecting');
          loadMessages().then(() => subscribe());
        }
      }
    };
    const handleOnline = () => {
      if (mountedRef.current) {
        console.log('[LiveChat] network back online, reconnecting...');
        reconnectAttemptRef.current = 0;
        setSyncStatus('reconnecting');
        loadMessages().then(() => subscribe());
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
    };
  }, [loadMessages, subscribe]);

  useEffect(() => {
    mountedRef.current = true;

    if (!isLive) {
      setVisible(false);
      return;
    }

    setVisible(true);
    setSyncStatus('connecting');
    reconnectAttemptRef.current = 0;

    (async () => {
      await loadMessages();
      setSyncStatus('live');
      subscribe();
    })();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    };
  }, [lectureId, isLive, loadMessages, subscribe]);

  if (!visible || !isLive) return null;

  const timeAgo = (dateStr: string | null) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return 'just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h`;
  };

  const getInitial = (name: string | null) => {
    const n = (name || 'S').trim();
    return n.charAt(0).toUpperCase();
  };

  const getDisplayName = (name: string | null) => {
    const n = (name || '').trim();
    return n || 'Student';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="w-4 h-4 text-rose-400" />
            {syncStatus === 'live' && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <span className="text-sm font-semibold text-white/90">Live Chat</span>
          <SyncBadge status={syncStatus} />
        </div>
        <span className="text-[10px] text-white/40 font-medium">
          {messages.length} messages
        </span>
      </div>

      {/* Synced label */}
      <div className="px-4 py-1.5 bg-white/5 border-b border-white/5">
        <span className="text-[10px] text-white/40 font-medium tracking-wide">
          Live chat synced from class
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-thin min-h-[200px] bg-white/5 backdrop-blur-xl">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-3">
              <MessageCircle className="w-6 h-6 text-white/30" />
            </div>
            <p className="text-sm text-white/40 font-medium">
              {syncStatus === 'live'
                ? 'Waiting for messages...'
                : syncStatus === 'reconnecting'
                  ? 'Chat reconnecting...'
                  : 'Connecting to chat...'}
            </p>
            <p className="text-xs text-white/20 mt-1">
              Messages from the live class will appear here.
            </p>
          </div>
        )}

        {syncStatus === 'reconnecting' && messages.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 py-2 text-amber-400/70">
            <WifiOff className="w-3 h-3" />
            <span className="text-[10px] font-medium">Chat reconnecting...</span>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex items-start gap-2"
            >
              <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-bold text-white/50">{getInitial(m.sender_name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white/60">{getDisplayName(m.sender_name)}</span>
                  {m.source_created_at && (
                    <span className="text-[10px] text-white/25 flex-shrink-0">
                      {timeAgo(m.source_created_at)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/80 leading-relaxed break-words mt-0.5">
                  {m.body}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function SyncBadge({ status }: { status: SyncStatus }) {
  const config: Record<SyncStatus, { color: string; label: string; dot: string }> = {
    live: { color: 'bg-success-500/15 text-success-400', label: 'Live', dot: 'bg-success-500' },
    connecting: { color: 'bg-white/10 text-white/40', label: 'Connecting', dot: 'bg-white/30' },
    reconnecting: { color: 'bg-amber-500/15 text-amber-400', label: 'Reconnecting', dot: 'bg-amber-500' },
    offline: { color: 'bg-rose-500/15 text-rose-400', label: 'Offline', dot: 'bg-rose-500' },
  };
  const { color, label, dot } = config[status];
  return (
    <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} ${status === 'live' ? 'animate-pulse' : ''}`} />
      {label}
    </span>
  );
}
