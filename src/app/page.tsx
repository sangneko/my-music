"use client";
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Music, SkipBack, SkipForward, Volume2, ListMusic } from 'lucide-react';

export default function Home() {
  const [songs, setSongs] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetch('/api/music').then(res => res.json()).then(setSongs);
  }, []);

  const handlePlay = (i: number) => {
    setCurrentIdx(i);
    setIsPlaying(true);
    setTimeout(() => audioRef.current?.play(), 100);
  };

  const toggle = () => {
    if (isPlaying) audioRef.current?.pause();
    else audioRef.current?.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <main className="min-h-screen bg-black text-zinc-100 p-6 md:p-12">
      <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_350px] gap-10">
        <section>
          <h1 className="text-4xl font-black mb-8 text-emerald-500 tracking-tighter">SANG PLAYER</h1>
          <div className="space-y-2">
            {songs.map((s, i) => (
              <div key={i} onClick={() => handlePlay(i)} 
                className={`p-4 rounded-xl cursor-pointer flex items-center gap-4 transition-all ${currentIdx === i ? 'bg-emerald-600/20 border border-emerald-500/50' : 'bg-zinc-900/50 hover:bg-zinc-800'}`}>
                <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center">
                  <Music size={18} className={currentIdx === i ? "text-emerald-500" : "text-zinc-500"} />
                </div>
                <span className="font-medium truncate">{s.name}</span>
              </div>
            ))}
          </div>
        </section>

        <aside className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 h-fit sticky top-12">
          <div className="aspect-square bg-gradient-to-br from-emerald-500 to-emerald-900 rounded-2xl mb-6 shadow-2xl flex items-center justify-center">
            <Music size={100} className="text-black/20" />
          </div>
          <h2 className="text-2xl font-bold truncate">{songs[currentIdx]?.name || "Chưa chọn nhạc"}</h2>
          <p className="text-zinc-500 mb-8">S3 Cloufly Storage</p>
          
          <audio ref={audioRef} src={songs[currentIdx]?.url} onEnded={() => handlePlay((currentIdx + 1) % songs.length)} />
          
          <div className="flex justify-between items-center mb-10">
            <SkipBack className="hover:text-emerald-500 cursor-pointer" onClick={() => handlePlay((currentIdx - 1 + songs.length) % songs.length)} />
            <button onClick={toggle} className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform">
              {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
            </button>
            <SkipForward className="hover:text-emerald-500 cursor-pointer" onClick={() => handlePlay((currentIdx + 1) % songs.length)} />
          </div>
          <div className="flex items-center gap-3"><Volume2 size={16} /><div className="h-1 flex-1 bg-zinc-800 rounded-full"><div className="w-3/4 h-full bg-emerald-500 rounded-full"></div></div></div>
        </aside>
      </div>
    </main>
  );
}
