import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// SVG Icons as React Components
const IconChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);
const IconMusic = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
);
const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
const IconPlay = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>
);
const IconPause = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></svg>
);
const IconVolume = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
);
const IconVolumeMute = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg>
);
const IconCopy = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
);
const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
);
const IconTerminal = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>
);
const IconLyrics = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
);
const IconMenu = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
);

interface ParamDefinition {
  name: string;
  type: 'query' | 'path';
  required: boolean;
  defaultValue?: string;
  description: string;
}

interface Endpoint {
  id: string;
  category: string;
  name: string;
  method: 'GET';
  path: string;
  description: string;
  params: ParamDefinition[];
}

const ENDPOINTS: Endpoint[] = [
  {
    id: 'base_info',
    category: 'General',
    name: 'Base Info',
    method: 'GET',
    path: '/',
    description: 'Welcome details, routing links, and official API guidelines check.',
    params: []
  },
  {
    id: 'search_all',
    category: 'Search',
    name: 'All Search',
    method: 'GET',
    path: '/api/search',
    description: 'Global auto-complete search. Returns metadata categorized in songs, albums, artists, and playlists.',
    params: [
      { name: 'query', type: 'query', required: true, description: 'Search keywords (e.g., Arijit Singh, Peaches, Pritam)' }
    ]
  },
  {
    id: 'search_songs',
    category: 'Search',
    name: 'Search Songs',
    method: 'GET',
    path: '/api/search/songs',
    description: 'Search specifically for songs with full track meta data and high-quality stream links.',
    params: [
      { name: 'query', type: 'query', required: true, description: 'Song name, artist, or tags' },
      { name: 'page', type: 'query', required: false, defaultValue: '1', description: 'Page index' },
      { name: 'limit', type: 'query', required: false, defaultValue: '20', description: 'Total response limit (max 50)' }
    ]
  },
  {
    id: 'search_albums',
    category: 'Search',
    name: 'Search Albums',
    method: 'GET',
    path: '/api/search/albums',
    description: 'Search specifically for music albums.',
    params: [
      { name: 'query', type: 'query', required: true, description: 'Album name or keywords' },
      { name: 'page', type: 'query', required: false, defaultValue: '1', description: 'Page index' },
      { name: 'limit', type: 'query', required: false, defaultValue: '20', description: 'Total response limit' }
    ]
  },
  {
    id: 'search_artists',
    category: 'Search',
    name: 'Search Artists',
    method: 'GET',
    path: '/api/search/artists',
    description: 'Search specifically for music artists and singers.',
    params: [
      { name: 'query', type: 'query', required: true, description: 'Artist name' },
      { name: 'page', type: 'query', required: false, defaultValue: '1', description: 'Page index' },
      { name: 'limit', type: 'query', required: false, defaultValue: '20', description: 'Total response limit' }
    ]
  },
  {
    id: 'search_playlists',
    category: 'Search',
    name: 'Search Playlists',
    method: 'GET',
    path: '/api/search/playlists',
    description: 'Search specifically for curated playlists.',
    params: [
      { name: 'query', type: 'query', required: true, description: 'Playlist name or theme' },
      { name: 'page', type: 'query', required: false, defaultValue: '1', description: 'Page index' },
      { name: 'limit', type: 'query', required: false, defaultValue: '20', description: 'Total response limit' }
    ]
  },
  {
    id: 'get_songs',
    category: 'Songs',
    name: 'Get Songs Detail',
    method: 'GET',
    path: '/api/songs',
    description: 'Retrieve detailed song metadata by comma-separated Song IDs OR JioSaavn web URL.',
    params: [
      { name: 'ids', type: 'query', required: false, description: 'Comma-separated song IDs (e.g., 3C_v0t1D, PWAFVxJg)' },
      { name: 'link', type: 'query', required: false, description: 'Direct JioSaavn song web URL' }
    ]
  },
  {
    id: 'get_song_by_id',
    category: 'Songs',
    name: 'Get Song by ID',
    method: 'GET',
    path: '/api/songs/:id',
    description: 'Retrieve detailed song metadata directly by passing its unique ID as a path parameter.',
    params: [
      { name: 'id', type: 'path', required: true, description: 'Song ID (e.g., Lb52lD_P)' }
    ]
  },
  {
    id: 'get_suggestions',
    category: 'Songs',
    name: 'Get Suggestions',
    method: 'GET',
    path: '/api/songs/:id/suggestions',
    description: 'Get automated song recommendations matching the vibe of a song ID.',
    params: [
      { name: 'id', type: 'path', required: true, description: 'Song ID to match suggestions against' },
      { name: 'limit', type: 'query', required: false, defaultValue: '10', description: 'Limit recommendations count' }
    ]
  },
  {
    id: 'get_lyrics',
    category: 'Songs',
    name: 'Get Song Lyrics',
    method: 'GET',
    path: '/api/songs/:id/lyrics',
    description: 'Fetch lyrics by song ID or lyrics ID.',
    params: [
      { name: 'id', type: 'path', required: true, description: 'Lyrics ID or Song ID' }
    ]
  },
  {
    id: 'get_album_details',
    category: 'Collections',
    name: 'Get Album Details',
    method: 'GET',
    path: '/api/albums',
    description: 'Fetch full metadata and tracklist for an album.',
    params: [
      { name: 'id', type: 'query', required: true, description: 'Album ID' }
    ]
  },
  {
    id: 'get_playlist_details',
    category: 'Collections',
    name: 'Get Playlist Details',
    method: 'GET',
    path: '/api/playlists',
    description: 'Fetch full track details for a playlist.',
    params: [
      { name: 'id', type: 'query', required: true, description: 'Playlist ID' }
    ]
  },
  {
    id: 'get_artist_details',
    category: 'Collections',
    name: 'Get Artist Details',
    method: 'GET',
    path: '/api/artists/:id',
    description: 'Fetch biographical data, top songs, and top albums for an artist.',
    params: [
      { name: 'id', type: 'path', required: true, description: 'Artist ID' },
      { name: 'page', type: 'query', required: false, defaultValue: '1', description: 'Page number' },
      { name: 'songCount', type: 'query', required: false, defaultValue: '20', description: 'Top songs count to fetch' },
      { name: 'albumCount', type: 'query', required: false, defaultValue: '20', description: 'Top albums count to fetch' }
    ]
  }
];

