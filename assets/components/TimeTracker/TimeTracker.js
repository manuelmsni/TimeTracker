class TimeTracker {
    static instance;
    loadedPromiseResolver;
    loaded;

    html =`
        <div id="time-tracker-header">
            <h1>Time Tracker</h1>
            <h3><span class="light">Total:</span> <span id="time-tracker-total-time">00:00:00</span></h3>
            
            <button id="time-tracker-pause">Pause</button>
        </div>
        <div id='timer-container'>
        </div>
        <div id='time-tracker-footer'>
            <button id="time-tracker-new">New</button>
            <button id="time-tracker-export">Export</button>
        </div>
    `;

    container;
    totalTimeLabel;
    pauseButton;
    exportButton;
    newTimerButton;
    timerContainer;

    historicTable;

    updateTimersEachSecond = true;

    constructor() {
        this.loaded = new Promise((resolve) => {
            this.loadedPromiseResolver = resolve;
        });
        this.timers = [];
    }

    static async getInstance(){
        if (TimeTracker.instance == null) {
            TimeTracker.instance = new TimeTracker();
            await TimeTracker.instance.init();
        }
        await TimeTracker.instance.loaded;
        return TimeTracker.instance;
    }

    async init() {
        await this.initializeDependencies();

        this.initGUI();

        if(this.updateTimersEachSecond){
            this.updateActiveTimerEachSecond();
        }
        this.loadedPromiseResolver();

        window.addEventListener('beforeunload', function (e) {
            if(this.getTotalTime() < 1) {
                return;
            }
            e.preventDefault(); 
            e.returnValue = '';
            return 'Si sales de esta página, podrías perder tus datos.';
        }.bind(this));

        console.log("TimeTracker. initialized");
    }

    async initializeDependencies(){
        await loadStyle('TimeTracker');
        this.historicTable = await getInstance('HistoricTable');
    }

    initGUI(){
        this.container = document.createElement('section');
        this.container.id = 'time-tracker';
        this.container.innerHTML = this.html;

        this.totalTimeLabel = this.container.querySelector('#time-tracker-total-time');

        this.pauseButton = this.container.querySelector('#time-tracker-pause');
        this.pauseButton.addEventListener('click', this.pause.bind(this));

        this.exportButton = this.container.querySelector('#time-tracker-export');
        this.exportButton.addEventListener('click', async () => {
            getInstance('ExportManager').then(exportManager => exportManager.openExportWindow());
        });

        this.timerContainer = this.container.querySelector('#timer-container');

        this.newTimerButton = this.container.querySelector('#time-tracker-new');
        this.newTimerButton.addEventListener('click', () => {
            this.newTimer(newObjectId(), null, []);
        });

        this.initTodayData();
        
        document.getElementById('content').prepend(this.container);
    }

    initTodayData() {
        var todayRegisters = this.historicTable.getTodayRegisters();

        if (todayRegisters.length == 0) {
            this.newTimer('daily', 'Daily', ['daily']);
            this.newTimer('descanso', 'Descanso', ['descanso']);
        } else {
            for(var i = 0; i < todayRegisters.length; i++){
                var register = todayRegisters[i];
                this.updateTimersEachSecond = false;

                var id = register[0];
                var code = register[1];
                var labels = register[2];
                var time = register[3];

                var timer = this.getTimerById(id);
                if(timer == null){
                    timer = this.newTimer(id, code, labels);
                } else {
                    timer.timerLabels = labels;
                    timer.timerLabelsInput.value = labels.join(', ');
                }

                if(i > 0){
                    var previousRegister = todayRegisters[i - 1];
                    var lastRegisterId = previousRegister[0];
                    var previousTime = previousRegister[3];
                    var timeDifference = time - previousTime;
                    var previousTimer = this.getTimerById(lastRegisterId);
                    this.addTime(previousTimer, timeDifference);
                }

                this.historicTable.generateRegisterGUI(register);
                
                this.activeTimer = timer;

                this.updateTimersEachSecond = true;
            }
            if(!this.getTimerById('daily')){
                this.newTimer('daily', 'Daily', ['daily']);
            }
            if(!this.getTimerById('descanso')){
                this.newTimer('descanso', 'Descanso', ['descanso']);
            }
        }
        
    }

    timers;
    registers;
    activeTimer;

    getTimerById(id){
        return this.timers.find(timer => timer.id === id);
    }

    getTimerByCode(code){
        return this.timers.find(timer => timer.code === code);
    }

    newTimer(id = newObjectId(), code = null, timerLabels = []){
        if (id instanceof Event) {
            id = newObjectId();
        }
        if(code === null) {
            code = this.generateNewTimerCode();
        } else if (this.getTimerByCode(code)) {
            alert("Code already in use");
            return;
        }
        const timer = new Timer(this.timerContainer, id, code, timerLabels);
        this.timers.push(timer);
        return timer;
    }

    generateNewTimerCode(){
        var count = 0;
        while(this.getTimerByCode(`Timer${count}`) !== undefined) {
            count++;
        }
        return `Timer${count}`;
    }

    setActiveTimer(timer){
        this.updateTimersEachSecond = false;
        this.addRegister(timer);
        this.activeTimer = timer;
        this.updateTimersEachSecond = true;
    }

    getTimeInMilliseconds(){
        const now = new Date();
        return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours() + 2, now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
    }

    addRegister(timer){
        var previousTimer = this.activeTimer;
        var time = this.getTimeInMilliseconds();
        var register = [timer.id, timer.code, timer.timerLabels, time];
        var timeDifference = time - (this.getLastRegisterTime() || time);
        
        if(previousTimer){
            this.addTime(previousTimer, timeDifference);
        }
        this.historicTable.addRegister(register);
    }

    updateTimerLabels(timer, newLabels){
        if(!this.activeTimer || this.activeTimer.id != timer.id){
            return;
        }
        var time = this.getTimeInMilliseconds();
        var register = [timer.id, timer.code, newLabels, time];
        var timeDifference = time - (this.getLastRegisterTime() || time);
        
        this.addTime(timer, timeDifference);
        this.historicTable.addRegister(register); 
    }

    addTime(timer, timeDifference){
        timer.addTime(timeDifference);
    }

    getLastRegister(){
        var registers = this.historicTable.getTodayRegisters();
        if(!registers){
            return null;
        }
        return registers[registers.length - 1];
    }

    getLastRegisterId(){
        var lastRegister = this.getLastRegister();
        if(!lastRegister){
            return null;
        }
        return this.getLastRegister()[0];
    }

    getLastRegisterTime(){
        var lastRegister = this.getLastRegister();
        if(!lastRegister){
            return null;
        }
        return this.getLastRegister()[3];
    }

    getTimeSinceLastRegister(){
        var time = this.getTimeInMilliseconds();
        return time - (this.getLastRegisterTime() || time);
    }

    getBasicAccumulatedTime(id){
        var timer = this.getTimerById(id);
        var time = timer.totalTime;
        if(this.activeTimer && id == this.activeTimer.id){
            time += this.getTimeSinceLastRegister(); 
        }
        return time;
    }

    getTotalTime(){
        return this.getTimeSinceLastRegister() + this.timers.reduce((acc, timer) => acc + timer.totalTime, 0);
    }

    updateActiveTimerEachSecond(){
        setInterval(() => {
            if(!this.activeTimer || !this.updateTimersEachSecond){
                return;
            }
            this.activeTimer.timeLabel.innerText = formatTimeFull(this.getBasicAccumulatedTime(this.activeTimer.id));
            this.totalTimeLabel.innerText = formatTimeFull(this.getTotalTime());
        }, 1000);
    }

    pause(){
        let pauseTimer = this.getTimerById('pause');
        if (!pauseTimer) {
            pauseTimer = this.newTimer('pause', 'Salida');
        }
        pauseTimer.start();
    }
    
}

