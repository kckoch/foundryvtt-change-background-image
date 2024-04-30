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

    static initialize() {
        this.imagePicker = new BackgroundImagePickerConfig();
    };
}

class BackgroundImageListData {
    /**
   * get all images for all actors indexed by the id
   */
    static get allBackgroundImages() {
        const allBackgroundImages = game.actors.reduce((accumulator, actor) => {
            const actorImage = this.getBackgroundImageForActor(actor.id);
      
            return {
              ...accumulator,
              ...actorImage
            }
          }, {});
      
          return allBackgroundImages;
    }
  
    // get the background image for a specific actor
    static getBackgroundImageForActor(actorId) {
        return game.actors.get(actorId)?.getFlag(BackgroundImageList.ID, BackgroundImageList.FLAGS.BACKGROUNDIMAGE);
    }
  
    // create a new background image for a given actor
    static createBackgroundImage(actorId, backgroundImageData) {
        // generate a random id for this new ToDo and populate the userId
        const newBackgroundImage = {
            actorId,
            ...backgroundImageData,
        }
    
        // construct the update to insert the new ToDo
        const newBackgroundImages = {
            [actorId]: newBackgroundImage
        }
    
        // update the database with the new ToDos
        return game.actors.get(actorId)?.setFlag(BackgroundImageList.ID, BackgroundImageList.FLAGS.BACKGROUNDIMAGE, newBackgroundImages);
    }
  
    // update a specific actor background image by id with the provided updateData
    static updateBackgroundImage(actorId, updateData) {
        const relevantActor = this.allBackgroundImages[actorId];

        // construct the update to send
        const update = {
            [actorId]: updateData
        }

        // update the database with the updated ToDo list
        return game.actors.get(relevantActor.actorId)?.setFlag(BackgroundImageList.ID, BackgroundImageList.FLAGS.BACKGROUNDIMAGE, update);
    }
  
    // delete a specific background image by id
    static deleteBackgroundImage(actorId) {
        const relevantActor = this.allBackgroundImages[actorId];

        // Foundry specific syntax required to delete a key from a persisted object in the database
        const keyDeletion = {
        [`-=${actorId}`]: null
        }

        // update the database with the updated ToDo list
        return game.actors.get(relevantActor.actorId)?.setFlag(BackgroundImageList.ID, BackgroundImageList.FLAGS.BACKGROUNDIMAGE, keyDeletion);
    }
}

class BackgroundImagePickerConfig extends FilePicker {
    static actorId = null;
    static imgPath = null;

    constructor() {
        super();
        this.extensions = ['.webp', '.png', '.jpg'];
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

    setActorId(id) {
        this.actorId = id;
    }

    setButton(html) {
        this.button = html;
    }

    async _handleButtonClick(event) {
        if (event) {
            const newImg = {path: event};
            
            let background;
            try {
                background = BackgroundImageListData.getBackgroundImageForActor(this.actorId)[this.actorId];
            } catch (error) {
                background = null;
            }
            if (background) {
                await BackgroundImageListData.updateBackgroundImage(this.actorId, newImg);
            } else {
                await BackgroundImageListData.createBackgroundImage(this.actorId, newImg);
            }
        } else {
            console.log("request was null");
        }
    }
}

Hooks.once('init', () => {
    BackgroundImageList.initialize();
});

Hooks.on("renderActorSheet5eCharacter2", (app, html, data) => {
    const actorId = app.object._id;
    const but = document.querySelector(".background-image-button");
    
    html.on('click', '.background-image-button', (event) => {
        BackgroundImageList.imagePicker.button = but;
        BackgroundImageList.imagePicker.callback = BackgroundImageList.imagePicker._handleButtonClick;
        BackgroundImageList.imagePicker.setActorId(actorId);
        BackgroundImageList.imagePicker.render(true, {actorId});
    });

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

Hooks.on("getActorSheet5eCharacter2HeaderButtons", (app, buttons) => {
    buttons[1] = {"label": "Change Background Image", "icon": "fas fa-image", 
        "class": "background-image-button", "onclick": (event) => {}};
});