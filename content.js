const PANEL_POSITION_KEY = "seraf-bot-panel-position";
const MINI_POSITION_KEY = "seraf-bot-mini-position";
const MINI_PINNED_KEY = "seraf-bot-mini-pinned";
const BOT_ACTIVE_KEY = "seraf-bot-active";
const PANEL_MINIMIZED_KEY = "seraf-bot-panel-minimized";
const PANEL_VISIBLE_KEY = "seraf-bot-panel-visible";


let dragCleanups = [];


chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "toggle_panel") {
        togglePanel();
    }
});


restorePanelVisibility();


function restorePanelVisibility() {
    const savedVisibility = localStorage.getItem(
        PANEL_VISIBLE_KEY
    );


    if (savedVisibility === "true") {
        togglePanel();
    }
}


async function togglePanel() {
    const existingPanel = document.getElementById("seraf-bot-panel");

    if (existingPanel) {
        removePanel(existingPanel);
        return;
    }


    const panel = document.createElement("div");
    panel.id = "seraf-bot-panel";


    const response = await fetch(
        chrome.runtime.getURL("popup.html")
    );

    const html = await response.text();


    const parser = new DOMParser();

    const popupDocument = parser.parseFromString(
        html,
        "text/html"
    );


    const app = popupDocument.querySelector(".app");
    const miniPanel = popupDocument.querySelector(".mini-panel");


    const headerLogo = app.querySelector(".header-logo img");

    headerLogo.src = chrome.runtime.getURL(
        "logo.png"
    );


    panel.appendChild(app);
    panel.appendChild(miniPanel);

    document.body.appendChild(panel);


    localStorage.setItem(
        PANEL_VISIBLE_KEY,
        JSON.stringify(true)
    );


    restorePanelViewState(panel);


    const visiblePanel =
        panel.classList.contains("is-minimized")
            ? miniPanel
            : app;
    

    playPanelAnimation(
        visiblePanel,
        "seraf-enter"
    );


    const header = panel.querySelector(".header");

    const minimizeButton = panel.querySelector(".minimize-button");

    const closeButton = panel.querySelector(".close-button");

    const mainPowerButton = panel.querySelector(".pause-button");

    const stopButton = panel.querySelector(".stop-button");

    const miniPin = panel.querySelector(".mini-pin");

    const miniPower = panel.querySelector(".mini-power");
    
    const miniMaximize = panel.querySelector(".mini-maximize");


    restorePinnedState(miniPanel, miniPin);

    restorePowerState(panel);


    minimizeButton.addEventListener("click", () => {
        minimizePanel(panel);
        }
    );


    closeButton.addEventListener("click", () => {
        removePanel(panel);
        }
    );


    mainPowerButton.addEventListener("click", () => {
        toggleBotState(panel);
    });


    stopButton.addEventListener("click", () => {
        stopBot(panel);
    });


    const headerDrag = enablePanelDragging(
        panel,
        header,
        PANEL_POSITION_KEY,
        {
            ignoreSelector: "button"
        }
    );


    const miniDrag = enablePanelDragging(
        panel,
        miniPanel,
        MINI_POSITION_KEY,
        {
            ignoreSelector: "button",

            canDrag: () => {
                return !miniPanel.classList.contains(
                    "is-pinned"
                );
            }
        }
    );


    miniPin.addEventListener("click", (event) => {
        event.stopPropagation();

        toggleMiniPin(
            miniPanel,
            miniPin
        );
        }
    );


    miniMaximize.addEventListener("click", (event) => {
        event.stopPropagation();

        restoreFullPanel(panel);
        }
    );


    miniPower.addEventListener("click", (event) => {
        event.stopPropagation();

        toggleBotState(panel);
        }
    );


    dragCleanups.push(
        headerDrag.cleanup,
        miniDrag.cleanup
    );
}


function updateBotUI(panel, isActive) {
    const miniPower = panel.querySelector(".mini-power");

    const miniLogo = panel.querySelector(".mini-logo");

    const statusText = panel.querySelector(".status-text");

    const statusState = panel.querySelector(".status-active");

    const statusIcon = panel.querySelector(".status-icon img");

    const botStatus = panel.querySelector(".bot-status");

    const mainPowerButton = panel.querySelector(".pause-button");


    miniPower.classList.toggle(
        "active",
        isActive
    );


    miniLogo.classList.toggle(
        "inactive",
        !isActive
    )


    statusText.textContent =
        isActive
            ? "Aktywny"
            : "Nieaktywny";
    

    statusState.classList.toggle(
        "inactive",
        !isActive
    );


    botStatus.classList.toggle(
        "inactive",
        !isActive
    );


    mainPowerButton.classList.toggle(
        "inactive",
        !isActive
    );


    mainPowerButton.textContent =
        isActive
            ? "Wstrzymaj"
            : "Uruchom";
    

    const iconPath =
        isActive
            ? "images/icon-active.png"
            : "images/icon-inactive.png";


    statusIcon.src = chrome.runtime.getURL(iconPath);

    miniLogo.src = chrome.runtime.getURL(iconPath);
}


