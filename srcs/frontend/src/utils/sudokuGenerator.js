
class SudokuGenerator {
	constructor() {
		this.board = Array(9).fill().map(() => Array(9).fill(0));
	}

	isValid(board, row, col, num) {
		for (let x = 0; x < 9; x++) {
			if (board[row][x] === num || board[x][col] === num) return false;
		}

		const startRow = 3 * Math.floor(row / 3);
		const startCol = 3 * Math.floor(col / 3);

		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) {
				if (board[startRow + i][startCol + j] === num) return false;
			}
		}

		return true;
	}

	solve(board) {
		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				if (board[row][col] === 0) {
					for (let num = 1; num <= 9; num++) {
						if (this.isValid(board, row, col, num)) {
							board[row][col] = num;
							if (this.solve(board)) return true;
							board[row][col] = 0;
						}
					}
					return false;
				}
			}
		}
		return true;
	}

	generate(difficulty = 'easy') {
		// Reset board
		this.board = Array(9).fill().map(() => Array(9).fill(0));

		// Fill diagonal boxes (independent of each other)
		for (let i = 0; i < 9; i = i + 3) {
			this.fillBox(i, i);
		}

		// Solve the rest
		this.solve(this.board);

		// Remove numbers based on difficulty
		const attempts = difficulty === 'hard' ? 50 : difficulty === 'medium' ? 40 : 30;
		const finalBoard = this.board.map(row => [...row]);

		let count = attempts;
		while (count > 0) {
			let row = Math.floor(Math.random() * 9);
			let col = Math.floor(Math.random() * 9);
			while (finalBoard[row][col] === 0) {
				row = Math.floor(Math.random() * 9);
				col = Math.floor(Math.random() * 9);
			}
			finalBoard[row][col] = 0;
			count--;
		}

		return {
			solved: this.board,
			initial: finalBoard
		};
	}

	fillBox(row, col) {
		let num;
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) {
				do {
					num = Math.floor(Math.random() * 9) + 1;
				} while (!this.isSafeInBox(row, col, num));
				this.board[row + i][col + j] = num;
			}
		}
	}

	isSafeInBox(rowStart, colStart, num) {
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) {
				if (this.board[rowStart + i][colStart + j] === num) return false;
			}
		}
		return true;
	}
}

export default new SudokuGenerator();
