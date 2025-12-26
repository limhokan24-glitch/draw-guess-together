import React, { useState, useRef, useEffect } from "react"
import { ChatMessage } from "../types"
import { socket } from "@/src/socket"

interface ChatProps {
  roomId: string
  userId: string
  username: string
}

const Chat: React.FC<ChatProps> = ({ roomId, userId, username }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // 🔌 Join room & listen for messages
  useEffect(() => {
    socket.emit("join-room", roomId)

    socket.on("chat-message", (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg])
    })

    // System welcome message
    const welcome: ChatMessage = {
      id: "system-1",
      sender: "system",
      username: "System",
      text: `Welcome to room "${roomId}"! Invite a friend to join.`,
      timestamp: Date.now(),
    }

    setMessages([welcome])

    return () => {
      socket.off("chat-message")
    }
  }, [roomId])

  // 🔽 Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // ✉️ Send message
  const sendMessage = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputValue.trim()) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      username,
      text: inputValue,
      timestamp: Date.now(),
    }

    // Add locally
    setMessages(prev => [...prev, userMsg])
    setInputValue("")

    // Send to backend
    socket.emit("chat-message", {
      roomId,
      message: userMsg,
    })
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="font-bold text-gray-700">Room Chat</h3>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30"
      >
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                {msg.username}
              </span>
              <span className="text-[10px] text-gray-400">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div
              className={`px-4 py-2 rounded-2xl text-sm max-w-[85%] shadow-sm ${
                msg.sender === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none"
                  : msg.sender === "system"
                  ? "bg-gray-200 text-gray-600 italic mx-auto text-center"
                  : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={sendMessage}
        className="p-4 border-t border-gray-200 bg-white"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Send a message to guess the drawing..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
          <button
            type="submit"
            className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

export default Chat
