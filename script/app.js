// Open IndexedDB database
const openDB = () => {
	// 打开或者创建一个名为ChineseFarmerDB的数据库，版本号为1
	return new Promise((resolve, reject) => {
		const request = window.indexedDB.open('ChineseFarmerDB', 1);
		// 打开数据库失败
		request.onerror = (event) => {
			console.error('Database error:', event.target.errorCode);
			reject(event.target.errorCode);
		};
		// 打开数据库成功
		request.onsuccess = (event) => {
			const db = event.target.result;
			resolve(db);
		};
		// 数据库升级
		request.onupgradeneeded = (event) => {
			const db = event.target.result;
			const objectStore = db.createObjectStore('cards', { keyPath: 'id' });
		};
	});
};




new Vue({
	el: '#app',
	data: {
		currentCard: null, // 初始化为null，用于存储当前角色
		cards: [],
		selectedFileName: '',  // 在数据中添加一个用来存储文件名的属性
		isModalOpen: false,
		modalMode: '', // 可以是 'edit' 或 'details'
		isNewCard: false, // 标记是否为新建
		map: generateMap(), // 在应用的 data 属性中初始化地图
	},
	created() {
		// 打开数据库并获取所有数据
		openDB().then(db => {
			this.db = db;
			this.getCards();
		});
	},
	methods: {
		createCharacter() {
			const newCharacter = this.getBlankCharacter();
			this.openModal(newCharacter, 'edit'); // 打开模态窗口以编辑新角色
			this.saveCard(newCharacter);  // 确保新角色被保存
		},
		randomizeCharacter() {
			const newCharacter = this.getBlankCharacter();
			this.randomizeCharacterProperties(newCharacter);
			this.cards.unshift(newCharacter); // 将随机生成的角色添加到列表的开始
			this.openModal(newCharacter, 'details'); // 直接显示详情
			this.saveCard(newCharacter);  // 确保随机生成的角色被保存
		},
		getBlankCharacter() {
			return {
				id: Date.now().toString(),
				title: '',
				subtitle: '',
				traits: '',
				abilities: {
					intelligence: 0,
					strength: 0,
					charm: 0
				},
				skills: {
					farming: 0,
					crafting: 0
				},
				health: 0
			};
		},
		randomizeCharacterProperties(character) {
			character.title = this.generateRandomName();
			character.subtitle = "无"; // 默认值
			character.traits = this.pickRandomTraits();
			character.abilities.intelligence = Math.floor(Math.random() * 100);
			character.abilities.strength = Math.floor(Math.random() * 100);
			character.abilities.charm = Math.floor(Math.random() * 100);
			character.skills.farming = Math.floor(Math.random() * 100);
			character.skills.crafting = Math.floor(Math.random() * 100);
			character.health = Math.floor(Math.random() * 40) + 60;
			character.age = Math.floor(Math.random() * 48) + 18;  // 年龄从18岁到65岁
			// 添加随机性别生成逻辑
			const genders = ["Male", "Female"];
			character.gender = genders[Math.floor(Math.random() * genders.length)]; // 随机选取性别
		},
		generateRandomName() {
			const names = ["张三", "李四", "王五", "赵六", "周七"];
			return names[Math.floor(Math.random() * names.length)];
		},
		pickRandomTraits() {
			const traits = ["勤劳", "懒惰", "诚实", "狡猾", "乐观", "悲观"];
			return traits[Math.floor(Math.random() * traits.length)];
		},
		openModal(card, mode) {
			this.currentCard = card;
			this.modalMode = mode; // 'edit' 或 'details'
			this.isModalOpen = true;
		},
		closeModal() {
			this.isModalOpen = false;
			this.currentCard = null;
		},
		handleBackgroundClick() {
			this.closeModal(); // 调用关闭模态的方法
		},
		getCards() {
			// 读取所有数据
			const transaction = this.db.transaction(['cards'], 'readonly');
			const objectStore = transaction.objectStore('cards');
			const request = objectStore.getAll();
			request.onsuccess = () => {
				// 反转卡片数组
				this.cards = request.result.map(card => ({ ...card, editing: false })).reverse();
			};
		},
		editCard(card) {
			if (!card) {
				console.error('Invalid card data!');
				return; // 防止进一步处理无效的卡片数据
			}
			this.currentCard = card;
			this.isModalOpen = true;
		},

		saveCard(card) {
			const transaction = this.db.transaction(['cards'], 'readwrite');
			const objectStore = transaction.objectStore('cards');
			const request = objectStore.put(card);
			request.onsuccess = () => {
				console.log('Card saved successfully');
				this.modalMode = 'details'; // 切换到详情视图
				// 如果你不想保持模态窗口打开，可以直接关闭它
				// this.closeModal();
			};
			request.onerror = () => {
				console.error('Error saving the card');
			};
		},
		
		cancelEdit(card) {
			if (confirm("确定要取消编辑，并放弃所有未保存的更改吗？")) {
				// 用户确认取消编辑
				this.modalMode = 'details'; // 切换回详情视图

				// 重新加载卡片数据
				this.loadCard(card.id); // 假设 loadCard 方法会从数据库重新加载数据
			}
		},
		loadCard(cardId) {
			const transaction = this.db.transaction(['cards'], 'readonly');
			const objectStore = transaction.objectStore('cards');
			const request = objectStore.get(cardId);
			request.onsuccess = () => {
				this.currentCard = request.result;
			};
			request.onerror = () => {
				console.error('Failed to reload the card');
			};
		},
		deleteCard(card) {
			if (confirm("确定要删除这个角色吗？")) {  // 弹出确认对话框
				const transaction = this.db.transaction(['cards'], 'readwrite');
				const objectStore = transaction.objectStore('cards');
				const request = objectStore.delete(card.id);
				request.onsuccess = () => {
					console.log('Card deleted successfully');
					this.cards = this.cards.filter(c => c.id !== card.id); // 更新卡片列表，移除已删除的卡片
					this.closeModal(); // 删除成功后关闭模态窗口
				};
				request.onerror = () => {
					console.error('Failed to delete the card');
				};
			}
		},
		closeModal() {
			this.isModalOpen = false;
			this.currentCard = null; // 清除当前卡片数据
		},

	
		
		triggerFileInput() {
			document.getElementById('fileInput').click(); // 触发隐藏的文件输入点击事件
		},
		exportData() {
			const transaction = this.db.transaction(['cards'], 'readonly');
			const objectStore = transaction.objectStore('cards');
			const request = objectStore.getAll();

			request.onsuccess = () => {
				const jsonData = JSON.stringify(request.result);
				const blob = new Blob([jsonData], { type: 'application/json' });

				// 生成包含当前日期的文件名
				const date = new Date();
				const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '');  // 格式为 YYYYMMDD
				const filename = `ChineseFarmer_data_${formattedDate}.json`;

				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = filename;
				a.click();
				URL.revokeObjectURL(url);
				console.log('数据导出成功');
			};
		},
		importData(event) {
			const file = event.target.files[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					const cards = JSON.parse(e.target.result);
					const transaction = this.db.transaction(['cards'], 'readwrite');
					const objectStore = transaction.objectStore('cards');
					cards.forEach(card => {
						objectStore.put(card);
					});
					transaction.oncomplete = () => {
						console.log('所有数据已成功导入');
						this.getCards(); // 重新加载卡片以更新视图
					};
				};
				reader.readAsText(file);
			}
		},
		resetData() {
			const confirmReset = confirm("确定要重置所有数据吗？这将删除所有角色和存档数据，且无法恢复。");
			if (confirmReset) {
				const transaction = this.db.transaction(['cards'], 'readwrite');
				const objectStore = transaction.objectStore('cards');
				const request = objectStore.clear();  // 清空 object store

				request.onsuccess = () => {
					console.log('所有数据已成功清空。');
					this.cards = [];  // 清空前端显示的数据
					this.closeModal();  // 如果有打开的模态窗口，也要关闭
				};

				request.onerror = () => {
					console.error('清空数据时出错。');
				};
			}
		},
		regenerateMap() {
			this.map = generateMap();  // 重新生成地图的方法
		},
	}
});