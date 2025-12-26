
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SyncMessage } from '../types';
import { BROADCAST_CHANNEL_NAME } from '../constants';

interface ChatProps {
  roomId: string;
  userId: string;
  username: string;
}

const Chat: React.FC<ChatProps> = ({ roomId, userId, username }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const broadcastChannel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    broadcastChannel.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    broadcastChannel.current.onmessage = (event) => {
      const msg: SyncMessage = event.data;
      if (msg.roomId !== roomId || msg.senderId === userId) return;
      if (msg.type === 'CHAT') {
        setMessages(prev => [...prev, msg.payload]);
      }
    };

    // Initial Welcome Message
    const welcome: ChatMessage = {
      id: 'system-1',
      sender: 'system',
      username: 'System',
      text: `Welcome to room "${roomId}"! Invite friends to join by sharing your Room ID or opening this in another tab.`,
      timestamp: Date.now()
    };
    setMessages([welcome]);

    return () => broadcastChannel.current?.close();
  }, [roomId, userId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      username: username,
      text: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Broadcast message to other tabs/users
    broadcastChannel.current?.postMessage({
      type: 'CHAT',
      payload: userMsg,
      roomId,
      senderId: userId
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="font-bold text-gray-700">Room Chat</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${msg.sender === 'system' ? 'text-gray-400' : 'text-gray-500'}`}>
                {msg.username}
              </span>
              <span className="text-[10px] text-gray-400">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className={`px-4 py-2 rounded-2xl text-sm max-w-[85%] shadow-sm ${
              msg.sender === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : msg.sender === 'system'
                  ? 'bg-gray-200 text-gray-600 italic mx-auto text-center rounded-lg'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Send a message to the room..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
          />
          <button
            type="submit"
            className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
