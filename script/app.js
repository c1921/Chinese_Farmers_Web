new Vue({
	el: '#app',
	data: {
		families: [],
		selectedCharacter: null
	},
	methods: {
		getRandomInt(min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		},
		generateCharacter(family) {
			const names = ["Alice", "Bob", "Charlie", "Diana"];
			const personalities = ["Outgoing", "Shy", "Aggressive", "Calm"];
			const traits = ["Intelligent", "Strong", "Cunning", "Charming"];

			return {
				name: names[this.getRandomInt(0, names.length - 1)],
				age: this.getRandomInt(18, 60),
				gender: Math.random() > 0.5 ? "Male" : "Female",
				abilities: {
					strength: this.getRandomInt(1, 10),
					intelligence: this.getRandomInt(1, 10),
					charisma: this.getRandomInt(1, 10)
				},
				personality: personalities[this.getRandomInt(0, personalities.length - 1)],
				traits: [traits[this.getRandomInt(0, traits.length - 1)], traits[this.getRandomInt(0, traits.length - 1)]],
				familyId: family.id,  // Store family ID with the character
				familyName: family.name  // Store family name
			};
		},
		generateFamily(id) {
			const familyNames = ["Smith", "Johnson", "Williams", "Brown"];
			const familyName = familyNames[id - 1];  // Assign a name to each family
			return {
				id: id,
				name: familyName,
				members: Array.from({ length: this.getRandomInt(2, 5) }, () => this.generateCharacter({ id: id, name: familyName }))
			};
		},
		generateFamilies() {
			this.families = Array.from({ length: 4 }, (_, i) => this.generateFamily(i + 1));
		},
		selectCharacter(character, family) {
			this.selectedCharacter = { ...character, familyId: family.id, familyName: family.name };  // Include family info in the selected character
		}
	},
	mounted() {
		this.generateFamilies();
	}
});
