"use strict";
console.error('background.js');
debugger;

browser.tabs.onCreated.addListener( tab => {//@TODO Could this be an async closure with easier syntax?
    // pageActions are hidden by default; let's show it (even while its URL is about:blank, so that the user can choose the button before she types the URL).
    //@TODO test whether the result of show() is a Promise. If so, document at MDN.
    // TODO yield
    browser.pageAction.show(tab.id).then( resultIgnored=> {
        onTabCreatedOrActivated( tab.id, false );
    });
});

/** When opening a new tab with a URL (or switching to a tab from the past before this add-on was installed).
*/
browser.tabs.onActivated.addListener( info => onTabCreatedOrActivated(info.tabId, true) );

//@TODO similar for onDefaultButton
async function onTabCreatedOrActivated( tabID, applyCSS ) {
    var tabShowImagesOld= await getSetting( true, tabID );
    var tabWasRestored= tabShowImagesOld!==undefined;
    
    var defaultButton= {
        showImages: await getSetting(false),
        showVideos: await getSetting(false)
    };
    var tabButton= tabWasRestored
    ? {
        showImages: tabShowImagesOld,
        showVideos: await getSetting(false, tabID)
    }
    : defaultButton;
    
    var tabSetting= tabWasRestored
        ? defaultButton
        : undefined;
    
    return apply(tab);
}
    
browser.tabs.onUpdated.addListener( (tabId, changeInfo, tab) => apply(tab) );

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

/** @param tabID Of the current tab (if you want setting for the current tab). If undefined, it's for default setting, not for the current tab.
    @return Promise resolving to the actual value (rather than to a key/values object). Resolving to undefined, if the setting wasn't set yet.
*/
function getSetting( forImages, tabID ) {
    var settingName= getSettingName(forImages);
    if( tabID!==undefined ) {
        return browser.sessions.getTabValue( tabID, settingName );
    }
    else {
        return browser.storage.local.get(settingName).then( retrievedValues =>
            settingName in retrievedValues
                ? retrievedValues[settingName]
                : undefined
        );
    }
}

function setSetting( forImages, tabID, value ) {
    var settingName= getSettingName(forImages);
    if( tabID!==undefined ) {
        return browser.sessions.setTabValue( tabID, settingName, value );
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