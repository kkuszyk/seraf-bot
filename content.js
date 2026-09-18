const PANEL_POSITION_KEY = "seraf-bot-panel-position";
const MINI_POSITION_KEY = "seraf-bot-mini-position";
const MINI_PINNED_KEY = "seraf-bot-mini-pinned";

let dragCleanups = [];


chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "toggle_panel") {
        togglePanel();
    }
});


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


    const statusIcon = app.querySelector(".status-icon img");
    statusIcon.src = chrome.runtime.getURL("images/icon-active.png");

    const miniLogo = miniPanel.querySelector(".mini-restore img");
    miniLogo.src = chrome.runtime.getURL("logo.png");


    panel.appendChild(app);
    panel.appendChild(miniPanel);

    document.body.appendChild(panel);


    restorePosition(panel, PANEL_POSITION_KEY);


    const header = panel.querySelector(".header");

    const minimizeButton = panel.querySelector(".minimize-button");

    const closeButton = panel.querySelector(".close-button");

    const miniRestore = panel.querySelector(".mini-restore");

    const miniPin = panel.querySelector(".mini-pin");


    restorePinnedState(miniPanel, miniPin);


    minimizeButton.addEventListener("click", () => {
        minimizePanel(panel);
        }
    );


    closeButton.addEventListener("click", () => {
        removePanel(panel);
        }
    );


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
        miniRestore,
        MINI_POSITION_KEY,
        {
            canDrag: () => {
                return !miniPanel.classList.contains(
                    "is-pinned"
                );
            }
        }
    );


    miniRestore.addEventListener("click", () => {
        if (miniDrag.consumeDragged()) {
            return;
        }

        restoreFullPanel(panel);
        }
    );


    miniPin.addEventListener("mousedown", (event) => {
        event.stopPropagation();
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


    dragCleanups.push(
        headerDrag.cleanup,
        miniDrag.cleanup
    );
}


function minimizePanel(panel) {
    saveCurrentPosition(
        panel,
        PANEL_POSITION_KEY
    );


    panel.classList.add("is-minimized");


    const savedMiniPosition = localStorage.getItem(
        MINI_POSITION_KEY
    );

    if (savedMiniPosition) {
        restorePosition(
            panel,
            MINI_POSITION_KEY
        );
    }
}


function restoreFullPanel(panel) {
    saveCurrentPosition(
        panel,
        MINI_POSITION_KEY
    );


    panel.classList.remove("is-minimized");


    restorePosition(
        panel,
        PANEL_POSITION_KEY
    );
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
}


function removePanel(panel) {
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


        panel.style.left = `${event.clientX - offsetX}px`;

        panel.style.top = `${event.clientY - offsetY}px`;
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