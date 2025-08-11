'use client'

import { Task } from '../types'
import { CheckCircle, Circle, Star, Clock, Gift } from 'lucide-react'

interface TaskListProps {
  tasks: Task[]
  onTaskComplete: (taskId: string) => void
}

export default function TaskList({ tasks, onTaskComplete }: TaskListProps) {
  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'daily':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'story':
        return <Star className="w-4 h-4 text-purple-500" />
      case 'special':
        return <Gift className="w-4 h-4 text-orange-500" />
      default:
        return <Circle className="w-4 h-4 text-gray-500" />
    }
  }

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'daily':
        return '日常任务'
      case 'story':
        return '剧情任务'
      case 'special':
        return '特殊任务'
      default:
        return '未知任务'
    }
  }

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'daily':
        return 'bg-blue-100 text-blue-800'
      case 'story':
        return 'bg-purple-100 text-purple-800'
      case 'special':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const completedTasks = tasks.filter(task => task.isCompleted)
  const activeTasks = tasks.filter(task => !task.isCompleted)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">📋 任务列表</h3>
        <p className="text-gray-600">
          完成 {completedTasks.length} / {tasks.length} 个任务
        </p>
      </div>

      {/* 进行中的任务 */}
      {activeTasks.length > 0 && (
        <div className="mb-8">
          <h4 className="text-lg font-medium text-gray-800 mb-4">🔄 进行中的任务</h4>
          <div className="space-y-4">
            {activeTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getTaskTypeIcon(task.type)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskTypeColor(task.type)}`}>
                        {getTaskTypeLabel(task.type)}
                      </span>
                    </div>
                    <h5 className="font-medium text-gray-800 mb-2">{task.title}</h5>
                    <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                    
                    {/* 奖励信息 */}
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-gray-600">+{task.reward.experience} 经验</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-pink-500">❤️</span>
                        <span className="text-gray-600">+{task.reward.happiness} 快乐</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-red-500">💖</span>
                        <span className="text-gray-600">+{task.reward.health} 健康</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onTaskComplete(task.id)}
                    className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>完成</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 已完成的任务 */}
      {completedTasks.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-4">✅ 已完成的任务</h4>
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 opacity-75"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <h5 className="font-medium text-gray-700 line-through">{task.title}</h5>
                      <p className="text-gray-500 text-sm">
                        完成时间: {task.completedAt ? new Date(task.completedAt).toLocaleString('zh-CN') : '未知'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskTypeColor(task.type)}`}>
                    {getTaskTypeLabel(task.type)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 没有任务时的提示 */}
      {tasks.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-600 mb-2">暂无任务</h4>
          <p className="text-gray-500">与你的宠物互动，新的任务将会出现！</p>
        </div>
      )}
    </div>
  )
} 