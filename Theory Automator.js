var id = "theory_auto";
var name = "Theory automator";
var description = "Automates purchases and publications in theories.";
var authors = "rus9384";
var version = "1.1a";
var permissions = Permissions.PERFORM_GAME_ACTIONS;

var theoryManager;
var timer = 0;
var requirements = [150, 250, 175, 175, 150, 150, 175, 220];
var test;

var upgradeCost = upgrade => upgrade.cost.getCost(upgrade.level);
var toBig = number => BigNumber.from(number);
var publicationMultiplier = theory => theory.nextPublicationMultiplier / theory.publicationMultiplier;

var primaryEquation = "";
var getPrimaryEquation = () => primaryEquation;

var quaternaryEntries = [];
{
	for (let i = 0; i < 8; i++) {
		quaternaryEntries.push(new QuaternaryEntry("τ_" + (i + 1), null))
	}
}

function buyMax(upgrade, value) {
	let spend = value.min(upgrade.currency.value);
	upgrade.buy(upgrade.cost.getMax(upgrade.level, spend));
}

function buyRatio(upgrade, ratio) {
	let BigNumRatio = typeof(ratio) === 'object' ? ratio : toBig(ratio);
	buyMax(upgrade, upgrade.currency.value / BigNumRatio);
}

function buySkip() {
	
		if (!enableVariablePurchase.level) return true;
		
		if (theoryManager?.theory?.isAutoBuyerActive === true)
			theoryManager.theory.isAutoBuyerActive = false;
				
		if (theoryManager.upgrades === undefined) return true;
		
		return false;
		
}

function buyMilestones() {
	
	if (!enableMSPurchase.level) return;
	
	for (let i = 0; i < game.activeTheory.milestoneUpgrades.length; i++) {
		if (i == 0 && theoryManager.id == 7) continue;
		game.activeTheory.milestoneUpgrades[i].buy(-1);
	}
	
}

function switchTheory(manualSwitch = false) {
	
	if (!enableTheorySwitch.level && !manualSwitch) return;
	
	theory.invalidateQuaternaryValues();
	
	let iMax = 0;
	let max  = 0;
	for (let i = 0; i < 8; i++) {
		let value = parseFloat(theory.quaternaryValue(i));
		if (value > max) {
			iMax = i;
			max = value;
		}
	}
	
	game.activeTheory = game.theories[iMax];
		
}

function refreshTheoryManager() {
	
	let theoryId = game.activeTheory.id;
	if (theoryId == 0) theoryManager = new T1;
	if (theoryId == 1) theoryManager = new T2;
	if (theoryId == 2) theoryManager = new T3;
	if (theoryId == 3) theoryManager = new T4;
	if (theoryId == 4) theoryManager = new T5;
	if (theoryId == 5) theoryManager = new T6;
	if (theoryId == 6) theoryManager = new T7;
	if (theoryId == 7) theoryManager = new T8;
		
}

// Utilizes T1SolarXLII strategy with cyclic publication multipliers
class T1 {
	
	constructor() {	
	
		this.id = 0;
		this.theory = game.activeTheory;
		
		this.upgrades = this.theory.upgrades;
		this.q1 = this.upgrades[0];
		this.q2 = this.upgrades[1];
		this.c3 = this.upgrades[4];
		this.c4 = this.upgrades[5];
			
		this.lastPub = this.theory.tauPublished;
				
		this.setPub();		
						
	}

	get c4NC() {
		let BN10 = toBig(10);
		return BN10.pow(((this.lastPub / BN10.pow(BN10)).log10() / 8).ceil() * 8 + 10);
	}

	setPub() {
		
		let diff = (this.c4NC / this.lastPub).log10();
		
		let mult = diff < 3 ? 100 : diff < 5 ? 0.015 : 0.00014;
		this.pub = this.c4NC * mult;
		
		mult = diff < toBig(3) ? toBig(30) : diff < toBig(5) ? toBig(0.003) : toBig(0.00003);
		this.coast = this.c4NC * mult;
		
	}	

	buy() {
		
		if (buySkip()) return;

		if (theoryManager.theory.tau >= theoryManager.coast && enablePublications.level) return;

		this.c4.buy(-1); // autobuy	

		buyRatio(this.q2, 1.11);

		buyRatio(this.c3, 5);

		buyRatio(this.q1, 24);		

		while (true) {
			let q1Cost = upgradeCost(this.q1);
			let q1weight = this.q1.level % 10;
			if (
				q1Cost * 5 > this.q1.currency.value ||
				q1Cost * (6  + q1weight) > upgradeCost(this.q2) ||
				q1Cost * (15 + q1weight) > upgradeCost(this.c4)
			) {
				break;
			}
			this.q1.buy(1);
		}			
	}

