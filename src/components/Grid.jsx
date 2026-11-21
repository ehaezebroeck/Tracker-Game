import { GRID_SIZE, isOrthogonalNeighbor } from '../logic/gameReducer'

const ROWS = Array.from({ length: GRID_SIZE }, (_, index) => GRID_SIZE - 1 - index)
const COLS = Array.from({ length: GRID_SIZE }, (_, index) => index)

export default function Grid({ player, enemy, reveal, flash, status, onCellClick }) {
  return (
    <div className="grid" role="grid" aria-label="Board">
      {ROWS.flatMap((y) =>
        COLS.map((x) => {
          const playerHere = player.x === x && player.y === y
          const enemyHere = enemy.x === x && enemy.y === y
          const flashHere = flash?.x === x && flash?.y === y
          const showEnemy = (reveal && enemyHere) || flashHere
          const clickable = status === 'playing' && isOrthogonalNeighbor(player, x, y)
          const className = [
            'cell',
            playerHere ? 'cell-player' : '',
            showEnemy ? 'cell-enemy' : '',
            flashHere ? 'cell-flash' : '',
            clickable ? 'cell-move' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <button
              key={`${x},${y}`}
              type="button"
              className={className}
              disabled={!clickable}
              aria-label={
                playerHere
                  ? `You at ${x}, ${y}`
                  : showEnemy
                    ? `Enemy at ${x}, ${y}`
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
