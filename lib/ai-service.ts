import axios from 'axios';
import { Pet, Task, AIResponse, PetInteractionConfig } from '../types';
import { ImageAnalysisResult } from './image-analysis';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-8d09b60d4e0245e6b85b4ab503c0d5f7';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export class AIService {
  // 清理AI响应中的markdown代码块标记
  private static cleanAIResponse(response: string): string {
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.substring(7);
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.substring(3);
    }
    if (cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
    }
    return cleanedResponse.trim();
  }

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
        typeLower.includes('能量') || typeLower.includes('精灵') || typeLower.includes('液态') ||
        nameLower.includes('奶茶') || nameLower.includes('咖啡') || nameLower.includes('蛋糕') ||
        nameLower.includes('红茶') || nameLower.includes('绿茶') || nameLower.includes('果汁') ||
        nameLower.includes('宝矿力') || nameLower.includes('能量') || nameLower.includes('水特')) {
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
    
    const prompt = `你需要根据图像分析结果创建一个同伴角色。在这个世界里，任何东西都可以自然地成为你的伙伴。

图像分析结果：
- 识别物体: ${imageAnalysis.objects.join(', ')}
- 主要颜色: ${imageAnalysis.colors.join(', ')}
- 详细描述: ${imageAnalysis.description}

${genre ? `风格/题材: ${genre}` : '风格/题材: 日常生活'}

性格类型: ${personalityType}

**重要设定原则**：
- 这个世界里，任何东西成为同伴都是理所当然的，无需解释原因
- 不要编造"AI化"、"获得意识"、"魔法觉醒"等来历
- 如果是职业（程序员、调酒师等），就按该职业特点设定
- 语言要极度日常化，像介绍朋友一样自然

请创建同伴设定：
1. 世界设定（简单自然的日常世界，这个同伴就存在其中）
2. 背景故事（简单的日常背景，不需要复杂解释）
3. 性格特征（3-5个日常化的特点）
4. 个性描述（用朋友聊天的语气，简单直白）

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
  "name": "同伴名字（日常化）",
  "type": "同伴类型",
  "worldSetting": "日常世界描述",
  "background": "简单日常背景",
  "characteristics": ["特征1", "特征2", "特征3"],
  "personality": "朋友语气的个性描述"
}

重要要求：
1. 同伴就是识别出的那个东西，在这个世界里很自然地存在
2. 绝对不要编造"AI化"、"获得意识"、"魔法觉醒"等来历
3. 如果是职业（程序员、调酒师），就按职业特点设定，很自然
4. 语言必须极度日常化，像介绍朋友一样
5. 禁用"精灵"、"能量体"、"元素"等玄幻词汇
6. 禁用"啦"、"哦"、"呢"、"~"等卖萌语气和颜文字`;

    const messages = [
      { role: 'system', content: '你专门创作日常化的同伴角色。在这个世界里，任何东西都可以自然地成为同伴，无需解释原因。语言要极度日常化，像介绍朋友一样。' },
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
        // 新状态系统
        health: 100,
        mood: 80, // 初始心情较好
        energy: 100,
        mutation: 0, // 初始无突变
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
        currentMoodState: 'happy',
        // 新增字段
        mutations: [],
        lastMutationCheck: new Date(),
        isResting: false,
      };
    } catch (error) {
      console.error('生成宠物设定失败:', error);
      throw new Error('无法生成宠物设定');
    }
  }

  static async generatePetFromImage(imageDescription: string, genre?: string): Promise<Pet> {
    const personalityType = this.generatePersonalityType();
    
    const prompt = `根据描述创建一个同伴角色。在这个世界里，任何东西都可以自然地成为同伴。

描述: ${imageDescription}
${genre ? `风格/题材: ${genre}` : '风格/题材: 日常生活'}

性格类型: ${personalityType}

**重要原则**：
- 同伴就是描述的那个东西，很自然地存在
- 不要编造"AI化"、"获得意识"等来历
- 语言要极度日常化，像介绍朋友

性格类型说明：
- extroverted: 外向、话多、喜欢社交
- introverted: 内向、话少、喜欢独处
- calm: 冷静、理性、沉稳
- energetic: 活力充沛、好动、热情
- mysterious: 神秘、高冷、深不可测
- friendly: 友善、温和、容易亲近
- aloof: 冷漠、疏远、难以接近
- playful: 爱玩、调皮、有趣

请以JSON格式返回：
{
  "name": "同伴名字（日常化）",
  "type": "同伴类型",
  "worldSetting": "日常世界描述",
  "background": "简单日常背景",
  "characteristics": ["特征1", "特征2", "特征3"],
  "personality": "朋友语气的个性描述"
}`;

    const messages = [
      { role: 'system', content: '你专门创作日常化的同伴角色。任何东西都可以自然地成为同伴。语言要极度日常化。' },
      { role: 'user', content: prompt }
    ];

    try {
      const response = await this.callDeepSeekAPI(messages);
      const cleanedResponse = this.cleanAIResponse(response);
      const petData = JSON.parse(cleanedResponse);
      
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
        // 新状态系统
        health: 100,
        mood: 80, // 初始心情较好
        energy: 100,
        mutation: 0, // 初始无突变
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
        currentMoodState: 'happy',
        // 新增字段
        mutations: [],
        lastMutationCheck: new Date(),
        isResting: false,
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

**重要要求**：
- 任务奖励必须有正有负，不能全是正向的
- 经验值通常是正的，但其他状态值应该有增有减
- 互动任务通常消耗能量（负值），但提升心情
- 运动任务消耗能量但提升健康
- 喂养任务提升能量但可能消耗其他状态

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
      "mood": 15,
      "health": 10,
      "energy": -5
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
      const cleanedResponse = this.cleanAIResponse(response);
      const tasksData = JSON.parse(cleanedResponse);
      
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
              reward: { experience: 10, mood: 15, health: 5, energy: -5 },
      isCompleted: false,
      isExpired: false,
      isStarted: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1小时后过期
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
        reward: { experience: 10, mood: 15, health: 10, energy: -3 },
        isCompleted: false,
        isExpired: false,
        isStarted: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1小时后过期
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
        reward: { experience: 10, mood: 15, health: 10, energy: -8 },
        isCompleted: false,
        isExpired: false,
        isStarted: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1小时后过期
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
              reward: { experience: 15, mood: 20, health: 5, energy: -8 },
      isCompleted: false,
      isExpired: false,
      isStarted: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 45 * 60 * 1000), // 45分钟后过期
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
              reward: { experience: 20, mood: 8, health: 15, energy: -18 },
      isCompleted: false,
      isExpired: false,
      isStarted: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30分钟后过期
      physicalTask: {
        action: '做10个蹲起',
        duration: 60,
        count: 10
      },
      timerCompletionWindow: 10,
    });

    return tasks;
  }

  // 生成高风险高回报任务
  static generateHighRiskTask(pet: Pet): Task {
    const riskTasks = [
      {
        title: '基因实验',
        description: '参与一项基因改造实验，可能带来意想不到的变化',
        riskLevel: 'extreme' as const,
        riskDescription: '大幅增加突变值，但全面提升其他状态',
        reward: { experience: 50, mood: 25, health: 20, energy: 35, mutation: 20 },
        category: 'other' as const,
        expiresIn: 20 // 20分钟
      },
      {
        title: '极限运动挑战',
        description: '参加一项极限运动，挑战身体和心理极限',
        riskLevel: 'high' as const,
        riskDescription: '大量消耗能量，但极大提升心情和经验',
        reward: { experience: 40, mood: 45, health: 8, energy: -35, mutation: 5 },
        category: 'exercise' as const,
        expiresIn: 25 // 25分钟
      },
      {
        title: '神秘药剂试验',
        description: '尝试一种神秘的能量药剂，效果未知',
        riskLevel: 'high' as const,
        riskDescription: '可能获得大量能量，也可能产生副作用',
        reward: { experience: 25, mood: -12, health: -18, energy: 65, mutation: 12 },
        category: 'other' as const,
        expiresIn: 15 // 15分钟
      },
      {
        title: '情感共鸣实验',
        description: '参与一项深度情感连接实验',
        riskLevel: 'medium' as const,
        riskDescription: '可能获得巨大的情感满足，但会消耗大量精力',
        reward: { experience: 30, mood: 55, health: 3, energy: -28, mutation: 4 },
        category: 'interaction' as const,
        expiresIn: 35 // 35分钟
      },
      {
        title: '量子跃迁',
        description: '尝试进行量子层面的意识跃迁',
        riskLevel: 'extreme' as const,
        riskDescription: '极大的风险和回报，可能彻底改变存在状态',
        reward: { experience: 75, mood: 15, health: -25, energy: 25, mutation: 30 },
        category: 'other' as const,
        expiresIn: 10 // 10分钟
      }
    ];

    const selectedTask = riskTasks[Math.floor(Math.random() * riskTasks.length)];
    
    return {
      id: Date.now().toString() + '_high_risk',
      title: selectedTask.title,
      description: selectedTask.description,
      type: 'high_risk',
      category: selectedTask.category,
      completionMethod: 'checkbox',
      reward: selectedTask.reward,
      isCompleted: false,
      isExpired: false,
      isStarted: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + selectedTask.expiresIn * 60 * 1000),
      riskLevel: selectedTask.riskLevel,
      riskDescription: selectedTask.riskDescription,
      timerCompletionWindow: 5,
    };
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
- 心情值: ${pet.mood}%
- 能量: ${pet.energy}%
- 突变值: ${pet.mutation}%
- 心情状态: ${pet.currentMoodState}
- 当前活动: ${pet.currentActivity}
- 是否在休息: ${pet.isResting ? '是' : '否'}
- 突变标签: ${pet.mutations.length > 0 ? pet.mutations.join(', ') : '无'}

