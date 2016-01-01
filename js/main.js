$(document).ready(function() {
  var MINBPM = 30;
  var MAXBPM = 280;
  var MINSTEP = 1;
  var MAXSTEP = 30;
  var MINTIME = 1;
  var MAXTIME = 60;
  var MINVOLUME = 1;
  var MAXVOLUME = 100;
  var VOLUMESCALING = 0.01;
  var freshState = true;

  var HANDLEOFFSET = 30;

  var playing, startBPM, endBPM, currentBPM, tickCounter, tickAmount, bpmStep;
  var audio = new Audio('res/tick.mp3');

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
    }
  };

  // INITIALIZE SETTTINGS
  (function() {
    $(".settings div input").prop("disabled", false);

    var $inputs = $(".settings input");
    $inputs.change(function() {
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
          var min, max;
          if (parent.is(".start") || parent.is(".end")) {
            min = MINBPM;
            max = MAXBPM;
          } else if (parent.is(".step")) {
            min = MINSTEP;
            max = MAXSTEP;
          } else if (parent.is(".time")) {
            min = MINTIME;
            max = MAXTIME;
          } else if (parent.is(".volume")) {
            min = MINVOLUME;
            max = MAXVOLUME;
            audio.volume = intValue * VOLUMESCALING;
          }
          $(this).parent().children(".handle").css("bottom",
            HANDLEOFFSET + util.mapInputToOutput(intValue, min, max));

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

    var clicked = false;
    var $handle_target;
    var min, max;
    $(".settings .handle").on("mousedown", function(event) {
      clicked = true;
      $handle_target = $(event.target);
      $handle_target.attr("data-active", true);
      var parent = $handle_target.parent();
      if (parent.is(".start") || parent.is(".end")) {
        min = MINBPM;
        max = MAXBPM;
      } else if (parent.is(".step")) {
        min = MINSTEP;
        max = MAXSTEP;
      } else if (parent.is(".time")) {
        min = MINTIME;
        max = MAXTIME;
      } else if (parent.is(".volume")) {
        min = MINVOLUME;
        max = MAXVOLUME;
      }
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
        $(".play-toggle").text("OFF").attr("data-active", false);
      }
    }
  };

  var setTimeoutCallback = function() {
    if (playing) {
      $(".counter").text(tickCounter);
      audio.play();
      setTimeout(setTimeoutCallback, util.bpmToMs(currentBPM));
      incrementTick();
    }
  };

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
