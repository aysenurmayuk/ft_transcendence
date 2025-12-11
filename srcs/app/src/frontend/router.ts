/**
 * Simple SPA Router using History API
 * Supports browser back/forward buttons
 */

type RouteHandler = () => void;

interface Route {
  path: string;
  handler: RouteHandler;
}

class Router {
  private routes: Route[] = [];
  private currentPath: string = '';

  constructor() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
      this.navigate(window.location.pathname, false);
    });
  }

  /**
   * Register a route
   */
  on(path: string, handler: RouteHandler): void {
    this.routes.push({ path, handler });
  }

  /**
   * Navigate to a path
   */
  navigate(path: string, pushState: boolean = true): void {
    this.currentPath = path;

    // Update browser history
    if (pushState) {
      window.history.pushState({}, '', path);
    }

    // Find and execute matching route handler
    const route = this.routes.find((r) => r.path === path);

    if (route) {
      route.handler();
    } else {
      // Default: redirect to login if no route matches
      this.navigate('/login', true);
    }
  }

  /**
   * Get current path
   */
  getCurrentPath(): string {
    return this.currentPath;
  }

  /**
   * Start the router
   */
  start(): void {
    const initialPath = window.location.pathname;
    this.navigate(initialPath, false);
  }
}

export const router = new Router();
