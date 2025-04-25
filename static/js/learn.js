$(document).ready(function () {

        let $slider = $('#oz-slider-learn');
        let $pourBtn = $('#pour-button-learn');
        let $continueBtn = $('#continue-button');
        let $pointer = $('#slider-pointer');

        if ($slider.length && $pourBtn.length && $continueBtn.length) {
                let correctIndex = parseInt($slider.data('correct'));
                let options = JSON.parse($slider.attr('data-options'));
            
                function updatePointerPosition(selectedIndex) {
                        let $ticks = $('.scale .tick');
                        let selectedTick = $ticks.get()[selectedIndex];
                        let correctTick = $ticks.get().reverse()[correctIndex];
                    
                        if (!correctTick || !selectedTick) return;
                    
                        let offset = $(selectedTick).offset();
                        let height = $(selectedTick).outerHeight();
                        let pointerOffsetY = 20; // how far above/below to offset the triangle
                    
                        let centerX = offset.left + $(selectedTick).outerWidth() / 2 + 2;
                    
                        if (selectedIndex < correctIndex) {
                            // Show pointer above the selected tick
                            $pointer.removeClass('down').addClass('up').removeClass('hidden');
                            $pointer.css({
                                top: offset.top - pointerOffsetY,
                                left: centerX
                            });
                        } else if (selectedIndex > correctIndex) {
                            // Show pointer below the selected tick
                            $pointer.removeClass('up').addClass('down').removeClass('hidden');
                            $pointer.css({
                                top: offset.top + height + pointerOffsetY,
                                left: centerX
                            });
                        } else {
                            // Hide when selected is correct
                            $pointer.addClass('hidden');
                        }
                    }
                    
            
                // Init state
                updatePointerPosition(parseInt($slider.val()));

                // Initially disable POUR and CONTINUE
                $pourBtn.prop('disabled', true);
                $continueBtn.addClass('disabled').attr('aria-disabled', 'true');

                $slider.on('input change', function () {
                        let selectedIndex = parseInt($slider.val());
                        updatePointerPosition(selectedIndex);
                        $pourBtn.prop('disabled', selectedIndex !== correctIndex);
                });

                $pourBtn.on('click', function () {
                        $slider.prop('disabled', true); // disable dragging
                        $continueBtn.removeClass('disabled').removeAttr('aria-disabled');
                        $pointer.addClass('hidden'); // Hide the pointer on submit
                });
        }
              
        $('.nav-link').on('click', function (e) {
                e.preventDefault(); // Prevent default anchor behavior
    
                const nextUrl = $(this).data("url") || $(this).attr("href");
    
                // Send POST request to log_exit
                $.ajax({
                        url: '/log_exit',
                        type: 'POST',
                        success: function () {
                        window.location.href = nextUrl;
                },
                error: function () {
                        // Even if logging fails, still continue
                        window.location.href = nextUrl;
                }
                });
        });

        //for tool selection mixing lesson:
        let $toolOptions = $(".tool-option");
        let $nextBtn = $("#continue-button");
      
        let correctTool = $(".tool-selection").data("correct-tool");
      
        if ($toolOptions.length) {
                $nextBtn.addClass("disabled").attr("aria-disabled", "true");
            
                $toolOptions.on("click", function () {
                  let selectedTool = $(this).data("tool");
            
                  // Remove prior styling
                  $toolOptions.removeClass("correct-tool wrong-tool");
            
                  if (selectedTool === correctTool) {
                    $(this).addClass("correct-tool");
                    $nextBtn.removeClass("disabled").removeAttr("aria-disabled");
                    $toolOptions.addClass("locked").css("pointer-events", "none");
                  } else {
                    $(this).addClass("wrong-tool");
            
                    
                    setTimeout(() => {
                      $(this).removeClass("wrong-tool");
                    }, 500);
            
                    $nextBtn.addClass("disabled").attr("aria-disabled", "true");
                  }
                });
        }

        // For handling GIF playback on POUR press (only once)
        let gifPlayed = false;

        if ($('#gif-container').length) {
                $('#pour-button-learn').on('click', function () {
                        if (gifPlayed) return;

                        let $container = $('#gif-container');
                        let gifName = $('#pour-button-learn').data('asset_name');
                        let gifPath = "/static/images/" + $('#pour-button-learn').data('asset_name');

                        // Replace static image with the GIF
                        $('#static-gif').remove();

                        let $gif = $('<img>', {
                                src: gifPath + "?t=" + new Date().getTime(), // bust cache
                                alt: gifName,
                                class: 'static-gif'
                        });

                        $container.append($gif);

                        // Prevent replay
                        gifPlayed = true;
                        $(this).prop('disabled', true);
                });
        }

});
