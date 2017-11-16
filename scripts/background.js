"use strict";

browser.tabs.onCreated.addListener( async function(tab) {
    // pageActions are hidden by default; let's show it (even while its URL is about:blank, so that the user can choose the button before she types the URL).
    await browser.pageAction.show(tab.id);
    await onTabCreatedOrActivated( tab.id, false );
});

/** When opening a new tab with a URL (or switching to a tab from the past before this add-on was installed).
*/
browser.tabs.onActivated.addListener( info =>
    onTabCreatedOrActivated(info.tabId, true)
);

//@TODO similar for onDefaultButton
//@TODO onActivated only once - not everytime the user switches to the tab. Hence, keep a global object { tabID => true}.
async function onTabCreatedOrActivated( tabID, applyCSS ) {
    var tabShowImagesOld= await getSetting( true, tabID );
    var tabWasRestored= tabShowImagesOld!==undefined;
    
    var defaultButton= {
        showImages: await getSetting(false),
        showVideos: await getSetting(true)
    };
    var tabButton= tabWasRestored
    ? {
        showImages: tabShowImagesOld,
        showVideos: await getSetting(false, tabID)
    }
    : defaultButton;
    
    var tabSetting= !tabWasRestored
        ? defaultButton
        : undefined;
        
    var insertCSSforImages, insertCSSforVideos; //3-state logic (including  undefined)
    if( applyCSS ) {
        insertCSSforImages= tabButton.showImages;
        insertCSSforVideos= tabButton.showVideos;
    }
    
    return apply( defaultButton, tabButton, /*defaultSetting:*/undefined, tabSetting, insertCSSforImages, insertCSSforVideos, tabID );
}
    
browser.tabs.onUpdated.addListener( async function(tabID, changeInfo, tab) {
    return apply( /*defaultButton:*/undefined, /*tabButton:*/undefined, /*defaultSetting:*/undefined, /*tabSetting:*/undefined, !await getSetting(true, tabID), !await getSetting(false, tabID), tabID );
});

/** @param boolean choicePerTab Whether per tab, or for default setting. No need to pass tab ID.
    @param Tuple Selected choice.
*/
async function onButtonClicked( choicePerTab, choice ) {
    var applyTabButtonAndSetting= choicePerTab || tab.url==='about:blank';
    var tabID;
    if( applyTabButtonAndSetting ) {
        // Can't use browser.tabs.getCurrent();
        //@TODO how to throw & log?
        var tabs= await browser.tabs.query( {active: true} );// currentWindow: true
        if( tabs.length===1) {
            tabID= tabs[0].id;
        }
        else {
            console.error( "Current tab(s): " +tabs.length);
        }
    }
    
    var defaultButtonAndSetting= !perTab
        ? choice
        : undefined;
    var tabButtonAndSetting= applyTabButtonAndSetting
        ? choice
        : undefined;
    var insertCSSforImages= applyTabButtonAndSetting
        ? !choice.showImages
        : undefined;
    var insertCSSforVideos= applyTabButtonAndSetting
        ? !choice.showVideos
        : undefined;
    return apply( defaultButtonAndSetting, tabButtonAndSetting, defaultButtonAndSetting, tabButtonAndSetting, insertCSSforImages, insertCSSforVideos, tabID );
}

/*async function getTabSettings( tabID ) {
    return new Tuple( await getSetting(true, tabID), await getSetting(false, tabID) );
}*/

const SUPPORTED_SCHEMES= /(http(s)?|file|ftp):/;

