import type { GameState, GameControls } from './types.js';

/**
 * Game Engine - Handles Pong game logic and physics
 */

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState;
  private controls: GameControls;
  private animationId: number | null = null;
  private readonly WINNING_SCORE = 5;
  private readonly BALL_SPEED = 5;
  private readonly PADDLE_SPEED = 6;
  private readonly MAX_BOUNCE_ANGLE = Math.PI / 4; // 45 degrees

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    this.ctx = ctx;
    
    // Initialize game state
    this.state = this.createInitialState();
    this.controls = {
      upPressed: false,
      downPressed: false,
      wPressed: false,
      sPressed: false
    };

    this.setupEventListeners();
  }

  private createInitialState(): GameState {
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    const paddleWidth = 12;
    const paddleHeight = 100;
    
    return {
      ball: {
        x: width / 2,
        y: height / 2,
        dx: this.BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
        dy: this.BALL_SPEED * (Math.random() * 0.5 - 0.25),
        radius: 8
      },
      paddle1: {
        x: 20,
        y: height / 2 - paddleHeight / 2,
        width: paddleWidth,
        height: paddleHeight,
        dy: 0
      },
      paddle2: {
        x: width - 20 - paddleWidth,
        y: height / 2 - paddleHeight / 2,
        width: paddleWidth,
        height: paddleHeight,
        dy: 0
      },
      score: {
        player1: 0,
        player2: 0
      },
      isPlaying: false,
      isPaused: false,
      winner: null
    };
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'ArrowUp':
          e.preventDefault();
          this.controls.upPressed = true;
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.controls.downPressed = true;
          break;
        case 'w':
        case 'W':
          this.controls.wPressed = true;
          break;
        case 's':
        case 'S':
          this.controls.sPressed = true;
          break;
        case ' ':
          e.preventDefault();
          this.togglePause();
          break;
        case 'Enter':
          if (!this.state.isPlaying) {
            this.start();
          } else if (this.state.winner) {
            this.reset();
          }
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch(e.key) {
        case 'ArrowUp':
          this.controls.upPressed = false;
          break;
        case 'ArrowDown':
          this.controls.downPressed = false;
          break;
        case 'w':
        case 'W':
          this.controls.wPressed = false;
          break;
        case 's':
        case 'S':
          this.controls.sPressed = false;
          break;
      }
    });
  }

  public start(): void {
    if (this.state.winner) {
      this.reset();
    }
    this.state.isPlaying = true;
    this.state.isPaused = false;
    this.gameLoop();
  }

  public pause(): void {
    this.state.isPaused = true;
  }

  public togglePause(): void {
    if (!this.state.isPlaying || this.state.winner) return;
    this.state.isPaused = !this.state.isPaused;
  }

  public reset(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.state = this.createInitialState();
  }

  public stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.state.isPlaying = false;
  }

  private gameLoop = (): void => {
    if (!this.state.isPlaying) return;

    if (!this.state.isPaused && !this.state.winner) {
      this.update();
    }
    
    this.draw();
    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private update(): void {
    // Update paddle positions based on controls
    if (this.controls.upPressed) {
      this.state.paddle2.y -= this.PADDLE_SPEED;
    }
    if (this.controls.downPressed) {
      this.state.paddle2.y += this.PADDLE_SPEED;
    }
    if (this.controls.wPressed) {
      this.state.paddle1.y -= this.PADDLE_SPEED;
    }
    if (this.controls.sPressed) {
      this.state.paddle1.y += this.PADDLE_SPEED;
    }

    // Keep paddles in bounds
    this.state.paddle1.y = Math.max(0, Math.min(this.canvas.height - this.state.paddle1.height, this.state.paddle1.y));
    this.state.paddle2.y = Math.max(0, Math.min(this.canvas.height - this.state.paddle2.height, this.state.paddle2.y));

    // Update ball position
    this.state.ball.x += this.state.ball.dx;
    this.state.ball.y += this.state.ball.dy;

    // Ball collision with top/bottom walls
    if (this.state.ball.y - this.state.ball.radius <= 0 || 
        this.state.ball.y + this.state.ball.radius >= this.canvas.height) {
      this.state.ball.dy *= -1;
    }

    // Ball collision with paddles
    this.checkPaddleCollision(this.state.paddle1);
    this.checkPaddleCollision(this.state.paddle2);

    // Ball out of bounds (scoring)
    if (this.state.ball.x - this.state.ball.radius < 0) {
      this.state.score.player2++;
      this.checkWinner();
      this.resetBall();
    } else if (this.state.ball.x + this.state.ball.radius > this.canvas.width) {
      this.state.score.player1++;
      this.checkWinner();
      this.resetBall();
    }
  }

  private checkPaddleCollision(paddle: GameState['paddle1']): void {
    const ball = this.state.ball;
    
    // Check if ball is at paddle's x position
    const ballLeft = ball.x - ball.radius;
    const ballRight = ball.x + ball.radius;
    const ballTop = ball.y - ball.radius;
    const ballBottom = ball.y + ball.radius;
    
    if (ballRight >= paddle.x && 
        ballLeft <= paddle.x + paddle.width &&
        ballBottom >= paddle.y && 
        ballTop <= paddle.y + paddle.height) {
      
      // Calculate where ball hit paddle (0 = center, -1 = top, 1 = bottom)
      const paddleCenter = paddle.y + paddle.height / 2;
      const relativeIntersectY = (ball.y - paddleCenter) / (paddle.height / 2);
      
      // Calculate bounce angle
      const bounceAngle = relativeIntersectY * this.MAX_BOUNCE_ANGLE;
      
      // Set new ball direction
      const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      const direction = ball.dx > 0 ? -1 : 1;
      
      ball.dx = direction * speed * Math.cos(bounceAngle);
      ball.dy = speed * Math.sin(bounceAngle);
      
      // Increase speed slightly (up to 150%)
      const speedMultiplier = Math.min(1.5, 1 + Math.abs(relativeIntersectY) * 0.1);
      ball.dx *= speedMultiplier;
      ball.dy *= speedMultiplier;
      
      // Move ball out of paddle to prevent multiple collisions
      if (direction === 1) {
        ball.x = paddle.x + paddle.width + ball.radius;
      } else {
        ball.x = paddle.x - ball.radius;
      }
    }
  }

  private resetBall(): void {
    this.state.ball.x = this.canvas.width / 2;
    this.state.ball.y = this.canvas.height / 2;
    
    // Random direction
    const angle = (Math.random() - 0.5) * Math.PI / 3; // Random angle between -30 and 30 degrees
    const direction = Math.random() > 0.5 ? 1 : -1;
    
    this.state.ball.dx = direction * this.BALL_SPEED * Math.cos(angle);
    this.state.ball.dy = this.BALL_SPEED * Math.sin(angle);
  }

  private checkWinner(): void {
    if (this.state.score.player1 >= this.WINNING_SCORE) {
      this.state.winner = 'player1';
      this.state.isPlaying = false;
    } else if (this.state.score.player2 >= this.WINNING_SCORE) {
      this.state.winner = 'player2';
      this.state.isPlaying = false;
    }
  }

  private draw(): void {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw center line
    this.ctx.strokeStyle = '#ffffff33';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([10, 10]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Draw paddles
    this.ctx.fillStyle = '#3b82f6';
    this.ctx.fillRect(this.state.paddle1.x, this.state.paddle1.y, 
                      this.state.paddle1.width, this.state.paddle1.height);
    
    this.ctx.fillStyle = '#ef4444';
    this.ctx.fillRect(this.state.paddle2.x, this.state.paddle2.y, 
                      this.state.paddle2.width, this.state.paddle2.height);

    // Draw ball
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(this.state.ball.x, this.state.ball.y, this.state.ball.radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw scores
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 48px system-ui';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      this.state.score.player1.toString(), 
      this.canvas.width / 4, 
      60
    );
    this.ctx.fillText(
      this.state.score.player2.toString(), 
      (this.canvas.width / 4) * 3, 
      60
    );

    // Draw player labels
    this.ctx.font = 'bold 16px system-ui';
    this.ctx.fillStyle = '#3b82f6';
    this.ctx.fillText('Player 1 (W/S)', this.canvas.width / 4, 90);
    this.ctx.fillStyle = '#ef4444';
    this.ctx.fillText('Player 2 (↑/↓)', (this.canvas.width / 4) * 3, 90);

    // Draw pause/winner overlay
    if (this.state.isPaused) {
      this.drawOverlay('PAUSED', 'Press SPACE to resume');
    } else if (this.state.winner) {
      const winner = this.state.winner === 'player1' ? 'Player 1' : 'Player 2';
      this.drawOverlay(`${winner} WINS!`, 'Press ENTER to play again');
    } else if (!this.state.isPlaying) {
      this.drawOverlay('PONG', 'Press ENTER to start');
    }
  }

  private drawOverlay(title: string, subtitle: string): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Title
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 64px system-ui';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(title, this.canvas.width / 2, this.canvas.height / 2 - 20);

    // Subtitle
    this.ctx.font = '24px system-ui';
    this.ctx.fillText(subtitle, this.canvas.width / 2, this.canvas.height / 2 + 40);
  }

  public getState(): GameState {
    return { ...this.state };
  }
}
