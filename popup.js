const heroSelect = document.getElementById("hero-search");
const searchButton = document.getElementById("search-button");
const result = document.getElementById("result");

heroes.forEach(function(hero) {
    const option = document.createElement("option");

    option.value = hero.key;
    option.textContent = hero.value;

    heroSelect.appendChild(option);
});

searchButton.addEventListener("click", function() {

    const foundHero = heroes.find(hero => hero.key === heroSelect.value);

    if (foundHero) {
        console.log("Searching for hero: ", foundHero);

        result.textContent =
        "Hero: " + foundHero.value + " | " +
        "Level: " + foundHero.level;
    } else {
        result.textContent = "Hero not found.";
    }
});