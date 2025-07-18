import { useLocation, useNavigate } from "react-router-dom"
import { FiSettings, FiTable, FiVideo } from "react-icons/fi"
import { useTheme } from "../contexts/theme-context"

function NavBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()

  const baseBtn =
    "px-4 py-2 transition-colors duration-200 text-sm md:text-base items-center gap-3 rounded-lg"
  const activeStyle = "bg-blue-600 text-white"
  const inactiveStyle = isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-200 hover:bg-gray-600"

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="fixed top-4 left-8 right-8 z-50">
      <div className={`backdrop-blur rounded-2xl px-6 py-2 border flex justify-center relative transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-[#232a36]/75 border-gray-500/30 shadow-[0_8px_25px_rgba(148,163,184,0.25)]' 
          : 'bg-[#4a5568]/90 border-gray-400/50 shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
      }`}>
	<div className="flex items-center gap-16">
	  <button
	    className={`${baseBtn} ${isActive("/csv-upload") ? activeStyle : inactiveStyle}`}
	    onClick={() => navigate("/csv-upload")}
	  >
	    <span className="inline-flex items-center gap-2 transition-transform duration-100 ease-out active:scale-95">
	      <FiTable className="w-5 h-5 relative top-[1px]" />
	      CSV Upload
	    </span>
	  </button>

	  <button
	    className={`${baseBtn} ${isActive("/video-upload") ? activeStyle : inactiveStyle}`}
	    onClick={() => navigate("/video-upload")}
	  >
	    <span className="inline-flex items-center gap-2 transition-transform duration-100 ease-out active:scale-95">
	      <FiVideo className="w-5 h-5 relative top-[1px]" />
	      Video Upload
	    </span>
	  </button>
	</div>

        <button
          onClick={() => navigate("/settings")}
          className={`${baseBtn} ${isActive("/settings") ? activeStyle : inactiveStyle} absolute top-1/2 -translate-y-1/2 right-6`}
          title="Settings"
        >
          <FiSettings className="w-5 h-5 transition-transform duration-300 hover:rotate-90" />
        </button>
      </div>
    </div>
  )
}

export default NavBar

