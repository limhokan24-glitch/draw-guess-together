
import React, { useState, useEffect } from 'react';
import Whiteboard from './components/Whiteboard';
import Chat from './components/Chat';

const App: React.FC = () => {
  const [roomId, setRoomId] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [joined, setJoined] = useState(false);
  const [userId] = useState(() => Math.random().toString(36).substr(2, 9));
  const [canvasData, setCanvasData] = useState<string | null>(null);

  // Initialize from Hash
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setRoomId(hash);
    }
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId && username) {
      window.location.hash = roomId;
      setJoined(true);
    }
  };

  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-white">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-indigo-600 rounded-2xl shadow-lg mb-4 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">SyncDraw</h1>
            <p className="text-gray-500 mt-2">Real-time collaborative whiteboard for teams</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Room Name</label>
              <input
                type="text"
                required
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="e.g. brainstorming-session"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              />
              <p className="mt-1 text-xs text-gray-400">Join the same room as your friends to draw together.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Display Name</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-95"
            >
              Join Room
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">How it works</h4>
            <div className="grid grid-cols-2 gap-4 text-xs font-medium text-gray-600">
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Instant Canvas Sync
              </div>
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                Room-based Chat
              </div>
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                Unlimited Drawings
              </div>
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                High-DPI Support
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-50 p-2 md:p-4 gap-4 overflow-hidden">
      {/* Sidebar - Chat & Room Info */}
      <div className="w-full md:w-[350px] h-[40vh] md:h-full flex flex-col gap-4">
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-800 truncate max-w-[200px]">Room: {roomId}</h2>
            <p className="text-xs text-gray-400 font-medium">Playing as {username}</p>
          </div>
          <button 
            onClick={() => { window.location.hash = ''; window.location.reload(); }}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Leave Room"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 min-h-0">
          <Chat 
            roomId={roomId} 
            userId={userId} 
            username={username}
          />
        </div>
      </div>

      {/* Main Content - Whiteboard */}
      <div className="flex-1 h-[60vh] md:h-full">
        <Whiteboard 
          roomId={roomId} 
          userId={userId} 
          onCanvasUpdate={setCanvasData}
        />
      </div>
    </div>
  );
};

export default App;
