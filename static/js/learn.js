$(document).ready(function () {

        let $slider = $('#oz-slider-learn');
        let $pourBtn = $('#pour-button-learn');
        let $continueBtn = $('#continue-button');

        if ($slider.length && $pourBtn.length && $continueBtn.length) {
                let correctIndex = parseInt($slider.data('correct'));

                // Initially disable POUR and CONTINUE
                $pourBtn.prop('disabled', true);
                $continueBtn.addClass('disabled').attr('aria-disabled', 'true');

                $slider.on('input change', function () {
                        let selectedIndex = parseInt($slider.val());
                        $pourBtn.prop('disabled', selectedIndex !== correctIndex);
                });

                $pourBtn.on('click', function () {
                        $slider.prop('disabled', true); // disable dragging
                        $continueBtn.removeClass('disabled').removeAttr('aria-disabled');
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
});
