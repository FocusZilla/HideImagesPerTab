"use strict";
// See https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Debugging#Debugging_popups

var buttonIDsToTuples= {
    show_images_show_videos: new Tuple(true, true),
    show_images_hide_videos: new Tuple(true, false),
    hide_images_show_videos: new Tuple(false, true),
    hide_images_hide_videos: new Tuple(false, false)
};

// document.onload doesn't get triggered, only window.onload does
//window.onload= () => {};
var perTab= location.href.indexOf("type=tab")>0;

document.addEventListener("click", (e) => {
  var tuple= buttonIDsToTuples[e.target.id];
  onButtonClicked( perTab, tuple );
  //alert( e.target.id );
 } );
