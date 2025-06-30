import React, { useState } from 'react'

function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true)
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  const handleReset = () => {
    setDarkMode(true)
    setExpandedFAQ(null)
  }

  const handleApply = () => {
    console.log('Settings applied:', { darkMode })
  }

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index)
  }

  const faqs = [
    {
      question: "How do I upload a CSV file?",
      answer: "Click on the 'CSV Upload' tab in the navigation bar, then click 'Choose file' to select your CSV file from your computer. Make sure your file follows the required format."
    },
    {
      question: "What video formats are supported?",
      answer: "Currently, we support MP4 video files. Make sure your video file is in MP4 format before uploading."
    },
    {
      question: "How do I analyse my uploaded data?",
      answer: "After uploading your file, click the 'Analyse' button. The system will process your data and provide detailed analysis results."
    },
    {
      question: "Can I export my analysis results?",
      answer: "Yes, you can export your analysis results in various formats including PDF, CSV and Excel. Use the export options available after analysis."
    }
  ]

  return (
    <div className="w-screen h-screen min-h-screen bg-black text-white flex flex-col pt-16 box-border overflow-y-auto">
      <div className="flex flex-col items-center px-6 py-10 max-w-2xl w-full mx-auto flex-1">
        <h1 className="text-4xl font-light mb-12 w-full border-b border-white pb-2 text-left">Settings</h1>

        <div className="w-full flex flex-col gap-8 mb-16">
          <div className="w-full">
            <h2 className="text-xl font-medium text-white mb-6 border-b border-white/30 pb-2">Display Settings</h2>
            <div className="flex items-center gap-4 py-4">
              <label className="text-lg text-white/90">Enable Dark Mode</label>
              <div className="relative inline-block">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={() => setDarkMode(!darkMode)}
                  className="sr-only peer"
                />
                <div className="w-[60px] h-[34px] bg-gray-600 peer-checked:bg-blue-600 rounded-full transition-colors relative cursor-pointer">
                  <div className="absolute w-[26px] h-[26px] bg-white rounded-full left-1 bottom-1 transition-transform peer-checked:translate-x-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="w-full">
            <h2 className="text-xl font-medium text-white mb-6 border-b border-white/30 pb-2">FAQ</h2>
            <div className="flex flex-col gap-4">
              {faqs.map((faq, index) => (
                <div key={index} className="rounded-md border border-gray-700 bg-[#1a1a1a] overflow-hidden">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full text-left text-white flex justify-between items-center px-6 py-4 hover:bg-white/5"
                  >
                    <span className="text-base">{faq.question}</span>
                    <span className={`text-blue-500 transition-transform ${expandedFAQ === index ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  {expandedFAQ === index && (
                    <div className="px-6 py-4 border-t border-gray-700 bg-white/5 text-white/80 text-sm leading-relaxed animate-fade-in">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full flex justify-center gap-6 mt-auto flex-wrap">
          <button
            onClick={handleReset}
            className="bg-white text-black rounded-full px-6 py-3 text-base font-medium hover:bg-gray-100 transition"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="bg-blue-600 text-white rounded-full px-6 py-3 text-base font-medium hover:bg-blue-700 transition"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage

