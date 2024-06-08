let blinkIntervalCall;
let blinkIntervalPut;
let failureCount = 0;
let stepIndex = 0;
let steps = [1, 1.92, 3.68, 7.07, 13.6];
let stopAlgorithm = false;

function addAiHelperButton() {
  const sidebarList = document.querySelector('.right-sidebar nav ul');

  if (sidebarList && !document.getElementById('aiHelperButton')) {
    const newListItem = createSidebarButton();
    sidebarList.appendChild(newListItem);

    newListItem.querySelector('a').addEventListener('click', togglePanel);
  } else {
    console.log('Element już istnieje lub nie znaleziono listy <ul> w sidebarze.');
  }
}

function createSidebarButton() {
  const newListItem = document.createElement('li');
  newListItem.innerHTML = `
    <a id="aiHelperButton" class="" style="margin-top:5px;">
      <span>AI Helper</span>
    </a>
  `;
  return newListItem;
}

function togglePanel() {
  let panel = document.getElementById('aiHelperPanel');
  if (panel) {
    panel.classList.toggle('hidden');
  } else {
    createPanel();
  }
}

function createPanel() {
  const panel = document.createElement('div');
  panel.id = 'aiHelperPanel';
  panel.className = 'w-full bg-gray-600 flex flex-col border-t border-gray-200 shadow';
  panel.innerHTML = getPanelHTML();
  document.body.appendChild(panel);

  document.getElementById('closePanelButton').addEventListener('click', () => panel.classList.toggle('hidden'));
  loadTailwindCSS();

  setupPanelEventListeners();
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
      <div id="content_section" class="flex flex-col w-3/4 h-screen p-4 bg-gray-700">
      </div>
    </div>
  `;
}

function loadTailwindCSS() {
  if (!document.getElementById('tailwindCSS')) {
    const link = document.createElement('link');
    link.id = 'tailwindCSS';
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css';
    document.head.appendChild(link);
  }
}

function setupPanelEventListeners() {
  document.getElementById('earn_button').addEventListener('click', () => loadContent(chrome.runtime.getURL('earn.html')));
  document.getElementById('settings_button').addEventListener('click', () => loadContent(chrome.runtime.getURL('settings.html')));
  document.getElementById('premium_account_button').addEventListener('click', () => loadContent(chrome.runtime.getURL('premium.html')));
}

function loadContent(url) {
  fetch(url)
    .then(response => response.text())
    .then(html => {
      document.getElementById('content_section').innerHTML = html;
      addStartEarningButtonListener();
    })
    .catch(err => console.error('Błąd ładowania zawartości:', err));
}

function addStartEarningButtonListener() {
  const startEarningButton = document.getElementById('startEarningButton');
  if (startEarningButton) {
    startEarningButton.addEventListener('click', () => {
      failureCount = 0;
      stepIndex = 0;
      stopAlgorithm = false;
      startEarningAlgorithm();
      console.log('Rozpoczęto zarabianie pieniędzy!');
    });
  } else {
    console.error('Nie znaleziono przycisku startEarningButton');
  }
}

function setMoney(price) {
  return new Promise((resolve, reject) => {
    const priceInput = document.querySelector('.block.block--bet-amount .control__value .value__val input');
    if (priceInput) {
      priceInput.value = `$${price}`;
      priceInput.dispatchEvent(new Event('input', { bubbles: true }));
      priceInput.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`Ustawiono wartość na: $${price}`);
      resolve();
    } else {
      console.error('Element input nie został znaleziony');
      reject('Element input nie został znaleziony');
    }
  });
}

function getAccountBalance() {
  const balanceElement = document.querySelector('.balance-info-block__balance .js-hd.js-balance-demo');
  if (balanceElement) {
    const balance = balanceElement.textContent;
    return parseFloat(balance.replace(',', ''));
  } else {
    console.error('Nie znaleziono elementu z aktualnym stanem konta');
    return null;
  }
}

function observeAccountBalance(callback) {
  const balanceElement = document.querySelector('.balance-info-block__balance .js-hd.js-balance-demo');
  if (balanceElement) {
    const observer = new MutationObserver(callback);
    observer.observe(balanceElement, { childList: true, subtree: true, characterData: true });
    return observer;
  } else {
    console.error('Nie znaleziono elementu do obserwacji stanu konta');
    return null;
  }
}

function startEarningAlgorithm() {
  function executeStep() {
    if (stepIndex >= steps.length || failureCount >= 10 || stopAlgorithm) {
      console.log('Zatrzymano algorytm.');
      return;
    }

    let currentBalance = getAccountBalance();
    if (currentBalance !== null) {
      console.log(`Aktualny stan konta: $${currentBalance}`);
    }

    let price = steps[stepIndex];
    setMoney(price)
      .then(() => clickCallButton())
      .then(() => waitForBalanceChange(currentBalance))
      .then((newBalance) => {
        if (newBalance !== null && currentBalance !== null) {
          let profit = newBalance - currentBalance;
          if (profit > 0) {
            console.log(`Transakcja powiodła się! Zysk: $${profit}`);
            stepIndex++;
          } else {
            console.log(`Transakcja nie powiodła się. Strata: $${-profit}`);
            stepIndex = 0;
            failureCount++;
          }
        }
        if (failureCount < 10) {
          setTimeout(executeStep, 1000); // Poczekaj 1 sekundę przed wykonaniem następnego kroku
        } else {
          console.log('Przekroczono maksymalną liczbę 10 niepowodzeń. Zatrzymano algorytm.');
          stopAlgorithm = true;
        }
      })
      .catch((error) => console.error(error));
  }

  executeStep();
}

function clickCallButton() {
  return new Promise((resolve, reject) => {
    const btnCall = document.querySelector('a.btn.btn-call');
    if (btnCall) {
      btnCall.click();
      console.log('Kliknięto przycisk Call');
      setTimeout(resolve, 10000); // Poczekaj 10 sekund po kliknięciu
    } else {
      console.error('Nie znaleziono przycisku Call');
      reject('Nie znaleziono przycisku Call');
    }
  });
}

function waitForBalanceChange(initialBalance) {
  return new Promise((resolve) => {
    const observer = observeAccountBalance((mutations, observer) => {
      let newBalance = getAccountBalance();
      if (newBalance !== null && newBalance !== initialBalance) {
        console.log(`Aktualny stan konta po transakcji: $${newBalance}`);
        observer.disconnect();
        setTimeout(() => resolve(newBalance), 2000); // Poczekaj dodatkowe 2 sekundy po zmianie balansu
      }
    });
  });
}

if (window.location.href.includes('https://pocketoption.com/')) {
  addAiHelperButton();
}
