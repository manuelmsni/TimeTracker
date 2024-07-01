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
    totalTime = 0;
    totalTimeLabel;
    pauseButton;
    exportButton;
    newTimerButton;
    timerContainer;

    timers;
    timersData;
    timersDataAccumulated;

    activeTimerLabel;

    historicTable;

    updateTimersEachSecond = true;


    constructor() {
        this.loaded = new Promise((resolve) => {
            this.loadedPromiseResolver = resolve;
        });
        this.timers = [];
        this.timersData = [];
        this.timersDataAccumulated = new Map();
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
        await loadStyle('TimeTracker');
        this.historicTable = await getInstance('HistoricTable');

        this.initBaseHtml();

        if(this.updateTimersEachSecond){
            this.updateActiveTimerEachSecond();
        }
        this.loadedPromiseResolver();

        window.addEventListener('beforeunload', function (e) {
            if(this.timersData.length < 1 && timersDataAccumulated.size < 1) {
                return;
            }
            e.preventDefault(); 
            e.returnValue = '';
            return 'Si sales de esta página, podrías perder tus datos.';
        }.bind(this));

        console.log("TimeTracker. initialized");
    }

    initBaseHtml(){
        this.container = document.createElement('section');
        this.container.id = 'time-tracker';
        this.container.innerHTML = this.html;

        this.totalTimeLabel = this.container.querySelector('#time-tracker-total-time');

        this.pauseButton = this.container.querySelector('#time-tracker-pause');
        this.pauseButton.addEventListener('click', this.pause.bind(this));

        this.exportButton = this.container.querySelector('#time-tracker-export');
        this.exportButton.addEventListener('click', () => {
            var csv = 'data:text/csv;charset=utf-8,';
            this.timers.forEach(timer => {
                var time;
                if (timer.id == this.activeTimerLabel.id) {
                    time = this.getActiveAccumulatedTime();
                } else{
                    time = this.timersDataAccumulated.get(timer.id);
                }
                time = (time ? this.formatTime(time) : this.formatTime(0));
                csv += timer.code + ';' + timer.timerLabels.join(',') + ';' + time + '\n';
            });
            var encodedUri = encodeURI(csv);
            var link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `${DateFormatter.fileNameFormatDate()}_register.csv`);
            document.body.appendChild(link);
            link.click();
        });


        this.timerContainer = this.container.querySelector('#timer-container');

        this.newTimerButton = this.container.querySelector('#time-tracker-new');
        this.newTimerButton.addEventListener('click', () => {
            this.newTimer(newObjectId(), null, []);
        });

        this.newTimer(newObjectId(), 'Daily', ['daily']);
        this.newTimer(newObjectId(), 'Descanso', ['descanso']);

        document.body.prepend(this.container);
    }

    pause(){
        let pauseTimer = this.getTimerByCode('pause');

        if (!pauseTimer) {
            pauseTimer = this.newTimer(newObjectId(), 'Pausa', ['pause']);
        }

        pauseTimer.start();
    }

    newTimer(id = newObjectId(), code = null, timerLabels = []){
        if (id instanceof Event) {
            id = newObjectId();
        }
        if(code === null) {
            var count = 0;
            // Check correctly for undefined here
            while(this.getTimerByCode(`timer-${count}`) !== undefined) {
                count++;
            }
            code = `Timer${count}`;
        }
        if (code != null && this.getTimerByCode(code)) {
            return;
        }
        const timer = new Timer(this.timerContainer, this.timersData, id, code, timerLabels);
        this.timers.push(timer);
        return timer;
    }

    getTimerByCode(code){
        return this.timers.find(timer => timer.code === code);
    }

    addRegister(register){
        this.historicTable.addRegister(register);
        this.updateTimeLabel();
    }

    updateTimeLabel() {
        var lastTimerIndex = this.timersData.length - 1;
        if (lastTimerIndex < 0) {
            return;
        }

        var lastTimeRegister = this.timersData[lastTimerIndex];
        var time = DateFormatter.fromString(lastTimeRegister[3]).getTime();

        if (lastTimerIndex == 0) {
            return;
        }

        var previousTimeRegister = this.timersData[lastTimerIndex - 1];
        var previousTime = DateFormatter.fromString(previousTimeRegister[3]).getTime();

        var timeDiff = time - previousTime;
        var currentTotalForThatRegister = this.timersDataAccumulated.get(previousTimeRegister[0]) || 0;
        currentTotalForThatRegister += timeDiff;
        this.timersDataAccumulated.set(previousTimeRegister[0], currentTotalForThatRegister);

        if(!this.updateTimersEachSecond){
            this.activeTimerLabel.textContent = this.formatTime(currentTotalForThatRegister);
            this.totalTime = Array.from(this.timersDataAccumulated.values()).reduce((acc, time) => acc + time, 0);
        }
        
    }

    mayUpdate = false;

    updateActiveTimerEachSecond(){
        setInterval(() => {
            if(!this.activeTimerLabel || !this.mayUpdate){
                return;
            }
            var accumulatedTime = this.timersDataAccumulated.get(this.activeTimerLabel.id);
            if(!accumulatedTime){
                accumulatedTime = 0;
            }

            var lastTimeRegister = this.timersData[this.timersData.length - 1];
            var lastTime = DateFormatter.fromString(lastTimeRegister[3]).getTime();

            var timeSinceLastRegister = new Date() - lastTime;

            var totalTime = accumulatedTime + timeSinceLastRegister;

            this.activeTimerLabel.innerText = this.formatTime(totalTime);

            this.totalTime = Array.from(this.timersDataAccumulated.values()).reduce((acc, time) => acc + time, 0);
            this.totalTimeLabel.innerText = this.formatTime(this.totalTime + timeSinceLastRegister);
        }, 1000);
    }

    getActiveAccumulatedTime(){
        var accumulatedTime = this.timersDataAccumulated.get(this.activeTimerLabel.id);
        if(!accumulatedTime){
            accumulatedTime = 0;
        }

        var lastTimeRegister = this.timersData[this.timersData.length - 1];
        var lastTime = DateFormatter.fromString(lastTimeRegister[3]).getTime();

        var timeSinceLastRegister = new Date() - lastTime;

        return accumulatedTime + timeSinceLastRegister;
    }

    formatTime(ms) {
        let hours = Math.floor(ms / (1000 * 60 * 60));
        let minutes = Math.floor((ms / (1000 * 60)) % 60);
        let seconds = Math.floor((ms / 1000) % 60);
        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':');
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
    timersData;

    parentElement;
    container;
    timerCodeInput;
    timerLabelsInput;
    timerStartButton;
    timeLabel;

    id;
    code;
    timerLabels;
    
    
    constructor(parentElement, timersData, id, code = "", timerLabels = []) {
        this.parentElement = parentElement;
        this.timersData = timersData;
        this.timerLabels = timerLabels;
        this.id = id;
        this.code = code;

        this.init();
    }
    init() {
        this.initBaseHtml();
    }
    initBaseHtml(){
        this.container = document.createElement('div');
        this.container.classList.add('timer');
        this.container.innerHTML = this.html;

        this.timeLabel = this.container.querySelector('.time-label');
        this.timeLabel.id = this.id;

        this.timerStartButton = this.container.querySelector('.timer-start');
        this.timerStartButton.addEventListener('click', this.start.bind(this));

        this.timerCodeInput = this.container.querySelector('.timer-code');
        this.timerCodeInput.value = this.code;
        this.timerCodeInput.addEventListener('blur', async () => {
            var code = this.timerCodeInput.value;
            if(this.code == code) {
                return;
            }
            TimeTracker.getInstance().then( timeTracker => {
                if(timeTracker.getTimerByCode(code) === undefined){
                    document.querySelectorAll(`.code_${this.id}`).forEach(element => {
                        element.innerText = code;
                    });
                    this.code = code;
                } else {
                    this.timerCodeInput.value = this.code;
                    alert('Ya existe un timer con ese código');
                }
            });
        });

        this.timerLabelsInput = this.container.querySelector('.timer-labels');
        this.timerLabelsInput.value = this.timerLabels.join(', ');
        this.timerLabelsInput.addEventListener('blur', () => {
            var labels = this.timerLabelsInput.value
                .split(',')
                .map(label => label.trim().toLowerCase())
            if(labels.equals(this.timerLabels)){
                return;
            }
            this.timersData.push([this.id, this.code, this.timerLabels, DateFormatter.getDateTime()]);
            TimeTracker.getInstance().then(timeTracker => {
                if(!this.container.classList.contains('active-timer')){
                    return;
                }
                timeTracker.addRegister([this.id, this.code, this.timerLabels, DateFormatter.getDateTime()])
            });
            this.timerLabels = labels;
        });

        if(this.parentElement){
            this.parentElement.appendChild(this.container);
        }
    }

    async start(){
        if(this.container.classList.contains('active-timer')){
            return;
        }
        (await TimeTracker.getInstance()).mayUpdate = false;
        this.timersData.push([this.id, this.code, this.timerLabels, DateFormatter.getDateTime()]);
        document.body.querySelectorAll('.active-timer').forEach(element => element.classList.remove('active-timer'));
        this.container.classList.add('active-timer');
        console.log(this.timersData);

        (await TimeTracker.getInstance()).addRegister([this.id, this.code, this.timerLabels, DateFormatter.getDateTime()]);

        (await TimeTracker.getInstance()).activeTimerLabel = document.getElementById(this.id);

        (await TimeTracker.getInstance()).mayUpdate = true;
    }

}

window.TimeTracker = TimeTracker;