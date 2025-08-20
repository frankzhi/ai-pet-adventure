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
    <div className="space-y-6">
      {/* 宠物基本信息 - 优化布局 */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-3xl text-white font-bold">
              {pet.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-800 mb-1">{pet.name}</h3>
            <div className="flex items-center space-x-3 text-sm text-gray-600 mb-2">
              {getPetTypeIcon(pet.petType)}
              <span>{getPetTypeLabel(pet.petType)}</span>
              <span>•</span>
              <Crown className="w-4 h-4 text-yellow-500" />
              <span>等级 {pet.level}</span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPersonalityTypeColor(pet.personalityType)}`}>
                {getPersonalityTypeLabel(pet.personalityType)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 状态数值 - 优化布局 */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h4 className="font-semibold text-gray-800 mb-4 text-center text-lg">📊 状态面板</h4>
        
        {/* 经验值 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">经验值</span>
            </div>
            <span className="text-sm text-gray-600">{pet.experience} / {pet.level * 100}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(pet.experience % 100) / 100 * 100}%` }}
            ></div>
          </div>
        </div>

        {/* 健康值 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-gray-700">健康</span>
            </div>
            <span className={`text-sm font-medium ${getStatusColor(pet.health)}`}>
              {Math.round(pet.health)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${getStatusBarColor(pet.health)} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${pet.health}%` }}
            ></div>
          </div>
        </div>

        {/* 快乐度 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-pink-500" />
              <span className="text-sm font-medium text-gray-700">心情</span>
            </div>
            <span className={`text-sm font-medium ${getStatusColor(pet.mood)}`}>
              {Math.round(pet.mood)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${getStatusBarColor(pet.mood)} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${pet.mood}%` }}
            ></div>
          </div>
        </div>

        {/* 能量 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">能量</span>
            </div>
            <span className={`text-sm font-medium ${getStatusColor(pet.energy)}`}>
              {Math.round(pet.energy)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${getStatusBarColor(pet.energy)} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${pet.energy}%` }}
            ></div>
          </div>
        </div>

        {/* 突变值 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Coffee className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">突变值</span>
            </div>
            <span className={`text-sm font-medium ${getStatusColor(pet.mutation)}`}>
              {Math.round(pet.mutation)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${getStatusBarColor(pet.mutation)} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${pet.mutation}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 特殊需求和特征 - 优化布局 */}
      <div className="space-y-4">
        {/* 特殊需求 */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center text-sm">
            <Settings className="w-4 h-4 mr-2 text-blue-500" />
            特殊需求
          </h4>
          <div className="flex flex-wrap gap-2">
            {pet.specialNeeds.map((need, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
              >
                {need}
              </span>
            ))}
          </div>
        </div>

        {/* 性格特征 */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <h4 className="font-semibold text-gray-800 mb-3 text-sm">🎭 性格特征</h4>
          <div className="flex flex-wrap gap-2">
            {pet.characteristics.map((char, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium"
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        {/* 突变标签 */}
        {pet.mutations && pet.mutations.length > 0 && (
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <p className="text-sm text-purple-600 mb-3 font-semibold">🧬 突变特性</p>
            <div className="flex flex-wrap gap-2">
              {pet.mutations.map((mutation, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium"
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
        <details className="bg-gray-50 rounded-xl border border-gray-100">
          <summary className="p-4 cursor-pointer text-sm font-semibold text-gray-800 hover:bg-gray-100 rounded-xl transition-colors">
            📖 详细信息
          </summary>
          <div className="p-4 pt-0 space-y-4">
            {/* 创建时间和最后互动 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-gray-600 mb-1">创建时间</p>
                <p className="font-medium text-gray-800">
                  {new Date(pet.createdAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
              <div className="text-center bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-gray-600 mb-1">最后互动</p>
                <p className="font-medium text-gray-800">
                  {new Date(pet.lastInteraction).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>

            {/* 背景故事 */}
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">背景故事</h4>
              <p className="text-gray-700 text-sm leading-relaxed">{pet.background}</p>
            </div>

            {/* 世界设定 */}
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">🌍 世界设定</h4>
              <p className="text-gray-700 text-sm leading-relaxed">{pet.worldSetting}</p>
            </div>
          </div>
        </details>
      </div>
    </div>
  )
} 