function setBotState(panel, isActive) {
    localStorage.setItem(
        BOT_ACTIVE_KEY,
        JSON.stringify(isActive)
    );


    updateBotUI(
        panel,
        isActive
    );
}


function toggleBotState(panel) {
    const savedState = localStorage.getItem(BOT_ACTIVE_KEY);


    const currentState =
        savedState === null
            ? true
            : JSON.parse(savedState);
    

    setBotState(
        panel,
        !currentState
    );
}


function stopBot(panel) {
    setBotState(
        panel,
        false
    );
}


function restorePowerState(panel) {
    const savedState = localStorage.getItem(
        BOT_ACTIVE_KEY
    );

    const isActive =
        savedState === null
        ? true
        : JSON.parse(savedState);
    
    
    updateBotUI(
        panel,
        isActive
    );
}


function restorePanelViewState(panel) {
    const savedState = localStorage.getItem(
        PANEL_MINIMIZED_KEY
    );


    const isMinimized =
        savedState === null
        ? false
        : JSON.parse(savedState);
    

    if (isMinimized) {
        panel.classList.add(
            "is-minimized"
        );

        restorePosition(
            panel,
            MINI_POSITION_KEY
        );

        return;
    }


    restorePosition(
        panel,
        PANEL_POSITION_KEY
    );
}


function playPanelAnimation(
    element,
    animationClass
) {
    return new Promise((resolve) => {

        element.addEventListener("animationend", () => {
            element.classList.remove(animationClass);

            resolve();
        },
        {
            once: true
        }
    );

    element.classList.add(animationClass);
    });
}


async function minimizePanel(panel) {
    if (
        panel.classList.contains("is-transitioning")
    ) {
        return;
    }


    panel.classList.add("is-transitioning");


    const app = panel.querySelector(".app");

    const miniPanel = panel.querySelector(".mini-panel");


    saveCurrentPosition(
        panel,
        PANEL_POSITION_KEY
    );


    restorePosition(
        panel,
        PANEL_POSITION_KEY
    );


    await playPanelAnimation(
        app,
        "seraf-exit"
    );


    panel.classList.add("is-minimized");


    localStorage.setItem(
        PANEL_MINIMIZED_KEY,
        JSON.stringify(true)
    );


    const savedMiniPosition =
        localStorage.getItem(
            MINI_POSITION_KEY
        );
    

    if (savedMiniPosition) {
        restorePosition(
            panel,
            MINI_POSITION_KEY
        );
    }


    await playPanelAnimation(
        miniPanel,
        "seraf-enter"
    );


    panel.classList.remove("is-transitioning");
}


async function restoreFullPanel(panel) {
    if (
        panel.classList.contains("is-transitioning")
    ) {
        return;
    }


    panel.classList.add("is-transitioning");


    const app = panel.querySelector(".app");

    const miniPanel = panel.querySelector(".mini-panel");


    saveCurrentPosition(
        panel,
        MINI_POSITION_KEY
    );


    await playPanelAnimation(
        miniPanel,
        "seraf-exit"
    );


    panel.classList.remove("is-minimized");


    localStorage.setItem(
        PANEL_MINIMIZED_KEY,
        JSON.stringify(false)
    );


    restorePosition(
        panel,
        PANEL_POSITION_KEY
    );


    await playPanelAnimation(
        app,
        "seraf-enter"
    );


    panel.classList.remove("is-transitioning");
}


function toggleMiniPin(miniPanel, miniPin) {
    const isPinned = miniPanel.classList.toggle("is-pinned");


    miniPin.classList.toggle("active", isPinned);


    localStorage.setItem(
        MINI_PINNED_KEY,
        JSON.stringify(isPinned)
    );
}


function restorePinnedState(miniPanel, miniPin) {
    const savedPinnedState = localStorage.getItem(
        MINI_PINNED_KEY
    );


    if (!savedPinnedState) {
        return;
    }


    const isPinned = JSON.parse(savedPinnedState);


    miniPanel.classList.toggle("is-pinned", isPinned);

    miniPin.classList.toggle("active", isPinned);
}


