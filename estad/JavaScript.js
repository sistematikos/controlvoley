document.addEventListener('DOMContentLoaded', () => {
    const playerNumberInput = document.getElementById('playerNumberInput');
    const playerNameInput = document.getElementById('playerNameInput');
    const addPlayerBtn = document.getElementById('addPlayerBtn');
    const playerSelect = document.getElementById('playerSelect');
    const actionSelect = document.getElementById('actionSelect');
    const quantityInput = document.getElementById('quantityInput');
    const actionForm = document.getElementById('actionForm');
    const scoresContainer = document.getElementById('scoresContainer');
    const clearDataBtn = document.getElementById('clearDataBtn'); 

    let players = [];
    const actions = {
        'Servicio (S#) Positivo': 1, 'Ataque (A#) Positivo': 1, 'Bloqueo (B#) Positivo': 1, 'Recepción (R#) Positiva': 1, 'Coloque (C#) Positivo': 1, 
        'Servicio (S=) Negativo': -1, 'Ataque (A=) Negativo': -1, 'Bloqueo (B=) Negativo': -1, 'Recepción (R=) Negativo': -1, 'Coloque (C=) Negativo': -1, 
    };
    
    // FUNCIÓN: Guardar datos en localStorage
    function savePlayers() {
        localStorage.setItem('volleyballPlayers', JSON.stringify(players));
    }
    
    // FUNCIÓN: Cargar datos desde localStorage
    function loadPlayers() {
        const storedPlayers = localStorage.getItem('volleyballPlayers');
        if (storedPlayers) {
            players = JSON.parse(storedPlayers);
        }
    }
    
    // Cargar datos al inicio
    loadPlayers();

    function setActionSelectColor() {
        const selectedOption = actionSelect.options[actionSelect.selectedIndex];
        const actionName = selectedOption.value;
        const actionValue = actions[actionName];

        if (actionValue > 0) {
            actionSelect.style.color = '#4ade80'; 
        } else if (actionValue < 0) {
            actionSelect.style.color = '#f87171'; 
        } else {
            actionSelect.style.color = '#d1d5db'; 
        }
    }

    function populateActions() {
        actionSelect.innerHTML = '';
        for (const actionName in actions) {
            const option = document.createElement('option');
            const value = actions[actionName];
            option.value = actionName;
            option.textContent = `${actionName} (${value > 0 ? '+' : ''}${value})`;
            if (value > 0) {
                option.style.color = '#4ade80';
            } else {
                option.style.color = '#f87171';
            }
            actionSelect.appendChild(option);
        }
        setActionSelectColor(); 
    }

    function render() {
        playerSelect.innerHTML = '';
        if (players.length === 0) {
            playerSelect.innerHTML = '<option disabled selected>Agrega un atleta primero</option>';
        } else {
            players.forEach((player, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `#${player.number} - ${player.name}`;
                playerSelect.appendChild(option);
            });
        }

        scoresContainer.innerHTML = '';
        if (players.length === 0) {
             scoresContainer.innerHTML = '<p class="text-gray-500 text-center py-8">Aún no hay atletas. ¡Agrégalos para empezar!</p>';
        } else {
            const header = document.createElement('div');
            header.className = 'grid grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))] gap-4 font-semibold text-gray-400 text-sm mb-2 px-3';
            header.innerHTML = `
                <span class="text-left">Atleta</span>
                <span class="text-center">Positivos</span>
                <span class="text-center">Negativos</span>
                <span class="text-right">Total</span>
                <span class="text-center">Efic. %</span>
            `;
            scoresContainer.appendChild(header);

            players.slice().sort((a, b) => b.score - a.score).forEach(player => {
                const scoreDiv = document.createElement('div');
                scoreDiv.className = 'grid grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))] gap-4 items-center bg-gray-700 p-3 rounded-md';

                const playerInfo = document.createElement('span');
                playerInfo.className = 'truncate';
                playerInfo.innerHTML = `<span class="font-bold">#${player.number}</span> <span class="text-gray-300">${player.name}</span>`;

                const positiveScore = document.createElement('span');
                positiveScore.className = 'text-center score-positive font-medium';
                positiveScore.textContent = `+${player.positiveScore}`;

                const negativeScore = document.createElement('span');
                negativeScore.className = 'text-center score-negative font-medium';
                negativeScore.textContent = player.negativeScore;

                const totalScore = document.createElement('span');
                totalScore.className = 'font-bold text-xl text-right';
                if (player.score > 0) totalScore.classList.add('score-positive');
                else if (player.score < 0) totalScore.classList.add('score-negative');
                else totalScore.classList.add('score-neutral');
                totalScore.textContent = player.score;

                const efficiencySpan = document.createElement('span');
                efficiencySpan.className = 'text-center font-semibold text-lg';
                let efficiency = 0;
                if (player.totalActions > 0) {
                    efficiency = (player.positiveScore / player.totalActions) * 100;
                }
                efficiencySpan.textContent = `${efficiency.toFixed(1)}%`;
                if (efficiency >= 60) efficiencySpan.classList.add('score-positive');
                else if (efficiency < 40 && efficiency > 0) efficiencySpan.classList.add('score-negative');
                else efficiencySpan.classList.add('score-neutral');

                scoreDiv.appendChild(playerInfo);
                scoreDiv.appendChild(positiveScore);
                scoreDiv.appendChild(negativeScore);
                scoreDiv.appendChild(totalScore);
                scoreDiv.appendChild(efficiencySpan); 
                scoresContainer.appendChild(scoreDiv);
            });
        }
    }

    function addPlayer() {
        const number = playerNumberInput.value;
        const name = playerNameInput.value.trim();

        if (number && name && !players.some(p => p.number === number)) {
            players.push({
                 number: number,
                 name: name,
                score: 0,
                 positiveScore: 0,
                 negativeScore: 0,
                totalActions: 0
            });
            players.sort((a,b) => parseInt(a.number, 10) - parseInt(b.number, 10));
            playerNumberInput.value = '';
            playerNameInput.value = '';
            savePlayers(); 
            render();
        } else if (!number || !name) {
            alert('Por favor, ingresa el número y el nombre del atleta.');
        } else {
            alert('Este número de atleta ya existe.');
        }
        playerNumberInput.focus();
    }
    
    function clearData() {
        if (confirm('¿Estás seguro de que deseas reiniciar la puntuación y eliminar a todos los atletas? Esta acción es irreversible.')) {
            players = []; 
            localStorage.removeItem('volleyballPlayers'); 
            playerNumberInput.value = '';
            playerNameInput.value = '';
            playerSelect.innerHTML = '<option disabled selected>Agregar atleta primero</option>'; 
            actionForm.reset(); 
            render(); 
        }
    }
    
    actionSelect.addEventListener('change', setActionSelectColor);

    addPlayerBtn.addEventListener('click', addPlayer);
    playerNameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addPlayer(); });
    playerNumberInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') playerNameInput.focus(); });
    
    clearDataBtn.addEventListener('click', clearData); 

    actionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (players.length === 0) return alert('Debes agregar al menos un atleta.');

        const playerIndex = playerSelect.value;
        const actionName = actionSelect.value;
        const quantity = parseInt(quantityInput.value, 10);

        if (playerIndex !== null && actionName && quantity >= 1) {
            const actionValue = actions[actionName];
            const points = actionValue * quantity;

            players[playerIndex].score += points;
            players[playerIndex].totalActions += quantity;

            if (actionValue > 0) players[playerIndex].positiveScore += points;
            else if (actionValue < 0) players[playerIndex].negativeScore += points;

            savePlayers(); 
            render();
        } else {
            alert('Por favor, selecciona un atleta y una acción válida.');
        }
    });

    populateActions();
    render();
    
    // FUNCIONALIDAD: Bloquear clic derecho y teclas de copiar
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault(); 
        alert('La copia de contenido está deshabilitada.');
    });

    document.addEventListener('keydown', function(e) {
        // Bloquea F12 (Herramientas de Desarrollador)
        if (e.key === 'F12') {
            e.preventDefault();
            return;
        }
        
        // Bloquea Ctrl+Shift+I (Inspeccionar)
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            return;
        }
        
        // Bloquea Ctrl+U (Ver código fuente)
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            return;
        }
    });

});