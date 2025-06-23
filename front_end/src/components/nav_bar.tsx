import './nav_bar.css';

interface NavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function NavBar({ activeTab, onTabChange }: NavBarProps) {
  return (
    <div className="navbar">
      <button 
        className={`nav-btn ${activeTab === 'csv' ? 'active' : ''}`}
        onClick={() => onTabChange('csv')}
      >
        CSV Upload
      </button>
      <button 
        className={`nav-btn ${activeTab === 'video' ? 'active' : ''}`}
        onClick={() => onTabChange('video')}
      >
        Video Upload
      </button>

      <button
        className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => onTabChange('settings')}
      >
        Settings
      </button>
    </div>
  )
}

export default NavBar
/* Line 7- active= make title blue */

