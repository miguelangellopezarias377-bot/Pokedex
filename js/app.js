/**
 * app.js - Lógica Principal de la Pokédex
 * Maneja la interacción del usuario, carga dinámica de datos, filtros,
 * navegación por D-Pad y teclado, y sincronización audiovisual.
 */

class PokedexApp {
  constructor() {
    this.currentId = 4; // Comienza en #004 Charmander por defecto
    this.currentData = null;
    this.allPokemon = [];
    this.filteredList = [];
    this.isShiny = false;
    this.activeTab = 'stats';
    this.isLoading = false;

    // Elementos DOM
    this.dom = {
      // Pantalla Izquierda
      mainSensor: document.getElementById('mainSensor'),
      ledRed: document.getElementById('ledRed'),
      ledYellow: document.getElementById('ledYellow'),
      ledGreen: document.getElementById('ledGreen'),
      dexNumberDisplay: document.getElementById('dexNumberDisplay'),
      pokemonNameDisplay: document.getElementById('pokemonNameDisplay'),
      pokemonSprite: document.getElementById('pokemonSprite'),
      loadingScanner: document.getElementById('loadingScanner'),
      soundVisualizer: document.getElementById('soundVisualizer'),
      shinySparkles: document.getElementById('shinySparkles'),
      typesContainer: document.getElementById('typesContainer'),
      genusDisplay: document.getElementById('genusDisplay'),
      playCryBtn: document.getElementById('playCryButton'),
      quickCryBtn: document.getElementById('quickCryBtn'),
      toggleShinyBtn: document.getElementById('toggleShinyBtn'),
      
      // Cruceta D-Pad
      dpadUp: document.getElementById('dpadUp'),
      dpadDown: document.getElementById('dpadDown'),
      dpadLeft: document.getElementById('dpadLeft'),
      dpadRight: document.getElementById('dpadRight'),

      // Filtros y Búsqueda
      searchInput: document.getElementById('searchInput'),
      clearSearchBtn: document.getElementById('clearSearchBtn'),
      generationSelect: document.getElementById('generationSelect'),
      typeSelect: document.getElementById('typeSelect'),

      // Pestañas y Paneles
      tabButtons: document.querySelectorAll('.info-tab'),
      tabPanes: document.querySelectorAll('.tab-pane'),
      heightDisplay: document.getElementById('heightDisplay'),
      weightDisplay: document.getElementById('weightDisplay'),
      totalStatsDisplay: document.getElementById('totalStatsDisplay'),
      statsList: document.getElementById('statsList'),
      evolutionChainContainer: document.getElementById('evolutionChainContainer'),
      flavorTextDisplay: document.getElementById('flavorTextDisplay'),
      btnSpeakDesc: document.getElementById('btnSpeakDesc'),
      catalogGrid: document.getElementById('catalogGrid'),

      // Controles Inferiores Derechos
      prevBtn: document.getElementById('prevPokemonBtn'),
      nextBtn: document.getElementById('nextPokemonBtn'),
      randomBtn: document.getElementById('randomPokemonBtn'),
      keyButtons: document.querySelectorAll('.key-btn'),

      // Habilidades y Movimientos
      abilitiesList: document.getElementById('abilitiesList'),
      movesTableBody: document.getElementById('movesTableBody'),

      // Arena de Combate
      btnFightCurrent: document.getElementById('btnFightCurrent'),
      battleModal: document.getElementById('battleModalOverlay'),
      closeBattleBtn: document.getElementById('closeBattleBtn'),
      modeCards: document.querySelectorAll('.mode-card'),
      playerTeamSlots: document.getElementById('playerTeamSlots'),
      rivalTeamSlots: document.getElementById('rivalTeamSlots'),
      playerTeamCount: document.getElementById('playerTeamCount'),
      rivalTeamCount: document.getElementById('rivalTeamCount'),
      btnUseCurrentPokemon: document.getElementById('btnUseCurrentPokemon'),
      btnPickCustomPokemon: document.getElementById('btnPickCustomPokemon'),
      btnRandomizeTeams: document.getElementById('btnRandomizeTeams'),
      btnStartBattleEngine: document.getElementById('btnStartBattleEngine'),
      teamPickerOverlay: document.getElementById('teamPickerOverlay'),
      teamPickerTitle: document.getElementById('teamPickerTitle'),
      closeTeamPickerBtn: document.getElementById('closeTeamPickerBtn'),
      teamPickerSearchInput: document.getElementById('teamPickerSearchInput'),
      teamPickerGenSelect: document.getElementById('teamPickerGenSelect'),
      teamPickerGrid: document.getElementById('teamPickerGrid'),
      battleSetupView: document.getElementById('battleSetupView'),
      battleCombatView: document.getElementById('battleCombatView'),
      rivalHudName: document.getElementById('rivalHudName'),
      playerHudName: document.getElementById('playerHudName'),
      rivalHudLevel: document.getElementById('rivalHudLevel'),
      playerHudLevel: document.getElementById('playerHudLevel'),
      rivalHpFill: document.getElementById('rivalHpFill'),
      playerHpFill: document.getElementById('playerHpFill'),
      rivalHpText: document.getElementById('rivalHpText'),
      playerHpText: document.getElementById('playerHpText'),
      rivalSprite: document.getElementById('rivalSprite'),
      playerSprite: document.getElementById('playerSprite'),
      rivalTeamBalls: document.getElementById('rivalTeamBalls'),
      playerTeamBalls: document.getElementById('playerTeamBalls'),
      battleDialogueBox: document.getElementById('battleDialogueBox'),
      battleMovesGrid: document.getElementById('battleMovesGrid'),
      btnBattleSwitch: document.getElementById('btnBattleSwitch'),
      btnBattleFlee: document.getElementById('btnBattleFlee'),
      switchTeamOverlay: document.getElementById('switchTeamOverlay'),
      closeSwitchBtn: document.getElementById('closeSwitchBtn'),
      switchTeamList: document.getElementById('switchTeamList'),
      battleResultOverlay: document.getElementById('battleResultOverlay'),
      battleResultTitle: document.getElementById('battleResultTitle'),
      battleResultSubtitle: document.getElementById('battleResultSubtitle'),
      btnResultReplay: document.getElementById('btnResultReplay')
    };

    // Estado del minijuego de combate
    this.battleMode = '1v1';
    this.battlePlayerIds = [4];
    this.battleRivalIds = [7];
    this.pickerTargetSide = 'player';
    this.pickerTargetSlot = 0;
  }

