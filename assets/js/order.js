(function () {
  const foods = [
    "出前一丁",
    "烏冬",
    "米線",
    "炒飯 (+$8)",
    "炒麵 (+$8)",
    "炒烏冬 (+$8)",
    "蒜蓉辣醬炒飯 (+$10)",
    "蒜蓉辣醬炒麵 (+$10)",
    "蒜蓉辣醬炒烏冬 (+$10)",
  ];

  const stocks = ["日本清湯", "番茄洋葱湯", "麻辣湯 (+$8)", "芝士撈 (+$8)"];

  const sideItems = [
    "生炸雞翼",
    "生炸雞髀 (+$20)",
    "水魷",
    "牛栢葉",
    "鴨胸",
    "豬頸肉",
    "五花腩",
    "多春魚",
    "午餐肉",
    "廚師腸",
    "雞腎",
    "豆卜",
    "冬菇",
    "粟米",
    "茄子",
    "蘿蔔",
    "時菜",
    "翠玉瓜",
    "煙肉金菇",
    "魚皮餃",
    "墨魚丸",
    "牛丸",
    "芝心丸",
  ];

  const state = {
    step: 1,
    name: "",
    food: null,
    stock: null,
    sides: [],
    remarks: "",
  };

  const els = {
    orderNumber: document.getElementById("orderNumber"),
    validation: document.getElementById("validationMessage"),
    stepIndicators: document.querySelectorAll("[data-step-indicator]"),
    steps: document.querySelectorAll("[data-step]"),
    nameInput: document.getElementById("nameInput"),
    foodOptions: document.getElementById("foodOptions"),
    stockSection: document.getElementById("stockSection"),
    stockOptions: document.getElementById("stockOptions"),
    sideOptions: document.getElementById("sideOptions"),
    remarksInput: document.getElementById("remarksInput"),
    summary: {
      name: document.getElementById("summaryName"),
      food: document.getElementById("summaryFood"),
      stock: document.getElementById("summaryStock"),
      sides: document.getElementById("summarySides"),
      remarks: document.getElementById("summaryRemarks"),
    },
    historyIntro: document.getElementById("historyIntro"),
    historyList: document.getElementById("orderHistory"),
    confirmationHint: document.getElementById("confirmationHint"),
    resetOrder: document.getElementById("resetOrder"),
    refreshHistory: document.getElementById("refreshHistory"),
    clearHistory: document.getElementById("clearHistory"),
    editSides: document.getElementById("editSides"),
    confirmOrder: document.getElementById("confirmOrder"),
  };

  const totalSteps = 4;
  const storageKey = "orderHistory";

  function loadHistory() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("failed to read history", err);
      return [];
    }
  }

  function saveHistory(history) {
    localStorage.setItem(storageKey, JSON.stringify(history));
  }

  function getNextOrderNumber() {
    const history = loadHistory();
    return history.length ? history[history.length - 1].number + 1 : 1;
  }

  function setOrderNumber() {
    els.orderNumber.textContent = getNextOrderNumber();
  }

  function renderOptions() {
    els.foodOptions.innerHTML = foods
      .map(
        (label, idx) => `
        <label class="option-tile">
          <input type="radio" name="food" value="${idx}">
          <span class="font-weight-semibold">${idx + 1}. ${label}</span>
        </label>
      `
      )
      .join("");

    els.stockOptions.innerHTML = stocks
      .map(
        (label, idx) => `
        <label class="option-tile">
          <input type="radio" name="stock" value="${idx}">
          <span class="font-weight-semibold">${idx + 1}. ${label}</span>
        </label>
      `
      )
      .join("");

    els.sideOptions.innerHTML = sideItems
      .map(
        (label, idx) => `
        <label class="option-tile mb-0">
          <input type="checkbox" name="side" value="${idx}">
          <span>${idx + 1}. ${label}</span>
        </label>
      `
      )
      .join("");
  }

  function resetStocksSelection() {
    els.stockOptions
      .querySelectorAll('input[name="stock"]')
      .forEach((input) => {
        input.checked = false;
      });
    state.stock = null;
  }

  function updateStockSection() {
    const requiresStock = state.food !== null && state.food <= 2;
    els.stockSection.classList.toggle("d-none", !requiresStock);
    if (!requiresStock) {
      resetStocksSelection();
    }
  }

  function showStep(step) {
    state.step = Math.min(Math.max(step, 1), totalSteps);
    els.steps.forEach((section) => {
      const sectionStep = Number(section.dataset.step);
      section.classList.toggle("d-none", sectionStep !== state.step);
    });
    els.stepIndicators.forEach((indicator) => {
      const indicatorStep = Number(indicator.dataset.stepIndicator);
      indicator.classList.toggle("active", indicatorStep === state.step);
    });
    hideValidation();
  }

  function hideValidation() {
    els.validation.classList.add("d-none");
    els.validation.textContent = "";
  }

  function showValidation(message) {
    els.validation.textContent = message;
    els.validation.classList.remove("d-none");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateSummary() {
    els.summary.name.textContent = state.name || "—";
    els.summary.food.textContent =
      state.food !== null ? foods[state.food] : "—";
    els.summary.stock.textContent =
      state.food !== null && state.food <= 2
        ? state.stock !== null
          ? stocks[state.stock]
          : "（未揀湯底）"
        : "—";
    els.summary.sides.textContent = state.sides.length
      ? state.sides.map((i) => sideItems[i]).join("、")
      : "—";
    const remarkText =
      state.remarks && state.remarks !== "0" ? state.remarks : "（冇特別要求）";
    els.summary.remarks.textContent = remarkText;
  }

  function resetConfirmationHint() {
    els.confirmationHint.classList.remove("alert-success");
    els.confirmationHint.classList.add("alert-secondary");
    els.confirmationHint.textContent =
      "完成每一步後，按「確認落單」會將訂單寫入瀏覽器的模擬 output.txt。";
  }

  function renderHistory() {
    const history = loadHistory();
    els.historyList.innerHTML = "";
    if (!history.length) {
      els.historyIntro.textContent = "暫時未有任何紀錄。";
      return;
    }
    const firstTime = new Date(history[0].createdAt).toLocaleString("zh-HK", {
      timeZone: "Asia/Hong_Kong",
    });
    els.historyIntro.textContent = `已在本機建立 output.txt：${firstTime}`;
    history.forEach((order) => {
      const item = document.createElement("div");
      item.className = "history-item";
      const ts = new Date(order.createdAt).toLocaleString("zh-HK", {
        timeZone: "Asia/Hong_Kong",
      });
      const stockText = order.stock ? `${order.stock} ` : "";
      item.textContent = `${order.number}. ${order.name} ${order.food} ${stockText}${order.sides.join(
        " "
      )} ${order.remarks || ""} (${ts})`;
      els.historyList.appendChild(item);
    });
  }

  function validateStep(step) {
    hideValidation();
    if (step === 1 && !state.name.trim()) {
      showValidation("請先輸入名字。");
      return false;
    }
    if (step === 2) {
      if (state.food === null) {
        showValidation("請選擇主食。");
        return false;
      }
      if (state.food <= 2 && state.stock === null) {
        showValidation("主食為湯類時，必須選擇湯底。");
        return false;
      }
    }
    if (step === 3) {
      if (state.sides.length < 3) {
        showValidation("最少揀三個餸。");
        return false;
      }
      if (state.sides.length > 6) {
        showValidation("最多只能選六個餸。");
        return false;
      }
    }
    return true;
  }

  function persistOrder() {
    const history = loadHistory();
    const number = getNextOrderNumber();
    const record = {
      number,
      name: state.name.trim(),
      food: foods[state.food],
      stock:
        state.food !== null && state.food <= 2 && state.stock !== null
          ? stocks[state.stock]
          : "",
      sides: state.sides.map((i) => sideItems[i]),
      remarks:
        state.remarks && state.remarks !== "0" ? state.remarks : "",
      createdAt: new Date().toISOString(),
    };
    if (!history.length) {
      record.fileOpenedAt = record.createdAt;
    }
    history.push(record);
    saveHistory(history);
    setOrderNumber();
    renderHistory();
  }

  function resetForm(options = {}) {
    const { keepMessage = false } = options;
    state.step = 1;
    state.name = "";
    state.food = null;
    state.stock = null;
    state.sides = [];
    state.remarks = "";
    els.nameInput.value = "";
    els.remarksInput.value = "";
    els.foodOptions
      .querySelectorAll('input[name="food"]')
      .forEach((input) => (input.checked = false));
    resetStocksSelection();
    els.sideOptions
      .querySelectorAll('input[name="side"]')
      .forEach((input) => (input.checked = false));
    hideValidation();
    updateStockSection();
    updateSummary();
    if (!keepMessage) {
      resetConfirmationHint();
    }
    showStep(1);
  }

  function attachEventHandlers() {
    document.querySelectorAll("[data-next]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (validateStep(state.step)) {
          showStep(state.step + 1);
        }
      });
    });

    document.querySelectorAll("[data-prev]").forEach((btn) => {
      btn.addEventListener("click", () => {
        showStep(state.step - 1);
      });
    });

    els.nameInput.addEventListener("input", (e) => {
      state.name = e.target.value;
      updateSummary();
    });

    els.foodOptions.addEventListener("change", (e) => {
      if (e.target.name === "food") {
        state.food = Number(e.target.value);
        updateStockSection();
        updateSummary();
      }
    });

    els.stockOptions.addEventListener("change", (e) => {
      if (e.target.name === "stock") {
        state.stock = Number(e.target.value);
        updateSummary();
      }
    });

    els.sideOptions.addEventListener("change", (e) => {
      if (e.target.name === "side") {
        const checked = Array.from(
          els.sideOptions.querySelectorAll('input[name="side"]:checked')
        ).map((input) => Number(input.value));
        if (checked.length > 6) {
          e.target.checked = false;
          showValidation("最多只能選六個餸。");
          return;
        }
        state.sides = checked;
        hideValidation();
        updateSummary();
      }
    });

    els.remarksInput.addEventListener("input", (e) => {
      state.remarks = e.target.value.trim();
      updateSummary();
    });

    els.confirmOrder.addEventListener("click", () => {
      const valid =
        validateStep(1) && validateStep(2) && validateStep(3) && validateStep(4);
      if (!valid) {
        return;
      }
      persistOrder();
      els.confirmationHint.classList.replace(
        "alert-secondary",
        "alert-success"
      );
      els.confirmationHint.textContent = "落單完成，有嘢食會嗌你^^";
      resetForm({ keepMessage: true });
    });

    els.resetOrder.addEventListener("click", () => resetForm());
    els.refreshHistory.addEventListener("click", renderHistory);
    els.clearHistory.addEventListener("click", () => {
      localStorage.removeItem(storageKey);
      renderHistory();
      setOrderNumber();
    });
    els.editSides.addEventListener("click", () => {
      showStep(3);
    });
  }

  function init() {
    renderOptions();
    attachEventHandlers();
    updateStockSection();
    updateSummary();
    resetConfirmationHint();
    setOrderNumber();
    renderHistory();
  }

  init();
})();

