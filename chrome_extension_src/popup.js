document.addEventListener('DOMContentLoaded', function() {
  const toggleInput = document.getElementById('extensionToggle');
  const statusBadge = document.getElementById('statusBadge');
  const statusText = document.getElementById('statusText');

  // Retrieve storage state
  chrome.storage.local.get({ isEnabled: true }, function(result) {
    toggleInput.checked = result.isEnabled;
    updateStatusUI(result.isEnabled);
  });

  // Switch changed event
  toggleInput.addEventListener('change', function() {
    const isEnabled = toggleInput.checked;
    chrome.storage.local.set({ isEnabled: isEnabled }, function() {
      updateStatusUI(isEnabled);
      
      // Dispatch state update to Content Scripts
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "toggleActive", isEnabled: isEnabled });
        }
      });
    });
  });

  function updateStatusUI(isEnabled) {
    if (isEnabled) {
      statusBadge.className = 'status-badge enabled';
      statusText.textContent = 'Active';
    } else {
      statusBadge.className = 'status-badge disabled';
      statusText.textContent = 'Disabled';
    }
  }
});