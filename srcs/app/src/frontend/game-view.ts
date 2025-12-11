import { GameEngine } from './game-engine.js';

/**
 * Game View - Renders the Pong game page
 */

export function renderGameView(): string {
  return `
    <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div class="max-w-6xl w-full">
        <div class="text-center mb-8">
          <h1 class="text-5xl font-bold text-white mb-4">
            🏓 Pong Game
          </h1>
          <p class="text-gray-300 text-lg">
            Classic two-player Pong game
          </p>
        </div>

        <div class="bg-gray-800 rounded-lg shadow-2xl p-8 mb-6">
          <div class="flex justify-center mb-6">
            <canvas 
              id="gameCanvas" 
              width="800" 
              height="600"
              class="border-4 border-gray-700 rounded-lg shadow-lg"
            ></canvas>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
            <div class="bg-gray-700 rounded-lg p-4">
              <h3 class="text-xl font-bold text-blue-400 mb-3">🎮 Player 1 Controls</h3>
              <ul class="space-y-2">
                <li class="flex items-center">
                  <kbd class="px-3 py-1 bg-gray-600 rounded font-mono text-sm mr-3">W</kbd>
                  <span>Move Up</span>
                </li>
                <li class="flex items-center">
                  <kbd class="px-3 py-1 bg-gray-600 rounded font-mono text-sm mr-3">S</kbd>
                  <span>Move Down</span>
                </li>
              </ul>
            </div>

            <div class="bg-gray-700 rounded-lg p-4">
              <h3 class="text-xl font-bold text-red-400 mb-3">🎮 Player 2 Controls</h3>
              <ul class="space-y-2">
                <li class="flex items-center">
                  <kbd class="px-3 py-1 bg-gray-600 rounded font-mono text-sm mr-3">↑</kbd>
                  <span>Move Up</span>
                </li>
                <li class="flex items-center">
                  <kbd class="px-3 py-1 bg-gray-600 rounded font-mono text-sm mr-3">↓</kbd>
                  <span>Move Down</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="mt-6 bg-gray-700 rounded-lg p-4">
            <h3 class="text-xl font-bold text-purple-400 mb-3">⚙️ Game Controls</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-gray-300">
              <div class="flex items-center">
                <kbd class="px-3 py-1 bg-gray-600 rounded font-mono text-sm mr-3">ENTER</kbd>
                <span>Start / Restart</span>
              </div>
              <div class="flex items-center">
                <kbd class="px-3 py-1 bg-gray-600 rounded font-mono text-sm mr-3">SPACE</kbd>
                <span>Pause / Resume</span>
              </div>
              <div class="flex items-center">
                <span class="text-yellow-400 font-semibold">First to 5 wins!</span>
              </div>
            </div>
          </div>
        </div>

        <div class="text-center">
          <button 
            id="backToHome" 
            class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors duration-200 shadow-lg"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  `;
}

export function initGameView(): void {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  // Initialize game engine
  const game = new GameEngine(canvas);
  
  // Back to home button
  const backButton = document.getElementById('backToHome');
  if (backButton) {
    backButton.addEventListener('click', () => {
      game.stop();
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
  }

  // Auto-focus canvas for keyboard input
  canvas.focus();
  canvas.setAttribute('tabindex', '0');

  // Cleanup when leaving page
  const cleanup = () => {
    game.stop();
    window.removeEventListener('popstate', cleanup);
  };
  
  window.addEventListener('popstate', cleanup, { once: true });
}