	tick(elapsedTime, multiplier) {

		if (!theory.upgrades[this.id].level) return;

		buyMilestones();
							
		if (enablePublications.level && this.theory.tau > this.pub) {
			game.activeTheory.publish();
			return true;
		}

		this.buy();

		return false;
		
	}

}

// Utilizes T2MC strategy with fixed publication multipliers
class T2 {
	
	constructor() {
		
		this.id = 1;
		this.theory = game.activeTheory;
		
		this.upgrades = this.theory.upgrades;
		
		this.pub = 8000;
		this.qr1 = 4650;
		this.qr2 = 2900;
		this.qr3 = 2250;
		this.qr4 = 1150;
		
	}
			
	buy() {
		
		if (buySkip()) return;
		
		if (publicationMultiplier(this.theory) >= this.qr1 && enablePublications.level) return;
		this.upgrades[0].buy(-1);
		this.upgrades[4].buy(-1);
		
		if (publicationMultiplier(this.theory) >= this.qr2 && enablePublications.level) return;
		this.upgrades[1].buy(-1);
		this.upgrades[5].buy(-1);

		if (publicationMultiplier(this.theory) >= this.qr3 && enablePublications.level) return;
		this.upgrades[2].buy(-1);
		this.upgrades[6].buy(-1);
		
		if (publicationMultiplier(this.theory) >= this.qr4 && enablePublications.level) return;
		this.upgrades[3].buy(-1);
		this.upgrades[7].buy(-1);		
				
	}
		
	tick(elapsedTime, multiplier) {

		if (!theory.upgrades[this.id].level) return;

		buyMilestones();

		if (enablePublications.level && publicationMultiplier(this.theory) > this.pub) {
			game.activeTheory.publish();
			return true;
		}

		this.buy();	
		
		return false;
		
	}
	
}

// Utilizes slightly altered T3Play2 strategy with fixed publication multipliers
class T3 {
	
	constructor() {	
	
		this.id = 2;
		this.theory = game.activeTheory;
		
		this.upgrades = this.theory.upgrades;
		this.b1  = this.upgrades[ 0];
		this.b2  = this.upgrades[ 1];
		this.b3  = this.upgrades[ 2];
		this.c12 = this.upgrades[ 4];
		this.c22 = this.upgrades[ 7];
		this.c23 = this.upgrades[ 8];
		this.c31 = this.upgrades[ 9];
		this.c32 = this.upgrades[10];
		this.c33 = this.upgrades[11];

		this.phase1 = this.theory.tauPublished / 10;
		this.phase2 = 1.2;
		this.phase3 = 2.2;				
		this.pub 	= 2.5;	
		
	}

	buy() {
		
		if (buySkip()) return;
		
		this.c23.buy(-1); // autobuy
		let c23C = upgradeCost(this.c23);

		if (publicationMultiplier(this.theory) < this.phase2) {
						
			this.c32.buy(-1); // autobuy
			let c32C = upgradeCost(this.c32);
						
			buyMax(this.b2,  c32C /   5);
			
			buyMax(this.b3,  c23C /   8);

			buyMax(this.c12, c32C / 100);
			
			buyMax(this.c22, c32C / 2.5);
			
			buyMax(this.c33, c23C /  10);

			if (this.theory.currencies[0].value < this.phase1) {
				
				this.c31.buy(-1);
				
				buyMax(this.b1, upgradeCost(this.c31) / 8);
				
			}
		} else {
			
			this.c12.buy(-1); // autobuy
			let c12Ratio = upgradeCost(this.c12) / 8;
			
			if (publicationMultiplier(this.theory) < this.phase3) {
				
				buyMax(this.b2,  c12Ratio);
	
				buyMax(this.b3,  c23C / 8);
				
				buyMax(this.c22, c12Ratio);
				
				buyMax(this.c32, c12Ratio);
				
			} else {
				
				this.b2.buy(-1) // autobuy
				
				this.b3.buy(-1) // autobuy
				
			}
			
		}
		
	}
		
	tick(elapsedTime, multiplier) {

		if (!theory.upgrades[this.id].level) return;
		
		buyMilestones();

		if (enablePublications.level && publicationMultiplier(this.theory) > this.pub) {
			game.activeTheory.publish();
			return true;
		}

		this.buy();	
		
		return false;
		
	}
	
}

// Utilizes T4AI (based on T4C3C12rcv) strategy with calculated publication multipliers
class T4 {
	
