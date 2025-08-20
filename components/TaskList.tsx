'use client'

import { useState, useEffect } from 'react'
import { Task } from '../types'
import { GameService } from '../lib/game-service'
import { CheckCircle, Circle, Star, Clock, Gift, MessageCircle, Timer, Activity, AlertCircle, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'

interface TaskListProps {
  tasks: Task[]
  onTaskComplete: (taskId: string, completionData?: any) => void
}

export default function TaskList({ tasks, onTaskComplete }: TaskListProps) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [conversationInput, setConversationInput] = useState('')
  const [timerStates, setTimerStates] = useState<{[key: string]: { elapsed: number; remaining: number; isComplete: boolean; canComplete: boolean }}>({})
  const [taskAttempts, setTaskAttempts] = useState<{[key: string]: number}>({})
  const [taskHints, setTaskHints] = useState<{[key: string]: string}>({})
  const [showFailureMessage, setShowFailureMessage] = useState<{[key: string]: boolean}>({})
  const [expandedTasks, setExpandedTasks] = useState<{[key: string]: boolean}>({})

  // 更新计时器状态
  useEffect(() => {
    const updateTimers = () => {
      // 检查所有计时器状态
      GameService.checkAllTimers();
      
      const newTimerStates: {[key: string]: { elapsed: number; remaining: number; isComplete: boolean; canComplete: boolean }} = {};
      
      tasks.forEach(task => {
        if (task.completionMethod === 'timer') {
          const progress = GameService.getTimerProgress(task.id);
          if (progress) {
            newTimerStates[task.id] = progress;
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

  const handleTaskStart = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    switch (task.completionMethod) {
      case 'physical':
        startPhysicalTask(task);
        break;
      case 'timer':
        startTimerTask(task);
        break;
      case 'conversation':
        setActiveTaskId(taskId);
        break;
      default:
        handleTaskComplete(taskId);
    }
  };

  const startPhysicalTask = (task: Task) => {
    if (!task.physicalTask) return;
    
    setActiveTaskId(task.id);
    
    // 模拟物理任务完成
    setTimeout(() => {
      handleTaskComplete(task.id, { 
        action: task.physicalTask?.action,
        count: task.physicalTask?.count 
      });
    }, 2000);
  };

  const startTimerTask = (task: Task) => {
    if (!task.timerTask) return;
    
    setActiveTaskId(task.id);
    GameService.startTimer(task.id, task.timerTask.duration);
  };

  const handleConversationSubmit = (task: Task) => {
    if (!task.conversationTask || !conversationInput.trim()) return;

    const attempts = (taskAttempts[task.id] || 0) + 1;
    setTaskAttempts(prev => ({ ...prev, [task.id]: attempts }));

    const hasRequiredKeywords = task.conversationTask.requiredKeywords.some(keyword => 
      conversationInput.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasRequiredKeywords) {
      handleTaskComplete(task.id, { conversation: conversationInput });
      setConversationInput('');
      setActiveTaskId(null);
    } else {
      setShowFailureMessage(prev => ({ ...prev, [task.id]: true }));
      setTaskHints(prev => ({ 
        ...prev, 
        [task.id]: `请包含关键词: ${task.conversationTask?.requiredKeywords.join(', ') || ''}` 
      }));
      
      // 3秒后隐藏失败消息
      setTimeout(() => {
        setShowFailureMessage(prev => ({ ...prev, [task.id]: false }));
      }, 3000);
    }
  };

  const handleTaskComplete = (taskId: string, completionData?: any) => {
    GameService.completeTask(taskId, completionData);
    onTaskComplete(taskId, completionData);
    setActiveTaskId(null);
    setConversationInput('');
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const renderTaskCompletion = (task: Task) => {
    const timerState = timerStates[task.id];
    const hasActiveTimer = timerState && !timerState.isComplete;
    const hasCompletedTimer = timerState && timerState.isComplete;
    const attempts = taskAttempts[task.id] || 0;
    const hint = taskHints[task.id] || '';
    const showFailure = showFailureMessage[task.id] || false;

    // 如果计时器已完成，显示确认完成按钮
    if (task.completionMethod === 'timer' && hasCompletedTimer) {
      return (
        <div className="ml-4 flex flex-col space-y-2">
          <div className="px-3 py-1.5 bg-green-600 text-white rounded-lg flex items-center space-x-2 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>计时完成！</span>
          </div>
          <button
            onClick={() => handleTaskComplete(task.id, { duration: task.timerTask?.duration || 0 })}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
          >
            <CheckCircle className="w-4 h-4" />
            <span>确认完成</span>
          </button>
        </div>
      );
    }

    if (activeTaskId !== task.id && !hasActiveTimer && !task.isStarted) {
      return (
        <button
          onClick={() => {
            // 先开始任务
            handleTaskStart(task.id);
          }}
          className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <CheckCircle className="w-4 h-4" />
          <span>开始</span>
        </button>
      );
    }

    // 如果任务已开始但不在进行中，显示继续按钮
    if (task.isStarted && activeTaskId !== task.id && !hasActiveTimer) {
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
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <CheckCircle className="w-4 h-4" />
          <span>继续</span>
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
          // 计时器进行中
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
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleConversationSubmit(task)}
              />
              <button
                onClick={() => handleConversationSubmit(task)}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
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
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800 mb-1">📋 任务列表</h3>
        <p className="text-gray-600 text-sm">
          完成 {completedTasks.length} / {tasks.length} 个任务
        </p>
      </div>

      {/* 进行中的任务 */}
      {activeTasks.length > 0 && (
        <div className="space-y-3">
          {activeTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* 任务头部信息 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
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
                    <button
                      onClick={() => toggleTaskExpansion(task.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {expandedTasks[task.id] ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  
                  {/* 任务标题和描述 */}
                  <h5 className="font-medium text-gray-800 mb-1">{task.title}</h5>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{task.description}</p>
                  
                  {/* 奖励信息 - 紧凑显示 */}
                  <div className="flex items-center space-x-3 text-xs text-gray-600 mb-2">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span>{task.reward.experience > 0 ? '+' : ''}{task.reward.experience}</span>
                    </div>
                    {task.reward.mood !== undefined && (
                      <div className="flex items-center space-x-1">
                        <span className="text-pink-500">❤️</span>
                        <span>{task.reward.mood > 0 ? '+' : ''}{task.reward.mood}</span>
                      </div>
                    )}
                    {task.reward.health !== undefined && (
                      <div className="flex items-center space-x-1">
                        <span className="text-red-500">💖</span>
                        <span>{task.reward.health > 0 ? '+' : ''}{task.reward.health}</span>
                      </div>
                    )}
                    {task.reward.energy !== undefined && (
                      <div className="flex items-center space-x-1">
                        <span className="text-blue-500">⚡</span>
                        <span>{task.reward.energy > 0 ? '+' : ''}{task.reward.energy}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* 展开的详细信息 */}
                  {expandedTasks[task.id] && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      {/* 任务过期状态 */}
                      {task.isExpired && (
                        <div className="p-2 bg-red-50 rounded text-xs text-red-700">
                          <strong>⚠️ 任务已过期</strong>
                        </div>
                      )}
                      
                      {/* 任务详情 */}
                      {task.physicalTask && (
                        <div className="p-2 bg-green-50 rounded text-xs text-green-700">
                          <strong>运动任务:</strong> {task.physicalTask.action}
                          {task.physicalTask.count && ` (${task.physicalTask.count}次)`}
                          {task.physicalTask.duration && ` (${task.physicalTask.duration}秒)`}
                        </div>
                      )}
                      
                      {task.conversationTask && (
                        <div className="p-2 bg-indigo-50 rounded text-xs text-indigo-700">
                          <strong>对话要求:</strong> {task.conversationTask.requiredKeywords.join(', ')}
                        </div>
                      )}
                      
                      {task.timerTask && (
                        <div className="p-2 bg-yellow-50 rounded text-xs text-yellow-700">
                          <strong>定时任务:</strong> {task.timerTask.description} ({task.timerTask.duration}秒)
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {renderTaskCompletion(task)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 已完成的任务 - 可折叠 */}
      {completedTasks.length > 0 && (
        <details className="bg-gray-50 rounded-lg border border-gray-200">
          <summary className="p-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            ✅ 已完成的任务 ({completedTasks.length})
          </summary>
          <div className="p-3 pt-0 space-y-2">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white border border-gray-200 rounded p-3 opacity-75 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <h5 className="font-medium text-gray-700 line-through text-sm">{task.title}</h5>
                      <p className="text-gray-500 text-xs">
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
        </details>
      )}
    </div>
  )
} 