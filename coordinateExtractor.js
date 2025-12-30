(function() {
    // Check if the popup already exists
    if (document.getElementById('coordExtractorPopup')) {
        document.getElementById('coordExtractorPopup').remove();
    }

    // Create popup HTML
    const popup = document.createElement('div');
    popup.id = 'coordExtractorPopup';
    popup.innerHTML = `
        <div class="coord-extractor-overlay">
            <div class="coord-extractor-modal">
                <div class="coord-extractor-header">
                    <h2>Coordinate Extractor</h2>
                    <button class="coord-extractor-close">&times;</button>
                </div>
                <div class="coord-extractor-body">
                    <div class="coord-extractor-section">
                        <label>Input (Paste your text here):</label>
                        <textarea id="coordExtractorInput" placeholder="Paste your village data here..."></textarea>
                    </div>
                    <div class="coord-extractor-options">
                        <label class="coord-extractor-checkbox">
                            <input type="checkbox" id="coordExtractorRemoveDuplicates" checked>
                            <span>Remove Duplicates</span>
                        </label>
                    </div>
                    <div class="coord-extractor-button-container">
                        <button id="coordExtractorProcess" class="coord-extractor-btn-process">Extract Coordinates</button>
                        <button id="coordExtractorClear" class="coord-extractor-btn-clear">Clear</button>
                    </div>
                    <div class="coord-extractor-section">
                        <label>Output (Coordinates):</label>
                        <textarea id="coordExtractorOutput" readonly placeholder="Coordinates will appear here..."></textarea>
                        <button id="coordExtractorCopy" class="coord-extractor-btn-copy">Copy to Clipboard</button>
                    </div>
                </div>
                <div class="coord-extractor-footer">
                    Script by antonistsam
                </div>
            </div>
        </div>
    `;

    // Add CSS
    const style = document.createElement('style');
    style.textContent = `
        .coord-extractor-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99999;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .coord-extractor-modal {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            width: 600px;
            max-width: 90%;
            max-height: 90vh;
            overflow: hidden;
            animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
            from { 
                transform: translateY(-50px);
                opacity: 0;
            }
            to { 
                transform: translateY(0);
                opacity: 1;
            }
        }

        .coord-extractor-header {
            background: rgba(0, 0, 0, 0.2);
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        }

        .coord-extractor-header h2 {
            margin: 0;
            color: #fff;
            font-size: 24px;
            font-weight: 600;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .coord-extractor-close {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: #fff;
            font-size: 28px;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
        }

        .coord-extractor-close:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: rotate(90deg);
        }

        .coord-extractor-body {
            padding: 25px;
            background: #fff;
        }

        .coord-extractor-section {
            margin-bottom: 20px;
        }

        .coord-extractor-section label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 600;
            font-size: 14px;
        }

        .coord-extractor-options {
            margin-bottom: 15px;
        }

        .coord-extractor-checkbox {
            display: flex;
            align-items: center;
            cursor: pointer;
            user-select: none;
        }

        .coord-extractor-checkbox input[type="checkbox"] {
            width: 18px;
            height: 18px;
            margin-right: 10px;
            cursor: pointer;
        }

        .coord-extractor-checkbox span {
            color: #333;
            font-weight: 500;
            font-size: 14px;
        }

        .coord-extractor-section textarea {
            width: 100%;
            min-height: 150px;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            resize: vertical;
            transition: border-color 0.3s ease;
            box-sizing: border-box;
        }

        .coord-extractor-section textarea:focus {
            outline: none;
            border-color: #667eea;
        }

        .coord-extractor-button-container {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }

        .coord-extractor-btn-process,
        .coord-extractor-btn-clear,
        .coord-extractor-btn-copy {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .coord-extractor-btn-process {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            flex: 1;
        }

        .coord-extractor-btn-process:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
        }

        .coord-extractor-btn-clear {
            background: #f44336;
            color: #fff;
            flex: 0 0 auto;
        }

        .coord-extractor-btn-clear:hover {
            background: #d32f2f;
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(244, 67, 54, 0.4);
        }

        .coord-extractor-btn-copy {
            background: #4CAF50;
            color: #fff;
            width: 100%;
            margin-top: 10px;
        }

        .coord-extractor-btn-copy:hover {
            background: #45a049;
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(76, 175, 80, 0.4);
        }

        .coord-extractor-footer {
            background: rgba(0, 0, 0, 0.2);
            padding: 15px;
            text-align: center;
            color: #fff;
            font-size: 12px;
            font-style: italic;
            border-top: 2px solid rgba(255, 255, 255, 0.1);
        }

        #coordExtractorOutput {
            background: #f5f5f5;
        }
    `;

    // Add elements to document
    document.head.appendChild(style);
    document.body.appendChild(popup);

    // Get elements
    const closeBtn = popup.querySelector('.coord-extractor-close');
    const processBtn = document.getElementById('coordExtractorProcess');
    const clearBtn = document.getElementById('coordExtractorClear');
    const copyBtn = document.getElementById('coordExtractorCopy');
    const inputArea = document.getElementById('coordExtractorInput');
    const outputArea = document.getElementById('coordExtractorOutput');
    const removeDuplicatesCheckbox = document.getElementById('coordExtractorRemoveDuplicates');

    // Extract coordinates function
    function extractCoordinates() {
        const input = inputArea.value;
        
        // Regex to match coordinates in format XXX|YYY (with or without parentheses)
        const coordRegex = /\b(\d{3}\|\d{3})\b/g;
        const matches = [];
        let match;

        while ((match = coordRegex.exec(input)) !== null) {
            matches.push(match[1]);
        }

        if (matches.length === 0) {
            outputArea.value = 'No coordinates found. Please make sure your input contains coordinates in format XXX|YYY';
        } else {
            let result = matches;
            
            // Remove duplicates if checkbox is checked
            if (removeDuplicatesCheckbox.checked) {
                result = [...new Set(matches)];
            }
            
            outputArea.value = result.join('\n');
        }
    }

    // Event listeners
    closeBtn.addEventListener('click', () => {
        popup.remove();
        style.remove();
    });

    processBtn.addEventListener('click', extractCoordinates);

    clearBtn.addEventListener('click', () => {
        inputArea.value = '';
        outputArea.value = '';
    });

    copyBtn.addEventListener('click', () => {
        outputArea.select();
        document.execCommand('copy');
        
        // Visual feedback
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.style.background = '#2196F3';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '#4CAF50';
        }, 1500);
    });

    // Close on overlay click
    popup.querySelector('.coord-extractor-overlay').addEventListener('click', (e) => {
        if (e.target.classList.contains('coord-extractor-overlay')) {
            popup.remove();
            style.remove();
        }
    });

    // Focus input on load
    inputArea.focus();
})();
