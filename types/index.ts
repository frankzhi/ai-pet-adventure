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
  hunger: number;
  level: number;
  experience: number;
  createdAt: Date;
  lastInteraction: Date;
  isAlive: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'story' | 'special';
  reward: {
    experience: number;
    happiness: number;
    health: number;
  };
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export interface Conversation {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  taskId?: string;
}

export interface GameState {
  pet: Pet;
  tasks: Task[];
  conversations: Conversation[];
  currentStory: string;
  worldGenre: string;
}

export interface AIResponse {
  content: string;
  tasks?: Task[];
  storyUpdate?: string;
  petStatus?: Partial<Pet>;
}

export interface ImageUploadResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
} 