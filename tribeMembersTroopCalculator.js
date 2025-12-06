javascript:

if (window.location.href.indexOf('&screen=ally&mode=members') < 0 || window.location.href.indexOf('&screen=ally&mode=members_troops') > -1) {
    //relocate
    window.location.assign(game_data.link_base_pure + "ally&mode=members");
}

var baseURL = `game.php?screen=ally&mode=members_troops&player_id=`;
var playerURLs = [];
var villageData = {};
var playerData = {};
var player = [];
var typeTotals = {};
//remove previous ran version of script if accidental doublelaunch
$(".flex-container").remove();
$("div[id*='player']").remove();
// get/store settings
if (localStorage.getItem("settingsTribeMembers") != null) {
    tempArray = JSON.parse(localStorage.getItem("settingsTribeMembers"));
    fullPop = tempArray[0].value;
    almostPop = tempArray[1].value;
    semiPop = tempArray[2].value;
    quarterPop = tempArray[3].value;
    fangSize = tempArray[4].value;
    if(tempArray[5]!=undefined) scoutSize = tempArray[5].value;
    else scoutSize=4000;
}
else {
    tempArray = [
        { name: "fullPop", value: "18000" },
        { name: "almostPop", value: "15000" },
        { name: "halfPop", value: "10000" },
        { name: "quarterPop", value: "5000" },
        { name: "fang", value: "200" },
        { name: "scout", value: "4000"}
    ]
    fullPop = tempArray[0].value;
    almostPop = tempArray[1].value;
    semiPop = tempArray[2].value;
    quarterPop = tempArray[3].value;
    fangSize = tempArray[4].value;
    scoutSize = tempArray[5].value;
    localStorage.setItem("settingsTribeMembers", JSON.stringify(tempArray));
}
//collect all player names/ids
$('input:radio[name=player]').each(function () {
    playerURLs.push(baseURL + $(this).attr("value"));
    player.push({ "id": $(this).attr("value"), "name": $(this).parent().text().trim() });
});

cssClassesSophie = `
<style>
.sophRowA {
padding: 10px;
background-color: #32353b;
color: white;
}

.sophRowB {
padding: 10px;
background-color: #36393f;
color: white;
}
.sophHeader {
padding: 10px;
background-color: #202225;
font-weight: bold;
color: white;
}
.sophTitle {
background-color:  #17181a;
}

.collapsible {
background-color: #32353b;
color: white;
cursor: pointer;
padding: 10px;
width: 100%;
border: none;
text-align: left;
outline: none;
font-size: 15px;
}

.active, .collapsible:hover {
background-color:  #36393f;
}

.collapsible:after {
content: '+';
color: white;
font-weight: bold;
float: right;
margin-left: 5px;
}

.active:after {
content: "-";
}

.content {
padding: 0 5px;
max-height: 0;
overflow: hidden;
transition: max-height 0.2s ease-out;
background-color:  #5b5f66;
color: white;
}

.item-padded {
padding: 5px;
}

.flex-container {
display: flex; 
justify-content: space-between;
align-items:center
}

.submenu{
    display:flex;
    flex-direction:column;
    position: absolute;
    left:566px;
    top:53px;
    min-width:234px;
}
</style>`

$("#contentContainer").eq(0).prepend(cssClassesSophie);
$("#mobileHeader").eq(0).prepend(cssClassesSophie);

$.getAll = function (
    urls, // array of URLs
    onLoad, // called when any URL is loaded, params (index, data)
    onDone, // called when all URLs successfully loaded, no params
    onError // called when a URL load fails or if onLoad throws an exception, params (error)
) {
    var numDone = 0;
    var lastRequestTime = 0;
    var minWaitTime = 200; // ms between requests
    loadNext();
    function loadNext() {
        if (numDone == urls.length) {
            onDone();
            return;
        }

        let now = Date.now();
        let timeElapsed = now - lastRequestTime;
        if (timeElapsed < minWaitTime) {
            let timeRemaining = minWaitTime - timeElapsed;
            setTimeout(loadNext, timeRemaining);
            return;
        }
        $("#progress").css("width", `${(numDone + 1) / urls.length * 100}%`);
        lastRequestTime = now;
        $.get(urls[numDone])
            .done((data) => {
                try {
                    onLoad(numDone, data);
                    ++numDone;
                    loadNext();
                } catch (e) {
                    onError(e);
                }
            })
            .fail((xhr) => {
                onError(xhr);
            })
    }
};

