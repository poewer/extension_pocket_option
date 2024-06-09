let blinkIntervalCall;
let blinkIntervalPut;
let failureCount = 0;
let stepIndex = 0;
let steps = [1, 1.92, 3.68, 7.07, 13.6];
let stopAlgorithm = false;
const balanceThreshold = 0.1; // Threshold to ignore minor balance changes

function addAiHelperButton() {
  console.log("Adding AI Helper button...");
  const sidebarList = document.querySelector('.right-sidebar nav ul');

  if (sidebarList && !document.getElementById('aiHelperButton')) {
    const newListItem = createSidebarButton();
    sidebarList.appendChild(newListItem);

    newListItem.querySelector('a').addEventListener('click', togglePanel);
    console.log("AI Helper button added.");
  } else {
    console.log('Element already exists or sidebar list not found.');
  }
}

function createSidebarButton() {
  console.log("Creating sidebar button...");
  const newListItem = document.createElement('li');
  newListItem.innerHTML = `
    <a id="aiHelperButton" class="" style="margin-top:5px;">
      <span>AI Helper</span>
    </a>
  `;
  return newListItem;
}

function togglePanel() {
  console.log("Toggling panel visibility...");
  let panel = document.getElementById('aiHelperPanel');
  if (panel) {
    panel.classList.toggle('hidden');
    console.log("Panel visibility toggled.");
  } else {
    createPanel();
    console.log("Panel created.");
  }
}

function createPanel() {
  console.log("Creating panel...");
  const panel = document.createElement('div');
  panel.id = 'aiHelperPanel';
  panel.className = 'w-full bg-gray-600 flex flex-col border-t border-gray-200 shadow';
  panel.innerHTML = getPanelHTML();
  document.body.appendChild(panel);

  document.getElementById('closePanelButton').addEventListener('click', () => {
    panel.classList.toggle('hidden');
    console.log("Panel closed.");
  });
  loadTailwindCSS();

  setupPanelEventListeners();
  console.log("Panel event listeners set up.");
}

function getPanelHTML() {
  return `
<div class="flex justify-between items-center p-4 bg-gray-900 text-white">
  <h2 class="text-lg">AI Helper Panel</h2>
  <button id="closePanelButton" class="text-lg">&times;</button>
</div>
<div class="flex flex-row gap-4">
  <div class="flex flex-col h-screen w-1/4 p-4 bg-gray-800 items-center justify-center gap-4">
    <ul class="flex flex-col justify-center gap-16 h-full">
      <li class="text-5xl text-white"><a id="earn_button">💸 Zarabiaj</a></li>
      <li class="text-5xl text-white"><a id="settings_button">🛠️ Ustawienia</a></li>
      <li class="text-5xl text-white"><a id="premium_account_button">✨ Premium</a></li>
    </ul>
  </div>
  <div id="content_section" class="flex flex-col w-3/4 h-auto p-4 bg-gray-700 overflow-y-auto">
  </div>
</div>
  `;
}

function loadTailwindCSS() {
  console.log("Loading Tailwind CSS...");
  if (!document.getElementById('tailwindCSS')) {
    const link = document.createElement('link');
    link.id = 'tailwindCSS';
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css';
    document.head.appendChild(link);
    console.log("Tailwind CSS loaded.");
  }
}

function setupPanelEventListeners() {
  console.log("Setting up panel event listeners...");
  document.getElementById('earn_button').addEventListener('click', () => loadContent(chrome.runtime.getURL('earn.html')));
  document.getElementById('settings_button').addEventListener('click', () => loadContent(chrome.runtime.getURL('settings.html')));
  document.getElementById('premium_account_button').addEventListener('click', () => loadContent(chrome.runtime.getURL('premium.html')));
}

function loadContent(url) {
  console.log(`Loading content from ${url}...`);
  fetch(url)
    .then(response => response.text())
    .then(html => {
      document.getElementById('content_section').innerHTML = html;
      addStartEarningButtonListener();
      console.log("Content loaded and start earning button listener added.");
    })
    .catch(err => console.error('Error loading content:', err));
}

function addStartEarningButtonListener() {
  const startEarningButton = document.getElementById('startEarningButton');
  if (startEarningButton) {
    startEarningButton.addEventListener('click', () => {
      failureCount = 0;
      stepIndex = 0;
      stopAlgorithm = false;
      startEarningAlgorithm();
      console.log('Started earning money!');
    });
    console.log("Start earning button listener added.");
  } else {
    console.error('Start earning button not found.');
  }
}

