class Game {
    constructor() {
        this.sleigh = document.getElementById('sleigh');
        this.gameArea = document.getElementById('game-area');
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over');
        this.finalScoreElement = document.getElementById('final-score');
        
        this.score = 0;
        this.lives = 3;
        this.speed = 2;
        this.isGameRunning = false;
        this.presentInterval = null;
        this.snowflakeInterval = null;
        this.sleighDirection = 1; // 1 for right, -1 for left
        this.sleighSpeed = 3;
        this.sleighPosition = 0;
        this.buildings = [];
        
        this.init();
    }

    init() {
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        document.getElementById('restart-button').addEventListener('click', () => this.startGame());
        
        this.createBuildings();
    }

    createBuildings() {
        this.buildings.forEach(building => building.remove());
        this.buildings = [];

        const buildingCount = 4;
        const gameWidth = this.gameArea.offsetWidth;
        const minWidth = 60;
        const maxWidth = 100;
        const minHeight = 100;
        const maxHeight = 250;
        const spacing = gameWidth / buildingCount;

        for (let i = 0; i < buildingCount; i++) {
            const building = document.createElement('div');
            building.className = 'building';
            
            const width = Math.random() * (maxWidth - minWidth) + minWidth;
            const height = Math.random() * (maxHeight - minHeight) + minHeight;
            const left = i * spacing + (spacing - width) / 2;

            building.style.width = `${width}px`;
            building.style.height = `${height}px`;
            building.style.left = `${left}px`;

            this.gameArea.appendChild(building);
            this.buildings.push(building);
        }
    }

    moveSleigh() {
        if (!this.isGameRunning) return;

        this.sleighPosition += this.sleighSpeed * this.sleighDirection;
        const maxX = this.gameArea.offsetWidth - this.sleigh.offsetWidth;

        if (this.sleighPosition >= maxX) {
            this.sleighDirection = -1;
            this.sleighPosition = maxX;
        } else if (this.sleighPosition <= 0) {
            this.sleighDirection = 1;
            this.sleighPosition = 0;
        }

        this.sleigh.style.left = `${this.sleighPosition}px`;

        if (this.checkBuildingCollision()) {
            this.gameOver();
        }

        requestAnimationFrame(() => this.moveSleigh());
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
        this.score = 0;
        this.lives = 3;
        this.speed = 2;
        this.isGameRunning = true;
        this.scoreElement.textContent = this.score;
        this.livesElement.textContent = this.lives;
        
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        
        this.clearIntervals();
        this.startDropping();
        this.createSnowfall();
        this.sleighPosition = 0;
        this.sleighDirection = 1;
        this.sleigh.style.left = '0px';
        
        this.createBuildings();
        this.moveSleigh();
    }

    createPresent() {
        const present = document.createElement('div');
        present.className = 'present';
        const position = Math.random() * (this.gameArea.offsetWidth - 40);
        present.style.left = `${position}px`;
        present.style.top = '0';
        this.gameArea.appendChild(present);

        const fall = setInterval(() => {
            const top = present.offsetTop + this.speed;
            present.style.top = `${top}px`;

            if (this.checkCollision(present)) {
                this.gameArea.removeChild(present);
                clearInterval(fall);
                this.score++;
                this.scoreElement.textContent = this.score;
                this.speed += 0.1;
            } else if (top > this.gameArea.offsetHeight) {
                this.gameArea.removeChild(present);
                clearInterval(fall);
                this.lives--;
                this.livesElement.textContent = this.lives;
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
            }
        }, 16);
    }

    createSnowfall() {
        this.snowflakeInterval = setInterval(() => {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.textContent = '❄';
            snowflake.style.left = `${Math.random() * 100}%`;
            snowflake.style.animationDuration = `${Math.random() * 3 + 2}s`;
            this.gameArea.appendChild(snowflake);

            setTimeout(() => {
                this.gameArea.removeChild(snowflake);
            }, 5000);
        }, 100);
    }

    checkCollision(present) {
        const presentRect = present.getBoundingClientRect();
        const sleighRect = this.sleigh.getBoundingClientRect();

        return !(presentRect.right < sleighRect.left || 
                presentRect.left > sleighRect.right || 
                presentRect.bottom < sleighRect.top || 
                presentRect.top > sleighRect.bottom);
    }

    startDropping() {
        this.presentInterval = setInterval(() => {
            this.createPresent();
        }, 2000);
    }

    clearIntervals() {
        if (this.presentInterval) clearInterval(this.presentInterval);
        if (this.snowflakeInterval) clearInterval(this.snowflakeInterval);
        const presents = document.querySelectorAll('.present');
        presents.forEach(present => this.gameArea.removeChild(present));
    }

    gameOver() {
        this.isGameRunning = false;
        this.clearIntervals();
        this.finalScoreElement.textContent = this.score;
        this.gameOverScreen.classList.remove('hidden');
        
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        explosion.style.left = this.sleigh.style.left;
        explosion.style.top = this.sleigh.style.top;
        this.gameArea.appendChild(explosion);
        
        setTimeout(() => explosion.remove(), 1000);
    }
}

// Initialize the game
const game = new Game(); 