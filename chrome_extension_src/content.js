// A11yTester Chrome Extension - Live Contextual Hover Checklist Companion
(function() {
  if (window.hasA11yTesterRun) return;
  window.hasA11yTesterRun = true;

  let isEnabled = true;
  let activeHighlight = null;

  // Insert Floating Tooltip Panel to appear NEAR the hovered element
  const tooltip = document.createElement('div');
  tooltip.id = 'a11ytester-floating-tooltip';
  tooltip.style.cssText = `
    position: fixed !important;
    width: 340px !important;
    max-height: 480px !important;
    background-color: #ffffff !important;
    color: #0f172a !important;
    border: 3px solid #2563eb !important;
    border-radius: 14px !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
    z-index: 2147483647 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif !important;
    padding: 18px !important;
    overflow-y: auto !important;
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 0.15s ease-out, transform 0.15s ease-out !important;
    pointer-events: none !important;
    box-sizing: border-box !important;
    text-align: left !important;
  `;
  document.body.appendChild(tooltip);

  const elementChecklists = {
    button: {
      title: "Button Accessibility (ARIA APG)",
      scenarios: [
        "Verify button is keyboard operable using Enter and Space keys.",
        "Verify button has an accessible name (announced from text content or aria-label).",
        "Verify button has role=\"button\" if constructed using custom elements.",
        "Verify disabled state is communicated programmatically (aria-disabled or disabled).",
        "Verify focus outline indicator is clearly visible when tabbing."
      ]
    },
    input: {
      title: "Form Input Accessibility (ARIA APG)",
      scenarios: [
        "Verify the field has a permanent, visible text label connected via 'for' and 'id'.",
        "Verify placeholder is not used as the sole label or replacement for instructions.",
        "Verify that required fields explicitly state 'required' (aria-required=\"true\").",
        "Verify screen reader announces valid/invalid state changes.",
        "Verify that focus indicator remains highly visible on entry."
      ]
    },
    combobox: {
      title: "Combobox / Dropdown Accessibility (ARIA APG)",
      scenarios: [
        "Verify element identifies as role=\"combobox\" and has accessible label.",
        "Verify using Arrow keys navigates options, and Enter selects options.",
        "Verify aria-expanded changes to 'true' when options list is open.",
        "Verify listbox container has role=\"listbox\", items have role=\"option\".",
        "Verify selection is immediately announced by screen readers."
      ]
    },
    checkbox: {
      title: "Checkbox Accessibility (ARIA APG)",
      scenarios: [
        "Verify checking/unchecking state is toggled with Spacebar.",
        "Verify state change is announced programmatically (checked/unchecked).",
        "Verify label text is linked via '<label for=\"...\">' to allow clicking label to select.",
        "Verify aria-checked is used if constructing custom checkboxes from divs."
      ]
    },
    radio: {
      title: "Radio Button Group Accessibility (ARIA APG)",
      scenarios: [
        "Verify elements are grouped inside role=\"radiogroup\" with a label.",
        "Verify using Arrow keys moves focus between options in the group.",
        "Verify only one radio in the group is checked at any single time.",
        "Verify Spacebar selects the currently focused radio button option."
      ]
    },
    link: {
      title: "Anchor Link Accessibility (ARIA APG)",
      scenarios: [
        "Verify link is keyboard operable using Enter key.",
        "Verify link text clearly describes the destination on its own (avoid 'click here').",
        "Verify links opening in new tab alert users programmatically.",
        "Verify visual design has non-color identifiers (like underlines)."
      ]
    },
    image: {
      title: "Image / Graphic Accessibility (ARIA APG)",
      scenarios: [
        "Verify images have descriptive alt text outlining intent/details.",
        "Verify decorative images have alt=\"\" (empty) so screen readers skip them.",
        "Verify inline SVGs have role=\"img\" and an accessible label via aria-label.",
        "Verify color contrast of crucial icon graphics is at least 3:1."
      ]
    },
    dialog: {
      title: "Modal Dialog Accessibility (ARIA APG)",
      scenarios: [
        "Verify dialog container has role=\"dialog\" or role=\"alertdialog\", aria-modal=\"true\".",
        "Verify focus is moved immediately to the first interactive element inside when opened.",
        "Verify focus is strictly trapped inside the dialog (cannot tab to background page).",
        "Verify pressing Escape key closes the modal and returns focus to trigger."
      ]
    },
    tablist: {
      title: "Tab Interface Accessibility (ARIA APG)",
      scenarios: [
        "Verify tabs wrapper has role=\"tablist\", active tab has aria-selected=\"true\".",
        "Verify focus moves between tabs using Arrow keys, not Tab key.",
        "Verify Space or Enter activates the focused tab panel.",
        "Verify each tab points to its panel via aria-controls."
      ]
    },
    accordion: {
      title: "Accordion Accessibility (ARIA APG)",
      scenarios: [
        "Verify accordion headers are focusable and can be toggled using Space or Enter.",
        "Verify toggle header button has aria-expanded=\"true\" (open) and \"false\" (closed).",
        "Verify the toggle header points to collapsible panel using aria-controls.",
        "Verify collapsed panel is hidden programmatically (display: none or hidden)."
      ]
    },
    table: {
      title: "Table (Static Data Presentation) Accessibility (ARIA APG)",
      scenarios: [
        "Verify container uses semantic <table> or role=\"table\" for static structured data.",
        "Verify columns have header cells (<th> or role=\"columnheader\"), and rows have role=\"row\".",
        "Verify screen reader reads headers when moving across columns and rows using standard table navigation shortcuts.",
        "Verify a summary or title is supplied using <caption>, aria-describedby, or aria-label.",
        "Verify that cells are NOT focusable unless they contain active controls."
      ]
    },
    grid: {
      title: "Grid (Interactive Web Widget) Accessibility (ARIA APG)",
      scenarios: [
        "Verify container has role=\"grid\" to indicate a fully interactive grid widget (e.g. spreadsheet, editable list).",
        "Verify users can navigate between cells in all directions using Arrow keys (Left, Right, Up, Down).",
        "Verify focus uses roving tabindex (only the active cell has tabindex=\"0\"; others have tabindex=\"-1\").",
        "Verify pressing Tab immediately escapes the grid widget instead of tabbing through every single cell.",
        "Verify sorting columns communicates state programmatically using aria-sort=\"ascending\" or \"descending\"."
      ]
    },
    "link-dropdown": {
      title: "Link-Dropdown Combo Accessibility (ARIA APG)",
      scenarios: [
        "Verify the link trigger indicates it has a popup submenu using aria-haspopup=\"true\" or aria-haspopup=\"menu\".",
        "Verify expansion state is updated programmatically on the link trigger via aria-expanded=\"true\"/\"false\".",
        "Verify using Down Arrow or Enter on the link trigger successfully opens and moves focus into the dropdown menu.",
        "Verify pressing Escape closes the dropdown and returns keyboard focus directly back to the trigger link.",
        "Verify that visual indicators (e.g. chevron icons) clearly signal the dropdown behavior to visual users."
      ]
    },
    "image-link": {
      title: "Image-Link Combo Accessibility (ARIA APG)",
      scenarios: [
        "Verify the parent link (<a>) has an accessible name, either from alt text on the inner image or aria-label.",
        "Verify the inner image has an alt attribute to prevent the screen reader from reading raw image filename or link URL.",
        "Verify the alt text describes the destination or purpose of the link rather than just describing the image literally (e.g., 'Go to Dashboard' vs 'Dashboard icon').",
        "Verify you do not have redundant alt text inside the link like 'link to dashboard image' as screen readers already announce the link role.",
        "Verify the composite element behaves as a single focusable interactive target when tabbing through the document."
      ]
    }
  };

  // Inject a floating control widget at the bottom right of the page
  const controlPanel = document.createElement('div');
  controlPanel.id = 'a11ytester-onpage-control';
  controlPanel.style.cssText = 'position: fixed !important; bottom: 20px !important; right: 20px !important; background-color: #1e293b !important; color: #ffffff !important; padding: 10px 14px !important; border-radius: 9999px !important; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important; z-index: 2147483647 !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; font-size: 11px !important; font-weight: bold !important; display: flex !important; align-items: center !important; gap: 8px !important; border: 1px solid #334155 !important; pointer-events: auto !important; user-select: none !important; line-height: 1 !important;';

  const panelTitle = document.createElement('span');
  panelTitle.textContent = 'Accessibility Inspector:';
  panelTitle.style.cssText = 'color: #94a3b8 !important; font-size: 10px !important; text-transform: uppercase !important; letter-spacing: 0.05em !important;';
  controlPanel.appendChild(panelTitle);

  const statusLabel = document.createElement('span');
  statusLabel.id = 'a11ytester-onpage-status';
  statusLabel.textContent = isEnabled ? 'ACTIVE' : 'DISABLED';
  statusLabel.style.cssText = 'color: #22c55e !important; font-weight: 900 !important; font-family: monospace !important;';
  controlPanel.appendChild(statusLabel);

  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'a11ytester-onpage-toggle-btn';
  toggleBtn.textContent = 'Toggle';
  toggleBtn.style.cssText = 'background-color: #3b82f6 !important; color: #ffffff !important; border: none !important; border-radius: 20px !important; padding: 4px 10px !important; font-size: 10px !important; font-weight: 800 !important; cursor: pointer !important; text-transform: uppercase !important; outline: none !important; margin: 0 !important; line-height: 1.2 !important;';
  
  toggleBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault();
    isEnabled = !isEnabled;
    chrome.storage.local.set({ isEnabled: isEnabled }, function() {
      updateOnPageUI();
      if (!isEnabled) {
        clearHighlight();
      }
    });
  });
  controlPanel.appendChild(toggleBtn);
  document.body.appendChild(controlPanel);

  function updateOnPageUI() {
    statusLabel.textContent = isEnabled ? 'ACTIVE' : 'DISABLED';
    statusLabel.style.cssText = isEnabled 
      ? 'color: #22c55e !important; font-weight: 900 !important; font-family: monospace !important;' 
      : 'color: #ef4444 !important; font-weight: 900 !important; font-family: monospace !important;';
    toggleBtn.style.cssText = isEnabled
      ? 'background-color: #22c55e !important; color: #ffffff !important; border: none !important; border-radius: 20px !important; padding: 4px 10px !important; font-size: 10px !important; font-weight: 800 !important; cursor: pointer !important; text-transform: uppercase !important; outline: none !important; margin: 0 !important; line-height: 1.2 !important;'
      : 'background-color: #475569 !important; color: #ffffff !important; border: none !important; border-radius: 20px !important; padding: 4px 10px !important; font-size: 10px !important; font-weight: 800 !important; cursor: pointer !important; text-transform: uppercase !important; outline: none !important; margin: 0 !important; line-height: 1.2 !important;';
  }

  // Synchronize state with chrome.storage.local
  chrome.storage.local.get({ isEnabled: true }, function(result) {
    isEnabled = result.isEnabled;
    updateOnPageUI();
  });

  // Listen for toggling messages from popup.js
  chrome.runtime.onMessage.addListener(function(msg) {
    if (msg.action === "toggleActive") {
      isEnabled = msg.isEnabled;
      updateOnPageUI();
      if (!isEnabled) {
        clearHighlight();
      }
    }
  });

  function clearHighlight() {
    if (activeHighlight) {
      activeHighlight.style.outline = '';
      activeHighlight = null;
    }
    tooltip.style.opacity = '0';
    tooltip.style.transform = 'translateY(6px)';
  }

  // Detect appropriate element according to ARIA standards and hierarchical tree traversal
  function detectA11yType(element) {
    if (!element || element === document.body) return null;

    // First, resolve label/container targets to their actual semantic controls
    let resolved = element;
    
    // Check if it's a label or inside a label
    const label = element.closest('label');
    if (label) {
      if (label.getAttribute('for')) {
        const control = document.getElementById(label.getAttribute('for'));
        if (control) resolved = control;
      } else {
        const nestedControl = label.querySelector('input, select, textarea, [role="checkbox"], [role="radio"], [role="combobox"]');
        if (nestedControl) resolved = nestedControl;
      }
    } else {
      // If it's a div/span/li, check if it wraps exactly one key interactive element
      const tagName = element.tagName ? element.tagName.toLowerCase() : '';
      if (tagName === 'div' || tagName === 'span' || tagName === 'li' || tagName === 'td') {
        const nestedControls = element.querySelectorAll('input, select, textarea, button, a, [role="checkbox"], [role="radio"], [role="combobox"], [role="button"], [role="link"]');
        if (nestedControls.length === 1) {
          resolved = nestedControls[0];
        }
      }
    }

    // Now, we climb up from the resolved element up to 4 levels to find the most specific ARIA patterns.
    // To solve the "link guide overriding checkbox" bug, we prioritize highly specific roles!
    // Highly specific roles: checkbox, radio, combobox, input, tablist, dialog, accordion.
    // General roles: link, button, image.
    
    let current = resolved;
    let candidates = [];

    for (let depth = 0; depth < 4; depth++) {
      if (!current || current === document.body || current === document.documentElement) break;
      
      const tagName = current.tagName ? current.tagName.toLowerCase() : '';
      const role = current.getAttribute ? current.getAttribute('role') : null;
      const type = current.getAttribute ? current.getAttribute('type') : null;

      // 1. Check Dialog
      if (role === 'dialog' || role === 'alertdialog' || tagName === 'dialog') {
        candidates.push({ type: 'dialog', el: current, priority: 10 });
      }
      // 2. Check Tabs
      if (role === 'tab' || role === 'tablist' || role === 'tabpanel') {
        candidates.push({ type: 'tablist', el: current, priority: 9 });
      }
      // 3. Check Accordion (has aria-expanded or aria-controls)
      if (current.hasAttribute && (current.hasAttribute('aria-expanded') || current.hasAttribute('aria-controls'))) {
        if (role === 'tab' || role === 'tablist') {
          candidates.push({ type: 'tablist', el: current, priority: 9 });
        } else {
          candidates.push({ type: 'accordion', el: current, priority: 8 });
        }
      }
      // 4. Check Select / Combobox / Dropdown
      if (tagName === 'select' || role === 'combobox' || role === 'listbox' || role === 'option') {
        candidates.push({ type: 'combobox', el: current, priority: 8 });
      }
      // Check Grid
      if (role === 'grid' || role === 'gridcell' || role === 'rowgroup') {
        candidates.push({ type: 'grid', el: current, priority: 8 });
      }
      // Check Static Table
      if (tagName === 'table' || role === 'table' || role === 'rowheader' || role === 'columnheader' || tagName === 'th' || tagName === 'td') {
        candidates.push({ type: 'table', el: current, priority: 6 });
      }
      // 5. Check Checkbox
      if (type === 'checkbox' || role === 'checkbox') {
        candidates.push({ type: 'checkbox', el: current, priority: 9 });
      }
      // 6. Check Radio
      if (type === 'radio' || role === 'radio' || role === 'radiogroup') {
        candidates.push({ type: 'radio', el: current, priority: 9 });
      }
      // 7. Check Textbox / Form Inputs
      if (tagName === 'input' || tagName === 'textarea' || role === 'textbox' || role === 'searchbox') {
        // Double check it's not a checkbox or radio that fell through
        if (type !== 'checkbox' && type !== 'radio') {
          candidates.push({ type: 'input', el: current, priority: 7 });
        }
      }
      // 8. Check Button (lower priority than specific inputs, so checkbox inside button matches checkbox)
      if (tagName === 'button' || role === 'button' || type === 'button' || type === 'submit') {
        candidates.push({ type: 'button', el: current, priority: 5 });
      }
      // Check Link-Dropdown Combo
      if (tagName === 'a' || role === 'link') {
        const lowerHTML = current.outerHTML ? current.outerHTML.toLowerCase() : '';
        if (current.hasAttribute('aria-haspopup') || current.hasAttribute('aria-expanded') || lowerHTML.includes('dropdown') || lowerHTML.includes('popup')) {
          candidates.push({ type: 'link-dropdown', el: current, priority: 8 });
        }
      }
      // Check Image-Link Combo
      if (tagName === 'a' || role === 'link') {
        // Exclude icon links (typically links containing an SVG icon or font-awesome/lucide icon, but no real <img> tag)
        const hasImg = current.querySelector('img');
        const hasRoleImg = current.querySelector('[role="img"]');
        if (hasImg || (hasRoleImg && hasRoleImg.tagName.toLowerCase() !== 'svg')) {
          candidates.push({ type: 'image-link', el: current, priority: 7 });
        }
      }
      // 9. Check Link (lowest priority so specific controls inside an anchor link cards match their control)
      if (tagName === 'a' || role === 'link') {
        candidates.push({ type: 'link', el: current, priority: 4 });
      }
      // 10. Check Image
      if (tagName === 'img' || tagName === 'svg' || role === 'img') {
        candidates.push({ type: 'image', el: current, priority: 3 });
      }

      current = current.parentNode;
    }

    if (candidates.length > 0) {
      // Sort candidates by priority desc (highest priority first)
      // If priorities are equal, we prefer the one closer to the hover target (earlier in candidates array)
      candidates.sort((a, b) => b.priority - a.priority);
      return { type: candidates[0].type, el: candidates[0].el };
    }

    return null;
  }

  // Helper to place floating tooltip relative to hovered element
  function positionTooltip(el) {
    const rect = el.getBoundingClientRect();
    const tooltipWidth = 340;
    const margin = 12;

    // Calculate vertical coordinates
    let top = rect.bottom + window.scrollY + margin;
    
    // If it floats off the bottom of the viewport screen, position above the element
    if (rect.bottom + 280 > window.innerHeight) {
      top = rect.top + window.scrollY - 300;
    }
    if (top < window.scrollY) {
      top = rect.bottom + window.scrollY + margin;
    }

    // Calculate horizontal coordinates
    let left = rect.left + window.scrollX;
    
    // Constrain inside viewport boundaries
    if (left + tooltipWidth > window.innerWidth) {
      left = window.innerWidth - tooltipWidth - 20;
    }
    if (left < 10) {
      left = 10;
    }

    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
  }

  document.addEventListener('mouseover', function(e) {
    if (!isEnabled) return;

    const detected = detectA11yType(e.target);
    if (detected) {
      if (activeHighlight && activeHighlight !== detected.el) {
        activeHighlight.style.outline = '';
      }
      activeHighlight = detected.el;
      detected.el.style.outline = '3px solid #2563eb';
      detected.el.style.outlineOffset = '2px';

      const checklist = elementChecklists[detected.type];
      let scenariosHTML = '';
      checklist.scenarios.forEach((sc, idx) => {
        scenariosHTML += `
          <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; background-color: #f8fafc; padding: 8px 10px; border-radius: 8px; border: 1px solid #e2e8f0; box-sizing: border-box;">
            <span style="background-color: #2563eb; color: #ffffff; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; flex-shrink: 0;">${idx + 1}</span>
            <p style="margin: 0; font-size: 11px; font-weight: 600; color: #334155; line-height: 1.4;">${sc}</p>
          </div>
        `;
      });

      tooltip.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="background-color: #2563eb; color: #ffffff; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">${detected.type}</span>
            <span style="font-size: 12px; font-weight: 800; color: #0f172a;">A11yTester</span>
          </div>
          <span style="font-size: 10px; color: #10b981; font-weight: bold;">● Active</span>
        </div>
        <h5 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 800; color: #1e293b;">${checklist.title}</h5>
        <div style="max-height: 220px; overflow-y: auto;">
          ${scenariosHTML}
        </div>
        <div style="font-size: 9px; color: #94a3b8; text-align: center; margin-top: 10px; border-top: 1px solid #f1f5f9; padding-top: 6px;">
          Hover away to dismiss
        </div>
      `;

      positionTooltip(detected.el);
      tooltip.style.opacity = '1';
      tooltip.style.transform = 'translateY(0)';
    }
  });

  document.addEventListener('mouseout', function(e) {
    if (activeHighlight && e.target === activeHighlight) {
      clearHighlight();
    }
  });
})();