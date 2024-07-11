class HistoricTable {
    static instance;
    loadedPromiseResolver;
    loaded;

    html = `
        <table id="historic-table">
            <thead>
                <tr>
                    <th>Code</th>
                    <th>Labels</th>
                    <th>Time</th>
                </tr>
            </thead>
            <tbody id="historic-table-body">
            </tbody>
        </table>
    `;

    data;
    container;
    tableBody;

    constructor() {
        this.loaded = new Promise((resolve) => {
            this.loadedPromiseResolver = resolve;
        });
        const storedData = localStorage.getItem('historicTableData');
        this.data = storedData ? JSON.parse(storedData) : {};
    }

    static async getInstance(){
        if (HistoricTable.instance == null) {
            HistoricTable.instance = new HistoricTable();
            await HistoricTable.instance.init();
        }
        await HistoricTable.instance.loaded;
        return HistoricTable.instance;
    }

    async init() {
        await loadStyle('HistoricTable');
        this.initBaseHtml();
        this.loadedPromiseResolver();
        console.log("HistoricTable initialized");
    }

    initBaseHtml(){
        this.container = document.createElement('section');
        this.container.id = 'historic-table-container';
        this.container.innerHTML = this.html;
        document.body.appendChild(this.container);
    
        this.tableBody = document.querySelector('#historic-table-body');

        document.getElementById('content').appendChild(this.container);
    }

    addRegister(register){
        const date = DateFormatter.getDate();
        if (!this.data[date]) {
            this.data[date] = [];
        }
        this.data[date].push(register);
        this.saveData();
        this.generateRegisterGUI(register);
    }

    saveData() {
        const serializedData = JSON.stringify(this.data);
        localStorage.setItem('historicTableData', serializedData);
    }

    generateRegisterGUI(register) {
        const html = `
            <tr>
                <td class="code_${register[0]}">${register[1]}</td>
                <td>${register[2].map(label => `<span class="label">${label}</span>`).join(" ")}</td>
                <td>${formatDateTime(register[3])}</td>
            </tr>
        `;
        this.tableBody.insertAdjacentHTML('beforeend', html);
    }

    getTodayRegisters() {
        return this.data[DateFormatter.getDate()] || [];
    }
}

window.HistoricTable = HistoricTable;