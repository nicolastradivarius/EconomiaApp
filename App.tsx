import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || '';
const SEARCH_LIMIT = 6;

const resolveWsUrl = () => {
  const usesLocalhost = /localhost|127\.0\.0\.1/.test(WS_URL);
  if (WS_URL && (!usesLocalhost || Platform.OS === 'web')) {
    return WS_URL;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.manifest2?.extra?.expoClient?.hostUri ??
    Constants.manifest?.hostUri ??
    Constants.manifest?.debuggerHost ??
    '';

  if (!hostUri) return '';

  const normalized = hostUri.includes('://') ? hostUri : `http://${hostUri}`;
  try {
    const host = new URL(normalized).hostname;
    return host ? `ws://${host}:8080` : '';
  } catch (_error) {
    return '';
  }
};

type Room = {
  id: string;
  name: string;
  creator: string;
  listeners: number;
  genre: string;
  track: string;
};

type Message = {
  id: string;
  user: string;
  text: string;
  timestamp: string;
  isLeader?: boolean;
  isSelf?: boolean;
};

type Track = {
  id: string;
  title: string;
  artist: string;
  previewUrl: string;
  source: 'itunes' | 'deezer';
  durationMs?: number;
  artworkUrl?: string;
};

type ConnectedUser = {
  id: string;
  name: string;
  device?: string;
  ip?: string;
  isSelf?: boolean;
};

type WsMessage = {
  type: 'join' | 'track_select' | 'play' | 'pause' | 'seek' | 'sync' | 'users';
  roomId: string;
  sender: string;
  payload: any;
  sentAt: number;
};

const MOCK_ROOMS: Room[] = [
  { id: '1', name: 'Chill Vibes', creator: 'DJ Luna', listeners: 24, genre: 'Lo-Fi', track: 'Lofi Girl - Snowman' },
  { id: '2', name: 'Late Night Drive', creator: 'WaveRider', listeners: 18, genre: 'Synthwave', track: 'The Midnight - Los Angeles' },
  { id: '3', name: 'House Nation', creator: 'DeepSoul', listeners: 42, genre: 'Deep House', track: 'Lane 8 - Fingerprint' },
  { id: '4', name: 'Indie Corner', creator: 'MelodyMaker', listeners: 9, genre: 'Indie Pop', track: 'Men I Trust - Show Me How' },
  { id: '5', name: 'Hip Hop Heads', creator: 'BeatMaster', listeners: 31, genre: 'Hip Hop', track: 'Kendrick Lamar - PRIDE.' },
  { id: '6', name: 'Jazz & Rain', creator: 'SaxMaster', listeners: 15, genre: 'Jazz', track: 'Miles Davis - Blue in Green' },
  { id: '7', name: 'EDM Arena', creator: 'BassKing', listeners: 56, genre: 'Electronic', track: 'Martin Garrix - High on Life' },
];

const MOCK_MESSAGES: Message[] = [
  { id: '1', user: 'DJ Luna', text: 'Welcome to the room!', timestamp: '10:01', isLeader: true },
  { id: '2', user: 'MusicFan', text: 'Hey everyone!', timestamp: '10:02', isLeader: false },
  { id: '3', user: 'You', text: 'Love this track!', timestamp: '10:03', isSelf: true },
  { id: '4', user: 'BeatLover', text: 'Same here', timestamp: '10:03', isLeader: false },
  { id: '5', user: 'DJ Luna', text: 'Glad you like it! Next up is something special.', timestamp: '10:04', isLeader: true },
  { id: '6', user: 'SaxMaster', text: 'Welcome to Jazz & Rain. Grab a coffee and relax.', timestamp: '14:15', isLeader: true },
  { id: '7', user: 'JazzCat', text: 'Perfect for this rainy afternoon', timestamp: '14:17', isLeader: false },
  { id: '8', user: 'SmoothListener', text: 'Miles always hits different', timestamp: '14:20', isLeader: false },
  { id: '9', user: 'You', text: 'This is exactly what I needed', timestamp: '14:22', isSelf: true },
  { id: '10', user: 'SaxMaster', text: 'Next up is some Coltrane', timestamp: '14:25', isLeader: true },
  { id: '11', user: 'BassKing', text: 'EDM ARENA IS LIVE! Drop your energy in the chat', timestamp: '21:30', isLeader: true },
  { id: '12', user: 'RaveQueen', text: 'Lets gooooo!', timestamp: '21:31', isLeader: false },
  { id: '13', user: 'You', text: 'This drop is insane', timestamp: '21:34', isSelf: true },
  { id: '14', user: 'BassKing', text: 'Whos ready for the ID track?', timestamp: '21:36', isLeader: true },
  { id: '15', user: 'TranceFan', text: 'Best set Ive heard all week', timestamp: '21:38', isLeader: false },
  { id: '16', user: 'BassKing', text: 'Love this energy fam! Next track is a banger', timestamp: '21:40', isLeader: true },
];

const CURRENT_USER = 'You';

const ADJECTIVES = ['Neon', 'Chill', 'Cosmic', 'Swift', 'Lucky', 'Pulse', 'Amber', 'Wild'];
const NOUNS = ['Fox', 'Wave', 'Rider', 'Echo', 'Drift', 'Nova', 'Beat', 'Horizon'];

const createGuestName = () => {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const suffix = Math.floor(Math.random() * 900 + 100);
  return `${adjective} ${noun} ${suffix}`;
};

const getDeviceLabel = () => {
  if (Platform.OS !== 'web') {
    return Platform.OS === 'ios' ? 'iOS' : 'Android';
  }
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'Web Mobile';
    }
    return 'Web Desktop';
  }
  return 'Web';
};

