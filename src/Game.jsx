import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { db } from './firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import './Game.css';

function Game({ user }) {
  const [game, setGame] = useState(null);
  const [chess, setChess] = useState(new Chess());
  const [position, setPosition] = useState('start');
  const [orientation, setOrientation] = useState('white');
  const [currentGameId, setCurrentGameId] = useState(null);
  const [gameLink, setGameLink] = useState('');
  const [gameStatus, setGameStatus] = useState('');
  const [playerColor, setPlayerColor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check URL for game ID on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');
    if (gameId) {
      setCurrentGameId(gameId);
      joinGame(gameId);
    }
  }, [user]);

  // Subscribe to game changes if we have a gameId
  useEffect(() => {
    if (!currentGameId || !user) return;

    const gameRef = doc(db, 'games', currentGameId);
    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (!snapshot.exists()) {
        setError('Game not found');
        return;
      }

      const gameData = snapshot.data();
      setGame(gameData);
      
      // Update chess instance with the latest FEN
      const newChess = new Chess();
      try {
        newChess.load(gameData.fen);
        setChess(newChess);
        setPosition(gameData.fen);
      } catch (e) {
        console.error('Invalid FEN:', e);
        setError('Invalid game state');
      }

      // Determine player color and orientation
      if (gameData.playerWhite === user.uid) {
        setPlayerColor('white');
        setOrientation('white');
      } else if (gameData.playerBlack === user.uid) {
        setPlayerColor('black');
        setOrientation('black');
      } else if (!gameData.playerBlack) {
        // If second player slot is open, this may be a visitor opening a shared link
        setPlayerColor(null);
      } else {
        // If both player slots are filled and user is neither, they're a spectator
        setPlayerColor('spectator');
      }

      // Update game status
      updateGameStatus(newChess, gameData);
    });

    return () => unsubscribe();
  }, [currentGameId, user]);

  const updateGameStatus = (chessInstance, gameData) => {
    if (chessInstance.isCheckmate()) {
      setGameStatus(`Checkmate! ${chessInstance.turn() === 'w' ? 'Black' : 'White'} wins!`);
    } else if (chessInstance.isDraw()) {
      setGameStatus('Game ended in a draw');
    } else if (chessInstance.isStalemate()) {
      setGameStatus('Game ended in a stalemate');
    } else if (chessInstance.isThreefoldRepetition()) {
      setGameStatus('Game ended by threefold repetition');
    } else if (chessInstance.isInsufficientMaterial()) {
      setGameStatus('Game ended due to insufficient material');
    } else {
      setGameStatus(`${chessInstance.turn() === 'w' ? 'White' : 'Black'}'s turn`);
    }
  };

  const createNewGame = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const newGameId = `game_${nanoid(8)}`;
      const newChess = new Chess(); // Create fresh game
      
      const gameData = {
        gameId: newGameId,
        playerWhite: user.uid,
        playerWhiteName: user.displayName || 'Player 1',
        playerBlack: null,
        playerBlackName: null,
        fen: newChess.fen(),
        turn: 'w',
        status: 'waiting',
        moveHistory: [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      // Create the game document in Firestore
      await setDoc(doc(db, 'games', newGameId), gameData);
      
      // Update URL with gameId without full reload
      const newUrl = `${window.location.origin}${window.location.pathname}?game=${newGameId}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
      
      setCurrentGameId(newGameId);
      setGameLink(newUrl);
      setPlayerColor('white');
      setOrientation('white');
      setChess(newChess);
      setPosition(newChess.fen());
    } catch (error) {
      console.error('Error creating game:', error);
      setError(`Failed to create game: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const joinGame = async (gameId) => {
    if (!user || !gameId) return;
    setIsLoading(true);
    setError(null);

    try {
      const gameRef = doc(db, 'games', gameId);
      const gameSnapshot = await doc(db, 'games', gameId).get();
      
      if (!gameSnapshot.exists()) {
        setError('Game not found');
        setIsLoading(false);
        return;
      }

      const gameData = gameSnapshot.data();
      
      // Check if player is already in the game
      if (gameData.playerWhite === user.uid) {
        // Player is already white, just update UI
        setPlayerColor('white');
        setOrientation('white');
      } else if (gameData.playerBlack === user.uid) {
        // Player is already black, just update UI
        setPlayerColor('black');
        setOrientation('black');
      } else if (!gameData.playerBlack) {
        // Player joins as black if position is open
        await updateDoc(gameRef, {
          playerBlack: user.uid,
          playerBlackName: user.displayName || 'Player 2',
          status: 'active',
          lastUpdated: new Date().toISOString()
        });
        setPlayerColor('black');
        setOrientation('black');
      } else {
        // Both positions filled, join as spectator
        setPlayerColor('spectator');
      }
    } catch (error) {
      console.error('Error joining game:', error);
      setError(`Failed to join game: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const makeMove = async (move) => {
    if (!currentGameId || !game || !user) return false;
    
    // Check if it's the player's turn
    const isWhiteTurn = chess.turn() === 'w';
    if ((isWhiteTurn && playerColor !== 'white') || (!isWhiteTurn && playerColor !== 'black')) {
      return false; // Not this player's turn
    }
    
    // Try to make the move
    try {
      const result = chess.move(move);
      if (!result) return false; // Illegal move
      
      // Update the game in Firestore
      const gameRef = doc(db, 'games', currentGameId);
      await updateDoc(gameRef, {
        fen: chess.fen(),
        turn: chess.turn(),
        moveHistory: [...game.moveHistory, result.san],
        lastUpdated: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Move error:', error);
      return false;
    }
  };

  const copyGameLink = () => {
    navigator.clipboard.writeText(gameLink)
      .then(() => alert('Game link copied to clipboard!'))
      .catch(err => console.error('Failed to copy link:', err));
  };

  const onDrop = (sourceSquare, targetSquare) => {
    // Allow drops only if it's user's turn
    if (
      (chess.turn() === 'w' && playerColor !== 'white') || 
      (chess.turn() === 'b' && playerColor !== 'black')
    ) {
      return false;
    }
    
    // Get the move in the expected format
    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q' // Always promote to a queen for simplicity
    };
    
    return makeMove(move);
  };

  // Render game UI
  return (
    <div className="game-container">
      {error && <div className="game-error">{error}</div>}
      
      {!currentGameId && (
        <div className="game-setup">
          <button 
            onClick={createNewGame} 
            disabled={isLoading}
            className="new-game-button"
          >
            {isLoading ? 'Creating...' : 'Start New Game'}
          </button>
        </div>
      )}
      
      {currentGameId && (
        <>
          <div className="game-info">
            <h2>{game?.status === 'waiting' ? 'Waiting for opponent' : 'Game in progress'}</h2>
            <p className="game-status">{gameStatus}</p>
            
            {gameLink && (
              <div className="share-link">
                <p>Share this link with your opponent:</p>
                <div className="link-container">
                  <input type="text" value={gameLink} readOnly />
                  <button onClick={copyGameLink}>Copy</button>
                </div>
              </div>
            )}
            
            <div className="players-info">
              <div className="player white">
                <span className="dot white"></span>
                <span>{game?.playerWhiteName || 'White'}</span>
                {playerColor === 'white' && <span className="you-indicator">(You)</span>}
              </div>
              <div className="player black">
                <span className="dot black"></span>
                <span>{game?.playerBlackName || 'Waiting for player...'}</span>
                {playerColor === 'black' && <span className="you-indicator">(You)</span>}
              </div>
            </div>
          </div>
          
          <div className="chessboard-container">
            <Chessboard 
              position={position} 
              onPieceDrop={onDrop}
              boardOrientation={orientation}
              boardWidth={Math.min(600, window.innerWidth - 40)}
              areArrowsAllowed={true}
              customBoardStyle={{
                borderRadius: '4px',
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)'
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default Game;