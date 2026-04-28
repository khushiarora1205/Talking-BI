import { Menu, X } from 'lucide-react'

export function SidebarToggle({ isOpen, setIsOpen }) {
  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={`md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg transition-all duration-300 ${
        isOpen ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}
    >
      {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
    </button>
  )
}
