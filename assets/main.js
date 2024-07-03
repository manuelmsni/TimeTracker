/* * * * * * * * * * * *
 *                     *
 *  Errors Management  *
 *                     *
 * * * * * * * * * * * */

class CustomError extends Error {
    constructor(message, name = 'BaseCustomError') {
        super(message);
        this.name = error.name;
    }
}

class FetchError extends CustomError {
    constructor(message = 'Resource can not be fetched', name = 'FetchError') {
        super(message, name);
    }
}

class ResourceNotFound extends FetchError {
    constructor(message = 'Resource not found', name = 'ResourceNotFound') {
        super(message, name);
    }
}

/* * * * * * * * * * * * * * *
 *                           *
 *  Useful String functions  *
 *                           *
 * * * * * * * * * * * * * * */

String.prototype.isBlank = function() {
    console.log(this);
    if (this.trim().length == 0) return true;
    return /^[ \t\n\r\x0B\x0C]*$/.test(this);
};
  
String.prototype.capitalize = function(){
    if(this == null || this == undefined) return null;
    if(this.trim().length == 0) return this;
    return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.isNullOrEmpty = function(){
    if (str == null || str == undefined) return true;
    if (str.length == 0) return true;
    return /^[ \t\n\r\x0B\x0C]*$/.test(str);
}



/* * * * * * * * * * * * * * *
 *                           *
 *  Useful Arrays functions  *
 *                           *
 * * * * * * * * * * * * * * */

Array.prototype.equals = function(otherArray) {
    if (!otherArray || this.length !== otherArray.length) {
      return false;
    }
  
    const sortedThis = this.slice().sort();
    const sortedOther = otherArray.slice().sort();
  
    for (let i = 0; i < sortedThis.length; i++) {
      if (sortedThis[i] !== sortedOther[i]) {
        return false;
      }
    }
  
    return true;
  };

/* * * * * * * * * * * * * *
 *                         *
 *  Time format functions  *
 *                         *
 * * * * * * * * * * * * * */

function formatTime(ms) {
    let totalSeconds = Math.floor(ms / 1000);
    let seconds = totalSeconds % 60;
    let totalMinutes = Math.floor(totalSeconds / 60);
    let minutes = totalMinutes % 60;
    let totalHours = Math.floor(totalMinutes / 60);
    let hours = totalHours % 24;  // Horas restantes del día

    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':');
}

function formatDate(ms) {
    date = new Date(ms);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function formatDateTime(ms) {
    date = new Date(ms);
    return `${formatDate(date)} ${formatTime(ms)}`;
}

/* * * * * * * * * * * * * * * *
 *                             *
 *  General purpose functions  *
 *                             *
 * * * * * * * * * * * * * * * */

function newObjectId() {
    const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
    let objectId = timestamp;
    const characters = '0123456789abcdef';
    // 16 random characters to reach 24
    for (let i = 0; i < 16; i++) {
        objectId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return objectId;
}

/* * * * * * * * * * * * * * * * * * *
 *                                   *
 *  Dependency management functions  *
 *                                   *
 * * * * * * * * * * * * * * * * * * */

async function loadStyle(componentName) {
    return new Promise((resolve, reject) => {
        const asset = document.createElement('link');
        asset.rel = 'stylesheet';
        asset.href = `assets/components/${componentName}/${componentName}.css`;
        asset.onload = () => resolve();
        asset.onerror = () => reject(new ResourceNotFound(`Error al cargar ${path}`));
        document.head.appendChild(asset);
    });
}

async function require(componentName) {
    return new Promise((resolve, reject) => {
        const asset = document.createElement('script');
        asset.type = 'text/javascript';
        asset.src = `assets/components/${componentName}/${componentName}.js`;
        asset.onload = () => resolve();
        asset.onerror = () => reject(new ResourceNotFound(`Error al cargar ${path}`));
        document.head.appendChild(asset);
    });
}

async function getInstance(className) {
    if (typeof window[className] === 'undefined') {
        try {
            await require(className);
        } catch (error) {
            console.error(`Error al cargar ${componentName}: ${error.message}`);
            throw error;
        }
    }
    var instance = await window[className].getInstance();
    return await instance;
}

async function loadDependencies(){
    
    await Promise.all([
        getInstance('TimeTracker'),
        getInstance('HistoricTable'),
        getInstance('Modal')
    ]);

}

async function load() {
    try {
        await loadDependencies();
    } catch (error) {
        console.error(error);
    }

    Modal.getInstance().then(modal=>modal.showMessage('La aplicación se encuentra en desarrollo. Podría haber funcionalidades incompletas.'));
}

class DateFormatter {
    static getDate(date = new Date()) {
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    }

    static getTime(date = new Date()) {
        return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    }

    static getDateTime(date = new Date()) {
        return `${this.getDate(date)} ${this.getTime(date)}`;
    }

    static fromString(text) {
        const parts = text.split(' ');
        const date = parts[0].split('/');
        const time = parts[1].split(':');
        return new Date(
            parseInt(date[2], 10), 
            parseInt(date[1], 10) - 1, 
            parseInt(date[0], 10),
            parseInt(time[0], 10),
            parseInt(time[1], 10),
            parseInt(time[2], 10)
        );
    }

    static fileNameFormatDate() {
        const date = new Date();
        const year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();
    
        month = month < 10 ? '0' + month : month;
        day = day < 10 ? '0' + day : day;
    
        return `${year}_${month}_${day}`;
    }

    static formatTimeFromMs(ms) {
        let hours = Math.floor(ms / (1000 * 60 * 60));
        let minutes = Math.floor((ms / (1000 * 60)) % 60);
        let seconds = Math.floor((ms / 1000) % 60);
        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':');
    }

    static formatTimeForJira(ms, roundTo15 = false) {
        let hours = Math.floor(ms / (1000 * 60 * 60));
        let minutes = Math.floor((ms / (1000 * 60)) % 60);
    
        if (roundTo15 && (minutes >= 15 || hours != 0)) {
            minutes = Math.round(minutes / 15) * 15;
            if (minutes === 60) {
                hours += 1;
                minutes = 0;
            }
        }
    
        let result = [];
        if (hours > 0) {
            result.push(`${hours}h`);
        }
        if (minutes > 0) {
            result.push(`${minutes}m`);
        }
    
        return result.join(' ') || '0m';
    }
}

load();