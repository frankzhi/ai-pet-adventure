import { Pet, Task, Conversation, GameState, AIResponse } from '../types';
import { AIService } from './ai-service';
import { ImageAnalysisService, ImageAnalysisResult } from './image-analysis';

export class GameService {
  private static STORAGE_KEY = 'ai_pet_adventure_game_state';

  static saveGameState(gameState: GameState): void {
    try {
      const serializedState = JSON.stringify(gameState, (key, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      });
      localStorage.setItem(this.STORAGE_KEY, serializedState);
    } catch (error) {
      console.error('保存游戏状态失败:', error);
    }
  }

  static loadGameState(): GameState | null {
    try {
      const savedState = localStorage.getItem(this.STORAGE_KEY);
      if (!savedState) return null;

      const gameState = JSON.parse(savedState, (key, value) => {
        if (key === 'createdAt' || key === 'lastInteraction' || key === 'completedAt' || key === 'timestamp') {
          return new Date(value);
        }
        return value;
      });

      return gameState;
    } catch (error) {
      console.error('加载游戏状态失败:', error);
      return null;
    }
  }

  static deleteGameState(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('删除游戏状态失败:', error);
    }
  }

  static async createNewPetFromImage(
    imageFile: File, 
    genre?: string
  ): Promise<GameState> {
    try {
      // 第一步：图像分析
      console.log('开始图像分析...');
      const imageAnalysis = await ImageAnalysisService.analyzeImageSmart(imageFile);
      console.log('图像分析结果:', imageAnalysis);
      
      // 第二步：基于分析结果生成宠物
      console.log('基于图像分析生成宠物...');
      const pet = await AIService.generatePetFromImageAnalysis(imageAnalysis, genre);
      
      // 第三步：生成任务
      console.log('生成日常任务...');
      const tasks = await AIService.generateDailyTasks(pet);
      
      const gameState: GameState = {
        pet,
        tasks,
        conversations: [],
        currentStory: `欢迎来到${pet.name}的世界！${pet.worldSetting}`,
        worldGenre: genre || '随机创意风格',
      };

      this.saveGameState(gameState);
      return gameState;
    } catch (error) {
      console.error('创建新宠物失败:', error);
      throw error;
    }
  }

  static async createNewPet(imageDescription: string, genre?: string): Promise<GameState> {
    try {
      const pet = await AIService.generatePetFromImage(imageDescription, genre);
      const tasks = await AIService.generateDailyTasks(pet);
      
      const gameState: GameState = {
        pet,
        tasks,
        conversations: [],
        currentStory: `欢迎来到${pet.name}的世界！${pet.worldSetting}`,
        worldGenre: genre || '随机创意风格',
      };

      this.saveGameState(gameState);
      return gameState;
    } catch (error) {
      console.error('创建新宠物失败:', error);
      throw error;
    }
  }

  static async sendMessage(message: string): Promise<AIResponse> {
    const gameState = this.loadGameState();
    if (!gameState) {
      throw new Error('没有找到游戏状态');
    }

    // 添加用户消息到对话历史
    const userMessage: Conversation = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    gameState.conversations.push(userMessage);

    try {
      // 获取AI回应
      const aiResponse = await AIService.generateStoryResponse(
        message,
        gameState.pet,
        gameState.conversations
      );

      // 添加AI回应到对话历史
      const assistantMessage: Conversation = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
      };

      gameState.conversations.push(assistantMessage);

      // 更新宠物状态
      if (aiResponse.petStatus) {
        Object.assign(gameState.pet, aiResponse.petStatus);
        gameState.pet.lastInteraction = new Date();
      }

      // 检查是否需要生成特殊任务
      if (Math.random() < 0.1) { // 10%概率生成特殊任务
        try {
          const specialTask = await AIService.generateSpecialTask(
            gameState.pet,
            `用户说: ${message}`
          );
          gameState.tasks.push(specialTask);
        } catch (error) {
          console.error('生成特殊任务失败:', error);
        }
      }

      // 保存游戏状态
      this.saveGameState(gameState);

      return aiResponse;
    } catch (error) {
      console.error('发送消息失败:', error);
      throw error;
    }
  }

  static completeTask(taskId: string): void {
    const gameState = this.loadGameState();
    if (!gameState) return;

    const task = gameState.tasks.find(t => t.id === taskId);
    if (!task || task.isCompleted) return;

    task.isCompleted = true;
    task.completedAt = new Date();

    // 应用奖励
    gameState.pet.experience += task.reward.experience;
    gameState.pet.happiness = Math.min(100, gameState.pet.happiness + task.reward.happiness);
    gameState.pet.health = Math.min(100, gameState.pet.health + task.reward.health);

    // 检查升级
    const newLevel = Math.floor(gameState.pet.experience / 100) + 1;
    if (newLevel > gameState.pet.level) {
      gameState.pet.level = newLevel;
      gameState.currentStory += `\n🎉 恭喜！${gameState.pet.name}升级到了${newLevel}级！`;
    }

    this.saveGameState(gameState);
  }

  static resetDailyTasks(): void {
    const gameState = this.loadGameState();
    if (!gameState) return;

    // 重置日常任务
    gameState.tasks = gameState.tasks.filter(task => task.type !== 'daily');
    
    // 生成新的日常任务
    AIService.generateDailyTasks(gameState.pet).then(newTasks => {
      gameState.tasks.push(...newTasks);
      this.saveGameState(gameState);
    }).catch(error => {
      console.error('重置日常任务失败:', error);
    });
  }

  static updatePetStatus(): void {
    const gameState = this.loadGameState();
    if (!gameState) return;

    const now = new Date();
    const lastInteraction = new Date(gameState.pet.lastInteraction);
    const hoursSinceLastInteraction = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60);

    // 根据时间流逝更新状态
    if (hoursSinceLastInteraction > 1) {
      gameState.pet.hunger = Math.min(100, gameState.pet.hunger + hoursSinceLastInteraction * 5);
      gameState.pet.energy = Math.max(0, gameState.pet.energy - hoursSinceLastInteraction * 2);
      gameState.pet.happiness = Math.max(0, gameState.pet.happiness - hoursSinceLastInteraction * 1);
    }

    // 检查宠物是否死亡
    if (gameState.pet.health <= 0 || gameState.pet.happiness <= 0) {
      gameState.pet.isAlive = false;
      gameState.currentStory += `\n💔 ${gameState.pet.name}因为缺乏照顾而离开了...`;
    }

    this.saveGameState(gameState);
  }

  static getPetStatus(): Pet | null {
    const gameState = this.loadGameState();
    return gameState?.pet || null;
  }

  static getTasks(): Task[] {
    const gameState = this.loadGameState();
    return gameState?.tasks || [];
  }

  static getConversations(): Conversation[] {
    const gameState = this.loadGameState();
    return gameState?.conversations || [];
  }

  static getCurrentStory(): string {
    const gameState = this.loadGameState();
    return gameState?.currentStory || '';
  }
} 