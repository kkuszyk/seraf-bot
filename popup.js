const heroes = [
    {
        name: "Mroczny Patryk",
        level: 35,
        map: "Torneg"
    },
    {
        name: "Karmazynowy Mściciel",
        level: 45,
        map: "Fort Eder"
    },
    {
        name: "Złodziej",
        level: 51,
        map: "Eder"
    }
];

const searchInput = document.getElementById("hero-search");
const searchButton = document.getElementById("search-button");
const result = document.getElementById("result");

searchButton.addEventListener("click", function() {

    const foundHero = heroes.find(hero => hero.name === searchInput.value);

    if (foundHero) {
        
        console.log("Searching for hero: ", foundHero);

        result.textContent =
        "Hero: " + foundHero.name + " | " +
        "Level: " + foundHero.level + " | " +
        "Map: " + foundHero.map;
    } else {

        result.textContent = "Hero not found."

    }
    

});