function calculateEverything() {
    //progress bar
    $("#contentContainer").eq(0).prepend(`
    <div id="progressbar" style="width: 100%;
    background-color: #36393f;"><div id="progress" style="width: 0%;
    height: 35px;
    background-color: #4CAF50;
    text-align: center;
    line-height: 32px;
    color: black;"></div>
    </div>`);
    $("#mobileHeader").eq(0).prepend(`
    <div id="progressbar" style="width: 100%;
    background-color: #36393f;"><div id="progress" style="width: 0%;
    height: 35px;
    background-color: #4CAF50;
    text-align: center;
    line-height: 32px;
    color: black;"></div>
    </div>`);

    // collect all data from every player
    $.getAll(playerURLs,
        (i, data) => {
            console.log("Grabbing player nr " + i);
            console.log("Grabbing page nr 0");
            
            villageData = {};
            villageData["total"] = {}
            //grab village rows
            if ($(data).find(".paged-nav-item").length == 0) {
                rows = $(data).find(".vis.w100 tr").not(':first');
            }
            else {
                rows = $(data).find(".vis.w100 tr").not(':first').not(":first").not(":last");
            }

            //grab extra pages if there are any
            var allPages = []
            for (var pages = 0; pages < $(data).find(".paged-nav-item").length / 2; pages++) {
                allPages.push($(data).find(".paged-nav-item").eq(pages).attr("href"));
            }
            console.log(allPages);
            $.getAll(allPages,
                (p, getMore) => {
                    console.log("Grabbing page nr " + (p+1));
                    
                    if ($(getMore).find(".paged-nav-item").length == 0) {
                        rows = $.merge(rows,$(getMore).find(".vis.w100 tr").not(':first'));
                    }
                    else {
                        rows = $.merge(rows,$(getMore).find(".vis.w100 tr").not(':first').not(":first").not(":last"));
                    }

                },
                () => {
                    console.log("Rows for player "+player[i].name+ " total: "+rows.length);
                    //create empty total object
                    $.each(game_data.units, function (index) {
                        unitName = game_data.units[index];
                        villageData["total"][unitName] = 0;
                    })
                    //get all unit data
                    $.each(rows, function (rowNr) {
                        thisID = rows.eq(rowNr).find("a")[0].outerHTML.match(/id=(\d*)/)[1];
                        villageData[thisID] = [];
                        $.each(game_data.units, function (index) {
                            unitName = game_data.units[index];
                            if (rows.eq(rowNr).children().not(':first').eq(index).text().trim() != '?') {
                                villageData[thisID][unitName] = rows.eq(rowNr).children().not(':first').eq(index).text().trim();
                                villageData["total"][unitName] += parseInt(rows.eq(rowNr).children().not(':first').eq(index).text().trim());
                            }
                            else {
                                villageData[thisID][unitName] = 0;
                                villageData["total"][unitName] += 0;
                            }
                        })
                    });

                    playerData[player[i].name] = villageData;
                    // set up total nuke/DV counts at 0 to start
                    typeTotals[player[i].name] = { "fullNuke": 0, "almostNuke": 0, "semiNuke": 0, "quarterNuke": 0, "fullDV": 0, "almostDV": 0, "semiDV": 0, "quarterDV": 0, "train": 0, "fang": 0, "scout":0};
                },
                (error) => {
                    console.error(error);
                });



        },
        () => {
            $("#progressbar").remove();
            displayEverything();
        },
        (error) => {
            console.error(error);
        });
}

