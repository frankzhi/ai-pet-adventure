import { Pet, Task, Conversation, GameState, AIResponse, TimerState, PetInteractionConfig, RandomEvent, ActivityLog } from '../types';
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
          activeTimers: [],
          randomEvents: [],
          activityLogs: [],
          lastStatusUpdate: new Date(),
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
          activeTimers: [],
          randomEvents: [],
          activityLogs: [],
          lastStatusUpdate: new Date(),
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

  // 计时器管理
  static startTimer(taskId: string, duration: number): void {
    const gameState = this.loadGameState();
    if (!gameState) return;

    // 移除已存在的相同任务计时器
    gameState.activeTimers = gameState.activeTimers.filter(t => t.taskId !== taskId);
    
    // 添加新计时器
    gameState.activeTimers.push({
      taskId,
      startTime: Date.now(),
      duration: duration * 1000, // 转换为毫秒
      isActive: true,
    });

    this.saveGameState(gameState);
  }

  static getTimerProgress(taskId: string): { elapsed: number; remaining: number; isComplete: boolean; canComplete: boolean } | null {
    const gameState = this.loadGameState();
    if (!gameState) return null;

    const timer = gameState.activeTimers.find(t => t.taskId === taskId);
    if (!timer) return null;

    const elapsed = Date.now() - timer.startTime;
    const remaining = Math.max(0, timer.duration - elapsed);
    const isComplete = elapsed >= timer.duration;
    
    // 检查是否在完成窗口内（10分钟）
    const completionWindow = 10 * 60 * 1000; // 10分钟
    const canComplete = isComplete && (elapsed - timer.duration) <= completionWindow;

    return { elapsed, remaining, isComplete, canComplete };
  }

  static completeTimer(taskId: string): void {
    const gameState = this.loadGameState();
    if (!gameState) return;

    // 只移除指定的计时器，不影响其他计时器
    gameState.activeTimers = gameState.activeTimers.filter(t => t.taskId !== taskId);
    this.saveGameState(gameState);
  }

  // 检查所有计时器状态，自动完成到期的计时器
  static checkAllTimers(): void {
    const gameState = this.loadGameState();
    if (!gameState) return;

    const now = Date.now();
    const completedTimers: string[] = [];

    gameState.activeTimers.forEach(timer => {
      const elapsed = now - timer.startTime;
      if (elapsed >= timer.duration) {
        // 标记计时器完成，但不自动完成任务
        timer.completedAt = now;
        completedTimers.push(timer.taskId);
      }
    });

    // 移除已完成的计时器
    if (completedTimers.length > 0) {
      gameState.activeTimers = gameState.activeTimers.filter(t => !completedTimers.includes(t.taskId));
      this.saveGameState(gameState);
    }
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
        action: aiResponse.action, // 添加肢体动作
      };

      gameState.conversations.push(assistantMessage);

      // 更新宠物状态
      if (aiResponse.petStatus) {
        Object.assign(activePet, aiResponse.petStatus);
        activePet.lastInteraction = new Date();
      }

      // 检查是否需要生成特殊任务
      if (Math.random() < 0.05) { // 降低到5%概率生成特殊任务
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
  static completeTask(taskId: string, completionData?: any): { success: boolean; message: string; hint?: string } {
    const gameState = this.loadGameState();
    if (!gameState) return { success: false, message: '游戏状态未找到' };

    const task = gameState.tasks.find(t => t.id === taskId);
    if (!task || task.isCompleted) return { success: false, message: '任务不存在或已完成' };

    const activePet = this.getActivePet();
    if (!activePet) return { success: false, message: '宠物未找到' };

    // 根据任务类型进行不同的完成逻辑
    let canComplete = false;
    let failureReason = '';
    let hint = '';

    switch (task.completionMethod) {
      case 'checkbox':
        canComplete = true;
        break;
      
      case 'physical':
        if (completionData && completionData.completed) {
          canComplete = true;
        } else {
          failureReason = '物理任务未完成';
          hint = '请按照任务要求完成相应的动作';
        }
        break;
      
      case 'conversation':
        if (completionData && completionData.message) {
          // 检查对话是否包含所需关键词
          const message = completionData.message.toLowerCase();
          const requiredKeywords = task.conversationTask?.requiredKeywords || [];
          
          // 检查是否包含所有关键词
          const missingKeywords = requiredKeywords.filter(keyword => 
            !message.includes(keyword.toLowerCase())
          );
          
          if (missingKeywords.length === 0) {
            canComplete = true;
          } else {
            failureReason = `缺少关键词: ${missingKeywords.join(', ')}`;
            hint = `请在对话中包含以下关键词: ${requiredKeywords.join(', ')}`;
          }
        } else {
          failureReason = '未提供对话内容';
          hint = '请在输入框中输入对话内容';
        }
        break;
      
      case 'timer':
        const timerProgress = this.getTimerProgress(taskId);
        if (timerProgress && timerProgress.canComplete) {
          canComplete = true;
        } else if (timerProgress && timerProgress.isComplete) {
          failureReason = '计时任务已完成，但超出完成窗口时间';
          hint = '请在计时结束后10分钟内点击完成';
        } else {
          failureReason = '计时任务时间不足';
          hint = `请等待${task.timerTask?.duration || 0}秒完成`;
        }
        break;
    }

    if (!canComplete) {
      return { 
        success: false, 
        message: `任务完成条件未满足: ${failureReason}`,
        hint 
      };
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

    // 如果是计时器任务，移除计时器
    if (task.completionMethod === 'timer') {
      this.completeTimer(taskId);
    }

    this.saveGameState(gameState);
    
    return { 
      success: true, 
      message: `任务完成！获得 ${task.reward.experience} 经验值` 
    };
  }

  // 宠物主动互动 - 大幅降低频率
  static async checkPetInitiatedInteraction(): Promise<string | null> {
    const gameState = this.loadGameState();
    if (!gameState) return null;

    const activePet = this.getActivePet();
    if (!activePet) return null;

    const now = new Date();
    const lastInteraction = new Date(gameState.lastPetInteraction);
    const hoursSinceLastInteraction = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60);

    // 根据性格类型调整互动频率
    const personalityConfig = this.getPersonalityInteractionConfig(activePet.personalityType);
    
    // 某些性格的宠物完全不主动互动
    if (!personalityConfig.canInitiate) {
      return null;
    }

    // 检查是否应该主动互动（调整为小时级别）
    const minInterval = personalityConfig.minInterval * personalityConfig.personalityMultiplier;
    const maxInterval = personalityConfig.maxInterval * personalityConfig.personalityMultiplier;
    
    if (hoursSinceLastInteraction < minInterval) return null;

    // 根据宠物状态决定是否主动互动
    let shouldInitiate = false;
    let reason = '';

    if (activePet.happiness < 20) {
      shouldInitiate = true;
      reason = '感到孤独，想要陪伴';
    } else if (activePet.hunger < 20) { // 饱食度低
      shouldInitiate = true;
      reason = '感到饥饿，需要食物';
    } else if (activePet.energy < 10) {
      shouldInitiate = true;
      reason = '感到疲惫，需要休息';
    } else if (activePet.health < 30) {
      shouldInitiate = true;
      reason = '感到不适，需要照顾';
    } else if (Math.random() < 0.1) { // 降低到10%概率随机主动互动
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

  // 获取性格互动配置
  private static getPersonalityInteractionConfig(personalityType: string): PetInteractionConfig {
    const configs = {
      extroverted: {
        minInterval: 2, // 2小时
        maxInterval: 6, // 6小时
        personalityMultiplier: 0.5, // 外向的宠物互动更频繁
        canInitiate: true,
        conditions: {
          lowHappiness: true,
          lowHealth: true,
          lowEnergy: true,
          highHunger: true,
        },
      },
      introverted: {
        minInterval: 8, // 8小时
        maxInterval: 24, // 24小时
        personalityMultiplier: 2, // 内向的宠物互动更少
        canInitiate: true,
        conditions: {
          lowHappiness: true,
          lowHealth: true,
          lowEnergy: false,
          highHunger: true,
        },
      },
      calm: {
        minInterval: 4, // 4小时
        maxInterval: 12, // 12小时
        personalityMultiplier: 1,
        canInitiate: true,
        conditions: {
          lowHappiness: false,
          lowHealth: true,
          lowEnergy: false,
          highHunger: true,
        },
      },
      energetic: {
        minInterval: 3, // 3小时
        maxInterval: 8, // 8小时
        personalityMultiplier: 0.7,
        canInitiate: true,
        conditions: {
          lowHappiness: true,
          lowHealth: true,
          lowEnergy: true,
          highHunger: true,
        },
      },
      mysterious: {
        minInterval: 12, // 12小时
        maxInterval: 48, // 48小时
        personalityMultiplier: 3,
        canInitiate: false, // 神秘的宠物不主动互动
        conditions: {
          lowHappiness: false,
          lowHealth: false,
          lowEnergy: false,
          highHunger: false,
        },
      },
      friendly: {
        minInterval: 3, // 3小时
        maxInterval: 8, // 8小时
        personalityMultiplier: 0.8,
        canInitiate: true,
        conditions: {
          lowHappiness: true,
          lowHealth: true,
          lowEnergy: false,
          highHunger: true,
        },
      },
      aloof: {
        minInterval: 24, // 24小时
        maxInterval: 72, // 72小时
        personalityMultiplier: 4,
        canInitiate: false, // 冷漠的宠物不主动互动
        conditions: {
          lowHappiness: false,
          lowHealth: false,
          lowEnergy: false,
          highHunger: false,
        },
      },
      playful: {
        minInterval: 2, // 2小时
        maxInterval: 6, // 6小时
        personalityMultiplier: 0.6,
        canInitiate: true,
        conditions: {
          lowHappiness: true,
          lowHealth: true,
          lowEnergy: true,
          highHunger: true,
        },
      },
    };

    return configs[personalityType as keyof typeof configs] || configs.friendly;
  }

  // 生成随机事件
  static generateRandomEvent(pet: Pet): RandomEvent | null {
    const now = new Date();
    const lastUpdate = new Date(pet.lastActivityUpdate);
    const hoursSinceLastUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

    // 每4-8小时生成一个随机事件
    if (hoursSinceLastUpdate < 4) return null;

    const events = [
      {
        type: 'positive' as const,
        title: '发现宝藏',
        description: `${pet.name}在探索时发现了一个小宝藏！`,
        effect: { happiness: 10, experience: 5 }
      },
      {
        type: 'positive' as const,
        title: '遇到朋友',
        description: `${pet.name}遇到了一个友好的小伙伴，一起玩耍很开心！`,
        effect: { happiness: 15, energy: -5 }
      },
      {
        type: 'negative' as const,
        title: '遇到小麻烦',
        description: `${pet.name}遇到了一点小麻烦，但很快就解决了。`,
        effect: { happiness: -5, experience: 3 }
      },
      {
        type: 'neutral' as const,
        title: '天气变化',
        description: `天气发生了变化，${pet.name}适应得很好。`,
        effect: { energy: -3, health: 2 }
      }
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    
    return {
      id: Date.now().toString(),
      type: event.type,
      title: event.title,
      description: event.description,
      effect: event.effect,
      timestamp: new Date(),
      isRead: false,
    };
  }

  // 更新宠物状态和活动
  static async updatePetStatus(): Promise<void> {
    const gameState = this.loadGameState();
    if (!gameState) return;

    const now = new Date();
    
    // 更新所有宠物的状态
    for (const pet of gameState.pets) {
      const lastInteraction = new Date(pet.lastInteraction);
      const hoursSinceLastInteraction = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60);

      // 根据时间流逝更新状态（降低更新频率）
      if (hoursSinceLastInteraction > 1) {
        pet.hunger = Math.max(0, pet.hunger - hoursSinceLastInteraction * 3); // 饱食度减少
        pet.energy = Math.max(0, pet.energy - hoursSinceLastInteraction * 2);
        pet.happiness = Math.max(0, pet.happiness - hoursSinceLastInteraction * 1);
        
        // 健康值衰减机制：当快乐/能量/饱食度低于10%时，健康值逐渐降低
        if (pet.happiness < 10 || pet.energy < 10 || pet.hunger < 10) {
          pet.health = Math.max(0, pet.health - hoursSinceLastInteraction * 2);
        }
      }

      // 更新心情
      if (pet.happiness < 30) pet.mood = 'sad';
      else if (pet.happiness < 60) pet.mood = 'neutral';
      else if (pet.energy < 30) pet.mood = 'tired';
      else if (pet.hunger < 30) pet.mood = 'hungry';
      else if (pet.happiness > 80) pet.mood = 'happy';
      else pet.mood = 'neutral';

      // 检查宠物是否死亡（健康值为0时死亡）
      if (pet.health <= 0) {
        pet.isAlive = false;
        gameState.currentStory += `\n💔 ${pet.name}因为健康值过低而离开了...`;
      }

      // 生成随机事件（每30分钟一次）
      const lastEventTime = gameState.randomEvents.length > 0 
        ? new Date(gameState.randomEvents[gameState.randomEvents.length - 1].timestamp)
        : new Date(0);
      const minutesSinceLastEvent = (now.getTime() - lastEventTime.getTime()) / (1000 * 60);
      
      if (minutesSinceLastEvent >= 30) {
        const randomEvent = this.generateRandomEvent(pet);
        if (randomEvent) {
          gameState.randomEvents.push(randomEvent);
          
          // 应用事件效果
          if (randomEvent.effect.happiness) pet.happiness = Math.min(100, Math.max(0, pet.happiness + randomEvent.effect.happiness));
          if (randomEvent.effect.health) pet.health = Math.min(100, Math.max(0, pet.health + randomEvent.effect.health));
          if (randomEvent.effect.energy) pet.energy = Math.min(100, Math.max(0, pet.energy + randomEvent.effect.energy));
          if (randomEvent.effect.hunger) pet.hunger = Math.min(100, Math.max(0, pet.hunger + randomEvent.effect.hunger));
          if (randomEvent.effect.experience) pet.experience += randomEvent.effect.experience;
        }
      }

      // 更新宠物活动
      const lastActivityUpdate = new Date(pet.lastActivityUpdate);
      const hoursSinceActivityUpdate = (now.getTime() - lastActivityUpdate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceActivityUpdate > 1) {
        try {
          const newActivity = await AIService.generatePetActivity(pet);
          pet.currentActivity = newActivity;
          pet.lastActivityUpdate = new Date();
          
          // 记录活动日志
          gameState.activityLogs.push({
            id: Date.now().toString(),
            activity: newActivity,
            timestamp: new Date(),
            type: 'action',
          });
        } catch (error) {
          console.error('更新宠物活动失败:', error);
        }
      }
    }

    gameState.lastStatusUpdate = new Date();
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

  static getActiveTimers(): TimerState[] {
    const gameState = this.loadGameState();
    return gameState?.activeTimers || [];
  }

  static getRandomEvents(): RandomEvent[] {
    const gameState = this.loadGameState();
    return gameState?.randomEvents || [];
  }

  static getActivityLogs(): ActivityLog[] {
    const gameState = this.loadGameState();
    return gameState?.activityLogs || [];
  }

  static markEventAsRead(eventId: string): void {
    const gameState = this.loadGameState();
    if (!gameState) return;

    const event = gameState.randomEvents.find(e => e.id === eventId);
    if (event) {
      event.isRead = true;
      this.saveGameState(gameState);
    }
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
} 