function saveCurrentPosition(panel, positionKey) {
    const position = panel.getBoundingClientRect();


    const savedPosition = {
        left: position.left,
        top: position.top
    };


    localStorage.setItem(
        positionKey,
        JSON.stringify(savedPosition)
    );
}


function restorePosition(panel, positionKey) {
    const savedPosition = localStorage.getItem(positionKey);


    if (!savedPosition) {
        return;
    }
    

    const position = JSON.parse(savedPosition);


    panel.style.left = `${position.left}px`;
    
    panel.style.top = `${position.top}px`;

    panel.style.transform = "none";

    keepPanelInsideViewport(panel);
}


function keepPanelInsideViewport(panel) {
    const position = panel.getBoundingClientRect();


    const maxLeft = Math.max(window.innerWidth - panel.offsetWidth, 0);

    const maxTop = Math.max(window.innerHeight - panel.offsetHeight, 0);


    const boundedLeft = Math.min(
        Math.max(position.left, 0),
        maxLeft
    );

    const boundedTop = Math.min(
        Math.max(position.top, 0),
        maxTop
    );


    panel.style.left = `${boundedLeft}px`;
    panel.style.top = `${boundedTop}px`;

    panel.style.transform = "none";
}


async function removePanel(panel) {
    if (
        panel.classList.contains("is-transitioning")
    ) {
        return;
    }


    panel.classList.add("is-transitioning");


    localStorage.setItem(
        PANEL_VISIBLE_KEY,
        JSON.stringify(false)
    );


    const visiblePanel = panel.classList.contains("is-minimized")
        ? panel.querySelector(".mini-panel")
        : panel.querySelector(".app");
    
    
    await playPanelAnimation(
        visiblePanel,
        "seraf-exit"
    );


    dragCleanups.forEach(
        (cleanup) => cleanup()
    );

    dragCleanups = [];


    panel.remove();
}


function enablePanelDragging(
    panel,
    handle,
    positionKey,
    options = {}
) {
    let isDragging = false;
    let hasDragged = false;

    let offsetX = 0;
    let offsetY = 0;

    let startX = 0;
    let startY = 0;


    function startDragging(event) {
        if (event.button != 0) {
            return;
        }


        if (
            options.ignoreSelector &&
            event.target.closest(
                options.ignoreSelector
            )
        ) {
            return;
        }


        if (
            options.canDrag &&
            !options.canDrag()
        ) {
            return;
        }


        const panelPosition = panel.getBoundingClientRect();


        offsetX = event.clientX - panelPosition.left;

        offsetY = event.clientY - panelPosition.top;


        startX = event.clientX;
        startY = event.clientY;

        hasDragged = false;


        panel.style.transform = "none";

        panel.style.left = `${panelPosition.left}px`;

        panel.style.top = `${panelPosition.top}px`;


        isDragging = true;
    }


    function movePanel(event) {
        if (!isDragging) {
            return;
        }


        const distanceX =
            Math.abs(
                event.clientX - startX
            );
        
        const distanceY =
            Math.abs(
                event.clientY - startY
            );
        
        
        if (
            distanceX > 3 ||
            distanceY > 3
        ) {
            hasDragged = true;
        }


        const newLeft = event.clientX - offsetX;

        const newTop = event.clientY - offsetY;


        const maxLeft = window.innerWidth - panel.offsetWidth;
        
        const maxTop = window.innerHeight - panel.offsetHeight;


        const boundedLeft = Math.min(
            Math.max(newLeft, 0),
            Math.max(maxLeft, 0)
        );

        const boundedTop = Math.min(
            Math.max(newTop, 0),
            Math.max(maxTop, 0)
        );


        panel.style.left = `${boundedLeft}px`;

        panel.style.top = `${boundedTop}px`;
    }


    function stopDragging() {
        if (!isDragging) {
            return;
        }


        isDragging = false;


        saveCurrentPosition(
            panel,
            positionKey
        );
    }


    handle.addEventListener("mousedown", startDragging);

    document.addEventListener("mousemove", movePanel);

    document.addEventListener("mouseup", stopDragging);


    return {
        consumeDragged() {
            const dragged = hasDragged;

            hasDragged = false;

            return dragged;
        },

        cleanup() {
            handle.removeEventListener("mousedown", startDragging);

            document.removeEventListener("mousemove", movePanel);

            document.removeEventListener("mouseup", stopDragging);
        }
    };
}