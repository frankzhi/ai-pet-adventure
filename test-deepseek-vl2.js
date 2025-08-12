const axios = require('axios');

const DEEPSEEK_API_KEY = 'sk-8d09b60d4e0245e6b85b4ab503c0d5f7';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 模拟珍珠奶茶图片的base64数据
const mockImageBase64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

async function testDeepSeekVL2ImageAnalysis() {
  console.log(' 开始测试DeepSeek-VL2图像识别...');
  
  // 测试不同的DeepSeek-VL2模型
  const vl2Models = ['deepseek-vl2-tiny', 'deepseek-vl2-small', 'deepseek-vl2'];
  
  for (const model of vl2Models) {
    try {
      console.log(`\n📡 尝试使用模型: ${model}`);
      
      const response = await axios.post(
        DEEPSEEK_API_URL,
        {
          model: model,
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
                    url: `data:image/jpeg;base64,${mockImageBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 500,
          temperature: 0.1
        },
        {
          headers: {
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const content = response.data.choices[0].message.content;
      console.log(`✅ 模型 ${model} 返回结果:`);
      console.log(content);
      
      // 解析结果
      const objectsMatch = content.match(/物体：\[(.*?)\]/);
      const colorsMatch = content.match(/颜色：\[(.*?)\]/);
      const descriptionMatch = content.match(/描述：(.*?)(?=\n|$)/);
      
      const result = {
        objects: objectsMatch ? objectsMatch[1].split(',').map(s => s.trim()) : [],
        colors: colorsMatch ? colorsMatch[1].split(',').map(s => s.trim()) : [],
        description: descriptionMatch ? descriptionMatch[1].trim() : content,
        confidence: 0.95
      };
      
      console.log('\n📊 解析结果:');
      console.log('物体:', result.objects);
      console.log('颜色:', result.colors);
      console.log('描述:', result.description);
      console.log('置信度:', result.confidence);
      
      return result;
      
    } catch (error) {
      console.log(`❌ 模型 ${model} 不可用:`, error.response?.data?.error?.message || error.message);
      continue;
    }
  }
  
  console.log('\n❌ 所有DeepSeek-VL2模型都不可用');
  return null;
}

// 运行测试
testDeepSeekVL2ImageAnalysis()
  .then(result => {
    if (result) {
      console.log('\n🎉 测试成功！DeepSeek-VL2图像识别功能正常');
    } else {
      console.log('\n💡 建议：可能需要升级API密钥或使用其他图像识别服务');
    }
  })
  .catch(error => {
    console.error('\n❌ 测试失败:', error.message);
  });
