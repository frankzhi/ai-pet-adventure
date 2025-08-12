import axios from 'axios';
import { Pet, Task, AIResponse } from '../types';

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
          temperature: 0.8,
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

  static async generatePetFromImage(imageDescription: string, genre?: string): Promise<Pet> {
    const prompt = `你是一个创意作家，需要根据用户提供的图片描述创建一个独特的电子宠物角色。

图片描述: ${imageDescription}
${genre ? `风格/题材: ${genre}` : '风格/题材: 随机创意风格'}

请创建一个完整的宠物角色设定，包括：
1. 世界设定（可以是科幻、奇幻、现实、神话等任何风格）
2. 背景故事（宠物的来历、特殊能力等）
3. 性格特征（3-5个关键词）
4. 个性描述（一段话描述）

请以JSON格式返回，格式如下：
{
  "name": "宠物名字",
  "type": "宠物类型",
  "worldSetting": "世界设定描述",
  "background": "背景故事",
  "characteristics": ["特征1", "特征2", "特征3"],
  "personality": "个性描述"
}

请确保内容有趣、有创意，可以是任何风格的故事。`;

    const messages = [
      { role: 'system', content: '你是一个创意作家，专门创作有趣的电子宠物角色设定。' },
      { role: 'user', content: prompt }
    ];

    try {
      const response = await this.callDeepSeekAPI(messages);
      const petData = JSON.parse(response);
      
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
        hunger: 0,
        level: 1,
        experience: 0,
        createdAt: new Date(),
        lastInteraction: new Date(),
        isAlive: true,
      };
    } catch (error) {
      console.error('生成宠物设定失败:', error);
      throw new Error('无法生成宠物设定');
    }
  }

  static async generateDailyTasks(pet: Pet): Promise<Task[]> {
    const prompt = `为这个电子宠物生成3个日常任务：

宠物信息：
- 名字: ${pet.name}
- 类型: ${pet.type}
- 世界设定: ${pet.worldSetting}
- 性格: ${pet.personality}

请生成3个有趣的日常任务，任务应该与宠物的设定和性格相符。每个任务包含：
1. 任务标题
2. 任务描述
3. 任务类型（daily）
4. 奖励（经验值、快乐度、健康值）

请以JSON数组格式返回：
[
  {
    "title": "任务标题",
    "description": "任务描述",
    "reward": {
      "experience": 经验值,
      "happiness": 快乐度,
      "health": 健康值
    }
  }
]`;

    const messages = [
      { role: 'system', content: '你是一个游戏设计师，专门设计有趣的日常任务。' },
      { role: 'user', content: prompt }
    ];

    try {
      const response = await this.callDeepSeekAPI(messages);
      const tasksData = JSON.parse(response);
      
      return tasksData.map((taskData: any, index: number) => ({
        id: Date.now().toString() + index,
        title: taskData.title,
        description: taskData.description,
        type: 'daily' as const,
        reward: taskData.reward,
        isCompleted: false,
        createdAt: new Date(),
      }));
    } catch (error) {
      console.error('生成日常任务失败:', error);
      // 返回默认任务
      return [
        {
          id: Date.now().toString(),
          title: '与宠物互动',
          description: '花时间陪伴你的宠物，增加亲密度',
          type: 'daily' as const,
          reward: { experience: 10, happiness: 15, health: 5 },
          isCompleted: false,
          createdAt: new Date(),
        },
        {
          id: (Date.now() + 1).toString(),
          title: '喂食时间',
          description: '为宠物准备美味的食物',
          type: 'daily' as const,
          reward: { experience: 8, happiness: 10, health: 20 },
          isCompleted: false,
          createdAt: new Date(),
        },
        {
          id: (Date.now() + 2).toString(),
          title: '游戏时间',
          description: '和宠物一起玩游戏，消耗能量',
          type: 'daily' as const,
          reward: { experience: 12, happiness: 20, health: 10 },
          isCompleted: false,
          createdAt: new Date(),
        },
      ];
    }
  }

  static async generateStoryResponse(
    userMessage: string,
    pet: Pet,
    conversationHistory: any[]
  ): Promise<AIResponse> {
    const prompt = `你是${pet.name}，一个${pet.type}。你的世界设定是：${pet.worldSetting}。

你的背景故事：${pet.background}
你的性格特征：${pet.characteristics.join(', ')}
你的个性：${pet.personality}

现在你的主人对你说：${userMessage}

请以${pet.name}的身份回应，保持角色设定的一致性。回应应该：
1. 符合宠物的性格和设定
2. 有趣且富有想象力
3. 可以包含一些小的剧情发展
4. 长度适中（100-200字）

请直接返回回应内容，不需要额外的格式。`;

    const messages = [
      { role: 'system', content: `你是${pet.name}，请始终保持角色设定。` },
      ...conversationHistory.slice(-5).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: prompt }
    ];

    try {
      const response = await this.callDeepSeekAPI(messages);
      
      return {
        content: response,
        petStatus: {
          happiness: Math.min(100, pet.happiness + Math.floor(Math.random() * 5) + 1),
          energy: Math.max(0, pet.energy - Math.floor(Math.random() * 3)),
          hunger: Math.min(100, pet.hunger + Math.floor(Math.random() * 3) + 1),
        }
      };
    } catch (error) {
      console.error('生成故事回应失败:', error);
      return {
        content: `${pet.name}似乎有点困惑，但还是很开心地回应着你的话...`,
        petStatus: {
          happiness: Math.min(100, pet.happiness + 2),
        }
      };
    }
  }

  static async generateSpecialTask(pet: Pet, context: string): Promise<Task> {
    const prompt = `为${pet.name}生成一个特殊任务：

宠物信息：
- 类型: ${pet.type}
- 世界设定: ${pet.worldSetting}
- 背景: ${pet.background}
- 当前情况: ${context}

请生成一个有趣的特殊任务，任务应该：
1. 与宠物的设定和当前情况相关
2. 有一定的挑战性
3. 包含故事元素
4. 有丰厚的奖励

请以JSON格式返回：
{
  "title": "任务标题",
  "description": "详细的任务描述",
  "reward": {
    "experience": 经验值,
    "happiness": 快乐度,
    "health": 健康值
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
        id: Date.now().toString(),
        title: taskData.title,
        description: taskData.description,
        type: 'special' as const,
        reward: taskData.reward,
        isCompleted: false,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('生成特殊任务失败:', error);
      return {
        id: Date.now().toString(),
        title: '神秘冒险',
        description: '一个充满未知的特别任务，等待你去探索...',
        type: 'special' as const,
        reward: { experience: 50, happiness: 30, health: 25 },
        isCompleted: false,
        createdAt: new Date(),
      };
    }
  }
} 