  /**
   * Inicialización de la aplicación
   */
  async init() {
    this.bindEvents();
    this.setupAudioHooks();
    this.initBattleSystem();

    // Iniciar con sonido de encendido de la Pokédex
    setTimeout(() => {
      window.pokedexAudio.playSfx('startup');
    }, 300);

    // Cargar la lista completa de especies (#001 a #1025)
    try {
      this.allPokemon = await window.pokeAPI.getAllPokemonList();
      this.filteredList = [...this.allPokemon];
      this.renderCatalog();
    } catch (err) {
      console.warn('Error precargando lista:', err);
    }

    // Cargar el Pokémon inicial (#004 Charmander)
    await this.loadPokemon(this.currentId);
  }

  /**
   * Conecta animaciones visuales con la reproducción del audio
   */
  setupAudioHooks() {
    window.pokedexAudio.onCryStart = () => {
      this.dom.soundVisualizer.classList.add('active');
      this.dom.mainSensor.classList.add('scanning');
      this.dom.ledYellow.classList.add('blink');
    };

    window.pokedexAudio.onCryEnd = () => {
      this.dom.soundVisualizer.classList.remove('active');
      this.dom.mainSensor.classList.remove('scanning');
      this.dom.ledYellow.classList.remove('blink');
    };
  }

