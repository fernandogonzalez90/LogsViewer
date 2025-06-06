document.addEventListener("DOMContentLoaded", () => {
  // Add hover effects to file items
  const fileItems = document.querySelectorAll(".file-item");

  fileItems.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      item.style.transform = "translateX(8px)";
    });

    item.addEventListener("mouseleave", () => {
      item.style.transform = "translateX(0)";
    });
  });

  // Add fade-in animation to items
  fileItems.forEach((item, index) => {
    setTimeout(() => {
      item.classList.add("fade-in");
    }, index * 50);
  });
});
