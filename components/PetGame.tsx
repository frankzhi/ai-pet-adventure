'use client'

import React, { useState, useEffect } from 'react'
import { Heart, List, MessageCircle, BookOpen, RefreshCw, Trash2, Users } from 'lucide-react'
import { Pet, GameState } from '../types'
import { GameService } from '../lib/game-service'
import PetStatus from './PetStatus'
import TaskList from './TaskList'
import ChatInterface from './ChatInterface'
import EventLog from './EventLog'

interface PetGameProps {
  gameState: GameState
  onGameStateUpdate: () => void
  onDeleteGame: () => void
}

export default function PetGame({ gameState, onGameStateUpdate, onDeleteGame }: PetGameProps) {
  const [currentStory, setCurrentStory] = useState('')
  const [activePet, setActivePet] = useState<Pet | null>(null)

  // 每次gameState变化时，强制重新获取数据
  useEffect(() => {
    console.log('PetGame: gameState变化，重新获取数据', gameState);
    const newCurrentStory = GameService.getCurrentStory()
    const newActivePet = GameService.getActivePet()
    console.log('PetGame: 获取到的新数据', { newCurrentStory, newActivePet });
    setCurrentStory(newCurrentStory)
    setActivePet(newActivePet)
  }, [gameState])

  const handleTaskComplete = (taskId: string, completionData?: any) => {
    console.log('PetGame: handleTaskComplete被调用', taskId);
    onGameStateUpdate()
    console.log('PetGame: onGameStateUpdate已调用');
  }

  const handleResetDailyTasks = () => {
    GameService.resetDailyTasks()
    onGameStateUpdate()
  }

  const handleDeleteGame = () => {
    if (confirm('确定要删除当前游戏吗？这将清除所有进度。')) {
      onDeleteGame()
    }
  }

  const handleSwitchPet = (petId: string) => {
    GameService.switchActivePet(petId)
    onGameStateUpdate()
  }

  const handleRemovePet = (petId: string) => {
    if (confirm('确定要删除这只宠物吗？')) {
      GameService.removePet(petId)
      onGameStateUpdate()
    }
  }

  if (!activePet) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">没有找到活跃的宠物</p>
      </div>
    )
  }

  // 检查宠物是否死亡
  if (!activePet.isAlive) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">💔</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {activePet.name} 离开了...
          </h2>
          <p className="text-gray-600 mb-6">
            因为健康值过低，{activePet.name}已经离开了这个世界。
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-800 mb-2">最后的回忆</h3>
            <p className="text-gray-700 text-sm">{gameState.currentStory}</p>
          </div>
          <button
            onClick={onDeleteGame}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            重新开始游戏
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* 顶部导航栏 - 紧凑 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className="text-xl font-bold text-gray-800">AI宠物冒险</h1>
              <div className="flex items-center space-x-2">
                {gameState.pets.map((pet) => (
                  <button
                    key={pet.id}
                    onClick={() => handleSwitchPet(pet.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      pet.id === gameState.activePetId
                        ? 'bg-blue-100 text-blue-700 shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {pet.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleResetDailyTasks}
                className="flex items-center space-x-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-medium">重置任务</span>
              </button>
              <button
                onClick={handleDeleteGame}
                className="flex items-center space-x-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-medium">删除游戏</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 - 重新设计布局 */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* 第一行：状态面板和对话互动 - 对话互动更重要 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* 左侧：状态面板 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-full">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Heart className="w-5 h-5 mr-2 text-red-500" />
                宠物状态
              </h2>
              <PetStatus pet={activePet} />
            </div>
          </div>

          {/* 右侧：对话互动 - 占用2列，更重要 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-full">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-green-500" />
                对话互动
              </h2>
              <div className="h-full">
                <ChatInterface
                  pet={activePet}
                  conversations={gameState.conversations}
                  onGameStateUpdate={onGameStateUpdate}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 第二行：任务列表(2列) + 事件日志(1列) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 任务列表 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-full flex flex-col">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <List className="w-5 h-5 mr-2 text-blue-500" />
                任务列表
              </h2>
              <div className="flex-1 min-h-[280px] max-h-[60vh] overflow-y-auto">
                <TaskList
                  tasks={gameState.tasks}
                  onTaskComplete={handleTaskComplete}
                />
              </div>
            </div>
          </div>

          {/* 事件日志 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-full flex flex-col">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-purple-500" />
                事件日志
              </h2>
              <div className="flex-1 min-h-[280px] max-h-[60vh] overflow-y-auto">
                <EventLog />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 