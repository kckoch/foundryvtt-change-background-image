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
    };
}

class BackgroundImageListData {
    /**
   * get all images for all actors indexed by the id
   */
    static get allBackgroundImages() {
        const allBackgroundImages = game.actors.reduce((accumulator, actors) => {
            const actorImages = this.getBackgroundImageForActor(actors.id);

            return {
                ...accumulator,
                ...actorImages
            }
        }, {});

        return allBackgroundImages;
    }
    
    static getBackgroundImageForActor(actorId) {
        return game.actors.get(actorId)?.getFlag(BackgroundImageList.ID, BackgroundImageList.FLAGS.BACKGROUNDIMAGE);
    }
    
    static createBackgroundImage(actorId, backgroundImageData) {
        // generate a random id for this new background image and populate the userId
        const newBackgroundImage = {
            ...backgroundImageData,
        };
    
        // construct the update to insert the new background image
        const newBackgroundImages = {
          [actorId]: newBackgroundImage
        };
    
        // update the database with the new images
        return game.actors.get(actorId)?.setFlag(BackgroundImageList.ID, BackgroundImageList.FLAGS.BACKGROUNDIMAGE, newBackgroundImages);
    }

    static updateBackgroundImage(actorId, updateData) {
        // construct the update to send
        const update = {
          [actorId]: updateData
        };
    
        // update the database with the updated image
        return game.actors.get(actorId)?.setFlag(BackgroundImageList.ID, BackgroundImageList.FLAGS.BACKGROUNDIMAGE, update);
    }

    static deleteBackgroundImage(actorId) {
        // Foundry specific syntax required to delete a key from a persisted object in the database
        const keyDeletion = {
          [`-=${actorId}`]: null
        };
    
        // update the database with the updated image
        return game.actors.get(actorId)?.setFlag(BackgroundImageList.ID, BackgroundImageList.FLAGS.BACKGROUNDIMAGE, keyDeletion);
    }

    static _deleteAllImages() {
        const images = this.allBackgroundImages;
    
        for (var key in images) {
            // Foundry specific syntax required to delete a key from a persisted object in the database
            const keyDeletion = {
                [`-=${key}`]: null
            };

            game.actors.get(key)?.setFlag(BackgroundImageList.ID, BackgroundImageList.FLAGS.BACKGROUNDIMAGE, keyDeletion);
        }
    }
}

class BackgroundImagePickerConfig extends FilePicker {
    static actorId = null;

    constructor() {
        super();
        //this.type = ['webp', 'png', 'jpg'];
    }

    static get defaultOptions() {
        const defaults = super.defaultOptions;
    
        const overrides = {
            id: 'backgroundimage-picker',
            title: 'Background Image Picker',
            userId: game.userId,
        };
    
        const mergedOptions = foundry.utils.mergeObject(defaults, overrides);
    
        return mergedOptions;
    }

    getData(options = {}) {
        return super.getData().object; // the object from the constructor is where we are storing the data
    }

    setActorId(id) {
        this.actorId = id;
    }

    async _handleButtonClick(event) {
        console.log(this.template);
        const newImg = {path: this.request};
        console.log(newImg);
        
        let background;
        try {
            background = BackgroundImageListData.getBackgroundImageForActor(this.actorId)[this.actorId];
        } catch (error) {
            background = null;
        }
        if (background) {
            console.log("update image");
            await BackgroundImageListData.updateBackgroundImage(this.actorId, newImg);
        } else {
            console.log("create image");
            await BackgroundImageListData.createBackgroundImage(this.actorId, newImg);
        }

        //Hooks.call('renderActorSheet5eCharacter2', (null, event, null));
    }
    
    activateListeners(html) {
        console.log(html);
        super.activateListeners(html);

        html.on('click', ".filepicker-footer", this._handleButtonClick.bind(this));
    }

    async _updateObject(event, formData) {
        return;
      }
}

Hooks.once('init', () => {
    BackgroundImageList.initialize();
});

Hooks.on('renderActorSheet5eCharacter2', (app, html, data) => {
    const actorId = app.object._id;
    // create localized tooltip
    const tooltip = game.i18n.localize('CHANGE-IMAGE.button-title');

    // create a new header icon if it doesn't already exist
    const elementExists = document.getElementById("background-image-button");
    if (!elementExists) {
        const icon = document.createElement("a");
        const class_list = icon.classList;
        class_list.add("header-button");
        class_list.add("control");
        class_list.add("background-image-button");
        icon.setAttribute('data-tooltip', tooltip);
        icon.setAttribute('data-actor-id', actorId);
        icon.setAttribute('aria-label', tooltip);
        //icon.id = "background-image-button";
        // set the inner html to be a font awesome icon
        icon.innerHTML = `<i class='fas fa-image' style='color:white'></i>`;

        const header = document.querySelector(".window-header");
        header.insertBefore(icon, header.childNodes[3]);
        html.on('click', '.background-image-button', (event) => {
            BackgroundImageList.imagePicker.setActorId(actorId);
            BackgroundImageList.imagePicker.render(true, {actorId});
        });
    }

    // Render the background image
    const newImg = document.querySelector(".window-content");
    newImg.classList.add("background-img");
    let img;
    try {
        img = BackgroundImageListData.getBackgroundImageForActor(actorId)[actorId]["path"];
    } catch (error) {
        img = null;
    }
    if (img) {
        newImg.style.setProperty('--data-url', `url(../../../${img})`);
    } else {
        newImg.style.setProperty('--data-url', `url(../../../systems/dnd5e/ui/official/banner-character-dark.webp)`);
    }
});