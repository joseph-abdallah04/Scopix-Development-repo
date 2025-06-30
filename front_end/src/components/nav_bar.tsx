import { useLocation, useNavigate } from "react-router-dom"
import { FiSettings, FiTable, FiVideo } from "react-icons/fi"

function NavBar() {
  const location = useLocation()
  const navigate = useNavigate()

  const baseBtn =
    "px-4 py-2 transition-colors duration-200 text-sm md:text-base items-center gap-3 rounded-lg"
  const activeStyle = "bg-blue-600 text-white"
  const inactiveStyle = "text-gray-300 hover:bg-gray-700"

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="fixed top-4 left-8 right-8 z-50">
      <div className="bg-[#232a36]/75 backdrop-blur rounded-2xl px-6 py-2 shadow-[0_8px_25px_rgba(148,163,184,0.25)] border border-gray-500/30
 flex justify-center relative">
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
          className="absolute top-1/2 -translate-y-1/2 right-6 text-gray-400 hover:text-blue-500 transition-colors transition-transform duration-300 hover:rotate-90"
          title="Settings"
        >
          <FiSettings className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

export default NavBar