class Timer {
    html =`
        <div class="inputGroup">
            <input type="text" required="" autocomplete="off" class="timer-code">
            <label>Code</label>
        </div>
        <div class="inputGroup">
            <input type="text" required="" autocomplete="off" class="timer-labels">
            <label>Labels</label>
        </div>
        <h4 class="time-label">00:00:00</h4>
        <button class="timer-start">Start</button>
    `;

    parentElement;
    container;
    timerCodeInput;
    timerLabelsInput;
    timerStartButton;
    timeLabel;

    id;
    code;
    timerLabels;

    totalTime;
    totalTimeByLabels;
    
    constructor(parentElement, id, code = "", timerLabels = []) {
        this.parentElement = parentElement;
        this.timerLabels = timerLabels.sort();
        this.id = id;
        this.code = code;

        this.totalTime = 0;
        this.totalTimeByLabels = new Map();

        this.init();
    }

    init() {
        this.initGUI();
    }

    initGUI(){
        this.container = document.createElement('div');
        this.container.classList.add('timer');
        this.container.innerHTML = this.html;

        this.timeLabel = this.container.querySelector('.time-label');
        this.timeLabel.id = this.id;

        this.timerStartButton = this.container.querySelector('.timer-start');
        this.timerStartButton.addEventListener('click', this.start.bind(this));

        this.timerCodeInput = this.container.querySelector('.timer-code');
        this.timerCodeInput.value = this.code;
        this.timerCodeInput.addEventListener('blur', this.codeInputController.bind(this));

        this.timerLabelsInput = this.container.querySelector('.timer-labels');
        this.timerLabelsInput.value = this.timerLabels.join(', ');
        this.timerLabelsInput.addEventListener('blur', this.labelInputController.bind(this));

        if(this.parentElement){
            this.parentElement.appendChild(this.container);
        }
    }

