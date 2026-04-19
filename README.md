# SPACE 2048

## Overview

 SPACE 2048 is a modern implementation of the classic 2048 puzzle game, developed using HTML, CSS, and JavaScript. It introduces a unique anti-gravity mechanic that alters traditional tile movement behavior, creating a more dynamic and strategic gameplay experience. The project focuses on clean architecture, efficient logic handling, and an intuitive user interface.

---

## Features

- Standard 2048 gameplay mechanics  
- Anti-gravity mode with modified tile movement behavior  
- Dynamic tile generation (2 and 4)  
- Score and best score tracking  
- Undo functionality using state history  
- Game over detection based on valid moves  
- Smooth animations and responsive UI  

---

## Gameplay Mechanics

- The game operates on a 4×4 grid represented as a two-dimensional array  
- On each move:
  - Tiles shift in the chosen direction  
  - Adjacent tiles with equal values merge into one  
  - A new tile is generated in an empty cell  
- In anti-gravity mode:
  - Tile movement is reversed or altered, changing how tiles settle within the grid  
- The game ends when no valid moves are available  

---

## Tech Stack

- HTML for structure  
- CSS for layout and animations  
- JavaScript for game logic and state management  

---

## Project Structure

```bash
anti-gravity-2048/
│
├── index.html
├── style.css
├── script.js

## Author

ABIRAMI B L
