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

function newObjectId() {
    const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
    let objectId = timestamp;
    const characters = '0123456789abcdef';
    for (let i = 0; i < 16; i++) {  // solo agregamos 16 caracteres más para hacer 24
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
    
    Promise.all([
        getInstance('TimeTracker'),
        getInstance('HistoricTable')
    ]);

}

async function load() {
    try {
        loadDependencies();
    } catch (error) {
        console.error(error);
    }
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
}

load();