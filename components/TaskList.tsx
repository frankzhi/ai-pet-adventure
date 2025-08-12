'use client'

import { useState, useEffect } from 'react'
import { Task } from '../types'
import { GameService } from '../lib/game-service'
import { CheckCircle, Circle, Star, Clock, Gift, MessageCircle, Timer, Activity, AlertCircle, RefreshCw } from 'lucide-react'

interface TaskListProps {
  tasks: Task[]
  onTaskComplete: (taskId: string, completionData?: any) => void
}

export default function TaskList({ tasks, onTaskComplete }: TaskListProps) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [conversationInput, setConversationInput] = useState('')
  const [timerStates, setTimerStates] = useState<{[key: string]: { elapsed: number; remaining: number; isComplete: boolean }}>({})
  const [taskAttempts, setTaskAttempts] = useState<{[key: string]: number}>({})
  const [taskHints, setTaskHints] = useState<{[key: string]: string}>({})
  const [showFailureMessage, setShowFailureMessage] = useState<{[key: string]: boolean}>({})

  // 更新计时器状态
  useEffect(() => {
    const updateTimers = () => {
      // 检查所有计时器状态
      GameService.checkAllTimers();
      
      const newTimerStates: {[key: string]: { elapsed: number; remaining: number; isComplete: boolean }} = {};
      
      tasks.forEach(task => {
        if (task.completionMethod === 'timer') {
          const progress = GameService.getTimerProgress(task.id);
          if (progress) {
            newTimerStates[task.id] = progress;
            
            // 如果计时器完成，自动完成任务
            if (progress.isComplete && !task.isCompleted) {
              handleTaskComplete(task.id, { duration: task.timerTask?.duration || 0 });
            }
          }
        }
      });
      
      setTimerStates(newTimerStates);
    };

    // 立即更新一次
    updateTimers();

    // 每秒更新一次计时器状态
    const interval = setInterval(updateTimers, 1000);
    
    return () => clearInterval(interval);
  }, [tasks]);

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'daily':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'story':
        return <Star className="w-4 h-4 text-purple-500" />
      case 'special':
        return <Gift className="w-4 h-4 text-orange-500" />
      case 'physical':
        return <Activity className="w-4 h-4 text-green-500" />
      case 'conversation':
        return <MessageCircle className="w-4 h-4 text-indigo-500" />
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
      case 'physical':
        return '运动任务'
      case 'conversation':
        return '对话任务'
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
      case 'physical':
        return 'bg-green-100 text-green-800'
      case 'conversation':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleTaskComplete = (taskId: string, completionData?: any) => {
    try {
      const result = GameService.completeTask(taskId, completionData);
      
      if (result.success) {
        onTaskComplete(taskId, completionData);
        setActiveTaskId(null);
        setConversationInput('');
        // 清除失败状态
        setTaskAttempts(prev => ({ ...prev, [taskId]: 0 }));
        setTaskHints(prev => ({ ...prev, [taskId]: '' }));
        setShowFailureMessage(prev => ({ ...prev, [taskId]: false }));
      } else {
        // 任务失败，显示错误信息
        const attempts = (taskAttempts[taskId] || 0) + 1;
        setTaskAttempts(prev => ({ ...prev, [taskId]: attempts }));
        setTaskHints(prev => ({ ...prev, [taskId]: result.hint || '' }));
        setShowFailureMessage(prev => ({ ...prev, [taskId]: true }));
        
        // 3秒后自动隐藏失败消息
        setTimeout(() => {
          setShowFailureMessage(prev => ({ ...prev, [taskId]: false }));
        }, 3000);
        
        // 如果失败5次，显示正确答案
        if (attempts >= 5) {
          const task = tasks.find(t => t.id === taskId);
          const requiredKeywords = task?.conversationTask?.requiredKeywords;
          if (requiredKeywords && requiredKeywords.length > 0) {
            setTaskHints(prev => ({ 
              ...prev, 
              [taskId]: `正确答案示例: "${requiredKeywords.join(' ')}"` 
            }));
          }
        }
      }
    } catch (error) {
      console.error('完成任务失败:', error);
    }
  }

  const startPhysicalTask = (task: Task) => {
    setActiveTaskId(task.id);
    // 这里可以添加实际的运动检测逻辑
    // 目前只是模拟完成
    setTimeout(() => {
      handleTaskComplete(task.id, { completed: true });
    }, 2000);
  }

  const startTimerTask = (task: Task) => {
    if (!task.timerTask) return;
    
    setActiveTaskId(task.id);
    // 使用全局计时器管理
    GameService.startTimer(task.id, task.timerTask.duration);
  }

  const handleConversationSubmit = (task: Task) => {
    if (!conversationInput.trim()) return;
    
    handleTaskComplete(task.id, { message: conversationInput });
  }

  const renderTaskCompletion = (task: Task) => {
    // 检查是否有活跃的计时器
    const timerState = timerStates[task.id];
    const hasActiveTimer = timerState && !timerState.isComplete;
    const attempts = taskAttempts[task.id] || 0;
    const hint = taskHints[task.id] || '';
    const showFailure = showFailureMessage[task.id] || false;

    if (activeTaskId !== task.id && !hasActiveTimer) {
      return (
        <button
          onClick={() => {
            switch (task.completionMethod) {
              case 'physical':
                startPhysicalTask(task);
                break;
              case 'timer':
                startTimerTask(task);
                break;
              case 'conversation':
                setActiveTaskId(task.id);
                break;
              default:
                handleTaskComplete(task.id);
            }
          }}
          className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <CheckCircle className="w-4 h-4" />
          <span>开始</span>
        </button>
      );
    }

    switch (task.completionMethod) {
      case 'physical':
        return (
          <div className="ml-4 px-4 py-2 bg-yellow-600 text-white rounded-lg flex items-center space-x-2">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>进行中...</span>
          </div>
        );
      
      case 'timer':
        if (timerState) {
          const minutes = Math.floor(timerState.remaining / 60000);
          const seconds = Math.floor((timerState.remaining % 60000) / 1000);
          return (
            <div className="ml-4 px-4 py-2 bg-yellow-600 text-white rounded-lg flex items-center space-x-2">
              <Timer className="w-4 h-4" />
              <span>{minutes}:{seconds.toString().padStart(2, '0')}</span>
            </div>
          );
        }
        return null;
      
      case 'conversation':
        return (
          <div className="ml-4 flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={conversationInput}
                onChange={(e) => setConversationInput(e.target.value)}
                placeholder="输入对话内容..."
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleConversationSubmit(task)}
              />
              <button
                onClick={() => handleConversationSubmit(task)}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                发送
              </button>
            </div>
            
            {/* 失败提示 */}
            {showFailure && (
              <div className="bg-red-50 border border-red-200 rounded-md p-2">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">尝试次数: {attempts}</span>
                </div>
                {hint && (
                  <p className="text-sm text-red-600 mt-1">{hint}</p>
                )}
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  const completedTasks = tasks.filter(task => task.isCompleted);
  const activeTasks = tasks.filter(task => !task.isCompleted);

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
                      {task.category && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          {task.category}
                        </span>
                      )}
                    </div>
                    <h5 className="font-medium text-gray-800 mb-2">{task.title}</h5>
                    <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                    
                    {/* 任务详情 */}
                    {task.physicalTask && (
                      <div className="mb-3 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-700">
                          <strong>运动任务:</strong> {task.physicalTask.action}
                          {task.physicalTask.count && ` (${task.physicalTask.count}次)`}
                          {task.physicalTask.duration && ` (${task.physicalTask.duration}秒)`}
                        </p>
                      </div>
                    )}
                    
                    {task.conversationTask && (
                      <div className="mb-3 p-3 bg-indigo-50 rounded-lg">
                        <p className="text-sm text-indigo-700">
                          <strong>对话要求:</strong> 需要包含关键词: {task.conversationTask.requiredKeywords.join(', ')}
                        </p>
                      </div>
                    )}
                    
                    {task.timerTask && (
                      <div className="mb-3 p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-700">
                          <strong>定时任务:</strong> {task.timerTask.description} ({task.timerTask.duration}秒)
                        </p>
                      </div>
                    )}
                    
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
                      {task.reward.energy !== undefined && (
                        <div className="flex items-center space-x-1">
                          <span className="text-blue-500">⚡</span>
                          <span className="text-gray-600">+{task.reward.energy} 能量</span>
                        </div>
                      )}
                      {task.reward.hunger !== undefined && (
                        <div className="flex items-center space-x-1">
                          <span className="text-orange-500">🍽️</span>
                          <span className="text-gray-600">{task.reward.hunger > 0 ? '+' : ''}{task.reward.hunger} 饱食度</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {renderTaskCompletion(task)}
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
  );
} 