  /**
   * Vincula todos los eventos de botones, teclado y búsqueda
   */
  bindEvents() {
    // D-Pad
    this.dom.dpadLeft.addEventListener('click', () => this.navigateRelative(-1));
    this.dom.dpadRight.addEventListener('click', () => this.navigateRelative(1));
    this.dom.dpadUp.addEventListener('click', () => this.navigateRelative(-10));
    this.dom.dpadDown.addEventListener('click', () => this.navigateRelative(10));

    // Botones de navegación
    this.dom.prevBtn.addEventListener('click', () => this.navigateRelative(-1));
    this.dom.nextBtn.addEventListener('click', () => this.navigateRelative(1));
    this.dom.randomBtn.addEventListener('click', () => this.loadRandomPokemon());

    // Botón de Rugido / Cry
    this.dom.playCryBtn.addEventListener('click', () => {
      window.pokedexAudio.playSfx('click');
      if (this.currentData) {
        window.pokedexAudio.playCry(this.currentData.id, this.currentData.cries);
      }
    });

    this.dom.quickCryBtn.addEventListener('click', () => {
      if (this.currentData) {
        window.pokedexAudio.playCry(this.currentData.id, this.currentData.cries);
      }
    });

    // Botón Shiny
    this.dom.toggleShinyBtn.addEventListener('click', () => {
      this.toggleShinyMode();
    });

    // Lente principal para reproducir sonido
    this.dom.mainSensor.addEventListener('click', () => {
      if (this.currentData) {
        window.pokedexAudio.playCry(this.currentData.id, this.currentData.cries);
      }
    });

    // Teclado numérico de acceso rápido
    this.dom.keyButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = parseInt(btn.getAttribute('data-jump'), 10);
        window.pokedexAudio.playSfx('click');
        this.loadPokemon(targetId);
      });
    });

    // Pestañas
    this.dom.tabButtons.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        this.switchTab(tabName);
      });
    });

    // Búsqueda en tiempo real
    let searchTimeout = null;
    this.dom.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const val = e.target.value.trim();
      this.dom.clearSearchBtn.classList.toggle('visible', val.length > 0);

      searchTimeout = setTimeout(() => {
        this.handleSearch(val);
      }, 250);
    });

    this.dom.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = this.dom.searchInput.value.trim();
        if (val) {
          this.handleSearchSubmit(val);
        }
      }
    });

    this.dom.clearSearchBtn.addEventListener('click', () => {
      this.dom.searchInput.value = '';
      this.dom.clearSearchBtn.classList.remove('visible');
      this.handleSearch('');
    });

    // Selectores de Filtro
    this.dom.generationSelect.addEventListener('change', () => this.applyFilters());
    this.dom.typeSelect.addEventListener('change', () => this.applyFilters());

    // Narración de la descripción por voz
    this.dom.btnSpeakDesc.addEventListener('click', () => {
      this.speakDexEntry();
    });

    // Atajos de Teclado
    window.addEventListener('keydown', (e) => {
      // Ignorar si el usuario está escribiendo en el input de búsqueda
      if (document.activeElement === this.dom.searchInput) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.navigateRelative(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.navigateRelative(1);
      } else if (e.key === ' ' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        if (this.currentData) {
          window.pokedexAudio.playCry(this.currentData.id, this.currentData.cries);
        }
      } else if (e.key === 's' || e.key === 'S') {
        this.toggleShinyMode();
      } else if (e.key === 'r' || e.key === 'R') {
        this.loadRandomPokemon();
      }
    });
  }

  /**
   * Cambia la pestaña activa
   */
  switchTab(tabName) {
    window.pokedexAudio.playSfx('beep');
    this.activeTab = tabName;

    this.dom.tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });

    this.dom.tabPanes.forEach(pane => {
      pane.classList.remove('active');
    });

    const targetPane = document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    if (targetPane) targetPane.classList.add('active');

    // Si abrió el catálogo, enfocar el elemento actual
    if (tabName === 'catalog') {
      this.highlightCatalogItem(this.currentId);
    }
  }

  /**
   * Carga un Pokémon específico por su ID o Nombre
   */
  async loadPokemon(idOrName) {
    if (this.isLoading) return;
    this.isLoading = true;

    // Efectos de escaneo
    this.dom.loadingScanner.classList.add('active');
    this.dom.mainSensor.classList.add('scanning');
    this.dom.ledRed.classList.add('blink');
    window.pokedexAudio.playSfx('select');

    try {
      const data = await window.pokeAPI.getFullPokemonData(idOrName);
      this.currentData = data;
      this.currentId = data.id;

      // Renderizar datos en la Pokédex
      this.renderMainScreen(data);
      this.renderStats(data);
      this.renderEvolutions(data.evolutions);
      this.renderDescription(data);
      this.renderAbilitiesAndMoves(data.abilities, data.moves);
      this.highlightCatalogItem(data.id);

      // Reproducir rugido oficial del Pokémon
      window.pokedexAudio.playCry(data.id, data.cries);

    } catch (error) {
      console.error('Error cargando Pokémon:', error);
      window.pokedexAudio.playSfx('error');
      this.dom.pokemonNameDisplay.textContent = 'NO ENCONTRADO';
      this.dom.dexNumberDisplay.textContent = '???';
    } finally {
      this.isLoading = false;
      this.dom.loadingScanner.classList.remove('active');
      this.dom.mainSensor.classList.remove('scanning');
      this.dom.ledRed.classList.remove('blink');
    }
  }

  /**
   * Renderiza la pantalla principal izquierda (Sprite, nombre, número, tipos)
   */
  renderMainScreen(data) {
    // Número formateado (#004) y nombre en mayúsculas
    this.dom.dexNumberDisplay.textContent = data.formattedId;
    this.dom.pokemonNameDisplay.textContent = data.name.toUpperCase();
    this.dom.genusDisplay.textContent = data.species.genus;

    // Sprite según si está en modo Shiny o Normal
    this.updateSpriteDisplay();

    // Tipos / Elementos
    this.dom.typesContainer.innerHTML = '';
    data.types.forEach(t => {
      const badge = document.createElement('span');
      badge.className = 'type-badge';
      badge.textContent = t.nameEs;
      badge.style.background = t.bg;
      this.dom.typesContainer.appendChild(badge);
    });
  }

  /**
   * Actualiza el sprite (normal vs shiny)
   */
  updateSpriteDisplay() {
    if (!this.currentData) return;
    const sprites = this.currentData.sprites;

    let spriteUrl = '';
    if (this.isShiny) {
      spriteUrl = sprites.animatedShiny || sprites.artworkShiny || sprites.pixelShiny;
      this.dom.shinySparkles.classList.add('active');
      this.dom.toggleShinyBtn.classList.add('active');
    } else {
      spriteUrl = sprites.animated || sprites.artwork || sprites.pixel;
      this.dom.shinySparkles.classList.remove('active');
      this.dom.toggleShinyBtn.classList.remove('active');
    }

    this.dom.pokemonSprite.src = spriteUrl;
    this.dom.pokemonSprite.alt = this.currentData.name;
  }

  /**
   * Alterna entre forma Normal y Variocolor (Shiny)
   */
  toggleShinyMode() {
    this.isShiny = !this.isShiny;
    if (this.isShiny) {
      window.pokedexAudio.playSfx('shiny');
    } else {
      window.pokedexAudio.playSfx('click');
    }
    this.updateSpriteDisplay();
  }

  /**
   * Renderiza las estadísticas con barras de progreso animadas
   */
  renderStats(data) {
    this.dom.heightDisplay.textContent = `${data.height} m`;
    this.dom.weightDisplay.textContent = `${data.weight} kg`;
    this.dom.totalStatsDisplay.textContent = data.totalStats;

    this.dom.statsList.innerHTML = '';
    data.stats.forEach(stat => {
      const row = document.createElement('div');
      row.className = 'stat-row';

      row.innerHTML = `
        <span class="stat-name">${stat.nameEs}</span>
        <span class="stat-value">${stat.base}</span>
        <div class="stat-bar-track">
          <div class="stat-bar-fill" style="width: 0%; background: ${stat.color};"></div>
        </div>
      `;

      this.dom.statsList.appendChild(row);

      // Animación suave de crecimiento de la barra
      setTimeout(() => {
        const fill = row.querySelector('.stat-bar-fill');
        if (fill) {
          fill.style.width = `${stat.percent}%`;
        }
      }, 50);
    });
  }

  /**
   * Renderiza la cadena de evoluciones interactiva
   */
  renderEvolutions(evolutions) {
    this.dom.evolutionChainContainer.innerHTML = '';

    if (!evolutions || evolutions.length === 0) {
      this.dom.evolutionChainContainer.innerHTML = `
        <p style="color: #94A3B8; font-family: var(--font-display); font-size: 13px;">
          Este Pokémon no evoluciona o no tiene datos evolutivos registrados.
        </p>
      `;
      return;
    }

    evolutions.forEach((evo, idx) => {
      // Flecha de transición si no es el primer Pokémon
      if (idx > 0) {
        const arrowBox = document.createElement('div');
        arrowBox.className = 'evo-arrow-box';
        arrowBox.innerHTML = `
          <i class="fa-solid fa-arrow-right evo-arrow"></i>
          ${evo.requirement ? `<span class="evo-req">${evo.requirement}</span>` : ''}
        `;
        this.dom.evolutionChainContainer.appendChild(arrowBox);
      }

      // Tarjeta del Pokémon evolucionado
      const card = document.createElement('div');
      card.className = `evo-card ${evo.id === this.currentId ? 'current' : ''}`;
      card.title = `Seleccionar a ${evo.name}`;
      
      card.innerHTML = `
        <img src="${evo.artwork || evo.sprite}" alt="${evo.name}" class="evo-sprite">
        <span class="evo-num">${evo.formattedId}</span>
        <span class="evo-name">${evo.name}</span>
      `;

      // Clic para cambiar directamente a esa evolución
      card.addEventListener('click', () => {
        if (evo.id !== this.currentId) {
          this.loadPokemon(evo.id);
        }
      });

      this.dom.evolutionChainContainer.appendChild(card);
    });
  }

  /**
   * Renderiza el texto de descripción oficial en español
   */
  renderDescription(data) {
    this.dom.flavorTextDisplay.textContent = data.species.flavorText;
  }

  /**
   * Lee la descripción en voz alta con síntesis de voz (efecto Pokédex)
   */
  speakDexEntry() {
    if (!('speechSynthesis' in window)) {
      alert('La síntesis de voz no es soportada en este navegador.');
      return;
    }

    window.speechSynthesis.cancel();
    window.pokedexAudio.playSfx('select');

    const textToSpeak = `${this.currentData.name}. ${this.currentData.species.genus}. ${this.currentData.species.flavorText}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95; // Un poco más solemne estilo Pokédex
    utterance.pitch = 1.05;

    // Buscar una voz en español disponible
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es'));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    this.dom.mainSensor.classList.add('scanning');
    utterance.onend = () => {
      this.dom.mainSensor.classList.remove('scanning');
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Renderiza las habilidades innatas y la tabla de movimientos aprendibles
   */
  renderAbilitiesAndMoves(abilities, moves) {
    // 1. Habilidades Innatas y Ocultas
    if (this.dom.abilitiesList) {
      this.dom.abilitiesList.innerHTML = '';
      if (!abilities || abilities.length === 0) {
        this.dom.abilitiesList.innerHTML = '<p style="color:#94A3B8; font-size:12px;">No hay habilidades registradas.</p>';
      } else {
        abilities.forEach(ab => {
          const card = document.createElement('div');
          card.className = 'ability-card';
          card.innerHTML = `
            <div class="ability-card-header">
              <span class="ability-card-name">${ab.name}</span>
              <span class="ability-badge ${ab.isHidden ? 'badge-hidden-ability' : 'badge-normal-ability'}">
                ${ab.isHidden ? 'HABILIDAD OCULTA' : 'HABILIDAD'}
              </span>
            </div>
            <p class="ability-desc">${ab.description}</p>
          `;
          this.dom.abilitiesList.appendChild(card);
        });
      }
    }

    // 2. Movimientos Aprendibles
    if (this.dom.movesTableBody) {
      this.dom.movesTableBody.innerHTML = '';
      if (!moves || moves.length === 0) {
        this.dom.movesTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94A3B8;">Sin movimientos registrados.</td></tr>';
      } else {
        moves.forEach(m => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td><strong>${m.name}</strong></td>
            <td><span class="type-badge" style="background:${m.typeBg}; font-size:9px; padding:2px 6px;">${m.typeEs}</span></td>
            <td><span class="move-category-badge category-${m.damageClass}">${m.damageClassEs}</span></td>
            <td>${m.power}</td>
            <td>${m.accuracy}</td>
            <td><span class="evo-req">${m.method}${m.level > 0 ? ' ' + m.level : ''}</span></td>
          `;
          this.dom.movesTableBody.appendChild(row);
        });
      }
    }
  }

  /**
   * Inicializa los controles y eventos de la Arena de Combate
   */
  initBattleSystem() {
    // Botón de combate ¡LUCHAR!
    if (this.dom.btnFightCurrent) {
      this.dom.btnFightCurrent.addEventListener('click', () => {
        window.pokedexAudio.playSfx('click');
        this.openBattleModal(true);
      });
    }

    // Botones de cierre
    if (this.dom.closeBattleBtn) {
      this.dom.closeBattleBtn.addEventListener('click', () => {
        this.closeBattleModal();
      });
    }

    if (this.dom.btnBattleFlee) {
      this.dom.btnBattleFlee.addEventListener('click', () => {
        window.pokedexAudio.playSfx('error');
        this.closeBattleModal();
      });
    }

    // Selector de Modo (1v1, 1v2, 2v2, 3v3, 6v6)
    if (this.dom.modeCards) {
      this.dom.modeCards.forEach(card => {
        card.addEventListener('click', () => {
          window.pokedexAudio.playSfx('beep');
          this.dom.modeCards.forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          this.battleMode = card.getAttribute('data-mode');
          this.updateBattleSetupTeams();
        });
      });
    }

    // Acciones de Selección de Equipo
    if (this.dom.btnUseCurrentPokemon) {
      this.dom.btnUseCurrentPokemon.addEventListener('click', () => {
        window.pokedexAudio.playSfx('click');
        this.setupTeamsWithCurrent();
      });
    }

    if (this.dom.btnPickCustomPokemon) {
      this.dom.btnPickCustomPokemon.addEventListener('click', () => {
        window.pokedexAudio.playSfx('click');
        this.openTeamPicker('player', 0);
      });
    }

    if (this.dom.btnRandomizeTeams) {
      this.dom.btnRandomizeTeams.addEventListener('click', () => {
        window.pokedexAudio.playSfx('click');
        this.randomizeBattleTeams();
      });
    }

    // Modal Selector de Pokémon para equipos
    if (this.dom.closeTeamPickerBtn) {
      this.dom.closeTeamPickerBtn.addEventListener('click', () => {
        this.dom.teamPickerOverlay.classList.remove('active');
      });
    }

    if (this.dom.teamPickerSearchInput) {
      this.dom.teamPickerSearchInput.addEventListener('input', () => {
        this.renderTeamPickerGrid();
      });
    }

    if (this.dom.teamPickerGenSelect) {
      this.dom.teamPickerGenSelect.addEventListener('change', () => {
        this.renderTeamPickerGrid();
      });
    }

    // Iniciar Batalla
    if (this.dom.btnStartBattleEngine) {
      this.dom.btnStartBattleEngine.addEventListener('click', () => {
        this.startActiveBattle();
      });
    }

    // Relevo / Cambiar Pokémon
    if (this.dom.btnBattleSwitch) {
      this.dom.btnBattleSwitch.addEventListener('click', () => {
        this.openSwitchTeamOverlay();
      });
    }

    if (this.dom.closeSwitchBtn) {
      this.dom.closeSwitchBtn.addEventListener('click', () => {
        this.dom.switchTeamOverlay.classList.remove('active');
      });
    }

    // Reiniciar tras resultado
    if (this.dom.btnResultReplay) {
      this.dom.btnResultReplay.addEventListener('click', () => {
        this.dom.battleResultOverlay.classList.remove('active');
        this.dom.battleCombatView.classList.remove('active');
        this.dom.battleSetupView.style.display = 'flex';
        this.updateBattleSetupTeams();
      });
    }
  }

  /**
   * Abre la ventana modal de combate
   */
  openBattleModal(useCurrent = false) {
    this.dom.battleModal.classList.add('active');
    this.dom.battleSetupView.style.display = 'flex';
    this.dom.battleCombatView.classList.remove('active');
    this.dom.battleResultOverlay.classList.remove('active');
    this.dom.switchTeamOverlay.classList.remove('active');

    if (useCurrent || this.battlePlayerIds.length === 0) {
      this.setupTeamsWithCurrent();
    } else {
      this.updateBattleSetupTeams();
    }
  }

  /**
   * Cierra el modal de combate
   */
  closeBattleModal() {
    this.dom.battleModal.classList.remove('active');
  }

  /**
   * Prepara los equipos colocando al Pokémon actualmente visto en primer lugar
   */
  setupTeamsWithCurrent() {
    const counts = this.getModeCounts();
    this.battlePlayerIds = [this.currentId];

    // Rellenar equipo del jugador si el modo requiere más de 1
    while (this.battlePlayerIds.length < counts.player) {
      const randId = Math.floor(Math.random() * window.pokeAPI.totalSpecies) + 1;
      if (!this.battlePlayerIds.includes(randId)) {
        this.battlePlayerIds.push(randId);
      }
    }

    // Equipo Rival
    this.battleRivalIds = [];
    while (this.battleRivalIds.length < counts.rival) {
      const randId = Math.floor(Math.random() * window.pokeAPI.totalSpecies) + 1;
      if (!this.battleRivalIds.includes(randId) && !this.battlePlayerIds.includes(randId)) {
        this.battleRivalIds.push(randId);
      }
    }

    this.updateBattleSetupTeams();
  }

  /**
   * Genera ambos equipos de forma 100% aleatoria
   */
  randomizeBattleTeams() {
    const counts = this.getModeCounts();

    this.battlePlayerIds = [];
    while (this.battlePlayerIds.length < counts.player) {
      const randId = Math.floor(Math.random() * window.pokeAPI.totalSpecies) + 1;
      if (!this.battlePlayerIds.includes(randId)) {
        this.battlePlayerIds.push(randId);
      }
    }

    this.battleRivalIds = [];
    while (this.battleRivalIds.length < counts.rival) {
      const randId = Math.floor(Math.random() * window.pokeAPI.totalSpecies) + 1;
      if (!this.battleRivalIds.includes(randId) && !this.battlePlayerIds.includes(randId)) {
        this.battleRivalIds.push(randId);
      }
    }

    this.updateBattleSetupTeams();
  }

  /**
   * Retorna la cantidad de Pokémon por bando según el modo
   */
  getModeCounts() {
    switch (this.battleMode) {
      case '1v1': return { player: 1, rival: 1 };
      case '1v2': return { player: 1, rival: 2 };
      case '2v2': return { player: 2, rival: 2 };
      case '3v3': return { player: 3, rival: 3 };
      case '6v6': return { player: 6, rival: 6 };
      default: return { player: 1, rival: 1 };
    }
  }

  /**
   * Actualiza la interfaz previa de los equipos en el Setup con casillas interactivas
   */
  updateBattleSetupTeams() {
    const counts = this.getModeCounts();

    // Ajustar longitudes
    while (this.battlePlayerIds.length < counts.player) {
      const randId = Math.floor(Math.random() * window.pokeAPI.totalSpecies) + 1;
      this.battlePlayerIds.push(randId);
    }
    this.battlePlayerIds = this.battlePlayerIds.slice(0, counts.player);

    while (this.battleRivalIds.length < counts.rival) {
      const randId = Math.floor(Math.random() * window.pokeAPI.totalSpecies) + 1;
      this.battleRivalIds.push(randId);
    }
    this.battleRivalIds = this.battleRivalIds.slice(0, counts.rival);

    // Actualizar etiquetas
    this.dom.playerTeamCount.textContent = `${this.battlePlayerIds.length} Pokémon`;
    this.dom.rivalTeamCount.textContent = `${this.battleRivalIds.length} Pokémon`;

    // Renderizar ranuras del jugador (clickeables para elegir Pokémon)
    this.dom.playerTeamSlots.innerHTML = '';
    this.battlePlayerIds.forEach((id, idx) => {
      const slot = document.createElement('div');
      slot.className = 'team-slot';
      slot.title = `Haz clic para cambiar este Pokémon (#${id})`;
      slot.innerHTML = `
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png" alt="P${id}">
        <span class="slot-num">#${id}</span>
        <i class="fa-solid fa-pen slot-edit-icon"></i>
      `;
      slot.addEventListener('click', () => {
        window.pokedexAudio.playSfx('click');
        this.openTeamPicker('player', idx);
      });
      this.dom.playerTeamSlots.appendChild(slot);
    });

    // Renderizar ranuras del rival (clickeables para elegir Pokémon rival)
    this.dom.rivalTeamSlots.innerHTML = '';
    this.battleRivalIds.forEach((id, idx) => {
      const slot = document.createElement('div');
      slot.className = 'team-slot';
      slot.title = `Haz clic para cambiar este rival (#${id})`;
      slot.innerHTML = `
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png" alt="R${id}">
        <span class="slot-num">#${id}</span>
        <i class="fa-solid fa-pen slot-edit-icon"></i>
      `;
      slot.addEventListener('click', () => {
        window.pokedexAudio.playSfx('click');
        this.openTeamPicker('rival', idx);
      });
      this.dom.rivalTeamSlots.appendChild(slot);
    });
  }

  /**
   * Abre el selector de Pokémon para una casilla específica del equipo
   */
  openTeamPicker(side = 'player', slotIndex = 0) {
    this.pickerTargetSide = side;
    this.pickerTargetSlot = slotIndex;

    const sideText = side === 'player' ? 'TU EQUIPO' : 'EL EQUIPO RIVAL';
    if (this.dom.teamPickerTitle) {
      this.dom.teamPickerTitle.textContent = `ELIGE POKÉMON PARA ${sideText} (CASILLA ${slotIndex + 1})`;
    }
    if (this.dom.teamPickerSearchInput) {
      this.dom.teamPickerSearchInput.value = '';
    }
    if (this.dom.teamPickerGenSelect) {
      this.dom.teamPickerGenSelect.value = 'all';
    }

    this.renderTeamPickerGrid();
    if (this.dom.teamPickerOverlay) {
      this.dom.teamPickerOverlay.classList.add('active');
    }
  }

  /**
   * Renderiza los Pokémon en la cuadrícula del selector
   */
  renderTeamPickerGrid() {
    if (!this.dom.teamPickerGrid) return;
    this.dom.teamPickerGrid.innerHTML = '';

    const query = (this.dom.teamPickerSearchInput?.value || '').toLowerCase().replace('#', '').trim();
    const genVal = this.dom.teamPickerGenSelect?.value || 'all';

    let list = [...this.allPokemon];

    if (genVal !== 'all') {
      const genNum = parseInt(genVal, 10);
      const genInfo = window.pokeAPI.generations.find(g => g.id === genNum);
      if (genInfo) {
        list = list.filter(p => p.id >= genInfo.start && p.id <= genInfo.end);
      }
    }

    if (query) {
      list = list.filter(p => String(p.id).includes(query) || p.name.toLowerCase().includes(query));
    }

    const items = list.slice(0, 150);
    items.forEach(p => {
      const card = document.createElement('div');
      card.className = 'team-picker-item';
      card.title = `Seleccionar a ${window.pokeAPI.capitalize(p.name)}`;
      card.innerHTML = `
        <img src="${p.sprite}" alt="${p.name}" loading="lazy">
        <span class="p-num">${p.formattedId}</span>
        <span class="p-name">${window.pokeAPI.capitalize(p.name)}</span>
      `;

      card.addEventListener('click', () => {
        window.pokedexAudio.playSfx('select');
        if (this.pickerTargetSide === 'player') {
          this.battlePlayerIds[this.pickerTargetSlot] = p.id;
        } else {
          this.battleRivalIds[this.pickerTargetSlot] = p.id;
        }
        if (this.dom.teamPickerOverlay) {
          this.dom.teamPickerOverlay.classList.remove('active');
        }
        this.updateBattleSetupTeams();
      });

      this.dom.teamPickerGrid.appendChild(card);
    });
  }

  /**
   * Inicia el motor de combate y pasa a la pantalla de batalla
   */
  async startActiveBattle() {
    this.dom.btnStartBattleEngine.disabled = true;
    this.dom.btnStartBattleEngine.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparando...';

    try {
      const battleData = await window.pokemonBattle.startBattle(
        this.battleMode,
        this.battlePlayerIds,
        this.battleRivalIds
      );

      // Cambiar vistas
      this.dom.battleSetupView.style.display = 'none';
      this.dom.battleCombatView.classList.add('active');

      this.updateBattleStage(battleData.activePlayer, battleData.activeRival);
      this.renderBattleTeamBalls();
      this.renderBattleMoves(battleData.activePlayer);

      this.dom.battleDialogueBox.textContent = `¡Comienza el combate ${this.battleMode.toUpperCase()}! ¿Qué debería hacer ${battleData.activePlayer.name}?`;

    } catch (err) {
      console.error('Error al iniciar batalla:', err);
      alert('Hubo un problema al cargar los datos del combate.');
    } finally {
      this.dom.btnStartBattleEngine.disabled = false;
      this.dom.btnStartBattleEngine.innerHTML = '<i class="fa-solid fa-swords"></i> ¡COMENZAR COMBATE!';
    }
  }

  /**
   * Actualiza los combatientes en el escenario y sus HUDs
   */
  updateBattleStage(player, rival) {
    // Sprites
    this.dom.playerSprite.src = player.sprites.animated || player.sprites.artwork || player.sprites.pixel;
    this.dom.playerSprite.alt = player.name;
    this.dom.playerSprite.className = 'combatant-sprite player-sprite-img';

    this.dom.rivalSprite.src = rival.sprites.animated || rival.sprites.artwork || rival.sprites.pixel;
    this.dom.rivalSprite.alt = rival.name;
    this.dom.rivalSprite.className = 'combatant-sprite rival-sprite-img';

    // HUD Jugador con Nivel Dinámico
    this.dom.playerHudName.textContent = player.name.toUpperCase();
    if (this.dom.playerHudLevel) {
      this.dom.playerHudLevel.textContent = `Nv. ${player.level}`;
    }
    this.updateHpBar(player, true);

    // HUD Rival con Nivel Dinámico
    this.dom.rivalHudName.textContent = rival.name.toUpperCase();
    if (this.dom.rivalHudLevel) {
      this.dom.rivalHudLevel.textContent = `Nv. ${rival.level}`;
    }
    this.updateHpBar(rival, false);
  }

  /**
   * Actualiza la barra de PS y sus colores dinámicos
   */
  updateHpBar(pokemon, isPlayer) {
    const percent = Math.max(0, Math.round((pokemon.stats.currentHp / pokemon.stats.maxHp) * 100));
    const fill = isPlayer ? this.dom.playerHpFill : this.dom.rivalHpFill;
    const text = isPlayer ? this.dom.playerHpText : this.dom.rivalHpText;

    fill.style.width = `${percent}%`;
    fill.classList.remove('hp-mid', 'hp-low');

    if (percent <= 20) {
      fill.classList.add('hp-low');
    } else if (percent <= 50) {
      fill.classList.add('hp-mid');
    }

    if (isPlayer) {
      text.textContent = `${pokemon.stats.currentHp} / ${pokemon.stats.maxHp}`;
    } else {
      text.textContent = `${percent}%`;
    }
  }

  /**
   * Dibuja los círculos de Pokéballs para ver cuántos miembros quedan
   */
  renderBattleTeamBalls() {
    const renderBalls = (team, container) => {
      container.innerHTML = '';
      team.forEach(p => {
        const ball = document.createElement('span');
        ball.className = `team-ball-dot ${p.fainted ? 'fainted' : ''}`;
        container.appendChild(ball);
      });
    };

    renderBalls(window.pokemonBattle.playerTeam, this.dom.playerTeamBalls);
    renderBalls(window.pokemonBattle.rivalTeam, this.dom.rivalTeamBalls);
  }

  /**
   * Renderiza los 4 botones de ataque del Pokémon activo
   */
  renderBattleMoves(player) {
    this.dom.battleMovesGrid.innerHTML = '';

    player.moves.forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'btn-move';
      
      const typeInfo = window.pokeAPI.typeTranslations[m.type] || { es: m.type, bg: '#555' };

      btn.innerHTML = `
        <span class="move-title">${m.name}</span>
        <div class="move-meta">
          <span class="move-type-pill" style="background:${typeInfo.bg}">${typeInfo.es}</span>
          <span>Pot: ${m.power || '-'}</span>
        </div>
      `;

      btn.addEventListener('click', () => {
        this.executePlayerMove(m);
      });

      this.dom.battleMovesGrid.appendChild(btn);
    });
  }

  /**
   * Ejecuta el turno con el movimiento seleccionado
   */
  async executePlayerMove(move) {
    // Desactivar botones temporalmente
    this.setMovesDisabled(true);

    const callbacks = {
      onDialogue: (text) => {
        this.dom.battleDialogueBox.textContent = text;
      },
      onAttackAnimation: (isPlayer) => {
        const sprite = isPlayer ? this.dom.playerSprite : this.dom.rivalSprite;
        const animClass = isPlayer ? 'attack-lunge-player' : 'attack-lunge-rival';
        sprite.classList.add(animClass);
        setTimeout(() => sprite.classList.remove(animClass), 350);
      },
      onHitAnimation: (isPlayerTarget) => {
        const sprite = isPlayerTarget ? this.dom.playerSprite : this.dom.rivalSprite;
        sprite.classList.add('hit-shake');
        setTimeout(() => sprite.classList.remove('hit-shake'), 400);
      },
      onHpUpdate: (pokemon, isPlayerTarget) => {
        this.updateHpBar(pokemon, isPlayerTarget);
      },
      onFaintAnimation: (isPlayer) => {
        const sprite = isPlayer ? this.dom.playerSprite : this.dom.rivalSprite;
        sprite.classList.add('faint-fall');
      },
      onTeamBallsUpdate: () => {
        this.renderBattleTeamBalls();
      },
      onPromptPlayerSwitch: () => {
        this.openSwitchTeamOverlay(true);
      },
      onPlayerSwitch: (newPokemon) => {
        this.updateBattleStage(newPokemon, window.pokemonBattle.getRivalActive());
        this.renderBattleMoves(newPokemon);
        this.renderBattleTeamBalls();
        this.dom.switchTeamOverlay.classList.remove('active');
      },
      onRivalSwitch: (newRival) => {
        this.updateBattleStage(window.pokemonBattle.getPlayerActive(), newRival);
        this.renderBattleTeamBalls();
      },
      onBattleEnd: (isVictory, message) => {
        this.showBattleResult(isVictory, message);
      }
    };

    await window.pokemonBattle.executeTurn(move, callbacks);

    if (!window.pokemonBattle.battleOver) {
      this.setMovesDisabled(false);
    }
  }

  /**
   * Bloquea o desbloquea los botones de ataque durante las animaciones
   */
  setMovesDisabled(disabled) {
    const btns = this.dom.battleMovesGrid.querySelectorAll('.btn-move');
    btns.forEach(b => b.disabled = disabled);
    this.dom.btnBattleSwitch.disabled = disabled;
  }

  /**
   * Abre la pantalla de relevo de Pokémon
   */
  openSwitchTeamOverlay(forced = false) {
    this.dom.switchTeamList.innerHTML = '';
    const active = window.pokemonBattle.getPlayerActive();

    window.pokemonBattle.playerTeam.forEach((p, idx) => {
      const card = document.createElement('div');
      const isCurrent = idx === window.pokemonBattle.playerActiveIndex;
      card.className = `switch-card ${isCurrent ? 'current' : ''} ${p.fainted ? 'fainted' : ''}`;

      card.innerHTML = `
        <img src="${p.sprites.pixel || p.sprites.artwork}" alt="${p.name}">
        <div class="switch-card-info">
          <div class="switch-card-name">${p.name} ${isCurrent ? '(En combate)' : ''}</div>
          <div class="switch-card-hp">PS: ${p.stats.currentHp} / ${p.stats.maxHp} ${p.fainted ? '• DEBILITADO' : ''}</div>
        </div>
      `;

      if (!isCurrent && !p.fainted) {
        card.addEventListener('click', async () => {
          this.dom.switchTeamOverlay.classList.remove('active');

          const callbacks = {
            onDialogue: (text) => { this.dom.battleDialogueBox.textContent = text; },
            onPlayerSwitch: (newPokemon) => {
              this.updateBattleStage(newPokemon, window.pokemonBattle.getRivalActive());
              this.renderBattleMoves(newPokemon);
              this.renderBattleTeamBalls();
            }
          };

          window.pokemonBattle.switchPlayerPokemon(idx, callbacks);

          // Si el cambio fue voluntario (no forzado por desmayo), el rival tiene su turno de ataque
          if (!forced) {
            this.setMovesDisabled(true);
            await new Promise(r => setTimeout(r, 800));
            const rival = window.pokemonBattle.getRivalActive();
            const rivalMove = rival.moves[Math.floor(Math.random() * rival.moves.length)];

            const turnCallbacks = {
              onDialogue: (text) => { this.dom.battleDialogueBox.textContent = text; },
              onAttackAnimation: () => {
                this.dom.rivalSprite.classList.add('attack-lunge-rival');
                setTimeout(() => this.dom.rivalSprite.classList.remove('attack-lunge-rival'), 350);
              },
              onHitAnimation: () => {
                this.dom.playerSprite.classList.add('hit-shake');
                setTimeout(() => this.dom.playerSprite.classList.remove('hit-shake'), 400);
              },
              onHpUpdate: (pokemon) => { this.updateHpBar(pokemon, true); },
              onFaintAnimation: () => { this.dom.playerSprite.classList.add('faint-fall'); },
              onTeamBallsUpdate: () => { this.renderBattleTeamBalls(); },
              onPromptPlayerSwitch: () => { this.openSwitchTeamOverlay(true); },
              onBattleEnd: (isVictory, msg) => { this.showBattleResult(isVictory, msg); }
            };

            await window.pokemonBattle.performAttack(rival, window.pokemonBattle.getPlayerActive(), rivalMove, false, turnCallbacks);
            if (window.pokemonBattle.getPlayerActive().currentHp <= 0) {
              await window.pokemonBattle.handleFaint(window.pokemonBattle.getPlayerActive(), true, turnCallbacks);
            }
            this.setMovesDisabled(false);
          }
        });
      }

      this.dom.switchTeamList.appendChild(card);
    });

    this.dom.switchTeamOverlay.classList.add('active');
  }

  /**
   * Muestra la pantalla de resultado final de la batalla
   */
  showBattleResult(isVictory, message) {
    this.dom.battleResultTitle.textContent = isVictory ? '¡VICTORIA!' : '¡DERROTA!';
    this.dom.battleResultTitle.className = `result-title ${isVictory ? 'victory' : 'defeat'}`;
    this.dom.battleResultSubtitle.textContent = message;
    this.dom.battleResultOverlay.classList.add('active');
  }

  /**
   * Renderiza la cuadrícula de catálogo rápido (Índice de especies)
   */
  renderCatalog(limit = 200) {
    this.dom.catalogGrid.innerHTML = '';
    this.catalogLimit = limit;

    const itemsToRender = this.filteredList.slice(0, this.catalogLimit);

    itemsToRender.forEach(p => {
      const item = document.createElement('div');
      item.className = `catalog-item ${p.id === this.currentId ? 'active' : ''}`;
      item.setAttribute('data-id', p.id);

      item.innerHTML = `
        <img src="${p.sprite}" alt="${p.name}" class="catalog-sprite" loading="lazy">
        <span class="catalog-num">${p.formattedId}</span>
        <span class="catalog-name">${window.pokeAPI.capitalize(p.name)}</span>
      `;

      item.addEventListener('click', () => {
        this.loadPokemon(p.id);
      });

      this.dom.catalogGrid.appendChild(item);
    });

    // Si hay más Pokémon en la lista filtrada, añadir botón para cargar más
    if (this.filteredList.length > this.catalogLimit) {
      const loadMoreBtn = document.createElement('button');
      loadMoreBtn.className = 'key-btn';
      loadMoreBtn.style.gridColumn = '1 / -1';
      loadMoreBtn.style.margin = '10px 0';
      loadMoreBtn.style.padding = '8px';
      loadMoreBtn.innerHTML = `<i class="fa-solid fa-angles-down"></i> Cargar más Pokémon (${this.catalogLimit} de ${this.filteredList.length})`;
      
      loadMoreBtn.addEventListener('click', () => {
        this.renderCatalog(this.catalogLimit + 200);
      });

      this.dom.catalogGrid.appendChild(loadMoreBtn);
    }
  }

  /**
   * Resalta el Pokémon activo en el catálogo
   */
  highlightCatalogItem(id) {
    document.querySelectorAll('.catalog-item').forEach(el => {
      el.classList.toggle('active', parseInt(el.getAttribute('data-id'), 10) === id);
    });
  }

  /**
   * Navega de forma relativa (+1, -1, +10, etc.)
   */
  navigateRelative(offset) {
    window.pokedexAudio.playSfx('click');
    let nextId = this.currentId + offset;
    const maxId = window.pokeAPI.totalSpecies;

    if (nextId < 1) nextId = maxId;
    if (nextId > maxId) nextId = 1;

    this.loadPokemon(nextId);
  }

  /**
   * Carga un Pokémon al azar
   */
  loadRandomPokemon() {
    window.pokedexAudio.playSfx('click');
    const randomId = Math.floor(Math.random() * window.pokeAPI.totalSpecies) + 1;
    this.loadPokemon(randomId);
  }

  /**
   * Filtrado en tiempo real en la barra de búsqueda
   */
  handleSearch(query) {
    const clean = query.toLowerCase().replace('#', '').trim();
    if (!clean) {
      this.applyFilters();
      return;
    }

    this.filteredList = this.allPokemon.filter(p => {
      const matchesNum = String(p.id).includes(clean);
      const matchesName = p.name.toLowerCase().includes(clean);
      return matchesNum || matchesName;
    });

    this.renderCatalog();
    this.switchTab('catalog');
  }

  /**
   * Si el usuario presiona Enter para buscar directamente
   */
  handleSearchSubmit(query) {
    const clean = query.toLowerCase().replace('#', '').trim();
    const num = parseInt(clean, 10);

    if (!isNaN(num) && num >= 1 && num <= window.pokeAPI.totalSpecies) {
      this.loadPokemon(num);
    } else {
      // Buscar por coincidencia exacta o primer resultado
      const found = this.allPokemon.find(p => p.name.toLowerCase() === clean || p.name.toLowerCase().startsWith(clean));
      if (found) {
        this.loadPokemon(found.id);
      } else {
        window.pokedexAudio.playSfx('error');
      }
    }
  }

  /**
   * Aplica filtros combinados de Generación y Tipo
   */
  async applyFilters() {
    const genVal = this.dom.generationSelect.value;
    const typeVal = this.dom.typeSelect.value;

    let list = [...this.allPokemon];

    // Filtro por Generación
    if (genVal !== 'all') {
      const genNum = parseInt(genVal, 10);
      const genInfo = window.pokeAPI.generations.find(g => g.id === genNum);
      if (genInfo) {
        list = list.filter(p => p.id >= genInfo.start && p.id <= genInfo.end);
      }
    }

    // Filtro por Tipo/Elemento
    if (typeVal !== 'all') {
      const typeIds = await window.pokeAPI.getPokemonByType(typeVal);
      if (typeIds) {
        list = list.filter(p => typeIds.has(p.id));
      }
    }

    this.filteredList = list;
    this.renderCatalog();

    // Si hay un filtro aplicado, cambiar a la pestaña de catálogo para ver resultados
    if (genVal !== 'all' || typeVal !== 'all') {
      this.switchTab('catalog');
    }
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.pokedexApp = new PokedexApp();
  window.pokedexApp.init();
});
