'use client'

import { useState, useEffect } from 'react'
import { GameService } from '../lib/game-service'
import { GameState } from '../types'
import PetCreation from '../components/PetCreation'
import PetGame from '../components/PetGame'
import LoadingSpinner from '../components/LoadingSpinner'
import { Bell, X } from 'lucide-react'

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [petInteraction, setPetInteraction] = useState<string | null>(null)
  const [showInteraction, setShowInteraction] = useState(false)

  useEffect(() => {
    // 加载游戏状态
    const savedState = GameService.loadGameState()
    if (savedState) {
      // 更新宠物状态
      GameService.updatePetStatus()
      const updatedState = GameService.loadGameState()
      
      // 检查是否有活着的宠物
      if (updatedState && !GameService.hasAlivePet()) {
        // 所有宠物都死了，显示游戏结束界面
        setGameState(null)
        alert('💔 所有宠物都离开了... 请重新开始游戏。')
      } else {
        setGameState(updatedState)
      }
    }
    setLoading(false)
  }, [])

  // 定期更新宠物状态
  useEffect(() => {
    if (!gameState) return;

    const updateStatus = async () => {
      try {
        await GameService.updatePetStatus();
        const updatedState = GameService.loadGameState();
        
        // 检查是否有活着的宠物
        if (updatedState && !GameService.hasAlivePet()) {
          // 所有宠物都死了，显示游戏结束界面
          setGameState(null)
          alert('💔 所有宠物都离开了... 请重新开始游戏。')
        } else {
          setGameState(updatedState);
        }
      } catch (error) {
        console.error('更新宠物状态失败:', error);
      }
    };

    // 每1分钟更新一次宠物状态
    const statusInterval = setInterval(updateStatus, 1 * 60 * 1000);
    
    return () => clearInterval(statusInterval);
  }, [gameState]);

  // 全局主动互动检查
  useEffect(() => {
    if (!gameState) return;

    const checkPetInteraction = async () => {
      try {
        const interaction = await GameService.checkPetInitiatedInteraction();
        if (interaction) {
          setPetInteraction(interaction);
          setShowInteraction(true);
          
          // 更新游戏状态
          setGameState(GameService.loadGameState());
          
          // 5秒后自动隐藏通知
          setTimeout(() => {
            setShowInteraction(false);
            setPetInteraction(null);
          }, 5000);
        }
      } catch (error) {
        console.error('检查宠物主动互动失败:', error);
      }
    };

    // 每30秒检查一次宠物主动互动
    const interval = setInterval(checkPetInteraction, 30000);
    
    return () => clearInterval(interval);
  }, [gameState]);

  const handleNewPetCreated = (newGameState: GameState) => {
    setGameState(newGameState)
  }

  const handleGameStateUpdate = () => {
    console.log('Page: handleGameStateUpdate被调用');
    const newState = GameService.loadGameState();
    console.log('Page: 加载的新状态', newState);
    // 强制触发React重新渲染
    if (newState) {
      setGameState({ ...newState })
    }
  }

  const handleDeleteGame = () => {
    GameService.deleteGameState()
    setGameState(null)
  }

  const handleDismissInteraction = () => {
    setShowInteraction(false);
    setPetInteraction(null);
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 宠物主动互动通知 */}
      {showInteraction && petInteraction && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-purple-100 border border-purple-300 rounded-lg shadow-lg p-4 animate-pulse">
          <div className="flex items-start space-x-3">
            <Bell className="w-5 h-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-purple-800 mb-1">宠物主动互动</h4>
              <p className="text-sm text-purple-700">{petInteraction}</p>
            </div>
            <button
              onClick={handleDismissInteraction}
              className="text-purple-500 hover:text-purple-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          🐾 AI宠物冒险
        </h1>
        <p className="text-lg text-gray-600">
          上传图片，创建你的专属电子宠物，开启文字冒险之旅
        </p>
      </header>

      {!gameState ? (
        <PetCreation onPetCreated={handleNewPetCreated} />
      ) : (
        <PetGame 
          gameState={gameState}
          onGameStateUpdate={handleGameStateUpdate}
          onDeleteGame={handleDeleteGame}
        />
      )}
    </div>
  )
} 