import axios from 'axios';

export interface ImageAnalysisResult {
  objects: string[];
  colors: string[];
  description: string;
  confidence: number;
}

export class ImageAnalysisService {
  // 使用免费的图像识别API (可选：OpenAI Vision API, Google Vision API等)
  // 这里我们使用一个模拟的图像识别服务作为示例
  static async analyzeImage(imageFile: File): Promise<ImageAnalysisResult> {
    try {
      // 将图片转换为base64
      const base64Image = await this.fileToBase64(imageFile);
      
      // 这里可以集成真实的图像识别API
      // 例如：OpenAI Vision API, Google Vision API, Azure Computer Vision等
      
      // 模拟图像识别结果（实际使用时替换为真实API调用）
      const analysisResult = await this.simulateImageAnalysis(imageFile.name, base64Image);
      
      return analysisResult;
    } catch (error) {
      console.error('图像分析失败:', error);
      throw new Error('图像分析失败，请重试');
    }
  }

  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // 移除data:image/jpeg;base64,前缀
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  private static async simulateImageAnalysis(fileName: string, base64Image: string): Promise<ImageAnalysisResult> {
    // 模拟图像识别 - 基于文件名进行简单分析
    // 实际使用时，这里应该调用真实的图像识别API
    
    const fileNameLower = fileName.toLowerCase();
    
    // 基于文件名的简单识别逻辑
    let objects: string[] = [];
    let colors: string[] = [];
    let description = '';
    
    if (fileNameLower.includes('cat') || fileNameLower.includes('猫')) {
      objects = ['猫', '动物', '宠物'];
      colors = ['橘色', '白色', '黑色'];
      description = '一只可爱的小猫';
    } else if (fileNameLower.includes('dog') || fileNameLower.includes('狗')) {
      objects = ['狗', '动物', '宠物'];
      colors = ['棕色', '白色', '黑色'];
      description = '一只活泼的小狗';
    } else if (fileNameLower.includes('flower') || fileNameLower.includes('花')) {
      objects = ['花', '植物', '自然'];
      colors = ['红色', '粉色', '白色'];
      description = '一朵美丽的花';
    } else if (fileNameLower.includes('robot') || fileNameLower.includes('机器人')) {
      objects = ['机器人', '科技', '机械'];
      colors = ['蓝色', '银色', '白色'];
      description = '一个高科技机器人';
    } else if (fileNameLower.includes('bubble') || fileNameLower.includes('泡泡')) {
      objects = ['泡泡', '液体', '透明'];
      colors = ['透明', '彩虹色', '白色'];
      description = '一些美丽的泡泡';
    } else if (fileNameLower.includes('tea') || fileNameLower.includes('奶茶') || fileNameLower.includes('珍珠')) {
      objects = ['珍珠奶茶', '饮料', '珍珠', '奶茶'];
      colors = ['棕色', '黑色', '白色'];
      description = '一杯美味的珍珠奶茶';
    } else {
      // 默认分析
      objects = ['物体', '物品'];
      colors = ['彩色'];
      description = `一个${fileName.split('.')[0]}的图片`;
    }
    
    return {
      objects,
      colors,
      description,
      confidence: 0.8
    };
  }

  // 集成OpenAI Vision API的示例（需要API密钥）
  static async analyzeImageWithOpenAI(imageFile: File): Promise<ImageAnalysisResult> {
    try {
      const base64Image = await this.fileToBase64(imageFile);
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: '请分析这张图片，识别其中的主要物体、颜色和特征。请用中文回答，格式如下：\n物体：[主要物体列表]\n颜色：[主要颜色列表]\n描述：[详细描述]'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const content = response.data.choices[0].message.content;
      
      // 解析AI返回的内容
      const objectsMatch = content.match(/物体：\[(.*?)\]/);
      const colorsMatch = content.match(/颜色：\[(.*?)\]/);
      const descriptionMatch = content.match(/描述：(.*?)(?=\n|$)/);
      
      return {
        objects: objectsMatch ? objectsMatch[1].split(',').map(s => s.trim()) : [],
        colors: colorsMatch ? colorsMatch[1].split(',').map(s => s.trim()) : [],
        description: descriptionMatch ? descriptionMatch[1].trim() : content,
        confidence: 0.9
      };
    } catch (error) {
      console.error('OpenAI Vision API调用失败:', error);
      // 回退到模拟分析
      return this.simulateImageAnalysis(imageFile.name, '');
    }
  }
} 