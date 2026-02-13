export async function downloadFile(url: string, filename?: string) {
  try {
    // Attempt standard download via fetch for better cross-origin support
    // This allows us to get the blob and create a temporary object URL
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename || url.split('/').pop() || "download";
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objectUrl);
    }, 100);
    
    return true;
  } catch (error) {
    console.error("Download failed, falling back to direct link:", error);
    
    // Fallback: Just open in new tab if fetch fails (e.g. CORS)
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    return false; // Indicating fallback was used
  }
}
