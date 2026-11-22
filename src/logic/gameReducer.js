export const GRID_SIZE = 10

export const RESPAWN_CORNERS = [
  { x: 0, y: GRID_SIZE - 1 },
  { x: GRID_SIZE - 1, y: GRID_SIZE - 1 },
  { x: GRID_SIZE - 1, y: 0 },
]

const ORTHOGONAL = [
  { dx: 0, dy: 1 },
  { dx: 0, dy: -1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
]

export function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE
}

export function sameCell(a, b) {
  return a.x === b.x && a.y === b.y
}

export function chebyshev(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))
}

export function isOrthogonalNeighbor(from, x, y) {
  return Math.abs(from.x - x) + Math.abs(from.y - y) === 1
}

export function canStrike(state) {
  return !state.trackerReveal && state.status === 'playing' && chebyshev(state.player, state.enemy) === 1
}

export function createInitialState() {
  return {
    player: { x: 0, y: 0 },
    enemy: { x: GRID_SIZE - 1, y: GRID_SIZE - 1 },
    turns: 0,
    status: 'playing',
    trackerReveal: true,
    log: 'The hunt begins. The enemy is hidden.',
    flash: null,
  }
}

function stepToward(from, to) {
  if (from === to) return from
  return from + Math.sign(to - from)
}

function validSteps(pos) {
  return ORTHOGONAL.filter((dir) => inBounds(pos.x + dir.dx, pos.y + dir.dy))
}

function pickIndex(roll, length) {
  const value = Number.isFinite(roll) ? roll : 0
  const unit = ((value % 1) + 1) % 1
  return Math.min(length - 1, Math.floor(unit * length))
}

function chase(enemy, player, roll) {
  let next = { ...enemy }

  if (next.y !== player.y) {
    next = { ...next, y: stepToward(next.y, player.y) }
    if (sameCell(next, player)) return { enemy: next, caught: true }
  }

  if (next.x !== player.x) {
    next = { ...next, x: stepToward(next.x, player.x) }
    if (sameCell(next, player)) return { enemy: next, caught: true }
  }

  const options = validSteps(next)
  if (options.length > 0) {
    const index = pickIndex(roll, options.length)
    const dir = options[index]
    next = { x: next.x + dir.dx, y: next.y + dir.dy }
    if (sameCell(next, player)) return { enemy: next, caught: true }
  }

  return { enemy: next, caught: false }
}

function moveName(dx, dy) {
  if (dy === 1) return 'up'
  if (dy === -1) return 'down'
  if (dx === -1) return 'left'
  return 'right'
}

function respawnAt(player, roll) {
  const corners = RESPAWN_CORNERS.filter((corner) => !sameCell(corner, player))
  return { ...corners[pickIndex(roll, corners.length)] }
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'MOVE': {
      if (state.status !== 'playing') return state
      const dx = action.dx
      const dy = action.dy
      if (Math.abs(dx) + Math.abs(dy) !== 1) return state

      const player = { x: state.player.x + dx, y: state.player.y + dy }
      if (!inBounds(player.x, player.y)) return state

      if (sameCell(player, state.enemy)) {
        return {
          ...state,
          player,
          flash: null,
          status: 'gameover',
          log: 'You stepped onto the enemy.',
        }
      }

      const { enemy, caught } = chase(state.enemy, player, action.roll)
      if (caught) {
        return {
          ...state,
          player,
          enemy,
          flash: null,
          status: 'gameover',
          log: 'The enemy caught you.',
        }
      }

      const turns = state.turns + 1
      return {
        ...state,
        player,
        enemy,
        flash: null,
        turns,
        trackerReveal: turns % 7 === 0,
        log: `Moved ${moveName(dx, dy)}. The enemy closed in.`,
      }
    }

    case 'STRIKE': {
      if (!canStrike(state)) return state
      return {
        ...state,
        flash: { x: state.enemy.x, y: state.enemy.y },
        enemy: respawnAt(state.player, action.roll),
        log: 'You struck. It vanished and reformed in a corner.',
      }
    }

    case 'CLEAR_FLASH': {
      if (!state.flash) return state
      return { ...state, flash: null }
    }

    case 'CLEAR_TRACKER_REVEAL': {
      if (!state.trackerReveal) return state
      return { ...state, trackerReveal: false }
    }

    case 'RESTART':
      return createInitialState()

    default:
      return state
  }
}
