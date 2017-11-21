"use strict";

function Tuple(showImages, showVideos) {
    this.showImages= showImages;
    this.showVideos= showVideos;
}

browser.runtime.onInstalled.addListener( async function() {
    var defaultSetting= new Tuple(false, false);
    setSetting( /*forImages:*/true,  defaultSetting );
    setSetting( /*forVideos:*/false, defaultSetting );
    var allTabs= await browser.tabs.query({});
    for( let tab of allTabs ) {
        browser.pageAction.show(tab.id);
    }
});

// FYI Can't insertCSS() in onCreated: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/onCreated
browser.tabs.onCreated.addListener( async function(tab) {
    // pageActions are hidden by default (as per https://developer.mozilla.org/en-US/Add-ons/WebExtensions/manifest.json/page_action). Let's show it (even while its URL is about:newtab or about:blank, so that the user can choose the button before she types the URL).
    await browser.pageAction.show(tab.id);
    await onTabCreatedOrActivated( tab.id, false );
});

/** Object { tabID => true}. This serves to handle tabs.onActivated only once per tab (on the first such even per tab), rather than everytime the user switches to the tab.
*/
var onActivatedHandled= {};

/** When opening a new tab with a URL (or switching to a tab from the past before this add-on was installed).
*/
browser.tabs.onActivated.addListener( async function(info) {
    if( !(info.tabId in onActivatedHandled) ) {
        var tab= await browser.tabs.get( info.tabId );
        onTabCreatedOrActivated(tab, true);
        onActivatedHandled[info.tabId]= true;
    }
});

async function onTabCreatedOrActivated( tab, applyCSS ) {
    var tabShowImagesOld= await getSetting( true, tab.id );
    var tabWasRestored= tabShowImagesOld!==undefined;
    
    var defaultButton= {
        showImages: await getSetting(false),
        showVideos: await getSetting(true)
    };
    var tabButton= tabWasRestored
    ? {//@TODO check that this evaluates on tab restore - because it seems not so
        showImages: tabShowImagesOld,
        showVideos: await getSetting(false, tab.id)
    }
    : defaultButton;
    
    var tabSetting= tabWasRestored
        ? undefined
        : defaultButton;
        
    var insertCSSforImages, insertCSSforVideos; //3-state logic (including  undefined)
    if( applyCSS ) {
        insertCSSforImages= !tabButton.showImages;
        insertCSSforVideos= !tabButton.showVideos;
    }
    
    return apply( defaultButton, tabButton, /*defaultSetting:*/undefined, tabSetting, insertCSSforImages, insertCSSforVideos, tab );
}
    
browser.tabs.onUpdated.addListener( async function(tabID, changeInfo, tab) {
    await browser.pageAction.show(tab.id);
    return apply( /*defaultButton:*/undefined, /*tabButton:*/undefined, /*defaultSetting:*/undefined, /*tabSetting:*/undefined, !await getSetting(true, tabID), !await getSetting(false, tab.id), tab );
});

/** @param boolean choicePerTab Whether per tab, or for default setting. No need to pass tab ID.
    @param Tuple Selected choice.
*/
async function onButtonClicked( choicePerTab, choice ) {
    // Can't use browser.tabs.getCurrent();
    //@TODO how to throw & log?
    var tabs= await browser.tabs.query( {active: true, currentWindow: true} );
    var tab;
    if( tabs.length===1) {
        tab= tabs[0];
    }
    var applyTabButtonAndSetting= choicePerTab || tab && (tab.url==='' || tab.url==='about:newtab' || tab.url==='about:blank');
    
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
    return apply( defaultButtonAndSetting, tabButtonAndSetting, defaultButtonAndSetting, tabButtonAndSetting, insertCSSforImages, insertCSSforVideos, tab );
}

/** Not including about:blank, because injecting CSS in it may  need a special permission.
*/
const SUPPORTED_SCHEMES= /(http(s)?|file|ftp):/;

/** @param defaultButton {showImages: boolean, showVideos: boolean} or undefined (whole) if no change. The new setting for default button (a.k.a. "browser action" button).
    @param defaultButton {showImages: boolean, showVideos: boolean} or undefined (whole) if no change. The new setting for tab-specific button (a.k.a. "page action" button).
    @param insertCSSforImages boolean|undefined Whether to inject or remove CSS that hides images
    @param tab tabs.Tab Optional; only used (and needed) if tabButton/tabSetting/insertCSSforImages/insertCSSforVideos are set.
*/
function apply( defaultButton, tabButton, defaultSetting, tabSetting, insertCSSforImages, insertCSSforVideos, tab ) {
    // If you change this, also update ../README.md
    // Ignoring promise results. TODO log/async
    if( defaultButton ) {
        setButton( defaultButton.showImages, defaultButton.showVideos );
    }
    if( tabButton ) {
        if( !tab ) {
            throw "tabButton set to {" +tabButton.showImages+"," +tabButton.showVideos+ "} but tab is undefined!";
        }
        setButton( tabButton.showImages, tabButton.showVideos, tab.id );
        }
    if( defaultSetting ) {
        setSetting( /*forImages:*/true,  defaultSetting.showImages );
        setSetting( /*forImages:*/false, defaultSetting.showVideos );
    }
    if( tabSetting ) {
        if( !tab ) {
            throw "tabSetting set to {" +tabSetting.showImages+"," +tabSetting.showVideos+ "} but tab is undefined!";
        }
        setSetting( /*forImages:*/true,  tabSetting.showImages, tab.id );
        setSetting( /*forImages:*/false, tabSetting.showVideos, tab.id );
    }
    if( (insertCSSforImages!==undefined || insertCSSforVideos!==undefined) && tab.url && SUPPORTED_SCHEMES.test(tab.url) ) {
        if( tab===undefined ) {
            throw "insertCSSforImages set to " +insertCSSforImages+", insertCSSforImages set to " +insertCSSforImages+ ", but tab is undefined!";
        }
        if( insertCSSforImages!==undefined ) {
            insertRemoveCSS( /*forImages:*/true, insertCSSforImages, tab.id );
        }
        if( insertCSSforVideos!==undefined ) {
            insertRemoveCSS( /*forVideos:*/true, insertCSSforVideos, tab.id );
        }
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
        if( wrapper!==undefined ) {
            return wrapper.value;
        }
        return undefined;
    }
    else {
        var retrievedValues= await browser.storage.local.get(settingName);
        return settingName in retrievedValues
            ? retrievedValues[settingName]
            : undefined;
    }
}

/** @param number tabID Optional.
    @return Promise
*/
function setSetting( forImages, value, tabID ) {
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
    @return Promise
*/
function insertRemoveCSS( forImages, doInsertCSS, tabID ) {
    var extFilePath= forImages
        ? '/styles/hide-images.css'
        : '/styles/hide-videos.css';
    var details= {
        allFrames: true,
        file: extFilePath
    };
    details.cssOrigin= 'user';//not used by removeCSS()
    if( doInsertCSS ) {
        details.runAt= 'document_start';
        return browser.tabs.insertCSS( tabID, details );
    }
    else {
        return browser.tabs.removeCSS( tabID, details );
    }
}