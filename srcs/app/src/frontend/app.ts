import { router } from './router.js';
import { login, register, getCurrentUser, logout, ApiError } from './api.js';
import type { User } from './types.js';
import { renderGameView, initGameView } from './game-view.js';

/**
 * Global state
 */
let currentUser: User | null = null;

/**
 * Get app container
 */
function getAppContainer(): HTMLElement {
  const app = document.getElementById('app');
  if (!app) throw new Error('App container not found');
  return app;
}

/**
 * Show error message
 */
function showError(container: HTMLElement, message: string, details?: Array<{ field: string; message: string }>): void {
  const errorDiv = container.querySelector('.error-message') as HTMLElement;
  if (errorDiv) {
    let errorText = message;
    
    if (details && details.length > 0) {
      errorText += '<ul class="mt-2 list-disc list-inside">';
      details.forEach(d => {
        errorText += `<li>${d.message}</li>`;
      });
      errorText += '</ul>';
    }
    
    errorDiv.innerHTML = errorText;
    errorDiv.classList.remove('hidden');
  }
}

/**
 * Hide error message
 */
function hideError(container: HTMLElement): void {
  const errorDiv = container.querySelector('.error-message') as HTMLElement;
  if (errorDiv) {
    errorDiv.classList.add('hidden');
  }
}

/**
 * Render Login View
 */
function renderLogin(): void {
  const app = getAppContainer();
  
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-4xl font-extrabold text-white">
            🏓 Pong Platform
          </h2>
          <p class="mt-2 text-center text-sm text-gray-400">
            Sign in to your account
          </p>
        </div>
        
        <div class="bg-gray-800 shadow-xl rounded-lg p-8">
          <form id="login-form" class="space-y-6">
            <div class="error-message hidden bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded relative" role="alert">
            </div>
            
            <div>
              <label for="username" class="block text-sm font-medium text-gray-300">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autocomplete="username"
                required
                class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
                class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <button
                type="submit"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Sign in
              </button>
            </div>
            
            <div class="text-center">
              <a href="/register" class="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                Don't have an account? Register
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  // Attach form handler
  const form = document.getElementById('login-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError(app);

    const formData = new FormData(form);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      const response = await login(username, password);
      currentUser = response.user;
      router.navigate('/home');
    } catch (error) {
      if (error instanceof ApiError) {
        showError(app, error.message, error.details);
      } else {
        showError(app, 'An unexpected error occurred');
      }
    }
  });

  // Handle navigation links
  const registerLink = app.querySelector('a[href="/register"]');
  registerLink?.addEventListener('click', (e) => {
    e.preventDefault();
    router.navigate('/register');
  });
}

/**
 * Render Register View
 */
function renderRegister(): void {
  const app = getAppContainer();
  
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-4xl font-extrabold text-white">
            🏓 Pong Platform
          </h2>
          <p class="mt-2 text-center text-sm text-gray-400">
            Create a new account
          </p>
        </div>
        
        <div class="bg-gray-800 shadow-xl rounded-lg p-8">
          <form id="register-form" class="space-y-6">
            <div class="error-message hidden bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded relative" role="alert">
            </div>
            
            <div>
              <label for="username" class="block text-sm font-medium text-gray-300">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autocomplete="username"
                required
                class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Choose a username (3-20 chars)"
              />
              <p class="mt-1 text-xs text-gray-400">Only letters, numbers, and underscores</p>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autocomplete="new-password"
                required
                class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Choose a password (min 8 chars)"
              />
              <p class="mt-1 text-xs text-gray-400">Must contain at least one letter and one number</p>
            </div>

            <div>
              <button
                type="submit"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Create Account
              </button>
            </div>
            
            <div class="text-center">
              <a href="/login" class="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                Already have an account? Sign in
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  // Attach form handler
  const form = document.getElementById('register-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError(app);

    const formData = new FormData(form);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      const response = await register(username, password);
      currentUser = response.user;
      router.navigate('/home');
    } catch (error) {
      if (error instanceof ApiError) {
        showError(app, error.message, error.details);
      } else {
        showError(app, 'An unexpected error occurred');
      }
    }
  });

  // Handle navigation links
  const loginLink = app.querySelector('a[href="/login"]');
  loginLink?.addEventListener('click', (e) => {
    e.preventDefault();
    router.navigate('/login');
  });
}

