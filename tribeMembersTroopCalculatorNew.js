javascript:

// Check if we're on the correct page
if (window.location.href.indexOf('screen=ally&mode=members_troops') < 0) {
    window.location.assign(game_data.link_base_pure + "ally&mode=members_troops");
    throw new Error("Redirecting to correct page");
}

// Configuration thresholds
const CONFIG = {
    thresholds: {
        full: 18000,
        threeFourths: 13000,
        half: 8000,
        quarter: 3000
    },
    offensiveAxeThreshold: 500,
    hasArchers: true // Will be loaded from localStorage
};

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('ttc_settings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            CONFIG.hasArchers = settings.hasArchers !== undefined ? settings.hasArchers : true;
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    }
}

// Save settings to localStorage
function saveSettings() {
    const settings = {
        hasArchers: CONFIG.hasArchers
    };
    localStorage.setItem('ttc_settings', JSON.stringify(settings));
}

loadSettings();

// Unit population costs
const UNIT_POP = {
    spear: 1,
    sword: 1,
    axe: 1,
    archer: 1,
    spy: 0,      // Don't count scouts
    light: 4,    // Light cavalry
    marcher: 5,  // Mounted archer
    heavy: 6,    // Heavy cavalry
    ram: 5,
    catapult: 8,
    knight: 0,   // Paladin - don't count
    snob: 0,     // Noble - don't count
    militia: 0   // Militia - don't count
};

// Unit order as they appear in the table
const UNIT_ORDER_FULL = ['spear', 'sword', 'axe', 'archer', 'spy', 'light', 'marcher', 'heavy', 'ram', 'catapult', 'knight', 'snob', 'militia'];
const UNIT_ORDER_NO_ARCHERS = ['spear', 'sword', 'axe', 'spy', 'light', 'heavy', 'ram', 'catapult', 'knight', 'snob', 'militia'];

// Get current unit order based on settings
function getUnitOrder() {
    return CONFIG.hasArchers ? UNIT_ORDER_FULL : UNIT_ORDER_NO_ARCHERS;
}

// Greek unit names for display
const UNIT_NAMES_GR = {
    spear: 'Δορατοφόρος',
    sword: 'Ξιφομάχος',
    axe: 'Τσεκουρομάχος',
    archer: 'Τοξότης',
    spy: 'Ανιχνευτής',
    light: 'Ελαφρύ ιππικό',
    marcher: 'Έφιππος τοξότης',
    heavy: 'Βαρύ ιππικό',
    ram: 'Πολιορκητικός κριός',
    catapult: 'Καταπέλτης',
    knight: 'Paladin',
    snob: 'Αριστοκράτης',
    militia: 'Εθνοφρουρά'
};

// Global data storage
const DATA = {
    players: [],
    playerStats: {},
    unitIcons: {}
};

// Clean up any previous script runs
$(".tribe-troop-counter").remove();
$("#progressbar").remove();

