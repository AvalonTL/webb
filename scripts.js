// public/scripts.js

// Mapeo de modalidades a sus respectivos íconos para el modal
const modalityIcons = {
  'NetheritePot': 'https://cdn.discordapp.com/attachments/1312239378927718430/1336567228388343851/IMG_0651.png?ex=67a446bb&is=67a2f53b&hm=686a0d7f57ec39569acbdc2262dfc512f4c54f4da4cea75d5168b97a227344d5',
  'CrystalPvP':  'https://cdn.discordapp.com/attachments/1312239378927718430/1336567228627292270/IMG_0653.png?ex=67a446bb&is=67a2f53b&hm=afd0b65b386022451f412fa7a0a691d0afec9c214c9efd5481796a272681e445',
  'Sword':       'https://cdn.discordapp.com/attachments/1312239378927718430/1336568209188589619/IMG_1034.png?ex=67a447a5&is=67a2f625&hm=95a80a86e016f31aab3c614913bb410000464c84a416e42dde5d685da2275b23',
  'DiamondPot':  'https://cdn.discordapp.com/attachments/1312239378927718430/1336568471722528790/IMG_1037.png?ex=67a4f0a3&is=67a39f23&hm=277f9565db1f1388b9bafbb046221dbf05f620a4f94b2da79ef54a8956c86a05',
  'Uhc':         'https://cdn.discordapp.com/attachments/1312239378927718430/1336568471420534798/IMG_1036.png?ex=67a4f0a3&is=67a39f23&hm=e41dfc919e3cc0dc6157bebc39ce03ce057f48e72ef43a6281ba61f10c07556a'
};

// Mostrar/ocultar menú lateral
document.getElementById('menuToggle').addEventListener('click', function() {
  document.getElementById('sidebar').classList.toggle('show');
});

// Filtrar jugadores según la búsqueda
function filterPlayers() {
  const query = document.getElementById('search').value.toLowerCase();
  const players = document.querySelectorAll('.player');
  players.forEach(player => {
    const playerName = player.querySelector('.player-name').innerText.toLowerCase();
    player.style.display = playerName.includes(query) ? '' : 'none';
  });
}

// Mostrar detalles de un jugador (modal)
function showPlayerDetails(playerName) {
  console.log("Se hizo click en:", playerName);
  fetch('/getPlayerDetails?name=' + encodeURIComponent(playerName))
    .then(response => response.json())
    .then(playerData => {
      console.log("Datos del jugador:", playerData);
      document.getElementById('player-name').innerText = playerData.name;
      document.getElementById('player-avatar-detail').src = playerData.avatarUrl;

      let modalitiesHtml = '';
      playerData.modalities.forEach(mod => {
        const iconUrl = modalityIcons[mod.modality] || '';
        modalitiesHtml += '<p><img src="' + iconUrl + '" alt="' + mod.modality + '" class="icon"> ' + mod.modality + ': ' + mod.tier + '</p>';
      });
      document.getElementById('player-modalities').innerHTML = modalitiesHtml;
      document.getElementById('player-discord').innerHTML = '<img src="https://cdn.discordapp.com/attachments/1312239378927718430/1336575344647475210/IMG_1039.png?ex=67a44e4a&is=67a2fcca&hm=254704e12b8eb717988a925d317c85d864a85b81a5278e02a3fc47c69d338712" class="icon"> Discord: ' + (playerData.modalities[0].discordTag || '');
      document.getElementById('player-details').style.display = 'block';
    })
    .catch(error => {
      console.error('Error al obtener los detalles del jugador:', error);
    });
}

// Cerrar el modal de detalles
function closePlayerDetails() {
  document.getElementById('player-details').style.display = 'none';
}

