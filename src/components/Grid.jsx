import { GRID_SIZE, isOrthogonalNeighbor } from '../logic/gameReducer'

const ROWS = Array.from({ length: GRID_SIZE }, (_, index) => GRID_SIZE - 1 - index)
const COLS = Array.from({ length: GRID_SIZE }, (_, index) => index)

export default function Grid({ player, enemy, reveal, lightsOut, trackerNearPlayer, paused, flash, bloodTrail, strikeZone, status, onCellClick }) {
  const gridClass = status === 'gameover'
    ? 'grid lights-out game-over-grid'
    : lightsOut
      ? 'grid lights-out'
      : trackerNearPlayer
      ? 'grid tracker-near-player flashlight'
      : 'grid flashlight'
  const flashlightX = ((player.x + 0.5) / GRID_SIZE) * 100
  const flashlightY = ((GRID_SIZE - player.y - 0.5) / GRID_SIZE) * 100

  return (
    <div
      className={gridClass}
      role="grid"
      aria-label="Board"
      style={{ '--flashlight-x': `${flashlightX}%`, '--flashlight-y': `${flashlightY}%` }}
    >
      {ROWS.flatMap((y) =>
        COLS.map((x) => {
          const overlapAtGameOver =
            status === 'gameover' && player.x === x && player.y === y && enemy.x === x && enemy.y === y
          const playerHere = status !== 'gameover' && !lightsOut && player.x === x && player.y === y && !overlapAtGameOver
          const enemyHere = enemy.x === x && enemy.y === y
          const flashHere = flash?.x === x && flash?.y === y
          const bloodHere = bloodTrail?.some((cell) => cell.x === x && cell.y === y)
          const strikeZoneHere = !bloodHere && strikeZone?.some((cell) => cell.x === x && cell.y === y)
          const playerDistance = Math.max(Math.abs(player.x - x), Math.abs(player.y - y))
          const diagonalNear =
            playerDistance === 1 && x !== player.x && y !== player.y
          const showEnemy = overlapAtGameOver || (reveal && enemyHere) || flashHere
          const clickable = !paused && status === 'playing' && isOrthogonalNeighbor(player, x, y)
          const className = [
            'cell',
            playerHere ? 'cell-player' : '',
            showEnemy ? 'cell-enemy' : '',
            flashHere ? 'cell-flash' : '',
            bloodHere ? 'cell-blood-trail' : '',
            strikeZoneHere ? 'cell-strike-zone' : '',
            playerDistance === 0 ? 'cell-flashlight-center' : '',
            playerDistance === 1 && !diagonalNear ? 'cell-flashlight-near' : '',
            clickable ? 'cell-move' : '',
          ]
            .filter(Boolean)
            .join(' ')

          const lightX = x < player.x ? '100%' : x > player.x ? '0%' : '50%'
          const lightY = y > player.y ? '100%' : y < player.y ? '0%' : '50%'

          return (
            <button
              key={`${x},${y}`}
              type="button"
              className={className}
              style={{ '--light-x': lightX, '--light-y': lightY }}
              disabled={!clickable}
              aria-label={
                showEnemy
                  ? `Enemy at ${x}, ${y}`
                  : playerHere
                    ? `You at ${x}, ${y}`
                    : `Cell ${x}, ${y}`
              }
              onClick={() => onCellClick(x, y)}
            />
          )
        }),
      )}
    </div>
  )
}
