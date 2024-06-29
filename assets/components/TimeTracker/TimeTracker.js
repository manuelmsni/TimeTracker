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
    constructor() {
        this.loaded = new Promise((resolve) => {
            this.loadedPromiseResolver = resolve;
        });
        this.timers = [];
        this.timersData = [];
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
        this.pauseButton.addEventListener('click', this.pause);

        this.timerContainer = this.container.querySelector('#timer-container');

        this.newTimerButton = this.container.querySelector('#time-tracker-new');
        this.newTimerButton.addEventListener('click', this.newTimer.bind(this));

        this.newTimer();

        document.body.appendChild(this.container);
    }
    pause(){
        console.log('pause');
    }

    newTimer(){
        const timer = new Timer(this.timerContainer, this.timersData);
        this.timers.push(timer);
    }

    updateTimeLabels() {
        
    }
}

class Timer {
    html =`
        <h4 class="time-label">00:00:00</h4>
        <div class="inputGroup">
            <input type="text" required="" autocomplete="off" class="timer-input">
            <label>Code</label>
        </div>
        <button class="timer-start">Start</button>
    `;
    parentElement;
    container;
    timerStartButton;
    id;
    timersData;
    timeLabel;
    constructor(parentElement, timersData, id = newObjectId()) {
        this.id = id;
        this.parentElement = parentElement;
        this.timersData = timersData;
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

        if(this.parentElement){
            this.parentElement.appendChild(this.container);
        }
    }

    start(){
        if(this.container.classList.contains('active-timer')){
            return;
        }
        this.timersData.push([this.id, this.code, DateFormatter.getTime()]);
        document.body.querySelectorAll('.active-timer').forEach(element => element.classList.remove('active-timer'));
        this.container.classList.add('active-timer');
        console.log(this.timersData);
    }
}

class DateFormatter{
    static getTime(date = new Date()){
        date = new Date(date);
        return `${date.getDay()}/${date.getMonth()}/${date.getFullYear()}  ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    }
    static fromString(text){
        const parts = text.split(' ');
        const date = parts[0].split('/');
        const time = parts[1].split(':');
        return new Date(date[0], date[1], date[2], time[0], time[1], time[2]);
    }
}

window.TimeTracker = TimeTracker;