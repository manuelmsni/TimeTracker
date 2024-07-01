class Modal{

    static instance;
    loadedPromiseResolver;
    loaded;

    containerDiv;
    modalTitle;
    closeButton;
    contentDiv;
    contentParentBuffer;
    closeHandler;

    html = `
    <div id="modal-body" class="rounded borderLight theme-primary">
        <div id="modal-header" class="theme-secondary">
            <div class="padding">
                <p class="space-between gap-x no-margin center-y"><span id="modal-title"></span> <a id="close-modal" class="close-button">X</a></p>
            </div>
        </div>
        <div id="modal-content" class="padding">

        </div>
    </div>
    `;

    constructor(){
        this.loaded = new Promise((resolve) => {
            this.loadedPromiseResolver = resolve;
        });
    }

    static async getInstance(){
        if(!Modal.instance){
            Modal.instance = new Modal();
            Modal.instance.init();
        }
        await Modal.instance.loaded;
        return Modal.instance;
    }

    async init(){
        try {
            await this.initDependencies();
            this.initGUI();
            this.loadedPromiseResolver();
            console.log('Modal initialized');
        } catch (error) {
            console.error('Failed to initialize Modal:', error);
        }
    }

    async initDependencies(){
        await loadStyle('Modal');
    }

    initGUI() {
        this.containerDiv = document.createElement('section');
        this.containerDiv.id = 'modal-container';
        this.containerDiv.classList.add('center', 'hidden', 'cover-screen');
        this.containerDiv.innerHTML = this.html;
        this.containerDiv.addEventListener("click", function (e) {
            if (e.target !== this.containerDiv) return;
            this.close();
        }.bind(this));

        this.modalTitle = this.containerDiv.querySelector('#modal-title');

        this.closeButton = this.containerDiv.querySelector('#close-modal');
        this.closeButton.addEventListener("click", () => {
            this.close();
        });

        this.contentDiv = this.containerDiv.querySelector('#modal-content');

        document.body.appendChild(this.containerDiv);
    }

    isActive(){
        return !this.containerDiv.classList.contains("hidden");
    }

    empty() {
        this.modalTitle.textContent = "";
        if (this.parentBuffer && this.contentDiv.childNodes.length > 0) {
            while (this.contentDiv.childNodes.length > 0) {
                this.parentBuffer.appendChild(this.contentDiv.childNodes[0]);
            }
            this.parentBuffer = null;
        }
        this.contentDiv.innerHTML = "";
    }

    show() {
        this.containerDiv.classList.remove("hidden");
    }

    close(){
        this.closeHandler && this.closeHandler();
        this.containerDiv.classList.add("hidden");
        this.empty();
    }

    loadWithContent(element) {
        if (this.isActive()) {
            this.empty();
        }
        this.contentDiv.appendChild(element);
        this.show();
    }

    loadContentFrom(element) {
        if (this.isActive()) {
            this.empty();
        }
        this.parentBuffer = element;
        while (element.childNodes.length > 0) {
            this.contentDiv.appendChild(element.childNodes[0]);
        }
        this.show();
    }

    showAlert(message, title = null, onAcceptCallback = null, onDenyCallback = null) {
        var title = title ? "Warning" + ": " + title : "Warning!";
        this.showDialog(message, title, onAcceptCallback, onDenyCallback, "assets/img/alert.svg");
    }

    showMessage(message, title = null){
        this.showDialog(message, title);
    }

    showDialog(message, title = null, onAcceptCallback = null, onDenyCallback = null, iconSrc = null) {
        let buttons;
        if (this.isActive()) {
            this.empty();
        }

        let icon = "";
        if (iconSrc) {
            icon = `<img id='dialog-icon' src='${iconSrc}'/>`;
        }

        this.modalTitle.textContent = title;
        this.contentDiv.innerHTML = `
            <div id="message-box">
                ${icon}<p id="AlertMessage">${message}</p>
            </div>
        `;

        if (onAcceptCallback || onDenyCallback) {
            this.contentDiv.insertAdjacentHTML('beforeend', '<p id="modal-buttons" class="space-around"></p>');
            buttons = this.contentDiv.querySelector("#modal-buttons");

            this.closeHandler = () => {
                this.closeHandler = null;
                onDenyCallback();
            };
        }

        if (onAcceptCallback) {
            buttons.insertAdjacentHTML('beforeend', `<a id="modal-confirm-button" class="confirm-button lng-text" lng-text="shared-1"></a>`);
            let confirmationButton = buttons.querySelector("#modal-confirm-button");
            confirmationButton.onclick = () => {
                this.closeHandler = null;
                this.close();
                onAcceptCallback();
            };
        }

        if (onDenyCallback) {
            buttons.insertAdjacentHTML('beforeend', `<a id="modal-cancel-button" class="cancel-button lng-text" lng-text="shared-2"></a>`);
            let cancelButton = buttons.querySelector("#modal-cancel-button");
            cancelButton.onclick = () => {
                this.closeHandler = null;
                this.close();
                onDenyCallback();
            };
        }

        this.show();
    }

    showConfirmationMessage(message) {
        return new Promise((resolve, reject) => {
            if (this.isActive()) {
                this.empty();
            }

            this.contentDiv.innerHTML = `
                <img id='alert-icon' src='assets/img/question.svg'>
                <p id='alert-message'>${message}</p>
                <p id='modal-buttons' class='space-around'>
                    <a id='modal-cancel-button' class='cancel-button lng-text' lng-text='shared-2'>Cancel</a>
                    <a id='modal-confirm-button' class='confirm-button lng-text' lng-text='shared-1'>Confirm</a>
                </p>
            `;

            this.closeHandler = () => {
                this.closeHandler = null;
                resolve(false);
            };

            let cancelButton = this.contentDiv.querySelector("#modal-cancel-button");
            cancelButton.onclick = () => {
                this.closeHandler = null;
                this.close().then(() => resolve(false));
            };

            let confirmationButton = this.contentDiv.querySelector("#modal-confirm-button");
            confirmationButton.onclick = () => {
                this.closeHandler = null;
                this.close().then(() => resolve(true));
            };

            this.show();
        });
    }
}

window.Modal = Modal;