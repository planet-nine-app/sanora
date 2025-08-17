(function(window) {
    'use strict';

    function calculateTextBlockHeight(text, width = 340, fontSize = 14, lineHeight = 1.4) {
      // Create a temporary element to measure text height
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
    };

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
	  // Calculate dynamic height for text blocks
	  const textHeight = calculateTextBlockHeight(fieldConfig.content || fieldConfig.text);
	  totalHeight += textHeight + 20; // Add some spacing
	} else {
	  // Standard field height for inputs and selectors
	  totalHeight += standardFieldHeight;
	}
      });
      
      return totalHeight + submitButtonHeight + bottomPadding;
    }

    function getBackgroundAndGradients(formConfig) {
      const dynamicHeight = calculateFormHeight(formConfig);

      const svg = `<rect width="500" height="${dynamicHeight}" fill="transparent"/>
      
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
	fill="#ffffff" text-anchor="middle">RECOVERY KEY</text>
      
      <!-- Define the gradient for active input borders -->
      <linearGradient id="inputGradient" x1="0%" y1="0%" x2="100%" y2="0%">
	<stop offset="0%" stop-color="purple"/>
	<stop offset="100%" stop-color="green"/>
      </linearGradient>
      
      <!-- Button Gradient -->
      <linearGradient id="buttonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
	<stop id="submitButtonGradientStart" offset="0%" stop-color="green"/>
	<stop id="submitButtonGradientEnd" offset="100%" stop-color="purple"/>
      </linearGradient>

      <linearGradient id="buttonPressedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
	<stop offset="0%" stop-color="purple"/>
	<stop offset="100%" stop-color="green"/>
      </linearGradient>`;

      return svg;
    }

    function getSegmentedSelector(x, y, text, options) {
      const borderId = `${text.replace(/\s+/g, '')}Border`;
      const selectorId = `${text.replace(/\s+/g, '')}Selector`;
      
      const segmentWidth = 340 / options.length;
      
      let segments = '';
      let segmentTexts = '';
      
      options.forEach((option, index) => {
        const segmentX = x + (index * segmentWidth);
        const segmentId = `${selectorId}_${index}`;
        
        segments += `<rect id="${segmentId}" x="${segmentX}" y="${y + 10}" width="${segmentWidth}" height="40" rx="${index === 0 ? '8 0 0 8' : index === options.length - 1 ? '0 8 8 0' : '0'}" fill="#1c1c20" stroke="#444" stroke-width="1" style="cursor: pointer;" data-option="${option}" data-selected="false"/>`;
        
        segmentTexts += `<text x="${segmentX + segmentWidth/2}" y="${y + 33}" font-family="Arial, sans-serif" font-size="14" fill="#bbbbbb" text-anchor="middle" style="pointer-events: none;">${option}</text>`;
      });

      const svg = `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="14" fill="#bbbbbb">${text}</text>
        <!-- Segmented Container -->
        <rect id="${borderId}" x="${x}" y="${y + 10}" width="340" height="40" rx="8" fill="transparent" stroke="#444" stroke-width="2"/>
        ${segments}
        ${segmentTexts}
        <!-- Hidden input to store value -->
        <foreignObject x="${x}" y="${y + 55}" width="1" height="1" style="overflow: hidden;">
          <input xmlns="http://www.w3.org/1999/xhtml" id="${selectorId}" type="hidden" data-field="${text}"/>
        </foreignObject>`;

      return svg;
    }

    function getInput(x, y, text, inputType) {
      const borderId = `${text.replace(/\s+/g, '')}Border`;
      const inputId = `${text.replace(/\s+/g, '')}Input`;

      const svg = `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="14" fill="#bbbbbb">${text}</text>
	<!-- Field Background -->
	<rect id="${borderId}" x="${x}" y="${y + 10}" width="340" height="40" rx="8" fill="#1c1c20" 
	      stroke="#444" stroke-width="2" class="input-field"/>
	<!-- Inset shadow effect -->
	<rect x="${x + 2}" y="${y + 12}" width="336" height="36" rx="6" fill="none" 
	      stroke="#000" stroke-width="1" opacity="0.3"/>
	<!-- HTML Input Field -->
	<foreignObject x="${x + 5}" y="${y + 15}" width="330" height="30">
	  <input xmlns="http://www.w3.org/1999/xhtml" id="${inputId}" type="text" placeholder="Enter ${text.toLowerCase()}" data-field="${text}" spellcheck="false" style="width:100%; height: 100%; background-color: transparent; color: white; border: none; outline: none; padding: 8px 12px; font-size: 14px; font-family: Arial, sans-serif; border-radius: 6px;"/>
	</foreignObject>`;

      return svg;
    }

    function getTextBlock(x, y, text, content) {
      const textHeight = calculateTextBlockHeight(content);
      
      const svg = `<!-- Text Block Background -->
	<rect x="${x}" y="${y + 10}" width="340" height="${textHeight}" rx="8" 
	      fill="#1a1a1e" stroke="#333" stroke-width="1"/>
	
	<!-- Text Block Content -->
	<foreignObject x="${x + 12}" y="${y + 22}" width="316" height="${textHeight - 24}">
	  <div xmlns="http://www.w3.org/1999/xhtml" style="
	    font-family: Arial, sans-serif; 
	    font-size: 14px; 
	    line-height: 1.4; 
	    color: #cccccc; 
	    padding: 0;
	    margin: 0;
	    width: 100%;
	    height: 100%;
	    overflow: hidden;
	  ">${content}</div>
	</foreignObject>`;

      return { svg, height: textHeight + 20 };
    };

    function getSubmitButton(x, y) {
      return `<rect id="submitButton" x="${x}" y="${y}" width="300" height="45" rx="22.5" fill="#666666" style="cursor: not-allowed;">
	  </rect>
	  <text x="${x + 150}" y="${y + 28}" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#999999" text-anchor="middle" dominant-baseline="middle" style="pointer-events: none;">SUBMIT</text>
      `;
    }

    function enableSubmitButton() {
      const submitButton = document.getElementById('submitButton');
      const submitButtonText = submitButton.nextElementSibling;
      
      submitButton.setAttribute('fill', 'url(#buttonGradient)');
      submitButton.setAttribute('style', 'cursor: pointer;');
      submitButtonText.setAttribute('fill', 'white');
    }

    function disableSubmitButton() {
      const submitButton = document.getElementById('submitButton');
      const submitButtonText = submitButton.nextElementSibling;
      
      submitButton.setAttribute('fill', '#666666');
      submitButton.setAttribute('style', 'cursor: not-allowed;');
      submitButtonText.setAttribute('fill', '#999999');
    }

    function validateForm(formJSON) {
      const requiredFields = Object.keys(formJSON).filter(key => 
        key !== 'form' && formJSON[key].required
      );
      
      const allValid = requiredFields.every(key => {
        const fieldConfig = formJSON[key];
        
        if (fieldConfig.type === 'segmented') {
          const selectorId = `${key.replace(/\s+/g, '')}Selector`;
          const selector = document.getElementById(selectorId);
          return selector && selector.value && selector.value.trim() !== '';
        } else {
          const inputId = `${key.replace(/\s+/g, '')}Input`;
          const input = document.getElementById(inputId);
          return input && input.value && input.value.trim() !== '';
        }
      });
      
      if (allValid) {
        enableSubmitButton();
      } else {
        disableSubmitButton();
      }
      
      // Also trigger overall validation
      setTimeout(() => validateAllForms(), 100);
      
      return allValid;
    }

    function getForm(formJSON, onSubmit) {
      const keys = Object.keys(formJSON);
      let currentY = 130; // Initialize currentY
      const inputs = [];
      
      keys.forEach((key, index) => {
	if (key === "form") return;
	
	const fieldConfig = formJSON[key];
	if (fieldConfig.type === 'text-block') {
	  const textBlock = getTextBlock(80, currentY, key, fieldConfig.content || fieldConfig.text);
	  inputs.push(textBlock.svg);
	  currentY += textBlock.height;
	} else if (fieldConfig.type === 'segmented') {
	  inputs.push(getSegmentedSelector(80, currentY, key, fieldConfig.options));
	  currentY += 70; // Standard field height
	} else {
	  inputs.push(getInput(80, currentY, key, fieldConfig.type));
	  currentY += 70; // Standard field height
	}
      });
      
      // Add submit button at the final currentY position
      inputs.push(getSubmitButton(100, currentY + 20));
      
      const svg = getBackgroundAndGradients(formJSON) + inputs.join('');
      const dynamicHeight = calculateFormHeight(formJSON);

      const container = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      container.setAttribute('viewBox', `0 0 500 ${dynamicHeight + 100}`);
      container.setAttribute('width', '100%');
      container.setAttribute('height', 'auto');
      container.innerHTML = svg;

      // Rest of your event handler code remains the same...
      setTimeout(() => {
	Object.keys(formJSON).forEach((key, index) => {
	  if(key === 'form') {
	    return;
	  }

	  const fieldConfig = formJSON[key];
	  const borderId = `${key.replace(/\s+/g, '')}Border`;
	  
	  if (fieldConfig.type === 'segmented') {
	    const selectorId = `${key.replace(/\s+/g, '')}Selector`;
	    const selector = document.getElementById(selectorId);
	    
	    // Add click handlers for segments
	    fieldConfig.options.forEach((option, optionIndex) => {
	      const segmentId = `${selectorId}_${optionIndex}`;
	      const segment = document.getElementById(segmentId);
	      
	      if (segment) {
		segment.addEventListener('click', () => {
		  // Clear all segments
		  fieldConfig.options.forEach((_, clearIndex) => {
		    const clearSegmentId = `${selectorId}_${clearIndex}`;
		    const clearSegment = document.getElementById(clearSegmentId);
		    if (clearSegment) {
		      clearSegment.setAttribute('fill', '#1c1c20');
		      clearSegment.setAttribute('data-selected', 'false');
		    }
		  });
		  
		  // Select clicked segment
		  segment.setAttribute('fill', '#3eda82');
		  segment.setAttribute('data-selected', 'true');
		  
		  // Update hidden input value
		  if (selector) {
		    selector.value = option;
		  }
		  
		  // Update border
		  const borderElement = document.getElementById(borderId);
		  if (borderElement) {
		    borderElement.setAttribute('stroke', 'url(#inputGradient)');
		  }
		  
		  // Validate form
		  validateForm(formJSON);
		});
	      }
	    });
	  } else {
	    const inputId = `${key.replace(/\s+/g, '')}Input`;
	    const inputElement = document.getElementById(inputId);
	    
	    if (inputElement) {
	      inputElement.addEventListener('input', (evt) => {
		const borderElement = document.getElementById(borderId);
		if (borderElement) {
		  borderElement.setAttribute('stroke', 'url(#inputGradient)');
		}
		
		// Validate form
		validateForm(formJSON);
	      });
	    }
	  }
	});

	const submitButton = document.getElementById('submitButton');
	if (submitButton) {
	  submitButton.addEventListener('click', () => {
	    if (!validateForm(formJSON)) {
	      console.log('Form validation failed');
	      return;
	    }
	    
	    console.log('Submit button clicked');
	    
	    // Create button animation
	    const animation = document.createElementNS("http://www.w3.org/2000/svg", "animate");
	    animation.setAttribute("attributeName", "offset");
	    animation.setAttribute("values", "-0.5;2.5");
	    animation.setAttribute("dur", "300ms");
	    animation.setAttribute("repeatCount", "1");

	    const secondAnimation = document.createElementNS("http://www.w3.org/2000/svg", "animate");
	    secondAnimation.setAttribute("attributeName", "offset");
	    secondAnimation.setAttribute("values", "0.5;3.5");
	    secondAnimation.setAttribute("dur", "300ms");
	    secondAnimation.setAttribute("repeatCount", "1");

	    const startGradient = document.getElementById('submitButtonGradientStart');
	    const endGradient = document.getElementById('submitButtonGradientEnd');
	    
	    if (startGradient && endGradient) {
	      startGradient.appendChild(animation);
	      endGradient.appendChild(secondAnimation);
	      animation.beginElement();
	      secondAnimation.beginElement();
	    }

	    // Collect form values
	    const formValues = {};
	    Object.keys(formJSON).forEach((key) => {
	      if(key === 'form') {
		return;
	      }

	      const fieldConfig = formJSON[key];
	      
	      if (fieldConfig.type === 'segmented') {
		const selectorId = `${key.replace(/\s+/g, '')}Selector`;
		const selector = document.getElementById(selectorId);
		if (selector) {
		  formValues[key] = selector.value;
		}
	      } else {
		const inputId = `${key.replace(/\s+/g, '')}Input`;
		const inputElement = document.getElementById(inputId);
		if (inputElement) {
		  formValues[key] = inputElement.value;
		}
	      }
	    });

	    if (onSubmit) {
	      onSubmit(formValues);
	    }
	  });
	}
	
	// Initial validation
	validateForm(formJSON);
      }, 100);

      return container;
    }

    window.getForm = getForm;

  })
