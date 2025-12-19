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
    offensiveAxeThreshold: 500
};

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
const UNIT_ORDER = ['spear', 'sword', 'axe', 'archer', 'spy', 'light', 'marcher', 'heavy', 'ram', 'catapult', 'knight', 'snob', 'militia'];

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
</style>`;

$("head").append(CSS_STYLES);

// Utility function to add thousands separators
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
        
        const village = {
            name: $cells.eq(0).text().trim(),
            points: $cells.eq(1).text().trim(),
            units: {}
        };
        
        // Extract unit counts (starting from 3rd td, index 2)
        UNIT_ORDER.forEach((unitType, index) => {
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
    UNIT_ORDER.forEach(unitType => {
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
        totalUnits: {}
    };
    
    // Initialize total units
    UNIT_ORDER.forEach(unitType => {
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
            }
        } else {
            const category = categorizeVillage(villageStats.defensivePop);
            if (category) {
                stats.dvs[category]++;
            }
        }
        
        // Sum up total units
        UNIT_ORDER.forEach(unitType => {
            stats.totalUnits[unitType] += village.units[unitType] || 0;
        });
    });
    
    return stats;
}

// Step 7: Display results
function displayResults() {
    let html = '<div class="tribe-troop-counter">';
    html += '<div class="ttc-header">Tribe Member Troop Counter</div>';
    
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
        
        UNIT_ORDER.forEach(unitType => {
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
