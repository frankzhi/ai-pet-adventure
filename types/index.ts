export interface Pet {
  id: string;
  name: string;
  type: string;
  image: string;
  worldSetting: string;
  background: string;
  characteristics: string[];
  personality: string;
  // 重新设计的状态系统
  health: number; // 0-100，健康值，0时死亡
  mood: number; // 0-100，心情值，影响互动欲望和对话风格
  energy: number; // 0-100，能量值，合并了原来的能量和饱食度
  mutation: number; // 0-100，突变值，影响突变概率
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
  currentMoodState: 'happy' | 'neutral' | 'sad' | 'angry' | 'anxious' | 'tired' | 'excited' | 'lonely'; // 当前心情状态
  // 新增：突变系统
  mutations: string[]; // 突变标签列表
  lastMutationCheck: Date; // 上次突变检查时间
  // 新增：休息状态追踪
  isResting: boolean; // 是否在休息状态
  restStartTime?: Date; // 开始休息的时间
  restDuration?: number; // 计划休息时长（分钟）
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'story' | 'special' | 'physical' | 'conversation';
  category: 'feeding' | 'exercise' | 'care' | 'interaction' | 'training' | 'other';
  reward: {
    experience: number;
    mood: number; // 心情值变化
    health: number;
    energy: number; // 能量值变化
    mutation?: number; // 突变值变化（可选）
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
    mood?: number;
    health?: number;
    energy?: number;
    mutation?: number;
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
    lowMood: boolean; // 低心情时主动互动
    lowHealth: boolean; // 低健康度时主动互动
    lowEnergy: boolean; // 低能量时主动互动
    highMutation: boolean; // 高突变值时主动互动
  };
  // 新增：根据性格类型调整互动频率
  personalityMultiplier: number; // 性格对互动频率的影响倍数
  // 新增：某些性格可能完全不主动互动
  canInitiate: boolean; // 是否可以主动互动
}

// 新增：突变定义
export interface Mutation {
  id: string;
  name: string;
  description: string;
  type: 'physical' | 'behavioral' | 'ability' | 'appearance';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  effects: {
    moodMultiplier?: number; // 心情值变化倍数
    energyMultiplier?: number; // 能量值变化倍数
    healthMultiplier?: number; // 健康值变化倍数
    specialAbility?: string; // 特殊能力描述
  };
  // 突变的触发条件
  triggers: {
    minMutation: number; // 最小突变值要求
    petTypes?: ('animal' | 'robot' | 'plant' | 'magical' | 'food' | 'object')[]; // 适用的宠物类型
    personalityTypes?: ('extroverted' | 'introverted' | 'calm' | 'energetic' | 'mysterious' | 'friendly' | 'aloof' | 'playful')[]; // 适用的性格类型
  };
} 