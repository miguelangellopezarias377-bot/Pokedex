/**
 * battle.js - Motor de Combate Pokémon por Turnos
 * Soporta modos 1v1, 1v2, 2v2, 3v3 y 6v6 con cálculo de daño real,
 * tabla de tipos, animaciones, IA rival, relevos y efectos de sonido.
 */

class PokemonBattleEngine {
  constructor() {
    this.currentMode = '1v1'; // '1v1', '1v2', '2v2', '3v3', '6v6'
    this.playerTeam = [];
    this.rivalTeam = [];
    this.playerActiveIndex = 0;
    this.rivalActiveIndex = 0;
    this.isTurnLocked = false;
    this.battleOver = false;

    // Tabla de Efectividad de Tipos (18 Tipos Oficiales)
    this.typeChart = {
      normal: { rock: 0.5, ghost: 0, steel: 0.5 },
      fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
      water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
      electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
      grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
      ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
      fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
      poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
      ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
      flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
      psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
      bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
      rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
      ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
      dragon: { dragon: 2, steel: 0.5, fairy: 0 },
      dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
      steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
      fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
    };

    // Repertorio de movimientos por defecto
    this.movePool = {
      normal: [
        { name: 'Placaje', power: 40, type: 'normal', class: 'physical', pp: 35 },
        { name: 'Golpe Cuerpo', power: 85, type: 'normal', class: 'physical', pp: 15 },
        { name: 'Hiperrayo', power: 120, type: 'normal', class: 'special', pp: 5 }
      ],
      fire: [
        { name: 'Ascuas', power: 40, type: 'fire', class: 'special', pp: 25 },
        { name: 'Lanzallamas', power: 90, type: 'fire', class: 'special', pp: 15 },
        { name: 'Llamarada', power: 110, type: 'fire', class: 'special', pp: 5 }
      ],
      water: [
        { name: 'Pistola Agua', power: 40, type: 'water', class: 'special', pp: 25 },
        { name: 'Surf', power: 90, type: 'water', class: 'special', pp: 15 },
        { name: 'Hidrobomba', power: 110, type: 'water', class: 'special', pp: 5 }
      ],
      electric: [
        { name: 'Impactrueno', power: 40, type: 'electric', class: 'special', pp: 25 },
        { name: 'Rayo', power: 90, type: 'electric', class: 'special', pp: 15 },
        { name: 'Trueno', power: 110, type: 'electric', class: 'special', pp: 5 }
      ],
      grass: [
        { name: 'Látigo Cepa', power: 45, type: 'grass', class: 'physical', pp: 25 },
        { name: 'Energibola', power: 90, type: 'grass', class: 'special', pp: 15 },
        { name: 'Rayo Solar', power: 120, type: 'grass', class: 'special', pp: 10 }
      ],
      ice: [
        { name: 'Viento Hielo', power: 55, type: 'ice', class: 'special', pp: 15 },
        { name: 'Rayo Hielo', power: 90, type: 'ice', class: 'special', pp: 10 },
        { name: 'Ventisca', power: 110, type: 'ice', class: 'special', pp: 5 }
      ],
      fighting: [
        { name: 'Golpe Roca', power: 40, type: 'fighting', class: 'physical', pp: 15 },
        { name: 'A Bocajarro', power: 120, type: 'fighting', class: 'physical', pp: 5 }
      ],
      dragon: [
        { name: 'Garra Dragón', power: 80, type: 'dragon', class: 'physical', pp: 15 },
        { name: 'Cometa Draco', power: 130, type: 'dragon', class: 'special', pp: 5 }
      ],
      psychic: [
        { name: 'Confusión', power: 50, type: 'psychic', class: 'special', pp: 25 },
        { name: 'Psíquico', power: 90, type: 'psychic', class: 'special', pp: 10 }
      ],
      ground: [
        { name: 'Disparo Lodo', power: 55, type: 'ground', class: 'special', pp: 15 },
        { name: 'Terremoto', power: 100, type: 'ground', class: 'physical', pp: 10 }
      ],
      flying: [
        { name: 'Ataque Ala', power: 60, type: 'flying', class: 'physical', pp: 35 },
        { name: 'Pájaro Osado', power: 120, type: 'flying', class: 'physical', pp: 15 }
      ],
      rock: [
        { name: 'Lavalancha', power: 75, type: 'rock', class: 'physical', pp: 10 },
        { name: 'Roca Afilada', power: 100, type: 'rock', class: 'physical', pp: 5 }
      ],
      ghost: [
        { name: 'Tinieblas', power: 50, type: 'ghost', class: 'special', pp: 15 },
        { name: 'Bola Sombra', power: 80, type: 'ghost', class: 'special', pp: 15 }
      ],
      dark: [
        { name: 'Mordisco', power: 60, type: 'dark', class: 'physical', pp: 25 },
        { name: 'Pulso Umbrío', power: 80, type: 'dark', class: 'special', pp: 15 }
      ],
      steel: [
        { name: 'Garra Metal', power: 50, type: 'steel', class: 'physical', pp: 35 },
        { name: 'Foco Resplandor', power: 80, type: 'steel', class: 'special', pp: 10 }
      ],
      fairy: [
        { name: 'Beso Drenaje', power: 50, type: 'fairy', class: 'special', pp: 10 },
        { name: 'Brillo Mágico', power: 80, type: 'fairy', class: 'special', pp: 10 }
      ],
      bug: [
        { name: 'Picadura', power: 60, type: 'bug', class: 'physical', pp: 20 },
        { name: 'Zumbido', power: 90, type: 'bug', class: 'special', pp: 10 }
      ],
      poison: [
        { name: 'Picotazo Venenoso', power: 15, type: 'poison', class: 'physical', pp: 35 },
        { name: 'Bomba Lodo', power: 90, type: 'poison', class: 'special', pp: 10 }
      ]
    };
  }

