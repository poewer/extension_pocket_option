document.addEventListener('DOMContentLoaded', function() {
  const addItemButton = document.getElementById('addItemButton');

  addItemButton.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'addItem' }, function(response) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
        } else {
          console.log('Nowy element został dodany.');
        }
      });
    });
  });
});
