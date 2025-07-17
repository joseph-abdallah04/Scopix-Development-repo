import { useState } from 'react'
import { useTheme } from '../contexts/theme-context'

function SettingsPage() {
  const { isDarkMode, toggleTheme } = useTheme()
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set()) // All sections closed by default

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId)
  }

  const toggleSection = (sectionIndex: number) => {
    const newExpandedSections = new Set(expandedSections)
    if (newExpandedSections.has(sectionIndex)) {
      newExpandedSections.delete(sectionIndex)
      // Close any open FAQ in this section when collapsing
      if (expandedFAQ?.startsWith(`${sectionIndex}-`)) {
        setExpandedFAQ(null)
      }
    } else {
      newExpandedSections.add(sectionIndex)
    }
    setExpandedSections(newExpandedSections)
  }

  const faqSections = [
    {
      title: "Analysis",
      faqs: [
        {
          question: "How long does analysis take?",
          answer: "Analysis time varies depending on file size and complexity. Most analyses complete within 1-5 minutes."
        },
        {
          question: "What graphs and metrics are generated in CSV Analysis?",
          answer: `Graph:
The software outputs graphs comparing R5, X5 and Volume over Time.
Cursor can be hovered on the graph to identify the specific data-point for each value. The user can also filter the graph curves displayed by clicking on R5, X5 or Volume to view the preferred values on the graph.

Table:
Table of data including:
• TOTAL values for R5, X5, R5-19
• INSP values for R5, X5, R5-19
• EXP values for R5, X5, R5-19
• MAX-MIN values for R5, X5, R5-19`
        },
        {
          question: "Can I undo plotted points on Video Analysis?",
          answer: `Yes, undo functionality is supported for flexible editing.
• Windows: Ctrl + Z 
• MacOS: Command + Z`
        },
        {
          question: "How does the manual measurement tool in Video Analysis work?",
          answer: `While the video is paused, you can select the measurement tool and plot points on the glottic/supraglottic and vocal cords structures. 
The software will calculate the enclosed area and percentage closure based on your baseline reference. Any frame in the video can be chosen as your baseline reference.`
        }
      ]
    },
    {
      title: "Results & Export",
      faqs: [
        {
          question: "Are results saved in the app?",
          answer: `No. Once the CSV file is processed, you are prompted to save the output as a .PDF or .XLSX, but the data is not retained within the app.`
        },
        {
          question: "Can I export the analysis results and what formats are supported?",
          answer: `You can export all the performed results as a PDF or Excel file. Use the export options available after analysis.`
        }
      ]
    },
    {
      title: "Data Storage & Privacy",
      faqs: [
        {
          question: "Does the app store patient data?",
          answer: `No. All analysis happens locally on your machine. Nothing is stored after a session unless you manually export the results. 
All data should be de-identified before uploading.`
        },
        {
          question: "Can I save a session and return to it later?",
          answer: `No; currently all sessions are temporary and cleared upon exit unless exported.`
        }
      ]
    },
    {
      title: "Troubleshooting",
      faqs: [
        {
          question: "My CSV analysis doesn't work, what should I do?",
          answer: `Ensure the CSV:
• Is not corrupted
• Is locally accessible
• Uses the correct column headers
• Check that your file meets the size requirements: 2GB

If problems persist, try restarting the app.`
        },
        {
          question: "My video won't load, what should I do?",
          answer: `Ensure the file is:
• In the correct format (MP4)
• Not corrupted
• Locally accessible
• Check that your file meets the size requirements: 2GB

If problems persist, try restarting the app.`
        }
      ]
    }
  ]

  return (
    <div className={`w-screen h-screen min-h-screen flex flex-col pt-24 box-border overflow-y-auto transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-black text-white' 
        : 'bg-white text-gray-900'
    }`}>
      <div className="flex flex-col items-center px-6 py-10 max-w-2xl w-full mx-auto flex-1">
        <h1 className={`text-4xl font-light mb-12 w-full pb-2 text-left border-b transition-colors duration-300 ${
          isDarkMode 
            ? 'border-white text-white' 
            : 'border-gray-300 text-gray-900'
        }`}>Settings</h1>

        <div className="w-full flex flex-col gap-8 mb-16">
          <div className="w-full">
            <h2 className={`text-xl font-medium mb-3 pb-2 border-b transition-colors duration-300 ${
              isDarkMode 
                ? 'text-white border-white/30' 
                : 'text-gray-900 border-gray-300'
            }`}>Display Settings</h2>
            <div className="flex items-center gap-4 py-4">
              <label className={`text-lg transition-colors duration-300 ${
                isDarkMode 
                  ? 'text-white/90' 
                  : 'text-gray-700'
              }`}>Enable Dark Mode</label>
              <div className="relative inline-block">
                <input
                  type="checkbox"
                  checked={isDarkMode}
                  onChange={toggleTheme}
                  className="sr-only peer"
                />
                <div 
                  className={`w-[60px] h-[34px] rounded-full transition-colors relative cursor-pointer ${isDarkMode ? 'bg-blue-600' : 'bg-gray-600'}`}
                  onClick={toggleTheme}
                >
                  <div className={`absolute w-[26px] h-[26px] bg-white rounded-full left-1 top-1 transition-transform duration-200 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </div>
            </div>
          </div>

          <div className="w-full">
            <h2 className={`text-xl font-medium mb-6 pb-2 border-b transition-colors duration-300 ${
              isDarkMode 
                ? 'text-white border-white/30' 
                : 'text-gray-900 border-gray-300'
            }`}>FAQ</h2>
            <div className="flex flex-col gap-6">
              {faqSections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="flex flex-col gap-3">
                  <button
                    onClick={() => toggleSection(sectionIndex)}
                    className={`text-left flex justify-between items-center py-2 transition-colors duration-300 ${
                      isDarkMode 
                        ? 'text-blue-400 hover:text-blue-300' 
                        : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    <h3 className="text-lg font-medium">{section.title}</h3>
                    <span className={`text-blue-500 transition-transform ${expandedSections.has(sectionIndex) ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  {expandedSections.has(sectionIndex) && (
                    <div className="flex flex-col gap-3 animate-fade-in">
                      {section.faqs.map((faq, faqIndex) => {
                        const faqId = `${sectionIndex}-${faqIndex}`;
                        return (
                          <div key={faqId} className={`rounded-md border overflow-hidden transition-colors duration-300 ${
                            isDarkMode 
                              ? 'border-gray-700 bg-[#1a1a1a]' 
                              : 'border-gray-300 bg-gray-50'
                          }`}>
                            <button
                              onClick={() => toggleFAQ(faqId)}
                              className={`w-full text-left flex justify-between items-center px-6 py-4 transition-colors duration-300 ${
                                isDarkMode 
                                  ? 'text-white hover:bg-white/5' 
                                  : 'text-gray-900 hover:bg-gray-100'
                              }`}
                            >
                              <span className="text-base">{faq.question}</span>
                              <span className={`text-blue-500 transition-transform ${expandedFAQ === faqId ? 'rotate-180' : ''}`}>
                                ▼
                              </span>
                            </button>
                            {expandedFAQ === faqId && (
                              <div className={`px-6 py-4 border-t text-sm leading-relaxed animate-fade-in transition-colors duration-300 ${
                                isDarkMode 
                                  ? 'border-gray-700 bg-white/5 text-white/80' 
                                  : 'border-gray-300 bg-gray-100 text-gray-700'
                              }`}>
                                <div className="whitespace-pre-line">
                                  {faq.answer}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage

