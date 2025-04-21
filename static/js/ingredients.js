const imageData = [
{ src: "https://via.placeholder.com/150?text=1", text: "This is image 1" },
{ src: "https://via.placeholder.com/150?text=2", text: "This is image 2" },
{ src: "https://via.placeholder.com/150?text=3", text: "This is image 3" },
{ src: "https://via.placeholder.com/150?text=4", text: "This is image 4" },
{ src: "https://via.placeholder.com/150?text=5", text: "This is image 5" }
];

$(document).ready(function() {
        const $row = $("#image-row");
        const $bubble = $("#text-bubble");

        // Add image elements
        imageData.forEach((item, index) => {
                const $container = $(`
                        <div class="image-container" data-index="${index}">
                        <img src="${item.src}" alt="Image ${index + 1}">
                        </div>
                `);
                $row.append($container);
        });

        // Show bubble on image click
        $row.on("click", ".image-container", function(e) {
                e.stopPropagation();
                const index = $(this).data("index");
                $bubble.text(imageData[index].text).fadeIn(200);
        });

        // Hide bubble if clicking outside
        $(document).on("click", function(e) {
                if (!$(e.target).closest("#text-bubble, .image-container").length) {
                        $bubble.fadeOut(200);
                }
        });

        $("#back-btn").click(function() {
                window.location.href = "/";
        });

        $("#next-btn").click(function() {
                window.location.href = "/learn/2";
        });
});