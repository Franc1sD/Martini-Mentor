$(document).ready(function () {
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