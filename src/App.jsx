import { useEffect, useReducer, useState } from 'react'
import Grid from './components/Grid'
import {
  canStrike,
  createInitialState,
  gameReducer,
  inBounds,
} from './logic/gameReducer'
import './App.css'

const TRACKER_REVEAL_MS = 500

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
  const trackerReveal = state.trackerReveal

  function moveBy(dx, dy) {
    if (trackerReveal) return
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
    if (!state.bloodTrail) return undefined
    const id = setTimeout(() => dispatch({ type: 'CLEAR_BLOOD_TRAIL' }), 500)
    return () => clearTimeout(id)
  }, [state.bloodTrail])

  useEffect(() => {
    if (state.status !== 'playing' || !trackerReveal) return undefined

    const id = setTimeout(() => dispatch({ type: 'CLEAR_TRACKER_REVEAL' }), TRACKER_REVEAL_MS)
    return () => clearTimeout(id)
  }, [state.status, trackerReveal])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Enter' && state.status === 'gameover') {
        event.preventDefault()
        dispatch({ type: 'RESTART' })
        return
      }

      if (trackerReveal) return

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
  }, [state, trackerReveal])

  return (
    <main className="app">
      <header className="hud">
        <div className="title-row">
          <h1>Tracker</h1>
          <p className="tagline"><span className="tagline-threat">You can run, but you can't hide. I'll find you...</span></p>
          <p className="tagline"><span className="tagline-threat">Just when you think it's over, I'm standing right behind you...</span></p>
        </div>

        <div className="stats">
          <div>
            <span className="stat-label">Distance Traveled</span>
            <strong className="stat-value">{state.turns} steps</strong>
          </div>
          <button
            type="button"
            className={debugReveal ? 'reveal-switch on' : 'reveal-switch'}
            role="switch"
            aria-label="Reveal tracker"
            aria-checked={debugReveal}
            onClick={() => setDebugReveal((open) => !open)}
          >
            <span>Reveal</span>
            <span className="switch-track" aria-hidden="true">
              <span className="switch-thumb" />
            </span>
          </button>
        </div>
      </header>

      <div className="board-wrap">
        <Grid
          player={state.player}
          enemy={state.enemy}
          reveal={debugReveal || trackerReveal}
          lightsOut={trackerReveal && state.turns > 0 && state.turns % 7 === 0}
          paused={trackerReveal}
          flash={state.flash}
          bloodTrail={state.bloodTrail}
          status={state.status}
          onCellClick={onCellClick}
        />
        {state.status === 'gameover' && (
          <div className="game-over">
            <h2>You're dead</h2>
            <p>You survived {state.turns} steps.</p>
            <button type="button" onClick={() => dispatch({ type: 'RESTART' })}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

export default App
