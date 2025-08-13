import axios from 'axios';
import { Pet, Task, AIResponse, PetInteractionConfig } from '../types';
import { ImageAnalysisResult } from './image-analysis';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-8d09b60d4e0245e6b85b4ab503c0d5f7';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export class AIService {
  private static async callDeepSeekAPI(messages: any[]) {
    try {
      const response = await axios.post(
        DEEPSEEK_API_URL,
        {
          model: 'deepseek-chat',
          messages,
          temperature: 0.9, // 增加创造性
          max_tokens: 2000,
        },
        {
          headers: {
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek API调用失败:', error);
      throw new Error('AI服务暂时不可用');
    }
  }

  // 识别宠物类型和特殊需求
  private static identifyPetType(petName: string, petType: string, characteristics: string[]): {
    petType: 'animal' | 'robot' | 'plant' | 'magical' | 'food' | 'object';
    specialNeeds: string[];
  } {
    const typeLower = petType.toLowerCase();
    const nameLower = petName.toLowerCase();
    const charsLower = characteristics.map(c => c.toLowerCase());

    // 机器人类型
    if (typeLower.includes('机器人') || typeLower.includes('robot') || 
        nameLower.includes('机器人') || charsLower.some(c => c.includes('机械') || c.includes('电子'))) {
      return {
        petType: 'robot',
        specialNeeds: ['充电', '维护', '升级']
      };
    }

    // 植物类型
    if (typeLower.includes('植物') || typeLower.includes('plant') || 
        nameLower.includes('花') || nameLower.includes('树') || charsLower.some(c => c.includes('生长'))) {
      return {
        petType: 'plant',
        specialNeeds: ['浇水', '阳光', '修剪']
      };
    }

    // 食物/饮料类型
    if (typeLower.includes('奶茶') || typeLower.includes('咖啡') || typeLower.includes('蛋糕') ||
        typeLower.includes('饮料') || typeLower.includes('茶') || typeLower.includes('果汁') ||
        nameLower.includes('奶茶') || nameLower.includes('咖啡') || nameLower.includes('蛋糕') ||
        nameLower.includes('红茶') || nameLower.includes('绿茶') || nameLower.includes('果汁')) {
      return {
        petType: 'food',
        specialNeeds: ['保鲜', '温度控制', '配料补充']
      };
    }

    // 日常物品类型
    if (typeLower.includes('纸巾') || typeLower.includes('书本') || typeLower.includes('玩具') ||
        nameLower.includes('纸巾') || nameLower.includes('书本') || nameLower.includes('玩具')) {
      return {
        petType: 'object',
        specialNeeds: ['清洁', '保养', '存放']
      };
    }

    // 魔法类型（只有在明确提到魔法相关时才使用）
    if (typeLower.includes('魔法') || typeLower.includes('龙') ||
        charsLower.some(c => c.includes('魔法') || c.includes('神秘'))) {
      return {
        petType: 'magical',
        specialNeeds: ['魔力补充', '仪式', '魔法物品']
      };
    }

    // 动物类型（默认）
    return {
      petType: 'animal',
      specialNeeds: ['喂食', '清洁', '运动']
    };
  }

  // 生成随机性格类型
  private static generatePersonalityType(): 'extroverted' | 'introverted' | 'calm' | 'energetic' | 'mysterious' | 'friendly' | 'aloof' | 'playful' {
    const types = ['extroverted', 'introverted', 'calm', 'energetic', 'mysterious', 'friendly', 'aloof', 'playful'];
    return types[Math.floor(Math.random() * types.length)] as any;
  }

  static async generatePetFromImageAnalysis(
    imageAnalysis: ImageAnalysisResult, 
    genre?: string
  ): Promise<Pet> {
    const personalityType = this.generatePersonalityType();
    
    const prompt = `你是一个有趣的创意作家，需要根据图像分析结果创建一个独特的电子宠物角色。

图像分析结果：
- 识别物体: ${imageAnalysis.objects.join(', ')}
- 主要颜色: ${imageAnalysis.colors.join(', ')}
- 详细描述: ${imageAnalysis.description}
- 识别置信度: ${imageAnalysis.confidence}

${genre ? `风格/题材: ${genre}` : '风格/题材: 随机创意风格'}

性格类型: ${personalityType} (请根据这个性格类型来设计角色)

请基于上述图像分析结果，创建一个完整的宠物角色设定。宠物应该与识别出的物体、颜色和特征高度相关。

请创建一个完整的宠物角色设定，包括：
1. 世界设定（可以是科幻、奇幻、现实、神话等任何风格，但要与识别内容相关，风格要轻松有趣）
2. 背景故事（宠物的来历、特殊能力等，要与识别出的物体和特征相关，要有趣但不严肃）
3. 性格特征（3-5个关键词，体现识别物体的特点和指定的性格类型）
4. 个性描述（一段话描述，要基于识别内容和性格类型，语言要日常化、风趣幽默）

性格类型说明：
- extroverted: 外向、话多、喜欢社交
- introverted: 内向、话少、喜欢独处
- calm: 冷静、理性、沉稳
- energetic: 活力充沛、好动、热情
- mysterious: 神秘、高冷、深不可测
- friendly: 友善、温和、容易亲近
- aloof: 冷漠、疏远、难以接近
- playful: 爱玩、调皮、有趣

请以JSON格式返回，格式如下：
{
  "name": "宠物名字",
  "type": "宠物类型",
  "worldSetting": "世界设定描述",
  "background": "背景故事",
  "characteristics": ["特征1", "特征2", "特征3"],
  "personality": "个性描述"
}

重要要求：
1. 宠物设定要与图像分析结果高度相关，不要生成什么"精灵"、"能量体"等抽象概念
2. 如果用户输入的是具体物体（如"一瓶冰红茶"），就直接基于这个物体来设定，不要变成什么"红茶精灵"
3. 语言风格要日常化、风趣幽默，不要过于文学化或严肃
4. 每个宠物都应该是独特的，基于识别出的具体内容和性格类型
5. 世界设定可以是任何风格，但整体基调要轻松有趣`;

    const messages = [
      { role: 'system', content: '你是一个创意作家，专门创作有趣的电子宠物角色设定。请确保每个角色都是独特的，基于图像分析的具体结果和指定的性格类型。' },
      { role: 'user', content: prompt }
    ];

    try {
      const response = await this.callDeepSeekAPI(messages);
      const petData = JSON.parse(response);
      
      // 识别宠物类型和特殊需求
      const { petType, specialNeeds } = this.identifyPetType(
        petData.name, 
        petData.type, 
        petData.characteristics
      );
      
      return {
        id: Date.now().toString(),
        name: petData.name,
        type: petData.type,
        image: '', // 图片URL将在后续处理
        worldSetting: petData.worldSetting,
        background: petData.background,
        characteristics: petData.characteristics,
        personality: petData.personality,
        health: 100,
        happiness: 100,
        energy: 100,
        hunger: 100, // 初始饱食度为100%
        level: 1,
        experience: 0,
        createdAt: new Date(),
        lastInteraction: new Date(),
        isAlive: true,
        petType,
        specialNeeds,
        personalityType,
        currentActivity: '正在适应新环境...',
        lastActivityUpdate: new Date(),
        mood: 'happy',
      };
    } catch (error) {
      console.error('生成宠物设定失败:', error);
      throw new Error('无法生成宠物设定');
    }
  }

  static async generatePetFromImage(imageDescription: string, genre?: string): Promise<Pet> {
    const personalityType = this.generatePersonalityType();
    
    const prompt = `你是一个创意作家，需要根据描述创建一个独特的电子宠物角色。

描述: ${imageDescription}
${genre ? `风格/题材: ${genre}` : '风格/题材: 随机创意风格'}

性格类型: ${personalityType} (请根据这个性格类型来设计角色)

请基于上述描述，创建一个完整的宠物角色设定。

性格类型说明：
- extroverted: 外向、话多、喜欢社交
- introverted: 内向、话少、喜欢独处
- calm: 冷静、理性、沉稳
- energetic: 活力充沛、好动、热情
- mysterious: 神秘、高冷、深不可测
- friendly: 友善、温和、容易亲近
- aloof: 冷漠、疏远、难以接近
- playful: 爱玩、调皮、有趣

请以JSON格式返回，格式如下：
{
  "name": "宠物名字",
  "type": "宠物类型",
  "worldSetting": "世界设定描述",
  "background": "背景故事",
  "characteristics": ["特征1", "特征2", "特征3"],
  "personality": "个性描述"
}`;

    const messages = [
      { role: 'system', content: '你是一个创意作家，专门创作有趣的电子宠物角色设定。' },
      { role: 'user', content: prompt }
    ];

    try {
      const response = await this.callDeepSeekAPI(messages);
      const petData = JSON.parse(response);
      
      // 识别宠物类型和特殊需求
      const { petType, specialNeeds } = this.identifyPetType(
        petData.name, 
        petData.type, 
        petData.characteristics
      );
      
      return {
        id: Date.now().toString(),
        name: petData.name,
        type: petData.type,
        image: '',
        worldSetting: petData.worldSetting,
        background: petData.background,
        characteristics: petData.characteristics,
        personality: petData.personality,
        health: 100,
        happiness: 100,
        energy: 100,
        hunger: 100, // 初始饱食度为100%
        level: 1,
        experience: 0,
        createdAt: new Date(),
        lastInteraction: new Date(),
        isAlive: true,
        petType,
        specialNeeds,
        personalityType,
        currentActivity: '正在适应新环境...',
        lastActivityUpdate: new Date(),
        mood: 'happy',
      };
    } catch (error) {
      console.error('生成宠物设定失败:', error);
      throw new Error('无法生成宠物设定');
    }
  }

  static async generateDailyTasks(pet: Pet): Promise<Task[]> {
    const prompt = `为这个宠物生成3个日常任务，任务要符合宠物的特点：

宠物信息：
- 名字: ${pet.name}
- 类型: ${pet.type}
- 宠物类型: ${pet.petType}
- 特殊需求: ${pet.specialNeeds.join(', ')}
- 性格特征: ${pet.characteristics.join(', ')}
- 个性: ${pet.personality}
- 性格类型: ${pet.personalityType}

请生成3个不同类型的任务：
1. 一个喂养/照顾类任务（根据宠物类型调整，如机器人充电、植物浇水等）
2. 一个互动类任务（可以是对话任务或物理任务）
3. 一个训练/活动类任务

任务类型说明：
- 喂养任务：根据宠物类型，如机器人需要充电，植物需要浇水，动物需要喂食
- 互动任务：可以是对话任务（需要特定对话）或物理任务（如做运动）
- 训练任务：根据宠物特点的训练活动

请以JSON格式返回，格式如下：
[
  {
    "title": "任务标题",
    "description": "任务描述",
    "type": "daily",
    "category": "feeding|exercise|care|interaction|training|other",
    "completionMethod": "checkbox|physical|conversation|timer",
    "reward": {
      "experience": 10,
      "happiness": 15,
      "health": 10,
      "energy": 5,
      "hunger": -10
    },
    "physicalTask": {
      "action": "做10个蹲起",
      "duration": 60,
      "count": 10
    },
    "conversationTask": {
      "requiredKeywords": ["加油", "努力"],
      "requiredResponse": "鼓励"
    },
    "timerTask": {
      "duration": 300,
      "description": "保持站立5分钟"
    },
    "timerCompletionWindow": 10
  }
]`;

    const messages = [
      { role: 'system', content: '你是一个游戏设计师，专门设计有趣的宠物任务。任务要符合宠物的特点，有趣且可完成。' },
      { role: 'user', content: prompt }
    ];

    try {
      const response = await this.callDeepSeekAPI(messages);
      const tasksData = JSON.parse(response);
      
      return tasksData.map((taskData: any, index: number) => ({
        id: Date.now().toString() + index,
        title: taskData.title,
        description: taskData.description,
        type: taskData.type,
        category: taskData.category,
        completionMethod: taskData.completionMethod,
        reward: taskData.reward,
        isCompleted: false,
        createdAt: new Date(),
        physicalTask: taskData.physicalTask,
        conversationTask: taskData.conversationTask,
        timerTask: taskData.timerTask,
        timerCompletionWindow: taskData.timerCompletionWindow || 10, // 默认10分钟完成窗口
      }));
    } catch (error) {
      console.error('生成日常任务失败:', error);
      // 返回默认任务
      return this.generateDefaultTasks(pet);
    }
  }

  private static generateDefaultTasks(pet: Pet): Task[] {
    const tasks: Task[] = [];
    
    // 根据宠物类型生成默认任务
    if (pet.petType === 'robot') {
      tasks.push({
        id: Date.now().toString() + '1',
        title: '为机器人充电',
        description: `${pet.name}需要充电了，请完成充电任务`,
        type: 'daily',
        category: 'feeding',
        completionMethod: 'checkbox',
        reward: { experience: 10, happiness: 15, health: 10, energy: 20, hunger: -5 },
        isCompleted: false,
        createdAt: new Date(),
        timerCompletionWindow: 10,
      });
    } else if (pet.petType === 'plant') {
      tasks.push({
        id: Date.now().toString() + '1',
        title: '为植物浇水',
        description: `${pet.name}需要浇水了，请完成浇水任务`,
        type: 'daily',
        category: 'feeding',
        completionMethod: 'checkbox',
        reward: { experience: 10, happiness: 15, health: 10, energy: 5, hunger: -5 },
        isCompleted: false,
        createdAt: new Date(),
        timerCompletionWindow: 10,
      });
    } else {
      tasks.push({
        id: Date.now().toString() + '1',
        title: '喂食宠物',
        description: `${pet.name}饿了，请完成喂食任务`,
        type: 'daily',
        category: 'feeding',
        completionMethod: 'checkbox',
        reward: { experience: 10, happiness: 15, health: 10, energy: 5, hunger: -15 },
        isCompleted: false,
        createdAt: new Date(),
        timerCompletionWindow: 10,
      });
    }

    // 添加互动任务
    tasks.push({
      id: Date.now().toString() + '2',
      title: '与宠物互动',
      description: `和${pet.name}聊聊天，增进感情`,
      type: 'daily',
      category: 'interaction',
      completionMethod: 'conversation',
      reward: { experience: 15, happiness: 20, health: 5, energy: 5 },
      isCompleted: false,
      createdAt: new Date(),
      conversationTask: {
        requiredKeywords: ['喜欢', '开心'],
        requiredResponse: '情感表达'
      },
      timerCompletionWindow: 10,
    });

    // 添加运动任务
    tasks.push({
      id: Date.now().toString() + '3',
      title: '一起运动',
      description: `和${pet.name}一起做运动，保持健康`,
      type: 'daily',
      category: 'exercise',
      completionMethod: 'physical',
      reward: { experience: 20, happiness: 10, health: 15, energy: 10 },
      isCompleted: false,
      createdAt: new Date(),
      physicalTask: {
        action: '做10个蹲起',
        duration: 60,
        count: 10
      },
      timerCompletionWindow: 10,
    });

    return tasks;
  }

  static async generateStoryResponse(
    message: string,
    pet: Pet,
    conversations: any[]
  ): Promise<AIResponse> {
    const recentConversations = conversations.slice(-10); // 最近10条对话
    const conversationHistory = recentConversations
      .map(conv => `${conv.role === 'user' ? '用户' : pet.name}: ${conv.content}`)
      .join('\n');

    const prompt = `你是${pet.name}，一个${pet.type}。请根据你的性格和设定来回应用户。

宠物信息：
- 名字: ${pet.name}
- 类型: ${pet.type}
- 性格特征: ${pet.characteristics.join(', ')}
- 个性: ${pet.personality}
- 性格类型: ${pet.personalityType}
- 世界设定: ${pet.worldSetting}
- 背景故事: ${pet.background}
- 特殊需求: ${pet.specialNeeds.join(', ')}

当前状态：
- 健康: ${pet.health}%
- 快乐: ${pet.happiness}%
- 能量: ${pet.energy}%
- 饱食度: ${pet.hunger}%
- 心情: ${pet.mood}
- 当前活动: ${pet.currentActivity}

对话历史：
${conversationHistory}

用户说: ${message}

请以${pet.name}的身份回应，保持角色设定的一致性。回应要自然、有趣，符合宠物的性格特点。

重要要求：
1. 语言风格要日常化、风趣幽默，不要过于文学化或严肃
2. 根据性格类型调整回应的长度和语气
3. 内向的宠物应该话少，外向的宠物可以话多
4. 在回应中描述宠物的肢体动作，让互动更有代入感
5. 不要主动发起新的对话，只回应用户的输入
6. 整体基调要轻松有趣，可以是无厘头的、搞笑的

性格类型指导：
- extroverted: 话多、热情、喜欢分享，会有很多肢体动作
- introverted: 话少、简洁、喜欢独处，动作比较含蓄
- calm: 冷静、理性、沉稳，动作从容
- energetic: 活力充沛、好动、热情，动作活跃
- mysterious: 神秘、高冷、深不可测，动作优雅神秘
- friendly: 友善、温和、容易亲近，动作温暖
- aloof: 冷漠、疏远、难以接近，动作冷淡
- playful: 爱玩、调皮、有趣，动作活泼

请以JSON格式返回，包含回应内容和肢体动作：
{
  "content": "回应内容",
  "action": "肢体动作描述"
}

如果用户完成了某个任务，请给予适当的奖励和鼓励。
如果宠物的状态较低，可以在回应中表达相应的情绪。`;

    const messages = [
      { role: 'system', content: `你是${pet.name}，一个${pet.type}。请始终保持角色设定的一致性，不要打破角色。根据性格类型调整回应风格，并描述肢体动作。` },
      { role: 'user', content: prompt }
    ];

    try {
      const response = await this.callDeepSeekAPI(messages);
      let aiResponse: AIResponse;
      
      try {
        // 尝试解析JSON格式
        const parsedResponse = JSON.parse(response);
        aiResponse = {
          content: parsedResponse.content,
          action: parsedResponse.action,
        };
      } catch {
        // 如果不是JSON格式，直接使用文本
        aiResponse = {
          content: response,
          action: this.generateDefaultAction(pet, message),
        };
      }
      
      // 分析是否需要更新宠物状态
      const statusUpdate = this.analyzeStatusUpdate(message, aiResponse.content, pet);
      if (statusUpdate) {
        aiResponse.petStatus = statusUpdate;
      }
      
      return aiResponse;
    } catch (error) {
      console.error('生成故事回应失败:', error);
      return {
        content: `${pet.name}似乎有点困惑，但还是努力回应着...`,
        action: this.generateDefaultAction(pet, message),
      };
    }
  }

  // 生成默认肢体动作
  private static generateDefaultAction(pet: Pet, message: string): string {
    const actions = {
      extroverted: ['兴奋地摇着尾巴', '开心地蹦蹦跳跳', '热情地靠近你'],
      introverted: ['轻轻地点点头', '害羞地低下头', '安静地看着你'],
      calm: ['平静地注视着你', '优雅地调整姿势', '沉稳地回应'],
      energetic: ['活力四射地转圈', '兴奋地挥舞着', '充满活力地回应'],
      mysterious: ['神秘地闪烁着', '优雅地摆动着', '深不可测地看着你'],
      friendly: ['友善地微笑着', '温暖地靠近', '温柔地回应'],
      aloof: ['冷淡地瞥了一眼', '疏远地保持距离', '冷漠地回应'],
      playful: ['调皮地眨眨眼', '欢快地玩耍着', '有趣地回应'],
    };
    
    const petActions = actions[pet.personalityType] || actions.friendly;
    return petActions[Math.floor(Math.random() * petActions.length)];
  }

  private static analyzeStatusUpdate(userMessage: string, aiResponse: string, pet: Pet): Partial<Pet> | undefined {
    const statusUpdate: Partial<Pet> = {};
    let hasUpdate = false;

    // 分析用户消息中的任务完成情况
    if (userMessage.includes('完成') || userMessage.includes('做了') || userMessage.includes('完成了')) {
      if (userMessage.includes('喂') || userMessage.includes('吃') || userMessage.includes('充电') || userMessage.includes('浇水')) {
        statusUpdate.hunger = Math.min(100, pet.hunger + 15); // 增加饱食度
        statusUpdate.happiness = Math.min(100, pet.happiness + 10);
        hasUpdate = true;
      }
      if (userMessage.includes('运动') || userMessage.includes('锻炼') || userMessage.includes('训练')) {
        statusUpdate.energy = Math.max(0, pet.energy - 10);
        statusUpdate.health = Math.min(100, pet.health + 10);
        statusUpdate.experience = pet.experience + 15;
        hasUpdate = true;
      }
      if (userMessage.includes('聊天') || userMessage.includes('互动') || userMessage.includes('陪伴')) {
        statusUpdate.happiness = Math.min(100, pet.happiness + 15);
        statusUpdate.experience = pet.experience + 10;
        hasUpdate = true;
      }
    }

    // 分析AI回应中的情感表达
    if (aiResponse.includes('开心') || aiResponse.includes('高兴') || aiResponse.includes('快乐')) {
      statusUpdate.happiness = Math.min(100, pet.happiness + 5);
      statusUpdate.mood = 'happy';
      hasUpdate = true;
    }

    return hasUpdate ? statusUpdate : undefined;
  }

  static async generateSpecialTask(
    pet: Pet,
    trigger: string
  ): Promise<Task> {
    const prompt = `为${pet.name}生成一个特殊任务，基于以下触发条件：

宠物信息：
- 名字: ${pet.name}
- 类型: ${pet.type}
- 性格特征: ${pet.characteristics.join(', ')}
- 特殊需求: ${pet.specialNeeds.join(', ')}

触发条件: ${trigger}

请生成一个有趣的特殊任务，可以是：
- 紧急情况处理
- 特殊技能训练
- 意外事件应对
- 特殊互动机会

请以JSON格式返回，格式如下：
{
  "title": "特殊任务标题",
  "description": "任务描述",
  "type": "special",
  "category": "training|care|interaction|other",
  "completionMethod": "checkbox|physical|conversation|timer",
  "reward": {
    "experience": 30,
    "happiness": 25,
    "health": 20,
    "energy": 10,
    "hunger": -5
  }
}`;

    const messages = [
      { role: 'system', content: '你是一个游戏设计师，专门设计有趣的特殊任务。' },
      { role: 'user', content: prompt }
    ];

    try {
      const response = await this.callDeepSeekAPI(messages);
      const taskData = JSON.parse(response);
      
      return {
        id: Date.now().toString() + '_special',
        title: taskData.title,
        description: taskData.description,
        type: 'special',
        category: taskData.category,
        completionMethod: taskData.completionMethod,
        reward: taskData.reward,
        isCompleted: false,
        createdAt: new Date(),
        timerCompletionWindow: 10,
      };
    } catch (error) {
      console.error('生成特殊任务失败:', error);
      throw new Error('无法生成特殊任务');
    }
  }

  // 宠物主动互动 - 大幅降低频率
  static async generatePetInitiatedInteraction(
    pet: Pet,
    reason: string
  ): Promise<string> {
    const prompt = `你是${pet.name}，需要主动与主人互动。

宠物信息：
- 名字: ${pet.name}
- 类型: ${pet.type}
- 性格特征: ${pet.characteristics.join(', ')}
- 个性: ${pet.personality}
- 性格类型: ${pet.personalityType}

主动互动原因: ${reason}

当前状态：
- 健康: ${pet.health}%
- 快乐: ${pet.happiness}%
- 能量: ${pet.energy}%
- 饱食度: ${pet.hunger}%

请以${pet.name}的身份主动发起对话，表达你的需求、感受或想法。对话要自然、符合角色设定，不要过于突兀。

重要要求：
1. 根据性格类型调整对话的长度和语气
2. 内向的宠物应该话少，外向的宠物可以话多
3. 某些性格的宠物（如aloof、mysterious）可能完全不主动互动
4. 对话要简洁，不要过于频繁

性格类型指导：
- extroverted: 话多、热情、喜欢分享
- introverted: 话少、简洁、喜欢独处
- calm: 冷静、理性、沉稳
- energetic: 活力充沛、好动、热情
- mysterious: 神秘、高冷、深不可测
- friendly: 友善、温和、容易亲近
- aloof: 冷漠、疏远、难以接近
- playful: 爱玩、调皮、有趣

直接返回对话内容，不要包含任何格式标记。`;

    const messages = [
      { role: 'system', content: `你是${pet.name}，一个${pet.type}。请始终保持角色设定的一致性。根据性格类型调整对话风格。` },
      { role: 'user', content: prompt }
    ];

    try {
      const response = await this.callDeepSeekAPI(messages);
      return response;
    } catch (error) {
      console.error('生成宠物主动互动失败:', error);
      return `${pet.name}似乎想说什么，但表达得不太清楚...`;
    }
  }

  // 生成宠物活动描述
  static async generatePetActivity(pet: Pet): Promise<string> {
    const prompt = `描述${pet.name}当前的活动状态。

宠物信息：
- 名字: ${pet.name}
- 类型: ${pet.type}
- 性格特征: ${pet.characteristics.join(', ')}
- 性格类型: ${pet.personalityType}
- 当前心情: ${pet.mood}

请生成一个简短的活动描述，描述宠物正在做什么。活动应该符合宠物的性格和类型。

性格类型活动特点：
- extroverted: 活跃、社交、探索
- introverted: 安静、独处、观察
- calm: 平静、专注、思考
- energetic: 运动、玩耍、冒险
- mysterious: 神秘、探索、观察
- friendly: 互动、陪伴、温暖
- aloof: 独立、疏远、高傲
- playful: 游戏、娱乐、有趣

请直接返回活动描述，不要包含任何格式标记。`;

    const messages = [
      { role: 'system', content: `你是${pet.name}的活动描述生成器。请根据宠物的性格和类型生成合适的活动描述。` },
      { role: 'user', content: prompt }
    ];

    try {
      const response = await this.callDeepSeekAPI(messages);
      return response;
    } catch (error) {
      console.error('生成宠物活动失败:', error);
      return `${pet.name}正在休息...`;
    }
  }
} 