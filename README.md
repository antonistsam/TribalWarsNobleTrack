# Tribal Wars Noble Track Scraper

A Python script that scrapes Tribal Wars statistics to find all worlds where a player has been nobled (conquered) and counts the noblements per world.

## Features

- Automatically discovers all Tribal Wars worlds (gr1-gr102) where a player has activity
- Scrapes conquest data for each discovered world
- Counts how many times a player was nobled in each world
- Provides a summary of total noblements across all worlds

## Requirements

- Python 3.6 or higher
- Required packages:
  - requests
  - beautifulsoup4

## Installation

1. Clone or download this repository
2. Install the required dependencies:

```powershell
pip install -r requirements.txt
```

## Usage

You can run the script in two ways:

### Method 1: Command-line arguments

```powershell
python tribal_wars_scraper.py <player_id> <player_name> <active_world>
```

Example:
```powershell
python tribal_wars_scraper.py 12345 "PlayerName" 102
```

### Method 2: Interactive mode

Simply run the script without arguments and it will prompt you for input:

```powershell
python tribal_wars_scraper.py
```

Then enter the requested information:
- Player ID: The numeric ID of the player
- Player name: The exact name of the player
- Active world number: A world where the player is or was active (e.g., 102 for gr102)

## How It Works

1. **World Discovery**: The script first visits the player's page on the specified world and searches the entire HTML for references to different Tribal Wars worlds (gr1 through gr102).

2. **Noblement Counting**: For each discovered world, the script visits the player's conquest page and counts how many times the player appears as a victim (was nobled) in elements with the `playerlink` class.

3. **Results**: The script displays the number of noblements per world and provides a total count.

## Example Output

```
============================================================
Tribal Wars Noble Track Scraper
============================================================

Player ID: 12345
Player Name: ExamplePlayer
Active World: gr102

------------------------------------------------------------

Searching for worlds at: https://gr.twstats.com/gr102/index.php?page=player&id=12345
Found 5 distinct worlds: [12, 13, 14, 92, 102]

------------------------------------------------------------

Checking noblements across all discovered worlds...

Checking gr12... Found 4 times
Checking gr13... Found 2 times
Checking gr14... Found 3 times
Checking gr92... Found 1 times
Checking gr102... Found 0 times

============================================================
FINAL RESULTS
============================================================

Player ExamplePlayer was nobled 4 times in gr12
Player ExamplePlayer was nobled 2 times in gr13
Player ExamplePlayer was nobled 3 times in gr14
Player ExamplePlayer was nobled 1 times in gr92

Total noblements across all worlds: 10
```

## Notes

- The script uses BeautifulSoup for HTML parsing (no Selenium required for this task)
- Network timeouts are set to 10 seconds per request
- The script handles errors gracefully and continues with other worlds if one fails
- World numbers are filtered to the valid range (1-102)

## License

This project is open source and available for personal use.
