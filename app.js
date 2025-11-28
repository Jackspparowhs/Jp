const grid = document.getElementById("imageGrid");
const loader = document.getElementById("loader");
const searchInput = document.getElementById("searchInput");
const sidebar = document.getElementById("sidebar");
const backdrop = document.getElementById("backdrop");
const menuBtn = document.getElementById("menuBtn");
const tagList = document.getElementById("tagList");

let page = 1;
let currentTag = "";
let loading = false;

/* OPEN SIDEBAR */
menuBtn.onclick = () => {
    sidebar.classList.add("open");
    backdrop.style.display = "block";
};
backdrop.onclick = () => {
    sidebar.classList.remove("open");
    backdrop.style.display = "none";
};

/* FETCH TAGS */
async function loadTags() {
    const url = "https://danbooru.donmai.us/tags.json?limit=30&order=count";
    const res = await fetch(url);
    const data = await res.json();

    tagList.innerHTML = "";
    data.forEach(tag => {
        const btn = document.createElement("a");
        btn.innerText = tag.name;
        btn.href = "#";
        btn.onclick = () => {
            page = 1;
            currentTag = tag.name;
            grid.innerHTML = "";
            loadImages();
        };
        tagList.appendChild(btn);
    });
}
loadTags();

/* FETCH IMAGES */
async function loadImages() {
    if (loading) return;
    loading = true;

    loader.style.display = "block";

    const url =
        `https://danbooru.donmai.us/posts.json?tags=${currentTag}&limit=30&page=${page}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        data.forEach(post => {
            if (!post.file_url) return;

            const card = document.createElement("div");
            card.className = "image-card";

            const img = document.createElement("img");
            img.src = post.file_url;

            card.onclick = () => openModal(post);

            card.appendChild(img);
            grid.appendChild(card);
        });

        page++;
    } catch (err) {
        console.log("Error loading images:", err);
    }

    loader.style.display = "none";
    loading = false;
}

/* INFINITE SCROLL */
window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 700) {
        loadImages();
    }
});

/* SEARCH */
searchInput.addEventListener("keypress", e => {
    if (e.key === "Enter") {
        currentTag = searchInput.value.trim();
        page = 1;
        grid.innerHTML = "";
        loadImages();
    }
});

/* MODAL */
const modal = document.getElementById("modal");
const modalImage = document.getElementById("modalImage");
const modalInfo = document.getElementById("modalInfo");
const closeModal = document.getElementById("closeModal");
const downloadBtn = document.getElementById("downloadBtn");

function openModal(post) {
    modal.style.display = "block";
    modalImage.src = post.file_url;

    modalInfo.innerHTML = `
        <h2>${post.tag_string_artist}</h2>
        <p><strong>Rating:</strong> ${post.rating}</p>
        <p><strong>Tags:</strong> ${post.tag_string}</p>
    `;

    downloadBtn.href = post.file_url;
}

closeModal.onclick = () => {
    modal.style.display = "none";
};
window.onclick = e => {
    if (e.target === modal) modal.style.display = "none";
};

/* LOAD INITIAL */
loadImages();