	constructor() {	
	
		this.id = 3;
		this.theory = game.activeTheory;
		
		this.upgrades = this.theory.upgrades;
		this.c1 = this.upgrades[0];
		this.c2 = this.upgrades[1];
		this.c3 = this.upgrades[2];
		this.q1 = this.upgrades[6];
		this.q2 = this.upgrades[7];
		
		this.q2weight = 1 / (2 - Math.sqrt(2));
				
		this.setPub();
		
	}
			
	get getC1() {
		return Utils.getStepwisePowerSum(this.c1.level, 2, 10, 0).pow(this.theory.milestoneUpgrades[0].level * 0.05 + 1);	
	}
	
	get q() {
		return parseBigNumber(this.theory.tertiaryEquation.substring(2)).max(Number.MIN_VALUE);
	}
		
	c3Cost(rho) {
		if (rho < 2000)
			return toBig(0);
		return toBig(2.468).pow(((rho / 2000).log2() / Math.log2(2.468)).floor()) * 2000;
	}
	
	c3CostNext(rho) {
		if (rho < 2000)
			return toBig(2000);		
		return toBig(2.468).pow(((rho / 2000).log2() / Math.log2(2.468)).ceil()) * 2000;
	}
	
	q2Cost(rho) {
		if (rho < 10000)
			return toBig(0);		
		return toBig(1000).pow(((rho / 10000).log10() / 3).floor()) * 10000;
	}
	
	setPub() {
		
		let c3Step = 2.468;
		let lastPub = this.theory.tauPublished;
		let threshold = this.q2weight * toBig(1000 / 2.468 ** 8);
		let c3Near;
		let c3Last = this.c3Cost(lastPub);
		if (lastPub / c3Last > this.q2weight)
		  c3Last *= 2.468;
		let c3Amount;
		
		let q2Last = this.q2Cost(lastPub);
		while (true) {
		  c3Near = this.c3CostNext(q2Last);
		  if (c3Near > q2Last * threshold && c3Near < q2Last * this.q2weight) {
			c3Amount = ((c3Last / c3Near).log2() / Math.log2(2.468)).round();
			if (
			  c3Amount ==  0 || c3Amount == 10 || c3Amount == 11 || 
			  c3Amount == 19 || c3Amount == 20 || c3Amount == 28 ||
			  c3Amount == 29 || c3Amount == 37 || c3Amount >= 38
			) {
			  break;
			}
		  }
		  q2Last /= 1000;
		}

		let block = 5;     
		let nc3Near = c3Near * 2.468 ** 38;
		let q2Next  = q2Last *    10 ** 15;
		if (nc3Near > q2Next * threshold && nc3Near < q2Next * this.q2weight)
		  block = 4;
	 
		this.pub = c3Near; 
		if (block == 5) {
		  if (c3Amount == 0)
			this.pub *= 2.468 ** 10;
		  else if (c3Amount <= 10)
			this.pub *= 2.468 ** 19;
		  else if (c3Amount <= 19) 
			this.pub *= 2.468 ** 28;
		  else if (c3Amount <= 28)
			this.pub *= 2.468 ** 37;
		  else 
			this.pub *= 2.468 ** 46;
		} 
		else {
		  if (c3Amount == 0)
			this.pub *= 2.468 ** 10;
		  else if (c3Amount <= 10)
			this.pub *= 2.468 ** 20;
		  else if (c3Amount <= 20) 
			this.pub *= 2.468 ** 29;
		  else
			this.pub *= 2.468 ** 38;
		}

		if (this.pub < lastPub) { // in case the calculation goes wrong
		  this.pub = lastPub * 1000;
		}
		this.pub *= 1.3;

		this.coast = this.pub / 2.468;	
		
	}
	
	buy() {
		
		if (buySkip()) return;
		
		if (this.theory.tau >= this.coast && enablePublications.level) return;
		
		if (this.theory.currencies[0].value == 0)
			this.c1.buy(1);
						
		buyMax(this.c2, this.theory.currencies[0].value * toBig(2).pow(this.c2.level) * this.getC1 / (this.q * toBig(2).pow(this.c3.level)));
		
		buyMax(this.c1, upgradeCost(this.c2) / 10);
				
		buyMax(this.c3, this.theory.currencies[0].value * this.q.max(1) * toBig(2).pow(this.c3.level) / (toBig(2).pow(this.c2.level) * this.getC1));
				
		buyMax(this.q2, upgradeCost(this.c3) / this.q2weight);
		
		buyMax(this.q1, upgradeCost(this.c3).min(upgradeCost(this.q2)) / 10);
				
	}
	
