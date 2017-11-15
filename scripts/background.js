"use strict";

/** When opening a new tab with a URL (or switching to a tab from the past before this add-on was installed).
*/
browser.tabs.onActivated.addListener( activationInfo => {
    browser.tabs.get(activationInfo.tabId).then( tab=>apply(tab) ).then( resultIgnored=>{
        //@TODO show per-tab button ('action')
    });
});
    
browser.tabs.onUpdated.addListener( (tabId, changeInfo, tab) => apply(tab) );

const SUPPORTED_SCHEMES= /(http(s)?|file|ftp):/;
// @TODO button clicked - per browser or per tab

// Apply the tab's current setting, or apply & save current default setting to this tab.
// Only if the tab has a URL.
function apply( tab ) {
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

function defaultVisibility() {
    browser.storage.sync.get(key).then( alreadyStoredValues => {
        alreadyStoredValues[key]
    });
                        
}

/** @param tabID Pass as undefined only when modifying the "page action" button. Otherwise this modifies "browser action" button (across all tabs). */
function setIconAndLabel( showImages, showVideos, tabID ) {
    showImages= showImages || false;
    showVideos= showVideos || false;
    var buttonPath= "buttons/" +(showImages ? "show" : "hide")+"_images_"
        +(showVideos ? "show" : "hide")+"_videos.svg";
    var buttonTitle= (showImages ? "Show" : "Hide")+" images. "
        +(showVideos ? "Show" : "Hide")+" plugins/videos. ";
    buttonTitle+= tabID ? "Current tab." : "New tabs.";
    if( tabID ) {
        browser.pageAction.setTitle({
            title: buttonTitle,
            tabId: tabID
        });
        browser.pageAction.setIcon({
            tabId: tabID,
            path: buttonPath
        } );
    }
    else {
        browser.browserAction.setBadgeText({
            text: buttonTitle
        } );
        browser.browserAction.setIcon({
            path: buttonPath
        } );
    }
}

//'/styles/hide-images.css'

/** Add/remove CSS file. Call it only when it can do its job - i.e. add/remove - i.e. not twice with the same extFilePath and doRemoveCSS.
    @param {string} extFilePath Absolute path within the extension.
*/
function insertRemoveCSS( extFilePath, doRemoveCSS, tab ) {
    doRemoveCSS= doRemoveCSS || false;
    var details= {
     allFrames: true,
     file: extFilePath
    };
    var tabId= tab
        ? tab.id
        : undefined;
        //->sessions API
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