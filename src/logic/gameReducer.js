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
    enemyPath: [{ x: GRID_SIZE - 1, y: GRID_SIZE - 1 }],
    bloodTrail: null,
    strikeZone: null,
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
  const path = []

  if (next.y !== player.y) {
    next = { ...next, y: stepToward(next.y, player.y) }
    path.push({ ...next })
    if (sameCell(next, player)) return { enemy: next, path, caught: true }
  }

  if (next.x !== player.x) {
    next = { ...next, x: stepToward(next.x, player.x) }
    path.push({ ...next })
    if (sameCell(next, player)) return { enemy: next, path, caught: true }
  }

  const options = validSteps(next)
  if (options.length > 0) {
    const index = pickIndex(roll, options.length)
    const dir = options[index]
    next = { x: next.x + dir.dx, y: next.y + dir.dy }
    path.push({ ...next })
    if (sameCell(next, player)) return { enemy: next, path, caught: true }
  }

  return { enemy: next, path, caught: false }
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
      if (state.status !== 'playing' || state.strikeZone) return state
      const dx = action.dx
      const dy = action.dy
      if (Math.abs(dx) + Math.abs(dy) !== 1) return state

      const player = { x: state.player.x + dx, y: state.player.y + dy }
      if (!inBounds(player.x, player.y)) return state

      if (sameCell(player, state.enemy)) {
        const bloodTrail = [...state.enemyPath, { x: state.enemy.x, y: state.enemy.y }].filter((cell, index, cells) =>
          cells.findIndex((other) => other.x === cell.x && other.y === cell.y) === index,
        )
        return {
          ...state,
          player,
          enemy: state.enemy,
          enemyPath: bloodTrail,
          bloodTrail,
          flash: null,
          status: 'gameover',
          log: 'You stepped onto the enemy.',
        }
      }

      const { enemy, path, caught } = chase(state.enemy, player, action.roll)
      if (caught) {
        const bloodTrail = [
          ...state.enemyPath,
          { x: state.enemy.x, y: state.enemy.y },
          ...path,
          { x: enemy.x, y: enemy.y },
        ].filter((cell, index, cells) =>
          cells.findIndex((other) => other.x === cell.x && other.y === cell.y) === index,
        )
        return {
          ...state,
          player,
          enemy,
          enemyPath: bloodTrail,
          bloodTrail,
          flash: null,
          status: 'gameover',
          log: 'The enemy caught you.',
        }
      }

      const turns = state.turns + 1
      const enemyPath = [...state.enemyPath]
      for (const position of path) {
        const previous = enemyPath[enemyPath.length - 1]
        if (!previous || previous.x !== position.x || previous.y !== position.y) {
          enemyPath.push({ ...position })
        }
      }
      return {
        ...state,
        player,
        enemy,
        enemyPath,
        flash: null,
        bloodTrail: null,
        turns,
        trackerReveal: turns % 7 === 0,
        log: `Moved ${moveName(dx, dy)}. The enemy closed in.`,
      }
    }

    case 'STRIKE': {
      if (state.status !== 'playing' || state.trackerReveal) return state
      const startingCorner = { x: state.enemy.x, y: state.enemy.y }
      const strikeZone = []
      for (let dx = -1; dx <= 1; dx += 1) {
        for (let dy = -1; dy <= 1; dy += 1) {
          if (dx === 0 && dy === 0) continue
          const x = state.player.x + dx
          const y = state.player.y + dy
          if (inBounds(x, y)) strikeZone.push({ x, y })
        }
      }
      if (!canStrike(state)) {
        return {
          ...state,
          strikeZone,
        }
      }

      const respawn = respawnAt(state.player, action.roll)
      const trail = [...state.enemyPath, startingCorner].filter((cell, index, cells) =>
        cells.findIndex((other) => other.x === cell.x && other.y === cell.y) === index,
      )
      return {
        ...state,
        flash: startingCorner,
        strikeZone,
        enemy: respawn,
        bloodTrail: trail,
        enemyPath: [respawn],
        log: 'You struck. It vanished and reformed in a corner.',
      }
    }

    case 'CLEAR_STRIKE_ZONE': {
      if (!state.strikeZone) return state
      return { ...state, strikeZone: null }
    }

    case 'CLEAR_BLOOD_TRAIL': {
      if (state.status === 'gameover') return state
      if (!state.bloodTrail) return state
      return { ...state, bloodTrail: null }
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
