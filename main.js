const clubs = {
  iron: {
    speed: 124.6,
    launch: 16.4,
    spin: 7120,
    carry: 168,
    smash: "1.38",
    p: 82,
  },
  driver: {
    speed: 168.4,
    launch: 11.2,
    spin: 2680,
    carry: 272,
    smash: "1.49",
    p: 94,
  },
  wedge: {
    speed: 86.2,
    launch: 28.1,
    spin: 9800,
    carry: 78,
    smash: "1.21",
    p: 64,
  },
};

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const nav = document.querySelector("[data-nav]");
const toggle = document.querySelector(".nav__toggle");
const menu = document.querySelector(".nav__links");

const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 8);
document.addEventListener("scroll", onScroll, { passive: true });
onScroll();

toggle.addEventListener("click", () => {
  const open = menu.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", String(open));
});

menu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  });
});

const countEls = () => [...document.querySelectorAll("[data-count]")];

function setCount(el, value) {
  const decimals = Number(el.dataset.decimals || 0);
  el.textContent = Number(value).toLocaleString("en-GB", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function runCount(el, value) {
  if (reduced) {
    setCount(el, value);
    return;
  }
  const decimals = Number(el.dataset.decimals || 0);
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / 1100);
    const eased = 1 - (1 - t) ** 3;
    setCount(el, value * eased);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function playShot(name, animateNumbers) {
  const data = clubs[name];
  document.querySelectorAll("[data-club]").forEach((button) => {
    const on = button.dataset.club === name;
    button.classList.toggle("is-on", on);
    button.setAttribute("aria-selected", String(on));
  });
  document.querySelectorAll("[data-arc]").forEach((arc) => {
    const show = arc.dataset.arc === name;
    arc.classList.toggle("is-on", show);
    if (!show) return;
    arc.style.animation = "none";
    void arc.offsetWidth;
    arc.style.animation = "";
  });
  const ball = document.querySelector(".tracer__ball");
  ball.dataset.shape = name;
  ball.style.animation = "none";
  void ball.offsetWidth;
  ball.style.animation = "";

  const fields = countEls();
  const values = [data.speed, data.launch, data.spin, data.carry];
  fields.forEach((el, index) => {
    if (animateNumbers) runCount(el, values[index]);
    else setCount(el, values[index]);
  });
  document.querySelector("[data-smash]").textContent = data.smash;
  document.querySelector(".smash").style.setProperty("--p", data.p);
}

document.querySelectorAll("[data-club]").forEach((button) => {
  button.addEventListener("click", () => playShot(button.dataset.club, true));
});

document.querySelector("[data-replay]").addEventListener("click", () => {
  const current = document.querySelector("[data-club].is-on").dataset.club;
  playShot(current, true);
});

playShot("iron", true);

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach((item) => {
      item.classList.toggle("is-on", item === button);
    });
    const land = button.dataset.filter;
    let shown = 0;
    document.querySelectorAll(".course").forEach((card) => {
      const visible = land === "all" || card.dataset.land === land;
      card.hidden = !visible;
      if (visible) shown += 1;
    });
    document.querySelector(".course-empty").hidden = shown > 0;
  });
});

const courseSelect = document.querySelector("#course");
const baySelect = document.querySelector("#bay");

document.querySelectorAll(".course").forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".course").forEach((item) => {
      item.classList.toggle("is-picked", item === card);
    });
    courseSelect.value = card.dataset.course;
    document.querySelector("#book").scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  });
});

document.querySelectorAll("[data-bay]").forEach((button) => {
  button.addEventListener("click", () => {
    const name = button.dataset.bay;
    document.querySelectorAll("[data-bay]").forEach((item) => {
      const on = item === button;
      item.classList.toggle("is-on", on);
      item.setAttribute("aria-selected", String(on));
    });
    document.querySelectorAll("[data-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.panel !== name;
    });
    document.querySelector("[data-set-bay]").dataset.setBay = name;
  });
});

document.querySelectorAll("[data-set-bay]").forEach((link) => {
  link.addEventListener("click", () => {
    baySelect.value = link.dataset.setBay;
  });
});

const form = document.querySelector("#book-form");
const success = document.querySelector(".form-success");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const email = String(data.get("email") || "");
  const name = String(data.get("name") || "").trim();
  const date = String(data.get("date") || "");
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  form.querySelector('[name="name"]').classList.toggle("is-bad", name.length < 2);
  form.querySelector('[name="email"]').classList.toggle("is-bad", !validEmail);
  form.querySelector('[name="date"]').classList.toggle("is-bad", !date);
  const error = form.querySelector(".form__error");
  if (name.length < 2 || !validEmail || !date) {
    error.hidden = false;
    error.textContent = "Add your name, a valid email, and a date so we can confirm the bay.";
    return;
  }
  error.hidden = true;
  const bayLabel = baySelect.selectedOptions[0].textContent;
  success.querySelector("[data-success-copy]").textContent =
    `${name}, ${bayLabel} is requested for ${data.get("date")} at ${data.get("time")}, playing ${data.get("course")}. We'll reply to ${email} to confirm.`;
  form.hidden = true;
  success.hidden = false;
});

document.querySelector("[data-reset]").addEventListener("click", () => {
  form.reset();
  form.hidden = false;
  success.hidden = true;
  baySelect.value = "focus";
  courseSelect.value = "Northwater Links";
});
