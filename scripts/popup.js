"use strict";

function Choice(hideImages, hideVideos) {
    this.hideImages= hideImages;
    this.hideVideos= hideVideos;
}

var buttonIDsToChoices;

// document.onload doesn't get triggered, only window.onload does
window.onload= () => {
    buttonIDsToChoices= {
        show_images_show_videos: new Choice(false, false),
        show_images_hide_videos: new Choice(false, true),
        hide_images_show_videos: new Choice(true, false),
        hide_images_hide_videos: new Choice(true, true)
    };
    for( let ID in buttonIDsToChoices ) {
        console.error( ID );
    }
};
var perTab= location.href.indexOf("type=tab")>0;

document.addEventListener("click", (e) => {
  alert( e.target.id/*classList.contains("beast")*/);
 } );
