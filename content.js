console.log("Seraf Bot content script loaded");

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "toggle_panel") {

        const existingPanel = document.getElementById("seraf-bot-panel");

        if (existingPanel) {
            existingPanel.remove();
            return;
        }

        const panel = document.createElement("div");
        panel.id = "seraf-bot-panel";

        const header = document.createElement("div");
        header.className = "seraf-bot-header";

        const sidebar = document.createElement("div");
        sidebar.className = "seraf-bot-sidebar";
        header.textContent = "SERAF BOT";

        const content = document.createElement("div");
        content.className = "seraf-bot-content";

        panel.appendChild(header);
        panel.appendChild(sidebar);
        panel.appendChild(content);

        document.body.appendChild(panel);
    }
});