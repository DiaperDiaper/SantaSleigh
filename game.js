class Game {
    constructor() {
        // DOM Elements
        this.sleigh = document.getElementById('sleigh');
        this.gameArea = document.getElementById('game-area');
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        this.startScreen = document.getElementById('start-panel');
        this.gameOverScreen = document.getElementById('game-over');
        this.startButton = document.getElementById('start-button');
        this.restartButton = document.getElementById('restart-button');
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.isGameRunning = false;
        this.buildings = [];
        this.buildingSpeed = 2;
        this.presentInterval = null;
        this.buildingInterval = null;
        
        // Player movement
        this.playerX = 350;
        this.playerY = 300;
        this.playerSpeed = 8;
        this.activeKeys = new Set();

        // High scores
        this.highScores = this.loadHighScores();
        
        // Event listeners
        this.setupControls();
        this.startButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.startGame());
        document.getElementById('save-score').addEventListener('click', () => this.saveHighScore());
        
        // Add snowflake creation
        this.createSnowflakes();

        // Add obstacle properties
        this.obstacles = [];
        this.obstacleInterval = null;
        this.baseObstacleInterval = 3000; // Start with 3 seconds
        this.minObstacleInterval = 1000;  // Minimum 1 second between obstacles
        this.obstacleSpeed = 3;

        // Mobile touch variables
        this.touchStartX = null;
        this.touchStartY = null;
        this.isTouching = false;
        
        // Add mobile detection
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        this.setupMobileControls();

        // Special present types with different values
        this.specialPresents = [
            { emoji: '🎄', points: 3 },    // Christmas tree: 3 points
            { emoji: '⭐', points: 5 },     // Star: 5 points
            { emoji: '🦌', points: 10 }     // Reindeer: 10 points
        ];
        this.specialPresentChance = 0.15;   // 15% chance for special present
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                this.activeKeys.add(e.key);
            }
        });

        document.addEventListener('keyup', (e) => {
            this.activeKeys.delete(e.key);
        });
    }

    setupMobileControls() {
        if (!this.isMobile) return;

        // Add touch controls
        this.gameArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            this.isTouching = true;
            
            // Show touch indicator
            this.showTouchIndicator(touch.clientX, touch.clientY);
        });

        this.gameArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.isGameRunning || !this.isTouching) return;

            const touch = e.touches[0];
            const deltaX = touch.clientX - this.touchStartX;
            const deltaY = touch.clientY - this.touchStartY;

            // Update position with smooth movement
            this.playerX = Math.max(0, Math.min(
                this.gameArea.offsetWidth - 100,
                this.playerX + deltaX * 1.5
            ));
            this.playerY = Math.max(0, Math.min(
                this.gameArea.offsetHeight - 60,
                this.playerY + deltaY * 1.5
            ));

            // Update touch start positions
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;

            // Update touch indicator
            this.updateTouchIndicator(touch.clientX, touch.clientY);
        });

        this.gameArea.addEventListener('touchend', () => {
            this.isTouching = false;
            this.hideTouchIndicator();
        });

        // Add swipe detection for quick movements
        let swipeStartX = 0;
        let swipeStartY = 0;
        let swipeStartTime = 0;

        this.gameArea.addEventListener('touchstart', (e) => {
            swipeStartX = e.touches[0].clientX;
            swipeStartY = e.touches[0].clientY;
            swipeStartTime = Date.now();
        });

        this.gameArea.addEventListener('touchend', (e) => {
            const deltaTime = Date.now() - swipeStartTime;
            const deltaX = e.changedTouches[0].clientX - swipeStartX;
            const deltaY = e.changedTouches[0].clientY - swipeStartY;

            // Detect quick swipes
            if (deltaTime < 200) {
                const swipeSpeed = 30;
                if (Math.abs(deltaX) > 50) {
                    this.playerX += deltaX > 0 ? swipeSpeed : -swipeSpeed;
                }
                if (Math.abs(deltaY) > 50) {
                    this.playerY += deltaY > 0 ? swipeSpeed : -swipeSpeed;
                }
            }
        });
    }

    showTouchIndicator(x, y) {
        if (!this.touchIndicator) {
            this.touchIndicator = document.createElement('div');
            this.touchIndicator.className = 'touch-indicator';
            document.body.appendChild(this.touchIndicator);
        }
        this.touchIndicator.style.display = 'block';
        this.updateTouchIndicator(x, y);
    }

    updateTouchIndicator(x, y) {
        if (this.touchIndicator) {
            this.touchIndicator.style.left = `${x}px`;
            this.touchIndicator.style.top = `${y}px`;
        }
    }

    hideTouchIndicator() {
        if (this.touchIndicator) {
            this.touchIndicator.style.display = 'none';
        }
    }

    movePlayer() {
        if (!this.isGameRunning) return;

        let moved = false;
        
        if (this.activeKeys.has('ArrowLeft')) {
            this.playerX = Math.max(0, this.playerX - this.playerSpeed);
            moved = true;
            this.sleigh.style.transform = 'rotate(-5deg)';
        } else if (this.activeKeys.has('ArrowRight')) {
            this.playerX = Math.min(this.gameArea.offsetWidth - 100, this.playerX + this.playerSpeed);
            moved = true;
            this.sleigh.style.transform = 'rotate(5deg)';
        }
        
        if (this.activeKeys.has('ArrowUp')) {
            this.playerY = Math.max(0, this.playerY - this.playerSpeed);
            moved = true;
        } else if (this.activeKeys.has('ArrowDown')) {
            this.playerY = Math.min(this.gameArea.offsetHeight - 60, this.playerY + this.playerSpeed);
            moved = true;
        }

        // Reset rotation when not moving
        if (!moved) {
            this.sleigh.style.transform = 'rotate(0deg)';
        }

        this.sleigh.style.left = `${this.playerX}px`;
        this.sleigh.style.top = `${this.playerY}px`;

        // Add rocking animation class when moving
        if (moved) {
            this.sleigh.classList.add('rocking');
        } else {
            this.sleigh.classList.remove('rocking');
        }

        if (this.checkBuildingCollision()) {
            this.gameOver();
            return;
        }

        requestAnimationFrame(() => this.movePlayer());
    }

    createPresent(isSpecial = false) {
        const present = document.createElement('div');
        present.className = 'present';
        
        let points = 1;
        if (isSpecial) {
            const specialPresent = this.specialPresents[
                Math.floor(Math.random() * this.specialPresents.length)
            ];
            present.innerHTML = specialPresent.emoji;
            points = specialPresent.points;
            present.classList.add('special-present');
            present.dataset.points = points;
        } else {
            present.innerHTML = '🎁';
        }
        
        const position = Math.random() * (this.gameArea.offsetWidth - 40);
        present.style.left = `${position}px`;
        present.style.top = '0';
        
        this.gameArea.appendChild(present);

        let presentY = 0;
        const fall = setInterval(() => {
            if (!this.isGameRunning) {
                clearInterval(fall);
                present.remove();
                return;
            }

            // Special presents fall slower
            presentY += isSpecial ? 2 : 3;
            present.style.top = `${presentY}px`;

            if (this.checkCollision(present)) {
                clearInterval(fall);
                present.remove();
                
                this.score += points;
                this.scoreElement.textContent = this.score;
                
                // Show festive score popup
                this.showFestiveScorePopup(points, position, presentY);
                
                // Special collection effect
                if (isSpecial) {
                    this.createFestiveEffect(position, presentY, points);
                }
                
            } else if (presentY > this.gameArea.offsetHeight) {
                clearInterval(fall);
                present.remove();
                this.lives--;
                this.livesElement.textContent = this.lives;
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
            }
        }, 16);
    }

    showFestiveScorePopup(points, x, y) {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        // Add festive emojis based on points
        const festiveEmoji = points >= 10 ? '🎄✨' : 
                           points >= 5 ? '⭐' : 
                           points >= 3 ? '🎄' : '🎁';
        popup.innerHTML = `+${points} ${festiveEmoji}`;
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        this.gameArea.appendChild(popup);

        setTimeout(() => popup.remove(), 1000);
    }

    createFestiveEffect(x, y, points) {
        const effect = document.createElement('div');
        effect.className = 'festive-effect';
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        
        // Add festive particles
        const particles = ['❄', '✨', '🎄', '⭐'];
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'festive-particle';
            particle.innerHTML = particles[Math.floor(Math.random() * particles.length)];
            particle.style.transform = `rotate(${i * 45}deg) translate(30px)`;
            effect.appendChild(particle);
        }
        
        this.gameArea.appendChild(effect);
        setTimeout(() => effect.remove(), 1000);
    }

    createBuilding() {
        const building = document.createElement('div');
        building.className = 'building';
        
        const height = Math.random() * 150 + 100;
        building.style.width = '80px';
        building.style.height = `${height}px`;
        building.style.left = `${this.gameArea.offsetWidth}px`;

        this.gameArea.appendChild(building);
        this.buildings.push(building);
    }

    updateBuildings() {
        if (!this.isGameRunning) return;

        this.buildings.forEach((building, index) => {
            let currentLeft = parseFloat(building.style.left);
            currentLeft -= this.buildingSpeed;
            building.style.left = `${currentLeft}px`;

            if (currentLeft < -100) {
                building.remove();
                this.buildings.splice(index, 1);
            }
        });

        requestAnimationFrame(() => this.updateBuildings());
    }

    checkCollision(present) {
        const sleighRect = this.sleigh.getBoundingClientRect();
        const presentRect = present.getBoundingClientRect();

        return !(sleighRect.right < presentRect.left || 
                sleighRect.left > presentRect.right || 
                sleighRect.bottom < presentRect.top || 
                sleighRect.top > presentRect.bottom);
    }

    checkBuildingCollision() {
        const sleighRect = this.sleigh.getBoundingClientRect();
        
        return this.buildings.some(building => {
            const buildingRect = building.getBoundingClientRect();
            return !(sleighRect.right < buildingRect.left || 
                    sleighRect.left > buildingRect.right || 
                    sleighRect.bottom < buildingRect.top || 
                    sleighRect.top > buildingRect.bottom);
        });
    }

    startGame() {
        // Reset game state
        this.score = 0;
        this.lives = 3;
        this.isGameRunning = true;
        this.scoreElement.textContent = this.score;
        this.livesElement.textContent = this.lives;
        
        // Make sure sleigh is visible
        this.sleigh.style.visibility = 'visible';
        this.sleigh.style.display = 'block';
        
        // Hide menus
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        
        // Set initial position for entrance animation
        this.playerX = -100;
        this.playerY = -100;
        this.sleigh.style.left = `${this.playerX}px`;
        this.sleigh.style.top = `${this.playerY}px`;
        
        // Add entrance animation
        this.sleigh.classList.add('entrance-animation');
        
        // Start game after animation
        setTimeout(() => {
            this.sleigh.classList.remove('entrance-animation');
            this.playerX = 350;
            this.playerY = 300;
            this.movePlayer();
            this.startGameElements();
        }, 2000);
    }

    startGameElements() {
        // Clear existing elements
        this.buildings.forEach(building => building.remove());
        this.buildings = [];
        this.obstacles.forEach(obstacle => obstacle.remove());
        this.obstacles = [];
        Array.from(document.getElementsByClassName('present')).forEach(present => present.remove());
        
        // Start game loops
        if (this.presentInterval) clearInterval(this.presentInterval);
        this.presentInterval = setInterval(() => {
            if (this.isGameRunning) this.createPresent();
        }, 2000);
        
        if (this.buildingInterval) clearInterval(this.buildingInterval);
        this.buildingInterval = setInterval(() => {
            if (this.isGameRunning) this.createBuilding();
        }, 2000);
        
        this.updateObstacleInterval();
        this.updateBuildings();
    }

    gameOver() {
        this.isGameRunning = false;
        
        // Clear intervals
        if (this.presentInterval) clearInterval(this.presentInterval);
        if (this.buildingInterval) clearInterval(this.buildingInterval);
        if (this.obstacleInterval) clearInterval(this.obstacleInterval);
        
        // Create explosion effect
        this.createExplosion(this.playerX, this.playerY);
        
        // Hide sleigh temporarily
        this.sleigh.style.visibility = 'hidden';
        
        // Show game over screen after explosion
        setTimeout(() => {
            document.getElementById('final-score').textContent = this.score;
            this.gameOverScreen.classList.remove('hidden');
        }, 1500);
        
        // Add flash effect
        this.createFlashEffect();
        
        // Create explosion after flash
        setTimeout(() => {
            this.createExplosion(this.playerX + 50, this.playerY + 30);
        }, 100);
    }

    loadHighScores() {
        const scores = localStorage.getItem('santaHighScores');
        return scores ? JSON.parse(scores) : [];
    }

    saveHighScore() {
        const name = document.getElementById('player-name').value.trim() || 'Anonymous';
        const newScore = { name, score: this.score };
        
        this.highScores.push(newScore);
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 5);
        
        localStorage.setItem('santaHighScores', JSON.stringify(this.highScores));
        this.updateHighScoresList();
        
        this.gameOverScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
    }

    updateHighScoresList() {
        const highScoresList = document.getElementById('highScoresList');
        highScoresList.innerHTML = '';
        
        this.highScores.forEach((score, index) => {
            const scoreElement = document.createElement('div');
            scoreElement.className = 'score-item';
            scoreElement.innerHTML = `
                <span>${index + 1}. ${score.name}</span>
                <span>${score.score}</span>
            `;
            highScoresList.appendChild(scoreElement);
        });
    }

    createSnowflakes() {
        const snowflakes = ['❄', '❅', '❆'];
        const gameContainer = document.querySelector('.game-container');
        
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                const snowflake = document.createElement('div');
                snowflake.className = 'snowflake';
                snowflake.innerHTML = snowflakes[Math.floor(Math.random() * snowflakes.length)];
                
                // Random starting position
                snowflake.style.left = `${Math.random() * 100}%`;
                
                // Random size
                const size = Math.random() * 15 + 10;
                snowflake.style.fontSize = `${size}px`;
                
                // Random duration
                const duration = Math.random() * 3 + 5;
                snowflake.style.animationDuration = `${duration}s`;
                
                // Random horizontal drift
                const drift = Math.random() * 50 - 25;
                snowflake.style.animationName = `snowfall-${Math.round(drift)}`;
                
                gameContainer.appendChild(snowflake);
                
                // Remove snowflake after animation
                setTimeout(() => {
                    snowflake.remove();
                }, duration * 1000);
            }
        }, 200);
    }

    createObstacle() {
        const obstacle = document.createElement('div');
        obstacle.className = 'obstacle';
        obstacle.innerHTML = '🎄';
        
        // Random position from top
        const position = Math.random() * (this.gameArea.offsetWidth - 40);
        obstacle.style.left = `${position}px`;
        obstacle.style.top = '0';
        
        this.gameArea.appendChild(obstacle);
        this.obstacles.push(obstacle);

        let obstacleY = 0;
        const fall = setInterval(() => {
            if (!this.isGameRunning) {
                clearInterval(fall);
                obstacle.remove();
                return;
            }

            obstacleY += this.obstacleSpeed + (this.score * 0.1); // Increase speed with score
            obstacle.style.top = `${obstacleY}px`;

            // Check collision with sleigh
            if (this.checkCollision(obstacle)) {
                clearInterval(fall);
                obstacle.remove();
                this.lives--;
                this.livesElement.textContent = this.lives;
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
            } else if (obstacleY > this.gameArea.offsetHeight) {
                clearInterval(fall);
                obstacle.remove();
                const index = this.obstacles.indexOf(obstacle);
                if (index > -1) {
                    this.obstacles.splice(index, 1);
                }
            }
        }, 16);
    }

    updateObstacleInterval() {
        if (this.obstacleInterval) {
            clearInterval(this.obstacleInterval);
        }

        // Decrease interval as score increases
        const newInterval = Math.max(
            this.minObstacleInterval,
            this.baseObstacleInterval - (this.score * 100)
        );

        this.obstacleInterval = setInterval(() => {
            if (this.isGameRunning) {
                this.createObstacle();
            }
        }, newInterval);
    }

    updateScore() {
        this.score++;
        this.scoreElement.textContent = this.score;
        // Update obstacle interval when score changes
        this.updateObstacleInterval();
    }

    createSnowBurst(x, y) {
        const burst = document.createElement('div');
        burst.className = 'snow-burst';
        burst.style.left = `${x}px`;
        burst.style.top = `${y}px`;
        
        // Add multiple snowflakes to the burst
        for (let i = 0; i < 8; i++) {
            const snowflake = document.createElement('span');
            snowflake.textContent = '❄';
            snowflake.style.position = 'absolute';
            snowflake.style.transform = `rotate(${i * 45}deg) translate(20px)`;
            burst.appendChild(snowflake);
        }
        
        this.gameArea.appendChild(burst);
        
        // Remove after animation
        setTimeout(() => burst.remove(), 1000);
    }

    createExplosion(x, y) {
        // Create main explosion container
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        explosion.style.left = `${x}px`;
        explosion.style.top = `${y}px`;
        this.gameArea.appendChild(explosion);

        // Add particles
        const particles = ['🎄', '🎁', '❄️', '✨', '💫', '🎅'];
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'explosion-particle';
            particle.innerHTML = particles[Math.floor(Math.random() * particles.length)];
            
            // Random angle and distance
            const angle = (Math.random() * 360) * (Math.PI / 180);
            const distance = Math.random() * 100 + 50;
            
            // Set random direction and speed
            particle.style.setProperty('--angle', angle + 'rad');
            particle.style.setProperty('--distance', distance + 'px');
            
            explosion.appendChild(particle);
        }

        // Create shockwave effect
        const shockwave = document.createElement('div');
        shockwave.className = 'shockwave';
        explosion.appendChild(shockwave);

        // Cleanup after animation
        setTimeout(() => {
            explosion.remove();
        }, 1500);
    }

    createFlashEffect() {
        const flash = document.createElement('div');
        flash.className = 'flash';
        this.gameArea.appendChild(flash);
        
        // Remove after animation
        setTimeout(() => flash.remove(), 300);
    }

    showMobileControls() {
        if (!this.mobileControls) {
            this.mobileControls = document.createElement('div');
            this.mobileControls.className = 'mobile-controls';
            this.mobileControls.innerHTML = `
                <div class="touch-hint">Drag to move Santa</div>
            `;
            this.gameArea.appendChild(this.mobileControls);
        }
    }

    restartGame() {
        // Clear all existing game elements
        this.buildings.forEach(building => building.remove());
        this.buildings = [];
        Array.from(document.getElementsByClassName('present')).forEach(present => present.remove());
        Array.from(document.getElementsByClassName('obstacle')).forEach(obstacle => obstacle.remove());
        
        // Reset sleigh
        this.sleigh.style.visibility = 'visible';
        this.sleigh.style.display = 'block';
        this.sleigh.classList.remove('entrance-animation');
        
        // Start new game
        this.startGame();
    }
}

// Generate unique snowfall animations for different drift patterns
function generateSnowfallKeyframes() {
    const style = document.createElement('style');
    for (let i = -25; i <= 25; i += 5) {
        const keyframes = `
            @keyframes snowfall-${i} {
                0% {
                    transform: translateY(-100vh) translateX(0);
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    transform: translateY(100vh) translateX(${i}vw);
                    opacity: 0;
                }
            }
        `;
        style.appendChild(document.createTextNode(keyframes));
    }
    document.head.appendChild(style);
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    generateSnowfallKeyframes();
    const game = new Game();
    game.updateHighScoresList();
}); 