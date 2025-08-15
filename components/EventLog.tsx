'use client'

import { useState, useEffect } from 'react'
import { RandomEvent, ActivityLog } from '../types'
import { GameService } from '../lib/game-service'
import { Clock, Star, Heart, Zap, Coffee, Activity, Gift, AlertTriangle, Info } from 'lucide-react'

export default function EventLog() {
  const [events, setEvents] = useState<RandomEvent[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [activeTab, setActiveTab] = useState<'events' | 'activities'>('events')

  useEffect(() => {
    const updateLogs = () => {
      setEvents(GameService.getRandomEvents())
      setActivityLogs(GameService.getActivityLogs())
    }

    updateLogs()
    const interval = setInterval(updateLogs, 5000) // 每5秒更新一次

    return () => clearInterval(interval)
  }, [])

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <Gift className="w-5 h-5 text-green-500" />
      case 'negative':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'neutral':
        return <Info className="w-5 h-5 text-blue-500" />
      default:
        return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-green-50 border-green-200'
      case 'negative':
        return 'bg-red-50 border-red-200'
      case 'neutral':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'action':
        return <Activity className="w-4 h-4 text-blue-500" />
      case 'event':
        return <Star className="w-4 h-4 text-yellow-500" />
      case 'status_change':
        return <Heart className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const markEventAsRead = (eventId: string) => {
    GameService.markEventAsRead(eventId)
    setEvents(GameService.getRandomEvents())
  }

  const unreadEvents = events.filter(event => !event.isRead)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">📋 事件日志</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'events'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            随机事件 {unreadEvents.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadEvents.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'activities'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            活动记录
          </button>
        </div>
      </div>

      {activeTab === 'events' && (
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-600 mb-2">暂无事件</h4>
              <p className="text-gray-500">宠物正在平静地生活着...</p>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className={`border rounded-lg p-4 ${getEventColor(event.type)} ${
                  !event.isRead ? 'ring-2 ring-blue-300' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getEventIcon(event.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-800">{event.title}</h4>
                        {!event.isRead && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                            新
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm mb-3">{event.description}</p>
                      
                      {/* 事件效果 */}
                      <div className="flex items-center space-x-4 text-sm">
                        {event.effect.mood && (
                          <div className="flex items-center space-x-1">
                            <Heart className="w-4 h-4 text-pink-500" />
                            <span className="text-gray-600">
                              {event.effect.mood > 0 ? '+' : ''}{event.effect.mood} 心情
                            </span>
                          </div>
                        )}
                        {event.effect.health && (
                          <div className="flex items-center space-x-1">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span className="text-gray-600">
                              {event.effect.health > 0 ? '+' : ''}{event.effect.health} 健康
                            </span>
                          </div>
                        )}
                        {event.effect.energy && (
                          <div className="flex items-center space-x-1">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            <span className="text-gray-600">
                              {event.effect.energy > 0 ? '+' : ''}{event.effect.energy} 能量
                            </span>
                          </div>
                        )}
                        {event.effect.mutation && (
                          <div className="flex items-center space-x-1">
                            <Coffee className="w-4 h-4 text-purple-500" />
                            <span className="text-gray-600">
                              {event.effect.mutation > 0 ? '+' : ''}{event.effect.mutation} 突变值
                            </span>
                          </div>
                        )}
                        {event.effect.experience && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-gray-600">
                              +{event.effect.experience} 经验
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-gray-500 text-xs mt-2">
                        {formatTime(event.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  {!event.isRead && (
                    <button
                      onClick={() => markEventAsRead(event.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      标记已读
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'activities' && (
        <div className="space-y-3">
          {activityLogs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-600 mb-2">暂无活动记录</h4>
              <p className="text-gray-500">宠物还没有开始活动...</p>
            </div>
          ) : (
            activityLogs.slice().reverse().map((log) => (
              <div
                key={log.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-3">
                  {getActivityIcon(log.type)}
                  <div className="flex-1">
                    <p className="text-gray-800">{log.activity}</p>
                    {log.details && (
                      <p className="text-gray-600 text-sm mt-1">{log.details}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-2">
                      {formatTime(log.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
} 