  /**
   * Determina el nivel del Pokémon según su etapa evolutiva
   * Base: Nv. 5 (ej. Charmander)
   * 1ra Evolución: Nivel de evolución (ej. Charmeleon Nv. 16)
   * 2da Evolución: Nivel de evolución (ej. Charizard Nv. 36)
   * Legendarios: Nv. 70 | Únicos: Nv. 30
   */
  determineLevel(details, species, evolutions) {
    if (!evolutions || evolutions.length === 0) {
      return species?.isLegendary ? 70 : 30;
    }

    const myIndex = evolutions.findIndex(e => e.id === details.id);

    // Forma base (ej. Charmander)
    if (myIndex === 0 && evolutions.length > 1) {
      return 5;
    }

    // Forma evolucionada (ej. Charmeleon, Charizard)
    if (myIndex > 0) {
      const myEvo = evolutions[myIndex];
      const match = myEvo.requirement ? myEvo.requirement.match(/Niv\.\s*(\d+)/) : null;
      if (match) {
        return parseInt(match[1], 10);
      }
      return myIndex === 1 ? 16 : 36;
    }

    // Sin evoluciones
    if (species?.isLegendary) {
      return 70;
    }
    return 30;
  }

  /**
   * Prepara un Pokémon para el combate calculando estadísticas según su nivel dinámico
   */
  async buildCombatant(idOrDetails) {
    let details = idOrDetails;
    let fullData = null;

    if (typeof idOrDetails === 'number' || typeof idOrDetails === 'string') {
      fullData = await window.pokeAPI.getFullPokemonData(idOrDetails);
      details = fullData;
    } else if (!details.species || !details.evolutions) {
      fullData = await window.pokeAPI.getFullPokemonData(details.id);
      details = fullData;
    }

    // Determinar nivel dinámico según evolución
    const level = this.determineLevel(details, details.species, details.evolutions);

    const statsMap = {};
    details.stats.forEach(s => {
      statsMap[s.name] = s.base;
    });

    // Fórmulas oficiales de stats escaladas al nivel del Pokémon
    const baseHp = statsMap.hp || 50;
    const maxHp = Math.floor(((2 * baseHp + 31) * level) / 100) + level + 10;
    
    const calcStat = (base) => Math.floor(((2 * (base || 50) + 31) * level) / 100) + 5;

    const stats = {
      maxHp: maxHp,
      currentHp: maxHp,
      attack: calcStat(statsMap.attack),
      defense: calcStat(statsMap.defense),
      spAttack: calcStat(statsMap['special-attack']),
      spDefense: calcStat(statsMap['special-defense']),
      speed: calcStat(statsMap.speed)
    };

    // Asignar 4 movimientos representativos acordes a sus tipos
    const moves = this.generateMoveset(details);

    return {
      id: details.id,
      name: window.pokeAPI.capitalize(details.name),
      formattedId: details.formattedId,
      level: level,
      types: details.types.map(t => t.name),
      typesEs: details.types.map(t => t.nameEs),
      sprites: details.sprites,
      cries: details.cries,
      stats: stats,
      moves: moves,
      fainted: false
    };
  }

