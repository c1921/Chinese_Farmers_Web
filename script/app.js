new Vue({
	el: '#app',
	data: {
		families: [],
		selectedCharacter: null,
		familyNames: [],
		maleGivenNames: [],
		femaleGivenNames: [],
		personalities: [],
		traits: [],
		currentDate: new Date(1840, 0, 1), // 初始化日期为1840年1月1日
		timer: null,
		hoveredAbility: null,
		hoveredTile: null,
		hoverStyle: {
			top: '0px',
			left: '0px'
		},
		map: [],
		mapSize: 10, // 地图的尺寸，例如10x10
		activeTab: 'Family',
		timerSpeed: 1000, // 默认速度
	},
	methods: {
		getRandomInt(min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		},
		getRandomDate(startYear, endYear) {
			const start = new Date(startYear, 0, 1);
			const end = new Date(endYear, 11, 31);
			const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
			return date;
		},
		formatDate(date) {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			return `${year}年${month}月${day}日`;
		},
		async fetchNames() {
			const familyNameResponse = await fetch('public/data/familyName.json');
			const maleGivenNameResponse = await fetch('public/data/maleGivenName.json');
			const femaleGivenNameResponse = await fetch('public/data/femaleGivenName.json');
			const traitResponse = await fetch('public/data/traits.json');

			this.familyNames = await familyNameResponse.json();
			this.maleGivenNames = await maleGivenNameResponse.json();
			this.femaleGivenNames = await femaleGivenNameResponse.json();
			this.traits = await traitResponse.json();
		},
		applyTraitEffects(abilities, traits) {
			const effects = {
				social: { base: abilities.social, effects: {}, total: abilities.social },
				physical: { base: abilities.physical, effects: {}, total: abilities.physical },
				judgment: { base: abilities.judgment, effects: {}, total: abilities.judgment },
				learning: { base: abilities.learning, effects: {}, total: abilities.learning }
			};

			traits.forEach(trait => {
				const effect = trait.effects;
				for (const key in effect) {
					effects[key].effects[trait.name] = effect[key];
					effects[key].total += effect[key];
				}
			});

			return effects;
		},
		calculateAge(birthDate, currentDate) {
			const birth = new Date(birthDate);
			const age = currentDate.getFullYear() - birth.getFullYear();
			const monthDiff = currentDate.getMonth() - birth.getMonth();
			if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birth.getDate())) {
				return age - 1;
			}
			return age;
		},
		generateCharacter(family, birthDate, gender = null) {
			const finalGender = gender || (Math.random() > 0.5 ? "Male" : "Female");
			const givenNames = finalGender === "Male" ? this.maleGivenNames : this.femaleGivenNames;
			const traits = this.traits.sort(() => 0.5 - Math.random()).slice(0, 2);
			const abilities = {
				social: this.getRandomInt(1, 10),
				physical: this.getRandomInt(1, 10),
				judgment: this.getRandomInt(1, 10),
				learning: this.getRandomInt(1, 10)
			};
			const abilitiesWithEffects = this.applyTraitEffects(abilities, traits);
			const age = this.calculateAge(birthDate, this.currentDate);

			return {
				id: Math.random().toString(36).substr(2, 9),
				givenName: givenNames[this.getRandomInt(0, givenNames.length - 1)],
				familyName: family.name,
				birthDate: this.formatDate(birthDate),
				age: age,
				gender: finalGender === "Male" ? "男" : "女",
				abilities: abilitiesWithEffects,
				traits: traits,
				familyId: family.id,
				parents: [],
				spouses: [],
				children: [],
				family: family
			};
		},
		generateFamily(id) {
			const familyName = this.familyNames[id - 1];
			const family = {
				id: id,
				name: familyName,
				members: [],
				land: [],
				foodStock: this.getRandomInt(2000, 5000), // 初始粮食库存随机值
				get landCount() {
					return this.land.length;
				},
				get averageFertility() {
					return Math.floor((this.land.reduce((sum, tile) => sum + tile.fertility, 0) / this.land.length) * 100) / 100 || 0;
				},
				get foodOutput() {
					const totalPhysical = this.members.reduce((sum, member) => sum + member.abilities.physical.total, 0);
					return this.landCount * this.averageFertility * totalPhysical;
				},
				updateFoodStock() {
					this.foodStock += this.foodOutput;
				},
				consumeFood() {
					const dailyConsumption = this.members.length * 5;
					this.foodStock = Math.max(0, this.foodStock - dailyConsumption);
				},
				sellLand() {
					// 如果粮食库存低于50，开始卖地
					if (this.foodStock < 50 && this.land.length > 0) {
						const landToSell = this.land.pop(); // 从土地列表中取出一块土地
						const landPrice = 20000 * landToSell.fertility * 0.5; // 计算土地价格

						// 找到买家
						const buyers = this.$root.families.filter(family => {
							const dailyConsumption = family.members.length * 5;
							const minFoodRequired = dailyConsumption * 30; // 假设家庭需要至少30天的粮食
							return family !== this && (family.foodStock - dailyConsumption) >= minFoodRequired;
						});

						if (buyers.length > 0) {
							const buyer = buyers[this.$root.getRandomInt(0, buyers.length - 1)]; // 随机选择一个买家
							buyer.land.push(landToSell); // 将土地添加到买家土地列表
							landToSell.familyName = buyer.name; // 更新土地归属
							this.foodStock += landPrice; // 增加粮食库存

							// 更新地图上的土地信息
							this.map[landToSell.row][landToSell.col].familyName = buyer.name;
						} else {
							// 如果没有符合条件的买家，将土地放回土地列表
							this.land.push(landToSell);
						}
					}
				},
			};

			// Generate parents (one male and one female)
			const parent1BirthDate = this.getRandomDate(1790, 1809); // 生成父母的出生日期在1790到1809年之间
			const parent2BirthDate = this.getRandomDate(1790, 1809);
			const parent1 = this.generateCharacter(family, parent1BirthDate, "Male");
			const parent2 = this.generateCharacter(family, parent2BirthDate, "Female");
			family.members.push(parent1, parent2);
			parent1.spouses.push(parent2);
			parent2.spouses.push(parent1);

			// Generate children and adjust parent ages
			const numChildren = this.getRandomInt(0, 3);
			for (let i = 0; i < numChildren; i++) {
				const childBirthDate = this.getRandomDate(1810, 1839); // 生成子女的出生日期在1810到1839年之间
				const child = this.generateCharacter(family, childBirthDate);
				child.parents.push(parent1, parent2);
				parent1.children.push(child);
				parent2.children.push(child);
				family.members.push(child);
			}

			return family;
		},
		generateFamilies() {
			this.families = Array.from({ length: 5 }, (_, i) => this.generateFamily(i + 1));
			this.allocateLand();
		},
		generateMap() {
			this.map = Array.from({ length: this.mapSize }, (_, rowIndex) =>
				Array.from({ length: this.mapSize }, (_, colIndex) => ({
					type: Math.random() > 0.2 ? 'land' : 'water',
					fertility: this.generateNormalDistributedFertility(5, 1.5), // 使用正态分布生成肥力值
					row: rowIndex,
					col: colIndex,
					familyName: ''
				}))
			);
		},

		generateNormalDistributedFertility(mean, stddev) {
			// Box-Muller 变换生成正态分布随机数
			let u1 = Math.random();
			let u2 = Math.random();
			let z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
			let fertility = mean + z * stddev;

			// 四舍五入并确保肥力值在 1 到 10 之间
			fertility = Math.round(fertility);
			if (fertility < 1) fertility = 1;
			if (fertility > 10) fertility = 10;

			return fertility;
		},

		allocateLand() {
			const landTiles = this.map.flat().filter(tile => tile.type === 'land');
			const totalFamilies = this.families.length;
			let familyIndex = 0;

			while (landTiles.length > 0) {
				const randomIndex = this.getRandomInt(0, landTiles.length - 1);
				const allocatedLand = landTiles.splice(randomIndex, 1)[0];
				this.families[familyIndex].land.push(allocatedLand);
				allocatedLand.familyName = this.families[familyIndex].name;
				this.map[allocatedLand.row][allocatedLand.col].familyName = this.families[familyIndex].name; // 更新地图上的土地信息
				familyIndex = (familyIndex + 1) % totalFamilies;
			}
		},
		selectCharacter(character) {
			this.selectedCharacter = character;
		},
		showTileDetails(tile) {
			this.hoveredTile = tile;
			this.updateHoverPosition(event);
		},
		hideTileDetails() {
			this.hoveredTile = null;
		},
		showDetails(ability) {
			this.hoveredAbility = ability;
		},
		hideDetails() {
			this.hoveredAbility = null;
		},
		updateHoverPosition(event) {
			this.hoverStyle.top = `${event.clientY + 10}px`;
			this.hoverStyle.left = `${event.clientX + 10}px`;
		},
		toggleTimer() {
			if (this.timer) {
				clearInterval(this.timer);
				this.timer = null;
			} else {
				this.timer = setInterval(this.updateDate, this.timerSpeed); // 使用 this.timerSpeed
			}
		},
		setTimerSpeed(speed) {
			this.timerSpeed = speed;
			if (this.timer) {
				clearInterval(this.timer);
				this.timer = setInterval(this.updateDate, this.timerSpeed);
			}
		},
		updateDate() {
			const newDate = new Date(this.currentDate);
			newDate.setDate(newDate.getDate() + 1); // 日期加一天
			this.currentDate = newDate;

			// 每年7月1日增加家庭粮食库存
			if (this.currentDate.getMonth() === 6 && this.currentDate.getDate() === 1) {
				this.families.forEach(family => {
					family.updateFoodStock();
				});
			}

			// 每天消耗粮食并检查是否需要卖地
			this.families.forEach(family => {
				family.consumeFood();
				family.sellLand();
			});

			// Update the age of all characters based on the new current date
			this.families.forEach(family => {
				family.members.forEach(member => {
					member.age = this.calculateAge(new Date(member.birthDate.replace(/年|月/g, '-').replace(/日/, '')), this.currentDate);
				});
			});
		},
		showTab(tab) {
			this.activeTab = tab;
		},
	},
	computed: {
		formattedDate() {
			const year = this.currentDate.getFullYear();
			const month = String(this.currentDate.getMonth() + 1).padStart(2, '0');
			const day = String(this.currentDate.getDate()).padStart(2, '0');
			return `${year}年${month}月${day}日`;
		}
	},
	async mounted() {
		await this.fetchNames();
		this.generateMap();
		this.generateFamilies();
		document.addEventListener('mousemove', this.updateHoverPosition);
	},
	beforeDestroy() {
		document.removeEventListener('mousemove', this.updateHoverPosition);
	}
});
