"use strict";
console.error('background.js');
debugger;
/** When opening a new tab with a URL (or switching to a tab from the past before this add-on was installed).
*/
browser.tabs.onActivated.addListener( activationInfo => {
    // pageActions are hidden by default; let's show it (even while its URL is about:blank, so that the user can choose the button before she types the URL).
    browser.tabs.get(activationInfo.tabId).then( tab=>browser.pageAction.show(activationInfo.tabId) );
    browser.tabs.get(activationInfo.tabId).then( tab=>apply(tab) ).then( resultIgnored=>{
        //@TODO show per-tab button ('action')
    });
});
    
browser.tabs.onUpdated.addListener( (tabId, changeInfo, tab) => apply(tab) );

const SUPPORTED_SCHEMES= /(http(s)?|file|ftp):/;
// @TODO button clicked - per browser or per tab

// Apply the tab's current setting, or apply & save current default setting to this tab.
// Only if the tab has a URL.
function apply( tab ) {return; //TODO key
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

/** Add/remove CSS file. Call it only when it can do its job - i.e. add/remove - i.e. not twice with the same extFilePath and doRemoveCSS.
    @param {string} extFilePath Absolute path within the extension.
*/
function insertRemoveCSS( forImages, doRemoveCSS, tabID ) {
    doRemoveCSS= doRemoveCSS || false;
    var extFilePath= forImages
        ? '/styles/hide-images.css'
        : '/styles/hide-videos.css';
    var details= {
        allFrames: true,
        file: extFilePath
    };
    if( !doRemoveCSS ) {
        details.cssOrigin= 'user';//not used by removeCSS()
        browser.tabs.insertCSS( tabId, details );
    }
    else {
        browser.tabs.removeCSS( tabId, details );
    }
}

function setDefault( type, apply ) {
    
}

//@TODO Apply past settings/default to all tabs (once loaded)