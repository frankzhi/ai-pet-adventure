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
    <div className="max-w-7xl mx-auto p-4">
      {/* 顶部导航栏 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-800">AI宠物冒险</h1>
            <div className="flex items-center space-x-2">
              {gameState.pets.map((pet) => (
                <button
                  key={pet.id}
                  onClick={() => handleSwitchPet(pet.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    pet.id === gameState.activePetId
                      ? 'bg-blue-100 text-blue-700'
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
              className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm">重置任务</span>
            </button>
            <button
              onClick={handleDeleteGame}
              className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">删除游戏</span>
            </button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 - 三栏布局 */}
      <div className="grid grid-cols-12 gap-4">
        {/* 左侧：压缩的状态面板 */}
        <div className="col-span-3">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <Heart className="w-5 h-5 mr-2" />
              状态
            </h2>
            <PetStatus pet={activePet} />
          </div>
        </div>

        {/* 中间：任务列表 */}
        <div className="col-span-4">
          <div className="bg-white rounded-lg shadow-sm p-4 h-[600px] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <List className="w-5 h-5 mr-2" />
              任务列表
            </h2>
            <TaskList
              tasks={gameState.tasks}
              onTaskComplete={handleTaskComplete}
            />
          </div>
        </div>

        {/* 右侧：对话互动 */}
        <div className="col-span-5">
          <div className="bg-white rounded-lg shadow-sm p-4 h-[600px] flex flex-col">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              对话互动
            </h2>
            <div className="flex-1 overflow-hidden">
              <ChatInterface
                pet={activePet}
                conversations={gameState.conversations}
                onGameStateUpdate={onGameStateUpdate}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 底部：事件日志 */}
      <div className="mt-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            事件日志
          </h2>
          <div className="h-48 overflow-y-auto">
            <EventLog />
          </div>
        </div>
      </div>

      {/* 故事背景 */}
      {currentStory && (
        <div className="mt-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">故事背景</h3>
            <p className="text-gray-700 text-sm leading-relaxed">{currentStory}</p>
          </div>
        </div>
      )}
    </div>
  )
} 