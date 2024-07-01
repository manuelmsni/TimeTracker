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
        this.data = {};
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
        var dayData = this.data[DateFormatter.getDate()];
        if(!dayData){
            dayData = [];
        }
        dayData.push(register);

        const html = `
            <tr>
                <td class="code_${register[0]}">${register[1]}</td>
                <td>${register[2]}</td>
                <td>${register[3]}</td>
            </tr>
        `;
        this.tableBody.insertAdjacentHTML('beforeend', html);
    }
}

window.HistoricTable = HistoricTable;