    codeInputController(){
        var code = this.timerCodeInput.value;
        if(this.code == code) {
            return;
        }
        TimeTracker.getInstance().then( timeTracker => {
            if(timeTracker.getTimerByCode(code) === undefined){
                document.querySelectorAll(`.code_${this.id}`).forEach(element => {
                    element.innerText = code;
                });
                timeTracker.historicTable.editRegisterCode(this.id, code);
                this.code = code;
            } else {
                this.timerCodeInput.value = this.code;
                alert('Ya existe un timer con ese código');
            }
        });
    }

    labelInputController(){
        var labels = this.timerLabelsInput.value
            .split(',')
            .map(label => label.trim().toLowerCase())
            .filter(label => label !== '')
            .sort();
        if(labels.equals(this.timerLabels)){
            this.timerLabelsInput.value = this.timerLabels.join(', ');
            return;
        }
        TimeTracker.getInstance().then(timeTracker => {
            timeTracker.updateTimerLabels(this, labels)
        });
        this.timerLabels = labels;
        this.timerLabelsInput.value = labels.join(', ');
    }

    async start(){
        TimeTracker.getInstance().then(timeTracker => {
            if(timeTracker.activeTimer){
                if(this.id == timeTracker.activeTimer.id){
                    return;
                }
                timeTracker.activeTimer.container.classList.remove('active-timer');
            }
            this.container.classList.add('active-timer');
            timeTracker.setActiveTimer(this);
        });
    }

    addTime(time){
        this.totalTime += time;
        this.timeLabel.textContent = formatTimeFull(this.totalTime);
        var labels = this.getLabelsAsString();
        var timeByLabel =  this.totalTimeByLabels.get(labels) || 0;
        this.totalTimeByLabels.set(labels, timeByLabel += time);
    }

    getLabelsAsString(labels = this.timerLabels){
        return labels.sort().join(',');
    }

    getDetailedAccumulatedTime(labels){
        return this.totalTimeByLabels.get(labels) || 0;
    }

}

window.TimeTracker = TimeTracker;