const Logo = () => (
  <View style={styles.logoContainer}>
    <Ionicons name="radio" size={28} color="#1DB954" />
    <Text style={styles.logoText}>wavechat</Text>
  </View>
);

const formatTime = (ms: number) => {
  if (!ms || ms < 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const normalizeItunes = (data: any): Track[] => {
  if (!data?.results) return [];
  return data.results
    .filter((item: any) => item.previewUrl)
    .map((item: any) => ({
      id: `itunes-${item.trackId}`,
      title: item.trackName,
      artist: item.artistName,
      previewUrl: item.previewUrl,
      source: 'itunes',
      durationMs: item.trackTimeMillis,
      artworkUrl: item.artworkUrl100,
    }));
};

const normalizeDeezer = (data: any): Track[] => {
  if (!data?.data) return [];
  return data.data
    .filter((item: any) => item.preview)
    .map((item: any) => ({
      id: `deezer-${item.id}`,
      title: item.title,
      artist: item.artist?.name ?? 'Unknown',
      previewUrl: item.preview,
      source: 'deezer',
      durationMs: item.duration ? item.duration * 1000 : undefined,
      artworkUrl: item.album?.cover_medium,
    }));
};

const dedupeTracks = (tracks: Track[]) => {
  const seen = new Set<string>();
  return tracks.filter((track) => {
    if (!track.previewUrl || seen.has(track.previewUrl)) return false;
    seen.add(track.previewUrl);
    return true;
  });
};

type TrackItemProps = {
  item: Track;
  index: number;
  onSelect: (track: Track) => void;
};

const TrackItem = React.memo(({ item, index, onSelect }: TrackItemProps) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 300,
      delay: index * 40,
      useNativeDriver: true,
    }).start();
  }, [index, anim]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
      }}
    >
      <TouchableOpacity style={styles.trackCard} activeOpacity={0.8} onPress={() => onSelect(item)}>
        <View style={styles.trackMeta}>
          <Text style={styles.trackTitle}>{item.title}</Text>
          <Text style={styles.trackArtist}>{item.artist}</Text>
          <View style={styles.trackTags}>
            <View style={styles.trackSource}>
              <Text style={styles.trackSourceText}>{item.source.toUpperCase()}</Text>
            </View>
            {item.durationMs ? (
              <Text style={styles.trackDuration}>{formatTime(item.durationMs)}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.playBadge}>
          <Ionicons name="play" size={18} color="#000" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function App() {
  const resolvedWsUrl = resolveWsUrl();
  const [currentScreen, setCurrentScreen] = useState<'lobby' | 'room'>('lobby');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'playlist' | 'users'>('chat');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isHost, setIsHost] = useState(true);

  const player = useAudioPlayer(null, { updateInterval: 300 });
  const playerStatus = useAudioPlayerStatus(player);

  const positionMs = Math.round((playerStatus?.currentTime ?? 0) * 1000);
  const durationMs = Math.round((playerStatus?.duration ?? 0) * 1000);
  const isPlaying = playerStatus?.playing ?? false;
  const isLoaded = playerStatus?.isLoaded ?? false;

  const [wsStatus, setWsStatus] = useState<'offline' | 'connecting' | 'online' | 'error'>('offline');

  const flatListRef = useRef<FlatList<Message> | null>(null);
  const playlistRef = useRef<FlatList<Track> | null>(null);

  const screenTransition = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const messageAnimations = useRef<Record<string, Animated.Value>>({}).current;

  const wsRef = useRef<WebSocket | null>(null);
  const positionRef = useRef(0);
  const autoTrackRef = useRef<string | null>(null);
  const clientIdRef = useRef(`c${Math.random().toString(36).slice(2, 10)}`);
  const clientNameRef = useRef(createGuestName());
  const clientDeviceRef = useRef(getDeviceLabel());

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch((error) => {
      console.warn('Audio mode setup failed', error);
    });

    return () => {
      closeWs();
      try {
        player.pause();
      } catch (error) {
        console.warn('Audio pause failed', error);
      }
    };
  }, [player]);

  useEffect(() => {
    if (!selectedRoom) {
      closeWs();
      setConnectedUsers([]);
      return;
    }

    const wsUrl = resolveWsUrl();
    if (!wsUrl) {
      setWsStatus('offline');
      return;
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setWsStatus('connecting');

    ws.onopen = () => {
      setWsStatus('online');
      sendWsMessage('join', {
        user: {
          id: clientIdRef.current,
          name: clientNameRef.current,
          device: clientDeviceRef.current,
        },
      });
    };

    ws.onmessage = (event) => {
      handleWsMessage(event.data);
    };

    ws.onerror = () => {
      setWsStatus('error');
    };

    ws.onclose = () => {
      setWsStatus('offline');
    };

    return () => {
      ws.close();
    };
  }, [selectedRoom?.id]);

  useEffect(() => {
    positionRef.current = positionMs;
  }, [positionMs]);

  useEffect(() => {
    if (!isHost || wsStatus !== 'online' || !currentTrack) return;

    const interval = setInterval(() => {
      sendWsMessage('sync', {
        track: currentTrack,
        positionMs: positionRef.current,
        isPlaying,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isHost, wsStatus, currentTrack, isPlaying]);

  const closeWs = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsStatus('offline');
  };

  const resetPlayer = async () => {
    try {
      player.pause();
    } catch (error) {
      console.warn('Audio pause failed', error);
    }

    try {
      await player.seekTo(0);
    } catch (error) {
      console.warn('Audio seek failed', error);
    }
  };

  const sendWsMessage = useCallback((type: WsMessage['type'], payload: any) => {
    if (!selectedRoom) return;
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const message: WsMessage = {
      type,
      roomId: selectedRoom.id,
      sender: clientIdRef.current,
      payload,
      sentAt: Date.now(),
    };

    ws.send(JSON.stringify(message));
  }, [selectedRoom?.id]);

  const handleWsMessage = async (raw: string) => {
    let message: WsMessage | null = null;
    try {
      message = JSON.parse(raw);
    } catch (error) {
      return;
    }

    if (!message || !selectedRoom) return;
    if (message.roomId !== selectedRoom.id) return;
    if (message.sender === clientIdRef.current) return;

    const payload = message.payload ?? {};
    const lagMs = Math.max(0, Date.now() - message.sentAt);
    const syncedPosition = (payload.positionMs ?? 0) + (payload.isPlaying ? lagMs : 0);

    switch (message.type) {
      case 'users': {
        const nextUsers = Array.isArray(payload.users) ? payload.users : [];
        setConnectedUsers(
          nextUsers.map((user: ConnectedUser) => ({
            ...user,
            isSelf: user.id === clientIdRef.current,
          })),
        );
        break;
      }
      case 'track_select': {
        const track = payload.track as Track | undefined;
        if (!track?.previewUrl) return;
        await loadTrack(track, {
          autoplay: payload.isPlaying ?? true,
          positionMs: syncedPosition,
        });
        break;
      }
      case 'play': {
        const track = payload.track as Track | undefined;
        if (track && (!currentTrack || track.previewUrl !== currentTrack.previewUrl)) {
          await loadTrack(track, { autoplay: true, positionMs: syncedPosition });
          break;
        }
        await seekTo(syncedPosition);
        await playLocal();
        break;
      }
      case 'pause': {
        if (payload.positionMs != null) {
          await seekTo(payload.positionMs);
        }
        await pauseLocal();
        break;
      }
      case 'seek': {
        await seekTo(syncedPosition);
        break;
      }
      case 'sync': {
        const track = payload.track as Track | undefined;
        if (track && (!currentTrack || track.previewUrl !== currentTrack.previewUrl)) {
          await loadTrack(track, {
            autoplay: payload.isPlaying ?? false,
            positionMs: syncedPosition,
          });
          break;
        }
        await seekTo(syncedPosition);
        if (payload.isPlaying) {
          await playLocal();
        } else {
          await pauseLocal();
        }
        break;
      }
      default:
        break;
    }
  };

  const loadTrack = useCallback(async (
    track: Track,
    options: { autoplay: boolean; positionMs?: number },
  ) => {
    setCurrentTrack(track);
    positionRef.current = options.positionMs ?? 0;
    const targetSeconds = (options.positionMs ?? 0) / 1000;

    try {
      player.replace(track.previewUrl);
      await player.seekTo(targetSeconds);
      if (options.autoplay) {
        player.play();
      } else {
        player.pause();
      }
    } catch (error) {
      console.warn('Audio load failed', error);
    }
  }, [player]);

  const playLocal = () => {
    try {
      player.play();
    } catch (error) {
      console.warn('Audio play failed', error);
    }
  };

  const pauseLocal = () => {
    try {
      player.pause();
    } catch (error) {
      console.warn('Audio pause failed', error);
    }
  };

  const seekTo = async (ms: number) => {
    try {
      await player.seekTo(ms / 1000);
    } catch (error) {
      console.warn('Audio seek failed', error);
    }
  };

  const togglePlay = async () => {
    if (!currentTrack) return;
    if (!isLoaded) {
      await loadTrack(currentTrack, { autoplay: true, positionMs });
      if (isHost) {
        sendWsMessage('play', {
          track: currentTrack,
          positionMs,
          isPlaying: true,
        });
      }
      return;
    }

    if (isPlaying) {
      pauseLocal();
      if (isHost) {
        sendWsMessage('pause', {
          positionMs,
          isPlaying: false,
        });
      }
    } else {
      playLocal();
      if (isHost) {
        sendWsMessage('play', {
          track: currentTrack,
          positionMs,
          isPlaying: true,
        });
      }
    }
  };

  const seekBy = async (deltaMs: number) => {
    if (!isLoaded) return;

    const total = durationMs ?? 0;
    const next = Math.max(0, Math.min(total, positionMs + deltaMs));
    await seekTo(next);

    if (isHost) {
      sendWsMessage('seek', {
        positionMs: next,
        isPlaying,
      });
    }
  };

  const handleSelectTrack = useCallback(async (track: Track) => {
    await loadTrack(track, { autoplay: true, positionMs: 0 });
    if (isHost) {
      sendWsMessage('track_select', {
        track,
        positionMs: 0,
        isPlaying: true,
      });
    }
  }, [isHost, loadTrack, sendWsMessage]);

  const searchTracks = async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const [itunesResult, deezerResult] = await Promise.allSettled([
        fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=${SEARCH_LIMIT}`,
        ),
        fetch(
          `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=${SEARCH_LIMIT}`,
        ),
      ]);

      const results: Track[] = [];

      if (itunesResult.status === 'fulfilled' && itunesResult.value.ok) {
        const itunesData = await itunesResult.value.json();
        results.push(...normalizeItunes(itunesData));
      }

      if (deezerResult.status === 'fulfilled' && deezerResult.value.ok) {
        const deezerData = await deezerResult.value.json();
        results.push(...normalizeDeezer(deezerData));
      }

      const merged = dedupeTracks(results);
      setSearchResults(merged);

      if (!merged.length) {
        setSearchError('No previews found for this search.');
      }
    } catch (error) {
      setSearchError('Search failed. Try another query.');
    } finally {
      setIsSearching(false);
    }
  };

  const loadRoomTrack = useCallback(async (room: Room) => {
    const query = room.track?.trim();
    if (!query) return;

    try {
      const [itunesResult, deezerResult] = await Promise.allSettled([
        fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`,
        ),
        fetch(
          `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=1`,
        ),
      ]);

      const results: Track[] = [];

      if (itunesResult.status === 'fulfilled' && itunesResult.value.ok) {
        const itunesData = await itunesResult.value.json();
        results.push(...normalizeItunes(itunesData));
      }

      if (deezerResult.status === 'fulfilled' && deezerResult.value.ok) {
        const deezerData = await deezerResult.value.json();
        results.push(...normalizeDeezer(deezerData));
      }

      const merged = dedupeTracks(results);
      if (!merged.length) return;

      const nextTrack = merged[0];
      await loadTrack(nextTrack, { autoplay: true, positionMs: 0 });

      if (isHost) {
        sendWsMessage('track_select', {
          track: nextTrack,
          positionMs: 0,
          isPlaying: true,
        });
      }
    } catch (error) {
      console.warn('Room track load failed', error);
    }
  }, [isHost, loadTrack, sendWsMessage]);

  useEffect(() => {
    if (!selectedRoom) {
      autoTrackRef.current = null;
      return;
    }

    const key = `${selectedRoom.id}:${selectedRoom.track}`;
    if (autoTrackRef.current === key) return;
    autoTrackRef.current = key;
    loadRoomTrack(selectedRoom);
  }, [selectedRoom?.id, selectedRoom?.track, loadRoomTrack]);

  const enterRoom = (room: Room) => {
    Animated.timing(screenTransition, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSelectedRoom(room);
      setCurrentScreen('room');
      screenTransition.setValue(0);
      Animated.timing(screenTransition, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  const leaveRoom = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(async () => {
      setSelectedRoom(null);
      setCurrentScreen('lobby');
      setActiveTab('chat');
      fadeAnim.setValue(1);
      setSearchResults([]);
      setSearchQuery('');
      setSearchError(null);
      await resetPlayer();
      setCurrentTrack(null);
    });
  };

  const sendMessage = () => {
    if (newMessage.trim() === '') return;
    const message: Message = {
      id: Date.now().toString(),
      user: CURRENT_USER,
      text: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
    };
    setMessages([...messages, message]);
    setNewMessage('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  useEffect(() => {
    if (currentScreen === 'room' && activeTab === 'chat') {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [currentScreen, activeTab]);

  const getMessageAnimation = (id: string) => {
    if (!messageAnimations[id]) {
      messageAnimations[id] = new Animated.Value(0);
      Animated.spring(messageAnimations[id], {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
    return messageAnimations[id];
  };

  const LobbyItem = ({ item, index }: { item: Room; index: number }) => {
    const itemAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(itemAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 60,
        useNativeDriver: true,
      }).start();
    }, [index, itemAnim]);

    return (
      <Animated.View
        style={{
          opacity: itemAnim,
          transform: [
            { translateY: itemAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
          ],
        }}
      >
        <TouchableOpacity style={styles.roomCard} activeOpacity={0.8} onPress={() => enterRoom(item)}>
          <View style={styles.roomCardContent}>
            <View style={styles.roomHeader}>
              <Text style={styles.roomName}>{item.name}</Text>
              <View style={styles.listenersBadge}>
                <Ionicons name="headset-outline" size={14} color="#A0A0A0" />
                <Text style={styles.listenersText}>{item.listeners}</Text>
              </View>
            </View>
            <Text style={styles.roomCreator}>Hosted by {item.creator}</Text>
            <View style={styles.roomFooter}>
              <View style={styles.genreTag}>
                <Text style={styles.genreText}>{item.genre}</Text>
              </View>
              <View style={styles.nowPlaying}>
                <Ionicons name="musical-note" size={12} color="#1DB954" />
                <Text style={styles.nowPlayingText} numberOfLines={1}>
                  {item.track}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.joinIndicator}>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderLobbyItem = ({ item, index }: { item: Room; index: number }) => (
    <LobbyItem item={item} index={index} />
  );

  const renderMessage = ({ item }: { item: Message }) => {
    const isSelf = item.isSelf;
    const anim = getMessageAnimation(item.id);
    return (
      <Animated.View style={{ opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }}>
        <View style={[styles.messageRow, isSelf ? styles.messageRowSelf : styles.messageRowOther]}>
          {!isSelf && (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.user.charAt(0)}</Text>
            </View>
          )}
          <View style={[styles.messageBubble, isSelf ? styles.messageBubbleSelf : styles.messageBubbleOther]}>
            {!isSelf && (
              <View style={styles.messageUserRow}>
                <Text style={styles.messageUser}>{item.user}</Text>
                {item.isLeader && (
                  <View style={styles.leaderChip}>
                    <Text style={styles.leaderChipText}>HOST</Text>
                  </View>
                )}
              </View>
            )}
            <Text style={[styles.messageText, isSelf && styles.messageTextSelf]}>{item.text}</Text>
            <Text style={[styles.messageTime, isSelf && styles.messageTimeSelf]}>{item.timestamp}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderTrackItem = useCallback(
    ({ item, index }: { item: Track; index: number }) => (
      <TrackItem item={item} index={index} onSelect={handleSelectTrack} />
    ),
    [handleSelectTrack],
  );

  const renderUserItem = useCallback(
    ({ item }: { item: ConnectedUser }) => {
      const metaParts = [item.device, item.ip].filter(Boolean);
      return (
        <View style={styles.userCard}>
          <View style={[styles.userAvatar, item.isSelf && styles.userAvatarSelf]}>
            <Text style={styles.userAvatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {item.name}
              {item.isSelf ? ' (You)' : ''}
            </Text>
            <Text style={styles.userMeta}>
              {metaParts.length ? metaParts.join(' • ') : 'Unknown device'}
            </Text>
          </View>
        </View>
      );
    },
    [],
  );

  const screenAnimatedStyle = {
    opacity: screenTransition.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
  };

  const progress = durationMs ? Math.min(positionMs / durationMs, 1) : 0;
  const nowPlayingTitle = currentTrack?.title || selectedRoom?.track || 'No track playing';
  const nowPlayingArtist = currentTrack?.artist || selectedRoom?.creator || 'Wavechat';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.header}>
            {currentScreen === 'room' ? (
              <>
                <TouchableOpacity onPress={leaveRoom} style={styles.backButton}>
                  <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Animated.View style={[styles.headerRoomInfo, screenAnimatedStyle]}>
                  <Text style={styles.headerTitle}>{selectedRoom?.name}</Text>
                  <View style={styles.headerSubRow}>
                    <View style={styles.leaderBadge}>
                      <Ionicons name="radio" size={12} color="#1DB954" />
                      <Text style={styles.leaderBadgeText}>{selectedRoom?.creator}</Text>
                    </View>
                    <View style={styles.listenersInline}>
                      <Ionicons name="people-outline" size={12} color="#AAA" />
                      <Text style={styles.listenersInlineText}>{selectedRoom?.listeners}</Text>
                    </View>
                  </View>
                </Animated.View>
              </>
            ) : (
              <>
                <Logo />
                <TouchableOpacity style={styles.profileButton}>
                  <Ionicons name="person-circle-outline" size={30} color="#fff" />
                </TouchableOpacity>
              </>
            )}
          </View>

          {currentScreen === 'lobby' ? (
            <Animated.View style={[styles.lobbyContainer, { opacity: fadeAnim }]}>
              <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={20} color="#777" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Find a room..."
                    placeholderTextColor="#777"
                  />
                </View>
              </View>
              <FlatList
                data={MOCK_ROOMS}
                keyExtractor={(item) => item.id}
                renderItem={renderLobbyItem}
                contentContainerStyle={styles.lobbyList}
                showsVerticalScrollIndicator={false}
              />
            </Animated.View>
          ) : (
            <Animated.View style={[styles.roomContainer, screenAnimatedStyle]}>
              <View style={styles.tabBar}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
                  onPress={() => setActiveTab('chat')}
                >
                  <Ionicons name="chatbubble-ellipses" size={20} color={activeTab === 'chat' ? '#1DB954' : '#888'} />
                  <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'playlist' && styles.activeTab]}
                  onPress={() => setActiveTab('playlist')}
                >
                  <Ionicons name="list" size={20} color={activeTab === 'playlist' ? '#1DB954' : '#888'} />
                  <Text style={[styles.tabText, activeTab === 'playlist' && styles.activeTabText]}>Playlist</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'users' && styles.activeTab]}
                  onPress={() => setActiveTab('users')}
                >
                  <Ionicons name="people" size={20} color={activeTab === 'users' ? '#1DB954' : '#888'} />
                  <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>Users</Text>
                </TouchableOpacity>
              </View>

              {activeTab === 'chat' ? (
                <>
                  <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.chatList}
                    showsVerticalScrollIndicator={false}
                  />
                  <View style={styles.playerBar}>
                    <Animated.View style={[styles.playerArtwork, { transform: [{ rotate: '0deg' }] }]}>
                      <Ionicons name="disc" size={40} color="#1DB954" />
                    </Animated.View>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerTrack} numberOfLines={1}>
                        {nowPlayingTitle}
                      </Text>
                      <Text style={styles.playerArtist}>{nowPlayingArtist}</Text>
                      <View style={styles.progressRow}>
                        <Text style={styles.progressTime}>{formatTime(positionMs)}</Text>
                        <View style={styles.progressTrack}>
                          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                        </View>
                        <Text style={styles.progressTime}>{formatTime(durationMs)}</Text>
                      </View>
                    </View>
                    <View style={styles.playerControls}>
                      <TouchableOpacity style={styles.playerButton} onPress={() => seekBy(-10000)}>
                        <Ionicons name="play-skip-back" size={22} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.playerButton, styles.playButton]} onPress={togglePlay}>
                        <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#000" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.playerButton} onPress={() => seekBy(10000)}>
                        <Ionicons name="play-skip-forward" size={22} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.inputBar}>
                    <TextInput
                      style={styles.messageInput}
                      placeholder="Say something..."
                      placeholderTextColor="#888"
                      value={newMessage}
                      onChangeText={setNewMessage}
                      onSubmitEditing={sendMessage}
                      returnKeyType="send"
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                      <Ionicons name="send" size={20} color="#1DB954" />
                    </TouchableOpacity>
                  </View>
                </>
              ) : activeTab === 'playlist' ? (
                <>
                  <View style={styles.playlistHeader}>
                    <View style={styles.playlistSearchRow}>
                      <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color="#777" />
                        <TextInput
                          style={styles.searchInput}
                          placeholder="Search songs or artists..."
                          placeholderTextColor="#777"
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          onSubmitEditing={searchTracks}
                          returnKeyType="search"
                        />
                      </View>
                      <TouchableOpacity style={styles.searchAction} onPress={searchTracks}>
                        <Ionicons name="arrow-forward" size={18} color="#0B0B0E" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.syncRow}>
                      <View style={styles.syncBadge}>
                        <View
                          style={[
                            styles.syncDot,
                            wsStatus === 'online' ? styles.syncDotOn : styles.syncDotOff,
                          ]}
                        />
                        <Text style={styles.syncText}>
                          {resolvedWsUrl ? `Sync ${wsStatus}` : 'WS not configured'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.hostToggle, isHost && styles.hostToggleActive]}
                        onPress={() => setIsHost((prev) => !prev)}
                      >
                        <Text style={[styles.hostToggleText, isHost && styles.hostToggleTextActive]}>
                          {isHost ? 'Host mode' : 'Listen mode'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {isSearching ? (
                    <View style={styles.searchState}>
                      <ActivityIndicator color="#1DB954" />
                      <Text style={styles.searchStateText}>Searching previews...</Text>
                    </View>
                  ) : null}
                  {searchError ? (
                    <Text style={styles.searchError}>{searchError}</Text>
                  ) : null}
                  <FlatList
                    ref={playlistRef}
                    data={searchResults}
                    keyExtractor={(item) => item.id}
                    renderItem={renderTrackItem}
                    contentContainerStyle={styles.playlistContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                      !isSearching ? (
                        <View style={styles.emptyState}>
                          <Ionicons name="musical-notes" size={24} color="#666" />
                          <Text style={styles.emptyStateText}>Search a song to start the room.</Text>
                        </View>
                      ) : null
                    }
                  />
                  <View style={styles.playerBar}>
                    <View style={styles.playerArtwork}>
                      <Ionicons name="disc" size={40} color="#1DB954" />
                    </View>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerTrack} numberOfLines={1}>
                        {nowPlayingTitle}
                      </Text>
                      <Text style={styles.playerArtist}>{nowPlayingArtist}</Text>
                      <View style={styles.progressRow}>
                        <Text style={styles.progressTime}>{formatTime(positionMs)}</Text>
                        <View style={styles.progressTrack}>
                          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                        </View>
                        <Text style={styles.progressTime}>{formatTime(durationMs)}</Text>
                      </View>
                    </View>
                    <View style={styles.playerControls}>
                      <TouchableOpacity style={styles.playerButton} onPress={() => seekBy(-10000)}>
                        <Ionicons name="play-skip-back" size={22} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.playerButton, styles.playButton]} onPress={togglePlay}>
                        <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#000" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.playerButton} onPress={() => seekBy(10000)}>
                        <Ionicons name="play-skip-forward" size={22} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <FlatList
                    data={connectedUsers}
                    keyExtractor={(item) => item.id}
                    renderItem={renderUserItem}
                    contentContainerStyle={styles.usersList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                      <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={24} color="#666" />
                        <Text style={styles.emptyStateText}>No users connected yet.</Text>
                      </View>
                    }
                  />
                </>
              )}
            </Animated.View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0B0E',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0B0B0E',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  profileButton: {
    padding: 4,
  },
  backButton: {
    paddingRight: 12,
  },
  headerRoomInfo: {
    flex: 1,
    marginLeft: 8,
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  leaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginRight: 12,
  },
  leaderBadgeText: {
    color: '#1DB954',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  listenersInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listenersInlineText: {
    color: '#AAA',
    fontSize: 12,
    marginLeft: 4,
  },
  lobbyContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchSection: {
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    flex: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#fff',
  },
  searchAction: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lobbyList: {
    paddingBottom: 20,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 25, 0.8)',
    borderRadius: 24,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  roomCardContent: {
    flex: 1,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  listenersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  listenersText: {
    color: '#A0A0A0',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  roomCreator: {
    color: '#AAA',
    fontSize: 14,
    marginBottom: 12,
  },
  roomFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  genreTag: {
    backgroundColor: 'rgba(29, 185, 84, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  genreText: {
    color: '#1DB954',
    fontSize: 12,
    fontWeight: '500',
  },
  nowPlaying: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  nowPlayingText: {
    color: '#CCC',
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  joinIndicator: {
    marginLeft: 8,
  },
  roomContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 30,
  },
  activeTab: {
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
  },
  tabText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#1DB954',
  },
  chatList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageRowSelf: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2A35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  messageBubble: {
    maxWidth: width * 0.7,
    padding: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    backgroundColor: '#1E1E24',
  },
  messageBubbleSelf: {
    backgroundColor: '#1DB954',
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 20,
  },
  messageBubbleOther: {
    borderBottomLeftRadius: 4,
  },
  messageUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageUser: {
    color: '#1DB954',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  leaderChip: {
    backgroundColor: 'rgba(29, 185, 84, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  leaderChipText: {
    color: '#1DB954',
    fontSize: 9,
    fontWeight: '700',
  },
  messageText: {
    color: '#E0E0E0',
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextSelf: {
    color: '#fff',
  },
  messageTime: {
    color: '#888',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  messageTimeSelf: {
    color: 'rgba(255,255,255,0.7)',
  },
  playlistHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  playlistSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  syncDotOn: {
    backgroundColor: '#1DB954',
  },
  syncDotOff: {
    backgroundColor: '#666',
  },
  syncText: {
    color: '#AAA',
    fontSize: 12,
  },
  hostToggle: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  hostToggleActive: {
    borderColor: 'rgba(29, 185, 84, 0.6)',
    backgroundColor: 'rgba(29, 185, 84, 0.12)',
  },
  hostToggleText: {
    color: '#AAA',
    fontSize: 12,
  },
  hostToggleTextActive: {
    color: '#1DB954',
  },
  searchState: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchStateText: {
    marginLeft: 8,
    color: '#AAA',
    fontSize: 12,
  },
  searchError: {
    color: '#E08A8A',
    fontSize: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    color: '#777',
    fontSize: 13,
    marginTop: 8,
  },
  usersList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,30,35,0.8)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarSelf: {
    backgroundColor: 'rgba(29, 185, 84, 0.25)',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  userMeta: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  playlistContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,30,35,0.8)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  trackMeta: {
    flex: 1,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  trackArtist: {
    color: '#AAA',
    fontSize: 13,
    marginTop: 2,
  },
  trackTags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  trackSource: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    marginRight: 8,
  },
  trackSourceText: {
    color: '#1DB954',
    fontSize: 10,
    fontWeight: '600',
  },
  trackDuration: {
    color: '#888',
    fontSize: 11,
  },
  playBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 18, 22, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  playerArtwork: {
    marginRight: 12,
  },
  playerInfo: {
    flex: 1,
    marginRight: 8,
  },
  playerTrack: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  playerArtist: {
    color: '#AAA',
    fontSize: 13,
    marginTop: 2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 6,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#1DB954',
  },
  progressTime: {
    color: '#777',
    fontSize: 10,
    width: 34,
    textAlign: 'center',
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerButton: {
    padding: 6,
  },
  playButton: {
    backgroundColor: '#fff',
    borderRadius: 30,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0B0B0E',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  messageInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    color: '#fff',
    fontSize: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
