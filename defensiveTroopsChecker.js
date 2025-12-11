// Tribal Wars Defensive Troops Checker
// Checks which tribe members haven't sent defensive troops and counts total troops

(function() {
    // Get player names from window variable set by bookmarklet
    const playerNames = window.TRIBE_PLAYERS;
    
    // Check if player names were provided
    if (!playerNames || playerNames.trim().length === 0) {
        alert('Error: No player names provided! Please configure the bookmarklet with your tribe members.');
        return;
    }
    
    // Split by semicolon and trim whitespace
    const allPlayers = playerNames.split(';').map(name => name.trim()).filter(name => name.length > 0);
    
    if (allPlayers.length === 0) {
        alert('Error: No valid player names found in the list!');
        return;
    }

    // Find the units_home table
    const unitsTable = document.getElementById('units_home');
    
    if (!unitsTable) {
        alert('Units table not found! Make sure you are on the correct page (defensive troops overview).');
        return;
    }

    // Find all table rows
    const tableRows = unitsTable.querySelectorAll('tr');
    
    if (tableRows.length === 0) {
        alert('No troop data found in the table!');
        return;
    }

    // Object to store player troop counts
    const playerTroops = {};
    
    // Process each row to extract player names and troop counts
    tableRows.forEach(row => {
        // Find village anchor in this row
        const villageAnchor = row.querySelector('span.village_anchor.contexted');
        
        if (villageAnchor) {
            const anchorElement = villageAnchor.querySelector('a');
            if (anchorElement) {
                const text = anchorElement.textContent || anchorElement.innerText;
                
                // Extract player name from format: "007 Κάτσε Κάτω!! (Mugiwara) (511|452) K45"
                const match = text.match(/\(([^)]+)\)\s*\(\d+\|\d+\)/);
                if (match && match[1]) {
                    const playerName = match[1].trim();
                    
                    // Initialize player if not exists
                    if (!playerTroops[playerName]) {
                        playerTroops[playerName] = 0;
                    }
                    
                    // Find all unit-item tds in this row
                    const unitCells = row.querySelectorAll('td[class*="unit-item"]');
                    
                    unitCells.forEach(cell => {
                        const troopCountText = cell.textContent || cell.innerText;
                        const troopCount = parseInt(troopCountText.trim()) || 0;
                        
                        // Check if this is heavy cavalry (multiply by 6)
                        if (cell.classList.contains('unit-item-heavy')) {
                            playerTroops[playerName] += troopCount * 6;
                        } else {
                            playerTroops[playerName] += troopCount;
                        }
                    });
                }
            }
        }
    });

    // Get players who have sent troops
    const playersWithTroops = Object.keys(playerTroops);
    
    // Find players who haven't sent troops
    const missingPlayers = allPlayers.filter(player => !playersWithTroops.includes(player));

    // Sort players by troop count (descending)
    const sortedPlayers = Object.entries(playerTroops).sort((a, b) => b[1] - a[1]);
    
    // Create delimited string for missing players
    const delimitedList = missingPlayers.join(';');

    // Create formatted HTML list for missing players (5 players per row)
    let missingPlayersHtml = '';
    if (missingPlayers.length > 0) {
        missingPlayersHtml = '<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-top: 10px;">';
        missingPlayers.forEach(player => {
            missingPlayersHtml += `<div style="padding: 5px; background: #ffcccc; border-radius: 3px; text-align: center; border: 1px solid #ff6666;">${player}</div>`;
        });
        missingPlayersHtml += '</div>';
    }

    // Create HTML table for players with troops
    let troopsTableHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
                <tr style="background: #8B4513; color: white;">
                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">#</th>
                    <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Player Name</th>
                    <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Total Troops</th>
                </tr>
            </thead>
            <tbody>
    `;

    sortedPlayers.forEach((entry, index) => {
        const [playerName, troopCount] = entry;
        const rowColor = index % 2 === 0 ? '#f9f9f9' : '#ffffff';
        troopsTableHtml += `
            <tr style="background: ${rowColor};">
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${index + 1}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${playerName}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: #2e7d32;">${troopCount.toLocaleString()}</td>
            </tr>
        `;
    });

    troopsTableHtml += `
            </tbody>
        </table>
    `;

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
        max-width: 900px;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    `;

    let popupContent = `
        <div style="font-family: Arial, sans-serif;">
            <h2 style="color: #8B4513; margin-top: 0; border-bottom: 2px solid #8B4513; padding-bottom: 10px;">
                🛡️ Defensive Troops Analysis
            </h2>
            <p style="color: #666; margin: 10px 0;">
                <strong>${sortedPlayers.length}</strong> players have sent troops. 
                <strong>${missingPlayers.length}</strong> haven't sent troops yet.
            </p>
    `;

    // Add missing players section if there are any
    if (missingPlayers.length > 0) {
        popupContent += `
            <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 5px; padding: 15px; margin: 15px 0;">
                <h3 style="color: #8B4513; margin-top: 0;">⚠️ Players Who Haven't Sent Troops (${missingPlayers.length}):</h3>
                <div style="margin: 10px 0;">
                    <strong>Delimited List (for copying):</strong>
                    <textarea readonly style="width: 100%; height: 50px; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-family: monospace; resize: vertical; margin-top: 5px;">${delimitedList}</textarea>
                </div>
                ${missingPlayersHtml}
            </div>
        `;
    } else {
        popupContent += `
            <div style="background: #d4edda; border: 2px solid #28a745; border-radius: 5px; padding: 15px; margin: 15px 0; text-align: center;">
                <strong style="color: #155724; font-size: 16px;">✅ Great! All tribe members have sent defensive troops!</strong>
            </div>
        `;
    }

    popupContent += `
            <h3 style="color: #8B4513; margin-top: 20px;">📊 Troops Sent by Player (Descending Order):</h3>
            <p style="color: #666; font-size: 12px; margin: 5px 0;">
                <em>Note: Heavy cavalry units are counted as 6 population each</em>
            </p>
            ${troopsTableHtml}
            
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

    popup.innerHTML = popupContent;

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
