// server.js
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));

// ----------------- Configuración de JSONBin ----------------- //
const jsonbinId = "67a695dbe41b4d34e485fa13";
const jsonbinMasterKey = "$2a$10$05I4A2jo8nIY3rFOx3I5NeR89pc9bsR8BnG2dO09LqffFArlGGovy";

// ----------------- Caché para la data y las skins ----------------- //
let cachedPlayersData = null;
let lastFetchTime = 0;
const cacheTTL = 60 * 1000; // 60 segundos

let skinCache = {};

// ----------------- Puntos por tier para cada modalidad ----------------- //
const pointsByTier = {
  'NetheritePot': { 'LT5': 1, 'HT5': 2, 'LT4': 3, 'HT4': 4, 'LT3': 6, 'HT3': 12, 'LT2': 24, 'HT2': 32, 'LT1': 44, 'HT1': 60 },
  'Sword':       { 'LT5': 1, 'HT5': 2, 'LT4': 3, 'HT4': 4, 'LT3': 6, 'HT3': 12, 'LT2': 24, 'HT2': 32, 'LT1': 44, 'HT1': 60 },
  'CrystalPvP':  { 'LT5': 1, 'HT5': 2, 'LT4': 3, 'HT4': 4, 'LT3': 6, 'HT3': 12, 'LT2': 24, 'HT2': 32, 'LT1': 44, 'HT1': 60 },
  'DiamondPot':  { 'LT5': 1, 'HT5': 2, 'LT4': 3, 'HT4': 4, 'LT3': 6, 'HT3': 12, 'LT2': 24, 'HT2': 32, 'LT1': 44, 'HT1': 60 },
  'Uhc':         { 'LT5': 1, 'HT5': 2, 'LT4': 3, 'HT4': 4, 'LT3': 6, 'HT3': 12, 'LT2': 24, 'HT2': 32, 'LT1': 44, 'HT1': 60 },
};

// ----------------- Función para obtener los datos desde JSONBin (con caché) ----------------- //
const getPlayersData = async () => {
  const now = Date.now();
  if (cachedPlayersData && (now - lastFetchTime) < cacheTTL) {
    return cachedPlayersData;
  }
  try {
    const url = `https://api.jsonbin.io/v3/b/${jsonbinId}/latest`;
    const response = await axios.get(url, {
      headers: { 'X-Master-Key': jsonbinMasterKey }
    });
    // JSONBin v3 devuelve la data en response.data.record
    const data = response.data.record;
    cachedPlayersData = data;
    lastFetchTime = now;
    return data;
  } catch (error) {
    console.error('Error fetching data from JSONBin:', error);
    return {};
  }
};

// ----------------- Función para obtener el avatar de un jugador (con caché) ----------------- //
const getAvatarUrl = async (playerName) => {
  if (skinCache[playerName]) return skinCache[playerName];
  try {
    const response = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${playerName}`);
    if (response.data && response.data.id) {
      const uuid = response.data.id;
      const avatarUrl = `https://crafatar.com/avatars/${uuid}?size=100`;
      skinCache[playerName] = avatarUrl;
      return avatarUrl;
    }
  } catch (error) {
    console.log(`No se encontró avatar para el jugador: ${playerName}`);
  }
  const defaultSkin = 'https://crafatar.com/avatars/d2a0d6f6d0184f0a9bfae2929ed131b8?size=100';
  skinCache[playerName] = defaultSkin;
  return defaultSkin;
};

// ----------------- Función para calcular los puntos totales de un jugador ----------------- //
const calculateTotalPoints = (modalities) => {
  return modalities.reduce((sum, modality) => {
    const pts = pointsByTier[modality.modality]
      ? (pointsByTier[modality.modality][modality.tier] || 0)
      : 0;
    return sum + pts;
  }, 0);
};

// ----------------- Endpoint para obtener la data de jugadores en JSON ----------------- //
app.get('/getPlayersData', async (req, res) => {
  const playersData = await getPlayersData();
  const allPlayers = {};
  for (const modality in playersData) {
    for (const playerName in playersData[modality]) {
      const [tier, discordTag = ''] = playersData[modality][playerName].split(', ');
      if (!allPlayers[playerName]) {
        allPlayers[playerName] = { name: playerName, modalities: [] };
      }
      allPlayers[playerName].modalities.push({ modality, tier, discordTag });
    }
  }
  const playersArray = Object.values(allPlayers).map(player => {
    const totalPoints = calculateTotalPoints(player.modalities);
    return { ...player, totalPoints };
  }).sort((a, b) => b.totalPoints - a.totalPoints);
  
  playersArray.forEach((player, index) => {
    player.rank = index + 1;
  });
  
  res.json(playersArray);
});

// ----------------- Endpoint para obtener detalles de un jugador ----------------- //
app.get('/getPlayerDetails', async (req, res) => {
  const playerName = req.query.name;
  const playersData = await getPlayersData();
  const playerDetails = { name: playerName, modalities: [] };
  for (const modality in playersData) {
    if (playersData[modality][playerName]) {
      const [tier, discordTag = ''] = playersData[modality][playerName].split(', ');
      playerDetails.modalities.push({ modality, tier, discordTag });
    }
  }
  playerDetails.avatarUrl = await getAvatarUrl(playerName);
  res.json(playerDetails);
});

// Manejo de errores al iniciar el servidor (por ejemplo, puerto en uso)
const server = app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
});
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`El puerto ${port} ya está en uso. Por favor, cierra la aplicación que lo esté utilizando o utiliza otro puerto.`);
    process.exit(1);
  } else {
    console.error(err);
  }
});
