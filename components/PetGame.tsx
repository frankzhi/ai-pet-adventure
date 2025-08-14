'use client'

import { useState, useEffect } from 'react'
import { GameState, Pet } from '../types'
import { GameService } from '../lib/game-service'
import PetStatus from './PetStatus'
import TaskList from './TaskList'
import ChatInterface from './ChatInterface'
import EventLog from './EventLog'
import { Heart, List, MessageCircle, RefreshCw, Trash2, Users, BookOpen } from 'lucide-react'

interface PetGameProps {
  gameState: GameState
  onGameStateUpdate: () => void
  onDeleteGame: () => void
}

export default function PetGame({ gameState, onGameStateUpdate, onDeleteGame }: PetGameProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'tasks' | 'chat' | 'events'>('status')
  const [currentStory, setCurrentStory] = useState('')
  const [activePet, setActivePet] = useState<Pet | null>(null)

  useEffect(() => {
    console.log('PetGame: gameState变化，重新获取数据', gameState);
    const newCurrentStory = GameService.getCurrentStory()
    const newActivePet = GameService.getActivePet()
    console.log('PetGame: 获取到的新数据', { newCurrentStory, newActivePet });
    setCurrentStory(newCurrentStory)
    setActivePet(newActivePet)
  }, [gameState])

  const handleTaskComplete = (taskId: string, completionData?: any) => {
    // TaskList组件已经调用了GameService.completeTask，这里只需要更新UI
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

  const tabs = [
    { id: 'status', label: '宠物状态', icon: Heart },
    { id: 'tasks', label: '任务列表', icon: List },
    { id: 'chat', label: '对话互动', icon: MessageCircle },
    { id: 'events', label: '事件日志', icon: BookOpen },
  ]

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
    <div className="max-w-6xl mx-auto">
      {/* 顶部信息栏 */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {activePet.name} 的世界
            </h2>
            <p className="text-gray-600">{gameState.worldGenre}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleResetDailyTasks}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>重置日常任务</span>
            </button>
            <button
              onClick={handleDeleteGame}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>删除游戏</span>
            </button>
          </div>
        </div>

        {/* 宠物选择器 */}
        {gameState.pets.length > 1 && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              选择宠物
            </h3>
            <div className="flex space-x-3">
              {gameState.pets.map((pet) => (
                <button
                  key={pet.id}
                  onClick={() => handleSwitchPet(pet.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    pet.id === gameState.activePetId
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border'
                  }`}
                >
                  <span>{pet.name}</span>
                  {pet.id !== gameState.activePetId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemovePet(pet.id)
                      }}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 当前故事 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-2">📖 当前故事</h3>
          <p className="text-gray-700 whitespace-pre-line">{currentStory}</p>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white rounded-lg shadow-lg mb-6">
        <div className="flex border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 标签页内容 */}
      <div className="bg-white rounded-lg shadow-lg">
        {activeTab === 'status' && (
          <PetStatus pet={activePet} />
        )}
        {activeTab === 'tasks' && (
          <TaskList 
            tasks={gameState.tasks}
            onTaskComplete={handleTaskComplete}
          />
        )}
        {activeTab === 'chat' && (
          <ChatInterface 
            pet={activePet}
            conversations={gameState.conversations}
            onGameStateUpdate={onGameStateUpdate}
          />
        )}
        {activeTab === 'events' && (
          <EventLog />
        )}
      </div>
    </div>
  )
} 