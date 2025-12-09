// Tribal Wars Defensive Troops Checker
// Checks which tribe members haven't sent defensive troops

(function() {
    // Predefined list of all tribe members
    const allPlayers = [
        "El Matador", "krisos", "astatos87", "AdrenaLine", "GRAY", 
        "EarthWalkergr", "NECROPHOS", "zaxoscool7", "Heathen", "Μανιασμένη Βoυβoυζέλα",
        "Mugiwara", "Snatcher", "Fr4nKenStein", "renato", "Οι 3 παπατζήδες",
        "CaveMan23", "Latis", "hardblocker", "dim68", "Erwin Schrodinger",
        "Jason-Afroditi", "Νoriega", "Tourb1nas", "Da FiPiKa", "The Sith lord",
        "Julia", "Engineer92", "Eτερος εγώ", "alex333"
    ];

    // Find all village_anchor elements
    const villageAnchors = document.querySelectorAll('span.village_anchor.contexted');
    
    if (villageAnchors.length === 0) {
        alert('No village elements found! Make sure you are on the correct page (defensive troops overview).');
        return;
    }

    // Extract player names from the HTML
    const playersWithTroops = new Set();
    
    villageAnchors.forEach(span => {
        const anchorElement = span.querySelector('a');
        if (anchorElement) {
            const text = anchorElement.textContent || anchorElement.innerText;
            
            // Extract player name from format: "007 Κάτσε Κάτω!! (Mugiwara) (511|452) K45"
            // Player name is inside the first set of parentheses
            const match = text.match(/\(([^)]+)\)\s*\(\d+\|\d+\)/);
            if (match && match[1]) {
                const playerName = match[1].trim();
                playersWithTroops.add(playerName);
            }
        }
    });

    // Find players who haven't sent troops
    const missingPlayers = allPlayers.filter(player => !playersWithTroops.has(player));

    // Display results
    if (missingPlayers.length === 0) {
        alert('Great! All tribe members have sent defensive troops! 🎉');
        return;
    }

    // Create delimited string for easy copying
    const delimitedList = missingPlayers.join(';');

    // Create formatted HTML list (5 players per row)
    let htmlList = '<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-top: 10px;">';
    missingPlayers.forEach(player => {
        htmlList += `<div style="padding: 5px; background: #f0f0f0; border-radius: 3px; text-align: center;">${player}</div>`;
    });
    htmlList += '</div>';

    // Create popup window
    const popup = document.createElement('div');
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 3px solid #8B4513;
        border-radius: 10px;
        padding: 20px;
        z-index: 10000;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    `;

    popup.innerHTML = `
        <div style="font-family: Arial, sans-serif;">
            <h2 style="color: #8B4513; margin-top: 0; border-bottom: 2px solid #8B4513; padding-bottom: 10px;">
                ⚠️ Players Who Haven't Sent Defensive Troops
            </h2>
            <p style="color: #666; margin: 10px 0;">
                <strong>${missingPlayers.length}</strong> out of <strong>${allPlayers.length}</strong> players haven't sent troops yet.
            </p>
            
            <h3 style="color: #8B4513; margin-top: 20px;">Delimited List (for copying):</h3>
            <textarea readonly style="width: 100%; height: 60px; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-family: monospace; resize: vertical;">${delimitedList}</textarea>
            
            <h3 style="color: #8B4513; margin-top: 20px;">Missing Players:</h3>
            ${htmlList}
            
            <div style="text-align: center; margin-top: 20px;">
                <button id="closePopupBtn" style="
                    background: #8B4513;
                    color: white;
                    border: none;
                    padding: 10px 30px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                ">Close</button>
            </div>
        </div>
    `;

    // Add overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    // Close button functionality
    const closeBtn = document.getElementById('closePopupBtn');
    const closePopup = () => {
        document.body.removeChild(popup);
        document.body.removeChild(overlay);
    };

    closeBtn.addEventListener('click', closePopup);
    overlay.addEventListener('click', closePopup);

})();