function App() {
  const [baseUrl, setBaseUrl] = useState('http://localhost:3000');
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [activeEndpoint, setActiveEndpoint] = useState<Endpoint>(ENDPOINTS[0]);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Response States
  const [loading, setLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseStatusText, setResponseStatusText] = useState<string>('');
  const [responseDuration, setResponseDuration] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Music Player States
  const [songList, setSongList] = useState<any[]>([]);
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [selectedQualityUrl, setSelectedQualityUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [lyricsData, setLyricsData] = useState<string | null>(null);
  const [fetchingLyrics, setFetchingLyrics] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Group Endpoints by Category
  const categories = ENDPOINTS.reduce((acc, ep) => {
    if (!acc[ep.category]) acc[ep.category] = [];
    acc[ep.category].push(ep);
    return acc;
  }, {} as Record<string, Endpoint[]>);

  // Check server health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(baseUrl);
        if (res.ok) {
          setServerOnline(true);
        } else {
          setServerOnline(false);
        }
      } catch (e) {
        setServerOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, [baseUrl]);

  // Handle Endpoint Switch
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    activeEndpoint.params.forEach(p => {
      initialValues[p.name] = p.defaultValue || '';
    });
    setParamValues(initialValues);
  }, [activeEndpoint]);

  // Sync Seeker time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentSong]);

  // Sync Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Formulate Request Path
  const getCompiledUrl = () => {
    let path = activeEndpoint.path;
    // Replace path variables
    activeEndpoint.params.forEach(p => {
      if (p.type === 'path') {
        path = path.replace(`:${p.name}`, encodeURIComponent(paramValues[p.name] || ''));
      }
    });

    const queryParams: string[] = [];
    activeEndpoint.params.forEach(p => {
      if (p.type === 'query' && paramValues[p.name]) {
        queryParams.push(`${p.name}=${encodeURIComponent(paramValues[p.name])}`);
      }
    });

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return `${baseUrl}${path}${queryString}`;
  };

  // Extract songs from response data to play
  const extractSongs = (data: any): any[] => {
    if (!data) return [];
    if (data.success && data.data) {
      return extractSongs(data.data);
    }
    if (Array.isArray(data)) {
      return data.filter(item => item && item.downloadUrl);
    }
    let extracted: any[] = [];
    if (data.songs && data.songs.results) {
      extracted = extracted.concat(data.songs.results);
    }
    if (data.results && Array.isArray(data.results)) {
      extracted = extracted.concat(data.results.filter((item: any) => item.downloadUrl));
    }
    if (data.topSongs && Array.isArray(data.topSongs)) {
      extracted = extracted.concat(data.topSongs);
    }
    // Autocomplete Search Top Query songs
    if (data.topQuery && data.topQuery.results) {
      extracted = extracted.concat(data.topQuery.results.filter((item: any) => item.type === 'song'));
    }
    
    // Map autocomplete results to regular Song schema structure if mismatch
    return extracted.map(item => {
      // Autocomplete search returns simple structured items
      if (item.singers && !item.artists) {
        return {
          id: item.id,
          name: item.title,
          artists: {
            primary: [{ name: item.primaryArtists || item.singers }]
          },
          image: item.image,
          downloadUrl: item.downloadUrl || []
        };
      }
      return item;
    }).filter(item => item && item.downloadUrl && item.downloadUrl.length > 0);
  };

  // Submit Request
  const handleSendRequest = async () => {
    setLoading(true);
    setResponseData(null);
    setResponseStatus(null);
    setLyricsData(null);
    const start = performance.now();
    const requestUrl = getCompiledUrl();

    try {
      const res = await fetch(requestUrl);
      const end = performance.now();
      setResponseDuration(Math.round(end - start));
      setResponseStatus(res.status);
      setResponseStatusText(res.statusText);

      const json = await res.json();
      setResponseData(json);

      // Extract playable songs
      const songs = extractSongs(json);
      setSongList(songs);
      if (songs.length > 0 && !currentSong) {
        loadSong(songs[0]);
      }
    } catch (err: any) {
      const end = performance.now();
      setResponseDuration(Math.round(end - start));
      setResponseStatus(500);
      setResponseStatusText('Fetch Failed');
      setResponseData({ success: false, error: err.message || 'Internal connection failed' });
      setSongList([]);
    } finally {
      setLoading(false);
    }
  };

  // Load song into player
  const loadSong = (song: any) => {
    setCurrentSong(song);
    // Find best download link (usually 320kbps is last or match quality)
    const bestQualityLink = song.downloadUrl.find((link: any) => link.quality === '320kbps') || song.downloadUrl[song.downloadUrl.length - 1];
    setSelectedQualityUrl(bestQualityLink?.url || '');
    setLyricsData(null);
    setIsPlaying(false);
    
    if (audioRef.current) {
      audioRef.current.src = bestQualityLink?.url || '';
      audioRef.current.load();
    }
  };

  // Toggle playback
  const togglePlayPause = () => {
    if (!audioRef.current || !selectedQualityUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(e => {
        console.error("Playback block:", e);
      });
    }
  };

  // Seek song
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  // Format seconds
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Copy json response
  const handleCopyCode = () => {
    navigator.clipboard.writeText(JSON.stringify(responseData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Quick fetch lyrics
  const handleFetchLyrics = async () => {
    if (!currentSong) return;
    setFetchingLyrics(true);
    setLyricsData(null);
    try {
      const res = await fetch(`${baseUrl}/api/songs/${currentSong.id}/lyrics`);
      const json = await res.json();
      if (json.success && json.data && json.data.lyrics) {
        setLyricsData(json.data.lyrics);
      } else {
        setLyricsData("Lyrics are not available for this song.");
      }
    } catch (e) {
      setLyricsData("Error occurred while fetching lyrics.");
    } finally {
      setFetchingLyrics(false);
    }
  };

  return (
    <div className="playground-container">
      {/* Hidden Audio Element */}
      <audio ref={audioRef} />

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="btn-icon" style={{ border: 'none', background: 'transparent', padding: '4px' }} onClick={() => setSidebarOpen(true)}>
          <IconMenu />
        </button>
        <div className="brand" style={{ fontSize: '1.05rem' }}>
          <IconMusic />
          <span>API Playground</span>
        </div>
        <div className={`status-indicator ${serverOnline ? 'status-online' : 'status-offline'}`} style={{ padding: '2px 8px', fontSize: '0.65rem' }}>
          <span className={`pulse-dot ${serverOnline ? 'online' : 'offline'}`} />
          <span style={{ marginLeft: '4px' }}>{serverOnline ? 'Online' : 'Offline'}</span>
        </div>
      </header>

      {/* Sidebar Panel */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <IconMusic />
            <span>JioSaavn API Playground</span>
          </div>

          <div className="server-config">
            <span className="label-mini">Server Address</span>
            <input
              type="text"
              className="base-url-input"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:3000"
            />
          </div>

          {serverOnline !== null && (
            <div className={`status-indicator ${serverOnline ? 'status-online' : 'status-offline'}`}>
              <span className={`pulse-dot ${serverOnline ? 'online' : 'offline'}`} />
              <span>{serverOnline ? 'API Connected' : 'API Connection Lost'}</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {Object.entries(categories).map(([cat, eps]) => (
            <div key={cat}>
              <div className="nav-group-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {cat === 'Search' ? <IconSearch /> : cat === 'General' ? <IconTerminal size={14} /> : <IconMusic />}
                <span>{cat}</span>
              </div>
              <ul className="nav-list">
                {eps.map(ep => (
                  <li
                    key={ep.id}
                    className={`nav-item ${activeEndpoint.id === ep.id ? 'active' : ''}`}
                    onClick={() => {
                      setActiveEndpoint(ep);
                      setSidebarOpen(false); // auto-close drawer on select
                    }}
                  >
                    <span className="badge-method badge-get">{ep.method}</span>
                    <span>{ep.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Workspace Area */}
      <main className="workspace">
        
        {/* Editor Panel */}
        <section className="panel panel-editor">
          <div className="panel-header">
            <h2 className="panel-title">
              Request Builder
            </h2>
          </div>

          <div className="panel-scrollable">
            <div className="endpoint-info">
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{activeEndpoint.name}</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{activeEndpoint.description}</p>
              <div className="endpoint-path">
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>GET</span>
                <span>{activeEndpoint.path}</span>
              </div>
            </div>

            {activeEndpoint.params.length > 0 && (
              <div className="parameter-card">
                <span className="label-mini">Parameters</span>
                {activeEndpoint.params.map(param => (
                  <div key={param.name} className="param-row">
                    <div className="param-meta">
                      <div className="param-name-wrapper">
                        <span className="param-name">{param.name}</span>
                        {param.required ? (
                          <span className="param-required">required</span>
                        ) : (
                          <span className="param-optional">optional</span>
                        )}
                      </div>
                      <span className="param-type">{param.type === 'query' ? 'Query String' : 'Path Variable'}</span>
                    </div>
                    <span className="param-desc">{param.description}</span>
                    <input
                      type="text"
                      className="param-input"
                      value={paramValues[param.name] || ''}
                      onChange={(e) => setParamValues({ ...paramValues, [param.name]: e.target.value })}
                      placeholder={param.defaultValue ? `Default: ${param.defaultValue}` : 'Enter value...'}
                    />
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleSendRequest}
              disabled={loading || (activeEndpoint.params.some(p => p.required && !paramValues[p.name]))}
              className="btn-send"
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  <span>Executing Fetch...</span>
                </>
              ) : (
                <>
                  <span>Send Request</span>
                  <IconChevronRight />
                </>
              )}
            </button>
          </div>
        </section>

        {/* Response Panel */}
        <section className="panel panel-response">
          <div className="panel-header">
            <h2 className="panel-title">Response Dashboard</h2>
            {responseStatus !== null && (
              <div className="response-meta-bar">
                <span className={`resp-badge ${responseStatus >= 200 && responseStatus < 300 ? 'resp-badge-success' : 'resp-badge-error'}`}>
                  {responseStatus} {responseStatusText}
                </span>
                {responseDuration !== null && (
                  <span className="resp-time">{responseDuration} ms</span>
                )}
              </div>
            )}
          </div>

          <div className="panel-scrollable" style={{ gap: '20px' }}>
            {responseData ? (
              <>
                {/* 1. Playable Audio Stream Card (Wow Factor) */}
                {currentSong && (
                  <div className="audio-player-card">
                    <div className="player-header">
                      <img
                        className="player-artwork"
                        src={currentSong.image?.find((img: any) => img.quality === '500x500')?.url || currentSong.image?.find((img: any) => img.quality === '150x150')?.url || 'https://www.jiosaavn.com/favicon.ico'}
                        alt={currentSong.name}
                      />
                      <div className="player-info">
                        <h3 className="player-track-name">{currentSong.name}</h3>
                        <p className="player-artist-name">
                          {currentSong.artists?.primary?.map((a: any) => a.name).join(', ') || 'Unknown Artist'}
                        </p>
                        <p className="player-album-name">{currentSong.album?.name || 'Single'}</p>
                      </div>

                      <div className="player-quality-selector">
                        <span className="label-mini" style={{ color: '#9CA3AF' }}>Bitrate</span>
                        <select
                          className="quality-select"
                          value={selectedQualityUrl}
                          onChange={(e) => {
                            setSelectedQualityUrl(e.target.value);
                            setIsPlaying(false);
                            if (audioRef.current) {
                              audioRef.current.src = e.target.value;
                              audioRef.current.load();
                            }
                          }}
                        >
                          {currentSong.downloadUrl.map((link: any) => (
                            <option key={link.quality} value={link.url}>
                              {link.quality}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="player-controls-row">
                      <button className="btn-play-pause" onClick={togglePlayPause}>
                        {isPlaying ? <IconPause /> : <IconPlay />}
                      </button>

                      <div className="player-seeker-wrapper">
                        <input
                          type="range"
                          className="seeker-bar"
                          min="0"
                          max={duration || 0}
                          value={currentTime}
                          onChange={handleSeekChange}
                        />
                        <div className="seeker-time-row">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>

                      <div className="volume-wrapper">
                        <button className="btn-icon" style={{ border: 'none', background: 'transparent' }} onClick={() => setIsMuted(!isMuted)}>
                          {isMuted ? <IconVolumeMute /> : <IconVolume />}
                        </button>
                        <input
                          type="range"
                          className="volume-slider"
                          min="0"
                          max="1"
                          step="0.05"
                          value={volume}
                          onChange={(e) => {
                            setVolume(parseFloat(e.target.value));
                            setIsMuted(false);
                          }}
                        />
                      </div>

                      {/* Lyrics button */}
                      {currentSong.id && (
                        <button
                          onClick={handleFetchLyrics}
                          className="btn-icon"
                          title="Get Lyrics"
                          disabled={fetchingLyrics}
                        >
                          {fetchingLyrics ? <div className="spinner" style={{ width: '14px', height: '14px' }} /> : <IconLyrics />}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Lyrics Container */}
                {lyricsData && (
                  <div className="lyrics-container">
                    <div className="label-mini" style={{ marginBottom: '8px', color: 'var(--accent-cyan)' }}>Song Lyrics</div>
                    {lyricsData}
                  </div>
                )}

                {/* 2. Discovered Playable Songs List (If multiple results) */}
                {songList.length > 1 && (
                  <div>
                    <span className="label-mini" style={{ display: 'block', marginBottom: '8px' }}>Discovered Tracks ({songList.length})</span>
                    <div className="songs-list-container">
                      {songList.map(song => (
                        <div
                          key={song.id}
                          className={`song-item-row ${currentSong?.id === song.id ? 'active' : ''}`}
                          onClick={() => loadSong(song)}
                        >
                          <img
                            className="song-row-img"
                            src={song.image?.find((img: any) => img.quality === '50x50')?.url || 'https://www.jiosaavn.com/favicon.ico'}
                            alt=""
                          />
                          <div className="song-row-info">
                            <span className="song-row-name">{song.name}</span>
                            <span className="song-row-artist">
                              {song.artists?.primary?.map((a: any) => a.name).join(', ') || 'Unknown'}
                            </span>
                          </div>
                          <IconChevronRight />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Raw Json Output View */}
                <div>
                  <span className="label-mini" style={{ display: 'block', marginBottom: '8px' }}>JSON Body Response</span>
                  <div className="code-viewer-container">
                    <div className="code-header">
                      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>application/json</span>
                      <button className="btn-icon" onClick={handleCopyCode}>
                        {copied ? <IconCheck /> : <IconCopy />}
                      </button>
                    </div>
                    <pre className="code-body">
                      <code>{JSON.stringify(responseData, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              </>
            ) : (
              <div className="placeholder-container">
                <IconTerminal size={48} />
                <div>
                  <h3 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: '1rem' }}>No active response details</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Fill query parameters and tap "Send Request" to test routes.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
        
      </main>
    </div>
  );
}

export default App;
