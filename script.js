/* =========================================
   NEXORA IMAGE TOOLS
   GAURAVDEVTECH
========================================= */

const imageInput = document.getElementById("imageInput");
const dropZone = document.getElementById("dropZone");

const editor = document.getElementById("editor");
const previewImage = document.getElementById("previewImage");

const widthInput = document.getElementById("width");
const heightInput = document.getElementById("height");

const aspectRatioCheckbox = document.getElementById("aspectRatio");

const formatSelect = document.getElementById("format");

const qualityInput = document.getElementById("quality");
const qualityValue = document.getElementById("qualityValue");
const qualityGroup = document.getElementById("qualityGroup");

const resizeButton = document.getElementById("resizeButton");
const resetButton = document.getElementById("resetButton");

const originalInfo = document.getElementById("originalInfo");
const status = document.getElementById("status");


let originalImage = null;
let originalWidth = 0;
let originalHeight = 0;
let aspectRatio = 1;


/* =========================================
   IMAGE SELECTION
========================================= */

imageInput.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) {
        return;
    }

    loadImage(file);
});


/* =========================================
   DRAG & DROP
========================================= */

dropZone.addEventListener("dragover", function (event) {

    event.preventDefault();

    dropZone.classList.add("drag-over");
});


dropZone.addEventListener("dragleave", function () {

    dropZone.classList.remove("drag-over");
});


dropZone.addEventListener("drop", function (event) {

    event.preventDefault();

    dropZone.classList.remove("drag-over");

    const file = event.dataTransfer.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {

        showStatus(
            "Please select a valid image file.",
            "error"
        );

        return;
    }

    loadImage(file);
});


/* =========================================
   LOAD IMAGE
========================================= */

function loadImage(file) {

    if (!file.type.startsWith("image/")) {

        showStatus(
            "Please select a valid image.",
            "error"
        );

        return;
    }


    const reader = new FileReader();


    reader.onload = function (event) {

        const image = new Image();


        image.onload = function () {

            originalImage = image;

            originalWidth = image.naturalWidth;
            originalHeight = image.naturalHeight;

            aspectRatio =
                originalWidth / originalHeight;


            widthInput.value = originalWidth;
            heightInput.value = originalHeight;


            previewImage.src = event.target.result;


            originalInfo.textContent =
                `Original: ${originalWidth} × ${originalHeight}px • ${formatBytes(file.size)}`;


            dropZone.classList.add("hidden");

            editor.classList.remove("hidden");

            clearStatus();
        };


        image.onerror = function () {

            showStatus(
                "Unable to load this image.",
                "error"
            );
        };


        image.src = event.target.result;
    };


    reader.readAsDataURL(file);
}


/* =========================================
   WIDTH → HEIGHT
========================================= */

widthInput.addEventListener("input", function () {

    if (!aspectRatioCheckbox.checked) {
        return;
    }

    const width = Number(this.value);

    if (!width || width <= 0) {
        return;
    }

    const height =
        Math.round(width / aspectRatio);

    heightInput.value = height;
});


/* =========================================
   HEIGHT → WIDTH
========================================= */

heightInput.addEventListener("input", function () {

    if (!aspectRatioCheckbox.checked) {
        return;
    }

    const height = Number(this.value);

    if (!height || height <= 0) {
        return;
    }

    const width =
        Math.round(height * aspectRatio);

    widthInput.value = width;
});


/* =========================================
   ASPECT RATIO
========================================= */

aspectRatioCheckbox.addEventListener("change", function () {

    if (this.checked) {

        const width = Number(widthInput.value);

        if (width > 0) {

            heightInput.value =
                Math.round(width / aspectRatio);
        }
    }
});


/* =========================================
   QUALITY SLIDER
========================================= */

qualityInput.addEventListener("input", function () {

    qualityValue.textContent =
        `${this.value}%`;
});


/* =========================================
   FORMAT CHANGE
========================================= */

