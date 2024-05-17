// 创建一个新的Vue实例
new Vue({
	el: '#app', // Vue实例挂载的HTML元素的id
	data: {
		// 存储家庭和角色等数据
		families: [],
		selectedCharacter: null, // 当前选中的角色
		familyNames: [], // 家庭名称列表
		maleGivenNames: [], // 男性名字列表
		femaleGivenNames: [], // 女性名字列表
		personalities: [], // 个性列表
		traits: [], // 特质列表
		currentDate: new Date(1840, 0, 1), // 初始化日期为1840年1月1日
		timer: null, // 定时器
		hoveredAbility: null, // 悬停的能力
		hoveredTile: null, // 悬停的地块
		hoverStyle: {
			top: '0px',
			left: '0px'
		},
		map: [], // 地图数据
		mapSize: 10, // 地图尺寸
		activeTab: 'Family', // 当前活跃的标签页
		timerSpeed: 1000, // 定时器速度，默认1000ms
		daysUntilNextHarvest: 0, // 距离下次收获的天数
		transactionLogs: [], // 日志记录数组
	},
	methods: {
		// 生成指定范围内的随机整数
		getRandomInt(min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		},
		// 生成指定年份范围内的随机日期
		getRandomDate(startYear, endYear) {
			const start = new Date(startYear, 0, 1);
			const end = new Date(endYear, 11, 31);
			const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
			return date;
		},
		// 格式化日期为字符串
		formatDate(date) {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			return `${year}年${month}月${day}日`;
		},
		// 异步获取名字数据
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
		// 应用特质效果到能力值上
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
		// 计算角色的年龄
		calculateAge(birthDate, currentDate) {
			const birth = new Date(birthDate);
			const age = currentDate.getFullYear() - birth.getFullYear();
			const monthDiff = currentDate.getMonth() - birth.getMonth();
			if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birth.getDate())) {
				return age - 1;
			}
			return age;
		},
		// 生成角色数据
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

			// 计算劳动值
			const laborValue = 500 * (abilitiesWithEffects.physical.total * 0.2);

			return {
				id: Math.random().toString(36).substr(2, 9),
				givenName: givenNames[this.getRandomInt(0, givenNames.length - 1)],
				familyName: family.name,
				birthDate: this.formatDate(birthDate),
				age: age,
				gender: finalGender === "Male" ? "男" : "女",
				abilities: abilitiesWithEffects,
				laborValue: Number(laborValue), // 确保 laborValue 是数值类型
				traits: traits,
				familyId: family.id,
				parents: [],
				spouses: [],
				children: [],
				family: family
			};
		},


		// 生成家庭数据
		generateFamily(id) {
			const familyName = this.familyNames[id - 1];
			const family = {
				id: id,
				name: familyName,
				members: [],
				land: [],
				foodStock: this.getRandomInt(1000, 30000), // 初始粮食库存
				showWarning: false,
				annualEarnings: 0, // 初始化年度收益
				dailyEarnings: 0, // 初始化每日收益
				get landCount() {
					return this.land.length;
				},
				get averageFertility() {
					return Math.floor((this.land.reduce((sum, tile) => sum + tile.fertility, 0) / this.land.length) * 100) / 100 || 0;
				},

				// 新增计算家庭劳动总值的方法
				get totalLaborValue() {
					return this.members.reduce((sum, member) => sum + Number(member.laborValue), 0).toFixed(2);
				},
				updateFoodStock() {
					this.foodStock += this.annualEarnings; // 每年7月1日将年度收益加入粮食库存
					this.annualEarnings = 0; // 重置年度收益
				},
				consumeFood() {
					const dailyConsumption = this.members.length * 2;
					this.foodStock = Math.max(0, this.foodStock - dailyConsumption);
				}
			};

			// 生成父母角色（一个男性和一个女性）
			const parent1BirthDate = this.getRandomDate(1790, 1809); // 生成父母的出生日期在1790到1809年之间
			const parent2BirthDate = this.getRandomDate(1790, 1809);
			const parent1 = this.generateCharacter(family, parent1BirthDate, "Male");
			const parent2 = this.generateCharacter(family, parent2BirthDate, "Female");
			family.members.push(parent1, parent2);
			parent1.spouses.push(parent2);
			parent2.spouses.push(parent1);

			// 生成子女角色并调整父母年龄
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



		// 生成所有家庭数据
		generateFamilies() {
			this.families = Array.from({ length: 5 }, (_, i) => this.generateFamily(i + 1));
			this.allocateLand();
		},
		// 生成地图数据
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
		// 生成正态分布的肥力值
		generateNormalDistributedFertility(mean, stddev) {
			let u1 = Math.random();
			let u2 = Math.random();
			let z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
			let fertility = mean + z * stddev;

			fertility = Math.round(fertility);
			if (fertility < 1) fertility = 1;
			if (fertility > 10) fertility = 10;

			return fertility;
		},
		// 分配土地给家庭
		allocateLand() {
			const landTiles = this.map.flat().filter(tile => tile.type === 'land');
			const totalFamilies = this.families.length;
			let familyIndex = 0;

			while (landTiles.length > 0) {
				const randomIndex = this.getRandomInt(0, landTiles.length - 1);
				const allocatedLand = landTiles.splice(randomIndex, 1)[0];
				allocatedLand.familyName = this.families[familyIndex].name;
				allocatedLand.laborValueMet = false; // 新增属性
				this.families[familyIndex].land.push(allocatedLand);
				familyIndex = (familyIndex + 1) % totalFamilies;
			}
		},
		// 选择角色
		selectCharacter(character) {
			this.selectedCharacter = character;
		},
		// 显示地块详情
		showTileDetails(tile) {
			this.hoveredTile = tile;
			this.updateHoverPosition(event);
		},
		// 隐藏地块详情
		hideTileDetails() {
			this.hoveredTile = null;
		},
		// 显示能力详情
		showDetails(ability) {
			this.hoveredAbility = ability;
		},
		// 隐藏能力详情
		hideDetails() {
			this.hoveredAbility = null;
		},
		// 更新悬浮窗位置
		updateHoverPosition(event) {
			this.hoverStyle.top = `${event.clientY + 10}px`;
			this.hoverStyle.left = `${event.clientX + 10}px`;
		},
		// 计算距离下次收获的天数
		calculateDaysUntilNextHarvest() {
			const nextHarvestDate = new Date(this.currentDate.getFullYear(), 6, 1); // 设定下一次收获日期为7月1日
			if (this.currentDate > nextHarvestDate) {
				nextHarvestDate.setFullYear(nextHarvestDate.getFullYear() + 1); // 如果当前日期已经过了7月1日，设定下一次的收获日期为下一年
			}
			const timeDiff = nextHarvestDate - this.currentDate;
			const daysUntilNextHarvest = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
			return daysUntilNextHarvest;
		},
		// 更新警告状态
		updateWarnings() {
			this.daysUntilNextHarvest = this.calculateDaysUntilNextHarvest();
			this.families.forEach(family => {
				const totalConsumption = family.members.length * 2 * this.daysUntilNextHarvest;
				family.showWarning = totalConsumption > family.foodStock;
			});
		},
		// 切换定时器
		toggleTimer() {
			if (this.timer) {
				clearInterval(this.timer);
				this.timer = null;
			} else {
				this.timer = setInterval(() => {
					this.updateDate();
					this.updateWarnings(); // 每次更新日期后检查并更新警告
				}, this.timerSpeed); // 使用 this.timerSpeed
			}
		},
		// 设置定时器速度
		setTimerSpeed(speed) {
			this.timerSpeed = speed;
			if (this.timer) {
				clearInterval(this.timer);
				this.timer = setInterval(this.updateDate, this.timerSpeed);
			}
		},
		// 检查家庭是否需要卖地
		checkAndSellLand() {
			this.families.forEach(sellingFamily => {
				if (sellingFamily.foodStock < 50 && sellingFamily.landCount > 0) {
					this.attemptSellLand(sellingFamily);
				}
			});
		},

		// 尝试卖地
		attemptSellLand(sellingFamily) {
			const landPrice = this.calculateLandPrice(sellingFamily);
			const foodConsumption = sellingFamily.members.length * 2 * 365 * 2; // 两年的粮食消耗量

			const buyingFamily = this.families.find(buyer => {
				return buyer !== sellingFamily && buyer.foodStock > (landPrice + foodConsumption);
			});

			if (buyingFamily) {
				this.executeLandSale(sellingFamily, buyingFamily, landPrice);
			}
		},

		// 计算土地价格
		calculateLandPrice(family) {
			const land = family.land[0];
			const landMarketPrice = 1000; // 土地市场价格
			return landMarketPrice * land.fertility * 0.5;
		},

		// 执行卖地操作
		executeLandSale(sellingFamily, buyingFamily, landPrice) {
			const land = sellingFamily.land.shift(); // 卖方家庭减少一块土地
			land.familyName = buyingFamily.name; // 更新土地归属
			buyingFamily.land.push(land); // 买方家庭增加这块土地

			sellingFamily.foodStock += landPrice; // 卖方家庭增加粮食储量
			buyingFamily.foodStock -= landPrice; // 买方家庭减少粮食储量

			// 添加交易记录到日志界面
			this.addTransactionLog(sellingFamily, buyingFamily, land, landPrice);
		},

		// 添加交易记录
		addTransactionLog(sellingFamily, buyingFamily, land, price) {
			const currentDateStr = this.formatDate(this.currentDate); // 获取当前日期的字符串格式
			const logEntry = `${currentDateStr}: ${sellingFamily.name} 家庭以 ${price.toFixed(2)} 的价格将土地 (${land.row}, ${land.col}) 卖给了 ${buyingFamily.name} 家庭`;
			this.transactionLogs.push(logEntry); // 将日志记录添加到数组中
		},
		// 格式化日期为字符串的方法
		formatDate(date) {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			return `${year}年${month}月${day}日`;
		},
		// 更新日期
		updateDate() {
			const newDate = new Date(this.currentDate);
			newDate.setDate(newDate.getDate() + 1); // 日期加一天
			this.currentDate = newDate;

			// 每天分配劳动值并计算收益
			this.families.forEach(family => {
				let remainingLaborValue = family.totalLaborValue;
				family.land.sort((a, b) => b.fertility - a.fertility); // 按肥沃度排序
				family.dailyEarnings = 0;

				family.land.forEach(tile => {
					if (remainingLaborValue >= 100) {
						tile.laborValueMet = true;
						remainingLaborValue -= 100;
						family.dailyEarnings += (1 * (tile.fertility * 0.2));
					} else {
						tile.laborValueMet = false;
					}
				});

				family.annualEarnings += family.dailyEarnings;
			});

			// 每年7月1日增加家庭粮食库存
			if (this.currentDate.getMonth() === 6 && this.currentDate.getDate() === 1) {
				this.families.forEach(family => {
					family.foodStock += family.annualEarnings;
					family.annualEarnings = 0; // 重置年度收益
				});
			}

			// 每天消耗粮食
			this.families.forEach(family => {
				family.consumeFood();
			});

			// 检查并执行卖地操作
			this.checkAndSellLand();

			// 更新所有角色的年龄
			this.families.forEach(family => {
				family.members.forEach(member => {
					member.age = this.calculateAge(new Date(member.birthDate.replace(/年|月/g, '-').replace(/日/, '')), this.currentDate);
				});
			});

			// 更新警告状态
			this.updateWarnings();
		},

		// 切换标签页
		showTab(tab) {
			this.activeTab = tab;
		},

	},
	computed: {
		// 更新后的格式化当前日期的方法
		formattedDate() {
			return this.formatDate(this.currentDate);
		}
	},
	// 在组件挂载时执行
	async mounted() {
		await this.fetchNames(); // 获取名字数据
		this.generateMap(); // 生成地图数据
		this.generateFamilies(); // 生成家庭数据
		document.addEventListener('mousemove', this.updateHoverPosition); // 监听鼠标移动事件
	},
	// 在组件销毁前执行
	beforeDestroy() {
		document.removeEventListener('mousemove', this.updateHoverPosition); // 移除鼠标移动事件监听
	}
});
