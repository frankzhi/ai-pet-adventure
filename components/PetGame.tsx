'use client'

import { useState, useEffect } from 'react'
import { GameState, Pet } from '../types'
import { GameService } from '../lib/game-service'
import PetStatus from './PetStatus'
import TaskList from './TaskList'
import ChatInterface from './ChatInterface'
import { Heart, List, MessageCircle, RefreshCw, Trash2, Users } from 'lucide-react'

interface PetGameProps {
  gameState: GameState
  onGameStateUpdate: () => void
  onDeleteGame: () => void
}

export default function PetGame({ gameState, onGameStateUpdate, onDeleteGame }: PetGameProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'tasks' | 'chat'>('status')
  const [currentStory, setCurrentStory] = useState('')
  const [activePet, setActivePet] = useState<Pet | null>(null)

  useEffect(() => {
    setCurrentStory(GameService.getCurrentStory())
    setActivePet(GameService.getActivePet())
  }, [gameState])

  const handleTaskComplete = (taskId: string) => {
    try {
      GameService.completeTask(taskId)
      onGameStateUpdate()
    } catch (error) {
      console.error('完成任务失败:', error)
      alert('任务完成条件未满足，请重试')
    }
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
  ]

  if (!activePet) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">没有找到活跃的宠物</p>
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
      </div>
    </div>
  )
} 