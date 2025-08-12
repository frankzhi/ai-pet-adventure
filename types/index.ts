export interface Pet {
  id: string;
  name: string;
  type: string;
  image: string;
  worldSetting: string;
  background: string;
  characteristics: string[];
  personality: string;
  health: number;
  happiness: number;
  energy: number;
  hunger: number; // 0-100，0=很饿，100=很饱
  level: number;
  experience: number;
  createdAt: Date;
  lastInteraction: Date;
  isAlive: boolean;
  // 新增：宠物特定属性
  petType: 'animal' | 'robot' | 'plant' | 'magical' | 'food' | 'object';
  specialNeeds: string[]; // 特殊需求，如充电、浇水等
  personalityType: 'extroverted' | 'introverted' | 'calm' | 'energetic' | 'mysterious' | 'friendly' | 'aloof' | 'playful';
  // 新增：宠物当前状态
  currentActivity: string; // 当前活动描述
  lastActivityUpdate: Date; // 上次活动更新时间
  mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'tired' | 'hungry' | 'lonely'; // 当前心情
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'story' | 'special' | 'physical' | 'conversation';
  category: 'feeding' | 'exercise' | 'care' | 'interaction' | 'training' | 'other';
  reward: {
    experience: number;
    happiness: number;
    health: number;
    energy?: number;
    hunger?: number;
  };
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
  // 新增：任务完成方式
  completionMethod: 'checkbox' | 'physical' | 'conversation' | 'timer';
  // 新增：物理任务详情
  physicalTask?: {
    action: string; // 如"做10个蹲起"
    duration?: number; // 持续时间（秒）
    count?: number; // 重复次数
  };
  // 新增：对话任务详情
  conversationTask?: {
    requiredKeywords: string[];
    requiredResponse: string;
  };
  // 新增：定时任务详情
  timerTask?: {
    duration: number; // 持续时间（秒）
    description: string;
  };
  // 新增：计时任务完成窗口
  timerCompletionWindow?: number; // 完成窗口时间（分钟）
}

// 新增：计时器状态管理
export interface TimerState {
  taskId: string;
  startTime: number;
  duration: number;
  isActive: boolean;
  completedAt?: number; // 计时器完成时间
}

// 新增：随机事件系统
export interface RandomEvent {
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
  effect: {
    happiness?: number;
    health?: number;
    energy?: number;
    hunger?: number;
    experience?: number;
  };
  timestamp: Date;
  isRead: boolean;
}

// 新增：宠物活动记录
export interface ActivityLog {
  id: string;
  activity: string;
  timestamp: Date;
  type: 'action' | 'event' | 'status_change';
  details?: string;
}

export interface Conversation {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  taskId?: string;
  isPetInitiated?: boolean; // 是否是宠物主动发起的对话
  // 新增：肢体动作描述
  action?: string; // 宠物的肢体动作描述
}

export interface GameState {
  pets: Pet[]; // 改为支持多宠物
  activePetId: string; // 当前活跃的宠物ID
  tasks: Task[];
  conversations: Conversation[];
  currentStory: string;
  worldGenre: string;
  lastPetInteraction: Date; // 宠物上次主动互动的时间
  activeTimers: TimerState[]; // 新增：活跃的计时器
  // 新增：随机事件和活动记录
  randomEvents: RandomEvent[];
  activityLogs: ActivityLog[];
  lastStatusUpdate: Date; // 上次状态更新时间
}

export interface AIResponse {
  content: string;
  tasks?: Task[];
  storyUpdate?: string;
  petStatus?: Partial<Pet>;
  shouldPetInitiate?: boolean; // 是否应该让宠物主动互动
  // 新增：肢体动作
  action?: string; // 宠物的肢体动作
}

export interface ImageUploadResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface ImageAnalysisResult {
  objects: string[];
  colors: string[];
  description: string;
  confidence: number;
}

// 新增：宠物主动互动配置
export interface PetInteractionConfig {
  minInterval: number; // 最小间隔时间（小时）
  maxInterval: number; // 最大间隔时间（小时）
  conditions: {
    lowHappiness: boolean; // 低快乐度时主动互动
    lowHealth: boolean; // 低健康度时主动互动
    lowEnergy: boolean; // 低能量时主动互动
    highHunger: boolean; // 高饥饿度时主动互动
  };
  // 新增：根据性格类型调整互动频率
  personalityMultiplier: number; // 性格对互动频率的影响倍数
  // 新增：某些性格可能完全不主动互动
  canInitiate: boolean; // 是否可以主动互动
} 