import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Obstacle extends GameObject {
  speed: number;
}

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver' | 'discount'>('menu');
  const [score, setScore] = useState(0);
  const [showDiscountBanner, setShowDiscountBanner] = useState(false);
  
  // Игровые объекты
  const [player, setPlayer] = useState<GameObject>({
    x: 100,
    y: 200,
    width: 40,
    height: 40
  });
  
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [playerVelocityY, setPlayerVelocityY] = useState(0);
  const gameLoopRef = useRef<number>();
  const keysRef = useRef<{[key: string]: boolean}>({});

  const GRAVITY = 0.5;
  const JUMP_FORCE = -12;
  const GROUND_Y = 350;
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 400;

  // Инициализация игры
  const initGame = useCallback(() => {
    setPlayer({ x: 100, y: 200, width: 40, height: 40 });
    setObstacles([]);
    setScore(0);
    setPlayerVelocityY(0);
    setShowDiscountBanner(false);
  }, []);

  // Обработка нажатий клавиш
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'Space' && gameState === 'playing') {
        e.preventDefault();
        if (player.y + player.height >= GROUND_Y) {
          setPlayerVelocityY(JUMP_FORCE);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, player.y, player.height]);

  // Проверка коллизий
  const checkCollision = useCallback((rect1: GameObject, rect2: GameObject) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }, []);

  // Игровой цикл
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    // Обновление позиции игрока
    setPlayer(prev => {
      let newY = prev.y + playerVelocityY;
      let newVelY = playerVelocityY + GRAVITY;

      // Проверка земли
      if (newY + prev.height >= GROUND_Y) {
        newY = GROUND_Y - prev.height;
        newVelY = 0;
      }

      setPlayerVelocityY(newVelY);
      return { ...prev, y: newY };
    });

    // Обновление препятствий
    setObstacles(prev => {
      const updated = prev.map(obstacle => ({
        ...obstacle,
        x: obstacle.x - obstacle.speed
      })).filter(obstacle => obstacle.x + obstacle.width > -50);

      // Добавление новых препятствий
      if (updated.length === 0 || updated[updated.length - 1].x < CANVAS_WIDTH - 300) {
        updated.push({
          x: CANVAS_WIDTH,
          y: GROUND_Y - 60,
          width: 40,
          height: 60,
          speed: 5 + Math.random() * 3
        });
      }

      return updated;
    });

    // Проверка коллизий
    obstacles.forEach(obstacle => {
      if (checkCollision(player, obstacle)) {
        setGameState('gameOver');
        setTimeout(() => setShowDiscountBanner(true), 1000);
      }
    });

    // Увеличение счета
    setScore(prev => prev + 1);

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, player, obstacles, playerVelocityY, checkCollision]);

  // Запуск игрового цикла
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);

  // Отрисовка
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Очистка canvas
    ctx.fillStyle = '#45B7D1';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Рисование земли
    ctx.fillStyle = '#4EODC4';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

    if (gameState === 'playing' || gameState === 'gameOver') {
      // Рисование игрока
      ctx.fillStyle = '#FF6B35';
      ctx.fillRect(player.x, player.y, player.width, player.height);
      
      // Глаза игрока
      ctx.fillStyle = 'white';
      ctx.fillRect(player.x + 8, player.y + 8, 8, 8);
      ctx.fillRect(player.x + 24, player.y + 8, 8, 8);
      ctx.fillStyle = 'black';
      ctx.fillRect(player.x + 10, player.y + 10, 4, 4);
      ctx.fillRect(player.x + 26, player.y + 10, 4, 4);

      // Рисование препятствий
      obstacles.forEach(obstacle => {
        ctx.fillStyle = '#333333';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      });

      // Счет
      ctx.fillStyle = 'black';
      ctx.font = '24px Comic Sans MS';
      ctx.fillText(`Счет: ${Math.floor(score / 10)}`, 20, 40);
    }
  });

  const startGame = () => {
    initGame();
    setGameState('playing');
  };

  const restartGame = () => {
    setShowDiscountBanner(false);
    initGame();
    setGameState('playing');
  };

  const closeDiscountBanner = () => {
    setShowDiscountBanner(false);
    setGameState('menu');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-emerald-400 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-6">
        <h1 className="text-6xl font-bold text-white drop-shadow-lg mb-2" style={{fontFamily: 'Comic Sans MS, cursive'}}>
          ПРЫГАЙ И ВЫЖИВАЙ! 🚀
        </h1>
        <p className="text-xl text-white drop-shadow">Избегай препятствия и набирай очки!</p>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-4 border-white rounded-lg shadow-2xl bg-sky-200"
        />

        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
            <Card className="p-8 text-center bg-white">
              <h2 className="text-3xl font-bold mb-4 text-orange-500" style={{fontFamily: 'Comic Sans MS, cursive'}}>
                Готов к приключению?
              </h2>
              <p className="text-gray-600 mb-6">Нажми ПРОБЕЛ для прыжка!</p>
              <Button 
                onClick={startGame}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-xl"
                style={{fontFamily: 'Comic Sans MS, cursive'}}
              >
                <Icon name="Play" className="mr-2" />
                ИГРАТЬ!
              </Button>
            </Card>
          </div>
        )}

        {gameState === 'gameOver' && !showDiscountBanner && (
          <div className="absolute inset-0 bg-red-500 bg-opacity-50 flex items-center justify-center rounded-lg">
            <Card className="p-8 text-center bg-white">
              <h2 className="text-3xl font-bold mb-4 text-red-500" style={{fontFamily: 'Comic Sans MS, cursive'}}>
                ИГРА ОКОНЧЕНА! 💀
              </h2>
              <p className="text-gray-600 mb-2">Ваш счет: {Math.floor(score / 10)}</p>
              <p className="text-sm text-gray-500 mb-6">Ожидайте специальное предложение...</p>
            </Card>
          </div>
        )}
      </div>

      {/* Банер со скидкой */}
      {showDiscountBanner && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md p-8 text-center bg-gradient-to-b from-yellow-400 to-orange-500 border-4 border-yellow-300 animate-scale-in">
            <div className="text-6xl mb-4">⚰️</div>
            <h2 className="text-3xl font-bold mb-4 text-white drop-shadow-lg" style={{fontFamily: 'Comic Sans MS, cursive'}}>
              СКИДКА 50%!
            </h2>
            <p className="text-white text-lg mb-2 drop-shadow">
              Не повезло в игре? 
            </p>
            <p className="text-white text-xl font-bold mb-6 drop-shadow">
              Зато повезет с ПАМЯТНИКОМ!
            </p>
            <div className="text-2xl font-bold text-red-600 bg-white px-4 py-2 rounded-lg mb-6 drop-shadow">
              ТОЛЬКО СЕГОДНЯ -50%
            </div>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={() => window.open('tel:+7-800-PAMYATNIK', '_blank')}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3"
                style={{fontFamily: 'Comic Sans MS, cursive'}}
              >
                <Icon name="Phone" className="mr-2" />
                ЗАКАЗАТЬ
              </Button>
              <Button 
                onClick={closeDiscountBanner}
                variant="outline"
                className="px-6 py-3 bg-white"
                style={{fontFamily: 'Comic Sans MS, cursive'}}
              >
                Попробовать еще раз
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-white text-lg drop-shadow">
          Управление: <strong>ПРОБЕЛ</strong> - прыжок
        </p>
        {gameState === 'playing' && (
          <Button 
            onClick={() => setGameState('menu')}
            variant="outline"
            className="mt-3 bg-white text-gray-700"
            style={{fontFamily: 'Comic Sans MS, cursive'}}
          >
            <Icon name="Pause" className="mr-2" />
            Пауза
          </Button>
        )}
      </div>
    </div>
  );
};

export default Index;