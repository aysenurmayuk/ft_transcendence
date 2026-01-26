import React, { useState, useEffect, useCallback, useRef } from 'react';
import sudokuGenerator from '../utils/sudokuGenerator';
import './Sudoku.css';

const Sudoku = ({ circleId }) => {
	const [board, setBoard] = useState(Array(9).fill().map(() => Array(9).fill(0)));
	const [initialBoard, setInitialBoard] = useState(Array(9).fill().map(() => Array(9).fill(0)));
	const [solution, setSolution] = useState(null);
	const [selectedCell, setSelectedCell] = useState(null);
	const [mistakes, setMistakes] = useState(0); // This is local-only for now, arguably could be shared but let's keep it simple
	const [isSolved, setIsSolved] = useState(false);
	const [isConnected, setIsConnected] = useState(false);
	const [gameDifficulty, setGameDifficulty] = useState('easy'); // Difficulty of the active game
	const [nextDifficulty, setNextDifficulty] = useState('easy'); // Difficulty selected for the next game

	const ws = useRef(null);

	// WebSocket Connection
	useEffect(() => {
		if (!circleId) return;

		const token = localStorage.getItem('token');
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const wsUrl = `${protocol}//${window.location.host}/ws/sudoku/${circleId}/?token=${token}`;

		ws.current = new WebSocket(wsUrl);

		ws.current.onopen = () => {
			console.log("Sudoku WS Connected");
			setIsConnected(true);
		};

		ws.current.onmessage = (event) => {
			const data = JSON.parse(event.data);

			if (data.type === 'game_state') {
				setBoard(data.board);
				setInitialBoard(data.initial_board);
				setSolution(data.solution);
				setIsSolved(data.is_solved);
				setGameDifficulty(data.difficulty);
				setNextDifficulty(data.difficulty); // Sync selector to current game initially
				// If no game exists/empty board, maybe auto-start one? 
				// For now let's wait for user to click New Game if empty.
				if (data.board.length === 0 || (data.board.length > 0 && data.board[0].length === 0)) {
					// Optional: Auto start if empty
				}
			} else if (data.type === 'board_update') {
				setBoard(prev => {
					const newBoard = prev.map(row => [...row]);
					newBoard[data.row][data.col] = data.value;
					return newBoard;
				});
			} else if (data.type === 'new_game') {
				setBoard(data.board);
				setInitialBoard(data.initial_board);
				setSolution(data.solution);
				setIsSolved(false);
				setMistakes(0); // Reset mistakes on new game
				setGameDifficulty(data.difficulty);
				setNextDifficulty(data.difficulty); // Sync selector? Optional, maybe keep user choice. Let's sync to show what everyone is playing.
			}
		};

		ws.current.onclose = () => {
			console.log("Sudoku WS Closed");
			setIsConnected(false);
		};

		return () => {
			if (ws.current) ws.current.close();
		};
	}, [circleId]);

	const startNewGame = useCallback(() => {
		if (!isConnected) return;

		const { solved, initial } = sudokuGenerator.generate(nextDifficulty);

		// Send to server
		ws.current.send(JSON.stringify({
			type: 'new_game',
			board: initial, // current board starts as initial
			initial_board: initial,
			solution: solved,
			difficulty: nextDifficulty
		}));
	}, [isConnected, nextDifficulty]);

	const handleCellClick = (row, col) => {
		setSelectedCell({ row, col });
	};

	const handleNumberInput = (num) => {
		if (!selectedCell || isSolved || !isConnected) return;
		const { row, col } = selectedCell;

		// Cannot edit initial cells
		if (initialBoard && initialBoard[row][col] !== 0) return;

		// Optimistic update? 
		// Ideally we wait for server, but for responsiveness we can check locally if we have solution

		// Logic:
		// 1. Check valid/invalid against solution if we have it
		if (solution) {
			if (num !== 0 && num !== solution[row][col]) {
				setMistakes(prev => prev + 1);
				// We still allow placing the wrong number? 
				// The previous implementation allowed it but counted mistake.
			}
		}

		// Send to server
		ws.current.send(JSON.stringify({
			type: 'update_cell',
			row,
			col,
			value: num
		}));
	};

	// Check win condition locally if board updates
	useEffect(() => {
		if (solution && board && board.length > 0) {
			let won = true;
			for (let i = 0; i < 9; i++) {
				for (let j = 0; j < 9; j++) {
					if (board[i][j] !== solution[i][j]) {
						won = false;
						break;
					}
				}
			}
			if (won && !isSolved) {
				setIsSolved(true);
				alert("Puzzle Solved!");
			}
		}
	}, [board, solution, isSolved]);

	if (!circleId) return <div className="sudoku-container">Please join a circle to play Sudoku.</div>;

	return (
		<div className="sudoku-container">
			<div className="game-header">
				<h1>Sudoku</h1>
				<div className="game-stats">
					<span>Mistakes: {mistakes}</span>
					<span style={{ textTransform: 'capitalize' }}>Difficulty: {gameDifficulty}</span>
					{!isConnected && <span style={{ color: 'red', marginLeft: '10px' }}>(Disconnected)</span>}
				</div>
			</div>

			<div className="sudoku-board">
				{board && board.length > 0 && board.map((row, rowIndex) => (
					row.map((cell, colIndex) => {
						const isInitial = initialBoard && initialBoard[rowIndex] && initialBoard[rowIndex][colIndex] !== 0;
						const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
						const isError = !isInitial && cell !== 0 && solution && cell !== solution[rowIndex][colIndex];

						return (
							<div
								key={`${rowIndex}-${colIndex}`}
								className={`cell 
                  ${isInitial ? 'initial' : ''} 
                  ${isSelected ? 'selected' : ''}
                  ${isError ? 'error' : ''}
                `}
								onClick={() => handleCellClick(rowIndex, colIndex)}
								style={{
									borderRight: (colIndex + 1) % 3 === 0 && colIndex !== 8 ? '2px solid #5a5a5a' : '1px solid rgba(255,255,255,0.1)',
									borderBottom: (rowIndex + 1) % 3 === 0 && rowIndex !== 8 ? '2px solid #5a5a5a' : '1px solid rgba(255,255,255,0.1)',
									borderLeft: colIndex % 3 === 0 && colIndex !== 0 ? '2px solid #5a5a5a' : 'none',
									borderTop: rowIndex % 3 === 0 && rowIndex !== 0 ? '2px solid #5a5a5a' : 'none',
									boxSizing: 'border-box'
								}}
							>
								{cell !== 0 ? cell : ''}
							</div>
						);
					})
				))}
			</div>

			<div className="numpad">
				{[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
					<button
						key={num}
						className="num-btn"
						onClick={() => handleNumberInput(num)}
					>
						{num}
					</button>
				))}
				<button className="num-btn" onClick={() => handleNumberInput(0)}>⌫</button>
			</div>

			<div className="controls">
				<select
					value={nextDifficulty}
					onChange={(e) => setNextDifficulty(e.target.value)}
					className="difficulty-select"
					style={{
						padding: '10px',
						borderRadius: '8px',
						border: '1px solid rgba(255,255,255,0.2)',
						background: 'rgba(255,255,255,0.1)',
						color: 'white',
						fontSize: '1rem',
						cursor: 'pointer',
						outline: 'none'
					}}
				>
					<option value="easy" style={{ color: 'black' }}>Easy</option>
					<option value="medium" style={{ color: 'black' }}>Medium</option>
					<option value="hard" style={{ color: 'black' }}>Hard</option>
				</select>
				<button className="action-btn new-game-btn" onClick={startNewGame}>New Game</button>
			</div>
		</div>
	);
};

export default Sudoku;