	tick(elapsedTime, multiplier) {

		if (!theory.upgrades[this.id].level) return;

		buyMilestones();

		if (enablePublications.level && this.theory.tau >= this.pub) {
			game.activeTheory.publish();
			return true;
		}

		this.buy();
		
		return false;
		
	}
	
}

// Utilizes T5AI2 strategy with calculated publication multipliers
class T5 {
	
	constructor() {	
	
		this.id = 4;
		this.theory = game.activeTheory;
		
		this.upgrades = this.theory.upgrades;
		this.q1 = this.upgrades[0];
		this.q2 = this.upgrades[1];
		this.c1 = this.upgrades[2];
		this.c2 = this.upgrades[3];
		this.c3 = this.upgrades[4];
						
		this.setPub();
		
	}
			
	get q() {
		return parseBigNumber(this.theory.tertiaryEquation.substring(2)).max(Number.MIN_VALUE);
	}
	
	get getC1() {
		return Utils.getStepwisePowerSum(this.c1.level, 2, 10, 1);
	}
	
	get getC2() {
		return toBig(2).pow(this.c2.level);
	}
	
	get getC3() {
		return toBig(2).pow(this.c3.level * (1 + 0.05 * this.theory.milestoneUpgrades[2].level));
	}

	predictQ(multiplier) {
		
		let vc2 = this.getC2;
		let vc3 = this.getC3;
		let q = this.q;
		let dqPred = (this.getC1 / vc2 * q * (vc3 - q / vc2)) * multiplier;
		
		let qPred = q + dqPred.max(0);
		qPred = qPred.min(vc2 * vc3);
		return qPred;
		
	}
	
	c3CostNext(rho) {
		if (rho < 1000)
			return toBig(1000);		
		return toBig(88550700).pow(((rho / 1000).log2() / Math.log2(88550700)).ceil()) * 1000;
	}
	
	q2Cost(rho) {
		if (rho < 15)
			return toBig(0);
		return toBig(64).pow(((rho / 15).log2() / 6).floor()) * 15;
	}
	
	setPub() {
		
		let lastPub = this.theory.tauPublished;		
		let c3Next = this.c3CostNext(lastPub);
		let q2Near = this.q2Cost(c3Next);  

		let ratio = 9.5;

		while (c3Next / q2Near >= ratio) {
			c3Next *= 88550700;
			q2Near = this.q2Cost(c3Next);
		}

		let counter = 1;
		let c3Prev = c3Next / 88550700;
		let q2NearP = this.q2Cost(c3Prev);       
		while (c3Prev / q2NearP >= ratio && c3Prev > 0) {
			c3Prev /= 88550700;
			q2NearP = this.q2Cost(c3Prev);
			counter++;
		}

		let target = 105;

		let step = (c3Next / (ratio * c3Prev * target)).pow(1 / (counter * 3 - 1));
		this.pub = c3Prev * target;
		while (lastPub * 64 >= this.pub) {
			this.pub *= step;
		}
		
		if (this.pub > c3Next) {
			this.pub = c3Next * target;
		}		
		
		this.coast = this.pub / 2;
		
	}
		
	buy(multiplier) {
		
		if (buySkip()) return;
		
		if (this.theory.tau >= this.coast && enablePublications.level) return;

		if (this.theory.currencies[0].value == 0)
			this.q1.buy(1);

		this.c3.buy(-1); // autobuy
		let vc3 = this.getC3;

		let c2worth = this.predictQ(multiplier) >= vc3 * this.getC2 * 2 / 3;
		while (c2worth && upgradeCost(this.c2) <= this.theory.currencies[0].value) {
			this.c2.buy(1);
			c2worth = this.predictQ(multiplier) >= vc3 * this.getC2 * 2 / 3;
		}

		if (!c2worth)
			this.c1.buy(-1);

		buyMax(this.q2, upgradeCost(this.c3));

		if (this.theory.tau >= this.pub / 10 ** 0.5) return; // no q1 buying near pub

		let minCost = upgradeCost(this.c3).min(upgradeCost(this.q2).min(upgradeCost(this.c2)));
		buyMax(this.q1, minCost / 10);

		while (true) {
			let q1weight = (10 + this.q1.level % 10) ** (1 / 1.4);
			let q1Prev = this.q1.level;
			buyMax(this.q1, minCost / 10);
			if (q1Prev == this.q1.level)
				break;
		}

	}
	
	tick(elapsedTime, multiplier) {

		if (!theory.upgrades[this.id].level) return;

		buyMilestones();

		if (enablePublications.level && this.theory.tau >= this.pub) {
			game.activeTheory.publish();
			return true;
		}

		this.buy(multiplier);
		
		return false;
		
	}

}

// Utilizes T6AI strategy with calculated publication multipliers
class T6 {
	
