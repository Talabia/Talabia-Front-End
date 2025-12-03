export enum ChatTimeFilter {
  All = 0,
  Last24Hours = 1,
  LastWeek = 2,
  LastMonth = 3,
}

export interface Participant {
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  isOnline: boolean;
  lastSeenAt: string;
  isAdmin: boolean;
  joinedAt: string;
}

export interface LastMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'Text' | 'Image' | 'File';
  status: 'Sent' | 'Delivered' | 'Read';
  sentAt: string;
  editedAt?: string;
  isOwn: boolean;
  isRead: boolean;
}

export interface Chat {
  chatId: string;
  chatType: 'Direct' | 'Group';
  participants: Participant[];
  lastMessage?: LastMessage;
  totalMessages: number;
  createdAt: string;
  lastMessageAt?: string;
}

export interface ChatsListRequest {
  timeFilter: ChatTimeFilter;
  pageSize: number;
  currentPage: number;
}

export interface ChatsListResponse {
  data: Chat[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

export interface MessagesRequest {
  chatId: string;
  pageSize: number;
  currentPage: number;
}

export interface MessagesResponse {
  data: LastMessage[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