/** @param defaultButton {showImages: boolean, showVideos: boolean} or undefined (whole) if no change. The new setting for default button (a.k.a. "browser action" button).
    @param defaultButton {showImages: boolean, showVideos: boolean} or undefined (whole) if no change. The new setting for tab-specific button (a.k.a. "page action" button).
    @param insertCSSforImages boolean|undefined Whether to inject or remove CSS that hides images
    @param tabID number Optional; only used (and needed) if tabButton/tabSetting/insertCSSforImages/insertCSSforVideos are set.
*/
function apply( defaultButton, tabButton, defaultSetting, tabSetting, insertCSSforImages, insertCSSforVideos, tabID ) {
    // If you change this, also update ../README.md
    // Ignoring promise results. TODO log/async
    if( defaultButton ) {
        setButton( defaultButton.showImages, defaultButton.showVideos );
    }
    if( tabButton ) {
        if( tabID===undefined ) {
            throw "tabButton set to {" +tabButton.showImages+"," +tabButton.showVideos+ "} but tabID is undefined!";
        }
        setButton( tabButton.showImages, tabButton.showVideos, tabID );
        }
    if( defaultSetting ) {
        setSetting( /*forImages:*/true,  undefined, defaultSetting.showImages );
        setSetting( /*forImages:*/false, undefined, defaultSetting.showVideos );
    }
    if( tabSetting ) {
        if( tabID===undefined ) {
            throw "tabSetting set to {" +tabSetting.showImages+"," +tabSetting.showVideos+ "} but tabID is undefined!";
        }
        setSetting( /*forImages:*/true,  tabID, tabSetting.showImages );
        setSetting( /*forImages:*/false, tabID, tabSetting.showVideos );
    }
    return;
    throw "TODO";
    if( tab.url && SUPPORTED_SCHEMES.test(tab.url) ) {
        
        browser.sessions.getTabValue( tab.id, key ).then( tabSetting=>{
            if( tabSetting!==undefined ) {
                
            }
            else {
                
            }
            if( browser.sessions.setTabValue() ) {
                
            }
            browser.sessions.setTabValue( tab.id, key, value );
            insertRemoveCSS( '/styles/hide-images.css' );
        });
    }
    else {
        return Promise.resolve(false);
    }
}

function getSettingName( forImages ) {
    return forImages ? "images" : "videos";
}

function objectInfo(obj) {
    var result= obj.constructor.name;
    for( var field in obj ) {
        result+= "\n"+ field+ ": "+ obj[field];
    }
    return result;
}

/** @param tabID Of the current tab (if you want setting for the current tab). If undefined, it's for default setting, not for the current tab.
    @return Promise resolving to the actual value (rather than to a key/values object). Resolving to undefined, if the setting wasn't set yet.
*/
async function getSetting( forImages, tabID ) {
    var settingName= getSettingName(forImages);
    if( tabID!==undefined ) {
        var wrapper= await browser.sessions.getTabValue( tabID, settingName );
        if( wrapper!==undefined && !('value' in wrapper) ) {
            console.error("WRAPPER " +wrapper+ " doesn't contain .value. Obj: " +objectInfo(wrapper) );
        }
        return wrapper!==undefined
            ? wrapper.value
            : undefined;
    }
    else {
        var retrievedValues= await browser.storage.local.get(settingName);
        return settingName in retrievedValues
            ? retrievedValues[settingName]
            : undefined;
    }
}

/** @return Promise */
function setSetting( forImages, tabID, value ) {
    var settingName= getSettingName(forImages);
    if( tabID!==undefined ) {
        return browser.sessions.setTabValue( tabID, settingName, {value: value} );
    }
    else {
        var keys= {};
        keys[settingName]= value;
        return browser.storage.local.set(keys);
    }
}

/** @param tabID Pass as undefined only when modifying the "page action" button. Otherwise this modifies "browser action" button (across all tabs). */
function setButton( showImages, showVideos, tabID ) {
    showImages= showImages || false;
    showVideos= showVideos || false;
    var buttonPath= "buttons/" +(showImages ? "show" : "hide")+"_images_"
        +(showVideos ? "show" : "hide")+"_videos.svg";
        
    var buttonTitle= (showImages ? "Show" : "Hide")+" images. "
        +(showVideos ? "Show" : "Hide")+" plugins/videos. ";
    buttonTitle+= tabID ? "Current tab." : "New tabs.";
    if( tabID!==undefined ) {
        try {throw new Error();}
        catch(e) {console.error(e.stack); }
        return Promise.all([
            browser.pageAction.setTitle({
                title: buttonTitle,
                tabId: tabID
            }),
            browser.pageAction.setIcon({
                path: buttonPath,
                tabId: tabID
            })
        ]);
    }
    else {
        return Promise.all([
            browser.browserAction.setBadgeText({
                text: buttonTitle
            } ),
            browser.browserAction.setIcon({
                path: buttonPath
            } )
        ]);
    }
}

//'/styles/hide-images.css'

/** Add/remove CSS file.
    @param {string} extFilePath Absolute path within the extension.
*/
function insertRemoveCSS( forImages, doInsertCSS, tabID ) {
    var extFilePath= forImages
        ? '/styles/hide-images.css'
        : '/styles/hide-videos.css';
    var details= {
        allFrames: true,
        file: extFilePath
    };
    if( doInsertCSS ) {
        details.cssOrigin= 'user';//not used by removeCSS()
        details.runAt= 'document_start';
        return browser.tabs.insertCSS( tabId, details );
    }
    else {
        return browser.tabs.removeCSS( tabId, details );
    }
}

function setDefault( type, apply ) {
    
}

//@TODO Apply past settings/default to all tabs (once loaded)