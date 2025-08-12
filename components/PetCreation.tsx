'use client'

import { useState } from 'react'
import { GameService } from '../lib/game-service'
import { GameState } from '../types'
import { Upload, Sparkles, Loader2, Eye } from 'lucide-react'

interface PetCreationProps {
  onPetCreated: (gameState: GameState) => void
}

const GENRE_OPTIONS = [
  '科幻未来',
  '奇幻魔法',
  '现代都市',
  '古代神话',
  '外星文明',
  '蒸汽朋克',
  '赛博朋克',
  '随机创意',
]

export default function PetCreation({ onPetCreated }: PetCreationProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [selectedGenre, setSelectedGenre] = useState<string>('随机创意')
  const [imageDescription, setImageDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setAnalysisResult(null) // 重置分析结果
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreatePet = async () => {
    if (!selectedFile && !imageDescription.trim()) {
      setError('请上传图片或输入图片描述')
      return
    }

    setIsCreating(true)
    setError('')

    try {
      let gameState: GameState

      if (selectedFile) {
        // 使用图像分析创建宠物
        console.log('使用图像分析创建宠物...')
        gameState = await GameService.createNewPetFromImage(
          selectedFile,
          selectedGenre === '随机创意' ? undefined : selectedGenre
        )
      } else {
        // 使用描述创建宠物
        console.log('使用描述创建宠物...')
        gameState = await GameService.createNewPet(
          imageDescription.trim(),
          selectedGenre === '随机创意' ? undefined : selectedGenre
        )
      }
      
      onPetCreated(gameState)
    } catch (error) {
      setError('创建宠物失败，请重试')
      console.error('创建宠物失败:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handlePreviewAnalysis = async () => {
    if (!selectedFile) {
      setError('请先上传图片')
      return
    }

    setIsCreating(true)
    setError('')

    try {
      // 这里可以添加预览图像分析的功能
      // 暂时显示文件名分析
      const fileName = selectedFile.name.toLowerCase()
      let previewAnalysis = {
        objects: ['物体', '物品'],
        colors: ['彩色'],
        description: `一个${selectedFile.name.split('.')[0]}的图片`
      }

      if (fileName.includes('cat') || fileName.includes('猫')) {
        previewAnalysis = {
          objects: ['猫', '动物', '宠物'],
          colors: ['橘色', '白色', '黑色'],
          description: '一只可爱的小猫'
        }
      } else if (fileName.includes('tea') || fileName.includes('奶茶') || fileName.includes('珍珠')) {
        previewAnalysis = {
          objects: ['珍珠奶茶', '饮料', '珍珠', '奶茶'],
          colors: ['棕色', '黑色', '白色'],
          description: '一杯美味的珍珠奶茶'
        }
      }

      setAnalysisResult(previewAnalysis)
    } catch (error) {
      setError('图像分析失败')
      console.error('图像分析失败:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          创建你的专属宠物
        </h2>
        <p className="text-gray-600">
          上传图片，AI将分析图片内容并为你创造一个独特的电子宠物世界
        </p>
      </div>

      <div className="space-y-6">
        {/* 图片上传区域 */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            {imagePreview ? (
              <div className="space-y-4">
                <img
                  src={imagePreview}
                  alt="预览"
                  className="w-32 h-32 object-cover rounded-lg mx-auto"
                />
                <p className="text-sm text-gray-500">点击重新选择图片</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    点击上传图片
                  </p>
                  <p className="text-sm text-gray-500">
                    支持 JPG, PNG, GIF 格式
                  </p>
                </div>
              </div>
            )}
          </label>
        </div>

        {/* 图像分析预览 */}
        {selectedFile && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-800">图像分析预览</h3>
              <button
                onClick={handlePreviewAnalysis}
                disabled={isCreating}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Eye className="w-4 h-4" />
                <span>预览分析</span>
              </button>
            </div>
            {analysisResult && (
              <div className="space-y-2 text-sm">
                <p><strong>识别物体:</strong> {analysisResult.objects.join(', ')}</p>
                <p><strong>主要颜色:</strong> {analysisResult.colors.join(', ')}</p>
                <p><strong>描述:</strong> {analysisResult.description}</p>
              </div>
            )}
          </div>
        )}

        {/* 图片描述输入 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            图片描述（可选，用于补充或修正AI分析）
          </label>
          <textarea
            value={imageDescription}
            onChange={(e) => setImageDescription(e.target.value)}
            placeholder="如果AI分析不准确，可以在这里补充描述..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        {/* 风格选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择世界风格
          </label>
          <div className="grid grid-cols-2 gap-3">
            {GENRE_OPTIONS.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedGenre === genre
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* 创建按钮 */}
        <button
          onClick={handleCreatePet}
          disabled={isCreating || (!selectedFile && !imageDescription.trim())}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>正在创建宠物...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>开始冒险之旅</span>
            </>
          )}
        </button>

        <div className="text-center text-sm text-gray-500">
          <p>💡 提示：AI会分析你的图片内容，然后创造相关的宠物角色和世界设定</p>
        </div>
      </div>
    </div>
  )
} 