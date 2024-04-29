/**
 * A single BackgroundImage in our list of BackgroundImages.
 * @typedef {Object} BackgroundImage
 * @property {string} id - A unique ID to identify this image.
 * @property {string} path - The path to the image to use.
 * @property {string} userId - The user who uses this image
 */

/**
 * A class which holds some constants for background-image-list
 */
class BackgroundImageList {
    static ID = 'background-images';
    
    static FLAGS = {
      BACKGROUNDIMAGE: 'background-image'
    };
    
    static TEMPLATES = {
      BACKGROUNDIMAGELIST: `modules/${this.ID}/templates/background-image.hbs`
    };

    static initialize() {
        this.imagePicker = new BackgroundImagePickerConfig();
    }
}

class BackgroundImageListData {
    /**
   * get all toDos for all users indexed by the todo's id
   */
    static get allBackgroundImages() {
        const allBackgroundImages = game.users.reduce((accumulator, user) => {
            const userImages = this.getBackgroundImageForUser(user.id);

            return {
                ...accumulator,
                ...userImages
            }
        }, {});

        return allBackgroundImages;
    }
    
    static getBackgroundImageForUser(userId) {
        return game.users.get(userId)?.getFlag(BackgroundImageList.ID, BackgroundImageList.FLAGS.BACKGROUNDIMAGE);
    }
    
    static createBackgroundImage(userId, backgroundImageData) {
        // generate a random id for this new background image and populate the userId
        const newBackgroundImage = {
            ...backgroundImageData,
            userId,
        };
    
        // construct the update to insert the new background image
        const newBackgroundImages = {
          [newBackgroundImage.userId]: newBackgroundImage
        };
    
        // update the database with the new images
        return game.users.get(userId)?.setFlag(BackgroundImageList.ID, BackgroundImageList.FLAGS.BACKGROUNDIMAGE, newBackgroundImages);
    }

    static updateBackgroundImage(userId, updateData) {
        // construct the update to send
        const update = {
          [userId]: updateData
        };
    
        // update the database with the updated image
        return game.users.get(userId)?.setFlag(BackgroundImageList.ID, BackgroundImageList.FLAGS.BACKGROUNDIMAGE, update);
    }

    static deleteBackgroundImage(userId) {
        // Foundry specific syntax required to delete a key from a persisted object in the database
        const keyDeletion = {
          [`-=${userId}`]: null
        };
    
        // update the database with the updated image
        return game.users.get(userId)?.setFlag(BackgroundImageList.ID, BackgroundImageList.FLAGS.BACKGROUNDIMAGE, keyDeletion);
    }

    static _deleteAllImages() {
        const images = this.allBackgroundImages;
    
        for (var key in images) {
            // Foundry specific syntax required to delete a key from a persisted object in the database
            const keyDeletion = {
                [`-=${key}`]: null
            };

            game.users.get(key)?.setFlag(BackgroundImageList.ID, BackgroundImageList.FLAGS.BACKGROUNDIMAGE, keyDeletion);
        }
    }
}

class BackgroundImagePickerConfig extends FilePicker {
    constructor() {
        super();
        //this.extensions = ['webp', 'png', 'jpg'];
    }

    static get defaultOptions() {
        const defaults = super.defaultOptions;
    
        const overrides = {
            id: 'backgroundimage-picker',
            title: 'Background Image Picker',
            userId: game.userId
        };
    
        const mergedOptions = foundry.utils.mergeObject(defaults, overrides);
    
        return mergedOptions;
    }

    async _updateObject(event, formData) {
        // normal updateObject stuff
      
        this.render(); // rerenders the FormApp with the new data.
    }

    async _handleButtonClick(event) {
        console.log(this);
        console.log(event);
        const newImg = `{path: ${this.request}}`;
        console.log(newImg);

        let background;
        try {
            background = BackgroundImageListData.getBackgroundImageForUser(game.userId)[game.userId];
        } catch (error) {
            background = null;
        }
        if (background) {
            console.log("update image");
            await BackgroundImageListData.updateBackgroundImage(game.userId, newImg);
        } else {
            console.log("create image");
            await BackgroundImageListData.createBackgroundImage(game.userId, newImg);
        }

        //Hooks.call('renderActorSheet5eCharacter2', (null, event, null));
    }
    
    activateListeners(html) {
        super.activateListeners(html);
        console.log(this);
        console.log(html);

        html.on('click', ".file", (event) => {console.log(this);});

        html.on('click', ".filepicker-footer", this._handleButtonClick.bind(this, html));
        //html.on('click', ".filepicker-footer", (event) => {console.log("clicked");});
    }
}

Hooks.once('init', () => {
    BackgroundImageList.initialize();
});

/**
 * Register our module's debug flag with developer mode's custom hook
 */
Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(BackgroundImageList.ID);
});

Hooks.on('renderActorSheet5eCharacter2', (app, html, data) => {
    // create localized tooltip
    const tooltip = game.i18n.localize('CHANGE-IMAGE.button-title');

    // create a new header element if it doesn't already exist
    var elementExists = document.getElementById("background-image-icon-button");
    if (!elementExists) {
        const icon = document.createElement("a");
        const class_list = icon.classList;
        class_list.add("header-button");
        class_list.add("control");
        class_list.add("background-image-icon-button");
        icon.setAttribute('data-tooltip', tooltip);
        icon.setAttribute('data-type', "image");
        //icon.id = "background-image-icon-button";
        // set the inner html to be a font awesome icon
        icon.innerHTML = `<i class='fas fa-image' style='color:white'></i>`;

        const header = document.querySelector(".window-header");
        header.insertBefore(icon, header.childNodes[3]);
        html.on('click', '.background-image-icon-button', (event) => {
            const userId = game.userId;
            BackgroundImageList.imagePicker.render(true);
        });
    }

    // Render the background image
    const newImg = document.querySelector(".window-content");
    newImg.classList.add("background-img");
    let img;
    try {
        img = BackgroundImageListData.getBackgroundImageForUser(game.userId)[game.userId]["path"];
    } catch (error) {
        img = null;
    }
    if (img) {
        console.log(img)
        newImg.style.setProperty('--data-url', `url(../../../${img})`);
    } else {
        newImg.style.setProperty('--data-url', `url(../../../systems/dnd5e/ui/official/banner-character-dark.webp)`);
    }
});