对话历史：
${conversationHistory}

用户说: ${message}

请以${pet.name}的身份回应，保持角色设定的一致性。回应要自然、有趣，符合宠物的性格特点。

重要要求：
1. **语言风格必须极度日常化**：像朋友聊天一样自然，用口语化表达，避免任何文学性或书面语
2. 用简单直白的话，不要用华丽词汇或成语
3. 根据性格类型调整：内向话少，外向话多
4. 描述动作要简单直接，比如"伸了个懒腰"、"挠挠头"、"打了个哈欠"
5. 只回应用户，不主动开话题
6. **绝对禁止**：不要说"精灵"、"能量体"、"元素"这些玄幻词汇
7. **绝对禁止**：不用"啦"、"哦"、"呢"、"~"等卖萌语气，不用颜文字
8. 休息时要显得很困，话很少，比如"嗯...困..."
9. 心情差时话少且没劲，心情好时活泼一些
10. 有突变时要自然地体现变化，不要刻意强调

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
        const cleanedResponse = this.cleanAIResponse(response);
        const parsedResponse = JSON.parse(cleanedResponse);
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
        statusUpdate.energy = Math.min(100, pet.energy + 15); // 增加能量
        statusUpdate.mood = Math.min(100, pet.mood + 10);
        hasUpdate = true;
      }
      if (userMessage.includes('运动') || userMessage.includes('锻炼') || userMessage.includes('训练')) {
        statusUpdate.energy = Math.max(0, pet.energy - 10);
        statusUpdate.health = Math.min(100, pet.health + 10);
        statusUpdate.experience = pet.experience + 15;
        hasUpdate = true;
      }
      if (userMessage.includes('聊天') || userMessage.includes('互动') || userMessage.includes('陪伴')) {
        statusUpdate.mood = Math.min(100, pet.mood + 15);
        statusUpdate.experience = pet.experience + 10;
        hasUpdate = true;
      }
    }

    // 分析AI回应中的情感表达
    if (aiResponse.includes('开心') || aiResponse.includes('高兴') || aiResponse.includes('快乐')) {
      statusUpdate.mood = Math.min(100, pet.mood + 5);
      statusUpdate.currentMoodState = 'happy';
      hasUpdate = true;
    }

    return hasUpdate ? statusUpdate : undefined;
  }

  // 辅助函数
  private static getJumpDescription(intensity: 'small' | 'medium' | 'large'): string {
    if (intensity === 'large') return '进行了大幅度跳跃运动';
    if (intensity === 'small') return '轻松地跳了几下';
    return '愉快地跳跃着';
  }

  private static getJumpExperience(intensity: 'small' | 'medium' | 'large'): number {
    if (intensity === 'large') return 15;
    if (intensity === 'small') return 5;
    return 10;
  }

  // 新增：使用AI智能分析对话中的状态变化
  static async analyzeDialogueActions(userMessage: string, pet: Pet): Promise<{
    actions: Array<{
      type: 'feed' | 'play' | 'rest' | 'exercise' | 'care' | 'comfort' | 'intense_play' | 'chase' | 'jump';
      intensity: 'small' | 'medium' | 'large';
      description: string;
      statusEffects: Partial<Pet>;
    }>;
    shouldCreateTask: boolean;
  }> {
    const actions: Array<{
      type: 'feed' | 'play' | 'rest' | 'exercise' | 'care' | 'comfort' | 'intense_play' | 'chase' | 'jump';
      intensity: 'small' | 'medium' | 'large';
      description: string;
      statusEffects: Partial<Pet>;
    }> = [];
    
    const message = userMessage.toLowerCase();
    
    // 使用AI智能分析对话内容
    const prompt = `严谨分析这段对话对宠物状态的影响：

宠物信息：
- 名字: ${pet.name}
- 类型: ${pet.type}
- 性格: ${pet.personalityType}
- 当前状态: 健康${pet.health}%, 心情${pet.mood}%, 能量${pet.energy}%, 突变值${pet.mutation}%

用户对话: "${userMessage}"

**状态变化原则**：
1. **健康值**：只有在受伤、生病、过度疲劳时才减少，正常互动不会影响
2. **心情值**：社交互动、被关心、玩耍会提升；被忽视、批评会降低
3. **能量值**：体力活动会消耗，休息、进食会恢复
4. **经验值**：任何有意义的互动都会少量增加

**重要说明**：以下数值都是**变化量**，不是绝对值！
- 正数表示增加，负数表示减少
- 例如：mood: 3 表示心情值+3，energy: -2 表示能量值-2

**变化幅度指导**：
- 轻微互动（打招呼、简单抚摸）：±1-3
- 一般互动（聊天、陪伴）：±3-8
- 重要互动（游戏、进食）：±8-15
- 剧烈活动（运动、工作）：±15-25

**特殊情况**：
- 简单问候（如"喵喵"）：只增加少量经验值，不影响其他状态
- 抚摸、关心：提升心情，轻微消耗能量
- 进食：提升能量和心情
- 运动：消耗能量，提升健康

**示例**：
- 关心询问：mood: +3, experience: +2
- 简单抚摸：mood: +2, energy: -1, experience: +1
- 进食：mood: +5, energy: +8, experience: +2

请根据以上原则，返回JSON格式的状态变化：
{
  "actions": [
    {
      "type": "feed|play|rest|exercise|care|comfort",
      "intensity": "small|medium|large",
      "description": "描述这次互动",
      "statusEffects": {
        "mood": 数值变化,
        "energy": 数值变化,
        "health": 数值变化,
        "experience": 数值变化
      }
    }
  ],
  "shouldCreateTask": true/false
}

注意：
- 数值变化要合理，符合逻辑
- 正数表示增加，负数表示减少
- 如果没有明显变化，返回空数组
- 只返回纯JSON格式，不要包含任何markdown标记或解释文字`;

    try {
      const messages = [
        { role: 'system', content: '你是一个游戏状态分析专家，能准确分析对话对宠物状态的影响。' },
        { role: 'user', content: prompt }
      ];
      
      const response = await this.callDeepSeekAPI(messages);
      
      console.log('AI返回的原始响应:', response);
      const cleanedResponse = this.cleanAIResponse(response);
      console.log('清理后的响应:', cleanedResponse);
      
      const analysis = JSON.parse(cleanedResponse);
      
      return {
        actions: analysis.actions || [],
        shouldCreateTask: analysis.shouldCreateTask || false
      };
    } catch (error) {
      console.error('AI对话分析失败:', error);
      // 如果AI分析失败，使用原有的关键词匹配
      return this.fallbackDialogueAnalysis(message, pet);
    }
  }

  // 备用方案：关键词匹配分析
  private static fallbackDialogueAnalysis(message: string, pet: Pet): {
    actions: Array<{
      type: 'feed' | 'play' | 'rest' | 'exercise' | 'care' | 'comfort' | 'intense_play' | 'chase' | 'jump';
      intensity: 'small' | 'medium' | 'large';
      description: string;
      statusEffects: Partial<Pet>;
    }>;
    shouldCreateTask: boolean;
  } {
    const actions: Array<{
      type: 'feed' | 'play' | 'rest' | 'exercise' | 'care' | 'comfort' | 'intense_play' | 'chase' | 'jump';
      intensity: 'small' | 'medium' | 'large';
      description: string;
      statusEffects: Partial<Pet>;
    }> = [];
    
    // 喂食相关
    if (message.includes('去吃') || message.includes('吃点') || message.includes('喂你') || 
        message.includes('吃东西') || message.includes('吃饭') || message.includes('进食') ||
        message.includes('充电') || message.includes('浇水') || message.includes('补充能量') ||
        message.includes('撸串') || message.includes('烧烤') || message.includes('请客') ||
        message.includes('星巴克') || message.includes('咖啡') || message.includes('澳白')) {
      
      let intensity: 'small' | 'medium' | 'large' = 'medium';
      let hungerBoost = 20;
      let happinessBoost = 10;
      
      if (message.includes('大餐') || message.includes('好好吃') || message.includes('饱餐') ||
          message.includes('撸串') || message.includes('烧烤') || message.includes('请客')) {
        intensity = 'large';
        hungerBoost = 35;
        happinessBoost = 20;
      } else if (message.includes('星巴克') || message.includes('咖啡') || message.includes('澳白')) {
        intensity = 'medium';
        hungerBoost = 25;
        happinessBoost = 15;
      } else if (message.includes('点心') || message.includes('小食') || message.includes('零食')) {
        intensity = 'small';
        hungerBoost = 10;
        happinessBoost = 5;
      }
      
      let description = '';
      if (pet.petType === 'robot') {
        description = intensity === 'large' ? '进行了完整充电' : intensity === 'small' ? '补充了一些电量' : '进行了充电';
      } else if (pet.petType === 'plant') {
        description = intensity === 'large' ? '进行了充分浇水和施肥' : intensity === 'small' ? '补充了一些水分' : '进行了浇水';
      } else {
        description = intensity === 'large' ? '享用了丰盛的大餐' : intensity === 'small' ? '吃了一些小点心' : '吃了一顿美食';
      }
      
      actions.push({
        type: 'feed',
        intensity,
        description,
        statusEffects: {
          energy: Math.min(100, pet.energy + hungerBoost),
          mood: Math.min(100, pet.mood + happinessBoost),
          health: Math.min(100, pet.health + 5)
        }
      });
    }
    
    // 玩耍/互动相关
    if (message.includes('一起玩') || message.includes('陪你玩') || message.includes('游戏') || 
        message.includes('玩耍') || message.includes('互动') || message.includes('陪伴')) {
      
      let intensity: 'small' | 'medium' | 'large' = 'medium';
      let happinessBoost = 15;
      let energyCost = 5;
      
      if (message.includes('好好玩') || message.includes('痛快') || message.includes('尽情')) {
        intensity = 'large';
        happinessBoost = 25;
        energyCost = 10;
      } else if (message.includes('轻松') || message.includes('简单') || message.includes('一会儿')) {
        intensity = 'small';
        happinessBoost = 8;
        energyCost = 2;
      }
      
      actions.push({
        type: 'play',
        intensity,
        description: intensity === 'large' ? '进行了愉快的长时间游戏' : intensity === 'small' ? '进行了轻松的小游戏' : '一起玩了一会儿',
        statusEffects: {
          mood: Math.min(100, pet.mood + happinessBoost),
          energy: Math.max(0, pet.energy - energyCost),
          experience: pet.experience + (intensity === 'large' ? 15 : intensity === 'small' ? 5 : 10)
        }
      });
    }
    
    // 休息相关
    if (message.includes('休息') || message.includes('睡觉') || message.includes('放松') || 
        message.includes('歇一会') || message.includes('打盹') || message.includes('躺下')) {
      
      let intensity: 'small' | 'medium' | 'large' = 'medium';
      let energyBoost = 20;
      let healthBoost = 10;
      
      if (message.includes('好好休息') || message.includes('深度') || message.includes('充分')) {
        intensity = 'large';
        energyBoost = 35;
        healthBoost = 15;
      } else if (message.includes('小憩') || message.includes('短暂') || message.includes('一会儿')) {
        intensity = 'small';
        energyBoost = 10;
        healthBoost = 5;
      }
      
      actions.push({
        type: 'rest',
        intensity,
        description: intensity === 'large' ? '进行了深度休息' : intensity === 'small' ? '小憩了一会儿' : '好好休息了一下',
        statusEffects: {
          energy: Math.min(100, pet.energy + energyBoost),
          health: Math.min(100, pet.health + healthBoost),
          currentMoodState: 'tired' as any,
          isResting: true,
          restStartTime: new Date(),
          restDuration: intensity === 'large' ? 120 : intensity === 'small' ? 30 : 60 // 分钟
        }
      });
    }
    
    // 运动相关
    if (message.includes('运动') || message.includes('锻炼') || message.includes('活动') || 
        message.includes('散步') || message.includes('跑步') || message.includes('训练') ||
        message.includes('深蹲') || message.includes('健身') || message.includes('撸铁')) {
      
      let intensity: 'small' | 'medium' | 'large' = 'medium';
      let healthBoost = 15;
      let energyCost = 15;
      let expBoost = 12;
      
      if (message.includes('激烈') || message.includes('大量') || message.includes('强化') ||
          message.includes('200个') || message.includes('突破') || message.includes('拼命')) {
        intensity = 'large';
        healthBoost = 25;
        energyCost = 35;
        expBoost = 20;
      } else if (message.includes('轻松') || message.includes('简单') || message.includes('散步')) {
        intensity = 'small';
        healthBoost = 8;
        energyCost = 8;
        expBoost = 6;
      }
      
      actions.push({
        type: 'exercise',
        intensity,
        description: intensity === 'large' ? '进行了激烈的运动训练' : intensity === 'small' ? '进行了轻松的活动' : '进行了适量运动',
        statusEffects: {
          health: Math.min(100, pet.health + healthBoost),
          energy: Math.max(0, pet.energy - energyCost),
          experience: pet.experience + expBoost,
          mood: Math.min(100, pet.mood + 8)
        }
      });
    }
    
    // 工作相关状态分析
    if (message.includes('工作') || message.includes('客户') || message.includes('方案') ||
        message.includes('开会') || message.includes('项目') || message.includes('提成')) {
      
      let moodChange = 0;
      let energyChange = 0;
      let description = '';
      
      if (message.includes('顺利') || message.includes('搞定') || message.includes('谈下来') || message.includes('大单子')) {
        moodChange = 15;
        energyChange = -5;
        description = '工作顺利，心情愉悦';
      } else if (message.includes('改需求') || message.includes('磨叽') || message.includes('临时')) {
        moodChange = -10;
        energyChange = -15;
        description = '工作遇到困难，有些疲惫';
      } else {
        moodChange = 5;
        energyChange = -8;
        description = '工作中，消耗了一些精力';
      }
      
      actions.push({
        type: 'exercise',
        intensity: 'medium',
        description,
        statusEffects: {
          mood: Math.max(0, Math.min(100, pet.mood + moodChange)),
          energy: Math.max(0, Math.min(100, pet.energy + energyChange)),
          experience: pet.experience + 8
        }
      });
    }
    
    // 情绪状态分析 - 负面情绪
    if (message.includes('认错') || message.includes('记错') || message.includes('不好意思') ||
        message.includes('抱歉') || message.includes('对不起') || message.includes('搞错了')) {
      
      actions.push({
        type: 'comfort',
        intensity: 'small',
        description: '因为认错而感到尴尬',
        statusEffects: {
          mood: Math.max(0, pet.mood - 8),
          energy: Math.max(0, pet.energy - 3)
        }
      });
    }
    
    // 照顾/护理相关
    if (message.includes('照顾') || message.includes('护理') || message.includes('治疗') || 
        message.includes('检查') || message.includes('清洁') || message.includes('梳理')) {
      
      let intensity: 'small' | 'medium' | 'large' = 'medium';
      let healthBoost = 20;
      let happinessBoost = 12;
      
      if (message.includes('仔细') || message.includes('全面') || message.includes('彻底')) {
        intensity = 'large';
        healthBoost = 30;
        happinessBoost = 18;
      } else if (message.includes('简单') || message.includes('快速') || message.includes('检查')) {
        intensity = 'small';
        healthBoost = 12;
        happinessBoost = 6;
      }
      
      actions.push({
        type: 'care',
        intensity,
        description: intensity === 'large' ? '接受了全面的照顾和护理' : intensity === 'small' ? '接受了简单的照顾' : '接受了悉心照顾',
        statusEffects: {
          health: Math.min(100, pet.health + healthBoost),
          mood: Math.min(100, pet.mood + happinessBoost),
          currentMoodState: 'happy' as any
        }
      });
    }
    
    // 安慰相关
    if (message.includes('安慰') || message.includes('鼓励') || message.includes('陪伴') || 
        message.includes('关心') || message.includes('温暖') || message.includes('拥抱')) {
      
      let intensity: 'small' | 'medium' | 'large' = 'medium';
      let happinessBoost = 18;
      let healthBoost = 8;
      
      if (message.includes('温柔') || message.includes('耐心') || message.includes('深深')) {
        intensity = 'large';
        happinessBoost = 28;
        healthBoost = 12;
      } else if (message.includes('轻轻') || message.includes('简单') || message.includes('稍微')) {
        intensity = 'small';
        happinessBoost = 10;
        healthBoost = 4;
      }
      
      actions.push({
        type: 'comfort',
        intensity,
        description: intensity === 'large' ? '得到了深深的安慰和关爱' : intensity === 'small' ? '得到了轻柔的安慰' : '得到了温暖的安慰',
        statusEffects: {
          mood: Math.min(100, pet.mood + happinessBoost),
          health: Math.min(100, pet.health + healthBoost),
          currentMoodState: 'happy' as any
        }
      });
    }
    
    // 激烈运动/追逐相关（基于用户提供的例子）
    if (message.includes('激光') || message.includes('追逐') || message.includes('快速') || 
        message.includes('疯狂') || message.includes('横跳') || message.includes('急转弯') ||
        message.includes('狩猎') || message.includes('抓住') || message.includes('刺激') ||
        message.includes('晃动') || message.includes('追') || message.includes('跳') ||
        message.includes('奔跑') || message.includes('冲刺')) {
      
      let intensity: 'small' | 'medium' | 'large' = 'medium';
      if (message.includes('疯狂') || message.includes('快速') || message.includes('刺激') || 
          message.includes('急') || message.includes('冲刺')) {
        intensity = 'large';
      } else if (message.includes('轻轻') || message.includes('慢慢') || message.includes('小心')) {
        intensity = 'small';
      }
      
      const moodBoost = intensity === 'large' ? 25 : intensity === 'small' ? 8 : 15;
      const energyCost = intensity === 'large' ? 20 : intensity === 'small' ? 5 : 12;
      
      actions.push({
        type: 'intense_play',
        intensity,
        description: intensity === 'large' ? '进行了激烈的追逐游戏' : intensity === 'small' ? '进行了轻松的追逐' : '享受了追逐的乐趣',
        statusEffects: {
          mood: Math.min(100, pet.mood + moodBoost),
          energy: Math.max(0, pet.energy - energyCost),
          experience: pet.experience + (intensity === 'large' ? 20 : intensity === 'small' ? 8 : 12)
        }
      });
    }
    
    // 跳跃相关
    if (message.includes('跳') || message.includes('蹦') || message.includes('弹跳') || 
        message.includes('跃') || message.includes('蹿')) {
      
      const intensityLevel = message.includes('疯狂') || message.includes('大力') || message.includes('高高') ? 'large' : 'medium';
      const intensity: 'small' | 'medium' | 'large' = intensityLevel;
      
      const moodBoost = intensityLevel === 'large' ? 20 : 12;
      const energyCost = intensityLevel === 'large' ? 15 : 8;
      
      actions.push({
        type: 'jump',
        intensity,
        description: AIService.getJumpDescription(intensity),
        statusEffects: {
          mood: Math.min(100, pet.mood + moodBoost),
          energy: Math.max(0, pet.energy - energyCost),
          experience: pet.experience + AIService.getJumpExperience(intensity)
        }
      });
    }
    
    // 判断是否应该创建任务（当用户明确表达要执行某个动作时）
    const shouldCreateTask = actions.length > 0 && (
      message.includes('让你') || message.includes('去') || message.includes('现在') ||
      message.includes('开始') || message.includes('来') || message.includes('应该') ||
      message.includes('继续') || message.includes('再来') || message.includes('快速')
    );
    
    return { actions, shouldCreateTask };
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
      const cleanedResponse = this.cleanAIResponse(response);
      const taskData = JSON.parse(cleanedResponse);
      
      return {
        id: Date.now().toString() + '_special',
        title: taskData.title,
        description: taskData.description,
        type: 'special',
        category: taskData.category,
        completionMethod: taskData.completionMethod,
        reward: taskData.reward,
        isCompleted: false,
        isExpired: false,
        isStarted: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 40 * 60 * 1000), // 40分钟后过期
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
- 心情值: ${pet.mood}%
- 能量: ${pet.energy}%
- 突变值: ${pet.mutation}%

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