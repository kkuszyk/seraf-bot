console.log("Seraf Bot content script loaded");

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "toggle_panel") {

        const PANEL_POSITION_KEY = "seraf-bot-panel-position";

        const existingPanel = document.getElementById("seraf-bot-panel");

        if (existingPanel) {
            existingPanel.remove();
            return;
        }

        const panel = document.createElement("div");
        panel.id = "seraf-bot-panel";

        const sidebar = document.createElement("div");
        sidebar.className = "seraf-bot-sidebar";
        sidebar.textContent = "SERAF BOT";

        const main = document.createElement("div");
        main.className = "seraf-bot-main";

        const header = document.createElement("div");
        header.className = "seraf-bot-header";

        let isDragging = false;

        header.addEventListener("mousedown", (event) => {
            const panelPosition = panel.getBoundingClientRect();

            const offsetX = event.clientX - panelPosition.left;
            const offsetY = event.clientY - panelPosition.top;

            panel.style.transform = "none";
            panel.style.left = `${panelPosition.left}px`;
            panel.style.top = `${panelPosition.top}px`;

            isDragging = true;

            document.addEventListener("mousemove", (event) => {
                if (!isDragging) return;

                panel.style.left = `${event.clientX - offsetX}px`;
                panel.style.top = `${event.clientY - offsetY}px`
            });

            document.addEventListener("mouseup", () => {
                if (!isDragging) return;

                isDragging = false;

                const position = {
                    left: panel.offsetLeft,
                    top: panel.offsetTop
                };

                localStorage.setItem(
                    PANEL_POSITION_KEY,
                    JSON.stringify(position)
                );
            });
        });

        const content = document.createElement("div");
        content.className = "seraf-bot-content";


        panel.appendChild(sidebar);
        panel.appendChild(main);

        main.appendChild(header);
        main.appendChild(content);

        document.body.appendChild(panel);

        const savedPosition = localStorage.getItem(PANEL_POSITION_KEY);

        if (savedPosition) {
            const position = JSON.parse(savedPosition);

            panel.style.left = `${position.left}px`;
            panel.style.top = `${position.top}px`;
            panel.style.transform = "none";
        }
    }
});