/**
 * Render Home View
 */
function renderHome(): void {
  const app = getAppContainer();
  
  if (!currentUser) {
    router.navigate('/login');
    return;
  }
  
  app.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <nav class="bg-gray-800 shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <span class="text-2xl font-bold text-white">🏓 Pong Platform</span>
            </div>
            <div class="flex items-center space-x-4">
              <span class="text-gray-300">Welcome, <span class="font-semibold text-white">${currentUser.username}</span></span>
              <button
                id="logout-btn"
                class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="bg-gray-800 rounded-lg shadow-xl p-8">
            <h1 class="text-4xl font-bold text-white mb-6 text-center">
              Welcome to Pong Platform! 🎮
            </h1>
            <p class="text-xl text-gray-300 mb-8 text-center">
              Hello, <span class="text-blue-400 font-semibold">${currentUser.username}</span>!
            </p>
            
            <div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div class="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg p-8 text-center cursor-pointer hover:scale-105 transition-transform duration-200" id="play-game-card">
                <div class="text-6xl mb-4">🏓</div>
                <h2 class="text-2xl font-bold text-white mb-3">Play Pong</h2>
                <p class="text-gray-100">
                  Challenge a friend in classic Pong!
                </p>
              </div>
              
              <div class="bg-gradient-to-br from-green-600 to-teal-600 rounded-lg p-8 text-center opacity-50">
                <div class="text-6xl mb-4">👥</div>
                <h2 class="text-2xl font-bold text-white mb-3">Multiplayer</h2>
                <p class="text-gray-100">
                  Coming soon...
                </p>
              </div>
              
              <div class="bg-gradient-to-br from-orange-600 to-red-600 rounded-lg p-8 text-center opacity-50">
                <div class="text-6xl mb-4">🏆</div>
                <h2 class="text-2xl font-bold text-white mb-3">Leaderboard</h2>
                <p class="text-gray-100">
                  Coming soon...
                </p>
              </div>
              
              <div class="bg-gradient-to-br from-pink-600 to-purple-600 rounded-lg p-8 text-center opacity-50">
                <div class="text-6xl mb-4">⚙️</div>
                <h2 class="text-2xl font-bold text-white mb-3">Settings</h2>
                <p class="text-gray-100">
                  Coming soon...
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  // Attach logout handler
  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn?.addEventListener('click', async () => {
    try {
      await logout();
      currentUser = null;
      router.navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  });

  // Attach play game handler
  const playGameCard = document.getElementById('play-game-card');
  playGameCard?.addEventListener('click', () => {
    router.navigate('/game');
  });
}

/**
 * Render Game View
 */
function renderGame(): void {
  const app = getAppContainer();
  
  if (!currentUser) {
    router.navigate('/login');
    return;
  }
  
  app.innerHTML = renderGameView();
  initGameView();
}

/**
 * Initialize auth check on startup
 */
async function initAuth(): Promise<void> {
  try {
    const response = await getCurrentUser();
    currentUser = response.user;
    
    // If already authenticated and on login/register, redirect to home
    const path = window.location.pathname;
    if (path === '/login' || path === '/register' || path === '/') {
      router.navigate('/home');
    }
  } catch (error) {
    // Not authenticated, continue with normal flow
    currentUser = null;
  }
}

/**
 * Setup routes and start app
 */
export async function initApp(): Promise<void> {
  // Check authentication status
  await initAuth();

  // Register routes
  router.on('/login', renderLogin);
  router.on('/register', renderRegister);
  router.on('/home', renderHome);
  router.on('/game', renderGame);

  // Start router
  router.start();
}