  /**
   * Genera 4 movimientos acordes a los tipos del Pokémon
   */
  generateMoveset(details) {
    const selectedMoves = [];
    const mainType = details.types[0]?.name || 'normal';
    const secondaryType = details.types[1]?.name || null;

    // Movimientos de su tipo principal
    const typePool = this.movePool[mainType] || this.movePool.normal;
    selectedMoves.push(...typePool.slice(0, 2));

    // Si tiene segundo tipo, añadir de él
    if (secondaryType && this.movePool[secondaryType]) {
      selectedMoves.push(this.movePool[secondaryType][0]);
    } else if (typePool[2]) {
      selectedMoves.push(typePool[2]);
    }

    // Completar con movimientos de tipo normal o variados hasta tener 4
    const normalMoves = this.movePool.normal;
    for (const m of normalMoves) {
      if (selectedMoves.length >= 4) break;
      if (!selectedMoves.some(sm => sm.name === m.name)) {
        selectedMoves.push(m);
      }
    }

    return selectedMoves.slice(0, 4);
  }

  /**
   * Configura e inicia una nueva batalla en el modo seleccionado
   */
  async startBattle(mode, playerIds, rivalIds) {
    this.currentMode = mode;
    this.battleOver = false;
    this.isTurnLocked = false;
    this.playerActiveIndex = 0;
    this.rivalActiveIndex = 0;

    // Construir equipo del jugador
    this.playerTeam = await Promise.all(playerIds.map(id => this.buildCombatant(id)));
    // Construir equipo rival
    this.rivalTeam = await Promise.all(rivalIds.map(id => this.buildCombatant(id)));

    // Emitir sonido de apertura y rugidos
    window.pokedexAudio.playSfx('open');
    setTimeout(() => {
      const activePlayer = this.getPlayerActive();
      window.pokedexAudio.playCry(activePlayer.id, activePlayer.cries);
    }, 400);

    return {
      playerTeam: this.playerTeam,
      rivalTeam: this.rivalTeam,
      activePlayer: this.getPlayerActive(),
      activeRival: this.getRivalActive()
    };
  }

  getPlayerActive() {
    return this.playerTeam[this.playerActiveIndex];
  }

  getRivalActive() {
    return this.rivalTeam[this.rivalActiveIndex];
  }

  /**
   * Calcula el multiplicador de daño entre el tipo del movimiento y los tipos del defensor
   */
  getTypeMultiplier(moveType, defenderTypes) {
    let multiplier = 1;
    defenderTypes.forEach(defType => {
      if (this.typeChart[moveType] && this.typeChart[moveType][defType] !== undefined) {
        multiplier *= this.typeChart[moveType][defType];
      }
    });
    return multiplier;
  }

  /**
   * Calcula el daño oficial con variación aleatoria y críticos
   */
  calculateDamage(attacker, defender, move) {
    const isSpecial = move.class === 'special';
    const attackStat = isSpecial ? attacker.stats.spAttack : attacker.stats.attack;
    const defenseStat = isSpecial ? defender.stats.spDefense : defender.stats.defense;

    // Nivel dinámico del atacante
    const level = attacker.level || 50;
    const basePower = move.power || 40;

    // Probabilidad de golpe crítico (6.25%)
    const isCritical = Math.random() < 0.08;
    const critMultiplier = isCritical ? 1.5 : 1.0;

    // Multiplicador de tipo
    const typeMod = this.getTypeMultiplier(move.type, defender.types);

    // Variación aleatoria entre 0.85 y 1.0
    const randomVariation = 0.85 + Math.random() * 0.15;

    // Daño base fórmula oficial
    const baseDamage = Math.floor((((2 * level / 5 + 2) * basePower * (attackStat / defenseStat)) / 50) + 2);
    const finalDamage = Math.max(1, Math.floor(baseDamage * critMultiplier * typeMod * randomVariation));

    let effectivenessText = '';
    if (typeMod === 0) effectivenessText = '¡No tuvo efecto alguno!';
    else if (typeMod >= 2) effectivenessText = '¡Es súper eficaz!';
    else if (typeMod <= 0.5) effectivenessText = 'No es muy eficaz...';

    return {
      damage: typeMod === 0 ? 0 : finalDamage,
      isCritical,
      typeMod,
      effectivenessText
    };
  }

