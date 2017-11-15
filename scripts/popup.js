"use strict";
// See https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Debugging#Debugging_popups
console.error('popup.js');
debugger;
function Combination(showImages, showVideos) {
    this.showImages= showImages;
    this.showVideos= showVideos;
}

var buttonIDsToCombinations;

// document.onload doesn't get triggered, only window.onload does
window.onload= () => {
    buttonIDsToCombinations= {
        show_images_show_videos: new Combination(true, true),
        show_images_hide_videos: new Combination(true, false),
        hide_images_show_videos: new Combination(false, true),
        hide_images_hide_videos: new Combination(false, false)
    };
    for( let ID in buttonIDsToChoices ) {
        console.error( ID );
    }
};
var perTab= location.href.indexOf("type=tab")>0;

document.addEventListener("click", (e) => {
  var combination= buttonIDsToCombinations[e.target.id];
  setButton( true, true ); //choice.)
  alert( e.target.id/*classList.contains("beast")*/);
 } );
