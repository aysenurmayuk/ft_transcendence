import React, { useState, useEffect, useCallback, useRef } from 'react';
import sudokuGenerator from '../utils/sudokuGenerator';
import './Sudoku.css';

const Sudoku = ({ circleId, showToast }) => {
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
				if (showToast) showToast("Puzzle Solved!", "Sudoku");
			}
		}
	}, [board, solution, isSolved, showToast]);

	if (!circleId) return <div className="container text-center mt-5 text-white">Please join a circle to play Sudoku.</div>;

	return (
		<div className="container-fluid py-4" style={{ minHeight: '100vh', overflowY: 'auto' }}>
			<div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary">
				<div>
					<h2 className="h3 fw-bold mb-1">Sudoku</h2>
					<div className="text-muted small d-flex align-items-center gap-3">
						<span><i className="fa-solid fa-triangle-exclamation me-1"></i>Mistakes: {mistakes}</span>
						<span className="text-capitalize"><i className="fa-solid fa-layer-group me-1"></i>{gameDifficulty}</span>
					</div>
				</div>
				{!isConnected && <span className="badge bg-danger">Disconnected</span>}
			</div>

			<div className="row g-4 justify-content-center align-items-start">
				<div className="col-12 col-lg-auto d-flex justify-content-center">
					<div className="sudoku-board shadow-sm">
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
										${(colIndex + 1) % 3 === 0 && colIndex !== 8 ? 'cell-border-right' : ''}
										${(rowIndex + 1) % 3 === 0 && rowIndex !== 8 ? 'cell-border-bottom' : ''}
									`}
									onClick={() => handleCellClick(rowIndex, colIndex)}
								>
									{cell !== 0 ? cell : ''}
								</div>
							);
						})
					))}
					</div>
				</div>

				<div className="col-12 col-lg-auto d-flex justify-content-center">
					<div className="card bg-body border-secondary shadow-sm sudoku-controls-card">
					<div className="card-body p-3 d-flex flex-column gap-3">
						<h6 className="card-title fw-bold mb-0 d-none d-lg-block">Controls</h6>
						
						<div className="sudoku-numpad-grid">
							{[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
								<button
									key={num}
										className="btn btn-outline-secondary numpad-btn"
										onClick={() => handleNumberInput(num)}
									>
										{num}
									</button>
								))}
								<button className="btn btn-outline-danger numpad-btn" onClick={() => handleNumberInput(0)}>
									<i className="fa-solid fa-eraser"></i>
								</button>
							</div>

						<div className="d-flex flex-column gap-2 w-100">
							<div>
								<label className="form-label small text-muted fw-bold">Difficulty</label>
								<select
									value={nextDifficulty}
									onChange={(e) => setNextDifficulty(e.target.value)}
									className="form-select border-secondary"
								>
									<option value="easy">Easy</option>
									<option value="medium">Medium</option>
									<option value="hard">Hard</option>
								</select>
							</div>
							<button className="btn btn-primary w-100 py-1 fw-bold" onClick={startNewGame}>
								New Game
							</button>
						</div>
					</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Sudoku;
