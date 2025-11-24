// srcs/app/src/game/ai.ts

class AI {
    constructor(private speed: number) {}

    public move(ballPosition: { x: number; y: number }, paddlePosition: { y: number }): { y: number } {
        const paddleHeight = 100; // Paddle height
        const halfPaddleHeight = paddleHeight / 2;

        // Simple AI logic to follow the ball
        if (ballPosition.y < paddlePosition.y + halfPaddleHeight) {
            return { y: paddlePosition.y - this.speed };
        } else if (ballPosition.y > paddlePosition.y + halfPaddleHeight) {
            return { y: paddlePosition.y + this.speed };
        }
        return { y: paddlePosition.y }; // Stay in place
    }
}

export default AI;