function setMoney(price) {
  return new Promise((resolve, reject) => {
    const priceInput = document.querySelector('.block.block--bet-amount .control__value .value__val input');
    if (priceInput) {
      priceInput.value = `$${price}`;
      priceInput.dispatchEvent(new Event('input', { bubbles: true }));
      priceInput.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`Set money to $${price}`);
      resolve();
    } else {
      console.error('Price input element not found.');
      reject('Price input element not found.');
    }
  });
}

function getAccountBalance() {
  const balanceElement = document.querySelector('.balance-info-block__balance .js-hd.js-balance-demo');
  if (balanceElement) {
    const balance = balanceElement.textContent;
    console.log(`Current balance: ${balance}`);
    return parseFloat(balance.replace(',', ''));
  } else {
    console.error('Balance element not found.');
    return null;
  }
}

function observeAccountBalance(callback) {
  const balanceElement = document.querySelector('.balance-info-block__balance .js-hd.js-balance-demo');
  if (balanceElement) {
    const observer = new MutationObserver(callback);
    observer.observe(balanceElement, { childList: true, subtree: true, characterData: true });
    console.log("Started observing account balance.");
    return observer;
  } else {
    console.error('Balance element not found for observation.');
    return null;
  }
}

function startEarningAlgorithm() {
  function executeStep() {
    if (stepIndex >= steps.length || failureCount >= 10 || stopAlgorithm) {
      console.log('Algorithm stopped.');
      if (failureCount >= 10) {
        alert('10 nieudanych transakcji. Aby ponownie uruchomić algorytm, kliknij przycisk "Zarabiaj" jeszcze raz.');
      }
      return;
    }

    let currentBalance = getAccountBalance();
    if (currentBalance !== null) {
      console.log(`Executing step with balance: $${currentBalance}`);
    }

    let price = steps[stepIndex];
    let targetBalance = currentBalance - price;

    setMoney(price)
      .then(() => setTransactionTime())
      .then((time) => clickCallButton(time))
      .then(() => waitForBalanceChange(currentBalance, targetBalance))
      .then((newBalance) => {
        if (newBalance !== null && currentBalance !== null) {
          if (newBalance > targetBalance + balanceThreshold) {
            console.log(`Transaction successful! New balance: $${newBalance}`);
            stepIndex++;
          } else {
            console.log(`Transaction failed. New balance: $${newBalance}`);
            stepIndex = 0; // Reset to initial step after a failure
            failureCount++;
          }
        }
        if (failureCount < 10) {
          setTimeout(executeStep, 1000); // Wait 1 second before executing the next step
        } else {
          console.log('Maximum of 10 failures reached. Stopping algorithm.');
          stopAlgorithm = true;
          alert('10 nieudanych transakcji. Aby ponownie uruchomić algorytm, kliknij przycisk "Zarabiaj" jeszcze raz.');
        }
      })
      .catch((error) => console.error(error));
  }

  executeStep();
}

function setTransactionTime() {
  return new Promise((resolve, reject) => {
    const timeElement = document.querySelector('.block__control.control.js-tour-block--expiration-inputs .value__val');
    if (timeElement) {
      const time = timeElement.textContent.trim();
      console.log(`Set transaction time to ${time}`);
      resolve(time);
    } else {
      console.error('Transaction time element not found.');
      reject('Transaction time element not found.');
    }
  });
}

function clickCallButton(time) {
  return new Promise((resolve, reject) => {
    const btnCall = document.querySelector('a.btn.btn-call');
    if (btnCall) {
      const timeInSeconds = convertTimeToSeconds(time);
      btnCall.click();
      console.log('Call button clicked.');
      setTimeout(resolve, timeInSeconds * 1000); // Wait based on the transaction time
    } else {
      console.error('Call button not found.');
      reject('Call button not found.');
    }
  });
}

function convertTimeToSeconds(time) {
  const parts = time.split(':').map(Number);
  let seconds = 0;
  if (parts.length === 3) {
    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    seconds = parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    seconds = parts[0];
  }
  return seconds;
}

function waitForBalanceChange(initialBalance, targetBalance) {
  return new Promise((resolve) => {
    const checkBalance = () => {
      let newBalance = getAccountBalance();
      if (newBalance !== null) {
        if (Math.abs(newBalance - initialBalance) >= balanceThreshold || newBalance <= targetBalance + balanceThreshold) {
          console.log(`Balance after transaction: $${newBalance}`);
          resolve(newBalance);
        } else {
          console.log('Waiting for balance change...');
          setTimeout(checkBalance, 1000); // Check every 1 second
        }
      }
    };
    setTimeout(checkBalance, 1000); // Initial delay before checking balance
  });
}

if (window.location.href.includes('https://pocketoption.com/')) {
  addAiHelperButton();
}
