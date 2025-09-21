"use client";

export default function FileModal({ visible, onClose, viewingFile, fileContent, handleBackdropClick }) {
  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300 ${
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-[#1A1A1F] p-6 rounded-xl max-w-3xl w-full max-h-[80vh] overflow-auto relative transition-transform duration-300 transform ${
          visible ? "scale-100" : "scale-95"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute right-6 px-2 py-1 bg-[#414562] hover:bg-[#545C80] transition-colors duration-200 cursor-pointer rounded-xl text-white"
        >
          Close
        </button>
        {viewingFile && (
          <>
            <h2 className="text-xl mb-4">{viewingFile}</h2>
            {fileContent.startsWith("http") &&
            fileContent.match(/\.(png|jpg|jpeg|gif)$/i) ? (
              <img
                src={fileContent}
                alt={viewingFile}
                className="max-w-full max-h-[70vh]"
              />
            ) : (
              <pre className="bg-[#1E1E23] p-4 rounded-xl text-sm overflow-auto">
                {fileContent}
              </pre>
            )}
          </>
        )}
      </div>
    </div>
  );
}
