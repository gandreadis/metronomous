$(document).ready(function () {
  var playing = false;
  var finished = false;
  var startBPM = 60;
  var endBPM = 120;
  var currentBPM = startBPM;
  var tickCounter = 1;
  var totalTickCounter = 0;
  var tickAmount = 16;
  var bpmIncrease = 10;
  var audio = new Audio('res/tick.mp3');

  var bpmToMs = function(bpm) {
    return Math.round((60 / bpm) * 1000);
  };

  var incrementTick = function() {
    tickCounter++;
    totalTickCounter++;
    if (tickCounter === tickAmount + 1) {
      currentBPM += bpmIncrease;
      tickCounter = 1;
      if (currentBPM > endBPM) {
        playing = false;
        finished = true;
      }
    }
  };

  var setTimeoutCallback = function() {
    if (playing) {
      $(".counter").text(tickCounter);
      audio.play();
      setTimeout(setTimeoutCallback, bpmToMs(currentBPM));
      incrementTick();
      var progress = totalTickCounter / (((endBPM - startBPM) / bpmIncrease) * tickAmount);
      $(".progress-bar").css("width", progress * 100 + "%");
    }
  };

  $(".play-toggle").on("click", function() {
    if (!playing) {
      $(".play-toggle").text("ON").attr("data-active", "true");
      $(".counter").text(tickCounter);
      incrementTick();
      audio.play();
      playing = true;
      setTimeout(setTimeoutCallback, bpmToMs(currentBPM));
    } else {
      $(".play-toggle").text("OFF").attr("data-active", "false");
      playing = false;
    }
  });
});
