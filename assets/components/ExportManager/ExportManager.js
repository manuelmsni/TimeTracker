class ExportManager {

    static instance;
    loadedPromiseResolver;
    loaded;

    html = `
        <div id="export-format-options">
            <button id="basic-timers-option">Basic</button>
            <button id="detailed-timers-option">Detailed</button>
        </div>
        <div>
            <table>
                <thead id="export-header">
                </thead>
                <tbody id="export-selection">
                </tbody>
            </table>
        </div>
        <div id="export-options">
            <button id="export-to-csv">Export to CSV</button>
        </div>
    `;

    exportSelectionHeader;
    exportSelectionContainer;

    formatOptionsContainer;
    basicOptionButton;

    entries;

    descriptionsCache;
    checkInputsCache;

    constructor() {
        this.loaded = new Promise((resolve) => {
            this.loadedPromiseResolver = resolve;
        });
    }
    
    static async getInstance(){
            if (ExportManager.instance == null) {
                ExportManager.instance = new ExportManager();
                await ExportManager.instance.init();
            }
            await ExportManager.instance.loaded;
            return ExportManager.instance;
    }

    async init() {
        await loadStyle('ExportManager');
        this.descriptionsCache = new Map();
        this.checkInputsCache = new Map();
        this.loadedPromiseResolver();
        console.log("ExportManager initialized");
    }

    openExportWindow(){
        var container = document.createElement("div");
        container.id = "export-modal-container";
        container.innerHTML = this.html;

        this.exportSelectionHeader = container.querySelector("#export-header");
        this.exportSelectionContainer = container.querySelector("#export-selection");

        this.formatOptionsContainer = container.querySelector("#export-format-options");
        this.basicOptionButton = container.querySelector("#basic-timers-option");
        this.basicOptionButton.addEventListener("click", this.loadBasicExportSelection.bind(this));
        this.detailedOptionButton = container.querySelector("#detailed-timers-option");
        this.detailedOptionButton.addEventListener("click", this.loadDetailedExportSelection.bind(this));

        this.loadBasicExportSelection();

        var exportToCSV = container.querySelector("#export-to-csv");
        console.log(exportToCSV);
        exportToCSV.addEventListener("click", this.exportToCSV.bind(this));

        Modal.getInstance().then(modal => modal.loadWithContent(container));
    }

    loadBasicExportSelection(){
        if(this.basicOptionButton.classList.contains("active")){
            return;
        }
        TimeTracker.getInstance().then(timeTracker => {
            this.entries = [];
            this.exportSelectionContainer.innerHTML = "";
            this.formatOptionsContainer.querySelectorAll(".active").forEach(button => {
                button.classList.remove("active")
            });
            this.basicOptionButton.classList.add("active");
            this.exportSelectionHeader.innerHTML = `
                <tr>
                    <th>Code</th>
                    <th>Time</th>
                    <th>Description</th>
                    <th>Export</th>
                </tr>
            `;
            timeTracker.timersDataAccumulated.forEach((value, key) => {
                var timer = timeTracker.getTimerById(key);
                var milliseconds;
                if (key == timeTracker.activeTimerLabel.id) {
                    milliseconds = timeTracker.getActiveAccumulatedTime();
                } else{
                    milliseconds = value;
                }
                this.entries.push(new ExportEntry(
                    this.exportSelectionContainer,
                    key,
                    timer.code,
                    milliseconds,
                    timer.timerLabels,
                    this.descriptionsCache.get(key),
                    this.checkInputsCache.get(key)
                ));
            });
        });
    }

    loadDetailedExportSelection(){
        if(this.detailedOptionButton.classList.contains("active")){
            return;
        }
        TimeTracker.getInstance().then(timeTracker => {
            this.entries = [];
            this.exportSelectionContainer.innerHTML = "";
            this.formatOptionsContainer.querySelectorAll(".active").forEach(button => {
                button.classList.remove("active")
            });
            this.detailedOptionButton.classList.add("active");
            this.exportSelectionHeader.innerHTML = `
                <tr>
                    <th>Code</th>
                    <th>Labels</th>
                    <th>Time</th>
                    <th>Description</th>
                    <th>Export</th>
                </tr>
            `;
        });
    }

    async exportToCSV(){
        if(!this.entries || this.entries.filter(entry => entry.checked).length < 1) {
            alert("No entries selected for export");
            return;
        }
        var csv = 'data:text/csv;charset=utf-8,';
        this.entries.forEach(entry => {
            if(entry.checked){
                var time = DateFormatter.formatTimeFromMs(entry.milliseconds);
                csv += entry.code + ';' + entry.labels.join(',') + ';' + entry.description + ';' + time + '\n';
            }
        });
        var encodedUri = encodeURI(csv);
        var link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${DateFormatter.fileNameFormatDate()}_register.csv`);
        document.body.appendChild(link);
        link.click();
    }
}

class ExportEntry {

    parent;

    id;
    code;
    milliseconds;
    labels;

    description;
    checked;

    constructor(parent, id, code, milliseconds, labels = [], description = "", checked = true){
        this.id = id;
        this.parent = parent;
        this.code = code;
        this.milliseconds = milliseconds;
        this.labels = labels;
        this.description = description;
        this.checked = checked;
        this.generateGUI(code, milliseconds);
    }

    generateGUI(registerCode, milliseconds){
        var html = `
            <td>${registerCode}</td>
            <td>${DateFormatter.formatTimeFromMs(milliseconds)}</td>
            <td><textarea class="export-description" style="resize: none;">${this.description}</textarea></td>
            <td><input class="export-selector" type="checkbox"></td>
        `;

        var row = document.createElement("tr");
        row.innerHTML = html;

        var descriptionInput = row.querySelector(".export-description");
        descriptionInput.addEventListener('blur', () => {
            this.description = descriptionInput.value;
            ExportManager.getInstance().then( exportManager => {
                exportManager.descriptionsCache.set(this.id, this.description);
            });
        });

        var checkInput = row.querySelector(".export-selector");
        checkInput.checked = this.checked;
        checkInput.addEventListener("change", () => {
            this.checked = checkInput.checked;
            ExportManager.getInstance().then( exportManager => {
                exportManager.checkInputsCache.set(this.id, this.checked);
            });
        });

        this.parent.appendChild(row);
    }
}

window.ExportManager = ExportManager;