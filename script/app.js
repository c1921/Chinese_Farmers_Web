new Vue({
	el: '#app',
	data: {
		families: [],
		selectedCharacter: null,
		familyNames: [],
		givenNames: []
	},
	methods: {
		getRandomInt(min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		},
		async fetchNames() {
			const familyNameResponse = await fetch('public/data/familyName.json');
			const givenNameResponse = await fetch('public/data/givenName.json');
			this.familyNames = await familyNameResponse.json();
			this.givenNames = await givenNameResponse.json();
		},
		generateCharacter(family) {
			return {
				givenName: this.givenNames[this.getRandomInt(0, this.givenNames.length - 1)],
				familyName: family.name,  // 使用传入的家庭名称
				age: this.getRandomInt(18, 60),
				gender: Math.random() > 0.5 ? "Male" : "Female",
				abilities: {
					strength: this.getRandomInt(1, 10),
					intelligence: this.getRandomInt(1, 10),
					charisma: this.getRandomInt(1, 10)
				},
				personality: ["Outgoing", "Shy", "Aggressive", "Calm"][this.getRandomInt(0, 3)],
				traits: ["Intelligent", "Strong", "Cunning", "Charming"].sort(() => 0.5 - Math.random()).slice(0, 2),
				familyId: family.id  // Store family ID with the character
			};
		},
		generateFamily(id) {
			const familyName = this.familyNames[id - 1];  // Assign a name to each family
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
			this.selectedCharacter = character;  // Include family info in the selected character
		}
	},
	async mounted() {
		await this.fetchNames();
		this.generateFamilies();
	}
});
