// This file is part of metronomous.
//
// metronomous is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// metronomous is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with metronomous.  If not, see <http://www.gnu.org/licenses/>.

$(document).ready(function() {
  /* Global constants */
  var MINBPM = 30;
  var MAXBPM = 280;
  var MINSTEP = 1;
  var MAXSTEP = 30;
  var MINTIME = 1;
  var MAXTIME = 60;
  var MINVOLUME = 1;
  var MAXVOLUME = 100;
  var VOLUMESCALING = 0.01;
  var HANDLEOFFSET = 30;

  /* State variables */
  var freshState = true;
  var playing, startBPM, endBPM, currentBPM, tickCounter, tickAmount, bpmStep;
  var audio = new Audio('res/tick.mp3');

  /* Utility functions (mostly static) for common calculations and actions */
  var util = {
    mapInputToOutput: function(input, min, max) {
      return 120 * ((input - min) / (max - min));
    },
    mapOutputToInput: function(output, min, max) {
      return Math.round((output / 120) * (max - min) + min);
    },
    bpmToMs: function(bpm) {
      return Math.round((60 / bpm) * 1000);
    },
    checkInputValidity: function() {
      var startVal = parseInt($(".settings .start input").val());
      var endVal = parseInt($(".settings .end input").val());
      var stepVal = parseInt($(".settings .step input").val());
      var timeVal = parseInt($(".settings .time input").val());
      var volumeVal = parseInt($(".settings .volume input").val());

      return startVal >= MINBPM && startVal <= MAXBPM &&
        endVal >= MINBPM && endVal <= MAXBPM &&
        startVal <= endVal &&
        stepVal >= MINSTEP && stepVal <= MAXSTEP &&
        timeVal >= MINTIME && timeVal <= MAXTIME &&
        volumeVal >= MINVOLUME && volumeVal <= MAXVOLUME;
    },
    calculateTickAmount: function(min, max, step, minutes) {
      var sum = 0;
      for (var i = min; i <= max; i += step) {
        sum += 60 / i;
      }

      return Math.floor((minutes * 60) / sum);
    },
    getMinMax: function(parent) {
      if (parent.is(".start") || parent.is(".end")) {
        return [MINBPM, MAXBPM];
      } else if (parent.is(".step")) {
        return [MINSTEP, MAXSTEP];
      } else if (parent.is(".time")) {
        return [MINTIME, MAXTIME];
      } else if (parent.is(".volume")) {
        return [MINVOLUME, MAXVOLUME];
      }
    }
  };

  /* Setup of the settings box */
  (function() {
    $(".settings div input").prop("disabled", false);

    /* Connect event handler to input value changes */
    $(".settings input").change(function() {
      var value = $(this).val();
      if (isNaN(value)) {
        $(this).attr("data-invalid", true);
      } else {
        var parent = $(this).parent();
        var intValue = parseInt(value);
        if ((parent.is(".start") && intValue >= MINBPM && intValue <= MAXBPM) ||
            (parent.is(".end") && intValue >= MINBPM && intValue <= MAXBPM) ||
            (parent.is(".step") && intValue >= MINSTEP && intValue <= MAXSTEP) ||
            (parent.is(".time") && intValue >= MINTIME && intValue <= MAXTIME) ||
            (parent.is(".volume") && intValue >= MINVOLUME && intValue <= MAXVOLUME)) {
          $(this).attr("data-invalid", false);
          var minMax = util.getMinMax(parent);
          if (parent.is(".volume")) {
            audio.volume = intValue * VOLUMESCALING;
          }
          $(this).parent().children(".handle").css("bottom",
            HANDLEOFFSET + util.mapInputToOutput(intValue, minMax[0], minMax[1]));

          if (parseInt($(".end input").val()) < parseInt($(".start input").val())) {
            $(".end input").attr("data-invalid", true);
          } else {
            $(".end input").attr("data-invalid", false);
          }
          if (util.checkInputValidity()) {
            $(".play-toggle").attr("data-disabled", false);
          } else {
            $(".play-toggle").attr("data-disabled", true);
          }
        } else {
          $(this).attr("data-invalid", true);
        }
      }
    });

    /* Connect event handler to mouse input changes, specifically targeted to
    handles of settings sliders */
    var clicked = false;
    var $handle_target;
    var min, max;
    $(".settings .handle").on("mousedown", function(event) {
      clicked = true;
      $handle_target = $(event.target);
      $handle_target.attr("data-active", true);
      var parent = $handle_target.parent();
      var minMax = util.getMinMax(parent);
      min = minMax[0];
      max = minMax[1];
    });

    $("body").on("mousemove", function(event) {
      if (clicked) {
        if (!freshState && !$handle_target.parent().is(".volume")) {
          return;
        }
        if ($(".line").offset().top + 165 - event.pageY <= HANDLEOFFSET) {
          $handle_target.css("bottom", HANDLEOFFSET);
          $handle_target.parent().children("input").val(min);
          if ($handle_target.parent().is(".volume")) {
            audio.volume = MINVOLUME * VOLUMESCALING;
          }
          return;
        } else if ($(".line").offset().top + 15 - event.pageY >= 0) {
          $handle_target.css("bottom", 150);
          $handle_target.parent().children("input").val(max);
          if ($handle_target.parent().is(".volume")) {
            audio.volume = MAXVOLUME * VOLUMESCALING;
          }
          return;
        }

        $handle_target.css("bottom", $(".line").offset().top + 165 - event.pageY);

        var value = util.mapOutputToInput(parseInt($handle_target.css("bottom")) - HANDLEOFFSET, min, max);
        if ($handle_target.parent().is(".volume")) {
          audio.volume = value * VOLUMESCALING;
        }
        $handle_target.parent().children("input").val(value);

        if (parseInt($(".end input").val()) < parseInt($(".start input").val())) {
          $(".end input").attr("data-invalid", true);
        } else {
          $(".end input").attr("data-invalid", false);
        }

        if (util.checkInputValidity()) {
          $(".play-toggle").attr("data-disabled", false);
        } else {
          $(".play-toggle").attr("data-disabled", true);
        }
      }
    });

    var mouse_disable = function(event) {
      clicked = false;
      if ($handle_target) {
        $handle_target.attr("data-active", false);
      }
    };
    $("body").on("mouseup", mouse_disable);
    $("body").on("mouseleave", mouse_disable);

    $(".settings .start input").val(60).change();
    $(".settings .end input").val(100).change();
    $(".settings .step input").val(5).change();
    $(".settings .time input").val(5).change();
    $(".settings .volume input").val(50).change();
  })();

  /* Set the state variables of a session with the given values*/
  var setSettings = function(newStart, newEnd, newStep, newAmount) {
    playing = false;
    freshState = true;
    startBPM = newStart;
    endBPM = newEnd;
    currentBPM = startBPM;
    tickCounter = 1;
    tickAmount = newAmount;
    bpmStep = newStep;
  };

  /* Called at every tick of the metronome, to update the progress bars and the
  visual feedback */
  var updateTickUI = function() {
    var stepTimes = ((endBPM - startBPM) / bpmStep) + 1;
    var progress = (tickCounter / tickAmount) / stepTimes;
    if (tickCounter === 1) {
      var currentStep = ((currentBPM - startBPM) / bpmStep) + 1;
      $(".progress :last-child").after($("<div class='progress-bar'>").width(0).css("background-color", currentStep % 2 === 0 ? "#17861f" : "#28b916"));
      if (currentBPM != startBPM) {
        $(".new-tempo").attr("data-active", true);
        setTimeout(function() {
          $(".new-tempo").attr("data-active", false);
        }, util.bpmToMs(currentBPM) * tickAmount * 0.5 > 2000 ? 2000 : util.bpmToMs(currentBPM) * tickAmount * 0.5);
      }
    }
    $(".progress div:nth-last-child(2)").css("width", progress * 100 + "%").text(currentBPM);

    $(".pulse").attr("data-active", true);
    setTimeout(function() {
      $(".pulse").attr("data-active", false);
    }, 100);
  }

  /* Called at every tick of the metronome, in order to update the state
  variables */
  var incrementTick = function() {
    updateTickUI();
    tickCounter++;
    if (tickCounter === tickAmount + 1) {
      currentBPM += bpmStep;
      tickCounter = 1;
      if (currentBPM > endBPM) {
        playing = false;
        freshState = true;

        $(".settings input").prop("disabled", false);
        $(".settings .handle").attr("data-disabled", false);
        $(".play-toggle").text("\u25B6").attr("data-active", false);
      }
    }
  };

  /* The Timeout callback, which plays the metronome tick sound */
  var setTimeoutCallback = function() {
    if (playing) {
      $(".counter").text(tickCounter);
      audio.play();
      setTimeout(setTimeoutCallback, util.bpmToMs(currentBPM));
      incrementTick();
    }
  };

  /* Connects event handlers for the play toggle button */
  $(".play-toggle").on("click", function() {
    if ($(".play-toggle").attr("data-disabled") == "true") {
      return;
    }

    if (freshState) {
      $(".progress").empty();
      $(".progress").append($("<div class='progress-bar'>"));
      var currentStart = parseInt($(".start input").val());
      var currentEnd = parseInt($(".end input").val());
      var currentStep = parseInt($(".step input").val());
      setSettings(
        currentStart, currentEnd, currentStep,
        util.calculateTickAmount(currentStart, currentEnd, currentStep,
          parseInt($(".time input").val()))
      );

      $(".settings div:not(.volume) input").prop("disabled", true);
      $(".settings div:not(.volume) .handle").attr("data-disabled", true);
    }

    if (!playing) {
      $(".play-toggle").text("\u275A\u275A").attr("data-active", true);
      incrementTick();
      audio.play();
      playing = true;
      freshState = false;
      setTimeout(setTimeoutCallback, util.bpmToMs(currentBPM));
    } else {
      $(".play-toggle").text("\u25B6").attr("data-active", false);
      playing = false;
    }
  });
});
