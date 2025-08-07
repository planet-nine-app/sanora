(function(window) {
  'use strict';

  // Global state for date/time events
  window.dateTimes = [];
  let eventCounter = 0;

  // Utility functions for date/time handling
  function formatDateInput(value) {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    // Add slashes as user types
    if (numbers.length >= 2) {
      return numbers.slice(0, 2) + '/' + 
             (numbers.length >= 4 ? numbers.slice(2, 4) + '/' + numbers.slice(4, 8) : numbers.slice(2));
    }
    return numbers;
  }

  function formatTimeInput(value) {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    // Add colon as user types
    if (numbers.length >= 2) {
      return numbers.slice(0, 2) + ':' + numbers.slice(2, 4);
    }
    return numbers;
  }

  function parseDate(dateStr) {
    if (!dateStr || dateStr.length < 8) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    
    const month = parseInt(parts[0]) - 1; // JS months are 0-indexed
    const day = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    
    return new Date(year, month, day);
  }

  function parseTime(timeStr, ampm) {
    if (!timeStr || timeStr.length < 4) return { hours: 0, minutes: 0 };
    const parts = timeStr.split(':');
    if (parts.length !== 2) return { hours: 0, minutes: 0 };
    
    let hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    
    return { hours, minutes };
  }

  function addHours(date, hours) {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + hours);
    return newDate;
  }

  function formatDisplayTime(date) {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  function createDateTimeSection(containerId, isFirst = false) {
    const sectionId = `datetime-section-${eventCounter++}`;
    const section = document.createElement('div');
    section.className = 'datetime-section';
    section.id = sectionId;
    
    section.innerHTML = `
      <div class="datetime-grid">
        <div class="datetime-field">
          <label class="datetime-label">Start Date</label>
          <input type="text" class="time-input date-input" placeholder="MM/DD/YYYY" maxlength="10" data-field="startDate">
        </div>
        <div class="datetime-field">
          <label class="datetime-label">Start Time</label>
          <div class="time-input-container">
            <input type="text" class="time-input time-input-field" placeholder="HH:MM" maxlength="5" data-field="startTime">
            <div class="ampm-selector">
              <button type="button" class="ampm-btn active" data-ampm="AM">AM</button>
              <button type="button" class="ampm-btn" data-ampm="PM">PM</button>
            </div>
          </div>
        </div>
        <div class="datetime-field">
          <label class="datetime-label">End Date</label>
          <input type="text" class="time-input date-input" placeholder="MM/DD/YYYY" maxlength="10" data-field="endDate">
        </div>
        <div class="datetime-field">
          <label class="datetime-label">End Time</label>
          <div class="time-input-container">
            <input type="text" class="time-input time-input-field" placeholder="HH:MM" maxlength="5" data-field="endTime">
            <div class="ampm-selector">
              <button type="button" class="ampm-btn active" data-ampm="AM">AM</button>
              <button type="button" class="ampm-btn" data-ampm="PM">PM</button>
            </div>
          </div>
        </div>
      </div>
      <button type="button" class="add-event-btn">Add Event</button>
    `;

    // Add event handlers
    setupDateTimeHandlers(section);
    
    const container = document.getElementById(containerId);
    container.appendChild(section);
    
    return sectionId;
  }

  function setupDateTimeHandlers(section) {
    const inputs = section.querySelectorAll('.time-input');
    const addBtn = section.querySelector('.add-event-btn');
    
    // Date input formatting
    section.querySelectorAll('.date-input').forEach(input => {
      input.addEventListener('input', function(e) {
        const formatted = formatDateInput(e.target.value);
        e.target.value = formatted;
        updateInputState(e.target);
        handleDateLogic(section);
        checkSectionComplete(section);
      });
      
      // Mobile: use numeric keyboard
      if ('ontouchstart' in window) {
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('pattern', '[0-9]*');
      }
    });

    // Time input formatting
    section.querySelectorAll('.time-input-field').forEach(input => {
      input.addEventListener('input', function(e) {
        const formatted = formatTimeInput(e.target.value);
        e.target.value = formatted;
        updateInputState(e.target);
        handleTimeLogic(section);
        checkSectionComplete(section);
      });
      
      // Mobile: use numeric keyboard
      if ('ontouchstart' in window) {
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('pattern', '[0-9]*');
      }
      
      // Handle A/P key presses for AM/PM
      input.addEventListener('keydown', function(e) {
        const container = e.target.closest('.time-input-container');
        const ampmBtns = container.querySelectorAll('.ampm-btn');
        
        if (e.key.toLowerCase() === 'a') {
          e.preventDefault();
          ampmBtns.forEach(btn => btn.classList.remove('active'));
          container.querySelector('[data-ampm="AM"]').classList.add('active');
          checkSectionComplete(section);
        } else if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          ampmBtns.forEach(btn => btn.classList.remove('active'));
          container.querySelector('[data-ampm="PM"]').classList.add('active');
          checkSectionComplete(section);
        }
      });
    });

    // AM/PM button handlers
    section.querySelectorAll('.ampm-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const container = this.closest('.time-input-container');
        container.querySelectorAll('.ampm-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        checkSectionComplete(section);
      });
    });

    // Add event button
    addBtn.addEventListener('click', function() {
      const eventData = collectEventData(section);
      if (eventData) {
        window.dateTimes.push(eventData);
        updateEventsDisplay();
        createDateTimeSection(containerId);
      }
    });
  }

  function updateInputState(input) {
    if (input.value.trim()) {
      input.classList.add('has-value');
    } else {
      input.classList.remove('has-value');
    }
  }

  function handleDateLogic(section) {
    const startDateInput = section.querySelector('[data-field="startDate"]');
    const endDateInput = section.querySelector('[data-field="endDate"]');
    
    // If start date is filled and end date is empty, copy start date to end date
    if (startDateInput.value.length === 10 && !endDateInput.value) {
      endDateInput.value = startDateInput.value;
      updateInputState(endDateInput);
    }
  }

  function handleTimeLogic(section) {
    const startTimeInput = section.querySelector('[data-field="startTime"]');
    const endTimeInput = section.querySelector('[data-field="endTime"]');
    const startDateInput = section.querySelector('[data-field="startDate"]');
    const endDateInput = section.querySelector('[data-field="endDate"]');
    
    // If start time is filled and end time is empty, set end time to 2 hours later
    if (startTimeInput.value.length === 5 && !endTimeInput.value && startDateInput.value.length === 10) {
      const startDate = parseDate(startDateInput.value);
      if (startDate) {
        const startAmPm = section.querySelector('[data-field="startTime"]').closest('.time-input-container').querySelector('.ampm-btn.active').dataset.ampm;
        const startTimeObj = parseTime(startTimeInput.value, startAmPm);
        
        startDate.setHours(startTimeObj.hours, startTimeObj.minutes);
        const endDateTime = addHours(startDate, 2);
        
        // Update end date if it changed
        const endDateStr = `${String(endDateTime.getMonth() + 1).padStart(2, '0')}/${String(endDateTime.getDate()).padStart(2, '0')}/${endDateTime.getFullYear()}`;
        if (endDateInput.value !== endDateStr) {
          endDateInput.value = endDateStr;
          updateInputState(endDateInput);
        }
        
        // Set end time
        const endHours = endDateTime.getHours();
        const endMinutes = endDateTime.getMinutes();
        const endAmPm = endHours >= 12 ? 'PM' : 'AM';
        const displayHours = endHours === 0 ? 12 : (endHours > 12 ? endHours - 12 : endHours);
        
        endTimeInput.value = `${String(displayHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
        updateInputState(endTimeInput);
        
        // Set AM/PM
        const endAmPmContainer = endTimeInput.closest('.time-input-container');
        endAmPmContainer.querySelectorAll('.ampm-btn').forEach(btn => btn.classList.remove('active'));
        endAmPmContainer.querySelector(`[data-ampm="${endAmPm}"]`).classList.add('active');
      }
    }
  }

  function checkSectionComplete(section) {
    const inputs = section.querySelectorAll('.time-input');
    const allFilled = Array.from(inputs).every(input => input.value.trim());
    const addBtn = section.querySelector('.add-event-btn');
    
    if (allFilled) {
      section.classList.add('complete');
      addBtn.classList.add('visible');
    } else {
      section.classList.remove('complete');
      addBtn.classList.remove('visible');
    }
  }

  function collectEventData(section) {
    const startDateInput = section.querySelector('[data-field="startDate"]');
    const endDateInput = section.querySelector('[data-field="endDate"]');
    const startTimeInput = section.querySelector('[data-field="startTime"]');
    const endTimeInput = section.querySelector('[data-field="endTime"]');
    
    const startAmPm = startTimeInput.closest('.time-input-container').querySelector('.ampm-btn.active').dataset.ampm;
    const endAmPm = endTimeInput.closest('.time-input-container').querySelector('.ampm-btn.active').dataset.ampm;
    
    const startDate = parseDate(startDateInput.value);
    const endDate = parseDate(endDateInput.value);
    
    if (!startDate || !endDate) return null;
    
    const startTime = parseTime(startTimeInput.value, startAmPm);
    const endTime = parseTime(endTimeInput.value, endAmPm);
    
    startDate.setHours(startTime.hours, startTime.minutes);
    endDate.setHours(endTime.hours, endTime.minutes);
    
    return {
      startTime: startDate.getTime(),
      endTime: endDate.getTime()
    };
  }

  function updateEventsDisplay() {
    const summaryDiv = document.getElementById('events-summary');
    const listDiv = document.getElementById('events-list');
    
    if (window.dateTimes.length === 0) {
      if (summaryDiv) summaryDiv.style.display = 'none';
      return;
    }
    
    if (summaryDiv) {
      summaryDiv.style.display = 'block';
      if (listDiv) {
        listDiv.innerHTML = window.dateTimes.map((event, index) => `
          <div class="event-item">
            <strong>Event ${index + 1}:</strong><br>
            ${formatDisplayTime(new Date(event.startTime))} → ${formatDisplayTime(new Date(event.endTime))}
          </div>
        `).join('');
      }
    }
  }

  // Traditional form functions (original widget)
  function calculateTextBlockHeight(text, width = 340, fontSize = 14, lineHeight = 1.4) {
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.width = `${width}px`;
    temp.style.fontSize = `${fontSize}px`;
    temp.style.lineHeight = `${lineHeight}`;
    temp.style.fontFamily = 'Arial, sans-serif';
    temp.style.padding = '12px';
    temp.innerHTML = text;
    
    document.body.appendChild(temp);
    const height = temp.offsetHeight;
    document.body.removeChild(temp);
    
    return height;
  }

  function calculateTextAreaHeight(charLimit = 500) {
    // Calculate height based on character limit
    // Roughly 80 characters per line, 20px per line, with padding
    const estimatedLines = Math.max(3, Math.ceil(charLimit / 80));
    return Math.min(estimatedLines * 20 + 40, 120); // Cap at 120px for UI
  }

  function calculateImageInputHeight() {
    return 120; // Fixed height for image upload area
  }
  function calculateArtifactInputHeight() {
    return 140; // Fixed height for artifact upload area (slightly larger)
  }

  function calculateFormHeight(formConfig) {
    const fields = Object.keys(formConfig).filter(key => key !== 'form');
    const headerHeight = 85;           
    const standardFieldHeight = 70;
    const submitButtonHeight = 45;     
    const bottomPadding = 30;
    
    let totalHeight = headerHeight;
    
    fields.forEach(key => {
      const fieldConfig = formConfig[key];
      
      if (fieldConfig.type === 'text-block') {
        const textHeight = calculateTextBlockHeight(fieldConfig.content || fieldConfig.text);
        totalHeight += textHeight + 20;
      } else if (fieldConfig.type === 'datetime') {
        totalHeight += 200; // Approximate height for datetime widget
      } else if (fieldConfig.type === 'textarea') {
        const charLimit = fieldConfig.charLimit || 500;
        const textareaHeight = calculateTextAreaHeight(charLimit);
        totalHeight += textareaHeight + 50; // Label + textarea + padding
      } else if (fieldConfig.type === 'image') {
        const imageHeight = calculateImageInputHeight();
        totalHeight += imageHeight + 50; // Label + image area + padding
      } else if (fieldConfig.type === 'artifact') {
        const artifactHeight = calculateArtifactInputHeight();
        totalHeight += artifactHeight + 50; // Label + artifact area + padding
      } else {
        totalHeight += standardFieldHeight;
      }
    });
    
    return totalHeight + submitButtonHeight + bottomPadding;
  }

  function getBackgroundAndGradients(formConfig) {
    const dynamicHeight = calculateFormHeight(formConfig);

    return `<rect width="500" height="${dynamicHeight}" fill="transparent"/>
    
    <!-- Form Container with Metallic Background -->
    <linearGradient id="metallicBackground" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2a2a2e"/>
      <stop offset="50%" stop-color="#323236"/>
      <stop offset="100%" stop-color="#2a2a2e"/>
    </linearGradient>
    <rect x="50" y="50" width="400" height="${dynamicHeight}" rx="15" fill="url(#metallicBackground)" 
      stroke="#444" stroke-width="1"/>
    
    <!-- Subtle Metallic Highlight -->
    <line x1="51" y1="52" x2="449" y2="52" stroke="#555" stroke-width="1" opacity="0.5"/>
    
    <!-- Form Header -->
    <text x="250" y="85" font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
      fill="#ffffff" text-anchor="middle">CONTACT FORM</text>
    
    <!-- Define the gradient for active input borders -->
    <linearGradient id="inputGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="purple"/>
      <stop offset="100%" stop-color="green"/>
    </linearGradient>
    
    <!-- Button Gradient -->
    <linearGradient id="buttonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop id="submitButtonGradientStart" offset="0%" stop-color="green"/>
      <stop id="submitButtonGradientEnd" offset="100%" stop-color="purple"/>
    </linearGradient>`;
  }

  function getInput(x, y, text, inputType) {
    const borderId = `${text.replace(/\s+/g, '')}Border`;
    const inputId = `${text.replace(/\s+/g, '')}Input`;

    return `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="14" fill="#bbbbbb">${text}</text>
      <!-- Field Background -->
      <rect id="${borderId}" x="${x}" y="${y + 10}" width="640" height="40" rx="8" fill="#1c1c20" 
            stroke="#444" stroke-width="2" class="input-field"/>
      <!-- HTML Input Field -->
      <foreignObject x="${x + 5}" y="${y + 15}" width="630" height="30">
        <input xmlns="http://www.w3.org/1999/xhtml" id="${inputId}" type="text" placeholder="Enter ${text.toLowerCase()}" data-field="${text}" spellcheck="false" style="width:100%; height: 100%; background-color: transparent; color: white; border: none; outline: none; padding: 8px 12px; font-size: 14px; font-family: Arial, sans-serif; border-radius: 6px;"/>
      </foreignObject>`;
  }

  function getTextArea(x, y, text, fieldConfig) {
    const borderId = `${text.replace(/\s+/g, '')}Border`;
    const textareaId = `${text.replace(/\s+/g, '')}Textarea`;
    const counterId = `${text.replace(/\s+/g, '')}Counter`;
    const charLimit = fieldConfig.charLimit || 500;
    const textareaHeight = calculateTextAreaHeight(charLimit);

    return `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="14" fill="#bbbbbb">${text}</text>
      <!-- Character Counter -->
      <text x="${x + 640}" y="${y}" font-family="Arial, sans-serif" font-size="12" fill="#888" text-anchor="end" id="${counterId}">0/${charLimit}</text>
      <!-- TextArea Background -->
      <rect id="${borderId}" x="${x}" y="${y + 10}" width="640" height="${textareaHeight}" rx="8" fill="#1c1c20" 
            stroke="#444" stroke-width="2" class="input-field"/>
      <!-- HTML TextArea Field -->
      <foreignObject x="${x + 5}" y="${y + 15}" width="630" height="${textareaHeight - 10}">
        <textarea xmlns="http://www.w3.org/1999/xhtml" id="${textareaId}" placeholder="Enter ${text.toLowerCase()}" data-field="${text}" maxlength="${charLimit}" spellcheck="false" style="width:100%; height: 100%; background-color: transparent; color: white; border: none; outline: none; padding: 8px 12px; font-size: 14px; font-family: Arial, sans-serif; border-radius: 6px; resize: none;"></textarea>
      </foreignObject>`;
  }

  function getImageInput(x, y, text, fieldConfig) {
    const borderId = `${text.replace(/\s+/g, '')}Border`;
    const containerId = `${text.replace(/\s+/g, '')}ImageContainer`;
    const inputId = `${text.replace(/\s+/g, '')}ImageInput`;
    const previewId = `${text.replace(/\s+/g, '')}ImagePreview`;
    const statusId = `${text.replace(/\s+/g, '')}ImageStatus`;
    const imageHeight = calculateImageInputHeight();

    return `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="14" fill="#bbbbbb">${text}</text>
      <!-- Image Upload Background -->
      <rect id="${borderId}" x="${x}" y="${y + 10}" width="640" height="${imageHeight}" rx="8" fill="#1c1c20" 
            stroke="#444" stroke-width="2" stroke-dasharray="5,5" class="input-field image-dropzone"/>
      <!-- HTML Image Upload Container -->
      <foreignObject x="${x + 5}" y="${y + 15}" width="630" height="${imageHeight - 10}">
        <div xmlns="http://www.w3.org/1999/xhtml" id="${containerId}" class="image-upload-container" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; box-sizing: border-box;">
          <input type="file" id="${inputId}" accept="image/*" data-field="${text}" style="position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 2; top: 0; left: 0;"/>
          <div id="${previewId}" style="width: 100%; height: 100%; display: none; background-size: cover; background-position: center; border-radius: 6px; position: absolute; top: 0; left: 0;">
            <div style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; font-size: 16px;" onclick="clearImage('${text}')">&times;</div>
          </div>
          <div id="${statusId}" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #888; font-size: 14px; pointer-events: none; z-index: 1; height: 100%; width: 100%;">
            <div style="font-size: 24px; margin-bottom: 8px;">📷</div>
            <div style="margin-bottom: 4px;">Drag &amp; drop or click to upload</div>
            <div style="font-size: 12px;">JPG, PNG, GIF (max 5MB)</div>
          </div>
        </div>
      </foreignObject>`;
  }

  function getArtifactInput(x, y, text, fieldConfig) {
    const borderId = `${text.replace(/\s+/g, '')}ArtifactBorder`;
    const containerId = `${text.replace(/\s+/g, '')}ArtifactContainer`;
    const inputId = `${text.replace(/\s+/g, '')}ArtifactInput`;
    const previewId = `${text.replace(/\s+/g, '')}ArtifactPreview`;
    const statusId = `${text.replace(/\s+/g, '')}ArtifactStatus`;
    const artifactHeight = calculateArtifactInputHeight();
    return `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="14" fill="#bbbbbb">${text}</text>
      <!-- Artifact Upload Background -->
      <rect id="${borderId}" x="${x}" y="${y + 10}" width="640" height="${artifactHeight}" rx="8" fill="#1c1c20" 
            stroke="#444" stroke-width="2" stroke-dasharray="5,5" class="input-field artifact-dropzone"/>
      <!-- HTML Artifact Upload Container -->
      <foreignObject x="${x + 5}" y="${y + 15}" width="630" height="${artifactHeight - 10}">
        <div xmlns="http://www.w3.org/1999/xhtml" id="${containerId}" class="artifact-upload-container" style="width:100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
          <input type="file" id="${inputId}" accept=".pdf,.epub,.mobi,.zip,.mp3,.mp4,.exe,.txt,.doc,.docx" data-field="${text}" style="position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 2;"/>
          <div id="${previewId}" style="width: 100%; height: 100%; display: none; border: 2px solid #4CAF50; border-radius: 6px; padding: 15px; background: #f8f9fa; position: relative; align-items: center; justify-content: center;">
            <div style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; font-size: 16px;" onclick="clearArtifact('${text}')">&times;</div>
            <div style="text-align: center; font-size: 14px; color: #333;"><strong>File uploaded:</strong><br><span id="${previewId}Name"></span><br><small id="${previewId}Size" style="color: #666;"></small></div>
          </div>
          <div id="${statusId}" style="text-align: center; color: #888; font-size: 14px; pointer-events: none; z-index: 1;">
            <div style="font-size: 24px; margin-bottom: 8px;">📦</div>
            <div>Drag &amp; drop or click to upload</div>
            <div style="font-size: 12px; margin-top: 4px;">PDF, EPUB, ZIP, MP3, MP4, EXE, TXT, DOC</div>
            <div style="font-size: 11px; margin-top: 2px; color: #aaa;">(max 100MB)</div>
          </div>
        </div>
      </foreignObject>`;
  }

  function getDateTimeWidget(x, y, text) {
    const widgetId = `${text.replace(/\s+/g, '')}Widget`;
    
    return `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="14" fill="#bbbbbb">${text}</text>
      <foreignObject x="${x}" y="${y + 10}" width="640" height="180">
        <div xmlns="http://www.w3.org/1999/xhtml" id="${widgetId}" class="datetime-widget-container" style="width: 100%; height: 100%;"></div>
      </foreignObject>`;
  }

  function getSubmitButton(x, y) {
    return `<rect id="submitButton" x="${x}" y="${y}" width="620" height="45" rx="22.5" fill="#666666" style="cursor: not-allowed;">
        </rect>
        <text x="${x + 310}" y="${y + 28}" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#999999" text-anchor="middle" dominant-baseline="middle" style="pointer-events: none;">SUBMIT</text>
    `;
  }

  function getForm(formJSON, onSubmit) {
    const keys = Object.keys(formJSON);
    let currentY = 130;
    const inputs = [];
    
    keys.forEach((key, index) => {
      if (key === "form") return;
      
      const fieldConfig = formJSON[key];
      if (fieldConfig.type === 'datetime') {
        inputs.push(getDateTimeWidget(80, currentY, key));
        currentY += 200;
      } else if (fieldConfig.type === 'textarea') {
        inputs.push(getTextArea(80, currentY, key, fieldConfig));
        const charLimit = fieldConfig.charLimit || 500;
        const textareaHeight = calculateTextAreaHeight(charLimit);
        currentY += textareaHeight + 50;
      } else if (fieldConfig.type === 'image') {
        inputs.push(getImageInput(80, currentY, key, fieldConfig));
        const imageHeight = calculateImageInputHeight();
        currentY += imageHeight + 50;
      } else if (fieldConfig.type === 'artifact') {
        inputs.push(getArtifactInput(80, currentY, key, fieldConfig));
        const artifactHeight = calculateArtifactInputHeight();
        currentY += artifactHeight + 50;
      } else {
        inputs.push(getInput(80, currentY, key, fieldConfig.type));
        currentY += 70;
      }
    });
    
    inputs.push(getSubmitButton(100, currentY + 20));
    
    const svg = getBackgroundAndGradients(formJSON) + inputs.join('');
    const dynamicHeight = calculateFormHeight(formJSON);

    const container = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    container.setAttribute('viewBox', `0 0 800 ${dynamicHeight + 100}`);
    container.setAttribute('width', '100%');
    container.setAttribute('height', `${dynamicHeight + 100}px`);
    container.innerHTML = svg;

    setTimeout(() => {
      Object.keys(formJSON).forEach((key) => {
        if(key === 'form') return;
        
        const fieldConfig = formJSON[key];
        
        if (fieldConfig.type === 'datetime') {
          const widgetId = `${key.replace(/\s+/g, '')}Widget`;
          const widgetContainer = document.getElementById(widgetId);
          if (widgetContainer) {
            createDateTimeSection(widgetId);
          }
        } else if (fieldConfig.type === 'textarea') {
          const textareaId = `${key.replace(/\s+/g, '')}Textarea`;
          const counterId = `${key.replace(/\s+/g, '')}Counter`;
          const borderId = `${key.replace(/\s+/g, '')}Border`;
          const textareaElement = document.getElementById(textareaId);
          const counterElement = document.getElementById(counterId);
          const borderElement = document.getElementById(borderId);
          const charLimit = fieldConfig.charLimit || 500;
          
          if (textareaElement && counterElement) {
            textareaElement.addEventListener('input', (evt) => {
              const currentLength = evt.target.value.length;
              counterElement.textContent = `${currentLength}/${charLimit}`;
              
              // Update border color when typing
              if (borderElement) {
                borderElement.setAttribute('stroke', 'url(#inputGradient)');
              }
              
              // Change counter color if approaching limit
              if (currentLength > charLimit * 0.9) {
                counterElement.setAttribute('fill', '#ff6b6b');
              } else if (currentLength > charLimit * 0.75) {
                counterElement.setAttribute('fill', '#ffa726');
              } else {
                counterElement.setAttribute('fill', '#888');
              }
            });
          }
        } else if (fieldConfig.type === 'image') {
          setupImageInput(key);
        } else if (fieldConfig.type === 'artifact') {
          setupArtifactInput(key);
        } else {
          const inputId = `${key.replace(/\s+/g, '')}Input`;
          const inputElement = document.getElementById(inputId);
          
          if (inputElement) {
            inputElement.addEventListener('input', (evt) => {
              const borderId = `${key.replace(/\s+/g, '')}Border`;
              const borderElement = document.getElementById(borderId);
              if (borderElement) {
                borderElement.setAttribute('stroke', 'url(#inputGradient)');
              }
            });
          }
        }
      });
    }, 100);

    return container;
  }

  // Export functions
  window.getForm = getForm;
  window.createDateTimeSection = createDateTimeSection;

  // Image upload utility functions
  function setupImageInput(fieldKey) {
    const inputId = `${fieldKey.replace(/\s+/g, '')}ImageInput`;
    const containerId = `${fieldKey.replace(/\s+/g, '')}ImageContainer`;
    const previewId = `${fieldKey.replace(/\s+/g, '')}ImagePreview`;
    const statusId = `${fieldKey.replace(/\s+/g, '')}ImageStatus`;
    const borderId = `${fieldKey.replace(/\s+/g, '')}Border`;
    
    const inputElement = document.getElementById(inputId);
    const containerElement = document.getElementById(containerId);
    const previewElement = document.getElementById(previewId);
    const statusElement = document.getElementById(statusId);
    const borderElement = document.getElementById(borderId);
    
    if (!inputElement || !containerElement) return;
    
    // File input change handler
    inputElement.addEventListener('change', (e) => {
      handleImageFile(e.target.files[0], fieldKey);
    });
    
    // Drag and drop handlers
    containerElement.addEventListener('dragover', (e) => {
      e.preventDefault();
      borderElement.setAttribute('stroke', 'url(#inputGradient)');
      borderElement.setAttribute('stroke-dasharray', '3,3');
    });
    
    containerElement.addEventListener('dragleave', (e) => {
      e.preventDefault();
      borderElement.setAttribute('stroke', '#444');
      borderElement.setAttribute('stroke-dasharray', '5,5');
    });
    
    containerElement.addEventListener('drop', (e) => {
      e.preventDefault();
      borderElement.setAttribute('stroke', '#444');
      borderElement.setAttribute('stroke-dasharray', '5,5');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleImageFile(files[0], fieldKey);
      }
    });
  }
  
  function handleImageFile(file, fieldKey) {
    const previewId = `${fieldKey.replace(/\s+/g, '')}ImagePreview`;
    const statusId = `${fieldKey.replace(/\s+/g, '')}ImageStatus`;
    const borderId = `${fieldKey.replace(/\s+/g, '')}Border`;
    
    const previewElement = document.getElementById(previewId);
    const statusElement = document.getElementById(statusId);
    const borderElement = document.getElementById(borderId);
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, GIF)');
      return;
    }
    
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }
    
    // Read and display the image
    const reader = new FileReader();
    reader.onload = (e) => {
      previewElement.style.backgroundImage = `url(${e.target.result})`;
      previewElement.style.display = 'block';
      statusElement.style.display = 'none';
      borderElement.setAttribute('stroke', 'url(#inputGradient)');
      borderElement.setAttribute('stroke-dasharray', 'none');
      
      // Store image data for form submission
      if (!window.formImageData) window.formImageData = {};
      window.formImageData[fieldKey] = {
        file: file,
        dataUrl: e.target.result,
        name: file.name,
        size: file.size,
        type: file.type
      };
    };
    reader.readAsDataURL(file);
  }
  
  window.clearImage = function(fieldKey) {
    const previewId = `${fieldKey.replace(/\s+/g, '')}ImagePreview`;
    const statusId = `${fieldKey.replace(/\s+/g, '')}ImageStatus`;
    const borderId = `${fieldKey.replace(/\s+/g, '')}Border`;
    const inputId = `${fieldKey.replace(/\s+/g, '')}ImageInput`;
    
    const previewElement = document.getElementById(previewId);
    const statusElement = document.getElementById(statusId);
    const borderElement = document.getElementById(borderId);
    const inputElement = document.getElementById(inputId);
    
    if (previewElement) {
      previewElement.style.display = 'none';
      previewElement.style.backgroundImage = '';
    }
    
    if (statusElement) {
      statusElement.style.display = 'block';
    }
    
    if (borderElement) {
      borderElement.setAttribute('stroke', '#444');
      borderElement.setAttribute('stroke-dasharray', '5,5');
    }
    
    if (inputElement) {
      inputElement.value = '';
    }
    
    // Remove from stored data
    if (window.formImageData && window.formImageData[fieldKey]) {
      delete window.formImageData[fieldKey];
    }
  };

  // Artifact upload utility functions
  function setupArtifactInput(fieldKey) {
    const inputId = `${fieldKey.replace(/\s+/g, '')}ArtifactInput`;
    const containerId = `${fieldKey.replace(/\s+/g, '')}ArtifactContainer`;
    const previewId = `${fieldKey.replace(/\s+/g, '')}ArtifactPreview`;
    const statusId = `${fieldKey.replace(/\s+/g, '')}ArtifactStatus`;
    const borderId = `${fieldKey.replace(/\s+/g, '')}ArtifactBorder`;
    
    const inputElement = document.getElementById(inputId);
    const containerElement = document.getElementById(containerId);
    const previewElement = document.getElementById(previewId);
    const statusElement = document.getElementById(statusId);
    const borderElement = document.getElementById(borderId);
    
    if (!inputElement) return;
    
    // Handle file selection
    inputElement.addEventListener('change', (e) => {
      const file = e.target.files[0];
      handleArtifactUpload(file, fieldKey, previewElement, statusElement, borderElement);
    });
    
    // Handle drag and drop
    if (containerElement) {
      containerElement.addEventListener('dragover', (e) => {
        e.preventDefault();
        borderElement.setAttribute('stroke', 'url(#inputGradient)');
      });
      
      containerElement.addEventListener('dragleave', (e) => {
        e.preventDefault();
        if (!window.formArtifactData || !window.formArtifactData[fieldKey]) {
          borderElement.setAttribute('stroke', '#444');
        }
      });
      
      containerElement.addEventListener('drop', (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        handleArtifactUpload(file, fieldKey, previewElement, statusElement, borderElement);
      });
    }
  }

  function handleArtifactUpload(file, fieldKey, previewElement, statusElement, borderElement) {
    if (!file) return;
    
    // Validate file type (allow most digital goods formats)
    const allowedTypes = [
      'application/pdf',
      'application/epub+zip',
      'application/x-mobipocket-ebook',
      'application/zip',
      'audio/mpeg',
      'audio/mp3',
      'video/mp4',
      'application/octet-stream',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const allowedExtensions = ['.pdf', '.epub', '.mobi', '.zip', '.mp3', '.mp4', '.exe', '.txt', '.doc', '.docx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      alert('Please select a supported file type (PDF, EPUB, ZIP, MP3, MP4, EXE, TXT, DOC, etc.)');
      return;
    }
    
    // Validate file size (100MB limit for artifacts)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      alert('File size must be less than 100MB');
      return;
    }
    
    // Show file preview
    const previewNameElement = document.getElementById(previewElement.id + 'Name');
    const previewSizeElement = document.getElementById(previewElement.id + 'Size');
    
    if (previewNameElement) previewNameElement.textContent = file.name;
    if (previewSizeElement) previewSizeElement.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
    
    previewElement.style.display = 'flex';
    statusElement.style.display = 'none';
    borderElement.setAttribute('stroke', 'url(#inputGradient)');
    borderElement.setAttribute('stroke-dasharray', 'none');
    
    // Store artifact data for form submission
    if (!window.formArtifactData) window.formArtifactData = {};
    window.formArtifactData[fieldKey] = {
      file: file,
      name: file.name,
      size: file.size,
      type: file.type
    };
  }

  // Global function to clear artifact uploads
  window.clearArtifact = function(fieldKey) {
    const previewId = `${fieldKey.replace(/\s+/g, '')}ArtifactPreview`;
    const statusId = `${fieldKey.replace(/\s+/g, '')}ArtifactStatus`;
    const borderId = `${fieldKey.replace(/\s+/g, '')}ArtifactBorder`;
    const inputId = `${fieldKey.replace(/\s+/g, '')}ArtifactInput`;
    
    const previewElement = document.getElementById(previewId);
    const statusElement = document.getElementById(statusId);
    const borderElement = document.getElementById(borderId);
    const inputElement = document.getElementById(inputId);
    
    if (previewElement) previewElement.style.display = 'none';
    if (statusElement) statusElement.style.display = 'block';
    if (borderElement) {
      borderElement.setAttribute('stroke', '#444');
      borderElement.setAttribute('stroke-dasharray', '5,5');
    }
    if (inputElement) inputElement.value = '';
    
    // Clear stored data
    if (window.formArtifactData && window.formArtifactData[fieldKey]) {
      delete window.formArtifactData[fieldKey];
    }
  };

})(window);