// Función para cargar la data de jugadores y poblar la página
function loadPlayersData() {
  fetch('/getPlayersData')
    .then(response => response.json())
    .then(playersArray => {
      // Poblar la sección de Ranking General
      const playersContainer = document.getElementById('players');
      playersContainer.innerHTML = '';
      playersArray.forEach(player => {
        // Crear tarjeta para cada jugador
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player';
        playerDiv.addEventListener('click', () => { showPlayerDetails(player.name); });

        // Contenedor del avatar
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'player-avatar-container';

        // Imagen del avatar (placeholder que se actualizará luego)
        const avatarImg = document.createElement('img');
        avatarImg.src = 'https://crafatar.com/avatars/d2a0d6f6d0184f0a9bfae2929ed131b8?size=100';
        avatarImg.alt = 'Avatar de ' + player.name;
        avatarImg.className = 'player-avatar';
        avatarImg.loading = 'lazy';

        avatarContainer.appendChild(avatarImg);
        playerDiv.appendChild(avatarContainer);

        // Contenedor de información
        const infoDiv = document.createElement('div');
        infoDiv.className = 'player-info';

        const nameP = document.createElement('p');
        nameP.className = 'player-name';
        nameP.textContent = player.rank + '. ' + player.name;
        infoDiv.appendChild(nameP);

        const pointsP = document.createElement('p');
        pointsP.className = 'total-points';
        const pointsImg = document.createElement('img');
        pointsImg.src = 'https://cdn.discordapp.com/attachments/1312239378927718430/1336570361340498003/IMG_0631.png?ex=67a449a6&is=67a2f826&hm=92c51deec3fba82b1cf030ef8a0b41ca7b0758e3f58f064baf436c2a8f6fe95a';
        pointsImg.alt = 'icono';
        pointsP.appendChild(pointsImg);
        pointsP.innerHTML += ' ' + player.totalPoints;
        infoDiv.appendChild(pointsP);

        playerDiv.appendChild(infoDiv);
        playersContainer.appendChild(playerDiv);

        // Actualizar el avatar real haciendo una petición para obtener los detalles del jugador
        fetch('/getPlayerDetails?name=' + encodeURIComponent(player.name))
          .then(response => response.json())
          .then(details => {
            avatarImg.src = details.avatarUrl;
          })
          .catch(err => {
            console.error('Error al actualizar el avatar para ' + player.name, err);
          });
      });

      // Cargar las secciones de ranking por modalidad
      loadModalityRankings(playersArray);
    })
    .catch(error => {
      console.error('Error loading players data:', error);
    });
}

// Función para cargar el ranking por modalidad
function loadModalityRankings(playersArray) {
  const modalitiesList = ['NetheritePot', 'Sword', 'CrystalPvP', 'DiamondPot', 'Uhc'];
  const modalityRankingsContainer = document.querySelector('.modalities-ranking');
  modalityRankingsContainer.innerHTML = '<h2>Ranking por Modalidad</h2>';

  modalitiesList.forEach(modality => {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'modality-section';
    sectionDiv.id = modality;

    const heading = document.createElement('h3');
    heading.textContent = modality;
    sectionDiv.appendChild(heading);

    const playersDiv = document.createElement('div');
    playersDiv.className = 'modality-players';

    let modalityPlayers = [];
    playersArray.forEach(player => {
      const modData = player.modalities.find(m => m.modality === modality);
      if (modData) {
        modalityPlayers.push({
          name: player.name,
          tier: modData.tier,
          discordTag: modData.discordTag,
          points: 0,
          rank: 0
        });
      }
    });

    modalityPlayers.sort((a, b) => a.name.localeCompare(b.name));
    modalityPlayers.forEach((player, index) => {
      player.rank = index + 1;
    });

    modalityPlayers.forEach(player => {
      const playerDiv = document.createElement('div');
      playerDiv.className = 'modality-player';
      playerDiv.addEventListener('click', () => { showPlayerDetails(player.name); });

      const avatarImg = document.createElement('img');
      avatarImg.className = 'avatar';
      avatarImg.src = 'https://crafatar.com/avatars/d2a0d6f6d0184f0a9bfae2929ed131b8?size=100';
      avatarImg.alt = 'Avatar de ' + player.name;

      const nameP = document.createElement('p');
      nameP.innerHTML = '<strong>' + player.rank + '.</strong> ' + player.name;

      const tierP = document.createElement('p');
      tierP.textContent = player.tier + ' - ' + player.points + ' pts';

      playerDiv.appendChild(avatarImg);
      playerDiv.appendChild(nameP);
      playerDiv.appendChild(tierP);

      playersDiv.appendChild(playerDiv);

      fetch('/getPlayerDetails?name=' + encodeURIComponent(player.name))
        .then(response => response.json())
        .then(details => {
          avatarImg.src = details.avatarUrl;
        })
        .catch(err => {
          console.error('Error al actualizar avatar para ' + player.name, err);
        });
    });

    sectionDiv.appendChild(playersDiv);
    modalityRankingsContainer.appendChild(sectionDiv);
  });
}

// Al cargar la página, se obtiene y muestra la data de jugadores
window.addEventListener('load', loadPlayersData);
