'use client'

import { useState, useRef, useEffect } from 'react'
import { Pet, Conversation } from '../types'
import { GameService } from '../lib/game-service'
import { Send, Loader2, MessageCircle, Bell } from 'lucide-react'

interface ChatInterfaceProps {
  pet: Pet
  conversations: Conversation[]
  onGameStateUpdate: () => void
}

export default function ChatInterface({ pet, conversations, onGameStateUpdate }: ChatInterfaceProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showPetInitiated, setShowPetInitiated] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversations])

  // 检查宠物主动互动
  useEffect(() => {
    const checkPetInteraction = async () => {
      try {
        const interaction = await GameService.checkPetInitiatedInteraction()
        if (interaction) {
          setShowPetInitiated(true)
          onGameStateUpdate()
          
          // 3秒后自动隐藏提示
          setTimeout(() => {
            setShowPetInitiated(false)
          }, 3000)
        }
      } catch (error) {
        console.error('检查宠物主动互动失败:', error)
      }
    }

    // 每30秒检查一次宠物主动互动
    const interval = setInterval(checkPetInteraction, 30000)
    
    return () => clearInterval(interval)
  }, [onGameStateUpdate])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || isSending) return

    setIsSending(true)
    
    try {
      await GameService.sendMessage(message.trim())
      setMessage('')
      onGameStateUpdate()
    } catch (error) {
      console.error('发送消息失败:', error)
      alert('发送消息失败，请重试')
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMessageBubbleStyle = (role: string, isPetInitiated?: boolean) => {
    if (role === 'user') {
      return 'bg-blue-600 text-white ml-auto'
    }
    if (isPetInitiated) {
      return 'bg-purple-100 text-purple-800 border-2 border-purple-300'
    }
    return 'bg-gray-100 text-gray-800'
  }

  const getMessageAlignment = (role: string) => {
    return role === 'user' ? 'justify-end' : 'justify-start'
  }

  // 根据宠物状态生成互动建议
  const getSuggestions = () => {
    const suggestions: string[] = []
    
    // 根据宠物状态给出建议
    if (pet.hunger < 30) {
      if (pet.petType === 'robot') {
        suggestions.push('去充电吧', '补充一些电量')
      } else if (pet.petType === 'plant') {
        suggestions.push('给你浇水', '需要一些阳光')
      } else {
        suggestions.push('去吃点东西', '我们去吃饭吧')
      }
    }
    
    if (pet.happiness < 40) {
      suggestions.push('一起玩游戏', '陪你聊聊天', '给你一个拥抱')
    }
    
    if (pet.energy < 30) {
      suggestions.push('好好休息一下', '躺下睡一觉', '放松一会儿')
    }
    
    if (pet.health < 50) {
      suggestions.push('让我照顾你', '检查一下身体', '需要护理吗')
    }
    
    // 通用互动建议
    if (suggestions.length < 3) {
      const generalSuggestions = ['一起玩耍', '聊聊天', '做些运动', '互相陪伴']
      suggestions.push(...generalSuggestions.slice(0, 3 - suggestions.length))
    }
    
    return suggestions.slice(0, 4) // 最多显示4个建议
  }

  return (
    <div className="flex flex-col h-96">
      {/* 聊天头部 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {pet.name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-gray-800">{pet.name}</h3>
              <p className="text-sm text-gray-500">{pet.type}</p>
            </div>
          </div>
          
          {/* 宠物主动互动提示 */}
          {showPetInitiated && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm animate-pulse">
              <Bell className="w-4 h-4" />
              <span>{pet.name}主动发起了对话！</span>
            </div>
          )}
        </div>
      </div>

      {/* 聊天消息区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-600 mb-2">开始对话</h4>
            <p className="text-gray-500">与你的宠物{pet.name}开始聊天吧！</p>
            <p className="text-sm text-gray-400 mt-2">宠物也会主动与你互动哦～</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`flex ${getMessageAlignment(conversation.role)}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${getMessageBubbleStyle(conversation.role, conversation.isPetInitiated)}`}>
                {conversation.isPetInitiated && (
                  <div className="flex items-center space-x-1 mb-1">
                    <Bell className="w-3 h-3 text-purple-600" />
                    <span className="text-xs text-purple-600 font-medium">主动互动</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{conversation.content}</p>
                <p className={`text-xs mt-1 ${
                  conversation.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTime(conversation.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 互动建议区域 */}
      {getSuggestions().length > 0 && (
        <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">💡 互动建议（点击快速输入）：</p>
          <div className="flex flex-wrap gap-2">
            {getSuggestions().map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setMessage(suggestion)}
                className="px-2 py-1 text-xs bg-white text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`与${pet.name}聊天... (试试"去吃东西"、"一起玩"、"好好休息")`}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!message.trim() || isSending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>发送中...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>发送</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
} 