calculateEverything();
function makeThingsCollapsible() {
    var coll = $(".collapsible");
    for (var i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function () {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    }
}
function numberWithCommas(x) {
    // add . to make numbers more readable
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x))
        x = x.replace(pattern, "$1.$2");
    return x;
}

function saveSettings() {

    tempArray = $("#settings").serializeArray();
    fullPop = tempArray[0].value;
    almostPop = tempArray[1].value;
    semiPop = tempArray[2].value;
    quarterPop = tempArray[3].value;
    fangSize = tempArray[4].value;
    localStorage.setItem("settingsTribeMembers", JSON.stringify(tempArray));
    $(".flex-container").remove();
    $("div[id*='player']").remove();
    displayEverything();
}

function displayEverything() {
    html = `
    <div class="sophTitle sophHeader flex-container" style="width: 800px;position: relative">
        <div class="sophTitle sophHeader" style="width: 550px;min-width: 520px;"><font size="5">Tribe member troop counter</font></div>
        <button class="sophRowA collapsible" style="width: 250px;min-width: 230px;">Open settings menu</button>
        <div class="content submenu" style="width: 200px;height:500px;z-index:99999">
            <form id="settings">
                <table style="border-spacing: 2px;">
                <tr>
                <td style="padding: 6px;">
                <label for="fullPop">Full</label></td><td style="padding: 6px;"><input type="text" name="fullPop" value="${fullPop}" style="width:92px" /> pop</td></tr>
                <tr>
                <td style="padding: 6px;">
                <label for="almostPop">3/4</label></td><td style="padding: 6px;"><input type="text" name="almostPop" value="${almostPop}" style="width:92px"/> pop</td></tr>
                <tr>
                <td style="padding: 6px;">
                <label for="halfPop">1/2</label></td><td style="padding: 6px;"><input type="text" name="halfPop" value="${semiPop}" style="width:92px"/> pop</td></tr>
                <tr>
                <td style="padding: 6px;">
                <label for="quarterPop">1/4</label></td><td style="padding: 6px;"><input type="text" name="quarterPop" value="${quarterPop}" style="width:92px"/> pop</td></tr>
                <tr>
                <td style="padding: 6px;">
                <label for="fang">Cata/fang</label></td><td style="padding: 6px;"><input type="text" name="fang" value="${fangSize}" style="width:84px"/> units</td></tr>
                <tr>
                <td style="padding: 6px;">
                <label for="scout">Scout vil</label></td><td style="padding: 6px;"><input type="text" name="scout" value="${scoutSize}" style="width:84px"/> units</td></tr>
                <tr>
                <td style="padding: 6px;">
                <input type="button" class="btn evt-confirm-btn btn-confirm-yes" value="Save" onclick="saveSettings();"/></td></tr>
                <td colspan="2" style="padding: 6px;">
                <p style="padding:5px"><font size="1">Script by Sophie "Shinko to Kuma"</font></p>
                </td>
                </table>
            </form>
        </div> 
    </div>`;
    //display the data in a neat UI
    $.each(player, function (play) {
        typeTotals[player[play].name] = { "fullNuke": 0, "almostNuke": 0, "semiNuke": 0, "quarterNuke": 0, "fullDV": 0, "almostDV": 0, "semiDV": 0, "quarterDV": 0, "train": 0, "fang": 0,"scout":0 };
    });

    $.each(playerData, function (playerName) {
        //calculate nuke and DV counts
        for (var villageCounter = 0; villageCounter < Object.keys(playerData[playerName]).length; villageCounter++) {
            if (Object.keys(playerData[playerName])[villageCounter] != "total") {
                //check what kind of village we're dealing with

                thisVillageOffPop = 0;
                thisVillageDefPop = 0;
                thisVillageTrain = 0;
                thisVillageFang = 0;
                thisVillageScout=0;
                for (var lol = 0; lol < game_data.units.length; lol++) {
                    switch (Object.keys(playerData[playerName][Object.keys(playerData[playerName])[villageCounter]])[lol]) {
                        case "spear":
                            thisVillageDefPop += parseInt(playerData[playerName][Object.keys(playerData[playerName])[villageCounter]][game_data.units[lol]]);
                            break;
                        case "sword":
                            thisVillageDefPop += parseInt(playerData[playerName][Object.keys(playerData[playerName])[villageCounter]][game_data.units[lol]]);
                            break;
                        case "archer":
                            thisVillageDefPop += parseInt(playerData[playerName][Object.keys(playerData[playerName])[villageCounter]][game_data.units[lol]]);
                            break;
                        case "axe":
                            thisVillageOffPop += parseInt(playerData[playerName][Object.keys(playerData[playerName])[villageCounter]][game_data.units[lol]]);
                            break;
                        case "spy":
                            // Don't count scouts in population calculations
                            if (parseInt(playerData[playerName][Object.keys(playerData[playerName])[villageCounter]][game_data.units[lol]]) > scoutSize) {
                                thisVillageScout++;
                            }
                            break;
                        case "light":
                            thisVillageOffPop += 4 * parseInt(playerData[playerName][Object.keys(playerData[playerName])[villageCounter]][game_data.units[lol]]);
                            break;
                        case "marcher":
                            thisVillageOffPop += 5 * parseInt(playerData[playerName][Object.keys(playerData[playerName])[villageCounter]][game_data.units[lol]]);
                            break;
                        case "ram":
                            thisVillageOffPop += 5 * parseInt(playerData[playerName][Object.keys(playerData[playerName])[villageCounter]][game_data.units[lol]]);
                            break;
                        case "heavy":
                            thisVillageDefPop += 6 * parseInt(playerData[playerName][Object.keys(playerData[playerName])[villageCounter]][game_data.units[lol]]);
                            break;
                        case "catapult":
                            thisVillageOffPop += 8 * parseInt(playerData[playerName][Object.keys(playerData[playerName])[villageCounter]][game_data.units[lol]]);
                            //check if fang possible?
                            if (parseInt(playerData[playerName][Object.keys(playerData[playerName])[villageCounter]][game_data.units[lol]]) > fangSize) {
                                thisVillageFang++;
                            }
                            break;
                        case "snob":
                            if (parseInt(playerData[playerName][Object.keys(playerData[playerName])[villageCounter]][game_data.units[lol]]) >= 4) {
                                //has train
                                thisVillageTrain++;
                            }
                            break;
                        default:
                            //militia/paladin left
                            break;
                    }
                }

                //calculate here how many villages belong to which category
                
                // Determine if village is primarily offensive or defensive
                // Only count if it meets minimum threshold (quarterPop)
                if (thisVillageOffPop > thisVillageDefPop && thisVillageOffPop >= quarterPop) {
                    // Offensive village
                    if (thisVillageOffPop >= fullPop) {
                        typeTotals[playerName]["fullNuke"] += 1;
                    } else if (thisVillageOffPop >= almostPop) {
                        typeTotals[playerName]["almostNuke"] += 1;
                    } else if (thisVillageOffPop >= semiPop) {
                        typeTotals[playerName]["semiNuke"] += 1;
                    } else {
                        typeTotals[playerName]["quarterNuke"] += 1;
                    }
                } else if (thisVillageDefPop > thisVillageOffPop && thisVillageDefPop >= quarterPop) {
                    // Defensive village
                    if (thisVillageDefPop >= fullPop) {
                        typeTotals[playerName]["fullDV"] += 1;
                    } else if (thisVillageDefPop >= almostPop) {
                        typeTotals[playerName]["almostDV"] += 1;
                    } else if (thisVillageDefPop >= semiPop) {
                        typeTotals[playerName]["semiDV"] += 1;
                    } else {
                        typeTotals[playerName]["quarterDV"] += 1;
                    }
                }

                // Train

                if (thisVillageTrain > 0) typeTotals[playerName]["train"]++;

                // fang
                if (thisVillageFang > 0) typeTotals[playerName]["fang"]++;
                 // scout
                 if (thisVillageScout > 0) typeTotals[playerName]["scout"]++;

            }
        }

        html += `
        <div id='player${playerName}' class="sophHeader" style="float: left;width: 800px;">
            <p style="padding:10px">${playerName}</p>
            <div class="sophRowA" width="760px">
            <table width="100%"><tr><td><table>`
        offTable = "";
        defTable = "";
        other = "";
        $.each(typeTotals[playerName], function (type) {
            switch (type) {
                case "fullNuke":
                    offTable += `<tr><td class="item-padded">Full nukes: </td><td class="item-padded">${typeTotals[playerName][type]}</td></tr>`
                    break;
                case "almostNuke":
                    offTable += `<tr><td class="item-padded">3/4 nukes: </td><td class="item-padded">${typeTotals[playerName][type]}</td></tr>`
                    break;
                case "semiNuke":
                    offTable += `<tr><td class="item-padded">1/2 nukes: </td><td class="item-padded">${typeTotals[playerName][type]}</td></tr>`
                    break;
                case "quarterNuke":
                    offTable += `<tr><td class="item-padded">1/4 nukes: </td><td class="item-padded">${typeTotals[playerName][type]}</td></tr>`
                    break;
                case "fullDV":
                    defTable += `<tr><td class="item-padded">Full DV: </td><td class="item-padded">${typeTotals[playerName][type]}</td></tr>`
                    break;
                case "almostDV":
                    defTable += `<tr><td class="item-padded">3/4 DV: </td><td class="item-padded">${typeTotals[playerName][type]}</td></tr>`
                    break;
                case "semiDV":
                    defTable += `<tr><td class="item-padded">1/2 DV: </td><td class="item-padded">${typeTotals[playerName][type]}</td></tr>`
                    break;
                case "quarterDV":
                    defTable += `<tr><td class="item-padded">1/4 DV: </td><td class="item-padded">${typeTotals[playerName][type]}</td></tr>`
                    break;
                case "train":
                    other += `<tr><td class="item-padded">Trains: </td><td class="item-padded">${typeTotals[playerName][type]}</td></tr>`
                    break;
                case "fang":
                    other += `<tr><td class="item-padded">Fangs: </td><td class="item-padded">${typeTotals[playerName][type]}</td></tr>`
                    break;
                case "scout":
                    other += `<tr><td class="item-padded">Scout vil: </td><td class="item-padded">${typeTotals[playerName][type]}</td></tr>`
                    break;
                default:
                    console.log("Rip in pepperonis")
                    break;
            }
        });

        html += offTable + "</table></td><td><table>" + defTable + "</table></td><td><table>" + other;
        html += `</table></td></tr></table>
                </div>
                <button class="collapsible">More details</button>
                <div class="content"><table><tr>`;
        let unitIndex = 0;
        let troopNames = Object.keys(playerData[playerName]["total"]);
        $.each(playerData[playerName]["total"], function (troopName) {
            // Display the value from the next unit (shift left by 1)
            let displayValue = 0;
            if (unitIndex < troopNames.length - 1) {
                // Get value from next unit
                displayValue = playerData[playerName]["total"][troopNames[unitIndex + 1]];
            }
            
            if (troopName == "spy" || troopName == "ram" || troopName == "snob") {
                html += '</tr><tr>'
            }
            html += `<td><table><tr><td class="item-padded"><img src="/graphic/unit/unit_${troopName}.png" title="${troopName}" alt="" class=""></td>
                <td class="item-padded">${numberWithCommas(displayValue)}</td></tr></table></td>`
            unitIndex++;
        })

        html += `</tr></table></div></div>`;
    });

    $("#contentContainer").prepend(html);
    makeThingsCollapsible();
}