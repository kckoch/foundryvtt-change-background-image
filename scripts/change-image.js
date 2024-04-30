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

    static SETTINGS = {
        INJECT_BUTTON: 'inject-button',
        CHANGE_DEFAULT_IMAGE: 'change-default-img',
        DEFAULT_IMAGE: 'default-img'
    };
0
    static initialize() {
        game.settings.register(this.ID, this.SETTINGS.INJECT_BUTTON, {
            name: `CHANGE-IMAGE.settings.${this.SETTINGS.INJECT_BUTTON}.Name`,
            default: true,
            type: Boolean,
            scope: 'world',
            config: true,
            hint: `CHANGE-IMAGE.settings.${this.SETTINGS.INJECT_BUTTON}.Hint`,
            onChange: () => ui.actors.render(),
            restricted: true
        });
        game.settings.register(this.ID, this.SETTINGS.CHANGE_DEFAULT_IMAGE, {
            name: `CHANGE-IMAGE.settings.${this.SETTINGS.CHANGE_DEFAULT_IMAGE}.Name`,
            default: false,
            type: Boolean,
            scope: 'world',
            config: true,
            hint: `CHANGE-IMAGE.settings.${this.SETTINGS.CHANGE_DEFAULT_IMAGE}.Hint`,
            onChange: () => ui.actors.render(),
            restricted: true
        });
        game.settings.register(this.ID, this.SETTINGS.DEFAULT_IMAGE, {
            name: `CHANGE-IMAGE.settings.${this.SETTINGS.DEFAULT_IMAGE}.Name`,
            type: String,
            filePicker: true,
            scope: 'world',
            config: true,
            hint: `CHANGE-IMAGE.settings.${this.SETTINGS.DEFAULT_IMAGE}.Hint`,
            onChange: () => ui.actors.render(),
            restricted: true
        });
    }
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

class BackgroundImagePicker extends FilePicker {
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
            BackgroundImageListData.deleteBackgroundImage(this.actorId);
        }
    }
}

/*class BackgroundContextMenuEntry extends ContextMenuEntry {
    constructor() {
        super();
        this.name = "Clear Character Art";
        this.icon = `<i class="fas fa-minus"></i>`;
    }
}*/

CONFIG.debug.hooks = true;

Hooks.on("renderActorSheet5eCharacter2", (app, html, data) => {
    if (!game.settings.get(BackgroundImageList.ID, BackgroundImageList.SETTINGS.INJECT_BUTTON)) {
        return;
    }
    
    const actorId = data.actor._id;
    const actorHTML = document.getElementById(`ActorSheet5eCharacter2-Actor-${actorId}`);
    const but = actorHTML.querySelector(".background-image-button");
    
    html.on('click', '.background-image-button', (event) => {
        const picker = new BackgroundImagePicker();
        picker.setActorId(actorId);
        picker.button = but;
        picker.callback = picker._handleButtonClick;
        picker.render(true, {renderData: actorId});
    });

    // Render the background image
    const newImg = actorHTML.querySelector(".window-content");
    newImg.classList.add("background-img");
    let img;
    try {
        img = BackgroundImageListData.getBackgroundImageForActor(actorId)[actorId]["path"];
    } catch (error) {
        img = null;
    }
    if (img) {
        newImg.style.setProperty('--data-url', `url(../../../${img})`);
    } else if (game.settings.get(BackgroundImageList.ID, BackgroundImageList.SETTINGS.CHANGE_DEFAULT_IMAGE)) {
        newImg.style.setProperty('--data-url', `url(../../../${game.settings.get(BackgroundImageList.ID, BackgroundImageList.SETTINGS.DEFAULT_IMAGE)})`);
    } else {
        newImg.style.setProperty('--data-url', `url(../../../systems/dnd5e/ui/official/banner-character-dark.webp)`);
    }
});

Hooks.on("getActorDirectoryEntryContext", (html, entries) => {
    console.log("HERE!");
    new_entry = {name: "Clear Background Art", icon:`<i class="fas fa-minus"></i>`, 
        callback: header => {
            const li = header.closest(".directory-item");
            const id = li.data("entryId");
            BackgroundImageListData.deleteBackgroundImage(id);
          }};
    entries[entries.length] = new_entry;
});

Hooks.on("getActorSheet5eCharacter2HeaderButtons", (app, buttons) => {
    buttons[1] = {"label": "Change Background Image", "icon": "fas fa-image", 
        "class": "background-image-button", "onclick": (event) => {}};
});

Hooks.on("init", (event) => {
    BackgroundImageList.initialize();
});