	constructor() {
		
		this.id = 5;
		this.theory = game.activeTheory;
		
		this.upgrades = this.theory.upgrades;
		this.q1 = this.upgrades[0];
		this.q2 = this.upgrades[1];
		this.r1 = this.upgrades[2];
		this.r2 = this.upgrades[3];
		this.c1 = this.upgrades[4];
		this.c2 = this.upgrades[5];		
		this.c5 = this.upgrades[8];
						
		this.setPub();
		
	}
	
	get getC1() {
		return Utils.getStepwisePowerSum(this.c1.level, 2, 10, 1).pow(1 + this.theory.milestoneUpgrades[3].level * 0.05);
	}
	
	get getC2() {
		return toBig(2).pow(this.c2.level);
	}
		
	get getMaxC5() {
		let rho = this.theory.currencies[0].value;
		if (rho < 15)
			return 0;
		return toBig(2).pow((rho / 15).log2() / Math.log2(3.9));
	}
	
	get r() {
		let string = this.theory.tertiaryEquation;
		let begin  = string.indexOf("r=");
		let end    = string.indexOf(",", begin);
		return parseBigNumber(string.substring(begin + 2, end)).max(Number.MIN_VALUE);
	}
		
	c5Cost(rho) {
		if (rho < 15)
			return toBig(0);
		return toBig(3.9).pow(((rho / 15).log2() / Math.log2(3.9)).floor()) * 15;
	}
		
	setPub() {
		
		let target;
		let lastPub = this.theory.tauPublished.log10().toNumber();
		
		if (lastPub % 10 < 3) 
		  target = Math.floor(lastPub / 10) * 10 + 7 + Math.log10(3); 
		else if (lastPub % 10 < 6)
		  target = Math.floor(lastPub / 10) * 10 + 11 + Math.log10(5); 
		else
		  target = Math.floor(lastPub / 10) * 10 + 14;
	  
		let c5Near = this.c5Cost(toBig(10).pow(target));
		this.pub   = c5Near * 4.2; 
		this.coast = this.pub / 4;
		
	}
	
	buy() {
		
		if (buySkip()) return;
		
		if (this.theory.tau >= this.coast && enablePublications.level) return;
		
		buyRatio(this.r2, 10);
		
		buyRatio(this.q2, 10);
		
		buyRatio(this.r1, 100);
		
		buyRatio(this.q1, 100);
		
		buyRatio(this.c5, 100);
		
		buyRatio(this.c2, 10000);
		
		buyRatio(this.c1, 100000);
		
		let rHalf = this.r / 2;
		
		for (let n = 0; n < 50; n++) { //limited with 50 purchases per tick
			
			let k = (this.getMaxC5 * rHalf) / (this.getC1 * this.getC2);
			let c1WithWeight = upgradeCost(this.c1) * (10 + (this.r1.level % 10)) ** (1 / 1.05);
			let c2Cost = upgradeCost(this.c2);
			let c2weight = (c2Cost * 2 ** 0.5 > upgradeCost(this.r2).min(upgradeCost(this.q2))) ? 2 ** 0.5 : 1;
			let veryBigNumber = parseBigNumber("ee999999");
			
			let costs = [
				upgradeCost(this.q1) * (3.5 + (this.q1.level % 10) ** 0.6),
				upgradeCost(this.q2),
				upgradeCost(this.r1) * (5 + (this.r1.level % 10)) ** (1 / 1.1),
				upgradeCost(this.r2),
				c1WithWeight < c2Cost ? c1WithWeight : veryBigNumber,
				c2Cost * k.max(1) * c2weight,
				veryBigNumber, // does not buy c3
				veryBigNumber, // does not buy c4
				upgradeCost(this.c5) / k.max(Number.MIN_VALUE).min(1)
			];
			let minCost = [veryBigNumber, null];
			for (let i = 0; i < 9; i++)
				if (costs[i] < minCost[0])
					minCost = [costs[i], i];
			if (minCost[1] != null && upgradeCost(this.upgrades[minCost[1]]) <= this.theory.currencies[0].value)
				game.activeTheory.upgrades[minCost[1]].buy(1);
			else break;
		}
				
	}
	
	tick(elapsedTime, multiplier) {

		if (!theory.upgrades[this.id].level) return;

		buyMilestones();

		if (enablePublications.level && this.theory.tau >= this.pub) {
			game.activeTheory.publish();
			return true;
		}

		this.buy();
		
		return false;
		
	}	
	
}

// Utilizes T7PlaySpqcey with cyclic corrected multipliers
class T7 {
	
