'use client'

import { useState, useEffect } from 'react'
import { GameState, Task, Conversation } from '../types'
import { GameService } from '../lib/game-service'
import { Heart, Zap, Coffee, Star, MessageCircle, List, Trash2, RefreshCw } from 'lucide-react'
import PetStatus from './PetStatus'
import TaskList from './TaskList'
import ChatInterface from './ChatInterface'

interface PetGameProps {
  gameState: GameState
  onGameStateUpdate: () => void
  onDeleteGame: () => void
}

export default function PetGame({ gameState, onGameStateUpdate, onDeleteGame }: PetGameProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'tasks' | 'chat'>('status')
  const [currentStory, setCurrentStory] = useState(gameState.currentStory)

  useEffect(() => {
    // 定期更新宠物状态
    const interval = setInterval(() => {
      GameService.updatePetStatus()
      onGameStateUpdate()
    }, 60000) // 每分钟更新一次

    return () => clearInterval(interval)
  }, [onGameStateUpdate])

  const handleTaskComplete = (taskId: string) => {
    GameService.completeTask(taskId)
    onGameStateUpdate()
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

  const tabs = [
    { id: 'status', label: '宠物状态', icon: Heart },
    { id: 'tasks', label: '任务列表', icon: List },
    { id: 'chat', label: '对话互动', icon: MessageCircle },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* 顶部信息栏 */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {gameState.pet.name} 的世界
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
          <PetStatus pet={gameState.pet} />
        )}
        {activeTab === 'tasks' && (
          <TaskList 
            tasks={gameState.tasks}
            onTaskComplete={handleTaskComplete}
          />
        )}
        {activeTab === 'chat' && (
          <ChatInterface 
            pet={gameState.pet}
            conversations={gameState.conversations}
            onGameStateUpdate={onGameStateUpdate}
          />
        )}
      </div>
    </div>
  )
} 