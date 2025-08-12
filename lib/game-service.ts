import { Pet, Task, Conversation, GameState, AIResponse } from '../types';
import { AIService } from './ai-service';
import { ImageAnalysisService, ImageAnalysisResult } from './image-analysis';

export class GameService {
  private static STORAGE_KEY = 'ai_pet_adventure_game_state';
  private static MAX_PETS = 2; // 最多同时养两只宠物

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
        if (key === 'createdAt' || key === 'lastInteraction' || key === 'completedAt' || key === 'timestamp' || key === 'lastPetInteraction') {
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
      // 检查是否已有宠物
      const existingState = this.loadGameState();
      if (existingState && existingState.pets.length >= this.MAX_PETS) {
        throw new Error(`最多只能同时养${this.MAX_PETS}只宠物`);
      }

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
      
      let gameState: GameState;
      
      if (existingState) {
        // 添加到现有游戏状态
        existingState.pets.push(pet);
        existingState.activePetId = pet.id;
        existingState.tasks.push(...tasks);
        existingState.currentStory += `\n🎉 欢迎新成员${pet.name}加入！`;
        gameState = existingState;
      } else {
        // 创建新的游戏状态
        gameState = {
          pets: [pet],
          activePetId: pet.id,
          tasks,
          conversations: [],
          currentStory: `欢迎来到${pet.name}的世界！${pet.worldSetting}`,
          worldGenre: genre || '随机创意风格',
          lastPetInteraction: new Date(),
        };
      }

      this.saveGameState(gameState);
      return gameState;
    } catch (error) {
      console.error('创建新宠物失败:', error);
      throw error;
    }
  }

  static async createNewPet(imageDescription: string, genre?: string): Promise<GameState> {
    try {
      // 检查是否已有宠物
      const existingState = this.loadGameState();
      if (existingState && existingState.pets.length >= this.MAX_PETS) {
        throw new Error(`最多只能同时养${this.MAX_PETS}只宠物`);
      }

      const pet = await AIService.generatePetFromImage(imageDescription, genre);
      const tasks = await AIService.generateDailyTasks(pet);
      
      let gameState: GameState;
      
      if (existingState) {
        // 添加到现有游戏状态
        existingState.pets.push(pet);
        existingState.activePetId = pet.id;
        existingState.tasks.push(...tasks);
        existingState.currentStory += `\n🎉 欢迎新成员${pet.name}加入！`;
        gameState = existingState;
      } else {
        // 创建新的游戏状态
        gameState = {
          pets: [pet],
          activePetId: pet.id,
          tasks,
          conversations: [],
          currentStory: `欢迎来到${pet.name}的世界！${pet.worldSetting}`,
          worldGenre: genre || '随机创意风格',
          lastPetInteraction: new Date(),
        };
      }

      this.saveGameState(gameState);
      return gameState;
    } catch (error) {
      console.error('创建新宠物失败:', error);
      throw error;
    }
  }

  static getActivePet(): Pet | null {
    const gameState = this.loadGameState();
    if (!gameState) return null;
    
    return gameState.pets.find(pet => pet.id === gameState.activePetId) || null;
  }

  static switchActivePet(petId: string): void {
    const gameState = this.loadGameState();
    if (!gameState) return;
    
    const pet = gameState.pets.find(p => p.id === petId);
    if (pet) {
      gameState.activePetId = petId;
      this.saveGameState(gameState);
    }
  }

  static removePet(petId: string): void {
    const gameState = this.loadGameState();
    if (!gameState) return;
    
    gameState.pets = gameState.pets.filter(p => p.id !== petId);
    gameState.tasks = gameState.tasks.filter(t => !t.id.includes(petId));
    
    // 如果删除的是当前活跃宠物，切换到第一个宠物
    if (gameState.activePetId === petId && gameState.pets.length > 0) {
      gameState.activePetId = gameState.pets[0].id;
    }
    
    this.saveGameState(gameState);
  }

  static async sendMessage(message: string): Promise<AIResponse> {
    const gameState = this.loadGameState();
    if (!gameState) {
      throw new Error('没有找到游戏状态');
    }

    const activePet = this.getActivePet();
    if (!activePet) {
      throw new Error('没有找到活跃的宠物');
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
        activePet,
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
        Object.assign(activePet, aiResponse.petStatus);
        activePet.lastInteraction = new Date();
      }

      // 检查是否需要生成特殊任务
      if (Math.random() < 0.1) { // 10%概率生成特殊任务
        try {
          const specialTask = await AIService.generateSpecialTask(
            activePet,
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

  // 新的任务完成系统
  static completeTask(taskId: string, completionData?: any): void {
    const gameState = this.loadGameState();
    if (!gameState) return;

    const task = gameState.tasks.find(t => t.id === taskId);
    if (!task || task.isCompleted) return;

    const activePet = this.getActivePet();
    if (!activePet) return;

    // 根据任务类型进行不同的完成逻辑
    let canComplete = false;

    switch (task.completionMethod) {
      case 'checkbox':
        canComplete = true;
        break;
      
      case 'physical':
        if (completionData && completionData.completed) {
          canComplete = true;
        }
        break;
      
      case 'conversation':
        if (completionData && completionData.message) {
          // 检查对话是否包含所需关键词
          const message = completionData.message.toLowerCase();
          const requiredKeywords = task.conversationTask?.requiredKeywords || [];
          canComplete = requiredKeywords.some(keyword => 
            message.includes(keyword.toLowerCase())
          );
        }
        break;
      
      case 'timer':
        if (completionData && completionData.duration >= (task.timerTask?.duration || 0)) {
          canComplete = true;
        }
        break;
    }

    if (!canComplete) {
      throw new Error('任务完成条件未满足');
    }

    task.isCompleted = true;
    task.completedAt = new Date();

    // 应用奖励
    activePet.experience += task.reward.experience;
    activePet.happiness = Math.min(100, activePet.happiness + task.reward.happiness);
    activePet.health = Math.min(100, activePet.health + task.reward.health);
    
    if (task.reward.energy !== undefined) {
      activePet.energy = Math.min(100, activePet.energy + task.reward.energy);
    }
    if (task.reward.hunger !== undefined) {
      activePet.hunger = Math.max(0, activePet.hunger + task.reward.hunger);
    }

    // 检查升级
    const newLevel = Math.floor(activePet.experience / 100) + 1;
    if (newLevel > activePet.level) {
      activePet.level = newLevel;
      gameState.currentStory += `\n🎉 恭喜！${activePet.name}升级到了${newLevel}级！`;
    }

    this.saveGameState(gameState);
  }

  // 宠物主动互动
  static async checkPetInitiatedInteraction(): Promise<string | null> {
    const gameState = this.loadGameState();
    if (!gameState) return null;

    const activePet = this.getActivePet();
    if (!activePet) return null;

    const now = new Date();
    const lastInteraction = new Date(gameState.lastPetInteraction);
    const minutesSinceLastInteraction = (now.getTime() - lastInteraction.getTime()) / (1000 * 60);

    // 检查是否应该主动互动（5-15分钟间隔）
    if (minutesSinceLastInteraction < 5) return null;

    // 根据宠物状态决定是否主动互动
    let shouldInitiate = false;
    let reason = '';

    if (activePet.happiness < 30) {
      shouldInitiate = true;
      reason = '感到孤独，想要陪伴';
    } else if (activePet.hunger > 70) {
      shouldInitiate = true;
      reason = '感到饥饿，需要食物';
    } else if (activePet.energy < 20) {
      shouldInitiate = true;
      reason = '感到疲惫，需要休息';
    } else if (activePet.health < 50) {
      shouldInitiate = true;
      reason = '感到不适，需要照顾';
    } else if (Math.random() < 0.3) { // 30%概率随机主动互动
      shouldInitiate = true;
      reason = '想要和主人分享一些有趣的事情';
    }

    if (shouldInitiate) {
      try {
        const interaction = await AIService.generatePetInitiatedInteraction(activePet, reason);
        
        // 添加宠物主动发起的对话
        const petMessage: Conversation = {
          id: Date.now().toString(),
          role: 'assistant',
          content: interaction,
          timestamp: new Date(),
          isPetInitiated: true,
        };

        gameState.conversations.push(petMessage);
        gameState.lastPetInteraction = new Date();
        this.saveGameState(gameState);

        return interaction;
      } catch (error) {
        console.error('宠物主动互动失败:', error);
        return null;
      }
    }

    return null;
  }

  static resetDailyTasks(): void {
    const gameState = this.loadGameState();
    if (!gameState) return;

    const activePet = this.getActivePet();
    if (!activePet) return;

    // 重置日常任务
    gameState.tasks = gameState.tasks.filter(task => task.type !== 'daily');
    
    // 生成新的日常任务
    AIService.generateDailyTasks(activePet).then(newTasks => {
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
    
    // 更新所有宠物的状态
    gameState.pets.forEach(pet => {
      const lastInteraction = new Date(pet.lastInteraction);
      const hoursSinceLastInteraction = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60);

      // 根据时间流逝更新状态
      if (hoursSinceLastInteraction > 1) {
        pet.hunger = Math.min(100, pet.hunger + hoursSinceLastInteraction * 5);
        pet.energy = Math.max(0, pet.energy - hoursSinceLastInteraction * 2);
        pet.happiness = Math.max(0, pet.happiness - hoursSinceLastInteraction * 1);
      }

      // 检查宠物是否死亡
      if (pet.health <= 0 || pet.happiness <= 0) {
        pet.isAlive = false;
        gameState.currentStory += `\n💔 ${pet.name}因为缺乏照顾而离开了...`;
      }
    });

    this.saveGameState(gameState);
  }

  static getPetStatus(): Pet | null {
    return this.getActivePet();
  }

  static getAllPets(): Pet[] {
    const gameState = this.loadGameState();
    return gameState?.pets || [];
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