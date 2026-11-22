import { useEffect, useReducer, useState } from 'react'
import Grid from './components/Grid'
import {
  canStrike,
  createInitialState,
  gameReducer,
  inBounds,
} from './logic/gameReducer'
import './App.css'

const KEY_MOVES = {
  arrowup: [0, 1],
  w: [0, 1],
  arrowdown: [0, -1],
  s: [0, -1],
  arrowleft: [-1, 0],
  a: [-1, 0],
  arrowright: [1, 0],
  d: [1, 0],
}

function App() {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState)
  const [debugReveal, setDebugReveal] = useState(false)

  function moveBy(dx, dy) {
    if (state.status !== 'playing') return
    if (!inBounds(state.player.x + dx, state.player.y + dy)) return
    dispatch({
      type: 'MOVE',
      dx,
      dy,
      roll: Math.random(),
    })
  }

  function onCellClick(x, y) {
    moveBy(x - state.player.x, y - state.player.y)
  }

  useEffect(() => {
    if (!state.flash) return undefined
    const id = setTimeout(() => dispatch({ type: 'CLEAR_FLASH' }), 450)
    return () => clearTimeout(id)
  }, [state.flash])

  useEffect(() => {
    function onKeyDown(event) {
      const move = KEY_MOVES[event.key.toLowerCase()]
      if (move) {
        event.preventDefault()
        const [dx, dy] = move
        if (state.status !== 'playing') return
        if (!inBounds(state.player.x + dx, state.player.y + dy)) return
        dispatch({ type: 'MOVE', dx, dy, roll: Math.random() })
        return
      }
      if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault()
        if (!canStrike(state)) return
        dispatch({ type: 'STRIKE', roll: Math.random() })
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [state])

  return (
    <main className="app">
      <header className="hud">
        <div className="title-row">
          <h1>Tracker</h1>
          <p className="tagline">You can run, but you can't hide. I'll find you...</p>
          <p className="tagline">Just when you think it's over, I'm standing right behind you...</p>
        </div>

        <div className="stats">
          <div>
            <span className="stat-label">Distance Traveled</span>
            <strong className="stat-value">{state.turns} steps</strong>
          </div>
        </div>

        <p className="log" role="status">
          {state.log}
        </p>

        <div className="actions">
          <button
            type="button"
            className={debugReveal ? 'toggle on' : 'toggle'}
            aria-pressed={debugReveal}
            onClick={() => setDebugReveal((open) => !open)}
          >
            Debug: Reveal Enemy
          </button>
        </div>
      </header>

      <div className="board-wrap">
        <Grid
          player={state.player}
          enemy={state.enemy}
          reveal={debugReveal}
          flash={state.flash}
          status={state.status}
          onCellClick={onCellClick}
        />
        {state.status === 'gameover' && (
          <div className="game-over">
            <h2>Game over</h2>
            <p>{state.log}</p>
            <button type="button" onClick={() => dispatch({ type: 'RESTART' })}>
              Restart
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

export default App