	constructor() {
		
		this.id = 6;
		this.theory = game.activeTheory;
		
		this.upgrades = this.theory.upgrades;
		this.q1 = this.upgrades[0];
		this.c3 = this.upgrades[3];	
		this.c4 = this.upgrades[4];
		this.c5 = this.upgrades[5];
		this.c6 = this.upgrades[6];
						
		this.setPub();
		
	}
	
	c6CostNext(rho) {
		if (rho < 100)
			return toBig(100);
		return toBig(2.81).pow(((rho / 100).log2() / Math.log2(2.81)).ceil()) * 100;
	}
	
	setPub() {
		
		let lastPub = this.theory.tauPublished;
		let c6Next = this.c6CostNext(lastPub);
		
		c6Next *= 2.81 ** 5;
		this.pub = c6Next * 1.01;
		
		if (this.pub / lastPub < 491) // correction
			this.pub *= 2.81;
			
		this.coast = this.pub / 2;	
		
	}
	
	buy() {
		
		if (buySkip()) return;
		
		if (this.theory.tau >= this.coast && enablePublications.level) return;
		
		this.c6.buy(-1); // autobuy
		
		buyMax(this.c5, upgradeCost(this.c6) / 4);
		
		buyMax(this.c4, upgradeCost(this.c6) / 10);
		
		buyMax(this.c3, upgradeCost(this.c6) / 10);

		buyMax(this.q1, upgradeCost(this.c6) / 4);
		
	}
	
	tick(elapsedTime, multiplier) {

		if (!theory.upgrades[this.id].level) return;

		buyMilestones();

		if (enablePublications.level && this.theory.tau >= this.pub) {
			game.activeTheory.publish();
			return true;
		}

		this.buy();
		
		return false;
		
	}	
	
}

// Utilizes T8PlaySolarswap strategy with calculated publication multipliers
class T8 {
	
	constructor() {
		
		this.id = 7;
		this.theory = game.activeTheory;
		
		this.upgrades = this.theory.upgrades;
		this.c1 = this.upgrades[0];
		this.c2 = this.upgrades[1];
		this.c3 = this.upgrades[2];	
		this.c4 = this.upgrades[3];
		this.c5 = this.upgrades[4];
						
		this.setPub();
		
		this.resetAttractor();
		
	}
	
	c2CostNext(rho) {
		if (rho < 20)
			return toBig(20);
		return toBig(64).pow(((rho / 20).log2() / Math.log2(64)).ceil()) * 20;
	}
	
	c4Cost(rho) {
		if (rho < 100)
			return toBig(0);
		return toBig(5 ** 1.15).pow(((rho / 100).log2() / Math.log2(5 ** 1.15)).floor()) * 100;
	}
		
	setPub() {
		
		let lastPub = this.theory.tauPublished;
		let c4Step = 5 ** 1.15;
		let c4Last = this.c4Cost(lastPub); 
		let c2NearC4 = this.c2CostNext(c4Last);  

		let coef = c2NearC4 / c4Last > 7 ? 3 : 4;
		this.pub = c4Last * c4Step ** coef * 1.1;
		this.coast = this.pub / 5;		
		
	}
	
	buy() {
		
		if (buySkip()) return;
		
		if (this.theory.tau >= this.coast && enablePublications.level) return;
		
		let minCost = upgradeCost(this.c2).min(upgradeCost(this.c4));
		
		buyMax(this.c5, minCost / 2.5);
		
		this.c4.buy(-1); // autobuy
		
		buyMax(this.c3, minCost / 4);
		
		this.c2.buy(-1); // autobuy
		
		let c1weight = (10 + this.c1.level % 10) ** (1 / 1.2);
		buyMax(this.c1, minCost / c1weight);
		
	}
	
	resetAttractor() {
		this.timer = 0;
		game.activeTheory.milestoneUpgrades[0].refund(-1);
		game.activeTheory.milestoneUpgrades[0].buy(-1);
	}
	
	tick(elapsedTime, multiplier) {

		if (!theory.upgrades[this.id].level) return;

		buyMilestones();

		if (enablePublications.level && this.theory.tau >= this.pub) {
			game.activeTheory.publish();
			return true;
		}

		this.timer++;
		if (this.timer >= 335 && enableMSPurchase.level)
			this.resetAttractor();

		this.buy();
		
		return false;
		
	}	
	
}

class UIutils {
	