  /**
   * Ejecuta el turno completo del combate
   */
  async executeTurn(playerMove, callbacks) {
    if (this.isTurnLocked || this.battleOver) return;
    this.isTurnLocked = true;

    const player = this.getPlayerActive();
    const rival = this.getRivalActive();

    // La IA rival escoge su movimiento
    const rivalMove = rival.moves[Math.floor(Math.random() * rival.moves.length)];

    // Determinar quién es más rápido
    const playerFirst = player.stats.speed >= rival.stats.speed;
    const first = playerFirst ? { pokemon: player, move: playerMove, isPlayer: true, target: rival } : { pokemon: rival, move: rivalMove, isPlayer: false, target: player };
    const second = playerFirst ? { pokemon: rival, move: rivalMove, isPlayer: false, target: player } : { pokemon: player, move: playerMove, isPlayer: true, target: rival };

    // 1. Primer atacante
    await this.performAttack(first.pokemon, first.target, first.move, first.isPlayer, callbacks);

    // Si el objetivo se debilitó (PS <= 0)
    if (first.target.stats.currentHp <= 0) {
      await this.handleFaint(first.target, !first.isPlayer, callbacks);
      this.isTurnLocked = false;
      return;
    }

    if (this.battleOver) {
      this.isTurnLocked = false;
      return;
    }

    // 2. Segundo atacante
    await new Promise(r => setTimeout(r, 600));
    await this.performAttack(second.pokemon, second.target, second.move, second.isPlayer, callbacks);

    // Si el objetivo del segundo atacante se debilitó (PS <= 0)
    if (second.target.stats.currentHp <= 0) {
      await this.handleFaint(second.target, !second.isPlayer, callbacks);
    }

    this.isTurnLocked = false;
  }

  /**
   * Ejecuta un ataque individual con animaciones y cálculo de daño
   */
  async performAttack(attacker, target, move, isAttackerPlayer, callbacks) {
    callbacks.onDialogue(`¡${attacker.name} usó ${move.name.toUpperCase()}!`);
    callbacks.onAttackAnimation(isAttackerPlayer);

    window.pokedexAudio.playSfx('click');
    await new Promise(r => setTimeout(r, 400));

    const result = this.calculateDamage(attacker, target, move);
    target.stats.currentHp = Math.max(0, target.stats.currentHp - result.damage);

    // Sonido de impacto
    if (result.typeMod >= 2) {
      window.pokedexAudio.playSfx('superEffective');
    } else {
      window.pokedexAudio.playSfx('hit');
    }

    callbacks.onHitAnimation(!isAttackerPlayer);
    callbacks.onHpUpdate(target, !isAttackerPlayer);

    await new Promise(r => setTimeout(r, 350));

    if (result.isCritical) {
      callbacks.onDialogue('¡Un golpe crítico!');
      await new Promise(r => setTimeout(r, 450));
    }

    if (result.effectivenessText) {
      callbacks.onDialogue(result.effectivenessText);
      await new Promise(r => setTimeout(r, 500));
    }
  }

  /**
   * Maneja el debilitamiento de un Pokémon y verifica si hay relevo o victoria/derrota
   */
  async handleFaint(faintedPokemon, isPlayerPokemon, callbacks) {
    faintedPokemon.fainted = true;
    faintedPokemon.stats.currentHp = 0;

    window.pokedexAudio.playSfx('faint');
    callbacks.onFaintAnimation(isPlayerPokemon);
    callbacks.onDialogue(`¡${faintedPokemon.name} se ha debilitado!`);
    callbacks.onTeamBallsUpdate();

    await new Promise(r => setTimeout(r, 1000));

    const team = isPlayerPokemon ? this.playerTeam : this.rivalTeam;
    const nextIndex = team.findIndex(p => !p.fainted);

    if (nextIndex === -1) {
      // No quedan más Pokémon en ese equipo -> Fin del combate
      this.battleOver = true;
      if (isPlayerPokemon) {
        window.pokedexAudio.playSfx('error');
        callbacks.onBattleEnd(false, 'Has sido derrotado en combate...');
      } else {
        window.pokedexAudio.playSfx('victory');
        callbacks.onBattleEnd(true, '¡Victoria! ¡Has ganado el combate Pokémon!');
      }
    } else {
      // Relevo al siguiente Pokémon
      if (isPlayerPokemon) {
        callbacks.onPromptPlayerSwitch();
      } else {
        this.rivalActiveIndex = nextIndex;
        const nextRival = this.getRivalActive();
        window.pokedexAudio.playSfx('switch');
        callbacks.onDialogue(`¡El rival envía a ${nextRival.name.toUpperCase()}!`);
        callbacks.onRivalSwitch(nextRival);
        await new Promise(r => setTimeout(r, 500));
        window.pokedexAudio.playCry(nextRival.id, nextRival.cries);
      }
    }
  }

  /**
   * Cambio de Pokémon del jugador
   */
  switchPlayerPokemon(targetIndex, callbacks) {
    if (targetIndex === this.playerActiveIndex || this.playerTeam[targetIndex].fainted) return false;

    this.playerActiveIndex = targetIndex;
    const newActive = this.getPlayerActive();

    window.pokedexAudio.playSfx('switch');
    callbacks.onDialogue(`¡Adelante, ${newActive.name.toUpperCase()}!`);
    callbacks.onPlayerSwitch(newActive);

    setTimeout(() => {
      window.pokedexAudio.playCry(newActive.id, newActive.cries);
    }, 300);

    return true;
  }
}

window.pokemonBattle = new PokemonBattleEngine();
