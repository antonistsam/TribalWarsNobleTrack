"""
Tribal Wars Noble Track Scraper

This script scrapes Tribal Wars statistics to find all worlds where a player
has been nobled (conquered) and counts the noblements per world.
"""

import requests
from bs4 import BeautifulSoup
import re
import sys
from collections import defaultdict


def find_all_worlds(player_id, active_world):
    """
    Scrapes the player's main page to find all distinct world numbers referenced.
    
    Args:
        player_id: The player's ID
        active_world: The world number where the player is/was active
        
    Returns:
        A set of distinct world numbers found (as integers)
    """
    url = f"https://gr.twstats.com/gr{active_world}/index.php?page=player&id={player_id}"
    
    print(f"Searching for worlds at: {url}")
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Error fetching player page: {e}")
        return set()
    
    html_content = response.text
    
    # Find all references to gr followed by numbers (gr1 to gr102)
    # Pattern matches "gr" followed by 1-3 digits
    pattern = r'gr(\d{1,3})'
    matches = re.findall(pattern, html_content)
    
    # Convert to integers and filter to valid range (1-102)
    worlds = set()
    for match in matches:
        world_num = int(match)
        if 1 <= world_num <= 102:
            worlds.add(world_num)
    
    print(f"Found {len(worlds)} distinct worlds: {sorted(worlds)}")
    return worlds


def count_noblements_in_world(player_id, player_name, world_num):
    """
    Counts how many times a player was nobled in a specific world.
    Only counts noblements where the victim is in a 'playerlink' class element.
    
    Args:
        player_id: The player's ID
        player_name: The player's name
        world_num: The world number to check
        
    Returns:
        The count of distinct noblements
    """
    url = f"https://gr.twstats.com/gr{world_num}/index.php?page=player&mode=conquers&id={player_id}&type=&pn=-1"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"  Error fetching conquers for gr{world_num}: {e}")
        return 0
    
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Find all <a> elements with class 'playerlink'
    playerlinks = soup.find_all('a', class_='playerlink')
    
    # Count how many times the player appears as a victim (nobled)
    # The structure typically has the victim's name in playerlink elements
    noblement_count = 0
    
    for link in playerlinks:
        # Check if this link contains the player's name
        link_text = link.get_text(strip=True)
        if link_text == player_name or player_name.lower() in link_text.lower():
            noblement_count += 1
    
    return noblement_count


def main():
    """Main function to run the scraper."""
    
    print("=" * 60)
    print("Tribal Wars Noble Track Scraper")
    print("=" * 60)
    print()
    
    # Get input parameters
    if len(sys.argv) == 4:
        player_id = sys.argv[1]
        player_name = sys.argv[2]
        active_world = sys.argv[3]
    else:
        # Interactive input
        player_id = input("Enter player ID: ").strip()
        player_name = input("Enter player name: ").strip()
        active_world = input("Enter active world number (e.g., 102): ").strip()
    
    if not player_id or not player_name or not active_world:
        print("Error: All parameters are required!")
        sys.exit(1)
    
    print()
    print(f"Player ID: {player_id}")
    print(f"Player Name: {player_name}")
    print(f"Active World: gr{active_world}")
    print()
    print("-" * 60)
    print()
    
    # Step 1: Find all worlds
    worlds = find_all_worlds(player_id, active_world)
    
    if not worlds:
        print("No worlds found. Please check the player ID and world number.")
        return
    
    print()
    print("-" * 60)
    print()
    print("Checking noblements across all discovered worlds...")
    print()
    
    # Step 2: Count noblements in each world
    results = {}
    
    for world_num in sorted(worlds):
        print(f"Checking gr{world_num}...", end=" ")
        count = count_noblements_in_world(player_id, player_name, world_num)
        results[world_num] = count
        print(f"Found {count} noblements")
    
    # Display final results
    print()
    print("=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)
    print()
    
    total_noblements = 0
    for world_num in sorted(results.keys()):
        count = results[world_num]
        if count > 0:
            print(f"Player {player_name} was nobled {count} times in gr{world_num}")
            total_noblements += count
    
    print()
    print(f"Total noblements across all worlds: {total_noblements}")
    print()


if __name__ == "__main__":
    main()