	static createLatexButton(header, variable, id = -1) {
		
		let labelLeft = ui.createLatexLabel({
			text: header + ": ",
			horizontalTextAlignment: TextAlignment.START,
			verticalTextAlignment: TextAlignment.CENTER,
			textColor: variable.level == 1 ? Color.TEXT : Color.TEXT_MEDIUM,
			column: 0
		});
		
		let labelRight = ui.createLabel({
			text: variable.level == 1 ? "✓" : "✗",
			horizontalTextAlignment: TextAlignment.CENTER,
			verticalTextAlignment: TextAlignment.START,
			textColor: variable.level == 1 ? Color.TEXT : Color.TEXT_MEDIUM,
			fontSize: 28
		});
		
		let frameRight = ui.createFrame({
			padding: Thickness(0, 0, 0, 5),
			verticalOptions: LayoutOptions.CENTER,
			content: labelRight,
			borderColor: Color.TRANSPARENT,
			column: 1
		});
		
		let grid = ui.createGrid({
			columnDefinitions: ["1*", 25],
			children: [labelLeft, frameRight]
		});
		
		let buttonFrame = ui.createFrame({
			padding: Thickness(10, 2, 10, 2),
			verticalOptions: LayoutOptions.CENTER,
			content: grid,
			borderColor: variable.level == 1 ? Color.MINIGAME_TILE_BORDER : Color.BORDER
		});
		
		buttonFrame.onTouched = (touchEvent) => {
			if (touchEvent.type == TouchType.SHORTPRESS_RELEASED || touchEvent.type == TouchType.LONGPRESS_RELEASED) {
				
				variable.level = (variable.level + 1) % 2;
				if (id >= 0 && game.theories[id].tau.log10() < requirements[id]) {
					variable.level = 0;
					timer = 5;
					primaryEquation = "Theory\\; " + (id + 1) + "\\; requires\\; " + requirements[id] + "\\; " + game.theories[id].latexSymbol;
					theory.invalidatePrimaryEquation();
				}
				
				labelRight.text = variable.level == 1 ? "✓" : "✗";
				labelLeft.textColor = variable.level == 1 ? Color.TEXT : Color.TEXT_MEDIUM;
				labelRight.textColor = variable.level == 1 ? Color.TEXT : Color.TEXT_MEDIUM;
				buttonFrame.borderColor = variable.level == 1 ? Color.MINIGAME_TILE_BORDER : Color.BORDER;
				
			}
		}
		
		return buttonFrame;
		
	}
	
	static createTheorySwitchButton() {
		
		let label = ui.createLatexLabel({
			text: "Switch the theory now",
			horizontalTextAlignment: TextAlignment.START,
			verticalTextAlignment: TextAlignment.CENTER,
			textColor: Color.TEXT
		});
		
		let buttonFrame = ui.createFrame({
			padding: Thickness(10, 2, 10, 2),
			verticalOptions: LayoutOptions.CENTER,
			content: label,
			borderColor: Color.MINIGAME_TILE_BORDER,
			heightRequest: 50,
			minimumHeightRequest: 50
		});
		
		buttonFrame.onTouched = (touchEvent) => {
			if (touchEvent.type == TouchType.SHORTPRESS_RELEASED || touchEvent.type == TouchType.LONGPRESS_RELEASED) {
				buttonFrame.borderColor = Color.MINIGAME_TILE_BORDER;
				switchTheory(true);
			}
			else if (touchEvent.type == TouchType.PRESSED || touchEvent.type == TouchType.LONGPRESS) {
				buttonFrame.borderColor = Color.BORDER;
			}
		}
		
		return buttonFrame;
		
	}
	
}

var getUpgradeListDelegate = () => {
		
	let performTheorySwitchButton = UIutils.createTheorySwitchButton();
		
	let enableVariablePurchaseButton = UIutils.createLatexButton("Variable purchase", enableVariablePurchase);
	enableVariablePurchaseButton.row = 0;
	enableVariablePurchaseButton.column = 0;
	
	let enableMSPurchaseButton = UIutils.createLatexButton("Milestone purchase", enableMSPurchase);
	enableMSPurchaseButton.row = 0;
	enableMSPurchaseButton.column = 1;
	
	let enablePublicationsButton = UIutils.createLatexButton("Publications", enablePublications);
	enablePublicationsButton.row = 1;
	enablePublicationsButton.column = 0;
	
	let enableTheorySwitchButton = UIutils.createLatexButton("Theory switch", enableTheorySwitch);
	enableTheorySwitchButton.row = 1;
	enableTheorySwitchButton.column = 1;

    let topGrid = ui.createGrid({
        columnDefinitions: ["1*", "1*"],
		columnSpacing: 3,
		rowDefinitions: [60, 60],
		rowSpacing: 3,
		children: [
			enableVariablePurchaseButton, 
			enableMSPurchaseButton, 
			enablePublicationsButton,
			enableTheorySwitchButton
		]
    });
	
	buttonArray = [];
	for (let i = 0; i < 8; i++) {
		let newButton = UIutils.createLatexButton("Theory " + (i + 1), theory.upgrades[i], i);
		newButton.row = i % 4;
		newButton.column = Math.floor(i / 4);
		buttonArray.push(newButton);	
	}
	
    let bottomGrid = ui.createGrid({
        columnDefinitions: ["1*", "1*"],
		columnSpacing: 3,
		rowDefinitions: [60, 60, 60, 60],
		rowSpacing: 3,
		children: buttonArray
    });
	
	let scrollView = ui.createScrollView({
		content: bottomGrid
	})
	
	let separator = ui.createBox({
		heightRequest: 2
	});
	
    let stack = ui.createStackLayout({
		padding: Thickness(0, 3, 0, 0),
		spacing: 3,
        children: [
			performTheorySwitchButton, topGrid, separator, scrollView
        ]
    });    
		
	return stack;
	
}