formatSelect.addEventListener("change", function () {

    if (this.value === "image/png") {

        qualityGroup.style.opacity = "0.45";

        qualityInput.disabled = true;

    } else {

        qualityGroup.style.opacity = "1";

        qualityInput.disabled = false;
    }
});


/* =========================================
   RESIZE & DOWNLOAD
========================================= */

resizeButton.addEventListener("click", function () {

    if (!originalImage) {

        showStatus(
            "Please select an image first.",
            "error"
        );

        return;
    }


    const width = Number(widthInput.value);
    const height = Number(heightInput.value);


    if (
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width <= 0 ||
        height <= 0
    ) {

        showStatus(
            "Please enter valid dimensions.",
            "error"
        );

        return;
    }


    if (width > 10000 || height > 10000) {

        showStatus(
            "Maximum dimension is 10,000 × 10,000 pixels.",
            "error"
        );

        return;
    }


    resizeButton.disabled = true;

    resizeButton.textContent =
        "Processing...";


    setTimeout(() => {

        try {

            const canvas =
                document.createElement("canvas");


            canvas.width = width;
            canvas.height = height;


            const context =
                canvas.getContext("2d");


            context.imageSmoothingEnabled = true;

            context.imageSmoothingQuality = "high";


            context.drawImage(
                originalImage,
                0,
                0,
                width,
                height
            );


            const format =
                formatSelect.value;


            const quality =
                Number(qualityInput.value) / 100;


            canvas.toBlob(
                function (blob) {

                    if (!blob) {

                        showStatus(
                            "Could not create the image.",
                            "error"
                        );

                        resetResizeButton();

                        return;
                    }


                    downloadImage(
                        blob,
                        format,
                        width,
                        height
                    );


                    showStatus(
                        `Done! ${width} × ${height}px image downloaded.`,
                        "success"
                    );


                    resetResizeButton();

                },
                format,
                format === "image/png"
                    ? undefined
                    : quality
            );

        } catch (error) {

            console.error(error);

            showStatus(
                "Something went wrong while processing the image.",
                "error"
            );

            resetResizeButton();
        }

    }, 100);
});


/* =========================================
   DOWNLOAD
========================================= */

function downloadImage(
    blob,
    format,
    width,
    height
) {

    const url =
        URL.createObjectURL(blob);


    const extension =
        getExtension(format);


    const link =
        document.createElement("a");


    link.href = url;


    link.download =
        `nexora-${width}x${height}.${extension}`;


    document.body.appendChild(link);

    link.click();

    link.remove();


    setTimeout(() => {

        URL.revokeObjectURL(url);

    }, 1000);
}


/* =========================================
   FILE EXTENSION
========================================= */

function getExtension(format) {

    switch (format) {

        case "image/png":
            return "png";

        case "image/webp":
            return "webp";

        case "image/jpeg":
        default:
            return "jpg";
    }
}


/* =========================================
   RESET / CHANGE IMAGE
========================================= */

resetButton.addEventListener("click", resetTool);


function resetTool() {

    originalImage = null;

    originalWidth = 0;
    originalHeight = 0;

    imageInput.value = "";

    previewImage.removeAttribute("src");

    widthInput.value = "";
    heightInput.value = "";

    originalInfo.textContent = "";

    editor.classList.add("hidden");

    dropZone.classList.remove("hidden");

    clearStatus();

    resetResizeButton();
}


/* =========================================
   STATUS
========================================= */

function showStatus(message, type) {

    status.textContent = message;

    status.className =
        `status ${type}`;
}


function clearStatus() {

    status.textContent = "";

    status.className =
        "status";
}


/* =========================================
   BUTTON RESET
========================================= */

function resetResizeButton() {

    resizeButton.disabled = false;

    resizeButton.textContent =
        "Resize & Download";
}


/* =========================================
   FILE SIZE
========================================= */

function formatBytes(bytes) {

    if (bytes === 0) {
        return "0 Bytes";
    }


    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];


    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    return (
        parseFloat(
            (bytes / Math.pow(1024, index))
                .toFixed(2)
        )
        + " "
        + units[index]
    );
}
