// -------------------------------------------------------------
// APP SCRIPT - GRUPPO 11 (POLITECNICO DI TORINO - LIGHT MODE)
// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  let projectData = [];
  
  // DOM Elements
  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const resetSearchBtn = document.getElementById('reset-search-btn');
  const bandiGroupsTarget = document.getElementById('macro-groups-target'); // matches target in HTML
  const visibleCountEl = document.getElementById('visible-count');
  const totalCountEl = document.getElementById('total-count');
  const noResultsEl = document.getElementById('no-results');
  
  const canvas = document.getElementById('bubbles-canvas');
  const canvasContainer = document.getElementById('canvas-container');
  
  // Load data and initialize
  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      projectData = data;
      renderBandiList(projectData);
      updateProjectCounts();
      attachAccordionListeners();
      initBubbleSimulation(projectData);
    })
    .catch(error => {
      console.error('Error loading project data:', error);
      bandiGroupsTarget.innerHTML = `
        <div class="no-results-state">
          <h3>Errore nel caricamento dei dati</h3>
          <p>Impossibile caricare il file data.json. Verifica che il server sia attivo.</p>
        </div>
      `;
    });
    
  // Helper to convert hex to RGB
  function hexToRgb(hex) {
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
  }
    
  // --- Rendering Functions ---
  
  function renderBandiList(data) {
    bandiGroupsTarget.innerHTML = '';
    
    data.forEach(bando => {
      const bandoBlock = document.createElement('div');
      bandoBlock.className = 'bando-block';
      bandoBlock.id = `macro-project-${bando.row}`; // keeps scroll anchoring ID
      bandoBlock.dataset.row = bando.row;
      
      let progettiCardsMarkup = '';
      let summarySquaresMarkup = '';
      
      bando.micro_projects.forEach((micro, idx) => {
        summarySquaresMarkup += `
          <span class="summary-square" data-index="${idx}" style="background-color: #${bando.color};"></span>
        `;
        
        const addressQuery = micro.location.toLowerCase().includes('torino')
          ? micro.location
          : `${micro.location}, Torino`;
        const googleMapsUrl = `https://maps.google.com/?q=${encodeURIComponent(addressQuery)}`;
        
        progettiCardsMarkup += `
          <div class="progetto-card" style="--card-accent-color: #${bando.color}" data-name="${micro.name.toLowerCase()}" data-location="${micro.location.toLowerCase()}">
            <h3 class="progetto-title">${micro.name}</h3>
            <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="progetto-location-link">
              <div class="progetto-location">
                <svg class="location-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>${micro.location}</span>
              </div>
            </a>
          </div>
        `;
      });
      
      bandoBlock.innerHTML = `
        <div class="bando-sidebar">
          <div class="bando-header-container">
            <span class="color-swatch-badge" style="background-color: #${bando.color}"></span>
            <h2 class="bando-name">${bando.name}</h2>
          </div>
          
          <!-- At-a-glance summary (Acts as the folder accordion header) -->
          <div class="bando-summary-panel" role="button" aria-expanded="false" aria-label="Espandi dettagli progetti">
            <div class="summary-title-row">
              <div class="summary-counter-wrapper">
                <span class="summary-label">A colpo d'occhio</span>
                <span class="summary-counter">${bando.micro_projects.length} progetti</span>
              </div>
              <div class="folder-toggle-indicator">
                <svg class="chevron-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div class="summary-squares-grid">
              ${summarySquaresMarkup}
            </div>
          </div>
          
          <div class="bando-budget">
            <div class="budget-item">
              <span class="budget-label">Budget Nominale</span>
              <span class="budget-val">${bando.budget_nominale}</span>
            </div>
            <div class="budget-item">
              <span class="budget-label">Risorse Complessive</span>
              <span class="budget-val">${bando.budget_dettaglio}</span>
            </div>
          </div>
        </div>
        <div class="progetti-grid">
          ${progettiCardsMarkup}
        </div>
      `;
      
      bandiGroupsTarget.appendChild(bandoBlock);
    });
  }
  
  function attachAccordionListeners() {
    document.querySelectorAll('.bando-summary-panel').forEach(panel => {
      panel.addEventListener('click', () => {
        const block = panel.closest('.bando-block');
        const isExpanded = block.classList.toggle('expanded');
        panel.setAttribute('aria-expanded', isExpanded);
      });
    });
  }
  
  function updateProjectCounts() {
    let total = 0;
    let visible = 0;
    
    projectData.forEach(bando => {
      total += bando.micro_projects.length;
    });
    
    const visibleCards = document.querySelectorAll('.progetto-card:not(.hidden)');
    visible = visibleCards.length;
    
    visibleCountEl.textContent = visible;
    totalCountEl.textContent = total;
  }
  
  // --- Search and Filtering ---
  
  function performFilter(query) {
    const cleanQuery = query.trim().toLowerCase();
    
    if (cleanQuery === '') {
      searchClearBtn.style.display = 'none';
      noResultsEl.style.display = 'none';
      
      document.querySelectorAll('.bando-block').forEach(block => {
        block.classList.remove('hidden', 'dimmed', 'expanded');
        block.querySelector('.bando-summary-panel').setAttribute('aria-expanded', 'false');
      });
      document.querySelectorAll('.progetto-card').forEach(card => {
        card.classList.remove('hidden', 'highlighted', 'dimmed');
      });
      document.querySelectorAll('.summary-square').forEach(square => {
        square.style.display = 'inline-block';
      });
      document.querySelectorAll('.bando-block').forEach(block => {
        const bandoRow = parseInt(block.dataset.row);
        const bando = projectData.find(b => b.row === bandoRow);
        if (bando) {
          const counter = block.querySelector('.summary-counter');
          if (counter) counter.textContent = `${bando.micro_projects.length} progetti`;
        }
      });
      
      if (window.bubbleSimulation) {
        window.bubbleSimulation.resetFilter();
      }
      
      updateProjectCounts();
      return;
    }
    
    searchClearBtn.style.display = 'block';
    const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 0);
    const matchingBandoRows = [];
    const matchingProjectsMap = {};
    
    projectData.forEach(bando => {
      const blockEl = document.getElementById(`macro-project-${bando.row}`);
      if (!blockEl) return;
      
      const bandoText = (bando.name + ' ' + bando.budget_nominale + ' ' + bando.budget_dettaglio).toLowerCase();
      
      let bandoHasMatchingMicro = false;
      const matchingIndices = [];
      
      const cards = blockEl.querySelectorAll('.progetto-card');
      const squares = blockEl.querySelectorAll('.summary-square');
      
      cards.forEach((card, idx) => {
        const name = card.dataset.name;
        const location = card.dataset.location;
        const projectText = (name + ' ' + location).toLowerCase();
        
        // Every search word must be found in either the project text or the bando text
        const isMatch = queryWords.every(word => projectText.includes(word) || bandoText.includes(word));
        
        if (isMatch) {
          card.classList.remove('hidden');
          card.classList.add('highlighted');
          bandoHasMatchingMicro = true;
          matchingIndices.push(idx);
          if (squares[idx]) {
            squares[idx].style.display = 'inline-block';
          }
        } else {
          card.classList.add('hidden');
          card.classList.remove('highlighted');
          if (squares[idx]) {
            squares[idx].style.display = 'none';
          }
        }
      });
      
      const totalCount = bando.micro_projects.length;
      const visibleCount = matchingIndices.length;
      const summaryCounter = blockEl.querySelector('.summary-counter');
      if (summaryCounter) {
        if (visibleCount === totalCount) {
          summaryCounter.textContent = `${totalCount} progetti`;
        } else {
          summaryCounter.textContent = `${visibleCount} di ${totalCount} progetti`;
        }
      }
      
      if (bandoHasMatchingMicro) {
        blockEl.classList.remove('hidden', 'dimmed');
        blockEl.classList.add('expanded');
        blockEl.querySelector('.bando-summary-panel').setAttribute('aria-expanded', 'true');
        matchingBandoRows.push(bando.row);
        matchingProjectsMap[bando.row] = {
          hasMatchingMicro: true,
          matchingIndices: matchingIndices
        };
      } else {
        blockEl.classList.add('hidden');
        blockEl.classList.remove('expanded');
      }
    });
    
    if (matchingBandoRows.length > 0) {
      noResultsEl.style.display = 'none';
    } else {
      noResultsEl.style.display = 'flex';
    }
    
    if (window.bubbleSimulation) {
      window.bubbleSimulation.filterMacros(matchingBandoRows, matchingProjectsMap);
    }
    
    updateProjectCounts();
  }
  
  // Event Listeners
  searchInput.addEventListener('input', (e) => {
    performFilter(e.target.value);
  });
  
  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    performFilter('');
    searchInput.focus();
  });
  
  resetSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    performFilter('');
    searchInput.focus();
  });
  
  // --- Canvas Physics Bubble Simulation ---
  
  function initBubbleSimulation(data) {
    const ctx = canvas.getContext('2d');
    let animationId = null;
    let width = 0;
    let height = 0;
    
    // Mapped bubble size directly proportional to budget complessivo/dettaglio
    const radiiMap = {
      3: 50,  // La cultura dietro l'angolo (360k €)
      8: 62,  // SPARKS (1M €)
      5: 68,  // CivICa (1.7M €)
      6: 78,  // YEPP (4.7M €)
      7: 84,  // Bando SPACE (5.0M €)
      4: 105  // Città nella Città (40M €)
    };
    
    // Detailed budget text displayed in the bubble
    const displayBudgetsMap = {
      3: "360.000 €",
      8: "1.000.000 €",
      5: "1.731.000 €",
      6: "4.750.000 €", // average detailed budget
      7: "5.042.000 €",
      4: "40.000.000 €"
    };

    const bubbles = [];
    let hoveredBubble = null;
    let draggedBubble = null;
    let dragOffset = { x: 0, y: 0 };
    let mouse = { x: 0, y: 0 };
    let currentScale = 1.0;
    
    // Resizing
    function resizeCanvas() {
      const containerWidth = canvasContainer.clientWidth;
      const containerHeight = canvasContainer.clientHeight;
      
      // Fallback to window width or default values if container is not yet rendered (0 width/height)
      width = containerWidth || window.innerWidth || 375;
      const isMobile = width < 768;
      height = containerHeight || (isMobile ? 280 : 500);
      
      canvas.width = width;
      canvas.height = height;
      
      const targetScale = isMobile ? 0.52 : 1.0;
      currentScale = targetScale;
      
      bubbles.forEach(b => {
        b.baseRadius = b.originalRadius * currentScale;
        
        let targetR = b.baseRadius * (b.filterScale || 1.0);
        if (b.isHovered) {
          targetR = targetR * 1.12;
        }
        b.targetRadius = targetR;
      });
      
      adjustTitleSizes();
    }

    function adjustTitleSizes() {
      const lines = document.querySelectorAll('.title-line');
      const container = document.querySelector('.hero-title');
      if (!container || lines.length === 0) return;
      
      const containerWidth = container.clientWidth;
      if (containerWidth <= 0) return;
      
      lines.forEach(line => {
        line.style.display = 'inline-block';
        line.style.fontSize = '10px';
        
        const naturalWidth = line.offsetWidth;
        if (naturalWidth > 0) {
          // Adjust font size dynamically to fill the container width exactly
          // Subtracting 2px prevents subpixel wrapping and alignment bugs
          const fontSize = ((containerWidth - 2) / naturalWidth) * 10;
          line.style.fontSize = `${fontSize}px`;
        }
        
        line.style.display = 'block';
      });
    }

    if (document.fonts) {
      document.fonts.ready.then(() => {
        adjustTitleSizes();
      });
    }
    
    // Physics constants
    const gravity = 0.025;      // Gentler central pull
    const friction = 0.97;      // Damping
    const mouseRepulsion = 0.25; // Push from cursor
    
    // Initialize bubbles
    data.forEach((bando, index) => {
      const baseR = radiiMap[bando.row] || 70;
      const containerWidth = canvasContainer.clientWidth;
      const fallbackWidth = containerWidth || window.innerWidth || 375;
      const isMobile = fallbackWidth < 768;
      const initialScale = isMobile ? 0.52 : 1.0;
      const r = baseR * initialScale;
      
      const angle = (index / data.length) * Math.PI * 2;
      const centerX = fallbackWidth / 2;
      const centerY = (canvasContainer.clientHeight || (isMobile ? 280 : 500)) / 2;
      const distance = 80;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      // Initialize dynamic bouncing dots inside the bubble representing projects count
      const numDots = bando.micro_projects.length;
      const dots = [];
      for (let i = 0; i < numDots; i++) {
        // Random relative angle and radius to keep dots inside
        const dotAngle = Math.random() * Math.PI * 2;
        const dotDist = Math.random() * (r - 8);
        const dotRadius = 1.0; // size of dot
        dots.push({
          projectIndex: i,
          x: Math.cos(dotAngle) * dotDist,
          y: Math.sin(dotAngle) * dotDist,
          vx: (Math.random() - 0.5) * 0.7,
          vy: (Math.random() - 0.5) * 0.7,
          r: dotRadius,
          visible: true
        });
      }
      
      bubbles.push({
        row: bando.row,
        color: bando.color,
        name: bando.name,
        shortName: abbreviateName(bando.name),
        budget: displayBudgetsMap[bando.row] || bando.budget_nominale,
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        originalRadius: baseR,
        baseRadius: r,
        radius: r,
        targetRadius: r,
        alpha: 1.0,
        targetAlpha: 1.0,
        filterScale: 1.0,
        isHovered: false,
        isDragged: false,
        dots: dots
      });
    });
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    function abbreviateName(name) {
      if (name.includes('cultura dietro l\'angolo')) return 'Cultura d\'Angolo';
      if (name.includes('Cavallerizza Reale')) return 'Cavallerizza';
      if (name.includes('CivICa')) return 'CivICa';
      if (name.includes('YEPP')) return 'YEPP';
      if (name.includes('Bando SPACE')) return 'Bando SPACE';
      if (name.includes('SPARKS')) return 'SPARKS';
      return name.substring(0, 15) + '...';
    }
    
    // Word wrapping helper for Canvas
    function wrapText(context, text, x, y, maxWidth, lineHeight) {
      const words = text.split(' ');
      let line = '';
      const lines = [];
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);
      
      const startY = y - ((lines.length - 1) * lineHeight) / 2;
      for (let i = 0; i < lines.length; i++) {
        context.fillText(lines[i].trim(), x, startY + i * lineHeight);
      }
    }
    
    // Physics Update loop
    function updatePhysics() {
      const centerX = width / 2;
      const centerY = height / 2;
      
      bubbles.forEach(b => {
        b.radius += (b.targetRadius - b.radius) * 0.1;
        b.alpha += (b.targetAlpha - b.alpha) * 0.1;
        
        if (b.isDragged) {
          b.x = mouse.x - dragOffset.x;
          b.y = mouse.y - dragOffset.y;
          b.vx = 0;
          b.vy = 0;
        } else {
          // Pull to center
          const dx = centerX - b.x;
          const dy = centerY - b.y;
          b.vx += dx * gravity * 0.05;
          b.vy += dy * gravity * 0.05;
          
          // Mouse repulsion
          const mdx = b.x - mouse.x;
          const mdy = b.y - mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < b.radius + 100) {
            const force = (1 - (mdist / (b.radius + 100))) * mouseRepulsion;
            b.vx += (mdx / mdist) * force * 1.2;
            b.vy += (mdy / mdist) * force * 1.2;
          }
          
          b.vx *= friction;
          b.vy *= friction;
          b.x += b.vx;
          b.y += b.vy;
        }
        
        // ----------------- Bouncing Dots Inside Bubble Physics -----------------
        const dotMargin = b.radius - 4; // limit boundary slightly inside bubble edge
        b.dots.forEach(dot => {
          dot.x += dot.vx;
          dot.y += dot.vy;
          
          // Distance relative to bubble center (0,0)
          const distFromCenter = Math.sqrt(dot.x*dot.x + dot.y*dot.y);
          const maxDist = dotMargin - dot.r;
          
          if (distFromCenter > maxDist) {
            // Collision normal pointing inside
            const nx = dot.x / distFromCenter;
            const ny = dot.y / distFromCenter;
            
            // Push back to boundary
            dot.x = nx * maxDist;
            dot.y = ny * maxDist;
            
            // Reflect velocity
            const dotProduct = dot.vx * nx + dot.vy * ny;
            dot.vx = dot.vx - 2 * dotProduct * nx;
            dot.vy = dot.vy - 2 * dotProduct * ny;
            
            // Small speed perturbation to keep animation dynamic
            dot.vx += (Math.random() - 0.5) * 0.1;
            dot.vy += (Math.random() - 0.5) * 0.1;
            
            // Speed limit inside bubble
            const speed = Math.sqrt(dot.vx*dot.vx + dot.vy*dot.vy);
            if (speed > 1.0) {
              dot.vx = (dot.vx / speed) * 1.0;
              dot.vy = (dot.vy / speed) * 1.0;
            }
          }
        });
      });
      
      // Elastic Circle-Circle collisions
      for (let i = 0; i < bubbles.length; i++) {
        for (let j = i + 1; j < bubbles.length; j++) {
          const b1 = bubbles[i];
          const b2 = bubbles[j];
          
          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = b1.radius + b2.radius;
          
          if (dist < minDist) {
            const overlap = minDist - dist;
            const nx = dist === 0 ? 1 : dx / dist;
            const ny = dist === 0 ? 0 : dy / dist;
            
            const w1 = b2.radius / (b1.radius + b2.radius);
            const w2 = b1.radius / (b1.radius + b2.radius);
            
            if (!b1.isDragged) {
              b1.x -= nx * overlap * w1;
              b1.y -= ny * overlap * w1;
            }
            if (!b2.isDragged) {
              b2.x += nx * overlap * w2;
              b2.y += ny * overlap * w2;
            }
            
            const kx = b1.vx - b2.vx;
            const ky = b1.vy - b2.vy;
            const p = 2 * (nx * kx + ny * ky) / 2;
            
            if (!b1.isDragged) {
              b1.vx -= nx * p * 0.7;
              b1.vy -= ny * p * 0.7;
            }
            if (!b2.isDragged) {
              b2.vx += nx * p * 0.7;
              b2.vy += ny * p * 0.7;
            }
          }
        }
      }
      
      // Calculate dynamic scale factor based on boundary overflow
      const targetScale = width < 768 ? 0.52 : 1.0;
      const minScale = width < 768 ? 0.35 : 0.65;
      
      let overflows = false;
      bubbles.forEach(b => {
        const padding = 2; // small padding
        if (b.x - b.radius < padding || b.x + b.radius > width - padding || 
            b.y - b.radius < padding || b.y + b.radius > height - padding) {
          overflows = true;
        }
      });
      
      if (overflows) {
        currentScale = Math.max(minScale, currentScale - 0.005);
      } else {
        currentScale = Math.min(targetScale, currentScale + 0.002);
      }
      
      // Update bubble radii based on the dynamic scale
      bubbles.forEach(b => {
        b.baseRadius = b.originalRadius * currentScale;
        
        let targetR = b.baseRadius * (b.filterScale || 1.0);
        if (b.isHovered) {
          targetR = targetR * 1.12;
        }
        b.targetRadius = targetR;
      });
      
      // Canvas Boundaries (Run last to guarantee no visual clipping at edges)
      bubbles.forEach(b => {
        const margin = b.radius + 3; // Keep bubble strictly inside canvas bounds (3px padding)
        if (b.x < margin) { b.x = margin; b.vx *= -0.5; }
        if (b.x > width - margin) { b.x = width - margin; b.vx *= -0.5; }
        if (b.y < margin) { b.y = margin; b.vy *= -0.5; }
        if (b.y > height - margin) { b.y = height - margin; b.vy *= -0.5; }
      });
    }
    
    // Draw loop
    function draw() {
      ctx.clearRect(0, 0, width, height);
      
      // Draw light-mode grid links
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.lineWidth = 1;
      for (let i = 0; i < bubbles.length; i++) {
        for (let j = i + 1; j < bubbles.length; j++) {
          const b1 = bubbles[i];
          const b2 = bubbles[j];
          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < b1.radius + b2.radius + 20) {
            ctx.moveTo(b1.x, b1.y);
            ctx.lineTo(b2.x, b2.y);
          }
        }
      }
      ctx.stroke();
      
      // Render bubbles
      bubbles.forEach(b => {
        ctx.save();
        ctx.globalAlpha = b.alpha;
        
        // Glow effect
        if (b.isHovered) {
          ctx.shadowColor = `#${b.color}`;
          ctx.shadowBlur = 12;
        }
        
        // Fill Bubble with high-visibility pastel color (85% opacity)
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${hexToRgb(b.color)}, ${b.isHovered ? 0.95 : 0.75})`;
        ctx.fill();
        
        // Bubble border
        ctx.lineWidth = b.isHovered ? 2.5 : 1.5;
        ctx.strokeStyle = `rgba(${hexToRgb(b.color)}, 1.0)`;
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        
        // ----------------- Draw Bouncing Dots Inside Bubble -----------------
        b.dots.forEach(dot => {
          if (!dot.visible) return;
          ctx.beginPath();
          ctx.arc(b.x + dot.x, b.y + dot.y, dot.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(18, 19, 22, 0.22)'; // Elegant soft contrast dots
          ctx.fill();
        });
        
        // Draw centered text
        ctx.fillStyle = '#121316'; 
        ctx.font = `600 ${b.radius > 80 ? '11.5px' : '10.5px'} 'Karla', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const textHeight = 13;
        const textY = b.y - 8;
        const maxTextWidth = b.radius * 1.5;
        wrapText(ctx, b.shortName, b.x, textY, maxTextWidth, textHeight);
        
        // Draw budget value (risorse complessive)
        ctx.fillStyle = 'rgba(18, 19, 22, 0.75)';
        ctx.font = `bold ${b.radius > 80 ? '11.5px' : '10px'} 'Karla', sans-serif`;
        ctx.fillText(b.budget, b.x, b.y + b.radius * 0.42);
        
        ctx.restore();
      });
    }
    
    function tick() {
      const containerWidth = canvasContainer.clientWidth;
      const containerHeight = canvasContainer.clientHeight;
      
      // Only trigger resize if container size has changed and is non-zero,
      // or if we currently have 0 size and the container has a non-zero size.
      if (containerWidth > 0 && containerHeight > 0 && 
          (width !== containerWidth || height !== containerHeight)) {
        resizeCanvas();
      }
      
      updatePhysics();
      draw();
      animationId = requestAnimationFrame(tick);
    }
    
    tick();
    
    // Mouse Pos helper
    function getMousePos(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }
    
    function checkHover(pos) {
      let found = null;
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        const dx = b.x - pos.x;
        const dy = b.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < b.radius) {
          found = b;
          break;
        }
      }
      
      bubbles.forEach(b => {
        if (b === found) {
          b.isHovered = true;
          b.targetRadius = b.baseRadius * 1.12; // expand 12%
          hoveredBubble = b;
        } else {
          b.isHovered = false;
          b.targetRadius = b.baseRadius;
        }
      });
      
      if (found) {
        canvas.style.cursor = draggedBubble ? 'grabbing' : 'pointer';
      } else {
        canvas.style.cursor = 'grab';
        hoveredBubble = null;
      }
    }
    
    let clickStartTime = 0;
    let clickStartPos = { x: 0, y: 0 };
    
    function onMouseMove(e) {
      const pos = getMousePos(e);
      mouse.x = pos.x;
      mouse.y = pos.y;
      
      if (draggedBubble) {
        draggedBubble.x = Math.max(draggedBubble.radius, Math.min(width - draggedBubble.radius, mouse.x - dragOffset.x));
        draggedBubble.y = Math.max(draggedBubble.radius, Math.min(height - draggedBubble.radius, mouse.y - dragOffset.y));
      } else {
        checkHover(pos);
      }
    }
    
    function onMouseDown(e) {
      if (e.button !== 0 && !e.touches) return;
      
      const pos = getMousePos(e);
      checkHover(pos);
      
      if (hoveredBubble) {
        draggedBubble = hoveredBubble;
        draggedBubble.isDragged = true;
        dragOffset.x = pos.x - draggedBubble.x;
        dragOffset.y = pos.y - draggedBubble.y;
        canvas.style.cursor = 'grabbing';
      }
      
      clickStartTime = Date.now();
      clickStartPos = pos;
    }
    
    function onMouseUp(e) {
      if (draggedBubble) {
        draggedBubble.isDragged = false;
        draggedBubble = null;
      }
      
      const pos = getMousePos(e);
      checkHover(pos);
      
      const clickDuration = Date.now() - clickStartTime;
      const dx = pos.x - clickStartPos.x;
      const dy = pos.y - clickStartPos.y;
      const moveDistance = Math.sqrt(dx * dx + dy * dy);
      
      if (hoveredBubble && clickDuration < 300 && moveDistance < 5) {
        const targetElement = document.getElementById(`macro-project-${hoveredBubble.row}`);
        if (targetElement) {
          // Open target accordion folder on click, scroll, and highlight
          targetElement.classList.add('expanded');
          targetElement.querySelector('.bando-summary-panel').setAttribute('aria-expanded', 'true');
          
          targetElement.style.transform = 'translateY(-4px)';
          targetElement.style.transition = 'transform 0.3s ease';
          
          const headerOffset = 90;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          
          setTimeout(() => {
            targetElement.style.transform = '';
          }, 600);
        }
      }
    }
    
    // Attach listeners
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    
    canvas.addEventListener('touchmove', (e) => {
      onMouseMove(e);
      if (draggedBubble) {
        e.preventDefault();
      }
    }, { passive: false });
    
    canvas.addEventListener('touchstart', (e) => {
      onMouseDown(e);
    }, { passive: true });
    
    canvas.addEventListener('touchend', (e) => {
      onMouseUp(e);
    }, { passive: true });
    
    // Expose control API
    window.bubbleSimulation = {
      filterMacros: (matchingRows, matchingProjectsMap) => {
        bubbles.forEach(b => {
          if (matchingRows.includes(b.row)) {
            b.targetAlpha = 1.0;
            b.filterScale = 1.0;
            
            // Update dots visibility inside matching bubble
            const matchData = matchingProjectsMap ? matchingProjectsMap[b.row] : null;
            if (matchData) {
              b.dots.forEach(dot => {
                dot.visible = matchData.matchingIndices.includes(dot.projectIndex);
              });
            } else {
              b.dots.forEach(dot => {
                dot.visible = true;
              });
            }
          } else {
            b.targetAlpha = 0.1;
            b.filterScale = 0.6;
            // Hide all dots if bubble itself is not matching
            b.dots.forEach(dot => {
              dot.visible = false;
            });
          }
        });
      },
      resetFilter: () => {
        bubbles.forEach(b => {
          b.targetAlpha = 1.0;
          b.filterScale = 1.0;
          b.dots.forEach(dot => {
            dot.visible = true;
          });
        });
      }
    };
  }
});