/*var getEquationDelegate = () => {
	
	mainLabel = ui.createLatexLabel();
	
	let layout = ui.createStackLayout({
		horizontalOptions: LayoutOptions.CENTER,
		verticalOptions: LayoutOptions.CENTER,
		children: [mainLabel]
	})
	
	return layout;
	
}*/
 
var	isCurrencyVisible = index => false;

var getQuaternaryEntries = () => {

	let R9 = (game.sigmaTotal / 20) ** game.researchUpgrades[8].level;
	let decay = [
		30.1935671759384,
		37.4972532637665,
		30.7608639120181,
		44.9544911685781,
		39.2687021300084,
		102.119195226465,
		26.7695950304505,
		17.6476778516314
	];
	let timeMult = [1, 10.2, 1, 1.5, 1, 3, 1, 1];
	let base = [
		2.59,
		11.4,
		1.34,
		2.85,
		44.3,
		4.52,
		2.15,
		4.84
	];
		
	let tau;
	let tauH;	
		
	let iMax = 0;
	let max = 0;
	for (let i = 0; i < 8; i++) {
		
		tau = game.theories[i].tauPublished.log10();
		
		if (tau < requirements[i] || !theory.upgrades[i].level)
			continue;
		
		tauH = base[i] * R9 ** (1 / timeMult[i]) / 2 ** ((tau - requirements[i]) / decay[i]);
		if (tauH > max) {
			iMax = i;
			max = tauH;
		}	
		quaternaryEntries[i].value = tauH;
		
	}
	
	// T4 low tau check
	decay = 27.0085302950228;
	base = 1.51;
	timeMult = 1;
	
	tau = game.theories[3].tauPublished.log10();
	tauH = base * R9 ** (1 / timeMult) / 2 ** ((tau - requirements[3]) / decay);
	if (tauH > max) {
		iMax = 3;
		max = tauH;
	}
	quaternaryEntries[3].value = Math.max(tauH, quaternaryEntries[3].value);
	
	// T6 low tau check
	decay = 70.0732254255212;
	base = 8.8;
	timeMult = 2;
	
	tau = game.theories[5].tauPublished.log10();
	tauH = base * R9 ** (1 / timeMult) / 2 ** ((tau - requirements[5]) / decay);
	if (tauH > max) {
		iMax = 5;
		max = tauH;
	}
	quaternaryEntries[5].value = Math.max(tauH, quaternaryEntries[5].value);

    return quaternaryEntries;
	
}
theory.invalidateQuaternaryValues();

var tick = (elapsedTime, multiplier) => {

	if (game.activeTheory === null) return;
	if (game.activeTheory.id !== theoryManager?.id || game.activeTheory.upgrades[0].level == 0)
		refreshTheoryManager();
	if (theoryManager.tick(elapsedTime, multiplier))
		switchTheory();
	
	timer -= Math.max(0, elapsedTime);
	if (timer <= 0) {
		primaryEquation = "";
		theory.invalidatePrimaryEquation();
	}
	
}

// creating theory settings
{
	
	fictitiousCurrency = theory.createCurrency();
	
	for (let i = 0; i < 8; i++)
		theory.createUpgrade(i, fictitiousCurrency, new FreeCost);
	
	enableVariablePurchase = theory.createUpgrade(8, fictitiousCurrency, new FreeCost);
	
	enableMSPurchase = theory.createUpgrade(9, fictitiousCurrency, new FreeCost);
	
	enablePublications = theory.createUpgrade(10, fictitiousCurrency, new FreeCost);
	
	enableTheorySwitch = theory.createUpgrade(11, fictitiousCurrency, new FreeCost);
		
}

refreshTheoryManager(); // creating theory manager on initialization
