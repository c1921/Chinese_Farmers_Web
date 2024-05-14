new Vue({
	el: '#app',
	data: {
		families: [],
		selectedCharacter: null,
		familyNames: [],
		maleGivenNames: [],
		femaleGivenNames: [],
		personalities: [],
		traits: []
	},
	methods: {
		getRandomInt(min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		},
		async fetchNames() {
			const familyNameResponse = await fetch('public/data/familyName.json');
			const maleGivenNameResponse = await fetch('public/data/maleGivenName.json');
			const femaleGivenNameResponse = await fetch('public/data/femaleGivenName.json');
			const personalityResponse = await fetch('public/data/personalities.json');
			const traitResponse = await fetch('public/data/traits.json');

			this.familyNames = await familyNameResponse.json();
			this.maleGivenNames = await maleGivenNameResponse.json();
			this.femaleGivenNames = await femaleGivenNameResponse.json();
			this.personalities = await personalityResponse.json();
			this.traits = await traitResponse.json();
		},
		generateCharacter(family, minAge = 18, maxAge = 60, gender = null) {
			const finalGender = gender || (Math.random() > 0.5 ? "Male" : "Female");
			const givenNames = finalGender === "Male" ? this.maleGivenNames : this.femaleGivenNames;
			const age = this.getRandomInt(minAge, maxAge);

			return {
				id: Math.random().toString(36).substr(2, 9),
				givenName: givenNames[this.getRandomInt(0, givenNames.length - 1)],
				familyName: family.name,
				age: age,
				gender: finalGender === "Male" ? "男" : "女",
				abilities: {
					strength: this.getRandomInt(1, 10),
					intelligence: this.getRandomInt(1, 10),
					charisma: this.getRandomInt(1, 10)
				},
				personality: this.personalities[this.getRandomInt(0, this.personalities.length - 1)],
				traits: this.traits.sort(() => 0.5 - Math.random()).slice(0, 2),
				familyId: family.id,
				parents: [],
				spouses: [],
				children: []
			};
		},
		generateFamily(id) {
			const familyName = this.familyNames[id - 1];
			const members = [];

			// Generate parents (one male and one female)
			const parent1 = this.generateCharacter({ id: id, name: familyName }, 30, 45, "Male");
			const parent2 = this.generateCharacter({ id: id, name: familyName }, parent1.age - 20, parent1.age + 20, "Female");
			members.push(parent1, parent2);
			parent1.spouses.push(parent2);
			parent2.spouses.push(parent1);

			// Generate children and adjust parent ages
			const numChildren = this.getRandomInt(0, 3);
			for (let i = 0; i < numChildren; i++) {
				const child = this.generateCharacter({ id: id, name: familyName }, parent1.age - 44, parent1.age - 16);
				child.parents.push(parent1, parent2);
				parent1.children.push(child);
				parent2.children.push(child);
				members.push(child);

				// Adjust parents' ages
				parent1.age += 2;
				parent2.age += 2;
			}

			return {
				id: id,
				name: familyName,
				members: members
			};
		},
		generateFamilies() {
			this.families = Array.from({ length: 4 }, (_, i) => this.generateFamily(i + 1));
		},
		selectCharacter(character) {
			this.selectedCharacter = character;
		}
	},
	async mounted() {
		await this.fetchNames();
		this.generateFamilies();
	}
});
