window.addEventListener("load", function () {
    const loader = document.getElementById("loader");
    
    // Sayfa yüklense bile en az 1.2 saniye loader göster
    setTimeout(() => {
      loader.style.opacity = "0";
      setTimeout(() => {
        loader.style.display = "none";
      }, 500); // fade-out animasyonu süresi
    }, 1200); // minimum görünme süresi
  });