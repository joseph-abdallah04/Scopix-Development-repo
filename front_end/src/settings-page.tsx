import React, { useState } from 'react';
import './settings-page.css';

function SettingsPage() {
    const [darkMode, setDarkMode] = useState(true);
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

    const handleReset = () => {
        setDarkMode(true);
        setExpandedFAQ(null);
    };

    const handleApply = () => {
        console.log('Settings applied:', { darkMode });
    };

    const toggleFAQ = (index: number) => {
        setExpandedFAQ(expandedFAQ === index ? null : index);
    };

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
        },
        {
            question: "What should I do if my file upload fails?",
            answer: "Check that your file meets the format requirements and size limits. If the problem persists, try refreshing the page or contact support."
        }
    ];

    return (
        <div className="settings-bg">
            <div className="settings-container">
                <h1 className="settings-title">Settings</h1>
                
                <div className="settings-content">
                    <div className="setting-section">
                        <h2 className="section-title">Theme</h2>
                        <div className="setting-item">
                            <div className="setting-control">
                                <span className="toggle-label">Dark Mode</span>
                                <div className="toggle-container">
                                    <input
                                        type="checkbox"
                                        id="darkMode"
                                        className="toggle-input"
                                        checked={darkMode}
                                        onChange={(e) => setDarkMode(e.target.checked)}
                                    />
                                    <label htmlFor="darkMode" className="toggle-slider"></label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="setting-section">
                        <h2 className="section-title">FAQs</h2>
                        <div className="faq-container">
                            {faqs.map((faq, index) => (
                                <div key={index} className="faq-item">
                                    <button 
                                        className="faq-question"
                                        onClick={() => toggleFAQ(index)}
                                    >
                                        <span>{faq.question}</span>
                                        <span className={`faq-arrow ${expandedFAQ === index ? 'expanded' : ''}`}>
                                            ▼
                                        </span>
                                    </button>
                                    {expandedFAQ === index && (
                                        <div className="faq-answer">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="settings-actions">
                    <button className="reset-btn" onClick={handleReset}>
                        Reset to Default
                    </button>
                    <button className="apply-btn" onClick={handleApply}>
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SettingsPage;