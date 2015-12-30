// Max-BPM: 280

var util = {
  mapInputToOutput: function(input, min, max) {
    return 120 * ((input - min) / (max - min));
  },

  mapOutputToInput: function(output, min, max) {
    return Math.round((output / 150) * (max - min) + min);
  }
};

$(document).ready(function() {
  // INITIALIZE SETTTINGS
  (function() {
    var $inputs = $(".settings input");
    $inputs.change(function() {
      var value = $(this).val();
      if (isNaN(value)) {
        $(this).attr("data-invalid", true);
      } else {
        var parent = $(this).parent();
        var intValue = parseInt(value);
        if ((parent.is(".start") && intValue >= 30 && intValue <= 280) ||
            (parent.is(".end") && intValue >= 30 && intValue <= 280) ||
            (parent.is(".increase") && intValue >= 1 && intValue <= 30) ||
            (parent.is(".time") && intValue >= 1 && intValue <= 60)) {
          $(this).attr("data-invalid", false);
          var min, max;
          if (parent.is(".start") || parent.is(".end")) {
            min = 30;
            max = 280;
          } else if (parent.is(".increase")) {
            min = 1;
            max = 30;
          } else if (parent.is(".time")) {
            min = 1;
            max = 60;
          }
          $(this).parent().children(".handle").css("bottom", 30 + util.mapInputToOutput(intValue, min, max));
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
        min = 30;
        max = 280;
      } else if (parent.is(".increase")) {
        min = 1;
        max = 30;
      } else if (parent.is(".time")) {
        min = 1;
        max = 60;
      }
    });

    $("body").on("mousemove", function(event) {
      if (clicked) {
        if ($(".line").offset().top + 165 - event.pageY <= 30) {
          $handle_target.css("bottom", 30);
          $handle_target.parent().children("input").val(min);
          return;
        } else if ($(".line").offset().top + 15 - event.pageY >= 0) {
          $handle_target.css("bottom", 150);
          $handle_target.parent().children("input").val(max);
          return;
        }
        $handle_target.css("bottom", $(".line").offset().top + 165 - event.pageY);
        $handle_target.parent().children("input").val(
          util.mapOutputToInput(parseInt($handle_target.css("bottom")) - 30, min, max));
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
  })();


  var playing, finished, startBPM, endBPM, currentBPM, tickCounter, tickAmount, bpmIncrease;
  var audio = new Audio('res/tick.mp3');
  audio.volume = 0.1;

  var setSettings = function(newStart, newEnd, newAmount, newIncrease) {
    playing = false;
    finished = false;
    startBPM = newStart;
    endBPM = newEnd;
    currentBPM = startBPM;
    tickCounter = 1;
    tickAmount = newAmount;
    bpmIncrease = newIncrease;
  };

  var bpmToMs = function(bpm) {
    return Math.round((60 / bpm) * 1000);
  };

  var updateTickUI = function() {
    var increaseTimes = ((endBPM - startBPM) / bpmIncrease) + 1;
    var progress = (tickCounter / tickAmount) / increaseTimes;
    if (tickCounter === 1) {
      var currentIncrease = ((currentBPM - startBPM) / bpmIncrease) + 1;
      $(".progress :last-child").after($("<div class='progress-bar'>").width(0).css("background-color", currentIncrease % 2 === 0 ? "#FF7F00" : "#994c00"));
      if (currentBPM != startBPM) {
        $(".new-tempo").attr("data-active", true);
        setTimeout(function() {
          $(".new-tempo").attr("data-active", false);
        }, bpmToMs(currentBPM) * tickAmount * 0.5 > 2000 ? 2000 : bpmToMs(currentBPM) * tickAmount * 0.5);
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
      currentBPM += bpmIncrease;
      tickCounter = 1;
      if (currentBPM > endBPM) {
        playing = false;
        finished = true;
        $(".play-toggle").text("OFF").attr("data-active", false);
      }
    }
  };

  var setTimeoutCallback = function() {
    if (playing) {
      $(".counter").text(tickCounter);
      audio.play();
      setTimeout(setTimeoutCallback, bpmToMs(currentBPM));
      incrementTick();
    }
  };

  $(".play-toggle").on("click", function() {
    if (finished) {
      return;
    }
    if (!playing) {
      $(".play-toggle").text("ON").attr("data-active", true);
      $(".counter").text(tickCounter);
      incrementTick();
      audio.play();
      playing = true;
      setTimeout(setTimeoutCallback, bpmToMs(currentBPM));
    } else {
      $(".play-toggle").text("OFF").attr("data-active", false);
      playing = false;
    }
  });
});
