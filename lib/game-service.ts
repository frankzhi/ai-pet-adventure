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
    console.log("GameService: getActivePet被调用");
    const gameState = this.loadGameState();
    if (!gameState) return null;
    
    const activePet = gameState.pets.find(pet => pet.id === gameState.activePetId) || null;
    console.log("GameService: getActivePet返回", activePet);
    return activePet;
  }

  // 检查是否有活着的宠物
  static hasAlivePet(): boolean {
    const gameState = this.loadGameState();
    if (!gameState) return false;

    return gameState.pets.some(pet => pet.isAlive);
  }

  // 获取第一个活着的宠物
  static getFirstAlivePet(): Pet | null {
    const gameState = this.loadGameState();
    if (!gameState) return null;

    const alivePet = gameState.pets.find(pet => pet.isAlive);
    if (alivePet) {
      // 如果当前活跃宠物不是活着的，切换到第一个活着的宠物
      if (gameState.activePetId !== alivePet.id) {
        gameState.activePetId = alivePet.id;
        this.saveGameState(gameState);
      }
      return alivePet;
    }
    return null;
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

  // 检查所有计时器状态，标记到期的计时器但不移除
  static checkAllTimers(): void {
    const gameState = this.loadGameState();
    if (!gameState) return;

    const now = Date.now();
    let hasChanges = false;

    gameState.activeTimers.forEach(timer => {
      const elapsed = now - timer.startTime;
      if (elapsed >= timer.duration && !timer.completedAt) {
        // 标记计时器完成，但不移除
        timer.completedAt = now;
        hasChanges = true;
      }
    });

    // 只有在有变化时才保存
    if (hasChanges) {
      this.saveGameState(gameState);
    }
  }

  static async sendMessage(message: string): Promise<AIResponse> {
    const gameState = this.loadGameState();
    if (!gameState) {
      throw new Error('没有找到游戏状态');
    }

    const activePetIndex = gameState.pets.findIndex(pet => pet.id === gameState.activePetId);
    if (activePetIndex === -1) return { content: "宠物未找到", action: "静静地躺着" };
    const activePet = gameState.pets[activePetIndex];
    if (!activePet) {
      throw new Error('没有找到活跃的宠物');
    }

    // 检查宠物是否还活着
    if (!activePet.isAlive) {
      return {
        content: `💔 ${activePet.name}已经离开了，无法回应你的消息。请重新开始游戏。`,
        action: '静静地躺着，没有任何回应'
      };
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
      // 分析对话中的状态恢复指令
      const dialogueAnalysis = AIService.analyzeDialogueActions(message, activePet);
      let statusUpdateMessage = '';
      let experienceGained = 0;
      
      // 如果识别到状态恢复动作，立即执行
      if (dialogueAnalysis.actions.length > 0) {
        for (const action of dialogueAnalysis.actions) {
          // 应用状态效果
          Object.assign(activePet, action.statusEffects);
          
          // 记录活动日志
          gameState.activityLogs.push({
            id: Date.now().toString() + '_dialogue_action',
            activity: `通过对话互动：${action.description}`,
            timestamp: new Date(),
            type: 'action',
            details: `类型：${action.type}，强度：${action.intensity}`
          });
          
          // 累积经验值
          if (action.statusEffects.experience) {
            experienceGained += action.statusEffects.experience - activePet.experience;
          }
          
          // 生成状态更新消息
          const statusChanges = [];
          const oldValues = {
            mood: activePet.mood,
            health: activePet.health,
            energy: activePet.energy,
            mutation: activePet.mutation
          };
          
          if (action.statusEffects.mood !== undefined && action.statusEffects.mood !== oldValues.mood) {
            statusChanges.push(`心情值 ${oldValues.mood}→${action.statusEffects.mood}`);
          }
          if (action.statusEffects.health !== undefined && action.statusEffects.health !== oldValues.health) {
            statusChanges.push(`健康值 ${oldValues.health}→${action.statusEffects.health}`);
          }
          if (action.statusEffects.energy !== undefined && action.statusEffects.energy !== oldValues.energy) {
            statusChanges.push(`能量值 ${oldValues.energy}→${action.statusEffects.energy}`);
          }
          if (action.statusEffects.mutation !== undefined && action.statusEffects.mutation !== oldValues.mutation) {
            statusChanges.push(`突变值 ${oldValues.mutation}→${action.statusEffects.mutation}`);
          }
          
          if (statusChanges.length > 0) {
            statusUpdateMessage += `\n✨ ${action.description}，状态变化：${statusChanges.join(', ')}`;
          }
        }
        
        // 检查升级
        const newLevel = Math.floor(activePet.experience / 100) + 1;
        if (newLevel > activePet.level) {
          activePet.level = newLevel;
          gameState.currentStory += `\n🎉 恭喜！${activePet.name}通过互动升级到了${newLevel}级！`;
          statusUpdateMessage += `\n🎉 升级到了${newLevel}级！`;
          
          // 记录升级事件
          gameState.activityLogs.push({
            id: Date.now().toString() + '_level_up',
            activity: `${activePet.name}通过对话互动升级到了${newLevel}级！`,
            timestamp: new Date(),
            type: 'event',
            details: '对话互动升级'
          });
        }
        
        // 更新最后互动时间
        activePet.lastInteraction = new Date();
      }

      // 获取AI回应
      const aiResponse = await AIService.generateStoryResponse(
        message,
        activePet,
        gameState.conversations
      );

      // 如果有状态更新，将其添加到AI回应中
      if (statusUpdateMessage) {
        aiResponse.content += statusUpdateMessage;
      }

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

      // 如果分析建议创建任务，生成相应的互动任务
      if (dialogueAnalysis.shouldCreateTask && dialogueAnalysis.actions.length > 0) {
        try {
          const action = dialogueAnalysis.actions[0]; // 使用第一个识别到的动作
          const interactiveTask = await this.createInteractiveTask(activePet, action, message);
          gameState.tasks.push(interactiveTask);
        } catch (error) {
          console.error('生成互动任务失败:', error);
        }
      } else if (Math.random() < 0.05) { // 降低到5%概率生成特殊任务
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

  // 创建基于对话的互动任务
  private static async createInteractiveTask(
    pet: Pet, 
    action: {
      type: 'feed' | 'play' | 'rest' | 'exercise' | 'care' | 'comfort' | 'intense_play' | 'chase' | 'jump';
      intensity: 'small' | 'medium' | 'large';
      description: string;
      statusEffects: Partial<Pet>;
    }, 
    originalMessage: string
  ): Promise<Task> {
    const taskTypeMap = {
      feed: 'feeding',
      play: 'interaction',
      rest: 'care',
      exercise: 'exercise',
      care: 'care',
      comfort: 'interaction',
      intense_play: 'exercise',
      chase: 'exercise',
      jump: 'exercise'
    };

    const rewardMultiplier = action.intensity === 'large' ? 1.5 : action.intensity === 'small' ? 0.7 : 1;
    
    const baseReward = {
      experience: Math.floor(15 * rewardMultiplier),
      mood: Math.floor(12 * rewardMultiplier),
      health: Math.floor(8 * rewardMultiplier),
      energy: action.type === 'rest' ? Math.floor(15 * rewardMultiplier) : Math.floor(-5 * rewardMultiplier)
    };

    const task: Task = {
      id: Date.now().toString() + '_interactive',
      title: `${action.description}`,
      description: `基于对话"${originalMessage}"生成的互动任务：${action.description}`,
      type: 'special',
      category: taskTypeMap[action.type] as any,
      completionMethod: 'checkbox',
      reward: baseReward,
      isCompleted: false,
      isExpired: false,
      isStarted: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 20 * 60 * 1000), // 20分钟后过期
      timerCompletionWindow: 10,
    };

    return task;
  }

  // 新的任务完成系统
  static completeTask(taskId: string, completionData?: any): { success: boolean; message: string; hint?: string } {
    const gameState = this.loadGameState();
    if (!gameState) return { success: false, message: '游戏状态未找到' };

    const task = gameState.tasks.find(t => t.id === taskId);
    if (!task || task.isCompleted) return { success: false, message: '任务不存在或已完成' };

    const activePetIndex = gameState.pets.findIndex(pet => pet.id === gameState.activePetId);
    if (activePetIndex === -1) return { success: false, message: '宠物未找到' };
    const activePet = gameState.pets[activePetIndex];
    if (!activePet) return { success: false, message: '宠物未找到' };

    // 检查宠物是否还活着
    if (!activePet.isAlive) {
      return { success: false, message: '宠物已经离开了，无法完成任务' };
    }

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

    // 记录任务完成前的状态
    const oldHealth = activePet.health;
    const oldMood = activePet.mood;
    const oldEnergy = activePet.energy;
    const oldMutation = activePet.mutation;
    const oldExperience = activePet.experience;

    // 应用奖励
    console.log('任务完成前状态:', {
      experience: activePet.experience,
      mood: activePet.mood,
      health: activePet.health,
      energy: activePet.energy,
      mutation: activePet.mutation
    });
    
    console.log("应用经验值奖励:", task.reward.experience);
    activePet.experience += task.reward.experience;
    console.log("应用心情值奖励:", task.reward.mood);
    activePet.mood = Math.min(100, activePet.mood + task.reward.mood);
    console.log("应用健康值奖励:", task.reward.health);
    activePet.health = Math.min(100, activePet.health + task.reward.health);
    console.log("应用能量值奖励:", task.reward.energy);
    activePet.energy = Math.min(100, Math.max(0, activePet.energy + task.reward.energy));
    
    if (task.reward.mutation !== undefined) {
      activePet.mutation = Math.min(100, Math.max(0, activePet.mutation + task.reward.mutation));
    }
    
    console.log('任务完成后状态:', {
      experience: activePet.experience,
      mood: activePet.mood,
      health: activePet.health,
      energy: activePet.energy,
      mutation: activePet.mutation
    });

    // 记录状态变化到活动日志
    const statusChanges = [];
    if (activePet.health !== oldHealth) statusChanges.push(`健康 ${oldHealth}→${activePet.health}`);
    if (activePet.mood !== oldMood) statusChanges.push(`心情 ${oldMood}→${activePet.mood}`);
    if (activePet.energy !== oldEnergy) statusChanges.push(`能量 ${oldEnergy}→${activePet.energy}`);
    if (activePet.mutation !== oldMutation) statusChanges.push(`突变值 ${oldMutation}→${activePet.mutation}`);
    if (activePet.experience !== oldExperience) statusChanges.push(`经验 ${oldExperience}→${activePet.experience}`);

    if (statusChanges.length > 0) {
      gameState.activityLogs.push({
        id: Date.now().toString(),
        activity: `完成任务"${task.title}"`,
        timestamp: new Date(),
        type: 'status_change',
        details: `状态变化: ${statusChanges.join(', ')}`
      });
    }

    // 检查升级
    const newLevel = Math.floor(activePet.experience / 100) + 1;
    if (newLevel > activePet.level) {
      activePet.level = newLevel;
      gameState.currentStory += `\n🎉 恭喜！${activePet.name}升级到了${newLevel}级！`;
      
      // 记录升级事件
      gameState.activityLogs.push({
        id: Date.now().toString(),
        activity: `${activePet.name}升级到了${newLevel}级！`,
        timestamp: new Date(),
        type: 'event',
        details: '升级'
      });
    }

    // 如果是计时器任务，移除计时器
    if (task.completionMethod === 'timer') {
      this.completeTimer(taskId);
    }

    // 立即保存状态
    // 验证状态是否正确保存 - 直接使用gameState.pets数组中的对象
    console.log("保存后立即获取的宠物状态:", {
      experience: gameState.pets[activePetIndex].experience,
      mood: gameState.pets[activePetIndex].mood,
      health: gameState.pets[activePetIndex].health,
      energy: gameState.pets[activePetIndex].energy,
      mutation: gameState.pets[activePetIndex].mutation
    });
    console.log("GameService: 保存状态后的activePet", activePet);
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

    const activePetIndex = gameState.pets.findIndex(pet => pet.id === gameState.activePetId);
    if (activePetIndex === -1) return null;
    const activePet = gameState.pets[activePetIndex];
    if (!activePet) return null;

    // 如果宠物正在休息，检查是否应该结束休息状态
    if (activePet.isResting && activePet.restStartTime && activePet.restDuration) {
      const now = new Date();
      const restElapsed = (now.getTime() - activePet.restStartTime.getTime()) / (1000 * 60); // 分钟
      if (restElapsed >= activePet.restDuration) {
        // 结束休息状态
        activePet.isResting = false;
        activePet.restStartTime = undefined;
        activePet.restDuration = undefined;
        activePet.currentMoodState = 'neutral';
        this.saveGameState(gameState);
      } else {
        // 仍在休息中，不主动互动
        return null;
      }
    }

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

    if (activePet.mood < 20) {
      shouldInitiate = true;
      reason = '感到沮丧，想要陪伴';
    } else if (activePet.energy < 20) {
      shouldInitiate = true;
      reason = '感到疲惫，需要补充能量';
    } else if (activePet.health < 30) {
      shouldInitiate = true;
      reason = '感到不适，需要照顾';
    } else if (activePet.mutation > 70) {
      shouldInitiate = true;
      reason = '感受到身体的变化，有些困惑';
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
          lowMood: true,
          lowHealth: true,
          lowEnergy: true,
          highMutation: false,
        },
      },
      introverted: {
        minInterval: 8, // 8小时
        maxInterval: 24, // 24小时
        personalityMultiplier: 2, // 内向的宠物互动更少
        canInitiate: true,
        conditions: {
          lowMood: true,
          lowHealth: true,
          lowEnergy: false,
          highMutation: true,
        },
      },
      calm: {
        minInterval: 4, // 4小时
        maxInterval: 12, // 12小时
        personalityMultiplier: 1,
        canInitiate: true,
        conditions: {
          lowMood: false,
          lowHealth: true,
          lowEnergy: false,
          highMutation: true,
        },
      },
      energetic: {
        minInterval: 3, // 3小时
        maxInterval: 8, // 8小时
        personalityMultiplier: 0.7,
        canInitiate: true,
        conditions: {
          lowMood: true,
          lowHealth: true,
          lowEnergy: true,
          highMutation: false,
        },
      },
      mysterious: {
        minInterval: 12, // 12小时
        maxInterval: 48, // 48小时
        personalityMultiplier: 3,
        canInitiate: false, // 神秘的宠物不主动互动
        conditions: {
          lowMood: false,
          lowHealth: false,
          lowEnergy: false,
          highMutation: false,
        },
      },
      friendly: {
        minInterval: 3, // 3小时
        maxInterval: 8, // 8小时
        personalityMultiplier: 0.8,
        canInitiate: true,
        conditions: {
          lowMood: true,
          lowHealth: true,
          lowEnergy: false,
          highMutation: true,
        },
      },
      aloof: {
        minInterval: 24, // 24小时
        maxInterval: 72, // 72小时
        personalityMultiplier: 4,
        canInitiate: false, // 冷漠的宠物不主动互动
        conditions: {
          lowMood: false,
          lowHealth: false,
          lowEnergy: false,
          highMutation: false,
        },
      },
      playful: {
        minInterval: 2, // 2小时
        maxInterval: 6, // 6小时
        personalityMultiplier: 0.6,
        canInitiate: true,
        conditions: {
          lowMood: true,
          lowHealth: true,
          lowEnergy: true,
          highMutation: false,
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
        effect: { mood: 10, experience: 5 }
      },
      {
        type: 'positive' as const,
        title: '遇到朋友',
        description: `${pet.name}遇到了一个友好的小伙伴，一起玩耍很开心！`,
        effect: { mood: 15, energy: -5 }
      },
      {
        type: 'negative' as const,
        title: '遇到小麻烦',
        description: `${pet.name}遇到了一点小麻烦，但很快就解决了。`,
        effect: { mood: -5, experience: 3, mutation: 2 }
      },
      {
        type: 'neutral' as const,
        title: '天气变化',
        description: `天气发生了变化，${pet.name}适应得很好。`,
        effect: { energy: -3, health: 2 }
      },
      {
        type: 'negative' as const,
        title: '异常波动',
        description: `${pet.name}感受到了一些奇怪的变化...`,
        effect: { mutation: 5, mood: -3 }
      },
      {
        type: 'positive' as const,
        title: '能量涌现',
        description: `${pet.name}突然感受到一股神秘的能量涌入体内！`,
        effect: { energy: 20, mutation: 3, experience: 8 }
      },
      {
        type: 'negative' as const,
        title: '基因不稳定',
        description: `${pet.name}的基因结构出现了轻微的不稳定现象。`,
        effect: { health: -8, mutation: 8, mood: -5 }
      },
      {
        type: 'neutral' as const,
        title: '量子共振',
        description: `${pet.name}与周围环境发生了微妙的量子共振。`,
        effect: { mutation: 4, experience: 6 }
      },
      {
        type: 'positive' as const,
        title: '意识觉醒',
        description: `${pet.name}的意识似乎达到了新的层次！`,
        effect: { mood: 25, experience: 15, mutation: 6 }
      },
      {
        type: 'negative' as const,
        title: '能量紊乱',
        description: `${pet.name}的内部能量系统出现了短暂的紊乱。`,
        effect: { energy: -15, health: -5, mutation: 7 }
      },
      {
        type: 'neutral' as const,
        title: '进化压力',
        description: `${pet.name}感受到了来自环境的进化压力。`,
        effect: { mutation: 10, mood: -8, experience: 10 }
      },
      {
        type: 'positive' as const,
        title: '幸运时刻',
        description: `${pet.name}度过了特别幸运的一天！`,
        effect: { mood: 20, health: 10, energy: 15, experience: 12 }
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
    const lastUpdate = gameState.lastStatusUpdate ? new Date(gameState.lastStatusUpdate) : now;
    const hoursSinceLastUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    // 如果距离上次更新不到1小时，不进行状态更新
    if (hoursSinceLastUpdate < 1) {
      return;
    }
    
    // 更新所有宠物的状态
    for (const pet of gameState.pets) {
      // 如果宠物已经死亡，跳过更新
      if (!pet.isAlive) {
        continue;
      }

      // 根据时间流逝更新状态
      pet.energy = Math.max(0, pet.energy - hoursSinceLastUpdate * 2); // 能量减少
      pet.mood = Math.max(0, pet.mood - hoursSinceLastUpdate * 1); // 心情值减少
      
      // 健康值衰减机制：当心情/能量低于10%时，健康值逐渐降低
      if (pet.mood < 10 || pet.energy < 10) {
        pet.health = Math.max(0, pet.health - hoursSinceLastUpdate * 2);
      }
      
      // 突变值累积：健康、心情、能量越低，突变值增长越快
      const mutationRate = (100 - pet.health) * 0.01 + (100 - pet.mood) * 0.005 + (100 - pet.energy) * 0.005;
      pet.mutation = Math.min(100, pet.mutation + hoursSinceLastUpdate * mutationRate);
      
      // 检查是否触发突变
      await this.checkForMutation(pet, gameState);

      // 更新心情状态
      if (pet.mood < 20) pet.currentMoodState = 'sad';
      else if (pet.mood < 40) pet.currentMoodState = 'anxious';
      else if (pet.mood < 60) pet.currentMoodState = 'neutral';
      else if (pet.energy < 30) pet.currentMoodState = 'tired';
      else if (pet.mood > 80) pet.currentMoodState = 'happy';
      else pet.currentMoodState = 'neutral';

      // 检查宠物是否死亡（健康值为0时死亡）
      if (pet.health <= 0) {
        pet.isAlive = false;
        gameState.currentStory += `\n💔 ${pet.name}因为健康值过低而离开了...`;
        
        // 记录死亡事件
        gameState.activityLogs.push({
          id: Date.now().toString(),
          activity: `${pet.name}因为健康值过低而离开了...`,
          timestamp: new Date(),
          type: 'event',
          details: '宠物死亡'
        });
        
        continue; // 跳过死亡宠物的后续更新
      }

      // 生成随机事件（每5分钟一次，频率提升）
      const lastEventTime = gameState.randomEvents.length > 0 
        ? new Date(gameState.randomEvents[gameState.randomEvents.length - 1].timestamp)
        : new Date(0);
      const minutesSinceLastEvent = (now.getTime() - lastEventTime.getTime()) / (1000 * 60);
      
      if (minutesSinceLastEvent >= 5) {
        const randomEvent = this.generateRandomEvent(pet);
        if (randomEvent) {
          gameState.randomEvents.push(randomEvent);
          
          // 应用事件效果
          if (randomEvent.effect.mood) pet.mood = Math.min(100, Math.max(0, pet.mood + randomEvent.effect.mood));
          if (randomEvent.effect.health) pet.health = Math.min(100, Math.max(0, pet.health + randomEvent.effect.health));
          if (randomEvent.effect.energy) pet.energy = Math.min(100, Math.max(0, pet.energy + randomEvent.effect.energy));
          if (randomEvent.effect.mutation) pet.mutation = Math.min(100, Math.max(0, pet.mutation + randomEvent.effect.mutation));
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
    
    // 管理任务时效
    this.manageTaskExpiration();
    
    // 定期生成新任务（每10分钟检查一次）
    const lastTaskGeneration = gameState.lastTaskGeneration || new Date(0);
    const minutesSinceLastTaskGen = (now.getTime() - lastTaskGeneration.getTime()) / (1000 * 60);
    
    if (minutesSinceLastTaskGen >= 10) {
      await this.generatePeriodicTasks();
      gameState.lastTaskGeneration = now;
    }
    
    this.saveGameState(gameState);
  }

  static getPetStatus(): Pet | null {
    const gameState = this.loadGameState();
    if (!gameState) return null;
    
    const activePetIndex = gameState.pets.findIndex(pet => pet.id === gameState.activePetId);
    if (activePetIndex === -1) return null;
    
    return gameState.pets[activePetIndex];
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

    const activePetIndex = gameState.pets.findIndex(pet => pet.id === gameState.activePetId);
    if (activePetIndex === -1) return;
    const activePet = gameState.pets[activePetIndex];
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

  // 任务时效管理系统
  static manageTaskExpiration(): void {
    const gameState = this.loadGameState();
    if (!gameState) return;

    const now = new Date();
    let hasChanges = false;

    // 检查过期任务
    gameState.tasks.forEach(task => {
      if (!task.isExpired && now > new Date(task.expiresAt)) {
        task.isExpired = true;
        hasChanges = true;
        
        // 记录过期事件
        gameState.activityLogs.push({
          id: Date.now().toString() + '_task_expired',
          activity: `任务"${task.title}"已过期`,
          timestamp: now,
          type: 'event',
          details: `任务类型：${task.type}，风险等级：${task.riskLevel || '无'}`
        });
      }
    });

    if (hasChanges) {
      this.saveGameState(gameState);
    }
  }

  // 开始任务
  static startTask(taskId: string): { success: boolean; message: string } {
    const gameState = this.loadGameState();
    if (!gameState) return { success: false, message: '游戏状态未找到' };

    const task = gameState.tasks.find(t => t.id === taskId);
    if (!task) return { success: false, message: '任务不存在' };
    
    if (task.isExpired) return { success: false, message: '任务已过期，无法开始' };
    if (task.isCompleted) return { success: false, message: '任务已完成' };
    if (task.isStarted) return { success: false, message: '任务已经开始' };

    // 开始任务
    task.isStarted = true;
    task.startedAt = new Date();
    
    // 记录开始事件
    gameState.activityLogs.push({
      id: Date.now().toString() + '_task_started',
      activity: `开始任务"${task.title}"`,
      timestamp: new Date(),
      type: 'action',
      details: `任务类型：${task.type}${task.riskLevel ? `，风险等级：${task.riskLevel}` : ''}`
    });

    this.saveGameState(gameState);
    return { success: true, message: '任务已开始！' };
  }

  // 定期生成新任务（每10分钟调用一次）
  static async generatePeriodicTasks(): Promise<void> {
    const gameState = this.loadGameState();
    if (!gameState) return;

    const activePetIndex = gameState.pets.findIndex(pet => pet.id === gameState.activePetId);
    if (activePetIndex === -1) return;
    const activePet = gameState.pets[activePetIndex];
    if (!activePet || !activePet.isAlive) return;

    // 清理过期任务
    const now = new Date();
    gameState.tasks = gameState.tasks.filter(task => !task.isExpired || task.isCompleted);

    // 计算当前活跃任务数量
    const activeTasks = gameState.tasks.filter(task => !task.isCompleted && !task.isExpired);
    
    // 如果活跃任务少于5个，生成新任务
    if (activeTasks.length < 5) {
      const shouldGenerateHighRisk = Math.random() < 0.3; // 30%概率生成高风险任务
      
      if (shouldGenerateHighRisk) {
        // 生成高风险任务
        const highRiskTask = AIService.generateHighRiskTask(activePet);
        gameState.tasks.push(highRiskTask);
        
        // 记录生成事件
        gameState.activityLogs.push({
          id: Date.now().toString() + '_high_risk_task_generated',
          activity: `生成高风险任务"${highRiskTask.title}"`,
          timestamp: now,
          type: 'event',
          details: `风险等级：${highRiskTask.riskLevel}，${highRiskTask.riskDescription}`
        });
      } else {
        // 生成特殊任务
        try {
          const specialTask = await AIService.generateSpecialTask(activePet, '定期任务生成');
          gameState.tasks.push(specialTask);
        } catch (error) {
          console.error('生成定期任务失败:', error);
        }
      }
      
      this.saveGameState(gameState);
    }
  }

  // 突变系统
  private static async checkForMutation(pet: Pet, gameState: GameState): Promise<void> {
    // 检查是否已经今天检查过突变
    const now = new Date();
    const lastCheck = new Date(pet.lastMutationCheck);
    const hoursSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);
    
    // 每24小时最多一次突变检查
    if (hoursSinceLastCheck < 24) return;
    
    // 计算突变概率：基于突变值，突变值越高概率越大
    const baseProbability = pet.mutation / 100 * 0.3; // 最高30%概率
    const randomChance = Math.random();
    
    if (randomChance < baseProbability) {
      // 触发突变！
      const mutation = this.generateMutation(pet);
      if (mutation) {
        // 应用突变
        pet.mutations.push(mutation.name);
        
        // 应用突变效果
        if (mutation.effects.moodMultiplier) {
          pet.mood = Math.min(100, Math.max(0, pet.mood * mutation.effects.moodMultiplier));
        }
        if (mutation.effects.energyMultiplier) {
          pet.energy = Math.min(100, Math.max(0, pet.energy * mutation.effects.energyMultiplier));
        }
        if (mutation.effects.healthMultiplier) {
          pet.health = Math.min(100, Math.max(0, pet.health * mutation.effects.healthMultiplier));
        }
        
        // 减少突变值（已经发生突变）
        pet.mutation = Math.max(0, pet.mutation - 30);
        
        // 记录突变事件
        gameState.activityLogs.push({
          id: Date.now().toString() + '_mutation',
          activity: `🧬 ${pet.name}发生了突变：${mutation.name}`,
          timestamp: new Date(),
          type: 'event',
          details: `${mutation.description} - ${mutation.effects.specialAbility || ''}`
        });
        
        // 更新故事
        gameState.currentStory += `\n🧬 ${pet.name}发生了奇妙的变化！获得了新特性：${mutation.name}`;
      }
    }
    
    // 更新最后检查时间
    pet.lastMutationCheck = now;
  }

  private static generateMutation(pet: Pet): any {
    // 根据宠物类型和当前突变值生成合适的突变
    const mutations = [
      // 通用突变
      {
        id: 'enhanced_senses',
        name: '感知增强',
        description: '感官变得更加敏锐',
        type: 'ability',
        rarity: 'common',
        effects: {
          moodMultiplier: 1.1,
          specialAbility: '能够感知到更微妙的情绪变化'
        },
        triggers: { minMutation: 20 }
      },
      {
        id: 'energy_efficiency',
        name: '能量节约',
        description: '新陈代谢变得更加高效',
        type: 'physical',
        rarity: 'common',
        effects: {
          energyMultiplier: 1.15,
          specialAbility: '能量消耗减少'
        },
        triggers: { minMutation: 30 }
      },
      // 动物类型突变
      {
        id: 'night_vision',
        name: '夜视能力',
        description: '在黑暗中也能清晰地看见',
        type: 'ability',
        rarity: 'rare',
        effects: {
          moodMultiplier: 1.05,
          specialAbility: '夜间活动能力增强'
        },
        triggers: { minMutation: 40, petTypes: ['animal'] }
      },
      // 机器人类型突变
      {
        id: 'upgraded_processor',
        name: '处理器升级',
        description: '思维处理速度显著提升',
        type: 'ability',
        rarity: 'rare',
        effects: {
          moodMultiplier: 1.2,
          specialAbility: '学习和反应速度大幅提升'
        },
        triggers: { minMutation: 50, petTypes: ['robot'] }
      },
      // 植物类型突变
      {
        id: 'photosynthesis_boost',
        name: '光合作用强化',
        description: '能够更高效地利用光能',
        type: 'physical',
        rarity: 'rare',
        effects: {
          energyMultiplier: 1.3,
          specialAbility: '在阳光下快速恢复能量'
        },
        triggers: { minMutation: 45, petTypes: ['plant'] }
      },
      // 高级突变
      {
        id: 'regeneration',
        name: '再生能力',
        description: '获得了缓慢的自我修复能力',
        type: 'ability',
        rarity: 'epic',
        effects: {
          healthMultiplier: 1.25,
          specialAbility: '健康值会缓慢自动恢复'
        },
        triggers: { minMutation: 70 }
      },
      {
        id: 'emotional_resonance',
        name: '情感共鸣',
        description: '能够与主人建立更深层的情感连接',
        type: 'behavioral',
        rarity: 'legendary',
        effects: {
          moodMultiplier: 1.4,
          specialAbility: '与主人的互动效果显著增强'
        },
        triggers: { minMutation: 80 }
      }
    ];
    
    // 筛选符合条件的突变
    const availableMutations = mutations.filter(mutation => {
      // 检查突变值要求
      if (pet.mutation < mutation.triggers.minMutation) return false;
      
      // 检查宠物类型要求
      if (mutation.triggers.petTypes && !mutation.triggers.petTypes.includes(pet.petType)) return false;
      
      // 检查是否已经拥有该突变
      if (pet.mutations.includes(mutation.name)) return false;
      
      return true;
    });
    
    if (availableMutations.length === 0) return null;
    
    // 根据稀有度加权选择
    const weights = availableMutations.map(m => {
      switch (m.rarity) {
        case 'common': return 50;
        case 'rare': return 25;
        case 'epic': return 15;
        case 'legendary': return 10;
        default: return 30;
      }
    });
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < availableMutations.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return availableMutations[i];
      }
    }
    
    return availableMutations[0]; // 备选
  }
} 