/**
 * api.js - Capa de Conexión y Gestión de PokeAPI
 * Maneja solicitudes HTTP asíncronas, caché inteligente en LocalStorage,
 * procesamiento de cadenas evolutivas, traducciones al español y normalización.
 */

class PokeAPIManager {
  constructor() {
    this.baseUrl = 'https://pokeapi.co/api/v2';
    this.totalSpecies = 1025; // Especies oficiales nacionales reconocidas (Gens 1-9)
    this.pokemonListCache = null;
    this.detailsCache = new Map();
    this.speciesCache = new Map();
    this.evolutionCache = new Map();

    // Diccionario de traducción de Tipos
    this.typeTranslations = {
      normal: { es: 'Normal', color: '#A8A77A', bg: 'linear-gradient(135deg, #A8A77A, #797850)' },
      fire: { es: 'Fuego', color: '#EE8130', bg: 'linear-gradient(135deg, #FF6F00, #DD3B00)' },
      water: { es: 'Agua', color: '#6390F0', bg: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' },
      electric: { es: 'Eléctrico', color: '#F7D02C', bg: 'linear-gradient(135deg, #FACC15, #CA8A04)' },
      grass: { es: 'Planta', color: '#7AC74C', bg: 'linear-gradient(135deg, #4ADE80, #15803D)' },
      ice: { es: 'Hielo', color: '#96D9D6', bg: 'linear-gradient(135deg, #7DD3FC, #0284C7)' },
      fighting: { es: 'Lucha', color: '#C22E28', bg: 'linear-gradient(135deg, #DC2626, #991B1B)' },
      poison: { es: 'Veneno', color: '#A33EA1', bg: 'linear-gradient(135deg, #C084FC, #7E22CE)' },
      ground: { es: 'Tierra', color: '#E2BF65', bg: 'linear-gradient(135deg, #EAB308, #854D0E)' },
      flying: { es: 'Volador', color: '#A98FF3', bg: 'linear-gradient(135deg, #818CF8, #4338CA)' },
      psychic: { es: 'Psíquico', color: '#F95587', bg: 'linear-gradient(135deg, #F43F5E, #9F1239)' },
      bug: { es: 'Bicho', color: '#A6B91A', bg: 'linear-gradient(135deg, #84CC16, #4D7C0F)' },
      rock: { es: 'Roca', color: '#B6A136', bg: 'linear-gradient(135deg, #A16207, #713F12)' },
      ghost: { es: 'Fantasma', color: '#735797', bg: 'linear-gradient(135deg, #6B21A8, #3B0764)' },
      dragon: { es: 'Dragón', color: '#6F35FC', bg: 'linear-gradient(135deg, #6366F1, #3730A3)' },
      dark: { es: 'Siniestro', color: '#705746', bg: 'linear-gradient(135deg, #57534E, #1C1917)' },
      steel: { es: 'Acero', color: '#B7B7CE', bg: 'linear-gradient(135deg, #94A3B8, #475569)' },
      fairy: { es: 'Hada', color: '#D685AD', bg: 'linear-gradient(135deg, #F472B6, #BE185D)' }
    };

    // Traducción de Estadísticas
    this.statTranslations = {
      hp: { es: 'PS', max: 255, color: '#FF5959' },
      attack: { es: 'Ataque', max: 190, color: '#F5AC78' },
      defense: { es: 'Defensa', max: 230, color: '#FAE078' },
      'special-attack': { es: 'At. Esp', max: 194, color: '#9DB7F5' },
      'special-defense': { es: 'Def. Esp', max: 230, color: '#A7DB8D' },
      speed: { es: 'Velocidad', max: 200, color: '#FA92B2' }
    };

    // Rangos de Generaciones
    this.generations = [
      { id: 1, name: 'Gen I (Kanto)', start: 1, end: 151 },
      { id: 2, name: 'Gen II (Johto)', start: 152, end: 251 },
      { id: 3, name: 'Gen III (Hoenn)', start: 252, end: 386 },
      { id: 4, name: 'Gen IV (Sinnoh)', start: 387, end: 493 },
      { id: 5, name: 'Gen V (Teselia)', start: 494, end: 649 },
      { id: 6, name: 'Gen VI (Kalos)', start: 650, end: 721 },
      { id: 7, name: 'Gen VII (Alola)', start: 722, end: 809 },
      { id: 8, name: 'Gen VIII (Galar)', start: 810, end: 905 },
      { id: 9, name: 'Gen IX (Paldea)', start: 906, end: 1025 }
    ];
  }

  /**
   * Da formato de 3 o 4 dígitos al número (#001, #004, #025, #1025)
   */
  formatId(id) {
    const num = parseInt(id, 10);
    if (isNaN(num)) return '#000';
    if (num < 1000) {
      return '#' + String(num).padStart(3, '0');
    }
    return '#' + String(num);
  }

  /**
   * Capitaliza la primera letra
   */
  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Obtiene la lista completa de todos los Pokémon
   */
  async getAllPokemonList() {
    if (this.pokemonListCache) return this.pokemonListCache;

    // Intentar leer de localStorage
    try {
      const stored = localStorage.getItem('pokedex_all_list_v2');
      if (stored) {
        this.pokemonListCache = JSON.parse(stored);
        return this.pokemonListCache;
      }
    } catch (e) {
      console.warn('No se pudo acceder al almacenamiento local', e);
    }

    try {
      const resp = await fetch(`${this.baseUrl}/pokemon?limit=${this.totalSpecies}`);
      if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
      const data = await resp.json();

      const mapped = data.results.map((item, index) => {
        const id = index + 1;
        return {
          id,
          name: item.name,
          formattedId: this.formatId(id),
          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
          url: item.url
        };
      });

      this.pokemonListCache = mapped;
      try {
        localStorage.setItem('pokedex_all_list_v2', JSON.stringify(mapped));
      } catch (e) {
        // En caso de que se llene la cuota de localStorage
      }
      return mapped;
    } catch (error) {
      console.error('Error cargando la lista general de Pokémon:', error);
      throw error;
    }
  }

  /**
   * Obtiene la información técnica básica de un Pokémon
   */
  async getPokemonDetail(idOrName) {
    const key = String(idOrName).toLowerCase();
    if (this.detailsCache.has(key)) return this.detailsCache.get(key);

    try {
      const resp = await fetch(`${this.baseUrl}/pokemon/${key}`);
      if (!resp.ok) throw new Error(`Pokemon no encontrado: ${idOrName}`);
      const data = await resp.json();

      // Normalizar datos
      const normalized = {
        id: data.id,
        name: data.name,
        formattedId: this.formatId(data.id),
        height: data.height / 10, // decímetros a metros
        weight: data.weight / 10, // hectogramos a kg
        cries: data.cries ? (data.cries.latest || data.cries.legacy) : `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${data.id}.ogg`,
        sprites: {
          artwork: data.sprites.other?.['official-artwork']?.front_default || data.sprites.front_default,
          artworkShiny: data.sprites.other?.['official-artwork']?.front_shiny || data.sprites.front_shiny,
          animated: data.sprites.other?.showdown?.front_default || data.sprites.front_default,
          animatedShiny: data.sprites.other?.showdown?.front_shiny || data.sprites.front_shiny,
          pixel: data.sprites.front_default,
          pixelShiny: data.sprites.front_shiny
        },
        types: data.types.map(t => ({
          name: t.type.name,
          nameEs: this.typeTranslations[t.type.name]?.es || this.capitalize(t.type.name),
          color: this.typeTranslations[t.type.name]?.color || '#888',
          bg: this.typeTranslations[t.type.name]?.bg || '#555'
        })),
        stats: data.stats.map(s => {
          const trans = this.statTranslations[s.stat.name] || { es: s.stat.name, max: 200, color: '#4ADE80' };
          return {
            name: s.stat.name,
            nameEs: trans.es,
            base: s.base_stat,
            max: trans.max,
            percent: Math.min(100, Math.round((s.base_stat / trans.max) * 100)),
            color: trans.color
          };
        }),
        totalStats: data.stats.reduce((acc, s) => acc + s.base_stat, 0),
        rawAbilities: data.abilities || [],
        rawMoves: data.moves || []
      };

      this.detailsCache.set(key, normalized);
      this.detailsCache.set(String(data.id), normalized);
      return normalized;
    } catch (error) {
      console.error(`Error obteniendo detalles de ${idOrName}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene la especie, textos de la Pokédex en español y la URL de evoluciones
   */
  async getPokemonSpecies(idOrName) {
    const key = String(idOrName).toLowerCase();
    if (this.speciesCache.has(key)) return this.speciesCache.get(key);

    try {
      const resp = await fetch(`${this.baseUrl}/pokemon-species/${key}`);
      if (!resp.ok) throw new Error(`Especie no encontrada: ${idOrName}`);
      const data = await resp.json();

      // Buscar texto en español (es o es-419)
      const spanishEntry = data.flavor_text_entries.find(entry => entry.language.name === 'es' || entry.language.name === 'es-419');
      const englishEntry = data.flavor_text_entries.find(entry => entry.language.name === 'en');
      
      let rawFlavor = spanishEntry ? spanishEntry.flavor_text : (englishEntry ? englishEntry.flavor_text : 'Sin descripción disponible.');
      // Limpiar saltos de línea molestos y caracteres especiales
      const cleanFlavor = rawFlavor.replace(/[\n\f\r]/g, ' ').replace(/\s+/g, ' ').trim();

      // Categoría / Género (ej. Pokémon Lagartija)
      const spanishGenus = data.genera.find(g => g.language.name === 'es');
      const genus = spanishGenus ? spanishGenus.genus : (data.genera.find(g => g.language.name === 'en')?.genus || 'Pokémon');

      const normalized = {
        flavorText: cleanFlavor,
        genus: genus,
        evolutionChainUrl: data.evolution_chain?.url || null,
        generation: data.generation?.name || 'generation-i',
        habitat: data.habitat?.name || 'Desconocido',
        isLegendary: data.is_legendary || data.is_mythical
      };

      this.speciesCache.set(key, normalized);
      return normalized;
    } catch (error) {
      console.warn(`Error obteniendo especie de ${idOrName}:`, error);
      return {
        flavorText: 'Datos de la Pokédex no disponibles temporalmente.',
        genus: 'Pokémon',
        evolutionChainUrl: null,
        generation: 'generation-i',
        habitat: 'Desconocido',
        isLegendary: false
      };
    }
  }

  /**
   * Procesa recursivamente el árbol evolutivo de PokeAPI
   */
  async getEvolutionChain(chainUrl) {
    if (!chainUrl) return [];
    if (this.evolutionCache.has(chainUrl)) return this.evolutionCache.get(chainUrl);

    try {
      const resp = await fetch(chainUrl);
      if (!resp.ok) return [];
      const data = await resp.json();

      const evoList = [];

      const parseStage = (node, prevName = null, details = null) => {
        const idMatch = node.species.url.match(/\/pokemon-species\/(\d+)\//);
        const id = idMatch ? parseInt(idMatch[1], 10) : 1;

        let requirement = '';
        if (details) {
          if (details.min_level) requirement = `Niv. ${details.min_level}`;
          else if (details.item) requirement = `${this.capitalize(details.item.name.replace(/-/g, ' '))}`;
          else if (details.trigger?.name === 'trade') requirement = 'Intercambio';
          else if (details.min_happiness) requirement = 'Felicidad';
          else if (details.known_move) requirement = `${this.capitalize(details.known_move.name.replace(/-/g, ' '))}`;
          else if (details.time_of_day) requirement = `${this.capitalize(details.time_of_day)}`;
          else requirement = 'Evolución';
        }

        evoList.push({
          id,
          formattedId: this.formatId(id),
          name: this.capitalize(node.species.name),
          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
          artwork: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
          requirement: requirement,
          prevName: prevName
        });

        if (node.evolves_to && node.evolves_to.length > 0) {
          node.evolves_to.forEach(child => {
            const childDetails = child.evolution_details && child.evolution_details.length > 0 ? child.evolution_details[0] : null;
            parseStage(child, node.species.name, childDetails);
          });
        }
      };

      parseStage(data.chain);

      this.evolutionCache.set(chainUrl, evoList);
      return evoList;
    } catch (error) {
      console.warn('Error procesando la cadena evolutiva:', error);
      return [];
    }
  }

  /**
   * Obtiene la lista de Pokémon que pertenecen a un Tipo determinado
   */
  async getPokemonByType(typeName) {
    if (!typeName || typeName === 'all') return null;
    const cacheKey = `type_${typeName}`;
    if (this.speciesCache.has(cacheKey)) return this.speciesCache.get(cacheKey);

    try {
      const resp = await fetch(`${this.baseUrl}/type/${typeName}`);
      if (!resp.ok) return null;
      const data = await resp.json();

      const ids = new Set();
      data.pokemon.forEach(p => {
        const match = p.pokemon.url.match(/\/pokemon\/(\d+)\//);
        if (match) {
          const id = parseInt(match[1], 10);
          if (id <= this.totalSpecies) {
            ids.add(id);
          }
        }
      });

      this.speciesCache.set(cacheKey, ids);
      return ids;
    } catch (e) {
      console.warn(`Error obteniendo tipo ${typeName}:`, e);
      return null;
    }
  }

  /**
   * Obtiene detalles traducidos de las habilidades (innatas y ocultas)
   */
  async getAbilitiesDetails(rawAbilities) {
    if (!rawAbilities || rawAbilities.length === 0) return [];

    const promises = rawAbilities.map(async (item) => {
      const abilityName = item.ability.name;
      const cacheKey = `ability_${abilityName}`;

      if (this.speciesCache.has(cacheKey)) {
        return {
          ...this.speciesCache.get(cacheKey),
          isHidden: item.is_hidden
        };
      }

      try {
        const resp = await fetch(item.ability.url);
        if (!resp.ok) throw new Error();
        const data = await resp.json();

        const esName = data.names?.find(n => n.language.name === 'es')?.name || this.capitalize(abilityName.replace(/-/g, ' '));
        const esEntry = data.flavor_text_entries?.find(e => e.language.name === 'es');
        const enEntry = data.flavor_text_entries?.find(e => e.language.name === 'en');
        const desc = esEntry ? esEntry.flavor_text : (enEntry ? enEntry.flavor_text : 'Habilidad Pokémon.');

        const result = {
          name: esName,
          rawName: abilityName,
          description: desc.replace(/[\n\f\r]/g, ' ').replace(/\s+/g, ' ').trim(),
          isHidden: item.is_hidden
        };

        this.speciesCache.set(cacheKey, result);
        return result;
      } catch (err) {
        return {
          name: this.capitalize(abilityName.replace(/-/g, ' ')),
          rawName: abilityName,
          description: 'Habilidad característica de esta especie Pokémon.',
          isHidden: item.is_hidden
        };
      }
    });

    return Promise.all(promises);
  }

  /**
   * Obtiene y traduce la lista de movimientos que el Pokémon puede aprender
   */
  async getMovesDetails(rawMoves, limit = 25) {
    if (!rawMoves || rawMoves.length === 0) return [];

    // Priorizar movimientos aprendidos por subida de nivel, ordenados por nivel
    const formattedList = rawMoves.map(m => {
      const latestVersion = m.version_group_details[m.version_group_details.length - 1];
      const method = latestVersion?.move_learn_method?.name || 'level-up';
      const level = latestVersion?.level_learned_at || 0;

      let methodEs = 'Nivel';
      if (method === 'machine') methodEs = 'MT / MO';
      else if (method === 'egg') methodEs = 'Huevo';
      else if (method === 'tutor') methodEs = 'Tutor';

      return {
        name: m.move.name,
        url: m.move.url,
        method: methodEs,
        level: level,
        isLevelUp: method === 'level-up'
      };
    });

    // Ordenar: primero los de nivel (por nivel ascendente), luego otros
    formattedList.sort((a, b) => {
      if (a.isLevelUp && !b.isLevelUp) return -1;
      if (!a.isLevelUp && b.isLevelUp) return 1;
      return a.level - b.level;
    });

    const selectedMoves = formattedList.slice(0, limit);

    // Obtener detalles de cada movimiento
    const promises = selectedMoves.map(async (m) => {
      const cacheKey = `move_${m.name}`;
      if (this.speciesCache.has(cacheKey)) {
        const cached = this.speciesCache.get(cacheKey);
        return { ...cached, method: m.method, level: m.level };
      }

      try {
        const resp = await fetch(m.url);
        if (!resp.ok) throw new Error();
        const data = await resp.json();

        const esName = data.names?.find(n => n.language.name === 'es')?.name || this.capitalize(m.name.replace(/-/g, ' '));
        const typeName = data.type.name;
        const typeEs = this.typeTranslations[typeName]?.es || this.capitalize(typeName);
        const damageClass = data.damage_class?.name || 'physical';

        let damageClassEs = 'Físico';
        if (damageClass === 'special') damageClassEs = 'Especial';
        else if (damageClass === 'status') damageClassEs = 'Estado';

        const result = {
          name: esName,
          rawName: m.name,
          power: data.power || '-',
          accuracy: data.accuracy ? `${data.accuracy}%` : '-',
          pp: data.pp || 15,
          type: typeName,
          typeEs: typeEs,
          typeColor: this.typeTranslations[typeName]?.color || '#888',
          typeBg: this.typeTranslations[typeName]?.bg || '#555',
          damageClass: damageClass,
          damageClassEs: damageClassEs,
          method: m.method,
          level: m.level
        };

        this.speciesCache.set(cacheKey, result);
        return result;
      } catch (e) {
        return {
          name: this.capitalize(m.name.replace(/-/g, ' ')),
          rawName: m.name,
          power: 40,
          accuracy: '100%',
          pp: 20,
          type: 'normal',
          typeEs: 'Normal',
          typeColor: '#A8A77A',
          typeBg: '#A8A77A',
          damageClass: 'physical',
          damageClassEs: 'Físico',
          method: m.method,
          level: m.level
        };
      }
    });

    return Promise.all(promises);
  }

  /**
   * Carga la ficha completa de un Pokémon integrando detalles, especie, evoluciones, habilidades y movimientos
   */
  async getFullPokemonData(idOrName) {
    const details = await this.getPokemonDetail(idOrName);
    const species = await this.getPokemonSpecies(details.id);
    
    // Carga paralela de evoluciones, habilidades y movimientos
    const [evolutions, abilities, moves] = await Promise.all([
      species.evolutionChainUrl ? this.getEvolutionChain(species.evolutionChainUrl) : Promise.resolve([]),
      this.getAbilitiesDetails(details.rawAbilities),
      this.getMovesDetails(details.rawMoves, 30)
    ]);

    return {
      ...details,
      species,
      evolutions,
      abilities,
      moves
    };
  }
}

// Instancia global exportada
window.pokeAPI = new PokeAPIManager();
