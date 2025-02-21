import { useState } from "react";

const ImageGallery = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!images || images.length === 0) {
    return <p className="text-center text-gray-500">No images available</p>;
  }

  // Determine the grid configuration based on the number of images
  let gridClass = "";
  if (images.length === 1) {
    gridClass = "flex justify-center";
  } else if (images.length === 2) {
    gridClass = "grid grid-cols-2 gap-3";
  } else if (images.length === 3) {
    gridClass = "grid grid-cols-3 gap-3";
  } else if (images.length === 4) {
    gridClass = "grid grid-cols-4 gap-3";
  } else {
    gridClass = "grid grid-cols-5 gap-3";
  }

  return (
    <>
      {/* Image Display Based on Image Count */}
      <div className={`w-full p-4 ${gridClass}`}>
        {images.map((image, index) => (
          <div key={index} className="relative">
            <img
              src={image.base64 || image} // Supports both base64 and URL
              alt={`Images ${index + 1}`}
              className={`rounded-lg shadow-md cursor-pointer ${images.length === 1 ? "w-full h-auto max-h-[80vh]" : "w-full h-60 object-cover"}`}
              onClick={() => setSelectedImage(image.base64 || image)}
            />
          </div>
        ))}
      </div>

      {/* Zoomed Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 bg-black bg-opacity-70 text-white text-2xl font-bold 
                         w-10 h-10 flex items-center justify-center rounded-full hover:bg-opacity-90 transition"
              onClick={() => setSelectedImage(null)}
            >
              &times;
            </button>
            <img
              src={selectedImage}
              alt="Zoomed"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;
