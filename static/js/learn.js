$(document).ready(function () {

        var $slider = $('#oz-slider-learn');
        var $pourBtn = $('#pour-button-learn');
        var $continueBtn = $('#continue-button');

        if ($slider.length && $pourBtn.length && $continueBtn.length) {
                var correctIndex = parseInt($slider.data('correct'));

                // Initially disable POUR and CONTINUE
                $pourBtn.prop('disabled', true);
                $continueBtn.addClass('disabled').attr('aria-disabled', 'true');

                $slider.on('input change', function () {
                        var selectedIndex = parseInt($slider.val());
                        $pourBtn.prop('disabled', selectedIndex !== correctIndex);
                });

                $pourBtn.on('click', function () {
                        $slider.prop('disabled', true); // disable dragging
                        $continueBtn.removeClass('disabled').removeAttr('aria-disabled');
                });
        }
              
        $('.nav-link').on('click', function (e) {
                e.preventDefault(); // Prevent default anchor behavior
    
                const nextUrl = $(this).data('url');
    
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
});