'use client'

import { Pet } from '../types'
import { Heart, Zap, Coffee, Star, Crown } from 'lucide-react'

interface PetStatusProps {
  pet: Pet
}

export default function PetStatus({ pet }: PetStatusProps) {
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

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左侧：宠物基本信息 */}
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl text-white font-bold">
                {pet.name.charAt(0)}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{pet.name}</h3>
            <p className="text-gray-600 mb-1">{pet.type}</p>
            <div className="flex items-center justify-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span className="text-lg font-medium text-gray-700">等级 {pet.level}</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">🎭 性格特征</h4>
            <div className="flex flex-wrap gap-2">
              {pet.characteristics.map((char, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {char}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">📖 背景故事</h4>
            <p className="text-gray-700 text-sm leading-relaxed">{pet.background}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">🌍 世界设定</h4>
            <p className="text-gray-700 text-sm leading-relaxed">{pet.worldSetting}</p>
          </div>
        </div>

        {/* 右侧：状态数值 */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
            <h4 className="font-medium text-gray-800 mb-4 text-center">📊 状态面板</h4>
            
            {/* 经验值 */}
            <div className="mb-6">
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
                  {pet.health}%
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
                  <span className="text-sm font-medium text-gray-700">快乐</span>
                </div>
                <span className={`text-sm font-medium ${getStatusColor(pet.happiness)}`}>
                  {pet.happiness}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${getStatusBarColor(pet.happiness)} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${pet.happiness}%` }}
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
                  {pet.energy}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${getStatusBarColor(pet.energy)} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${pet.energy}%` }}
                ></div>
              </div>
            </div>

            {/* 饥饿度 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Coffee className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">饥饿</span>
                </div>
                <span className={`text-sm font-medium ${getStatusColor(100 - pet.hunger)}`}>
                  {pet.hunger}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${getStatusBarColor(100 - pet.hunger)} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${pet.hunger}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* 创建时间 */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">创建时间</p>
            <p className="text-sm font-medium text-gray-800">
              {new Date(pet.createdAt).toLocaleDateString('zh-CN')}
            </p>
          </div>

          {/* 最后互动 */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">最后互动</p>
            <p className="text-sm font-medium text-gray-800">
              {new Date(pet.lastInteraction).toLocaleString('zh-CN')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 