'use client'

import { Pet } from '../types'
import { Heart, Zap, Coffee, Star, Crown, Settings, Battery, Droplets, Leaf, Sparkles, User } from 'lucide-react'

interface PetStatusProps {
  pet: Pet
}

export default function PetStatus({ pet }: PetStatusProps) {
  console.log('PetStatus: 接收到pet数据', pet);
  const getStatusColor = (value: number) => {
    if (value >= 80) return 'text-green-600'
    if (value >= 60) return 'text-yellow-600'
    if (value >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getStatusBarColor = (value: number) => {
    if (value >= 80) return 'bg-green-500'
    if (value >= 60) return 'bg-yellow-500'
    if (value >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getPetTypeIcon = (petType: string) => {
    switch (petType) {
      case 'robot':
        return <Battery className="w-5 h-5 text-blue-500" />
      case 'plant':
        return <Leaf className="w-5 h-5 text-green-500" />
      case 'food':
        return <Coffee className="w-5 h-5 text-orange-500" />
      case 'magical':
        return <Sparkles className="w-5 h-5 text-purple-500" />
      default:
        return <Heart className="w-5 h-5 text-red-500" />
    }
  }

  const getPetTypeLabel = (petType: string) => {
    switch (petType) {
      case 'robot':
        return '机器人'
      case 'plant':
        return '植物'
      case 'food':
        return '食物'
      case 'magical':
        return '魔法生物'
      case 'animal':
        return '动物'
      default:
        return '未知'
    }
  }

  const getPersonalityTypeLabel = (personalityType: string) => {
    switch (personalityType) {
      case 'extroverted':
        return '外向'
      case 'introverted':
        return '内向'
      case 'calm':
        return '冷静'
      case 'energetic':
        return '活力'
      case 'mysterious':
        return '神秘'
      case 'friendly':
        return '友善'
      case 'aloof':
        return '冷漠'
      case 'playful':
        return '爱玩'
      default:
        return '未知'
    }
  }

  const getPersonalityTypeColor = (personalityType: string) => {
    switch (personalityType) {
      case 'extroverted':
        return 'bg-yellow-100 text-yellow-800'
      case 'introverted':
        return 'bg-blue-100 text-blue-800'
      case 'calm':
        return 'bg-green-100 text-green-800'
      case 'energetic':
        return 'bg-red-100 text-red-800'
      case 'mysterious':
        return 'bg-purple-100 text-purple-800'
      case 'friendly':
        return 'bg-pink-100 text-pink-800'
      case 'aloof':
        return 'bg-gray-100 text-gray-800'
      case 'playful':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      {/* 宠物基本信息 - 紧凑布局 */}
      <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
        <div className="flex items-center justify-center space-x-3 mb-3">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-2xl text-white font-bold">
              {pet.name.charAt(0)}
            </span>
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold text-gray-800">{pet.name}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {getPetTypeIcon(pet.petType)}
              <span>{getPetTypeLabel(pet.petType)}</span>
              <span>•</span>
              <span>等级 {pet.level}</span>
            </div>
          </div>
        </div>
        
        {/* 性格类型 */}
        <div className="flex items-center justify-center space-x-2">
          <User className="w-4 h-4 text-gray-500" />
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPersonalityTypeColor(pet.personalityType)}`}>
            {getPersonalityTypeLabel(pet.personalityType)}
          </span>
        </div>
      </div>

      {/* 状态数值 - 紧凑布局 */}
      <div className="bg-white rounded-lg p-4 border">
        <h4 className="font-medium text-gray-800 mb-3 text-center">📊 状态面板</h4>
        
        {/* 经验值 */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-medium text-gray-700">经验值</span>
            </div>
            <span className="text-xs text-gray-600">{pet.experience} / {pet.level * 100}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-yellow-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(pet.experience % 100) / 100 * 100}%` }}
            ></div>
          </div>
        </div>

        {/* 健康值 */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium text-gray-700">健康</span>
            </div>
            <span className={`text-xs font-medium ${getStatusColor(pet.health)}`}>
              {Math.round(pet.health)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`${getStatusBarColor(pet.health)} h-1.5 rounded-full transition-all duration-300`}
              style={{ width: `${pet.health}%` }}
            ></div>
          </div>
        </div>

        {/* 快乐度 */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4 text-pink-500" />
              <span className="text-xs font-medium text-gray-700">心情</span>
            </div>
            <span className={`text-xs font-medium ${getStatusColor(pet.mood)}`}>
              {Math.round(pet.mood)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`${getStatusBarColor(pet.mood)} h-1.5 rounded-full transition-all duration-300`}
              style={{ width: `${pet.mood}%` }}
            ></div>
          </div>
        </div>

        {/* 能量 */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-medium text-gray-700">能量</span>
            </div>
            <span className={`text-xs font-medium ${getStatusColor(pet.energy)}`}>
              {Math.round(pet.energy)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`${getStatusBarColor(pet.energy)} h-1.5 rounded-full transition-all duration-300`}
              style={{ width: `${pet.energy}%` }}
            ></div>
          </div>
        </div>

        {/* 突变值 */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1">
              <Coffee className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-medium text-gray-700">突变值</span>
            </div>
            <span className={`text-xs font-medium ${getStatusColor(pet.mutation)}`}>
              {Math.round(pet.mutation)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`${getStatusBarColor(pet.mutation)} h-1.5 rounded-full transition-all duration-300`}
              style={{ width: `${pet.mutation}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 特殊需求和特征 - 紧凑布局 */}
      <div className="space-y-3">
        {/* 特殊需求 */}
        <div className="bg-blue-50 rounded-lg p-3">
          <h4 className="font-medium text-gray-800 mb-2 flex items-center text-sm">
            <Settings className="w-4 h-4 mr-1" />
            特殊需求
          </h4>
          <div className="flex flex-wrap gap-1">
            {pet.specialNeeds.map((need, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {need}
              </span>
            ))}
          </div>
        </div>

        {/* 性格特征 */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-medium text-gray-800 mb-2 text-sm">🎭 性格特征</h4>
          <div className="flex flex-wrap gap-1">
            {pet.characteristics.map((char, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        {/* 突变标签 */}
        {pet.mutations && pet.mutations.length > 0 && (
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-xs text-purple-600 mb-2 font-medium">🧬 突变特性</p>
            <div className="flex flex-wrap gap-1">
              {pet.mutations.map((mutation, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                >
                  {mutation}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 时间和背景信息 - 可折叠 */}
      <div className="space-y-2">
        <details className="bg-gray-50 rounded-lg">
          <summary className="p-3 cursor-pointer text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-lg">
            📖 详细信息
          </summary>
          <div className="p-3 pt-0 space-y-3">
            {/* 创建时间和最后互动 */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="text-center">
                <p className="text-gray-600 mb-1">创建时间</p>
                <p className="font-medium text-gray-800">
                  {new Date(pet.createdAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 mb-1">最后互动</p>
                <p className="font-medium text-gray-800">
                  {new Date(pet.lastInteraction).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>

            {/* 背景故事 */}
            <div>
              <h4 className="font-medium text-gray-800 mb-2 text-sm">背景故事</h4>
              <p className="text-gray-700 text-xs leading-relaxed">{pet.background}</p>
            </div>

            {/* 世界设定 */}
            <div>
              <h4 className="font-medium text-gray-800 mb-2 text-sm">🌍 世界设定</h4>
              <p className="text-gray-700 text-xs leading-relaxed">{pet.worldSetting}</p>
            </div>
          </div>
        </details>
      </div>
    </div>
  )
} 