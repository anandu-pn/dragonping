import './DragonLoader.css'
import dragonLogo from '../../resources/dragonping-logo-removebg-preview.png'

function DragonLoader() {
  return (
    <div className="dragon-loader-container">
      <div className="dragon-loader-content">
        {/* Dragon Logo */}
        <div className="dragon-logo-wrapper">
          <img
            src={dragonLogo}
            alt="DragonPing Loading"
            className="dragon-logo"
          />
          
          {/* Animated Flame Below Dragon */}
          <div className="flame-container">
            <div className="flame flame-inner"></div>
            <div className="flame flame-middle"></div>
            <div className="flame flame-outer"></div>
          </div>

          {/* Glow Effect */}
          <div className="dragon-glow"></div>
        </div>

        {/* Loading Text */}
        <div className="loading-text">
          <p>DragonPing initializing...</p>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DragonLoader