// Inject CSS styles
const CSS_STYLES = `
<style>
.tribe-troop-counter {
    margin: 10px 0;
}

.ttc-header {
    background-color: #202225;
    color: white;
    padding: 15px;
    font-size: 20px;
    font-weight: bold;
    border-radius: 5px 5px 0 0;
}

.ttc-author {
    text-align: right;
    font-size: 12px;
    color: #99AAB5;
    font-style: italic;
    margin-top: 5px;
}

.ttc-settings {
    background-color: #40444B;
    padding: 10px 15px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid #202225;
}

.ttc-settings label {
    color: white;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.ttc-settings input[type="checkbox"] {
    cursor: pointer;
    width: 18px;
    height: 18px;
}

.ttc-settings button {
    background-color: #5865F2;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: background-color 0.2s;
}

.ttc-settings button:hover {
    background-color: #4752C4;
}

.ttc-tribe-totals {
    background-color: #2C2F33;
    margin-bottom: 20px;
    border-radius: 5px;
    overflow: hidden;
    border: 2px solid #7289DA;
}

.ttc-tribe-header {
    background-color: #5865F2;
    color: white;
    padding: 10px 15px;
    font-size: 18px;
    font-weight: bold;
    text-align: center;
}

.ttc-player-section {
    background-color: #2C2F33;
    margin-bottom: 15px;
    border-radius: 5px;
    overflow: hidden;
}

.ttc-player-name {
    background-color: #23272A;
    color: white;
    padding: 12px 15px;
    font-size: 16px;
    font-weight: bold;
}

.ttc-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    padding: 15px;
    background-color: #36393F;
}

.ttc-stats-column {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.ttc-stat-row {
    color: white;
    padding: 5px;
    display: flex;
    justify-content: space-between;
}

.ttc-stat-label {
    font-weight: 500;
}

.ttc-stat-value {
    font-weight: bold;
    color: #7289DA;
}

.ttc-collapsible {
    background-color: #40444B;
    color: white;
    cursor: pointer;
    padding: 12px 15px;
    width: 100%;
    border: none;
    text-align: left;
    outline: none;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s;
}

.ttc-collapsible:hover {
    background-color: #484C52;
}

.ttc-collapsible:after {
    content: '+';
    color: white;
    font-weight: bold;
    float: right;
    font-size: 18px;
}

.ttc-collapsible.active:after {
    content: '-';
}

.ttc-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease-out;
    background-color: #2C2F33;
}

.ttc-units-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 10px;
    padding: 15px;
}

.ttc-unit-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background-color: #40444B;
    border-radius: 3px;
    color: white;
}

.ttc-unit-icon {
    width: 32px;
    height: 32px;
}

.ttc-unit-count {
    font-weight: bold;
    font-size: 14px;
}

.ttc-progressbar {
    width: 100%;
    background-color: #2C2F33;
    border-radius: 5px;
    margin: 10px 0;
    overflow: hidden;
}

.ttc-progress {
    height: 30px;
    background: linear-gradient(90deg, #43B581 0%, #5EC97D 100%);
    text-align: center;
    line-height: 30px;
    color: white;
    font-weight: bold;
    transition: width 0.3s ease;
    width: 0%;
}

.ttc-loading {
    text-align: center;
    padding: 20px;
    color: white;
    background-color: #36393F;
    border-radius: 5px;
    margin: 10px 0;
}

.ttc-distance-section {
    background-color: #2C2F33;
    margin-bottom: 20px;
    border-radius: 5px;
    overflow: hidden;
    border: 2px solid #F26522;
}

.ttc-distance-header {
    background-color: #F26522;
    color: white;
    padding: 10px 15px;
    font-size: 18px;
    font-weight: bold;
    text-align: center;
}

.ttc-distance-config {
    background-color: #40444B;
    padding: 15px;
    border-bottom: 1px solid #202225;
}

.ttc-distance-inputs {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin-bottom: 15px;
}

.ttc-input-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.ttc-input-group label {
    color: white;
    font-size: 13px;
    font-weight: 500;
}

.ttc-input-group input {
    padding: 6px 10px;
    border: 1px solid #202225;
    border-radius: 3px;
    background-color: #36393F;
    color: white;
    font-size: 14px;
    width: 120px;
}

.ttc-ranges-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.ttc-range-item {
    display: flex;
    align-items: center;
    gap: 10px;
    color: white;
}

.ttc-range-item input {
    width: 80px;
    padding: 4px 8px;
    border: 1px solid #202225;
    border-radius: 3px;
    background-color: #36393F;
    color: white;
}

.ttc-btn {
    background-color: #5865F2;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: background-color 0.2s;
}

.ttc-btn:hover {
    background-color: #4752C4;
}

.ttc-btn-danger {
    background-color: #ED4245;
}

.ttc-btn-danger:hover {
    background-color: #C03537;
}

.ttc-btn-success {
    background-color: #3BA55D;
}

.ttc-btn-success:hover {
    background-color: #2D7D46;
}

.ttc-distance-results {
    padding: 15px;
}

.ttc-range-group {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #36393F;
    border-radius: 5px;
}

.ttc-range-title {
    color: #F26522;
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 10px;
}

.ttc-player-villages {
    margin-top: 10px;
}

.ttc-player-header {
    color: #7289DA;
    font-weight: bold;
    margin-top: 10px;
    margin-bottom: 5px;
}

.ttc-village-item {
    padding: 8px;
    margin: 5px 0;
    background-color: #40444B;
    border-radius: 3px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.ttc-village-info {
    flex: 1;
}

.ttc-village-type {
    padding: 4px 8px;
    border-radius: 3px;
    font-size: 12px;
    font-weight: bold;
    background-color: #5865F2;
    color: white;
}

.ttc-distance-badge {
    padding: 4px 8px;
    border-radius: 3px;
    font-size: 12px;
    font-weight: bold;
    background-color: #F26522;
    color: white;
    margin-left: 10px;
}
</style>`;

