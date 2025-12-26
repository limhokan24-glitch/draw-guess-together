
export type Point = { x: number; y: number };

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
  id: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  username: string;
  text: string;
  timestamp: number;
}

export interface SyncMessage {
  type: 'DRAW' | 'CLEAR' | 'CHAT' | 'UNDO';
  payload: any;
  roomId: string;
  senderId: string;
}

export interface RoomState {
  id: string;
  strokes: Stroke[];
  users: string[];
}
