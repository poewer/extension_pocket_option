chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'logMessage') {
    console.log('Przycisk został kliknięty!');
  }
});