$("head").append(CSS_STYLES);

// Utility function to add thousands separators
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Parse coordinates from village name
function parseCoordinates(villageName) {
    const match = villageName.match(/(\d+)\|(\d+)/);
    if (match) {
        return {
            x: parseInt(match[1]),
            y: parseInt(match[2])
        };
    }
    return null;
}

// Calculate Euclidean distance between two coordinates
function calculateDistance(coord1, coord2) {
    const dx = coord1.x - coord2.x;
    const dy = coord1.y - coord2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// Get village type label
function getVillageTypeLabel(category) {
    const labels = {
        'full': 'Full',
        'threeFourths': '3/4',
        'half': '1/2',
        'quarter': '1/4'
    };
    return labels[category] || '';
}

// Sequential request handler with delay
function fetchSequentially(urls, onEach, onComplete, onError) {
    let index = 0;
    const delay = 200; // ms between requests

    function fetchNext() {
        if (index >= urls.length) {
            onComplete();
            return;
        }

        const currentIndex = index;
        const url = urls[index];
        index++;

        $.get(url)
            .done(function(data) {
                try {
                    onEach(currentIndex, data);
                    updateProgress(index, urls.length);
                    setTimeout(fetchNext, delay);
                } catch (e) {
                    onError(e);
                }
            })
            .fail(function(xhr) {
                onError(xhr);
            });
    }

    fetchNext();
}

// Update progress bar
function updateProgress(current, total) {
    const percentage = Math.round((current / total) * 100);
    $(".ttc-progress").css("width", percentage + "%").text(percentage + "%");
}

// Show progress bar
function showProgress() {
    const progressHTML = `
        <div class="ttc-progressbar">
            <div class="ttc-progress">0%</div>
        </div>
        <div class="ttc-loading">Loading player data...</div>
    `;
    $("#contentContainer").prepend(progressHTML);
}

// Hide progress bar
function hideProgress() {
    $(".ttc-progressbar").remove();
    $(".ttc-loading").remove();
}

// Step 1: Get all player IDs and names from the select element
function getPlayerList() {
    const players = [];
    $('select[name="player_id"] option').each(function() {
        const $option = $(this);
        // Skip hidden option (placeholder)
        if ($option.attr('hidden') !== undefined) {
            return;
        }
        
        const playerId = $option.val();
        const playerName = $option.text().trim();
        
        if (playerId && playerName) {
            players.push({
                id: playerId,
                name: playerName
            });
        }
    });
    
    return players;
}

// Step 2: Extract unit icons from the table header
function extractUnitIcons($data) {
    const icons = {};
    const $headerRow = $data.find('table.vis.w100 tr').first();
    
    $headerRow.find('th img[src*="unit_"]').each(function() {
        const $img = $(this);
        const src = $img.attr('src');
        const title = $img.attr('data-title') || '';
        
        // Extract unit type from URL (e.g., unit_spear.webp -> spear)
        const match = src.match(/unit_(\w+)\.webp/);
        if (match) {
            const unitType = match[1];
            icons[unitType] = src;
        }
    });
    
    return icons;
}

// Step 3: Parse village data from a player's troop page
function parsePlayerTroops($data) {
    const villages = [];
    const $table = $data.find('table.vis.w100');
    const $rows = $table.find('tr').slice(1); // Skip header row
    
    $rows.each(function() {
        const $row = $(this);
        const $cells = $row.find('td');
        
        // Skip if not enough cells or if it's a pagination row
        if ($cells.length < 15) {
            return;
        }
        
        const villageName = $cells.eq(0).text().trim();
        const village = {
            name: villageName,
            points: $cells.eq(1).text().trim(),
            coords: parseCoordinates(villageName),
            units: {}
        };
        
        // Extract unit counts (starting from 3rd td, index 2)
        const unitOrder = getUnitOrder();
        unitOrder.forEach((unitType, index) => {
            const cellIndex = index + 2; // Skip village name and points
            const cellText = $cells.eq(cellIndex).text().trim();
            
            // Handle "?" for unknown troop counts
            if (cellText === '?' || cellText === '') {
                village.units[unitType] = 0;
            } else {
                village.units[unitType] = parseInt(cellText) || 0;
            }
        });
        
        villages.push(village);
    });
    
    return villages;
}

// Step 4: Calculate village statistics
function calculateVillageStats(village) {
    let offensivePop = 0;
    let defensivePop = 0;
    
    // Count axes to determine if offensive or defensive
    const axes = village.units.axe || 0;
    const isOffensive = axes > CONFIG.offensiveAxeThreshold;
    
    // Calculate population
    const unitOrder = getUnitOrder();
    unitOrder.forEach(unitType => {
        const count = village.units[unitType] || 0;
        const popCost = UNIT_POP[unitType] || 1;
        const totalPop = count * popCost;
        
        // Offensive units: axe, light cavalry, mounted archer, rams, catapults
        if (['axe', 'light', 'marcher', 'ram', 'catapult'].includes(unitType)) {
            offensivePop += totalPop;
        }
        // Defensive units: spear, sword, archer, heavy cavalry
        else if (['spear', 'sword', 'archer', 'heavy'].includes(unitType)) {
            defensivePop += totalPop;
        }
    });
    
    return {
        isOffensive,
        offensivePop,
        defensivePop,
        totalPop: offensivePop + defensivePop
    };
}

// Step 5: Categorize village by population threshold
function categorizeVillage(pop) {
    if (pop >= CONFIG.thresholds.full) {
        return 'full';
    } else if (pop >= CONFIG.thresholds.threeFourths) {
        return 'threeFourths';
    } else if (pop >= CONFIG.thresholds.half) {
        return 'half';
    } else if (pop >= CONFIG.thresholds.quarter) {
        return 'quarter';
    }
    return null;
}

// Step 6: Calculate player statistics
function calculatePlayerStats(villages) {
    const stats = {
        nukes: {
            full: 0,
            threeFourths: 0,
            half: 0,
            quarter: 0
        },
        dvs: {
            full: 0,
            threeFourths: 0,
            half: 0,
            quarter: 0
        },
        totalUnits: {},
        offensiveVillages: [],
        defensiveVillages: []
    };
    
    // Initialize total units
    const unitOrder = getUnitOrder();
    unitOrder.forEach(unitType => {
        stats.totalUnits[unitType] = 0;
    });
    
    // Process each village
    villages.forEach(village => {
        const villageStats = calculateVillageStats(village);
        
        // Categorize village
        if (villageStats.isOffensive) {
            const category = categorizeVillage(villageStats.offensivePop);
            if (category) {
                stats.nukes[category]++;
                stats.offensiveVillages.push({
                    name: village.name,
                    coords: village.coords,
                    category: category,
                    population: villageStats.offensivePop
                });
            }
        } else {
            const category = categorizeVillage(villageStats.defensivePop);
            if (category) {
                stats.dvs[category]++;
                stats.defensiveVillages.push({
                    name: village.name,
                    coords: village.coords,
                    category: category,
                    population: villageStats.defensivePop
                });
            }
        }
        
        // Sum up total units
        unitOrder.forEach(unitType => {
            stats.totalUnits[unitType] += village.units[unitType] || 0;
        });
    });
    
    return stats;
}

// Step 7: Display results
function displayResults() {
    let html = '<div class="tribe-troop-counter">';
    html += '<div class="ttc-header">Tribe Member Troop Counter<div class="ttc-author">Script by antonistsam</div></div>';
    
    // Settings panel
    html += '<div class="ttc-settings">';
    html += '<label><input type="checkbox" id="ttc-archer-mode" ' + (CONFIG.hasArchers ? 'checked' : '') + '> Server has archers (archer & mounted archer)</label>';
    html += '<button id="ttc-reload-btn">Apply & Reload</button>';
    html += '</div>';
    
    // Calculate tribe totals
    const tribeTotals = {
        nukes: { full: 0, threeFourths: 0, half: 0, quarter: 0 },
        dvs: { full: 0, threeFourths: 0, half: 0, quarter: 0 }
    };
    
    DATA.players.forEach(player => {
        const stats = DATA.playerStats[player.name];
        if (stats) {
            tribeTotals.nukes.full += stats.nukes.full;
            tribeTotals.nukes.threeFourths += stats.nukes.threeFourths;
            tribeTotals.nukes.half += stats.nukes.half;
            tribeTotals.nukes.quarter += stats.nukes.quarter;
            tribeTotals.dvs.full += stats.dvs.full;
            tribeTotals.dvs.threeFourths += stats.dvs.threeFourths;
            tribeTotals.dvs.half += stats.dvs.half;
            tribeTotals.dvs.quarter += stats.dvs.quarter;
        }
    });
    
    // Display tribe totals
    html += `<div class="ttc-tribe-totals">`;
    html += `<div class="ttc-tribe-header">Tribe Totals</div>`;
    html += `<div class="ttc-stats-grid">`;
    
    // Offensive column
    html += `<div class="ttc-stats-column">`;
    html += `<div class="ttc-stat-row"><span class="ttc-stat-label">Full nukes:</span> <span class="ttc-stat-value">${tribeTotals.nukes.full}</span></div>`;
    html += `<div class="ttc-stat-row"><span class="ttc-stat-label">3/4 nukes:</span> <span class="ttc-stat-value">${tribeTotals.nukes.threeFourths}</span></div>`;
    html += `<div class="ttc-stat-row"><span class="ttc-stat-label">1/2 nukes:</span> <span class="ttc-stat-value">${tribeTotals.nukes.half}</span></div>`;
    html += `<div class="ttc-stat-row"><span class="ttc-stat-label">1/4 nukes:</span> <span class="ttc-stat-value">${tribeTotals.nukes.quarter}</span></div>`;
    html += `</div>`;
    
    // Defensive column
    html += `<div class="ttc-stats-column">`;
    html += `<div class="ttc-stat-row"><span class="ttc-stat-label">Full DVs:</span> <span class="ttc-stat-value">${tribeTotals.dvs.full}</span></div>`;
    html += `<div class="ttc-stat-row"><span class="ttc-stat-label">3/4 DVs:</span> <span class="ttc-stat-value">${tribeTotals.dvs.threeFourths}</span></div>`;
    html += `<div class="ttc-stat-row"><span class="ttc-stat-label">1/2 DVs:</span> <span class="ttc-stat-value">${tribeTotals.dvs.half}</span></div>`;
    html += `<div class="ttc-stat-row"><span class="ttc-stat-label">1/4 DVs:</span> <span class="ttc-stat-value">${tribeTotals.dvs.quarter}</span></div>`;
    html += `</div>`;
    
    // Total villages column
    const totalNukes = tribeTotals.nukes.full + tribeTotals.nukes.threeFourths + tribeTotals.nukes.half + tribeTotals.nukes.quarter;
    const totalDVs = tribeTotals.dvs.full + tribeTotals.dvs.threeFourths + tribeTotals.dvs.half + tribeTotals.dvs.quarter;
    html += `<div class="ttc-stats-column">`;
    html += `<div class="ttc-stat-row"><span class="ttc-stat-label">Total Nukes:</span> <span class="ttc-stat-value">${totalNukes}</span></div>`;
    html += `<div class="ttc-stat-row"><span class="ttc-stat-label">Total DVs:</span> <span class="ttc-stat-value">${totalDVs}</span></div>`;
    html += `</div>`;
    
    html += `</div>`; // End stats grid
    html += `</div>`; // End tribe totals
    
    DATA.players.forEach(player => {
        const stats = DATA.playerStats[player.name];
        if (!stats) return;
        
        html += `<div class="ttc-player-section">`;
        html += `<div class="ttc-player-name">${player.name}</div>`;
        
        // Stats grid
        html += `<div class="ttc-stats-grid">`;
        
        // Offensive column
        html += `<div class="ttc-stats-column">`;
        html += `<div class="ttc-stat-row"><span class="ttc-stat-label">Full nukes:</span> <span class="ttc-stat-value">${stats.nukes.full}</span></div>`;
        html += `<div class="ttc-stat-row"><span class="ttc-stat-label">3/4 nukes:</span> <span class="ttc-stat-value">${stats.nukes.threeFourths}</span></div>`;
        html += `<div class="ttc-stat-row"><span class="ttc-stat-label">1/2 nukes:</span> <span class="ttc-stat-value">${stats.nukes.half}</span></div>`;
        html += `<div class="ttc-stat-row"><span class="ttc-stat-label">1/4 nukes:</span> <span class="ttc-stat-value">${stats.nukes.quarter}</span></div>`;
        html += `</div>`;
        
        // Defensive column
        html += `<div class="ttc-stats-column">`;
        html += `<div class="ttc-stat-row"><span class="ttc-stat-label">Full DVs:</span> <span class="ttc-stat-value">${stats.dvs.full}</span></div>`;
        html += `<div class="ttc-stat-row"><span class="ttc-stat-label">3/4 DVs:</span> <span class="ttc-stat-value">${stats.dvs.threeFourths}</span></div>`;
        html += `<div class="ttc-stat-row"><span class="ttc-stat-label">1/2 DVs:</span> <span class="ttc-stat-value">${stats.dvs.half}</span></div>`;
        html += `<div class="ttc-stat-row"><span class="ttc-stat-label">1/4 DVs:</span> <span class="ttc-stat-value">${stats.dvs.quarter}</span></div>`;
        html += `</div>`;
        
        // Total villages column
        const totalNukes = stats.nukes.full + stats.nukes.threeFourths + stats.nukes.half + stats.nukes.quarter;
        const totalDVs = stats.dvs.full + stats.dvs.threeFourths + stats.dvs.half + stats.dvs.quarter;
        html += `<div class="ttc-stats-column">`;
        html += `<div class="ttc-stat-row"><span class="ttc-stat-label">Total Nukes:</span> <span class="ttc-stat-value">${totalNukes}</span></div>`;
        html += `<div class="ttc-stat-row"><span class="ttc-stat-label">Total DVs:</span> <span class="ttc-stat-value">${totalDVs}</span></div>`;
        html += `</div>`;
        
        html += `</div>`; // End stats grid
        
        // Collapsible more details
        html += `<button class="ttc-collapsible">More details</button>`;
        html += `<div class="ttc-content">`;
        html += `<div class="ttc-units-grid">`;
        
        const unitOrder = getUnitOrder();
        unitOrder.forEach(unitType => {
            const count = stats.totalUnits[unitType] || 0;
            const iconUrl = DATA.unitIcons[unitType] || '';
            const unitName = UNIT_NAMES_GR[unitType] || unitType;
            
            html += `<div class="ttc-unit-item">`;
            if (iconUrl) {
                html += `<img src="${iconUrl}" class="ttc-unit-icon" alt="${unitName}" title="${unitName}">`;
            } else {
                html += `<span class="ttc-unit-icon">${unitType}</span>`;
            }
            html += `<span class="ttc-unit-count">${formatNumber(count)}</span>`;
            html += `</div>`;
        });
        
        html += `</div>`; // End units grid
        html += `</div>`; // End content
        html += `</div>`; // End player section
    });
    
    html += '</div>'; // End tribe-troop-counter
    
    $("#contentContainer").prepend(html);
    
    // Make collapsibles work
    makeCollapsible();
    
    // Add distance analysis section
    displayDistanceAnalysis();
    
    // Setup settings change handler
    $('#ttc-reload-btn').on('click', function() {
        const hasArchers = $('#ttc-archer-mode').is(':checked');
        CONFIG.hasArchers = hasArchers;
        saveSettings();
        
        // Clear and reload
        $('.tribe-troop-counter').remove();
        DATA.players = [];
        DATA.playerStats = {};
        DATA.unitIcons = {};
        main();
    });
}

// Display distance analysis section
function displayDistanceAnalysis() {
    const savedRanges = localStorage.getItem('ttc_distance_ranges');
    const ranges = savedRanges ? JSON.parse(savedRanges) : [[0, 10], [10, 20], [20, 30], [30, 50]];
    
    let html = `<div class="ttc-distance-section">`;
    html += `<div class="ttc-distance-header">Offensive Villages Distance Analysis</div>`;
    html += `<div class="ttc-distance-config">`;
    
    // Reference village input
    html += `<div class="ttc-distance-inputs">`;
    html += `<div class="ttc-input-group">`;
    html += `<label>Reference Village (X|Y):</label>`;
    html += `<div style="display: flex; gap: 5px;">`;
    html += `<input type="number" id="ttc-ref-x" placeholder="X" />`;
    html += `<input type="number" id="ttc-ref-y" placeholder="Y" />`;
    html += `</div>`;
    html += `</div>`;
    html += `</div>`;
    
    // Distance ranges
    html += `<div class="ttc-ranges-container" id="ttc-ranges-list">`;
    html += `<label style="color: white; font-weight: 500; margin-bottom: 5px;">Distance Ranges:</label>`;
    ranges.forEach((range, index) => {
        html += `<div class="ttc-range-item" data-index="${index}">`;
        html += `<input type="number" class="range-min" value="${range[0]}" placeholder="Min" />`;
        html += `<span style="color: white;">to</span>`;
        html += `<input type="number" class="range-max" value="${range[1]}" placeholder="Max" />`;
        html += `<button class="ttc-btn ttc-btn-danger remove-range">Remove</button>`;
        html += `</div>`;
    });
    html += `</div>`;
    
    // Action buttons
    html += `<div style="display: flex; gap: 10px; margin-top: 15px;">`;
    html += `<button class="ttc-btn" id="ttc-add-range">Add Range</button>`;
    html += `<button class="ttc-btn ttc-btn-success" id="ttc-calculate-distance">Calculate Distances</button>`;
    html += `</div>`;
    
    html += `</div>`; // End config
    
    // Results container
    html += `<div class="ttc-distance-results" id="ttc-distance-results" style="display: none;"></div>`;
    
    html += `</div>`; // End distance section
    
    $('.ttc-tribe-totals').after(html);
    
    // Event handlers
    $('#ttc-add-range').on('click', function() {
        const $container = $('#ttc-ranges-list');
        const index = $('.ttc-range-item').length;
        const newRange = `
            <div class="ttc-range-item" data-index="${index}">
                <input type="number" class="range-min" value="0" placeholder="Min" />
                <span style="color: white;">to</span>
                <input type="number" class="range-max" value="10" placeholder="Max" />
                <button class="ttc-btn ttc-btn-danger remove-range">Remove</button>
            </div>`;
        $container.append(newRange);
    });
    
    $(document).on('click', '.remove-range', function() {
        $(this).closest('.ttc-range-item').remove();
    });
    
    $('#ttc-calculate-distance').on('click', function() {
        calculateAndDisplayDistances();
    });
}

// Calculate and display distance results
function calculateAndDisplayDistances() {
    const refX = parseInt($('#ttc-ref-x').val());
    const refY = parseInt($('#ttc-ref-y').val());
    
    if (isNaN(refX) || isNaN(refY)) {
        alert('Please enter valid reference village coordinates!');
        return;
    }
    
    const refCoords = { x: refX, y: refY };
    
    // Get ranges
    const ranges = [];
    $('.ttc-range-item').each(function() {
        const min = parseFloat($(this).find('.range-min').val()) || 0;
        const max = parseFloat($(this).find('.range-max').val()) || 0;
        ranges.push([min, max]);
    });
    
    // Save ranges to localStorage
    localStorage.setItem('ttc_distance_ranges', JSON.stringify(ranges));
    
    // Sort ranges by min value
    ranges.sort((a, b) => a[0] - b[0]);
    
    // Collect all offensive villages with distances
    const allOffensiveVillages = [];
    
    DATA.players.forEach(player => {
        const stats = DATA.playerStats[player.name];
        if (stats && stats.offensiveVillages) {
            stats.offensiveVillages.forEach(village => {
                if (village.coords) {
                    const distance = calculateDistance(refCoords, village.coords);
                    allOffensiveVillages.push({
                        playerName: player.name,
                        village: village,
                        distance: distance
                    });
                }
            });
        }
    });
    
    // Group by ranges
    const rangeGroups = ranges.map(range => ({
        min: range[0],
        max: range[1],
        villages: []
    }));
    
    allOffensiveVillages.forEach(item => {
        for (let i = 0; i < rangeGroups.length; i++) {
            if (item.distance >= rangeGroups[i].min && item.distance < rangeGroups[i].max) {
                rangeGroups[i].villages.push(item);
                break;
            }
        }
    });
    
    // Display results
    let html = `<h3 style="color: white; margin-bottom: 15px;">Results for reference village ${refX}|${refY}</h3>`;
    html += `<div style="color: #7289DA; font-size: 16px; margin-bottom: 20px;">Total offensive villages: ${allOffensiveVillages.length}</div>`;
    
    rangeGroups.forEach(group => {
        html += `<div class="ttc-range-group">`;
        html += `<div class="ttc-range-title">Distance ${group.min}-${group.max}: ${group.villages.length} villages</div>`;
        
        if (group.villages.length > 0) {
            // Group by player
            const byPlayer = {};
            group.villages.forEach(item => {
                if (!byPlayer[item.playerName]) {
                    byPlayer[item.playerName] = [];
                }
                byPlayer[item.playerName].push(item);
            });
            
            html += `<div class="ttc-player-villages">`;
            Object.keys(byPlayer).sort().forEach(playerName => {
                html += `<div class="ttc-player-header">${playerName} (${byPlayer[playerName].length})</div>`;
                
                byPlayer[playerName].sort((a, b) => a.distance - b.distance).forEach(item => {
                    const village = item.village;
                    const coordsStr = village.coords ? `${village.coords.x}|${village.coords.y}` : 'N/A';
                    
                    html += `<div class="ttc-village-item">`;
                    html += `<div class="ttc-village-info">`;
                    html += `<div>${village.name}</div>`;
                    html += `<div style="font-size: 12px; color: #99AAB5; margin-top: 3px;">${coordsStr}</div>`;
                    html += `</div>`;
                    html += `<span class="ttc-village-type">${getVillageTypeLabel(village.category)}</span>`;
                    html += `<span class="ttc-distance-badge">${item.distance.toFixed(1)}</span>`;
                    html += `</div>`;
                });
            });
            html += `</div>`;
        }
        
        html += `</div>`;
    });
    
    $('#ttc-distance-results').html(html).show();
}

// Make collapsible sections work
function makeCollapsible() {
    $(".ttc-collapsible").off('click').on('click', function() {
        $(this).toggleClass("active");
        const $content = $(this).next(".ttc-content");
        
        if ($content.css("max-height") !== "0px") {
            $content.css("max-height", "0");
        } else {
            $content.css("max-height", $content[0].scrollHeight + "px");
        }
    });
}

// Main execution
function main() {
    console.log("Starting Tribe Member Troop Counter...");
    
    // Step 1: Get player list
    DATA.players = getPlayerList();
    console.log(`Found ${DATA.players.length} players`);
    
    if (DATA.players.length === 0) {
        alert("No players found! Make sure you're on the ally members troops page.");
        return;
    }
    
    // Step 2: Extract unit icons from current page
    DATA.unitIcons = extractUnitIcons($(document));
    console.log("Unit icons extracted:", DATA.unitIcons);
    
    // Show progress
    showProgress();
    
    // Step 3: Fetch each player's troop data
    const playerUrls = DATA.players.map(player => 
        `${window.location.origin}${window.location.pathname}?screen=ally&mode=members_troops&player_id=${player.id}`
    );
    
    fetchSequentially(
        playerUrls,
        (index, data) => {
            const player = DATA.players[index];
            console.log(`Processing player ${index + 1}/${DATA.players.length}: ${player.name}`);
            
            const $data = $(data);
            const villages = parsePlayerTroops($data);
            const stats = calculatePlayerStats(villages);
            
            DATA.playerStats[player.name] = stats;
        },
        () => {
            console.log("All players processed");
            hideProgress();
            displayResults();
        },
        (error) => {
            console.error("Error fetching data:", error);
            alert("An error occurred while fetching player data. Check console for details.");
            hideProgress();
        }
    );
}

// Run the script
main();
