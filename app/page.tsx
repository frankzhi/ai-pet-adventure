'use client'

import { useState, useEffect } from 'react'
import { GameService } from '../lib/game-service'
import { GameState } from '../types'
import PetCreation from '../components/PetCreation'
import PetGame from '../components/PetGame'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 加载游戏状态
    const savedState = GameService.loadGameState()
    if (savedState) {
      // 更新宠物状态
      GameService.updatePetStatus()
      setGameState(GameService.loadGameState())
    }
    setLoading(false)
  }, [])

  const handleNewPetCreated = (newGameState: GameState) => {
    setGameState(newGameState)
  }

  const handleGameStateUpdate = () => {
    setGameState(GameService.loadGameState())
  }

  const handleDeleteGame = () => {
    GameService.deleteGameState()
    setGameState(null)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="container mx-auto px-4 py-8">
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