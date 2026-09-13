const PANEL_POSITION_KEY = "seraf-bot-panel-position";

let dragCleanup = null;


chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "toggle_panel") {
        togglePanel();
    }
});


async function togglePanel() {
    const existingPanel = document.getElementById("seraf-bot-panel");

    if (existingPanel) {
        if (dragCleanup) {
            dragCleanup();
            dragCleanup = null;
        }

        existingPanel.remove();
        return;
    }


    const panel = document.getElementById("div");
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


    const headerLogo = app.querySelector(".header-logo img");

    headerLogo.src = chrome.runtime.getURL(
        "logo.png"
    );


    const statusIcon = app.querySelector(".status-icon img");

    statusIcon.src = chrome.runtime.getURL(
        "images/icon-active.png"
    );


    panel.appendChild(app);

    document.body.appendChild(panel);


    restorePanelPosition(panel);


    const header = panel.querySelector(".header");

    dragCleanup = enablePanelDragging(
        panel,
        header
    );
}


function restorePanelPosition(panel) {
    const savedPosition = localStorage.getItem(
        PANEL_POSITION_KEY
    );

    if (!savedPosition) {
        return;
    }


    const position = JSON.parse(savedPosition);


    panel.style.left = `${position.left}px`;
    panel.style.top = `${position.top}px`;

    panel.style.transform = "none";
}


function enablePanelDragging(panel, header) {
    let isDragging = false;

    let offsetX = 0;
    let offsetY = 0;


    function startDragging(event) {
        const panelPosition = panel.getBoundingClientRect();


        offsetX = event.clientX - panelPosition.left;
        offsetY = event.clientY - panelPosition.top;


        panel.style.transform = "none";

        panel.style.left = `${panelPosition.left}px`;
        panel.style.top = `${panelPosition.top}px`;


        isDragging = true;
    }


    function movePanel(event) {
        if (!isDragging) {
            return;
        }


        panel.style.left = `${event.clientX - offsetX}px`;
        panel.style.top = `${event.clientY - offsetY}px`;
    }


    function stopDragging() {
        if (!isDragging) {
            return;
        }


        isDragging = false;


        const position = {
            left: panel.offsetLeft,
            top: panel.offsetTop
        };


        localStorage.setItem(
            PANEL_POSITION_KEY,
            JSON.stringify(position)
        );
    }


    header.addEventListener(
        "mousedown",
        startDragging
    );

    document.addEventListener(
        "mousemove",
        movePanel
    );

    document.addEventListener(
        "mouseup",
        stopDragging
    );


    return function cleanup() {
        header.removeEventListener(
            "mousedown",
            startDragging
        );

        document.removeEventListener(
            "mousemove",
            movePanel
        );

        document.removeEventListener(
            "mouseup",
            stopDragging
        );
    };
}