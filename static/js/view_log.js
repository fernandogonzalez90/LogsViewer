document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const logContainer = document.getElementById("logContainer");
  const allLogLineElements = Array.from(
    logContainer.querySelectorAll(".log-line-item")
  );

  const searchInput = document.getElementById("searchInput");
  const filterForm = document.getElementById("filterForm");
  const clearBtn = document.getElementById("clearSearch");
  const clearAllBtn = document.getElementById("clearAllFilters");
  const filterControls = document.querySelectorAll(".filter-control");
  const matchInfoEl = document.getElementById("matchInfo");
  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");

  // State
  let currentMatches = [];
  let currentMatchIndex = -1;
  let isSearching = false;

  // Utility functions
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function showLoading() {
    if (!isSearching) {
      isSearching = true;
      matchInfoEl.innerHTML =
        '<i class="bi bi-hourglass-split me-1"></i>Buscando...';
    }
  }

  function hideLoading() {
    isSearching = false;
  }

  function highlightTextInLine(lineElement, query) {
    const originalText = lineElement.dataset.originalText;

    if (!query || query.trim() === "") {
      lineElement.innerHTML = originalText;
      return;
    }

    const escapedQuery = escapeRegExp(query);
    const regex = new RegExp(`(${escapedQuery})`, "gi");

    lineElement.innerHTML = originalText.replace(
      regex,
      `<span class="highlight">$1</span>`
    );
  }

  function updateMatchInfo() {
    hideLoading();

    if (currentMatches.length === 0) {
      const anyFilterActive =
        searchInput.value.trim() !== "" ||
        Array.from(document.querySelectorAll(".level-check:checked")).length >
          0 ||
        document.getElementById("dateFilter").value !== "" ||
        document.getElementById("loggerGXU").checked;
      if (anyFilterActive) {
        matchInfoEl.innerHTML =
          '<i class="bi bi-exclamation-circle me-1"></i>Sin coincidencias';
      } else {
        matchInfoEl.innerHTML = `<i class="bi bi-list-ul me-1"></i>${allLogLineElements.length} líneas`;
      }
      nextBtn.disabled = true;
      prevBtn.disabled = true;
    } else {
      matchInfoEl.innerHTML = `<i class="bi bi-check-circle me-1"></i>${
        currentMatchIndex + 1
      } de ${currentMatches.length}`;
      nextBtn.disabled = false;
      prevBtn.disabled = false;
    }
  }

  function applyFilters() {
    showLoading();

    requestAnimationFrame(() => {
      const queryFromInput = searchInput.value;
      const queryLower = queryFromInput.toLowerCase();

      const selectedLevels = Array.from(
        document.querySelectorAll(".level-check:checked")
      ).map((cb) => cb.value.toLowerCase());
      const selectedDate = document.getElementById("dateFilter").value;
      const onlyGXU = document.getElementById("loggerGXU").checked;

      if (
        currentMatchIndex !== -1 &&
        currentMatches[currentMatchIndex] &&
        currentMatches[currentMatchIndex].element
      ) {
        currentMatches[currentMatchIndex].element.classList.remove(
          "active-match"
        );
      }

      currentMatches = [];
      currentMatchIndex = -1;

      allLogLineElements.forEach((lineElement) => {
        const originalLineText = lineElement.dataset.originalText;
        if (typeof originalLineText !== "string") {
          console.warn("Elemento sin data-original-text:", lineElement);
          return;
        }
        const textContentForFilter = originalLineText.toLowerCase();

        const matchText =
          queryLower === "" || textContentForFilter.includes(queryLower);

        const matchLevel =
          selectedLevels.length === 0 ||
          selectedLevels.some((level) => {
            const levelLower = level.toLowerCase();
            const levelPattern = ` ${levelLower} `;
            const startsWithLevel = textContentForFilter.startsWith(
              `${levelLower} `
            );
            const containsLevelWord =
              textContentForFilter.includes(levelPattern);
            return containsLevelWord || startsWithLevel;
          });

        const matchLogger =
          !onlyGXU || textContentForFilter.includes("genexususerlog");

        let matchDate = selectedDate === "";
        if (selectedDate !== "") {
          matchDate = originalLineText.startsWith(selectedDate);
        }

        const isFrontendMatch =
          matchText && matchLevel && matchLogger && matchDate;

        lineElement.style.display = "";
        lineElement.classList.remove("active-match");

        if (isFrontendMatch) {
          currentMatches.push({ element: lineElement });
          highlightTextInLine(lineElement, queryFromInput);
        } else {
          lineElement.innerHTML = originalLineText;
        }
      });

      updateNavigationState();
    });
  }

  function updateNavigationState() {
    if (currentMatches.length > 0) {
      currentMatchIndex = 0;
      navigateToMatch(currentMatchIndex);
    } else {
      updateMatchInfo();
    }
  }

  function navigateToMatch(index) {
    if (currentMatches.length === 0) {
      updateMatchInfo();
      return;
    }

    if (index < 0 || index >= currentMatches.length) {
      console.warn("Índice de navegación fuera de rango:", index);
      return;
    }

    if (
      currentMatchIndex !== -1 &&
      currentMatchIndex < currentMatches.length &&
      currentMatches[currentMatchIndex].element
    ) {
      currentMatches[currentMatchIndex].element.classList.remove(
        "active-match"
      );
    }

    currentMatchIndex = index;
    const targetMatchData = currentMatches[currentMatchIndex];

    if (targetMatchData && targetMatchData.element) {
      targetMatchData.element.classList.add("active-match");

      // Scroll suave sin efectos de zoom
      targetMatchData.element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }
    updateMatchInfo();
  }

  // Event listeners
  filterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    applyFilters();
  });

  let searchTimeout;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 300);
  });

  filterControls.forEach((control) => {
    control.addEventListener("change", applyFilters);
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    applyFilters();
  });

  clearAllBtn.addEventListener("click", () => {
    searchInput.value = "";
    filterControls.forEach((control) => {
      if (control.type === "checkbox") control.checked = false;
      if (control.type === "date") control.value = "";
    });

    allLogLineElements.forEach((line) => {
      line.style.display = "";
      if (line.dataset.originalText) {
        line.innerHTML = line.dataset.originalText;
      }
      line.classList.remove("active-match");
    });

    currentMatches = [];
    currentMatchIndex = -1;
    updateMatchInfo();
  });

  nextBtn.addEventListener("click", () => {
    if (currentMatches.length === 0) return;
    const newIndex = (currentMatchIndex + 1) % currentMatches.length;
    navigateToMatch(newIndex);
  });

  prevBtn.addEventListener("click", () => {
    if (currentMatches.length === 0) return;
    const newIndex =
      (currentMatchIndex - 1 + currentMatches.length) % currentMatches.length;
    navigateToMatch(newIndex);
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      if (e.key === "Escape") searchInput.blur();
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "f":
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
          break;
        case "k":
          e.preventDefault();
          if (prevBtn.disabled === false) prevBtn.click();
          break;
        case "j":
          e.preventDefault();
          if (nextBtn.disabled === false) nextBtn.click();
          break;
      }
    } else if (e.key === "Escape") {
      searchInput.blur();
    }
  });

  // Initialize
  if (
    allLogLineElements.length === 0 &&
    !logContainer.querySelector(".empty-state")
  ) {
    const emptyStateDiv = document.createElement("div");
    emptyStateDiv.className = "empty-state";
    emptyStateDiv.innerHTML =
      '<i class="bi bi-file-earmark-excel"></i><p>No se cargaron líneas de log.</p>';
    logContainer.appendChild(emptyStateDiv);
    matchInfoEl.innerHTML = '<i class="bi bi-info-circle me-1"></i>0 líneas';
  } else {
    if (searchInput.value.trim() !== "") {
      applyFilters();
    } else {
      matchInfoEl.innerHTML = `<i class="bi bi-list-ul me-1"></i>${allLogLineElements.length} líneas`;
      nextBtn.disabled = true;
      prevBtn.disabled = true;
    }
  }
});
