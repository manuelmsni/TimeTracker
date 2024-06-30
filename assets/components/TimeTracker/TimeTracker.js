class TimeTracker {
    static instance;
    loadedPromiseResolver;
    loaded;
    html =`
        <div id="time-tracker-header">
            <h1>Time Tracker</h1>
            <h3 id="time-tracker-total-time">00:00:00</h3>
            <button id="time-tracker-pause">Pause</button>
        </div>
        <div id='timer-container'>
        </div>
        <div id='time-tracker-footer'>
            <button id="time-tracker-new">New</button>
        </div>
    `;
    container;
    totalTime = 0;
    totalTimeLabel;
    pauseButton;
    newTimerButton;
    timerContainer;

    timers;
    timersData;
    timersDataAccumulated;

    activeTimerLabel;

    historicTable;


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

        this.loadedPromiseResolver();
        console.log("TimeTracker. initialized");
    }

    initBaseHtml(){
        this.container = document.createElement('section');
        this.container.id = 'time-tracker';
        this.container.innerHTML = this.html;

        this.totalTimeLabel = this.container.querySelector('#time-tracker-total-time');
        this.pauseButton = this.container.querySelector('#time-tracker-pause');
        this.pauseButton.addEventListener('click', this.pause.bind(this));

        this.timerContainer = this.container.querySelector('#timer-container');

        this.newTimerButton = this.container.querySelector('#time-tracker-new');
        this.newTimerButton.addEventListener('click', this.newTimer.bind(this));

        this.newTimer(newObjectId(), 'Daily', ['daily']);
        this.newTimer(newObjectId(), 'Descanso', ['descanso']);

        document.body.appendChild(this.container);
    }

    pause(){
        let pauseTimer = this.timers.find(timer => timer.id === 'pause');

        if (!pauseTimer) {
            pauseTimer = this.newTimer('pause', 'Pausa', ['pause']);
        }

        pauseTimer.start();
    }

    newTimer(id = newObjectId(), code = null, timerLabels = []){
        const timer = new Timer(this.timerContainer, this.timersData, id, code, timerLabels);
        this.timers.push(timer);
        return timer;
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

        let formattedTime = this.formatTime(currentTotalForThatRegister);

        this.activeTimerLabel = document.getElementById(previousTimeRegister[0]);
        this.activeTimerLabel.innerText = formattedTime;
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
        this.timerCodeInput.addEventListener('blur', () => {
            this.code = this.timerCodeInput.value
        });

        this.timerLabelsInput = this.container.querySelector('.timer-labels');
        this.timerLabelsInput.value = this.timerLabels.join(', ');
        this.timerLabelsInput.addEventListener('blur', () => {
            this.timerLabels = this.timerLabelsInput.value
            .split(',')
            .map(label => label.trim().toLowerCase());
        });

        if(this.parentElement){
            this.parentElement.appendChild(this.container);
        }
    }

    async start(){
        if(this.container.classList.contains('active-timer')){
            return;
        }
        this.timersData.push([this.id, this.code, this.timerLabels, DateFormatter.getDateTime()]);
        document.body.querySelectorAll('.active-timer').forEach(element => element.classList.remove('active-timer'));
        this.container.classList.add('active-timer');
        console.log(this.timersData);

        (await TimeTracker.getInstance()).addRegister([this.code, DateFormatter.getDateTime()]);
    }
}

window.TimeTracker = TimeTracker;