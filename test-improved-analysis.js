const { ImageAnalysisService } = require('./lib/image-analysis');

async function testImprovedImageAnalysis() {
  console.log('🧪 测试改进后的图像分析功能...');
  
  // 创建模拟的珍珠奶茶图片文件
  const mockImageFile = new File(['mock'], 'pearl_milk_tea.jpg', { type: 'image/jpeg' });
  
  try {
    console.log('\n📡 测试智能图像分析...');
    const result = await ImageAnalysisService.analyzeImageSmart(mockImageFile);
    
    console.log('\n✅ 分析结果:');
    console.log('物体:', result.objects);
    console.log('颜色:', result.colors);
    console.log('描述:', result.description);
    console.log('置信度:', result.confidence);
    
    return result;
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return null;
  }
}

// 运行测试
testImprovedImageAnalysis()
  .then(result => {
    if (result) {
      console.log('\n🎉 改进后的图像分析功能正常！');
      console.log('💡 现在可以上传珍珠奶茶图片进行测试了');
    }
  })
  .catch(error => {
    console.error('\n❌ 测试失败:', error.message);
  });
